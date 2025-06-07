export default function WorldAppRoot() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🌙 Meoluna Lernwelten
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Besuche eine spezifische Lernwelt über ihre URL
        </p>
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          fontSize: '0.9rem'
        }}>
          <p><strong>Beispiel:</strong></p>
          <p>http://localhost:3001/world/fluesterzahns-geheimnis</p>
          <p>oder</p>
          <p>https://fluesterzahns-geheimnis.meoluna.com</p>
        </div>
      </div>
    </div>
  )
}