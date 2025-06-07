'use client'

import { useState } from 'react'

export default function CreatePage() {
  const [formData, setFormData] = useState({
    content: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/generate/world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.world)
        
        // Save the world to database
        try {
          console.log('💾 Saving world to database...')
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
            console.log('✅ World saved successfully!')
          }
        } catch (saveError) {
          console.error('❌ Failed to save world:', saveError)
          // Don't show error to user, just log it
        }
      } else {
        setError(data.message || 'Fehler bei der Generierung')
      }
    } catch (err) {
      setError('Netzwerkfehler: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'))
    } finally {
      setIsLoading(false)
    }
  }

  const subjects = [
    { value: 'mathematics', label: 'Mathematik' },
    { value: 'biology', label: 'Biologie' },
    { value: 'german', label: 'Deutsch' },
    { value: 'history', label: 'Geschichte' },
    { value: 'physics', label: 'Physik' },
    { value: 'chemistry', label: 'Chemie' }
  ]

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
          🌙 Neue Meoluna-Lernwelt erstellen
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Klassenarbeit / Lerninhalt:
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Füge hier deine Klassenarbeit oder den Lerninhalt ein..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              required
            />
          </div>


          <button
            type="submit"
            disabled={isLoading || !formData.content.trim()}
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
            {isLoading ? '🌙 Generiere magische Lernwelt...' : '✨ Lernwelt erstellen'}
          </button>
        </form>

        {isLoading && (
          <div style={{
            marginTop: '2rem',
            padding: '3rem',
            backgroundColor: '#1e1b4b',
            borderRadius: '1rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Starfield Background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(2px 2px at 20px 30px, #fff, transparent),
                radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 90px 40px, #fff, transparent),
                radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
                radial-gradient(2px 2px at 160px 30px, #fff, transparent)
              `,
              animation: 'twinkle 3s ease-in-out infinite alternate'
            }} />
            
            {/* Moon Container */}
            <div style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              margin: '0 auto 2rem',
              borderRadius: '50%',
              border: '3px solid #60a5fa',
              backgroundColor: '#1e1b4b',
              overflow: 'hidden',
              boxShadow: '0 0 30px rgba(96, 165, 250, 0.3)'
            }}>
              {/* Moon Fill */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#60a5fa',
                background: 'linear-gradient(to top, #3b82f6, #60a5fa, #dbeafe)',
                height: '0%',
                animation: 'moonFill 8s ease-in-out infinite',
                borderRadius: '0 0 50% 50%'
              }} />
              
              {/* Moon Craters */}
              <div style={{
                position: 'absolute',
                top: '25%',
                left: '30%',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.3)',
                opacity: 0,
                animation: 'fadeInOut 8s ease-in-out infinite 2s'
              }} />
              <div style={{
                position: 'absolute',
                top: '60%',
                right: '25%',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.3)',
                opacity: 0,
                animation: 'fadeInOut 8s ease-in-out infinite 4s'
              }} />
            </div>

            <h3 style={{
              color: '#dbeafe',
              fontSize: '1.3rem',
              marginBottom: '1rem',
              fontWeight: 'normal'
            }}>
              🌙 Der Mond sammelt Wissen...
            </h3>
            
            <p style={{
              color: '#93c5fd',
              fontSize: '1rem',
              margin: 0,
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              Deine magische Lernwelt wird erschaffen
            </p>

            <style jsx>{`
              @keyframes moonFill {
                0% { height: 0%; }
                50% { height: 60%; }
                100% { height: 100%; }
              }
              
              @keyframes twinkle {
                0% { opacity: 0.3; }
                100% { opacity: 1; }
              }
              
              @keyframes fadeInOut {
                0%, 80% { opacity: 0; }
                40% { opacity: 1; }
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
            `}</style>
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
              🎉 Lernwelt erfolgreich erstellt!
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
                {result.title}
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                {result.description}
              </p>
              
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
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                🌙 Lernwelt besuchen
              </a>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>🎯 Lernziele:</h4>
              <ul style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
                {result.learningObjectives?.map((objective: string, index: number) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}