import OpenAI from 'openai'
import { BaseMeolunaProvider } from './base'
import { 
  MeolunaWorldConcept, 
  MeolunaContentItem, 
  MeolunaThemeConfig,
  MeolunaWorldConceptSchema,
  MeolunaContentItemSchema,
  MeolunaThemeConfigSchema,
  MeolunaAIError,
  ProviderConfig
} from '../types'

export class MeolunaOpenAI extends BaseMeolunaProvider {
  private client: OpenAI

  constructor(config: ProviderConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    })
  }

  async generateWorldConcept(
    input: string, 
    subject: string, 
    gradeLevel?: number
  ): Promise<MeolunaWorldConcept> {
    try {
      const systemPrompt = this.getSystemPrompt('world')
      const userPrompt = `
Fach: ${subject}
${gradeLevel ? `Klassenstufe: ${gradeLevel}` : ''}

Klassenarbeit/Inhalt:
${input}

Erstelle eine Meoluna-Lernwelt, die diesen Inhalt in eine magische, interaktive Erfahrung verwandelt.

Antworte ausschließlich mit einem JSON-Objekt in folgendem Format:
{
  "title": "Poetischer Name der Lernwelt",
  "subdomain": "automatisch-generiert",
  "subject": "${subject}",
  "gradeLevel": ${gradeLevel || 'null'},
  "description": "Kurze Beschreibung der Welt und ihrer Geschichte",
  "learningObjectives": ["Lernziel 1", "Lernziel 2", ...],
  "theme": {
    "name": "Name des visuellen Themas",
    "mood": "Beschreibung der Atmosphäre",
    "visualStyle": "Beschreibung des visuellen Stils",
    "colors": {
      "primary": "#hex-farbe",
      "secondary": "#hex-farbe", 
      "accent": "#hex-farbe"
    }
  },
  "estimatedDuration": 45
}`

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.defaultParams.temperature,
        max_tokens: this.defaultParams.maxTokens,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new MeolunaAIError('No response from OpenAI', 'NO_RESPONSE', 'openai')
      }

      const parsedData = JSON.parse(content)
      
      // Generate subdomain if not provided
      if (!parsedData.subdomain) {
        parsedData.subdomain = this.generateSubdomain(parsedData.title, subject)
      }

      return this.validateResponse<MeolunaWorldConcept>(parsedData, MeolunaWorldConceptSchema)
    } catch (error) {
      if (error instanceof MeolunaAIError) throw error
      throw new MeolunaAIError(`OpenAI world generation failed: ${error}`, 'GENERATION_FAILED', 'openai')
    }
  }

  async generateContent(concept: MeolunaWorldConcept): Promise<MeolunaContentItem[]> {
    try {
      const systemPrompt = this.getSystemPrompt('content')
      const userPrompt = `
Lernwelt-Konzept:
Titel: ${concept.title}
Fach: ${concept.subject}
${concept.gradeLevel ? `Klassenstufe: ${concept.gradeLevel}` : ''}
Beschreibung: ${concept.description}
Lernziele: ${concept.learningObjectives.join(', ')}
Thema: ${concept.theme.name} - ${concept.theme.mood}

Erstelle 4-8 abwechslungsreiche Lerninhalte für diese Welt. Verwende verschiedene Typen:
- info: Informationsseiten mit Text und Medien
- quiz: Multiple-Choice Fragen mit Erklärungen
- interactive: Drag&Drop, Eingabefelder, Slider
- drag_drop: Spezielle Zuordnungsaufgaben

Antworte mit einem JSON-Array von Inhalten:
[
  {
    "type": "info",
    "title": "Willkommen in...",
    "description": "Einführung in die Lernwelt",
    "difficultyLevel": 1,
    "orderIndex": 0,
    "data": {
      "content": "HTML-formatierter Text...",
      "media": [{"type": "image", "url": "placeholder", "alt": "Beschreibung"}],
      "keyPoints": ["Punkt 1", "Punkt 2"]
    },
    "estimatedTime": 5
  },
  {
    "type": "quiz",
    "title": "Wissenstest",
    "difficultyLevel": 2,
    "orderIndex": 1,
    "data": {
      "questions": [
        {
          "id": "q1",
          "question": "Frage text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Erklärung der richtigen Antwort"
        }
      ],
      "passingScore": 0.7
    },
    "estimatedTime": 10
  }
]`

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.defaultParams.temperature,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new MeolunaAIError('No response from OpenAI', 'NO_RESPONSE', 'openai')
      }

      const parsedData = JSON.parse(content)
      const contentArray = Array.isArray(parsedData) ? parsedData : parsedData.content || []

      return contentArray.map((item: any) => 
        this.validateResponse<MeolunaContentItem>(item, MeolunaContentItemSchema)
      )
    } catch (error) {
      if (error instanceof MeolunaAIError) throw error
      throw new MeolunaAIError(`OpenAI content generation failed: ${error}`, 'GENERATION_FAILED', 'openai')
    }
  }

  async generateThemeConfig(subject: string): Promise<MeolunaThemeConfig> {
    try {
      const systemPrompt = this.getSystemPrompt('theme')
      const userPrompt = `
Fach: ${subject}

Erstelle eine visuelle Themenkonfiguration für eine Meoluna-Lernwelt in diesem Fach.

Antworte mit einem JSON-Objekt:
{
  "colors": {
    "primary": "#hex-farbe (Hauptfarbe, zum Fach passend)",
    "secondary": "#hex-farbe (Sekundärfarbe)",
    "accent": "#hex-farbe (Akzentfarbe für Highlights)",
    "background": "CSS gradient string für Hintergrund",
    "surface": "#hex-farbe (Für Karten und Oberflächen)"
  },
  "patterns": {
    "hero": "Name des Hero-Musters",
    "background": "Name des Hintergrundmusters", 
    "decorative": "Name der dekorativen Elemente"
  },
  "animations": {
    "entrance": "Name der Eingangsanimation",
    "interaction": "Name der Interaktionsanimation",
    "success": "Name der Erfolgsanimation"
  }
}`

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.defaultParams.temperature,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new MeolunaAIError('No response from OpenAI', 'NO_RESPONSE', 'openai')
      }

      const parsedData = JSON.parse(content)
      return this.validateResponse<MeolunaThemeConfig>(parsedData, MeolunaThemeConfigSchema)
    } catch (error) {
      if (error instanceof MeolunaAIError) throw error
      throw new MeolunaAIError(`OpenAI theme generation failed: ${error}`, 'GENERATION_FAILED', 'openai')
    }
  }
}