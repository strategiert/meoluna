import { NextResponse } from 'next/server'
import { createAdminClient } from '@meoluna/database'

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    const supabase = createAdminClient()
    
    // Test 1: Check if we can connect
    const { data: connectionTest, error: connectionError } = await supabase
      .from('meoluna_worlds')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message,
        suggestion: 'Check if Supabase tables are created and environment variables are correct'
      }, { status: 500 })
    }
    
    // Test 2: Count existing worlds
    const { count: worldCount, error: countError } = await supabase
      .from('meoluna_worlds')
      .select('*', { count: 'exact', head: true })
    
    // Test 3: Check if themes table exists and has default data
    const { data: themes, error: themesError } = await supabase
      .from('meoluna_themes')
      .select('name, subject')
      .limit(5)
    
    const results = {
      connection: '✅ Connected successfully',
      worldsCount: worldCount || 0,
      themesAvailable: themes?.length || 0,
      themesList: themes?.map(t => `${t.name} (${t.subject})`) || [],
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Database test results:', results)
    
    return NextResponse.json({
      success: true,
      message: '🎉 Database is ready for Meoluna!',
      results,
      nextSteps: [
        '1. Create a new learning world',
        '2. Check if it appears in the database',
        '3. Visit the generated subdomain'
      ]
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        checkEnvVars: 'Verify SUPABASE_SERVICE_ROLE_KEY is correct',
        checkTables: 'Run the SQL schema in Supabase SQL Editor',
        checkUrl: 'Verify NEXT_PUBLIC_SUPABASE_URL is correct'
      }
    }, { status: 500 })
  }
}