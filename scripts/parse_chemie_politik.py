"""
Parse Chemie (7, 10) and Politik (5-10) gaps
"""

import json
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

import pdfplumber
import anthropic

sys.stdout.reconfigure(encoding='utf-8')


def extract_pages(pdf_path, start_page=1, end_page=None):
    """Extract text from PDF pages (1-indexed)"""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        if end_page is None:
            end_page = len(pdf.pages)
        for i in range(start_page - 1, min(end_page, len(pdf.pages))):
            page_text = pdf.pages[i].extract_text() or ""
            text += f"\n--- Page {i+1} ---\n{page_text}"
    return text


def parse_with_claude(text, subject, grade_range, bundesland):
    """Parse curriculum text with Claude"""
    client = anthropic.Anthropic()

    prompt = f"""Analysiere diesen Lehrplantext für {subject.upper()} und extrahiere ALLE konkreten Lernthemen.

Für jedes Thema:
- name: Prägnanter Titel (max 60 Zeichen)
- subject: "{subject}"
- gradeLevel: Klassenstufe ({grade_range})
- keywords: 5-7 Schlagwörter
- bundesland: "{bundesland}"

REGELN:
1. Extrahiere KONKRETE Themen (z.B. "Säuren und Basen", "Demokratie in Deutschland")
2. Klassenstufe aus Kontext erkennen
3. Mindestens 5 Topics pro Klassenstufe
4. KEINE allgemeinen Kompetenzen

Text:
{text[:40000]}

Antworte NUR mit JSON-Array:
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
            return [t for t in topics if t.get('name')]
    except Exception as e:
        print(f"  Error: {e}")
    return []


def main():
    raw_dir = project_root / "data" / "curricula" / "raw"
    parsed_dir = project_root / "data" / "curricula" / "parsed"

    all_topics = []

    # Bayern Realschule PDF
    bayern_pdf = raw_dir / "bayern" / "LehrplanPLUS%20Realschule%20-%20Oktober%202023.pdf"

    # 1. Chemie 10 from Bayern (pages 469-481 based on TOC)
    print("=== Chemie 10 (Bayern) ===")
    if bayern_pdf.exists():
        text = extract_pages(bayern_pdf, 469, 481)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "chemie", "10", "bayern")
        # Force grade 10
        for t in topics:
            t['gradeLevel'] = 10
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # 2. Politik/Sozialkunde 5-10 from Bayern
    # Politik und Gesellschaft is at page 936, but that's only grade 10
    # Soziallehre is at pages 940-952
    print("\n=== Politik/Sozialkunde (Bayern Soziallehre) ===")
    if bayern_pdf.exists():
        text = extract_pages(bayern_pdf, 940, 965)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "politik", "7, 8, 9, 10", "bayern")
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # 3. Politik und Gesellschaft 10
    print("\n=== Politik und Gesellschaft 10 (Bayern) ===")
    if bayern_pdf.exists():
        text = extract_pages(bayern_pdf, 936, 940)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "politik", "10", "bayern")
        for t in topics:
            t['gradeLevel'] = 10
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # 4. Ethik 5-10 from Bayern (pages 579-607)
    print("\n=== Ethik 5-10 (Bayern) - für Politik-Grundlagen ===")
    if bayern_pdf.exists():
        text = extract_pages(bayern_pdf, 579, 607)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "politik", "5, 6, 7, 8, 9, 10", "bayern")
        # Filter out pure ethics, keep political topics
        political_topics = [t for t in topics if any(kw in str(t.get('keywords', [])).lower()
                          for kw in ['demokrat', 'gesellschaft', 'staat', 'recht', 'politik', 'bürger', 'wahlen'])]
        print(f"  Found {len(political_topics)} political topics")
        all_topics.extend(political_topics)

    # Save results
    output = {
        "topics": all_topics,
        "source": "Chemie and Politik gaps fill",
        "date": "2026-02-05"
    }

    output_path = parsed_dir / "chemie_politik_gaps.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n=== DONE ===")
    print(f"Total topics: {len(all_topics)}")

    # Summary
    from collections import defaultdict
    subject_grades = defaultdict(lambda: defaultdict(int))
    for t in all_topics:
        subject_grades[t['subject']][t['gradeLevel']] += 1

    print("\nSummary:")
    for subj, grades in sorted(subject_grades.items()):
        grades_str = ", ".join(f"{g}:{c}" for g, c in sorted(grades.items()))
        print(f"  {subj}: {sum(grades.values())} ({grades_str})")


if __name__ == "__main__":
    main()
