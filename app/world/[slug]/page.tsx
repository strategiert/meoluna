import { notFound } from 'next/navigation'

interface WorldPageProps {
  params: {
    slug: string
  }
}

// Force rebuild for Vercel deployment

async function getWorldData(slug: string) {
  try {
    // Always use production URL for API calls from production domain
    // Check if we're in production by looking for production environment variable
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
    const baseUrl = isProduction ? 'https://meoluna.com' : `https://${process.env.VERCEL_URL}`
    
    console.log('🔍 Fetching world data for slug:', slug)
    console.log('🔍 Environment:', process.env.VERCEL_ENV, 'NODE_ENV:', process.env.NODE_ENV)
    console.log('🔍 Is Production:', isProduction)
    console.log('🔍 Using base URL:', baseUrl)
    
    const response = await fetch(`${baseUrl}/api/worlds`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.error('❌ API call failed:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    console.log('🔍 API response:', data)
    
    if (!data.success || !data.worlds) {
      console.error('❌ Invalid API response:', data)
      return null
    }
    
    const world = data.worlds.find((w: any) => w.subdomain === slug)
    console.log('🔍 Found world:', world ? 'YES' : 'NO')
    
    return world
  } catch (error) {
    console.error('❌ Error fetching world:', error)
    return null
  }
}

function ContentRenderer({ item }: { item: any }) {
  // Handle both content_data (from DB) and data (from direct content)
  const data = item.content_data?.data || item.data || {}
  const actualItem = item.content_data || item
  
  if (actualItem.type === 'info') {
    return (
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: '4px solid #10b981',
        marginBottom: '1.5rem'
      }}>
        <span style={{
          display: 'inline-block',
          background: '#10b981',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          📚 Info
        </span>
        <h3 style={{ color: '#059669', marginTop: 0, marginBottom: '1rem' }}>
          {actualItem.title}
        </h3>
        <div dangerouslySetInnerHTML={{ __html: data.content || actualItem.description || '' }} />
        {data.keyPoints && (
          <ul style={{ marginTop: '1rem', color: '#374151' }}>
            {data.keyPoints.map((point: string, i: number) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  
  if (actualItem.type === 'quiz') {
    return (
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: '4px solid #8b5cf6',
        marginBottom: '1.5rem'
      }}>
        <span style={{
          display: 'inline-block',
          background: '#8b5cf6',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          🧠 Quiz
        </span>
        <h3 style={{ color: '#7c3aed', marginTop: 0, marginBottom: '1rem' }}>
          {actualItem.title}
        </h3>
        {data.questions && data.questions.map((q: any, i: number) => (
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
  }

  if (actualItem.type === 'interactive') {
    return (
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: '4px solid #f59e0b',
        marginBottom: '1.5rem'
      }}>
        <span style={{
          display: 'inline-block',
          background: '#f59e0b',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          🎮 Interaktiv
        </span>
        <h3 style={{ color: '#d97706', marginTop: 0, marginBottom: '1rem' }}>
          {actualItem.title}
        </h3>
        <p style={{ marginBottom: '1rem' }}>{actualItem.description}</p>
        <div dangerouslySetInnerHTML={{ __html: data.content || '' }} />
        <div style={{ 
          background: '#fef3c7', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          border: '1px solid #fed7aa',
          marginTop: '1rem'
        }}>
          🚧 Interaktive Komponente wird hier angezeigt
        </div>
      </div>
    )
  }

  if (actualItem.type === 'drag_drop') {
    return (
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: '4px solid #06b6d4',
        marginBottom: '1.5rem'
      }}>
        <span style={{
          display: 'inline-block',
          background: '#06b6d4',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          🎯 Drag & Drop
        </span>
        <h3 style={{ color: '#0891b2', marginTop: 0, marginBottom: '1rem' }}>
          {actualItem.title}
        </h3>
        <p style={{ marginBottom: '1rem' }}>{actualItem.description}</p>
        <div style={{ 
          background: '#cffafe', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          border: '1px solid #67e8f9'
        }}>
          🎯 Drag & Drop Aktivität wird hier angezeigt
        </div>
      </div>
    )
  }
  
  // Default renderer
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '2px solid #6b7280',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{ marginTop: 0 }}>{actualItem.title}</h3>
      <p>Type: {actualItem.type}</p>
      <pre style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.25rem' }}>
        {JSON.stringify(actualItem, null, 2)}
      </pre>
    </div>
  )
}

export default async function WorldPage({ params }: WorldPageProps) {
  const world = await getWorldData(params.slug)
  
  if (!world) {
    notFound()
  }

  const themeConfig = world.theme_config || {}
  const content = world.content || []

  return (
    <div style={{
      minHeight: '100vh',
      background: themeConfig.colors?.background || 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
      color: '#374151',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '2rem',
          background: `rgba(${themeConfig.colors?.primary ? 
            themeConfig.colors.primary.replace('#', '').match(/.{2}/g)?.map((x: string) => parseInt(x, 16)).join(', ') : 
            '16, 185, 129'}, 0.1)`,
          borderRadius: '1rem',
          border: `2px solid ${themeConfig.colors?.primary || '#10b981'}`
        }}>
          <h1 style={{
            color: themeConfig.colors?.primary || '#059669',
            fontSize: '2.5rem',
            marginBottom: '1rem'
          }}>
            {world.title}
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {world.description || `Fach: ${world.subject} ${world.grade_level ? `• Klasse ${world.grade_level}` : ''}`}
          </p>
        </div>

        {/* Learning Objectives */}
        {world.learning_objectives && world.learning_objectives.length > 0 && (
          <div style={{
            background: '#f0fdf4',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid #bbf7d0',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: '#059669', marginTop: 0 }}>🎯 Lernziele</h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {world.learning_objectives.map((objective: string, index: number) => (
                <li key={index} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content */}
        <div>
          {content.length > 0 ? (
            content.map((item: any, index: number) => (
              <ContentRenderer key={item.id || index} item={item} />
            ))
          ) : (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p>🌙 Diese Lernwelt wird noch mit magischen Inhalten gefüllt...</p>
            </div>
          )}
        </div>

        {/* Navigation Back */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          marginBottom: '2rem'
        }}>
          <a 
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: themeConfig.colors?.primary || '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold'
            }}
          >
            ← Zurück zur Hauptseite
          </a>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <p>🌙 Erstellt mit Meoluna - Wo Lernen zu Entdecken wird</p>
        </div>
      </div>
    </div>
  )
}