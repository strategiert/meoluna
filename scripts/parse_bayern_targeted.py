"""
Parse Bayern LehrplanPLUS Realschule - Targeted extraction for specific subjects
Based on TOC analysis - pages are 1-indexed in PDF
"""

import json
import os
import sys
from pathlib import Path
import sys

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

import pdfplumber
import anthropic

# Subject page ranges (1-indexed PDF pages)
# Format: subject_name: (start_page, end_page, grades_covered)
SUBJECT_RANGES = {
    "biologie": (418, 449, "5-10"),
    "chemie": (450, 481, "8-10"),
    "deutsch": (482, 522, "5-10"),
    "englisch": (523, 561, "5-10"),
    "geografie": (656, 684, "5-9"),
    "geschichte": (685, 718, "6-10"),
    "informatik": (719, 741, "5-10"),  # Informationstechnologie -> informatik
    "kunst": (817, 835, "5-10"),
    "mathematik": (836, 866, "5-10"),
    "musik": (867, 892, "5-10"),
    "physik": (912, 935, "7-10"),
}


def extract_pages(pdf_path, start_page, end_page):
    """Extract text from specific page range (1-indexed)"""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        # Convert to 0-indexed
        for i in range(start_page - 1, min(end_page, len(pdf.pages))):
            page_text = pdf.pages[i].extract_text() or ""
            text += f"\n--- Page {i+1} ---\n{page_text}"
    return text


def parse_subject_topics(text, subject, grades_info, bundesland="bayern"):
    """Use Claude to extract topics from a subject section"""
    client = anthropic.Anthropic()

    prompt = f"""Analysiere diesen Lehrplantext für {subject.upper()} und extrahiere ALLE konkreten Lernthemen.

Für jedes Thema erstelle:
- name: Prägnanter Titel (max 60 Zeichen)
- subject: "{subject}"
- gradeLevel: Klassenstufe (5-10, basierend auf Kapitelüberschriften wie "Deutsch 5", "Mathematik 7" etc.)
- keywords: 5-7 Schlagwörter (Array)
- bundesland: "{bundesland}"

REGELN:
1. Extrahiere KONKRETE Themen (z.B. "Bruchrechnung", "Fotosynthese", "Gedichtanalyse")
2. KEINE allgemeinen Kompetenzen oder Lernbereiche
3. Klassenstufe aus Überschriften erkennen (z.B. "Biologie 5" = gradeLevel: 5)
4. Jedes Thema einzeln, nicht gruppieren
5. Mindestens 3 Topics pro Klassenstufe

Klassenstufen in diesem Abschnitt: {grades_info}

Lehrplantext:
{text[:40000]}

Antworte NUR mit JSON-Array:
[{{"name": "...", "subject": "{subject}", "gradeLevel": 5, "keywords": [...], "bundesland": "{bundesland}"}}]
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )

        content = response.content[0].text
        start = content.find('[')
        end = content.rfind(']') + 1
        if start >= 0 and end > start:
            topics = json.loads(content[start:end])
            return [t for t in topics if t.get('name') and 5 <= t.get('gradeLevel', 0) <= 10]
    except Exception as e:
        print(f"  Error: {e}")
    return []


def main():
    raw_dir = project_root / "data" / "curricula" / "raw" / "bayern"
    parsed_dir = project_root / "data" / "curricula" / "parsed"
    parsed_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = raw_dir / "LehrplanPLUS%20Realschule%20-%20Oktober%202023.pdf"

    if not pdf_path.exists():
        print(f"ERROR: PDF not found")
        return

    print("=== Parsing Bayern LehrplanPLUS Realschule (Targeted) ===\n")

    # Force UTF-8 output
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    all_topics = []

    for subject, (start_page, end_page, grades) in SUBJECT_RANGES.items():
        print(f"Processing {subject} (pages {start_page}-{end_page}, grades {grades})...")

        text = extract_pages(pdf_path, start_page, end_page)
        print(f"  Extracted {len(text)} chars")

        topics = parse_subject_topics(text, subject, grades)
        print(f"  Found {len(topics)} topics")

        all_topics.extend(topics)

        # Small delay between API calls
        import time
        time.sleep(1)

    # Save results
    output = {
        "topics": all_topics,
        "source": "Bayern LehrplanPLUS Realschule Oktober 2023",
        "gradeRange": "5-10"
    }

    output_path = parsed_dir / "bayern_realschule_sek1.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n=== DONE ===")
    print(f"Total topics: {len(all_topics)}")
    print(f"Saved to: {output_path}")

    # Summary
    from collections import defaultdict
    subject_grades = defaultdict(lambda: defaultdict(int))
    for t in all_topics:
        subject_grades[t['subject']][t['gradeLevel']] += 1

    print("\nSummary:")
    for subj, grades in sorted(subject_grades.items()):
        grades_str = ", ".join(f"{g}:{c}" for g, c in sorted(grades.items()))
        print(f"  {subj}: {sum(grades.values())} topics ({grades_str})")


if __name__ == "__main__":
    main()
