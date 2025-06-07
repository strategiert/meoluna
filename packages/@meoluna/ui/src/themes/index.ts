import { extendTheme } from '@chakra-ui/react'

// Simple theme without complex config for now
export const meolunaTheme = extendTheme({
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  },
  colors: {
    meoluna: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
    moon: {
      50: '#f8faff',
      100: '#e6f0ff',
      200: '#c7d9ff',
      300: '#9bb5ff',
      400: '#6b8fff',
      500: '#4169e1',
      600: '#3151c4',
      700: '#2640a6',
      800: '#1f3389',
      900: '#1a2a6c',
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'xl',
        fontWeight: 'semibold',
      },
      variants: {
        meoluna: {
          bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '2xl',
          overflow: 'hidden',
          bg: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'gray.100',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
})

// Subject-specific theme configurations
export const subjectThemes = {
  mathematics: {
    name: 'Geometrische Galaxie',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      surface: '#ffffff'
    },
    patterns: {
      hero: 'constellation-math',
      background: 'geometric-grid',
      decorative: 'floating-formulas'
    },
    animations: {
      entrance: 'slide-up-fade',
      interaction: 'pulse-on-hover',
      success: 'starburst'
    }
  },
  biology: {
    name: 'Lebendiger Garten',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
      surface: '#ffffff'
    },
    patterns: {
      hero: 'growing-vines',
      background: 'organic-cells',
      decorative: 'floating-leaves'
    },
    animations: {
      entrance: 'grow-from-seed',
      interaction: 'gentle-sway',
      success: 'bloom'
    }
  },
  german: {
    name: 'Geschichtenbuch',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      surface: '#fffbf0'
    },
    patterns: {
      hero: 'open-book',
      background: 'paper-texture',
      decorative: 'floating-letters'
    },
    animations: {
      entrance: 'page-turn',
      interaction: 'typewriter',
      success: 'sparkle-text'
    }
  },
  history: {
    name: 'Zeitreise-Portal',
    colors: {
      primary: '#92400e',
      secondary: '#d97706',
      accent: '#fbbf24',
      background: 'linear-gradient(135deg, #fefbf3 0%, #fef3e2 100%)',
      surface: '#ffffff'
    },
    patterns: {
      hero: 'ancient-scrolls',
      background: 'timeline-grid',
      decorative: 'floating-artifacts'
    },
    animations: {
      entrance: 'time-warp',
      interaction: 'history-reveal',
      success: 'golden-glow'
    }
  },
  physics: {
    name: 'Kosmisches Labor',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#10b981',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      surface: '#ffffff'
    },
    patterns: {
      hero: 'particle-field',
      background: 'wave-interference',
      decorative: 'floating-atoms'
    },
    animations: {
      entrance: 'quantum-appear',
      interaction: 'energy-pulse',
      success: 'nuclear-fusion'
    }
  },
  chemistry: {
    name: 'Molekulare Werkstatt',
    colors: {
      primary: '#dc2626',
      secondary: '#ef4444',
      accent: '#f97316',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      surface: '#ffffff'
    },
    patterns: {
      hero: 'molecular-bonds',
      background: 'periodic-table',
      decorative: 'floating-molecules'
    },
    animations: {
      entrance: 'chemical-reaction',
      interaction: 'bond-formation',
      success: 'reaction-complete'
    }
  }
} as const

export type SubjectTheme = keyof typeof subjectThemes