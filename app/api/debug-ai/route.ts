import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const rawOpenaiKey = process.env.OPENAI_API_KEY
    const cleanedKey = rawOpenaiKey?.replace(/\s+/g, '').trim()
    const hasKey = !!cleanedKey
    const keyPrefix = cleanedKey?.substring(0, 10) + '...'
    
    // Test OpenAI connection
    let connectionTest = 'Not tested'
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${cleanedKey}`,
          'Content-Type': 'application/json'
        }
      })
      connectionTest = response.ok ? 'Success' : `Failed: ${response.status}`
    } catch (error) {
      connectionTest = `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
    
    return NextResponse.json({
      environment: process.env.NODE_ENV || 'unknown',
      hasOpenAIKey: hasKey,
      keyPrefix: hasKey ? keyPrefix : 'No key',
      connectionTest,
      keyHasNewlines: rawOpenaiKey?.includes('\n') || false,
      keyLength: cleanedKey?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}