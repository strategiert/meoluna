#!/usr/bin/env python3
"""
Meoluna Curriculum Parser
=========================
Parst Lehrplan-PDFs und extrahiert strukturierte Themen mit Claude API.

Usage:
    python parse_curriculum_pdfs.py [--bundesland bayern] [--limit 5] [--output topics.json]

Requirements:
    pip install anthropic pdfplumber tqdm
"""

import os
import json
import re
import argparse
from pathlib import Path
from typing import Optional
from datetime import datetime

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic nicht installiert. Bitte: pip install anthropic")
    exit(1)

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber nicht installiert. Bitte: pip install pdfplumber")
    exit(1)

try:
    from tqdm import tqdm
except ImportError:
    # Fallback ohne Progress Bar
    def tqdm(iterable, **kwargs):
        return iterable


# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Pfad zu den Curriculum PDFs
CURRICULUM_DIR = Path(__file__).parent.parent / "data" / "curricula" / "raw"

# Output-Verzeichnis
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "curricula" / "parsed"

# Fächer-Mapping (Dateiname-Keywords -> Subject Slug)
SUBJECT_MAPPING = {
    "mathematik": "mathematik",
    "mathe": "mathematik",
    "math": "mathematik",
    "deutsch": "deutsch",
    "englisch": "englisch",
    "english": "englisch",
    "biologie": "biologie",
    "bio": "biologie",
    "physik": "physik",
    "chemie": "chemie",
    "geschichte": "geschichte",
    "geografie": "geografie",
    "geographie": "geografie",
    "erdkunde": "geografie",
    "politik": "politik",
    "sozialkunde": "politik",
    "powi": "politik",
    "kunst": "kunst",
    "musik": "musik",
    "sport": "sport",
    "religion": "religion-ethik",
    "ethik": "religion-ethik",
    "informatik": "informatik",
    "sachunterricht": "sachunterricht",
    "sachkunde": "sachunterricht",
}

# Schulart-Mapping
SCHULART_MAPPING = {
    "grundschule": "grundschule",
    "gs": "grundschule",
    "prst": "grundschule",  # Primarstufe
    "primarstufe": "grundschule",
    "gymnasium": "gymnasium",
    "gym": "gymnasium",
    "gy": "gymnasium",
    "realschule": "realschule",
    "rs": "realschule",
    "hauptschule": "hauptschule",
    "hs": "hauptschule",
    "gesamtschule": "gesamtschule",
    "igs": "gesamtschule",
    "sek1": "sekundarstufe1",
    "sekundarstufe": "sekundarstufe1",
    "sek2": "sekundarstufe2",
    "oberstufe": "sekundarstufe2",
    "gost": "sekundarstufe2",
    "go": "sekundarstufe2",
}

# Claude System Prompt
EXTRACTION_PROMPT = """Du bist ein Experte für deutsche Schulcurricula. Analysiere diesen Lehrplan-Auszug und extrahiere die Themen/Lerneinheiten.

## AUFGABE
Extrahiere alle konkreten Lernthemen aus dem Text. Jedes Thema soll:
- Einem Fach zugeordnet sein
- Einer oder mehreren Klassenstufen zugeordnet sein
- Konkrete Keywords haben

## OUTPUT FORMAT (JSON)
```json
{
  "topics": [
    {
      "name": "Addition und Subtraktion bis 100",
      "subject": "mathematik",
      "gradeLevel": 2,
      "keywords": ["addieren", "subtrahieren", "plus", "minus", "rechnen"],
      "competencies": ["kann zweistellige Zahlen addieren", "kann Subtraktionsaufgaben lösen"]
    }
  ],
  "metadata": {
    "schulart": "grundschule",
    "bundesland": "bayern",
    "detected_subject": "mathematik",
    "detected_grades": [1, 2, 3, 4]
  }
}
```

## REGELN
1. Extrahiere NUR konkrete Lernthemen, keine allgemeinen Überschriften
2. Nutze deutsche Begriffe
3. Keywords sollen Suchbegriffe sein, die Schüler eingeben könnten
4. Kompetenzerwartungen aus dem Originaltext übernehmen (wenn vorhanden)
5. Bei unklarer Klassenstufe: schätze basierend auf Schwierigkeit
6. Antworte NUR mit validem JSON, keine Erklärungen

## FÄCHER-SLUGS
mathematik, deutsch, englisch, biologie, physik, chemie, geschichte, geografie, politik, kunst, musik, sport, religion-ethik, informatik, sachunterricht

## KLASSENSTUFEN
Grundschule: 1-4
Sekundarstufe I: 5-10
Sekundarstufe II / Oberstufe: 11-13
"""


# ==============================================================================
# PDF PROCESSING
# ==============================================================================

def extract_text_from_pdf(pdf_path: Path, max_pages: int = 30) -> str:
    """Extrahiert Text aus PDF (limitiert auf max_pages)."""
    text_parts = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages_to_process = min(len(pdf.pages), max_pages)

            for i in range(pages_to_process):
                page = pdf.pages[i]
                text = page.extract_text()
                if text:
                    text_parts.append(f"--- Seite {i+1} ---\n{text}")
    except Exception as e:
        print(f"  WARNUNG: PDF-Fehler bei {pdf_path.name}: {e}")
        return ""

    return "\n\n".join(text_parts)


def detect_metadata_from_filename(filename: str) -> dict:
    """Versucht Metadaten aus dem Dateinamen zu extrahieren."""
    filename_lower = filename.lower()

    metadata = {
        "subject": None,
        "schulart": None,
        "grades": [],
    }

    # Fach erkennen
    for keyword, slug in SUBJECT_MAPPING.items():
        if keyword in filename_lower:
            metadata["subject"] = slug
            break

    # Schulart erkennen
    for keyword, schulart in SCHULART_MAPPING.items():
        if keyword in filename_lower:
            metadata["schulart"] = schulart
            break

    # Klassenstufen erkennen (z.B. "klasse-5-6" oder "5-10")
    grade_patterns = [
        r'klasse[_\s-]*(\d+)(?:[_\s-]*(?:bis|[-–])?\s*(\d+))?',
        r'(\d+)(?:[_\s-]*(?:bis|[-–])\s*(\d+))',
        r'jahrgangsstufe[_\s-]*(\d+)',
    ]

    for pattern in grade_patterns:
        match = re.search(pattern, filename_lower)
        if match:
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else start
            metadata["grades"] = list(range(start, end + 1))
            break

    return metadata


def guess_grades_from_schulart(schulart: Optional[str]) -> list:
    """Schätzt Klassenstufen basierend auf Schulart."""
    if not schulart:
        return []

    schulart_lower = schulart.lower()

    if schulart_lower in ["grundschule", "primarstufe"]:
        return [1, 2, 3, 4]
    elif schulart_lower in ["sekundarstufe1", "realschule", "hauptschule"]:
        return [5, 6, 7, 8, 9, 10]
    elif schulart_lower in ["sekundarstufe2", "oberstufe", "gymnasium"]:
        return [11, 12, 13]
    elif schulart_lower == "gesamtschule":
        return [5, 6, 7, 8, 9, 10]

    return []


# ==============================================================================
# CLAUDE API
# ==============================================================================

def analyze_with_claude(client: anthropic.Anthropic, text: str, filename: str, bundesland: str) -> dict:
    """Analysiert den Text mit Claude und extrahiert Themen."""

    # Vorerkannte Metadaten aus Dateiname
    file_meta = detect_metadata_from_filename(filename)

    user_prompt = f"""Analysiere diesen Lehrplan-Auszug:

DATEINAME: {filename}
BUNDESLAND: {bundesland}
VERMUTETES FACH: {file_meta.get('subject', 'unbekannt')}
VERMUTETE SCHULART: {file_meta.get('schulart', 'unbekannt')}

=== LEHRPLAN-TEXT ===
{text[:25000]}
=== ENDE TEXT ===

Extrahiere alle Lernthemen als JSON."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            system=EXTRACTION_PROMPT,
            messages=[{"role": "user", "content": user_prompt}]
        )

        content = response.content[0].text

        # JSON extrahieren (manchmal in Markdown-Blöcken)
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
        if json_match:
            content = json_match.group(1)

        result = json.loads(content)

        # Bundesland hinzufügen falls nicht vorhanden
        if "metadata" not in result:
            result["metadata"] = {}
        result["metadata"]["bundesland"] = bundesland
        result["metadata"]["source_file"] = filename

        return result

    except json.JSONDecodeError as e:
        print(f"  WARNUNG: JSON-Parsing fehlgeschlagen für {filename}: {e}")
        return {"topics": [], "metadata": {"error": str(e), "source_file": filename}}
    except Exception as e:
        print(f"  FEHLER bei Claude API für {filename}: {e}")
        return {"topics": [], "metadata": {"error": str(e), "source_file": filename}}


# ==============================================================================
# MAIN PROCESSING
# ==============================================================================

def find_pdf_files(base_dir: Path, bundesland: Optional[str] = None) -> list:
    """Findet alle PDF-Dateien, optional gefiltert nach Bundesland."""
    pdf_files = []

    if bundesland:
        # Nur spezifisches Bundesland
        bl_dir = base_dir / bundesland.lower().replace(" ", "-")
        if bl_dir.exists():
            pdf_files = list(bl_dir.glob("*.pdf"))
    else:
        # Alle Bundesländer
        for bl_dir in base_dir.iterdir():
            if bl_dir.is_dir():
                pdf_files.extend(bl_dir.glob("*.pdf"))

    return pdf_files


def process_pdfs(
    api_key: str,
    bundesland: Optional[str] = None,
    limit: Optional[int] = None,
    output_file: Optional[str] = None
) -> dict:
    """Hauptfunktion: Verarbeitet PDFs und extrahiert Themen."""

    client = anthropic.Anthropic(api_key=api_key)

    # PDFs finden
    pdf_files = find_pdf_files(CURRICULUM_DIR, bundesland)

    if not pdf_files:
        print(f"Keine PDFs gefunden in {CURRICULUM_DIR}")
        return {"topics": [], "metadata": {}}

    print(f"Gefunden: {len(pdf_files)} PDFs")

    if limit:
        pdf_files = pdf_files[:limit]
        print(f"Limitiert auf: {limit} PDFs")

    # Ergebnisse sammeln
    all_topics = []
    processed_files = []
    errors = []

    for pdf_path in tqdm(pdf_files, desc="Verarbeite PDFs"):
        # Bundesland aus Pfad extrahieren
        bl = pdf_path.parent.name

        print(f"\nVerarbeite: {pdf_path.name} ({bl})")

        # Text extrahieren
        text = extract_text_from_pdf(pdf_path)

        if not text or len(text) < 100:
            print(f"  Übersprungen: Zu wenig Text")
            errors.append({"file": pdf_path.name, "error": "Zu wenig Text extrahiert"})
            continue

        # Mit Claude analysieren
        result = analyze_with_claude(client, text, pdf_path.name, bl)

        topics_count = len(result.get("topics", []))
        print(f"  Extrahiert: {topics_count} Themen")

        # Themen mit Bundesland anreichern
        for topic in result.get("topics", []):
            topic["bundesland"] = bl
            topic["sourceUrl"] = str(pdf_path)
            all_topics.append(topic)

        processed_files.append({
            "file": pdf_path.name,
            "bundesland": bl,
            "topics_extracted": topics_count,
        })

    # Ergebnis zusammenstellen
    final_result = {
        "topics": all_topics,
        "metadata": {
            "total_topics": len(all_topics),
            "processed_files": len(processed_files),
            "errors": len(errors),
            "timestamp": datetime.now().isoformat(),
            "files": processed_files,
        }
    }

    # Speichern
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output_path = OUTPUT_DIR / (output_file or f"topics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_result, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"FERTIG!")
    print(f"  Verarbeitete PDFs: {len(processed_files)}")
    print(f"  Extrahierte Themen: {len(all_topics)}")
    print(f"  Fehler: {len(errors)}")
    print(f"  Output: {output_path}")

    return final_result


# ==============================================================================
# CLI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Extrahiert Themen aus Curriculum-PDFs mit Claude API"
    )
    parser.add_argument(
        "--bundesland", "-b",
        help="Nur PDFs aus diesem Bundesland verarbeiten (z.B. 'bayern')"
    )
    parser.add_argument(
        "--limit", "-l",
        type=int,
        help="Maximale Anzahl PDFs zu verarbeiten"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output-Dateiname (Standard: topics_TIMESTAMP.json)"
    )
    parser.add_argument(
        "--api-key", "-k",
        help="Anthropic API Key (oder ANTHROPIC_API_KEY Umgebungsvariable)"
    )

    args = parser.parse_args()

    # API Key
    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY")

    if not api_key:
        print("ERROR: Kein API Key. Nutze --api-key oder setze ANTHROPIC_API_KEY")
        exit(1)

    # Verarbeiten
    process_pdfs(
        api_key=api_key,
        bundesland=args.bundesland,
        limit=args.limit,
        output_file=args.output
    )


if __name__ == "__main__":
    main()
