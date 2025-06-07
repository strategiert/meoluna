const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://izotecavlccunsbssxho.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3RlY2F2bGNjdW5zYnNzeGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwOTUxNSwiZXhwIjoyMDY0ODg1NTE1fQ.Ogpq7FWUgt4E5ima9Avd9ByRMWcTJvgpCXyNR4YMDRQ'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🚀 Setting up Meoluna database schema...')
  
  try {
    // Enable UUID extension
    console.log('📦 Enabling UUID extension...')
    const { error: extensionError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    })
    
    if (extensionError) {
      console.log('⚠️ Extension might already exist:', extensionError.message)
    }

    // Create worlds table
    console.log('🌍 Creating meoluna_worlds table...')
    const { error: worldsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS meoluna_worlds (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          subdomain TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          subject TEXT NOT NULL,
          grade_level INTEGER,
          theme_config JSONB NOT NULL,
          created_by UUID REFERENCES auth.users(id),
          is_public BOOLEAN DEFAULT true,
          play_count INTEGER DEFAULT 0,
          avg_rating DECIMAL(2,1) DEFAULT 0.0,
          saved_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (worldsError) console.error('❌ Worlds table error:', worldsError)
    else console.log('✅ Worlds table created')

    // Create content table
    console.log('📚 Creating meoluna_content table...')
    const { error: contentError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS meoluna_content (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          world_id UUID REFERENCES meoluna_worlds(id) ON DELETE CASCADE NOT NULL,
          content_type TEXT NOT NULL,
          content_data JSONB NOT NULL,
          difficulty_level INTEGER DEFAULT 1,
          order_index INTEGER NOT NULL,
          title TEXT,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (contentError) console.error('❌ Content table error:', contentError)
    else console.log('✅ Content table created')

    // Create sessions table
    console.log('👥 Creating meoluna_sessions table...')
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS meoluna_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          world_id UUID REFERENCES meoluna_worlds(id) ON DELETE CASCADE NOT NULL,
          anonymous_id TEXT NOT NULL,
          started_at TIMESTAMPTZ DEFAULT NOW(),
          last_active TIMESTAMPTZ DEFAULT NOW(),
          completed BOOLEAN DEFAULT FALSE,
          total_score DECIMAL(3,2) DEFAULT 0.00
        );
      `
    })
    
    if (sessionsError) console.error('❌ Sessions table error:', sessionsError)
    else console.log('✅ Sessions table created')

    // Test the database
    console.log('🧪 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('meoluna_worlds')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database test failed:', testError)
    } else {
      console.log('✅ Database connection successful!')
    }

    // Insert a test world
    console.log('🌙 Creating test world...')
    const { data: testWorld, error: insertError } = await supabase
      .from('meoluna_worlds')
      .insert({
        subdomain: 'test-world',
        title: 'Test Lernwelt',
        subject: 'biology',
        grade_level: 8,
        theme_config: {
          colors: {
            primary: '#059669',
            secondary: '#10b981',
            accent: '#34d399',
            background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
            surface: '#ffffff'
          }
        },
        is_public: true
      })
      .select()
    
    if (insertError) {
      console.error('❌ Test world creation failed:', insertError)
    } else {
      console.log('✅ Test world created:', testWorld)
    }
    
    console.log('🎉 Meoluna database setup completed!')
    
  } catch (error) {
    console.error('💥 Setup failed:', error)
  }
}

setupDatabase()