# PaddleOCR Service for Meoluna

FastAPI-basierter OCR-Service zur Textextraktion aus PDFs.

## Deployment auf Railway (Empfohlen - Kostenlos)

### 1. Railway Account erstellen
Gehe zu [railway.app](https://railway.app) und erstelle einen kostenlosen Account.

### 2. Neues Projekt erstellen
```bash
# Railway CLI installieren (optional)
npm install -g @railway/cli
railway login
```

### 3. Service deployen
1. Gehe zu [railway.app/new](https://railway.app/new)
2. Wähle "Deploy from GitHub repo"
3. Verbinde dein Meoluna Repository
4. Wähle den `paddleocr-service` Ordner als Root Directory
5. Railway erkennt automatisch das Dockerfile

### 4. URL kopieren
Nach dem Deployment erhältst du eine URL wie:
`https://paddleocr-service-production-xxxx.up.railway.app`

### 5. In Convex setzen
Gehe zum Convex Dashboard → Settings → Environment Variables:
```
PADDLEOCR_URL=https://paddleocr-service-production-xxxx.up.railway.app
```

---

## Lokale Entwicklung

### Mit Docker

```bash
# Build und Start
docker compose up -d

# Logs anzeigen
docker compose logs -f

# Stoppen
docker compose down
```

### Ohne Docker

```bash
# Python 3.10+ erforderlich
pip install -r requirements.txt

# Zusätzlich: poppler-utils installieren
# Ubuntu/Debian: sudo apt install poppler-utils
# macOS: brew install poppler
# Windows: Download von https://github.com/oschwartz10612/poppler-windows

# Server starten
python main.py
```

## API Endpoints

### Health Check
```bash
curl http://localhost:8001/health
```

### PDF Upload
```bash
curl -X POST "http://localhost:8001/extract-pdf" \
  -F "file=@dokument.pdf"
```

### Base64 PDF
```bash
curl -X POST "http://localhost:8001/extract-base64" \
  -H "Content-Type: application/json" \
  -d '{"pdf": "<base64-encoded-pdf>"}'
```

### Bild Upload
```bash
curl -X POST "http://localhost:8001/extract-image" \
  -F "file=@bild.png"
```

## Response Format

```json
{
  "success": true,
  "pages": 3,
  "markdown": "## Seite 1\n\nText der ersten Seite...\n\n---\n\n## Seite 2\n\n...",
  "structured": [
    {"page": 1, "text": "...", "line_count": 15},
    {"page": 2, "text": "...", "line_count": 20}
  ]
}
```

## Konfiguration

Umgebungsvariablen:
- `OCR_LANGUAGE`: Sprache für OCR (default: `german`)
- `TZ`: Zeitzone (default: `Europe/Berlin`)

## GPU Support

Für GPU-Beschleunigung:

1. NVIDIA Docker Runtime installieren
2. In `docker-compose.yml` GPU-Sektion einkommentieren
3. In `main.py`: `use_gpu=True` setzen

## Unterstützte Sprachen

PaddleOCR unterstützt 80+ Sprachen. Wichtige:
- `german` - Deutsch
- `en` - Englisch
- `french` - Französisch
- `latin` - Latein (wissenschaftliche Texte)

Vollständige Liste: https://github.com/PaddlePaddle/PaddleOCR/blob/main/doc/doc_en/multi_languages_en.md
