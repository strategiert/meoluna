# Meoluna Scripts

## Curriculum Parser Pipeline

Diese Scripts extrahieren Themen aus den gesammelten Lehrplan-PDFs und importieren sie in die Convex-Datenbank.

### Übersicht

```
data/curricula/raw/       ──[parse_curriculum_pdfs.py]──►  data/curricula/parsed/
   197 PDFs                                                   topics.json

data/curricula/parsed/    ──[import_topics_to_convex.py]──►  Convex DB (topics table)
   topics.json
```

### 1. PDFs parsen

```bash
# Alle PDFs parsen (dauert lange!)
python scripts/parse_curriculum_pdfs.py

# Nur Bayern parsen
python scripts/parse_curriculum_pdfs.py --bundesland bayern

# Nur 5 PDFs testen
python scripts/parse_curriculum_pdfs.py --limit 5

# Mit eigenem API-Key
python scripts/parse_curriculum_pdfs.py --api-key sk-ant-...
```

**Requirements:**
```bash
pip install anthropic pdfplumber tqdm
```

**Output:** `data/curricula/parsed/topics_TIMESTAMP.json`

### 2. Topics importieren

```bash
# Neueste JSON-Datei importieren
python scripts/import_topics_to_convex.py

# Bestimmte Datei importieren
python scripts/import_topics_to_convex.py data/curricula/parsed/topics_20260205.json

# Dry Run (nur simulieren)
python scripts/import_topics_to_convex.py --dry-run

# Nur Mathematik importieren
python scripts/import_topics_to_convex.py --subject mathematik

# Verfügbare Dateien auflisten
python scripts/import_topics_to_convex.py --list
```

### Topic-Format

```json
{
  "topics": [
    {
      "name": "Addition und Subtraktion bis 100",
      "subject": "mathematik",
      "gradeLevel": 2,
      "keywords": ["addieren", "subtrahieren", "rechnen"],
      "competencies": ["kann zweistellige Zahlen addieren"],
      "bundesland": "bayern",
      "sourceUrl": "path/to/pdf"
    }
  ]
}
```

### Subjects (Fächer)

Die folgenden Subject-Slugs werden unterstützt:

| Slug | Name |
|------|------|
| `mathematik` | Mathematik |
| `deutsch` | Deutsch |
| `englisch` | Englisch |
| `biologie` | Biologie |
| `physik` | Physik |
| `chemie` | Chemie |
| `geschichte` | Geschichte |
| `geografie` | Geografie |
| `politik` | Politik/Sozialkunde |
| `kunst` | Kunst |
| `musik` | Musik |
| `sport` | Sport |
| `religion-ethik` | Religion/Ethik |
| `informatik` | Informatik |
| `sachunterricht` | Sachunterricht |

### Kimi Agent Swarm Integration

Die exportierte JSON-Datei kann an Kimi's Agent Swarm übergeben werden um:
1. Lernwelten für jedes Thema vorzugenerieren
2. Qualitätsprüfungen durchzuführen
3. Parallel mehrere Welten zu erstellen

### Troubleshooting

**"anthropic nicht installiert"**
```bash
pip install anthropic pdfplumber tqdm
```

**"ANTHROPIC_API_KEY nicht gesetzt"**
```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Oder direkt übergeben
python scripts/parse_curriculum_pdfs.py --api-key sk-ant-...
```

**"Keine Topics in Datei"**
- Prüfe ob die PDFs Text enthalten (keine Scans)
- Prüfe die Logs auf Fehler

**Convex-Import schlägt fehl**
- Stelle sicher dass `npx convex` funktioniert
- Prüfe ob du eingeloggt bist: `npx convex dev`
