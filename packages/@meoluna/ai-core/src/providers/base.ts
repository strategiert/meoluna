import { 
  MeolunaAIProvider, 
  MeolunaWorldConcept, 
  MeolunaContentItem, 
  MeolunaThemeConfig,
  ProviderConfig,
  GenerationParams
} from '../types'

export abstract class BaseMeolunaProvider implements MeolunaAIProvider {
  protected config: ProviderConfig
  protected defaultParams: GenerationParams

  constructor(config: ProviderConfig) {
    this.config = config
    this.defaultParams = {
      temperature: 0.7,
      maxTokens: 2000,
      language: 'de'
    }
  }

  abstract generateWorldConcept(
    input: string, 
    subject: string, 
    gradeLevel?: number
  ): Promise<MeolunaWorldConcept>

  abstract generateContent(
    concept: MeolunaWorldConcept
  ): Promise<MeolunaContentItem[]>

  abstract generateThemeConfig(
    subject: string
  ): Promise<MeolunaThemeConfig>

  protected getSystemPrompt(type: 'world' | 'content' | 'theme'): string {
    const basePrompt = `Du bist der kreative Geist hinter Meoluna, einer magischen Lernplattform, die Klassenarbeiten in faszinierende Lernwelten verwandelt.

Meoluna-Grundsätze:
- Jede Welt hat einen poetischen, einprägsamen Namen
- Visuelle Metaphern unterstützen das Lernen
- Interaktivität steht im Mittelpunkt
- Schwierigkeit wird durch "Mondphasen" (1-4) dargestellt
- Nächtliche, beruhigende Ästhetik mit hellen Akzenten`

    switch (type) {
      case 'world':
        return `${basePrompt}

Erstelle ein Lernwelt-Konzept mit:
1. Einem poetischen Namen, der das Thema einfängt
2. Einer kleinen Geschichte oder Metapher als Rahmen
3. Klaren Lernzielen
4. Einer thematisch passenden visuellen Identität
5. Einer geschätzten Bearbeitungszeit

Die Welt soll einladend und geheimnisvoll zugleich sein.`

      case 'content':
        return `${basePrompt}

Erstelle vielfältige Lerninhalte:
1. Willkommensbereich mit thematischer Einführung
2. Strukturierte Wissensbereiche mit visuellen Ankern
3. Mindestens 3 verschiedene interaktive Übungstypen
4. Ein adaptives Quiz-System zur Selbstkontrolle
5. Gamification-Elemente (Sterne sammeln, Fortschritt)

Verwende verschiedene Inhaltstypen: info, quiz, interactive, drag_drop`

      case 'theme':
        return `${basePrompt}

Erstelle eine visuelle Identität:
1. Farbschema passend zum Fach (nächtlich mit Akzenten)
2. Visuelle Muster und Hintergründe
3. Animationskonzepte für Übergänge
4. Responsive Design-Prinzipien

Die Ästhetik soll beruhigend und fokussierend wirken.`

      default:
        return basePrompt
    }
  }

  protected generateSubdomain(title: string, subject: string): string {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30)
    
    const subjectShort = subject.toLowerCase().substring(0, 5)
    const unique = Math.random().toString(36).substring(2, 8)
    
    return `${subjectShort}-${cleanTitle}-${unique}`
  }

  protected validateResponse<T>(data: any, schema: any): T {
    try {
      return schema.parse(data)
    } catch (error) {
      throw new Error(`Invalid AI response format: ${error}`)
    }
  }
}