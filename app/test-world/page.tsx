export default function TestWorldPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
      color: '#374151',
      fontFamily: 'Inter, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '1rem',
          border: '2px solid #10b981',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: '#059669',
            fontSize: '2.5rem',
            marginBottom: '1rem'
          }}>
            🧪 Test-Lernwelt
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#6b7280'
          }}>
            Diese einfache Test-Seite prüft das Routing-System
          </p>
        </div>

        {/* Content */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#059669', marginBottom: '1rem' }}>
            ✅ Routing funktioniert!
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Diese Seite wird erfolgreich über die Next.js Route angezeigt.
          </p>
          
          <div style={{
            background: '#f0fdf4',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #bbf7d0',
            marginTop: '1.5rem'
          }}>
            <p style={{ color: '#059669', margin: 0 }}>
              🎯 <strong>Test erfolgreich:</strong> Die statische Route funktioniert korrekt
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <a 
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#10b981',
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
          marginTop: '3rem',
          padding: '1rem',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          <p>🌙 Meoluna Test-Umgebung</p>
          <p>Route: <code>/test-world</code></p>
        </div>
      </div>
    </div>
  )
}