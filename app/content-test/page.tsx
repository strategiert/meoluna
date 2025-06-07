'use client'

import { useState } from 'react'

export default function ContentTestPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [error, setError] = useState('')

  // Placeholder world concept for testing
  const placeholderWorldConcept = {
    title: "Das Geheimnis der Mondhasen",
    subject: "Biologie",
    gradeLevel: 3,
    description: "Erforsche die Zähne der magischen Mondhasen",
    learningObjectives: [
      "Zahnstruktur von Hasen verstehen",
      "Funktion verschiedener Zähne erkennen",
      "Vergleich mit anderen Tieren"
    ],
    theme: {
      name: "Mondlicht-Garten",
      mood: "mystisch und lehrreich",
      visualStyle: "sanfte Mondschein-Ästhetik"
    }
  }

  const handleGenerateContent = async () => {
    setIsGenerating(true)
    setError('')
    setGeneratedContent(null)

    try {
      console.log('🧪 Testing isolated content generation...')
      
      const response = await fetch('/api/test-content-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          worldConcept: placeholderWorldConcept 
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContent(data.content)
        console.log('✅ Content generation test successful:', data)
      } else {
        setError(data.message || 'Content generation failed')
        console.error('❌ Content generation test failed:', data)
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('❌ Network error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const renderGeneratedContent = (content: any) => {
    if (!content || !Array.isArray(content)) return null

    return content.map((item: any, index: number) => {
      switch (item.type) {
        case 'info':
          return (
            <div key={index} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              marginBottom: '1.5rem',
              border: '2px solid #10b981',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{
                background: '#10b981',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                display: 'inline-block'
              }}>
                📚 Info
              </div>
              <h3 style={{ color: '#059669', marginTop: 0 }}>{item.title}</h3>
              <div dangerouslySetInnerHTML={{ __html: item.data?.content || item.description }} />
              {item.data?.keyPoints && (
                <ul style={{ marginTop: '1rem', color: '#374151' }}>
                  {item.data.keyPoints.map((point: string, i: number) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          )

        case 'quiz':
          return (
            <div key={index} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              marginBottom: '1.5rem',
              border: '2px solid #8b5cf6',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{
                background: '#8b5cf6',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                display: 'inline-block'
              }}>
                🧠 Quiz
              </div>
              <h3 style={{ color: '#7c3aed', marginTop: 0 }}>{item.title}</h3>
              {item.data?.questions && item.data.questions.map((q: any, i: number) => (
                <div key={i} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{q.question}</p>
                  {q.options && q.options.map((option: string, optIndex: number) => (
                    <button 
                      key={optIndex}
                      style={{
                        display: 'block',
                        margin: '0.25rem 0',
                        padding: '0.5rem 1rem',
                        background: optIndex === q.correct ? '#dcfce7' : '#f1f5f9',
                        border: `1px solid ${optIndex === q.correct ? '#10b981' : '#cbd5e1'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        fontSize: '0.9rem'
                      }}
                    >
                      {option} {optIndex === q.correct ? '✅' : ''}
                    </button>
                  ))}
                  {q.explanation && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )

        case 'interactive':
          return (
            <div key={index} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              marginBottom: '1.5rem',
              border: '2px solid #f59e0b',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)'
            }}>
              <div style={{
                background: '#f59e0b',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                display: 'inline-block'
              }}>
                🎮 Interaktiv
              </div>
              <h3 style={{ color: '#d97706', marginTop: 0 }}>{item.title}</h3>
              <p>{item.description}</p>
              <div style={{ 
                background: '#fef3c7', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                border: '1px solid #fed7aa'
              }}>
                🚧 Interaktive Komponente wird hier angezeigt
              </div>
            </div>
          )

        default:
          return (
            <div key={index} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              marginBottom: '1.5rem',
              border: '2px solid #6b7280'
            }}>
              <h3>{item.title}</h3>
              <p>Type: {item.type}</p>
              <pre style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.25rem' }}>
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          )
      }
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1000px',
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
          🧪 Content-Generation Test Lab
        </h1>

        <div style={{
          background: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ color: '#374151', marginTop: 0 }}>🎯 Test-Szenario:</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            <strong>Welt:</strong> "{placeholderWorldConcept.title}" ({placeholderWorldConcept.subject}, Klasse {placeholderWorldConcept.gradeLevel})
            <br />
            <strong>Ziel:</strong> GPT-4 soll Quiz-Fragen und interaktive Elemente generieren
          </p>
        </div>

        <button
          onClick={handleGenerateContent}
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            backgroundColor: isGenerating ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            marginBottom: '2rem'
          }}
        >
          {isGenerating ? '🧠 GPT-4 generiert Content...' : '🚀 Test Content-Generierung'}
        </button>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#dc2626',
            marginBottom: '2rem'
          }}>
            ❌ {error}
          </div>
        )}

        {generatedContent && (
          <div>
            <h2 style={{ color: '#059669', marginBottom: '1rem' }}>
              ✅ Generierte Inhalte ({generatedContent.length} Items):
            </h2>
            {renderGeneratedContent(generatedContent)}
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
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            ← Zurück zur Hauptseite
          </a>
        </div>
      </div>
    </div>
  )
}