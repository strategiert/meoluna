import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Utility functions for common operations
export const meolunaQueries = {
  // Get world by subdomain
  getWorldBySubdomain: async (subdomain: string) => {
    const { data, error } = await supabase
      .from('meoluna_worlds')
      .select('*')
      .eq('subdomain', subdomain)
      .single()
    
    if (error) throw error
    return data
  },

  // Get content for a world
  getWorldContent: async (worldId: string) => {
    const { data, error } = await supabase
      .from('meoluna_content')
      .select('*')
      .eq('world_id', worldId)
      .order('order_index')
    
    if (error) throw error
    return data
  },

  // Create or get session
  createSession: async (worldId: string, anonymousId: string) => {
    const { data, error } = await supabase
      .from('meoluna_sessions')
      .upsert({
        world_id: worldId,
        anonymous_id: anonymousId,
        last_active: new Date().toISOString()
      }, {
        onConflict: 'world_id,anonymous_id'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Track progress
  trackProgress: async (sessionId: string, contentId: string, interactionData: any, score?: number) => {
    const { data, error } = await supabase
      .from('meoluna_progress')
      .upsert({
        session_id: sessionId,
        content_id: contentId,
        interaction_data: interactionData,
        score,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id,content_id'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get themes by subject
  getThemesBySubject: async (subject: string) => {
    const { data, error } = await supabase
      .from('meoluna_themes')
      .select('*')
      .eq('subject', subject)
      .eq('is_active', true)
    
    if (error) throw error
    return data
  },

  // Get public worlds for gallery
  getPublicWorlds: async (limit = 20, offset = 0) => {
    const { data, error } = await supabase
      .from('meoluna_worlds')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
  }
}