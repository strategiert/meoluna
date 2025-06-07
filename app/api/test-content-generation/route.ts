import { NextRequest, NextResponse } from 'next/server'
import { MeolunaAI } from '@meoluna/ai-core'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting isolated content generation test...')
    
    const body = await request.json()
    const { worldConcept } = body

    if (!worldConcept) {
      return NextResponse.json({
        success: false,
        error: 'Missing worldConcept in request body'
      }, { status: 400 })
    }

    // Check if OpenAI key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    console.log('🔑 OpenAI key present:', !!process.env.OPENAI_API_KEY)
    console.log('🎯 Testing with world concept:', worldConcept.title)

    // Initialize AI provider
    const aiProvider = MeolunaAI.fromEnv('openai')

    // Test content generation with detailed logging
    console.log('🧠 Calling generateContent with concept:', JSON.stringify(worldConcept, null, 2))
    
    const startTime = Date.now()
    const content = await aiProvider.generateContent(worldConcept)
    const endTime = Date.now()
    
    console.log(`⏱️ Content generation took ${endTime - startTime}ms`)
    console.log('✅ Generated content items:', content.length)
    console.log('📝 Content summary:', content.map(item => ({
      type: item.type,
      title: item.title,
      hasData: !!item.data,
      dataKeys: item.data ? Object.keys(item.data) : []
    })))

    // Validate content structure
    const validationErrors: string[] = []
    content.forEach((item, index) => {
      if (!item.type) validationErrors.push(`Item ${index}: Missing type`)
      if (!item.title) validationErrors.push(`Item ${index}: Missing title`)
      if (item.type === 'quiz' && (!item.data?.questions || !Array.isArray(item.data.questions))) {
        validationErrors.push(`Item ${index}: Quiz missing questions array`)
      }
    })

    if (validationErrors.length > 0) {
      console.warn('⚠️ Validation warnings:', validationErrors)
    }

    return NextResponse.json({
      success: true,
      content: content,
      metadata: {
        itemCount: content.length,
        generationTime: endTime - startTime,
        validationErrors: validationErrors,
        timestamp: new Date().toISOString()
      },
      debug: {
        worldConcept: worldConcept,
        contentTypes: content.map(item => item.type),
        hasQuestions: content.some(item => item.type === 'quiz' && item.data?.questions)
      }
    })

  } catch (error) {
    console.error('❌ Content generation test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Content generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 })
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}