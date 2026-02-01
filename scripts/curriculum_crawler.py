#!/usr/bin/env python3
"""
Schulcurricula Crawler für Meoluna
Sammelt Lehrpläne aller 16 Bundesländer
"""

import sys
# Unbuffered output
sys.stdout.reconfigure(line_buffering=True)

import os
import json
import time
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re

# Basis-Konfiguration
BASE_DIR = Path(__file__).parent.parent / "data" / "curricula"
RAW_DIR = BASE_DIR / "raw"
PARSED_DIR = BASE_DIR / "parsed"
LOG_FILE = BASE_DIR / "crawl_log.json"

# User Agent um nicht geblockt zu werden
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
}

# Bildungsserver und Lehrplan-URLs der Bundesländer
BUNDESLAENDER = {
    "baden-wuerttemberg": {
        "name": "Baden-Württemberg",
        "bildungsserver": "https://www.bildungsplaene-bw.de",
        "lehrplan_urls": [
            "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS",  # Grundschule
            "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1",  # Sek I
            "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM",  # Gymnasium
        ]
    },
    "bayern": {
        "name": "Bayern",
        "bildungsserver": "https://www.lehrplanplus.bayern.de",
        "lehrplan_urls": [
            "https://www.lehrplanplus.bayern.de/schulart/grundschule",
            "https://www.lehrplanplus.bayern.de/schulart/mittelschule",
            "https://www.lehrplanplus.bayern.de/schulart/realschule",
            "https://www.lehrplanplus.bayern.de/schulart/gymnasium",
        ]
    },
    "berlin": {
        "name": "Berlin",
        "bildungsserver": "https://bildungsserver.berlin-brandenburg.de",
        "lehrplan_urls": [
            "https://bildungsserver.berlin-brandenburg.de/rahmenlehrplaene",
        ]
    },
    "brandenburg": {
        "name": "Brandenburg",
        "bildungsserver": "https://bildungsserver.berlin-brandenburg.de",
        "lehrplan_urls": [
            "https://bildungsserver.berlin-brandenburg.de/rahmenlehrplaene",
        ]
    },
    "bremen": {
        "name": "Bremen",
        "bildungsserver": "https://www.lis.bremen.de",
        "lehrplan_urls": [
            "https://www.lis.bremen.de/schulqualitaet/curriculumentwicklung/bildungsplaene-702",
        ]
    },
    "hamburg": {
        "name": "Hamburg",
        "bildungsserver": "https://bildungsplaene.hamburg.de",
        "lehrplan_urls": [
            "https://bildungsplaene.hamburg.de/grundschule",
            "https://bildungsplaene.hamburg.de/stadtteilschule",
            "https://bildungsplaene.hamburg.de/gymnasium",
        ]
    },
    "hessen": {
        "name": "Hessen",
        "bildungsserver": "https://kultusministerium.hessen.de",
        "lehrplan_urls": [
            "https://kultusministerium.hessen.de/Unterricht/Kerncurricula",
        ]
    },
    "mecklenburg-vorpommern": {
        "name": "Mecklenburg-Vorpommern",
        "bildungsserver": "https://www.bildung-mv.de",
        "lehrplan_urls": [
            "https://www.bildung-mv.de/lehrer/schule-und-unterricht/rahmenlehrplaene/",
        ]
    },
    "niedersachsen": {
        "name": "Niedersachsen",
        "bildungsserver": "https://cuvo.nibis.de",
        "lehrplan_urls": [
            "https://cuvo.nibis.de/cuvo.php",
        ]
    },
    "nordrhein-westfalen": {
        "name": "Nordrhein-Westfalen",
        "bildungsserver": "https://www.schulentwicklung.nrw.de",
        "lehrplan_urls": [
            "https://www.schulentwicklung.nrw.de/lehrplaene/",
        ]
    },
    "rheinland-pfalz": {
        "name": "Rheinland-Pfalz",
        "bildungsserver": "https://lehrplaene.bildung-rp.de",
        "lehrplan_urls": [
            "https://lehrplaene.bildung-rp.de/",
        ]
    },
    "saarland": {
        "name": "Saarland",
        "bildungsserver": "https://www.saarland.de/mbk",
        "lehrplan_urls": [
            "https://www.saarland.de/mbk/DE/portale/bildungsserver/unterricht-und-bildungsthemen/lehrplaene/lehrplaene_node.html",
        ]
    },
    "sachsen": {
        "name": "Sachsen",
        "bildungsserver": "https://www.schulportal.sachsen.de",
        "lehrplan_urls": [
            "https://www.schulportal.sachsen.de/lplandb/",
        ]
    },
    "sachsen-anhalt": {
        "name": "Sachsen-Anhalt",
        "bildungsserver": "https://www.bildung-lsa.de",
        "lehrplan_urls": [
            "https://www.bildung-lsa.de/lehrplaene___rahmenrichtlinien.html",
        ]
    },
    "schleswig-holstein": {
        "name": "Schleswig-Holstein",
        "bildungsserver": "https://lehrplan.lernnetz.de",
        "lehrplan_urls": [
            "https://lehrplan.lernnetz.de/",
        ]
    },
    "thueringen": {
        "name": "Thüringen",
        "bildungsserver": "https://www.schulportal-thueringen.de",
        "lehrplan_urls": [
            "https://www.schulportal-thueringen.de/lehrplaene",
        ]
    },
}

# Fächer die uns interessieren
FAECHER_KEYWORDS = [
    "mathematik", "mathe", "rechnen",
    "deutsch", "sprache", "lesen", "schreiben",
    "englisch", "fremdsprache",
    "sachunterricht", "sachkunde", "heimat",
    "naturwissenschaft", "biologie", "physik", "chemie", "nawi",
    "geschichte", "politik", "gesellschaft", "sozialkunde",
    "geografie", "geographie", "erdkunde",
    "kunst", "musik", "sport",
    "religion", "ethik",
    "informatik", "medien", "digital",
]

# Klassenstufen
KLASSENSTUFEN = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]


def setup_directories():
    """Erstelle notwendige Verzeichnisse"""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PARSED_DIR.mkdir(parents=True, exist_ok=True)
    for land in BUNDESLAENDER.keys():
        (RAW_DIR / land).mkdir(exist_ok=True)


def load_log():
    """Lade Crawl-Log"""
    if LOG_FILE.exists():
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"crawled": {}, "errors": [], "last_run": None}


def save_log(log):
    """Speichere Crawl-Log"""
    log["last_run"] = datetime.now().isoformat()
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)


def get_url_hash(url):
    """Generiere Hash für URL (für Deduplizierung)"""
    return hashlib.md5(url.encode()).hexdigest()[:12]


def is_relevant_link(href, text):
    """Prüfe ob Link relevant für Lehrpläne ist"""
    if not href:
        return False
    
    href_lower = href.lower()
    text_lower = (text or "").lower()
    combined = href_lower + " " + text_lower
    
    # Alle PDFs von Bildungsservern sind potenziell relevant
    if href_lower.endswith(".pdf"):
        return True
    
    # HTML-Seiten die Lehrplan/Curriculum/Fach im Namen haben
    education_keywords = [
        "lehrplan", "curriculum", "rahmenplan", "bildungsplan",
        "kerncurriculum", "fachanforderung", "rahmenlehrplan",
        "unterricht", "fach", "schule", "grundschule", "gymnasium",
        "sekundarstufe", "primarstufe", "jahrgangsstufe"
    ]
    for kw in education_keywords:
        if kw in combined:
            return True
    
    # Fächer-Keywords
    for keyword in FAECHER_KEYWORDS:
        if keyword in combined:
            return True
    
    return False


def crawl_page(url, land_key, log, depth=0, max_depth=2):
    """
    Crawle eine Seite und extrahiere relevante Links
    """
    if depth > max_depth:
        return []
    
    url_hash = get_url_hash(url)
    if url_hash in log["crawled"]:
        print(f"  [SKIP] Bereits gecrawlt: {url[:60]}...")
        return []
    
    print(f"  [CRAWL] {url[:80]}...")
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except Exception as e:
        log["errors"].append({"url": url, "error": str(e), "time": datetime.now().isoformat()})
        print(f"  [ERROR] {e}")
        return []
    
    # Markiere als gecrawlt
    log["crawled"][url_hash] = {
        "url": url,
        "land": land_key,
        "time": datetime.now().isoformat(),
        "status": response.status_code,
    }
    
    found_pdfs = []
    
    # HTML parsen
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Finde alle Links
    for link in soup.find_all("a", href=True):
        href = link.get("href")
        text = link.get_text(strip=True)
        
        # Relative URLs auflösen
        full_url = urljoin(url, href)
        
        # Prüfe Relevanz
        if is_relevant_link(full_url, text):
            if full_url.lower().endswith(".pdf"):
                found_pdfs.append({
                    "url": full_url,
                    "text": text,
                    "source_page": url,
                })
            elif depth < max_depth:
                # Rekursiv weiter crawlen (nur HTML)
                time.sleep(0.5)  # Rate limiting
                found_pdfs.extend(crawl_page(full_url, land_key, log, depth + 1, max_depth))
    
    return found_pdfs


def download_pdf(pdf_info, land_key, log):
    """Lade PDF herunter"""
    url = pdf_info["url"]
    url_hash = get_url_hash(url)
    
    # Dateiname aus URL oder Text generieren
    filename = urlparse(url).path.split("/")[-1]
    if not filename or not filename.endswith(".pdf"):
        filename = f"{url_hash}.pdf"
    
    # Bereinigen
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filepath = RAW_DIR / land_key / filename
    
    if filepath.exists():
        print(f"  [SKIP] Bereits vorhanden: {filename}")
        return filepath
    
    print(f"  [DOWNLOAD] {filename}...")
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=60)
        response.raise_for_status()
        
        with open(filepath, "wb") as f:
            f.write(response.content)
        
        log["crawled"][url_hash] = {
            "url": url,
            "land": land_key,
            "file": str(filepath),
            "size": len(response.content),
            "text": pdf_info.get("text", ""),
            "time": datetime.now().isoformat(),
        }
        
        return filepath
        
    except Exception as e:
        log["errors"].append({"url": url, "error": str(e), "time": datetime.now().isoformat()})
        print(f"  [ERROR] {e}")
        return None


def crawl_bundesland(land_key, land_info, log):
    """Crawle alle Lehrplan-URLs eines Bundeslandes"""
    print(f"\n{'='*60}")
    print(f"[LAND] {land_info['name']}")
    print(f"{'='*60}")
    
    all_pdfs = []
    
    for url in land_info["lehrplan_urls"]:
        pdfs = crawl_page(url, land_key, log, depth=0, max_depth=2)
        all_pdfs.extend(pdfs)
        time.sleep(1)  # Pause zwischen Seiten
    
    # Deduplizieren
    seen = set()
    unique_pdfs = []
    for pdf in all_pdfs:
        if pdf["url"] not in seen:
            seen.add(pdf["url"])
            unique_pdfs.append(pdf)
    
    print(f"\n  Gefunden: {len(unique_pdfs)} PDFs")
    
    # PDFs herunterladen
    downloaded = 0
    for pdf in unique_pdfs:
        result = download_pdf(pdf, land_key, log)
        if result:
            downloaded += 1
        time.sleep(0.5)  # Rate limiting
    
    print(f"  Heruntergeladen: {downloaded} PDFs")
    
    return unique_pdfs


def main():
    """Hauptfunktion"""
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    print("[START] Meoluna Schulcurricula Crawler")
    print("=" * 60)
    
    setup_directories()
    log = load_log()
    
    total_pdfs = 0
    
    for land_key, land_info in BUNDESLAENDER.items():
        try:
            pdfs = crawl_bundesland(land_key, land_info, log)
            total_pdfs += len(pdfs)
            save_log(log)  # Zwischenspeichern
        except KeyboardInterrupt:
            print("\n\n[ABORT] Abgebrochen durch Benutzer")
            save_log(log)
            break
        except Exception as e:
            print(f"\n  [FATAL ERROR] {land_key}: {e}")
            log["errors"].append({
                "land": land_key, 
                "error": str(e), 
                "time": datetime.now().isoformat()
            })
    
    save_log(log)
    
    print("\n" + "=" * 60)
    print(f"[DONE] Fertig! Insgesamt {total_pdfs} PDFs gefunden")
    print(f"[DIR] Daten in: {BASE_DIR}")
    print(f"[LOG] Log in: {LOG_FILE}")


if __name__ == "__main__":
    main()
