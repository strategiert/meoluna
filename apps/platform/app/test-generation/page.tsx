'use client'

import { useState } from 'react'

export default function TestGenerationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSimpleGeneration = async () => {
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      // Simple test content
      const testContent = "Wie funktioniert Photosynthese bei Pflanzen?"

      const response = await fetch('/api/generate/world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: testContent })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.world)
        
        // Save the world to database
        try {
          const saveResponse = await fetch('/api/worlds', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subdomain: data.world.subdomain,
              title: data.world.title,
              subject: data.world.subject,
              grade_level: data.world.gradeLevel,
              theme_config: data.world.theme,
              content: data.world.content || [],
              description: data.world.description,
              learning_objectives: data.world.learningObjectives
            })
          })
          
          const saveData = await saveResponse.json()
          if (saveData.success) {
            console.log('✅ Test world saved successfully!')
          }
        } catch (saveError) {
          console.error('❌ Failed to save test world:', saveError)
        }
      } else {
        setError(data.message || 'Fehler bei der Test-Generierung')
      }
    } catch (err) {
      setError('Netzwerkfehler: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
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
          🧪 Test: Welt-Generierung
        </h1>

        <div style={{
          background: '#f3f4f6',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#374151', marginTop: 0 }}>Test-Inhalt:</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            "Wie funktioniert Photosynthese bei Pflanzen?"
          </p>
        </div>

        <button
          onClick={handleSimpleGeneration}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            backgroundColor: isLoading ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? '🌙 Generiere Test-Welt...' : '🚀 Test-Welt generieren'}
        </button>

        {isLoading && (
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            backgroundColor: '#1e1b4b',
            borderRadius: '1rem',
            textAlign: 'center',
            color: '#dbeafe'
          }}>
            <p>🔍 Teste Content-Generierung...</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Schau in die Vercel Logs für Details
            </p>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#dc2626'
          }}>
            ❌ {error}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem'
          }}>
            <h2 style={{ 
              color: '#059669',
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              🎉 Test-Welt generiert!
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
                {result.title}
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                {result.description}
              </p>
              
              <div style={{
                background: '#ffffff',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p><strong>Subdomain:</strong> {result.subdomain}</p>
                <p><strong>Content Items:</strong> {result.content?.length || 0}</p>
                <p><strong>Subject:</strong> {result.subject}</p>
              </div>
              
              <a 
                href={`/world/${result.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                🌙 Test-Welt besuchen
              </a>
            </div>
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