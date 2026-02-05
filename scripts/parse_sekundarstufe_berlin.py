"""
Parse Berlin Rahmenlehrplan PDFs for Sekundarstufe I (Klasse 5-10)
"""

import json
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load .env
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    os.system("pip install pdfplumber")
    import pdfplumber

try:
    import anthropic
except ImportError:
    print("Installing anthropic...")
    os.system("pip install anthropic")
    import anthropic


def extract_text_from_pdf(pdf_path, max_pages=50):
    """Extract text from PDF using pdfplumber"""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages[:max_pages]):
            page_text = page.extract_text() or ""
            text += f"\n--- Page {i+1} ---\n{page_text}"
    return text


def parse_curriculum_with_claude(text, subject, bundesland="berlin"):
    """Use Claude to extract curriculum topics from text"""
    client = anthropic.Anthropic()

    prompt = f"""Analysiere den folgenden Lehrplantext für {subject} und extrahiere alle Lernthemen.

Für jedes Thema erstelle einen Eintrag mit:
- name: Prägnanter Titel des Themas (max 60 Zeichen)
- subject: "{subject}" (kleingeschrieben)
- gradeLevel: Klassenstufe (5-10, basierend auf Kontext)
- keywords: 5-7 relevante Schlagwörter (Array)
- bundesland: "{bundesland}"

WICHTIG:
- Extrahiere konkrete Lernthemen, KEINE Kompetenzbeschreibungen
- Klassenstufe MUSS zwischen 5 und 10 liegen
- Jedes Thema sollte ein konkretes Lernziel beschreiben
- Gruppiere ähnliche Themen nicht zusammen - jedes Thema einzeln

Lehrplantext:
{text[:40000]}

Antworte NUR mit einem JSON-Array der Topics, ohne weitere Erklärung:
[{{"name": "...", "subject": "{subject}", "gradeLevel": 5, "keywords": [...], "bundesland": "{bundesland}"}}]
"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )

    # Extract JSON from response
    content = response.content[0].text
    # Find JSON array in response
    start = content.find('[')
    end = content.rfind(']') + 1
    if start >= 0 and end > start:
        try:
            topics = json.loads(content[start:end])
            return topics
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            return []
    return []


def main():
    raw_dir = project_root / "data" / "curricula" / "raw" / "berlin"
    parsed_dir = project_root / "data" / "curricula" / "parsed"
    parsed_dir.mkdir(parents=True, exist_ok=True)

    # PDFs to parse
    pdfs_to_parse = [
        # Math 1-10 (we need 5-10)
        ("rahmenlehrplan-teil-c_mathe-1-10.pdf", "mathematik"),
        # Deutsch 1-10 (we need 5-10)
        ("rlp-deutsch_1-10-teil-c.pdf", "deutsch"),
        # Modern foreign languages (includes Englisch for Grundschule)
        ("moderne-fremdsprachen-teil-c.pdf", "englisch"),
    ]

    all_topics = []

    for pdf_name, subject in pdfs_to_parse:
        pdf_path = raw_dir / pdf_name
        if not pdf_path.exists():
            print(f"SKIP: {pdf_name} not found")
            continue

        print(f"\n=== Processing {pdf_name} ({subject}) ===")

        # Extract text
        text = extract_text_from_pdf(pdf_path)
        print(f"Extracted {len(text)} chars from {pdf_name}")

        # Parse with Claude
        topics = parse_curriculum_with_claude(text, subject)

        # Filter to only Sekundarstufe I (5-10)
        sek1_topics = [t for t in topics if 5 <= t.get('gradeLevel', 0) <= 10]

        print(f"Found {len(topics)} topics, {len(sek1_topics)} for grades 5-10")
        all_topics.extend(sek1_topics)

    # Save all topics
    output = {
        "topics": all_topics,
        "source": "Berlin Rahmenlehrplan Teil C",
        "gradeRange": "5-10"
    }

    output_path = parsed_dir / "berlin_sekundarstufe_i.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n=== DONE ===")
    print(f"Total topics: {len(all_topics)}")
    print(f"Saved to: {output_path}")

    # Print summary by subject and grade
    from collections import defaultdict
    subject_grades = defaultdict(lambda: defaultdict(int))
    for t in all_topics:
        subject_grades[t['subject']][t['gradeLevel']] += 1

    print("\nSummary:")
    for subj, grades in sorted(subject_grades.items()):
        print(f"  {subj}: {dict(sorted(grades.items()))}")


if __name__ == "__main__":
    main()
