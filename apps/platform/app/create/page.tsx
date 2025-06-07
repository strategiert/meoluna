'use client'

import { useState } from 'react'

export default function CreatePage() {
  const [formData, setFormData] = useState({
    content: '',
    subject: 'mathematics',
    gradeLevel: 8
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

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: '#374151'
              }}>
                Fach:
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              >
                {subjects.map(subject => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: '#374151'
              }}>
                Klassenstufe:
              </label>
              <input
                type="number"
                min="1"
                max="13"
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
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
            
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
                {result.title}
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                {result.description}
              </p>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                📍 Subdomain: {result.subdomain} • 
                ⏱️ Geschätzte Dauer: {result.metadata?.estimatedDuration} Min • 
                📚 {result.metadata?.contentCount} Lerninhalte
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>🎯 Lernziele:</h4>
              <ul style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
                {result.learningObjectives?.map((objective: string, index: number) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>🎨 Theme: {result.theme?.name}</h4>
              <p style={{ color: '#6b7280' }}>{result.theme?.mood}</p>
            </div>

            <div>
              <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>📚 Generierte Inhalte:</h4>
              {result.content?.map((item: any, index: number) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <strong>{item.title}</strong> ({item.type})
                  {item.description && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                    {item.description}
                  </p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}