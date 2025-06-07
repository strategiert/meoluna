import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@meoluna/database'
import { z } from 'zod'

const CreateWorldSchema = z.object({
  subdomain: z.string(),
  title: z.string(),
  subject: z.string(),
  grade_level: z.number().optional(),
  theme_config: z.object({}).passthrough(),
  content: z.array(z.object({}).passthrough()),
  description: z.string().optional(),
  learning_objectives: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const worldData = CreateWorldSchema.parse(body)

    console.log('💾 Saving world to database:', worldData.title)

    const supabase = createAdminClient()

    // Save world to database
    const { data: world, error: worldError } = await supabase
      .from('meoluna_worlds')
      .insert({
        subdomain: worldData.subdomain,
        title: worldData.title,
        subject: worldData.subject,
        grade_level: worldData.grade_level,
        theme_config: worldData.theme_config,
        is_public: true
      })
      .select()
      .single()

    if (worldError) {
      console.error('❌ Error saving world:', worldError)
      throw new Error(`Database error: ${worldError.message}`)
    }

    console.log('✅ World saved with ID:', world.id)

    // Save content items
    if (worldData.content && worldData.content.length > 0) {
      const contentItems = worldData.content.map((item: any, index: number) => ({
        world_id: world.id,
        content_type: item.type || 'info',
        content_data: item,
        title: item.title,
        description: item.description,
        difficulty_level: item.difficultyLevel || 1,
        order_index: index
      }))

      const { error: contentError } = await supabase
        .from('meoluna_content')
        .insert(contentItems)

      if (contentError) {
        console.error('❌ Error saving content:', contentError)
        // Don't fail completely, just log the error
      } else {
        console.log('✅ Saved', contentItems.length, 'content items')
      }
    }

    return NextResponse.json({
      success: true,
      world,
      worldUrl: `http://localhost:3001/world/${worldData.subdomain}`,
      message: `🌙 Lernwelt "${worldData.title}" wurde gespeichert!`
    })

  } catch (error) {
    console.error('❌ World saving error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to save world',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Fetch worlds with their content
    const { data: worlds, error } = await supabase
      .from('meoluna_worlds')
      .select(`
        *,
        content:meoluna_content(*)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('🔍 Fetched worlds with content. First world content items:', worlds?.[0]?.content?.length || 0)

    return NextResponse.json({
      success: true,
      worlds
    })

  } catch (error) {
    console.error('❌ Error fetching worlds:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch worlds',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}