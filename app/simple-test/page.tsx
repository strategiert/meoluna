'use client'

import { useState } from 'react'

export default function SimpleTestPage() {
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null)

  const handleGenerateSimple = () => {
    // Generate a simple random slug
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    const slug = `test-${timestamp}-${random}`
    
    setGeneratedSlug(slug)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#667eea',
          textAlign: 'center'
        }}>
          🧪 Super Simple Test
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Einfachster Test: Button → URL → "Hallo World"
        </p>

        <button
          onClick={handleGenerateSimple}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '2rem'
          }}
        >
          🚀 Generiere einfache URL
        </button>

        {generatedSlug && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem'
          }}>
            <h2 style={{ 
              color: '#059669',
              marginBottom: '1rem',
              fontSize: '1.3rem'
            }}>
              ✅ URL generiert!
            </h2>
            
            <div style={{
              background: '#ffffff',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontFamily: 'monospace'
            }}>
              <strong>Slug:</strong> {generatedSlug}
            </div>
            
            <a 
              href={`/simple/${generatedSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold'
              }}
            >
              👀 "Hallo World" ansehen
            </a>
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <a 
            href="/"
            style={{
              color: '#667eea',
              textDecoration: 'none'
            }}
          >
            ← Zurück zur Hauptseite
          </a>
        </div>
      </div>
    </div>
  )
}