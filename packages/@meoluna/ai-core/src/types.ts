import { z } from 'zod'

// Base AI Provider Interface
export interface MeolunaAIProvider {
  generateWorldConcept(input: string, subject: string, gradeLevel?: number): Promise<MeolunaWorldConcept>
  generateContent(concept: MeolunaWorldConcept): Promise<MeolunaContentItem[]>
  generateThemeConfig(subject: string): Promise<MeolunaThemeConfig>
}

// World Concept Schema
export const MeolunaWorldConceptSchema = z.object({
  title: z.string().min(1).max(100),
  subdomain: z.string().min(1).max(50),
  subject: z.string(),
  gradeLevel: z.number().min(1).max(13).optional(),
  description: z.string().min(10).max(500),
  learningObjectives: z.array(z.string()).min(1).max(10),
  theme: z.object({
    name: z.string(),
    mood: z.string(),
    visualStyle: z.string(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string()
    })
  }),
  estimatedDuration: z.number().min(10).max(120) // minutes
})

export type MeolunaWorldConcept = z.infer<typeof MeolunaWorldConceptSchema>

// Content Item Schema
export const MeolunaContentItemSchema = z.object({
  type: z.enum(['info', 'quiz', 'interactive', 'game', 'drag_drop']),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  difficultyLevel: z.number().min(1).max(4),
  orderIndex: z.number().min(0),
  data: z.record(z.any()), // Flexible content data
  estimatedTime: z.number().min(1).max(30) // minutes
})

export type MeolunaContentItem = z.infer<typeof MeolunaContentItemSchema>

// Theme Configuration Schema
export const MeolunaThemeConfigSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string()
  }),
  patterns: z.object({
    hero: z.string(),
    background: z.string(),
    decorative: z.string()
  }),
  animations: z.object({
    entrance: z.string(),
    interaction: z.string(),
    success: z.string()
  })
})

export type MeolunaThemeConfig = z.infer<typeof MeolunaThemeConfigSchema>

// Quiz specific types
export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(10).max(500),
  options: z.array(z.string()).min(2).max(6),
  correct: z.number().min(0),
  explanation: z.string().optional(),
  difficulty: z.number().min(1).max(4),
  timeLimit: z.number().min(10).max(300).optional() // seconds
})

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>

export const QuizContentSchema = z.object({
  type: z.literal('quiz'),
  questions: z.array(QuizQuestionSchema).min(1).max(20),
  passingScore: z.number().min(0).max(1).default(0.7),
  allowRetakes: z.boolean().default(true),
  randomizeOrder: z.boolean().default(true)
})

export type QuizContent = z.infer<typeof QuizContentSchema>

// Interactive content types
export const InteractiveComponentSchema = z.object({
  id: z.string(),
  type: z.enum(['drag_drop', 'drawing', 'slider', 'input', 'matching']),
  config: z.record(z.any()),
  validation: z.record(z.any()).optional()
})

export const InteractiveContentSchema = z.object({
  type: z.literal('interactive'),
  components: z.array(InteractiveComponentSchema).min(1).max(10),
  instructions: z.string().min(10).max(1000),
  successCriteria: z.record(z.any())
})

export type InteractiveContent = z.infer<typeof InteractiveContentSchema>

// Info content types
export const MediaItemSchema = z.object({
  type: z.enum(['image', 'video', 'audio']),
  url: z.string().url(),
  alt: z.string().optional(),
  caption: z.string().optional()
})

export const InfoContentSchema = z.object({
  type: z.literal('info'),
  title: z.string().min(1).max(200),
  content: z.string().min(50).max(5000),
  media: z.array(MediaItemSchema).optional(),
  keyPoints: z.array(z.string()).optional()
})

export type InfoContent = z.infer<typeof InfoContentSchema>

// AI Generation Parameters
export interface GenerationParams {
  temperature?: number
  maxTokens?: number
  model?: string
  language?: 'de' | 'en'
}

// Error types
export class MeolunaAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string
  ) {
    super(message)
    this.name = 'MeolunaAIError'
  }
}

// Provider configuration
export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  model?: string
  temperature?: number
  maxTokens?: number
}