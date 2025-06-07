import { NextRequest, NextResponse } from 'next/server'
import { MeolunaAI } from '@meoluna/ai-core'
import { z } from 'zod'

const RequestSchema = z.object({
  content: z.string().min(10, 'Klassenarbeit-Inhalt muss mindestens 10 Zeichen haben'),
  subject: z.string().min(1, 'Fach ist erforderlich'),
  gradeLevel: z.number().min(1).max(13).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json()
    const { content, subject, gradeLevel } = RequestSchema.parse(body)

    // Check if OpenAI key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('🔑 OpenAI key present:', !!process.env.OPENAI_API_KEY)
    console.log('🔑 Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 7))

    // Initialize AI provider
    const aiProvider = MeolunaAI.fromEnv('openai')

    // Generate world concept
    console.log('🌙 Generating Meoluna world for subject:', subject)
    const worldConcept = await aiProvider.generateWorldConcept(
      content, 
      subject, 
      gradeLevel
    )

    console.log('✨ Generated world:', worldConcept.title)

    // Generate content for the world
    console.log('🎨 Generating interactive content...')
    let worldContent: any[] = []
    let themeConfig: any = null
    
    try {
      worldContent = await aiProvider.generateContent(worldConcept)
      console.log('🎯 Generated', worldContent.length, 'content items')
    } catch (contentError) {
      console.error('❌ Content generation failed:', contentError)
      // Continue without content for now
    }

    // Generate theme configuration
    console.log('🌈 Generating theme configuration...')
    try {
      themeConfig = await aiProvider.generateThemeConfig(subject)
      console.log('✨ Generated theme config')
    } catch (themeError) {
      console.error('❌ Theme generation failed:', themeError)
      // Use a basic theme
      themeConfig = {
        colors: {
          primary: '#059669',
          secondary: '#10b981',
          accent: '#34d399',
          background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
          surface: '#ffffff'
        },
        patterns: {
          hero: 'nature-theme',
          background: 'organic-cells',
          decorative: 'floating-leaves'
        },
        animations: {
          entrance: 'grow-from-seed',
          interaction: 'gentle-sway',
          success: 'bloom'
        }
      }
    }

    // Combine everything into a complete world
    const completeWorld = {
      ...worldConcept,
      content: worldContent,
      theme: themeConfig,
      metadata: {
        generatedAt: new Date().toISOString(),
        contentCount: worldContent.length,
        estimatedDuration: worldContent.reduce((sum, item) => sum + item.estimatedTime, 0)
      }
    }

    return NextResponse.json({
      success: true,
      world: completeWorld,
      message: `🌙 Lernwelt "${worldConcept.title}" wurde erfolgreich generiert!`
    })

  } catch (error) {
    console.error('❌ World generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'World generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
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