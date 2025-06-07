const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://izotecavlccunsbssxho.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3RlY2F2bGNjdW5zYnNzeGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwOTUxNSwiZXhwIjoyMDY0ODg1NTE1fQ.Ogpq7FWUgt4E5ima9Avd9ByRMWcTJvgpCXyNR4YMDRQ'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabase() {
  console.log('🧪 Testing Supabase connection with correct key...')
  
  try {
    // Test basic connection first
    console.log('📡 Testing basic connection...')
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('⚠️ Auth session error (normal):', error.message)
    } else {
      console.log('✅ Service key is valid!')
    }

    // Check if tables exist
    console.log('🔍 Checking existing tables...')
    const { data: tables, error: tablesError } = await supabase.rpc('get_schema_tables')
    
    if (tablesError) {
      console.log('⚠️ Cannot list tables (normal):', tablesError.message)
    }

    // Try to query meoluna_worlds table
    console.log('🌍 Testing meoluna_worlds table...')
    const { data: worlds, error: worldsError } = await supabase
      .from('meoluna_worlds')
      .select('count')
      .limit(1)
    
    if (worldsError) {
      console.log('❌ Table does not exist yet:', worldsError.message)
      console.log('\n📋 Please manually run this SQL in Supabase Dashboard:')
      console.log('🔗 https://izotecavlccunsbssxho.supabase.co/sql')
      console.log('\n' + '='.repeat(50))
      console.log(getCompleteSchema())
      console.log('='.repeat(50))
    } else {
      console.log('✅ meoluna_worlds table exists!')
      console.log('📊 Current worlds count:', worlds)
      
      // Test creating a world
      console.log('🌙 Testing world creation...')
      const { data: testWorld, error: createError } = await supabase
        .from('meoluna_worlds')
        .insert({
          subdomain: 'api-test-world',
          title: 'API Test Lernwelt',
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
          }
        })
        .select()
      
      if (createError) {
        console.log('❌ World creation failed:', createError)
      } else {
        console.log('✅ Test world created successfully:', testWorld)
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

function getCompleteSchema() {
  return `-- Meoluna Database Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Meoluna Worlds
CREATE TABLE meoluna_worlds (
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

-- Meoluna Content
CREATE TABLE meoluna_content (
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

-- Meoluna Sessions
CREATE TABLE meoluna_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  world_id UUID REFERENCES meoluna_worlds(id) ON DELETE CASCADE NOT NULL,
  anonymous_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  total_score DECIMAL(3,2) DEFAULT 0.00
);

-- Meoluna Progress
CREATE TABLE meoluna_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES meoluna_sessions(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES meoluna_content(id) ON DELETE CASCADE NOT NULL,
  interaction_data JSONB NOT NULL,
  score DECIMAL(3,2),
  completed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 1,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE meoluna_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_progress ENABLE ROW LEVEL SECURITY;

-- Policies for public access to worlds
CREATE POLICY "Public worlds are viewable by everyone" 
  ON meoluna_worlds FOR SELECT 
  USING (is_public = true);

-- Policies for content
CREATE POLICY "Content is viewable if world is accessible"
  ON meoluna_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meoluna_worlds 
      WHERE id = world_id 
      AND is_public = true
    )
  );

-- Policies for sessions (anonymous access)
CREATE POLICY "Anyone can create sessions"
  ON meoluna_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sessions are viewable for analytics"
  ON meoluna_sessions FOR SELECT
  USING (true);

-- Policies for progress
CREATE POLICY "Anyone can track progress"
  ON meoluna_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Progress is viewable for analytics"
  ON meoluna_progress FOR SELECT
  USING (true);`
}

testDatabase()