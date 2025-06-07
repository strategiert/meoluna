const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🌙 Meoluna - Test</title>
      <style>
        body { 
          font-family: Inter, sans-serif; 
          margin: 0; 
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .container {
          max-width: 600px;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌙 Meoluna</h1>
        <p>KI-Lernwelt Generator ist bereit!</p>
        <p>✅ Dependencies installiert</p>
        <p>✅ Server läuft</p>
        <p>🔧 Konfiguration der .env.local noch erforderlich</p>
        <br>
        <p><strong>Hauptserver:</strong> <a href="http://localhost:3002" style="color: #60a5fa;">localhost:3002</a></p>
        <p><strong>Lernwelten:</strong> <a href="http://localhost:3001" style="color: #60a5fa;">localhost:3001</a></p>
      </div>
    </body>
    </html>
  `);
});

server.listen(3003, () => {
  console.log('🌙 Meoluna Test-Server läuft auf http://localhost:3003');
});