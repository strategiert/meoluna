# Meoluna Engine-Roadmap (Stand 2026-06-19)

Plan für weitere Gameplay-Engines. Grundlage: 7 Engines + Focused-Mini-App-Fallback sind live.

## Architektur-Prinzipien (gelernt, gelten für jede neue Engine)

1. **Spec-getrieben:** KI liefert nur validierte Daten, der Renderer ist deterministisch + getestet. Nie freier React-Code aus dem LLM.
2. **Session-Format v2:** 2-6 Räume, ≥6 Runden gesamt, Schwierigkeits-Rampe, Meisterprüfung als letzter Raum. ~10-15 Min Spielzeit.
3. **Kein Quiz:** Auswahl besteht immer aus echten Spielobjekten, nie erfundenen Multiple-Choice-Optionen.
4. **Constraints KLEIN halten** (Lehre aus Detective): Je härter die Logik-Constraint, desto kleiner die Aufgaben — sonst verfehlt Opus sie und es gibt Fallback. Lieber 3 statt 5 Elemente.
5. **Validierungs-Retry:** `generateValidatedSpec` (utils/specGenerator.ts) gibt dem Modell bei Verstößen die konkreten Fehler als Feedback. Für jede Engine mit harten Constraints nutzen.
6. **Mit echtem Opus live testen**, nicht nur Fixtures — Opus-Output deckt Constraints auf, die handgeschriebene Fixtures verfehlen (Sweep via startGeneration + worlds:listByUser-Code-Marker).
7. **Kid-Design "Bilderbuch-Tag":** Maskottchen Luno, helle Szene, Sprechblase + Vorlesen, große Touch-Buttons, key={roundIndex}-Remount pro Runde.
8. **Pro Engine:** Types / Validator / Renderer / Prompt / Step-Generator / Topic-Router + Registry-Eintrag + 2-3 Fixtures + golden-check (inkl. Negativ-Tests) + Preview-Eintrag.

## Bestehende 7 Engines (Fächer-Abdeckung)

| Engine | Mechanik | Deckt ab |
|---|---|---|
| movement-space | Figur auf Zahlenstrahl/Achse | Neg. Zahlen, +/−, Temperatur, Kontostand, Koordinaten |
| mixing-balance | Topf füllen / Wippe ausgleichen | Brüche, Anteile, Verhältnisse, Gleichungen |
| building-construct | Raster-Rechteck / Formen zusammensetzen | Fläche, Umfang, Maße, Geometrie, Formen |
| time-sequence | Karten ordnen / Ursache-Wirkung-Kette | Reihenfolgen, Zyklen, Epochen, Prozesse |
| detective-evidence | Beweis-Satz finden / Verdächtige ausschließen | Leseverstehen, Logik, Argumentation |
| sort-match | Körbe sortieren / Paare verbinden | Vokabeln, Artikel, Wortarten, Klassifikation |
| word-builder | Buchstaben/Silben zu Wort | Rechtschreibung, Silben, Lesen |
| *(Fallback)* Focused-Mini-App | generische LLM-Mini-App | alles, was keine Engine trifft |

## Lücken-Analyse → Kandidaten

### Priorität HOCH

**1. Counting — Zählen & Mengen** (Vorschule / Klasse 1, jüngste Zielgruppe)
- Mechanik: Objekte erscheinen in der Szene; Kind zählt durch Antippen oder wählt die richtige Anzahl; Mengen vergleichen.
- Modi: `count` (wie viele sind es? Zahl tippen), `make` (lege genau N Objekte), `compare` (welche Gruppe hat mehr/weniger/gleich).
- Validator-Kern: Zahlen 1-20, jede Runde eindeutige Lösung, bei compare echte Ungleichheit/Gleichheit.
- Warum: Keine Engine deckt Anzahl-Erfassung. Fundamental für die Kleinsten. Einfache, fehlerarme Constraint.

**2. Pattern — Muster & Logik** (Vorschule – Klasse 2)
- Mechanik: Muster-Reihe mit Lücke (ABAB, Formen/Farben/Größen); Kind wählt das fehlende Element aus echten Kandidaten.
- Modi: `continue` (Reihe fortsetzen), `fill` (Lücke in der Mitte füllen).
- Validator-Kern: Muster eindeutig fortsetzbar; das richtige Element + Distraktoren aus demselben Inventar; 3-6 sichtbare Glieder.
- Warum: Frühes logisches Denken, breit (Mathe-Früh + Vorschule), simple deterministische Prüfung.

### Priorität MITTEL-HOCH

**3. Clock — Uhr & Zeit** (Klasse 1-3)
- Mechanik: Analoge Uhr (SVG); Zeiger ziehen/stellen oder Uhrzeit ablesen.
- Modi: `read` (welche Uhrzeit zeigt die Uhr? aus echten Optionen), `set` (stelle die Uhr auf X Uhr).
- Validator-Kern: Stunden/Minuten konsistent, kindgerechte Schritte (volle/halbe/viertel Stunde je Stufe).
- Warum: Klare eigene Mechanik, fester Lehrplan-Baustein, keine Engine deckt es.

### Priorität MITTEL

**4. Money — Geld & Bezahlen** (Klasse 1-3)
- Mechanik: Münzen/Scheine wählen, bis ein Zielbetrag gelegt ist; ggf. Wechselgeld.
- Modi: `pay` (lege genau X €), `change` (wie viel Rückgeld?).
- Validator-Kern: Zielbetrag mit gegebenen Münzwerten exakt legbar (DP-Check wie bei mixing-balance); realistische Euro-Werte.
- Warum: Alltagsmathe; baut konzeptionell auf Counting/mixing-balance auf.

**5. Map — Karten & Orte** (Sachkunde/Erdkunde, Klasse 2-4)
- Mechanik: Vereinfachte SVG-Karte (Bundesländer/Kontinente/Stadtplan); Kind tippt den richtigen Ort/die Region an.
- Modi: `locate` (wo liegt X?), `name` (welche Region ist markiert? aus echten Optionen).
- Validator-Kern: Regionen-IDs existieren in der hinterlegten Karte; eindeutige Zuordnung.
- Aufwand: höher — braucht vorbereitete SVG-Karten-Assets (begrenztes, festes Karten-Set statt LLM-generiert).

### Langfrist / optional

- **Art-Grid — Malen nach Gitter** (Kunst/Symmetrie): Gitterzellen nach Vorlage färben, Symmetrie spiegeln. Eigenständig, mittel.
- **Experiment-Sim** (Physik/Chemie): Variablen einstellen, Effekt beobachten. Hoher Aufwand, später.
- **Rhythm/Music**: braucht Audio (laut ursprünglicher Spec bewusst kein Core). Zurückgestellt.

## Empfohlene Reihenfolge

1. **Counting** (größte Lücke, jüngste Zielgruppe, einfachste Constraint)
2. **Pattern** (frühe Logik, breit, simpel)
3. **Clock** (klare Lücke, schöne eigene Mechanik)
4. **Money** (Alltagsmathe, DP-Constraint wie mixing)
5. **Map** (Sachkunde, aber Asset-Aufwand)

Danach Abdeckung neu bewerten; Art-Grid / Experiment-Sim nur bei konkretem Bedarf.

## Routing-Hinweis

Jede neue Engine braucht: Keyword-Router (`isLikely<X>Topic`) in der Prioritätskette von `engineRegistry.pickEngineByKeywords` **und** einen Eintrag im `gameplayRouter`-Prompt (LLM-Fallback-Router). Reihenfolge in der Keyword-Kette beachten (spezifischere vor allgemeineren).
