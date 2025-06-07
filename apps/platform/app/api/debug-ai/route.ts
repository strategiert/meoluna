import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const openaiKey = process.env.OPENAI_API_KEY
    const hasKey = !!openaiKey
    const keyPrefix = openaiKey?.substring(0, 10) + '...'
    
    // Test OpenAI connection
    let connectionTest = 'Not tested'
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
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
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}