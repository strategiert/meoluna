// Meoluna Database Types
// Auto-generated types for type-safe database operations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      meoluna_worlds: {
        Row: {
          id: string
          subdomain: string
          title: string
          subject: string
          grade_level: number | null
          theme_config: Json
          created_by: string | null
          is_public: boolean | null
          play_count: number | null
          avg_rating: number | null
          saved_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          subdomain: string
          title: string
          subject: string
          grade_level?: number | null
          theme_config: Json
          created_by?: string | null
          is_public?: boolean | null
          play_count?: number | null
          avg_rating?: number | null
          saved_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          subdomain?: string
          title?: string
          subject?: string
          grade_level?: number | null
          theme_config?: Json
          created_by?: string | null
          is_public?: boolean | null
          play_count?: number | null
          avg_rating?: number | null
          saved_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      meoluna_content: {
        Row: {
          id: string
          world_id: string
          content_type: string
          content_data: Json
          difficulty_level: number | null
          order_index: number
          title: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          world_id: string
          content_type: string
          content_data: Json
          difficulty_level?: number | null
          order_index: number
          title?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          world_id?: string
          content_type?: string
          content_data?: Json
          difficulty_level?: number | null
          order_index?: number
          title?: string | null
          description?: string | null
          created_at?: string | null
        }
      }
      meoluna_sessions: {
        Row: {
          id: string
          world_id: string
          anonymous_id: string
          started_at: string | null
          last_active: string | null
          completed: boolean | null
          total_score: number | null
        }
        Insert: {
          id?: string
          world_id: string
          anonymous_id: string
          started_at?: string | null
          last_active?: string | null
          completed?: boolean | null
          total_score?: number | null
        }
        Update: {
          id?: string
          world_id?: string
          anonymous_id?: string
          started_at?: string | null
          last_active?: string | null
          completed?: boolean | null
          total_score?: number | null
        }
      }
      meoluna_progress: {
        Row: {
          id: string
          session_id: string
          content_id: string
          interaction_data: Json
          score: number | null
          completed: boolean | null
          attempts: number | null
          time_spent: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          content_id: string
          interaction_data: Json
          score?: number | null
          completed?: boolean | null
          attempts?: number | null
          time_spent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          content_id?: string
          interaction_data?: Json
          score?: number | null
          completed?: boolean | null
          attempts?: number | null
          time_spent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      meoluna_themes: {
        Row: {
          id: string
          name: string
          subject: string
          config: Json
          preview_image: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          subject: string
          config: Json
          preview_image?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          config?: Json
          preview_image?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      meoluna_analytics: {
        Row: {
          id: string
          world_id: string
          date: string
          unique_visitors: number | null
          total_sessions: number | null
          avg_completion_rate: number | null
          avg_score: number | null
          most_difficult_content_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          world_id: string
          date: string
          unique_visitors?: number | null
          total_sessions?: number | null
          avg_completion_rate?: number | null
          avg_score?: number | null
          most_difficult_content_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          world_id?: string
          date?: string
          unique_visitors?: number | null
          total_sessions?: number | null
          avg_completion_rate?: number | null
          avg_score?: number | null
          most_difficult_content_id?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_world_play_count: {
        Args: {
          world_uuid: string
        }
        Returns: undefined
      }
      calculate_world_completion_rate: {
        Args: {
          world_uuid: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type MeolunaWorld = Database['public']['Tables']['meoluna_worlds']['Row']
export type MeolunaWorldInsert = Database['public']['Tables']['meoluna_worlds']['Insert']
export type MeolunaWorldUpdate = Database['public']['Tables']['meoluna_worlds']['Update']

export type MeolunaContent = Database['public']['Tables']['meoluna_content']['Row']
export type MeolunaContentInsert = Database['public']['Tables']['meoluna_content']['Insert']
export type MeolunaContentUpdate = Database['public']['Tables']['meoluna_content']['Update']

export type MeolunaSession = Database['public']['Tables']['meoluna_sessions']['Row']
export type MeolunaSessionInsert = Database['public']['Tables']['meoluna_sessions']['Insert']
export type MeolunaSessionUpdate = Database['public']['Tables']['meoluna_sessions']['Update']

export type MeolunaProgress = Database['public']['Tables']['meoluna_progress']['Row']
export type MeolunaProgressInsert = Database['public']['Tables']['meoluna_progress']['Insert']
export type MeolunaProgressUpdate = Database['public']['Tables']['meoluna_progress']['Update']

export type MeolunaTheme = Database['public']['Tables']['meoluna_themes']['Row']
export type MeolunaThemeInsert = Database['public']['Tables']['meoluna_themes']['Insert']
export type MeolunaThemeUpdate = Database['public']['Tables']['meoluna_themes']['Update']

export type MeolunaAnalytics = Database['public']['Tables']['meoluna_analytics']['Row']
export type MeolunaAnalyticsInsert = Database['public']['Tables']['meoluna_analytics']['Insert']
export type MeolunaAnalyticsUpdate = Database['public']['Tables']['meoluna_analytics']['Update']

// Theme configuration types
export interface MeolunaThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
  }
  patterns: {
    hero: string
    background: string
    decorative: string
  }
  animations: {
    entrance: string
    interaction: string
    success: string
  }
}

// Content types
export type ContentType = 'info' | 'quiz' | 'interactive' | 'game' | 'drag_drop'

export interface QuizContent {
  type: 'quiz'
  questions: Array<{
    id: string
    question: string
    options: string[]
    correct: number
    explanation?: string
  }>
}

export interface InteractiveContent {
  type: 'interactive'
  components: Array<{
    id: string
    type: 'drag_drop' | 'drawing' | 'slider' | 'input'
    config: Json
  }>
}

export interface InfoContent {
  type: 'info'
  title: string
  content: string
  media?: Array<{
    type: 'image' | 'video'
    url: string
    alt?: string
  }>
}

// Subject types
export type Subject = 'mathematics' | 'biology' | 'german' | 'history' | 'physics' | 'chemistry'

// Difficulty levels (Moon phases)
export type DifficultyLevel = 1 | 2 | 3 | 4