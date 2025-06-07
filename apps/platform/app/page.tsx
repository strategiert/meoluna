'use client'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🌙 Meoluna
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Wo Lernen zu Entdecken wird
        </p>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Transformiere Klassenarbeiten in magische Lernwelten
          </h2>
          <p style={{ opacity: 0.8 }}>
            Jede Lernwelt ist ein einzigartiges Universum, thematisch perfekt abgestimmt 
            und als eigenständige Web-App erreichbar.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href="/create"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Lernwelt erstellen
          </a>
          <a 
            href="/gallery"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Galerie entdecken
          </a>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}>
          ✨ KI-generierte Inhalte • 🎨 Thematische Welten • 📊 Analytics Dashboard
        </div>
      </div>
    </div>
  )
}