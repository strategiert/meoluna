interface SimplePageProps {
  params: {
    slug: string
  }
}

export default function SimplePage({ params }: SimplePageProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
      color: '#374151',
      fontFamily: 'Inter, sans-serif',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center',
        background: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          color: '#059669',
          marginBottom: '1rem'
        }}>
          🌍 Hallo World!
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Dynamic Route funktioniert perfekt!
        </p>
        
        <div style={{
          background: '#f0fdf4',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #bbf7d0',
          marginBottom: '2rem'
        }}>
          <p style={{ color: '#059669', margin: 0 }}>
            <strong>Slug:</strong> <code>{params.slug}</code>
          </p>
        </div>

        <div style={{
          background: '#e0f2fe',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #bae6fd',
          marginBottom: '2rem'
        }}>
          <p style={{ color: '#0369a1', margin: 0 }}>
            ✅ <strong>Test erfolgreich:</strong> Das Dynamic Routing funktioniert!
          </p>
        </div>
        
        <a 
          href="/simple-test"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            marginRight: '1rem'
          }}
        >
          ← Zurück zum Test
        </a>
        
        <a 
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: 'bold'
          }}
        >
          🏠 Hauptseite
        </a>
      </div>
    </div>
  )
}