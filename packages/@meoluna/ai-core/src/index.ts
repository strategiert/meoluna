export * from './types'
export * from './providers/base'
export * from './providers/openai'

import { MeolunaOpenAI } from './providers/openai'
import { ProviderConfig } from './types'

// Provider factory
export class MeolunaAI {
  static createProvider(type: 'openai' | 'deepseek', config: ProviderConfig) {
    switch (type) {
      case 'openai':
        return new MeolunaOpenAI(config)
      case 'deepseek':
        // DeepSeek provider can be added later with same interface
        return new MeolunaOpenAI({
          ...config,
          baseUrl: 'https://api.deepseek.com/v1'
        })
      default:
        throw new Error(`Unknown provider type: ${type}`)
    }
  }

  static fromEnv(type: 'openai' | 'deepseek' = 'openai') {
    const rawApiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY
    if (!rawApiKey) {
      throw new Error('No AI provider API key found in environment')
    }

    // Clean the API key - remove newlines, spaces, and other whitespace
    const apiKey = rawApiKey.replace(/\s+/g, '').trim()

    return this.createProvider(type, {
      apiKey,
      model: type === 'openai' ? 'gpt-4o' : 'deepseek-chat'
    })
  }
}