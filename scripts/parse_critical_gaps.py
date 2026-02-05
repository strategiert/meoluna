"""
Parse critical curriculum gaps:
1. Deutsch 8-13 (Bayern Realschule 8-10 + Hessen Oberstufe 11-13)
2. Mathematik 11-13 (Hessen Oberstufe)
3. Englisch 3-4 (Grundschule)
4. Sport, Politik, Ethik basics
"""

import json
import os
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
1. Extrahiere KONKRETE Themen (z.B. "Kurvendiskussion", "Expressionismus", "Conditional Clauses")
2. Klassenstufe aus Kontext erkennen (E-Phase=11, Q1/Q2=12, Q3/Q4=13)
3. Mindestens 5 Topics pro Klassenstufe wenn möglich
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

    # 1. Deutsch Oberstufe (Hessen) - Klasse 11-13
    print("=== Deutsch Oberstufe (Hessen) ===")
    pdf_path = raw_dir / "hessen" / "kerncurriculum_gymnasiale_oberstufe-deutsch.pdf"
    if pdf_path.exists():
        text = extract_pages(pdf_path)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "deutsch", "11, 12, 13", "hessen")
        # Ensure grade levels are correct
        for t in topics:
            if t.get('gradeLevel', 0) < 11:
                t['gradeLevel'] = 11
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # 2. Mathematik Oberstufe (Hessen) - Klasse 11-13
    print("\n=== Mathematik Oberstufe (Hessen) ===")
    pdf_path = raw_dir / "hessen" / "kerncurriculum_gymnasiale_oberstufe-mathematik.pdf"
    if pdf_path.exists():
        text = extract_pages(pdf_path)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "mathematik", "11, 12, 13", "hessen")
        for t in topics:
            if t.get('gradeLevel', 0) < 11:
                t['gradeLevel'] = 11
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # 3. Deutsch 8-10 from Bayern (re-parse those specific pages)
    print("\n=== Deutsch 8-10 (Bayern Realschule) ===")
    pdf_path = raw_dir / "bayern" / "LehrplanPLUS%20Realschule%20-%20Oktober%202023.pdf"
    if pdf_path.exists():
        # Pages 503-522 are Deutsch 8-10 based on TOC
        text = extract_pages(pdf_path, 503, 522)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "deutsch", "8, 9, 10", "bayern")
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # 4. Kunst Oberstufe (Hessen)
    print("\n=== Kunst Oberstufe (Hessen) ===")
    pdf_path = raw_dir / "hessen" / "kerncurriculum_gymnasiale_oberstufe-kunst.pdf"
    if pdf_path.exists():
        text = extract_pages(pdf_path)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "kunst", "11, 12, 13", "hessen")
        for t in topics:
            if t.get('gradeLevel', 0) < 11:
                t['gradeLevel'] = 11
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # 5. Musik Oberstufe (check if exists)
    print("\n=== Musik Oberstufe (Hessen) ===")
    pdf_path = raw_dir / "hessen" / "kernkurriculum_gymnasiale_oberstufe-musik.pdf"
    if pdf_path.exists():
        text = extract_pages(pdf_path)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "musik", "10, 11, 12, 13", "hessen")
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)
    else:
        print("  PDF not found")

    # 6. Informatik Oberstufe
    print("\n=== Informatik Oberstufe (Hessen) ===")
    pdf_path = raw_dir / "hessen" / "kernkurriculum_gymnasiale_oberstufe-informatik.pdf"
    if pdf_path.exists():
        text = extract_pages(pdf_path)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "informatik", "11, 12, 13", "hessen")
        for t in topics:
            if t.get('gradeLevel', 0) < 11:
                t['gradeLevel'] = 11
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)
    else:
        print("  PDF not found")

    # 7. Ethik (for Religion/Ethik gap)
    print("\n=== Ethik Oberstufe (Hessen) ===")
    pdf_path = raw_dir / "hessen" / "kernkurriculum_gymnasiale_oberstufe-ethik.pdf"
    if pdf_path.exists():
        text = extract_pages(pdf_path)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "ethik", "11, 12, 13", "hessen")
        # Map to religion-ethik
        for t in topics:
            t['subject'] = 'religion-ethik'
            if t.get('gradeLevel', 0) < 11:
                t['gradeLevel'] = 11
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)
    else:
        print("  PDF not found")

    # 8. Politik (from Bayern Soziallehre or Hessen)
    print("\n=== Politik (Hessen) ===")
    pdf_path = raw_dir / "hessen" / "kernkurriculum_gymnasiale_oberstufe-politik_und_wirtschaft.pdf"
    if pdf_path.exists():
        text = extract_pages(pdf_path)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "politik", "11, 12, 13", "hessen")
        for t in topics:
            if t.get('gradeLevel', 0) < 11:
                t['gradeLevel'] = 11
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)
    else:
        print("  PDF not found")

    # 9. Sport (from Bayern Realschule)
    print("\n=== Sport (Bayern Realschule) ===")
    pdf_path = raw_dir / "bayern" / "LehrplanPLUS%20Realschule%20-%20Oktober%202023.pdf"
    if pdf_path.exists():
        # Pages 998-1061 are Sport based on TOC
        text = extract_pages(pdf_path, 998, 1030)
        print(f"  Extracted {len(text)} chars")
        topics = parse_with_claude(text, "sport", "5, 6, 7, 8, 9, 10", "bayern")
        print(f"  Found {len(topics)} topics")
        all_topics.extend(topics)

    # Save results
    output = {
        "topics": all_topics,
        "source": "Critical gaps fill - Mixed sources",
        "date": "2026-02-05"
    }

    output_path = parsed_dir / "critical_gaps.json"
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
        print(f"  {subj}: {sum(grades.values())} ({grades_str})")


if __name__ == "__main__":
    main()
