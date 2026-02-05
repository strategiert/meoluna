#!/usr/bin/env python3
"""
Meoluna Topic Importer
======================
Importiert extrahierte Themen aus JSON in Convex.

Usage:
    python import_topics_to_convex.py topics.json [--batch-size 50] [--dry-run]

Requirements:
    pip install requests
"""

import os
import json
import re
import argparse
from pathlib import Path
from typing import Optional
import subprocess
import sys


# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Parsed topics directory
PARSED_DIR = Path(__file__).parent.parent / "data" / "curricula" / "parsed"

# Slug-Generator
def generate_slug(name: str) -> str:
    """Generiert URL-freundlichen Slug aus Name."""
    slug = name.lower()
    slug = re.sub(r'[äÄ]', 'ae', slug)
    slug = re.sub(r'[öÖ]', 'oe', slug)
    slug = re.sub(r'[üÜ]', 'ue', slug)
    slug = re.sub(r'ß', 'ss', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = re.sub(r'^-|-$', '', slug)
    return slug


# ==============================================================================
# CONVEX IMPORT
# ==============================================================================

def import_batch_to_convex(topics: list, dry_run: bool = False) -> dict:
    """
    Importiert einen Batch von Topics nach Convex via CLI.

    Args:
        topics: Liste von Topic-Objekten
        dry_run: Wenn True, nur simulieren

    Returns:
        dict mit imported count und errors
    """
    if not topics:
        return {"imported": 0, "errors": []}

    # Topics für Convex formatieren
    formatted_topics = []

    for topic in topics:
        # Pflichtfelder prüfen
        if not topic.get("name") or not topic.get("subject"):
            continue

        formatted = {
            "subjectSlug": topic.get("subject"),
            "name": topic.get("name"),
            "slug": generate_slug(topic.get("name")),
            "gradeLevel": topic.get("gradeLevel", 5),  # Default: Klasse 5
            "keywords": topic.get("keywords", []),
        }

        # Optionale Felder
        if topic.get("bundesland"):
            formatted["bundesland"] = topic["bundesland"]
        if topic.get("competencies"):
            formatted["competencies"] = topic["competencies"]
        if topic.get("sourceUrl"):
            formatted["sourceUrl"] = topic["sourceUrl"]

        formatted_topics.append(formatted)

    if dry_run:
        print(f"  [DRY RUN] Würde {len(formatted_topics)} Topics importieren")
        return {"imported": len(formatted_topics), "errors": [], "dry_run": True}

    # Convex mutation aufrufen
    try:
        # JSON für Convex CLI vorbereiten
        arg_json = json.dumps({"topics": formatted_topics})

        result = subprocess.run(
            ["npx", "convex", "run", "curriculum:batchImportTopics", arg_json],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent.parent)
        )

        if result.returncode != 0:
            print(f"  FEHLER: {result.stderr}")
            return {"imported": 0, "errors": [result.stderr]}

        # Result parsen
        try:
            response = json.loads(result.stdout)
            return {"imported": response.get("imported", 0), "errors": []}
        except json.JSONDecodeError:
            # Manchmal gibt Convex nur Text zurück
            match = re.search(r'"imported":\s*(\d+)', result.stdout)
            if match:
                return {"imported": int(match.group(1)), "errors": []}
            return {"imported": len(formatted_topics), "errors": []}

    except Exception as e:
        print(f"  FEHLER: {e}")
        return {"imported": 0, "errors": [str(e)]}


def import_topics(
    input_file: Path,
    batch_size: int = 50,
    dry_run: bool = False,
    subject_filter: Optional[str] = None
) -> dict:
    """
    Importiert Topics aus JSON-Datei in Convex.

    Args:
        input_file: Pfad zur JSON-Datei mit Topics
        batch_size: Anzahl Topics pro Batch
        dry_run: Wenn True, nur simulieren
        subject_filter: Nur Topics dieses Fachs importieren

    Returns:
        dict mit Statistiken
    """

    # JSON laden
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    topics = data.get("topics", [])

    if not topics:
        print("Keine Topics in der Datei gefunden!")
        return {"total": 0, "imported": 0, "errors": 0}

    print(f"Gefunden: {len(topics)} Topics")

    # Optional filtern
    if subject_filter:
        topics = [t for t in topics if t.get("subject") == subject_filter]
        print(f"Gefiltert auf {subject_filter}: {len(topics)} Topics")

    # In Batches aufteilen und importieren
    total_imported = 0
    total_errors = 0
    batches = [topics[i:i + batch_size] for i in range(0, len(topics), batch_size)]

    print(f"Importiere in {len(batches)} Batches à {batch_size} Topics...")

    for i, batch in enumerate(batches):
        print(f"\nBatch {i+1}/{len(batches)} ({len(batch)} Topics)")

        result = import_batch_to_convex(batch, dry_run)

        total_imported += result.get("imported", 0)
        total_errors += len(result.get("errors", []))

        if result.get("errors"):
            for err in result["errors"]:
                print(f"  ERROR: {err}")

    # Zusammenfassung
    print(f"\n{'='*50}")
    print(f"IMPORT ABGESCHLOSSEN{'(DRY RUN)' if dry_run else ''}")
    print(f"  Total Topics: {len(topics)}")
    print(f"  Importiert: {total_imported}")
    print(f"  Fehler: {total_errors}")

    return {
        "total": len(topics),
        "imported": total_imported,
        "errors": total_errors,
        "dry_run": dry_run
    }


# ==============================================================================
# CLI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Importiert extrahierte Topics nach Convex"
    )
    parser.add_argument(
        "input_file",
        nargs="?",
        help="JSON-Datei mit Topics (oder 'latest' für neueste)"
    )
    parser.add_argument(
        "--batch-size", "-b",
        type=int,
        default=50,
        help="Anzahl Topics pro Batch (Standard: 50)"
    )
    parser.add_argument(
        "--dry-run", "-d",
        action="store_true",
        help="Nur simulieren, nicht wirklich importieren"
    )
    parser.add_argument(
        "--subject", "-s",
        help="Nur Topics dieses Fachs importieren (z.B. 'mathematik')"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="Verfügbare JSON-Dateien auflisten"
    )

    args = parser.parse_args()

    # JSON-Dateien auflisten
    if args.list:
        print("Verfügbare Topic-Dateien:")
        for f in sorted(PARSED_DIR.glob("*.json")):
            with open(f, "r", encoding="utf-8") as file:
                data = json.load(file)
                topic_count = len(data.get("topics", []))
            print(f"  {f.name} ({topic_count} Topics)")
        return

    # Input-Datei bestimmen
    if not args.input_file or args.input_file == "latest":
        # Neueste Datei finden
        json_files = sorted(PARSED_DIR.glob("*.json"))
        if not json_files:
            print(f"Keine JSON-Dateien in {PARSED_DIR}")
            print("Führe zuerst parse_curriculum_pdfs.py aus!")
            sys.exit(1)
        input_file = json_files[-1]
        print(f"Verwende neueste Datei: {input_file.name}")
    else:
        input_file = Path(args.input_file)
        if not input_file.is_absolute():
            # Relative Pfade im PARSED_DIR suchen
            if (PARSED_DIR / args.input_file).exists():
                input_file = PARSED_DIR / args.input_file

    if not input_file.exists():
        print(f"Datei nicht gefunden: {input_file}")
        sys.exit(1)

    # Importieren
    import_topics(
        input_file=input_file,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
        subject_filter=args.subject
    )


if __name__ == "__main__":
    main()
