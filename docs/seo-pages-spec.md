# SEO-Landingpages: Kontrakt-Spec (v1, 2026-07-05)

Verbindlicher Kontrakt für alle Agents. Zwei Repos:
- **App-Repo:** `C:\Users\karent\Documents\Software\meoluna-main-clean` (Convex, Engines, Export, PDF-Pipeline)
- **Web-Repo:** `C:\Users\karent\Documents\Software\meoluna-web` (Astro 6 static, Cloudflare)

## Architektur

Seite = **Base** (Convex-Export) + **Derived** (Engine-Blöcke, existiert in `src/lib/content.ts`) + **Authored** (pro Topic, neu — der Anti-Doorway-Hebel).

Daten-Fakten (verifiziert 2026-07-05, KORRIGIERT — es gibt zwei Deployments):
- **Prod** (`helpful-blackbird-68`, Quelle für Export): 1062 Topics, breite Fach-Verteilung (162 Mathe, 110 Deutsch, 96 Musik, 85 Kunst, 83 Chemie/Physik, 74 Englisch, … 10 Religion/Ethik). Slugs teils mit `-kN`-Suffix. `bundesland`: "hessen" oder "bundesweit".
- **Dev** (`merry-leopard-276`): abweichender Bestand — NICHT als Quelle nutzen.
- **Prod enthält den alten kuratierten 63er-Seed NICHT** (dort z. B. `natuerliche-zahlen-bis-20-k1` statt `zahlen-bis-20`). Die 63 alten Slugs sind live/indexiert → Export merged sie als Legacy-Liste (`scripts/topics-legacy.json`, eingefroren aus git HEAD des Web-Repos) dazu; Legacy-Engine-Mapping wird ebenfalls aus git HEAD übernommen. Gesamt also ~1125 Seiten.
- `competencies` ist bei ALLEN Topics leer → Lernziele werden authored, nicht abgeleitet
- Import enthält teils Lehrplan-Überschriften als "Topics" (z. B. Kompetenzbereiche wie "Problemlösen k1-k3") → Tiering/noindex fängt das; solche Überschriften-Topics bei Authored-Batches überspringen oder sinnvoll interpretieren

## 1. Export (App-Repo → Web-Repo)

`scripts/export-topics.mjs` (App-Repo):
1. Neue read-only Query `curriculum:getAllTopicsForExport` (topics + subjects, nur isActive) — additiv in `convex/curriculum.ts`, dann `npx convex deploy`
2. Filter: Test-Topics raus (name enthält "Test Topic" oder keywords == ["test"])
3. Engine-Zuordnung: `pickEngineByKeywords({ prompt: name + " " + keywords.join(", ") })` aus `convex/pipeline/engines/engineRegistry.ts` — Lade-Pattern wie `scripts/counting-golden-check.mjs` (esbuild). Web-Engine MUSS == App-Engine sein.
4. Output (überschreibt):
   - `meoluna-web/src/data/topics.json` — Array `{ subjectSlug, name, slug, gradeLevel, bundesland, keywords }` (Format kompatibel zu `src/lib/topics.ts`, bundesland neu/optional)
   - `meoluna-web/src/data/topic-engines.json` — `{ "<subjectSlug>/<slug>": "<engine>" }` für ALLE Topics

## 2. Authored Content (eine Quelle für Web + PDFs)

Datei: `meoluna-web/src/data/topic-content/<subjectSlug>/<slug>.json`

```jsonc
{
  "fach": "mathematik",          // subjectSlug, muss zu Pfad passen
  "topic": "zahlen-bis-20",      // slug, muss zu Dateiname passen
  "klasse": 1,
  "intro": "2–3 themenspezifische Sätze (NICHT engine-generisch).",
  "lernziele": ["3–5 Bullets, kindgerecht formuliert, curriculumnah"],
  "misconception": "Der typische Denkfehler bei diesem Thema + wie man ihn erkennt.",
  "vertiefung": "Optionaler Extra-Absatz (Tier 1).",
  "flashcards": [ { "vorderseite": "Frage/Begriff", "rueckseite": "Antwort" } ],   // 8–12
  "beispielaufgaben": [
    {
      "frage": "Aufgabentext",
      "loesung": "Lösung (bei Rechnungen exakt, maschinell prüfbar)",
      "schwierigkeit": 1,                    // 1=leicht 2=mittel 3=schwer
      "nutzung": ["web", "klassenarbeit"],   // web | klassenarbeit | lzk | hausaufgabe
      "punkte": 2                            // Pflicht wenn nutzung enthält "klassenarbeit"
    }
  ]
}
```

Mengen-Regeln pro Topic (Klaus-Feedback 2026-07-05: Aufgabenmenge und Komplexität steigen mit der Klassenstufe; Klassenarbeiten haben real teils 30 Aufgaben, ab höheren Klassen Doppelstunde = 90 Minuten Arbeitsumfang):

| Stufe | gesamt | `klassenarbeit` | `lzk` | `hausaufgabe` | `web` | KA-Arbeitszeit |
|-------|--------|-----------------|-------|----------------|-------|----------------|
| Kl. 1 | 14–18 | 8–12 | 5–8 | 3–5 (nur S1–2) | 5–8 | 30 min |
| Kl. 2–4 | 20–28 | 12–20 (kleinteilig) | 8–12 | 5–8 | 6–10 | 45 min |
| Kl. 5–7 | 22–30 | 15–25 | 8–12 | 6–8 | 6–10 | 45 min |
| ab Kl. 8 | 25–35 | 20–30 (mehrteilige Transfer-/Begründungsaufgaben) | 10–14 | 6–10 | 6–10 | 90 min (Doppelstunde) |

- Optionales Feld `arbeitszeitMinuten` (Zahl) im Content-JSON überschreibt den KA-Zeit-Default; Build-Script-Defaults: Kl. 1–2 → 30, Kl. 3–7 → 45, ab Kl. 8 → 90. Klassenarbeit-PDF zeigt „Arbeitszeit: X Minuten" im Kopf.
- Punkte-Summe der Klassenarbeit soll grob zur Arbeitszeit passen (Faustregel ~1 Punkt/Minute ab Kl. 3).
- Mehrfach-Tagging erlaubt und erwünscht
- fast-worker-Batch-Größe wegen der größeren Pools: 8–12 Topics/Batch (GS), 5–8 (Sek)
- Deutsch, echte Umlaute, kindgerecht für die Klassenstufe; Englisch-Topics: Aufgaben Englisch, Anweisungen Deutsch

## 3. PDF-Pipeline (App-Repo, Typst)

- Typst CLI installiert (winget, `typst` im PATH neuer Shells)
- `scripts/pdf/templates/klassenarbeit.typ`, `lernzielkontrolle.typ`, `hausaufgabe.typ`
- `scripts/pdf/build-pdfs.mjs`: liest alle `topic-content/**/*.json`, filtert Aufgaben nach `nutzung`-Tag, ruft `typst compile --input data=<json>` auf
- Output: `meoluna-web/public/pdf/<subjectSlug>/<slug>/<slug>-{klassenarbeit|lernzielkontrolle|hausaufgabe}.pdf`
- Cache: `scripts/pdf/.pdf-cache.json` (SHA-256 des Content-JSON → nur bei Änderung neu kompilieren); Cache-Datei in .gitignore
- Layout-Anforderungen (alle 3, Deutsch, Grundschul-Typografie: große serifenlose Schrift, viel Weißraum, Linien zum Schreiben):
  - Kopf: Meoluna-Branding dezent, Titel = Topic-Name, Fach + Klasse; Zeile „Name: ____ Datum: ____"
  - **Klassenarbeit:** Punkte pro Aufgabe am Rand, Summenfeld, Notenschlüssel-Tabelle (1 ab 96 %, 2 ab 80 %, 3 ab 60 %, 4 ab 45 %, 5 ab 20 %, sonst 6, gerundet auf halbe Punkte); Lösungen als LETZTE Seite im selben PDF (Seitenumbruch, Überschrift „Lösungen — für Lehrkräfte/Eltern")
  - **Lernzielkontrolle:** „Kann ich das?"-Checkliste aus `lernziele` (☐ sicher ☐ fast ☐ übe noch), danach lzk-Aufgaben, Lösungen letzte Seite
  - **Hausaufgabe:** kompakt (1 Blatt + Lösungsteil), nur leichte Aufgaben, freundlicher Abschluss-Satz
  - Fußzeile: „meoluna.com/lernwelten/<fach>/klasse-<n>/<slug>/" + Seitenzahl

## 4. Web-Template (Web-Repo)

`src/pages/lernwelten/[fach]/[klasse]/[thema].astro` erweitern (bestehende Struktur/Optik beibehalten):
1. Loader `src/lib/topic-content.ts`: lädt `topic-content/<fach>/<slug>.json` via `import.meta.glob` (eager), Typ-Interface exportieren
2. Wenn Authored vorhanden: `intro` ersetzt generischen Einstieg, neue Sektion **Lernziele**, Aufgaben-Sektion aus `beispielaufgaben` (nutzung enthält "web"; Lösung im `<details>`-Aufklapper), **Flashcards**-Sektion (CSS-Flip oder `<details>`-Karten, statisch ohne JS-Framework), `misconception` in Häufige-Fehler-Sektion integriert, **Downloads**-Sektion mit 3 PDF-Karten (Klassenarbeit / Lernzielkontrolle / Hausaufgabe, Link auf `/pdf/<fach>/<slug>/...pdf`, `download`-Attribut)
3. FAQ + Schema.org erweitern: 2 Aufgaben in FAQPage übernehmen (wie bisher DEEP_CONTENT), Downloads NICHT ins Schema
4. **Index-Regel:** index + Sitemap wenn Authored-JSON existiert ODER `topic.legacy === true` (63 Bestands-URLs, bereits indexiert — nie de-indexieren). Alle anderen: `<meta name="robots" content="noindex,follow">` + raus aus Sitemap (@astrojs/sitemap `filter`).
5. `DEEP_CONTENT` bleibt als Fallback für die 63 Bestands-Topics (Authored-JSON gewinnt, wenn beides existiert)
6. Build muss mit 871 Topics durchlaufen (`npm run build` grün)

## 5. Sample-Batch (vor Skalierung — Review durch Klaus)

| # | fach | klasse | slug | Engine (erwartet) |
|---|------|--------|------|-------------------|
| 1 | mathematik | 1 | zahlen-bis-20 | counting |
| 2 | mathematik | 3 | einmaleins-1-10 | counting/pattern |
| 3 | deutsch | 2 | nomen-artikel | sort-match/word-builder |
| 4 | sachunterricht | 4 | menschlicher-koerper | diagram |
| 5 | chemie | 7 | das-teilchenmodell | (Import-Härtetest Sek I) |

Samples 1–4 sind Legacy-Slugs (bleiben via Legacy-Merge gültig), Sample 5 aus dem Prod-Import.

## 6. Qualitätsregeln

- ≥50 % des sichtbaren Seitentexts aus Authored-Feldern (Anti-Doorway)
- Arithmetik-Lösungen maschinell prüfbar formulieren („7 + 5 = 12", nicht Prosa)
- Keine API-Keys für Content-Erzeugung — Agents schreiben selbst
- Kein iframe von app.meoluna.com (Tracking/DSGVO + CWV); Spiel = Screenshot aus `public/spielproben/`
- Tiering: Tier 1 = 64 kuratierte + beste Import-Topics; Lehrplan-Überschriften (Import) bleiben noindex bis sinnvoll befüllt
