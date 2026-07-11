# Das Herz der Wahrheit — Gold-Gate-Bericht

**Datum:** 2026-07-11

**Branch:** `feature/gold-slice`

**Status:** Ready for Klaus human Gold Gate

**Automatische Generierung:** weiterhin blockiert

## Kandidat

Der Admin-Lab-Kandidat `heart-of-truth` ist ein 60–90 Sekunden langer Phaser-4-Slice zum altägyptischen Wiegen des Herzens. Er verwendet die bestehende CSP-/MessageChannel-Runtime, verändert keine produktive Welterstellung und ersetzt keines der bisherigen Spiele.

Primärasset:

- The Metropolitan Museum of Art, *Book of the Dead for the Chantress of Amun, Nauny*
- Objekt 548344, Public Domain
- <https://www.metmuseum.org/art/collection/search/548344>

## Enthaltener Ablauf

1. Ba-Seele bewegt sich frei durch den Papyrus.
2. Herz wird auf die Waage gehoben.
3. Ma’ats Feder bringt die Waage ins Gleichgewicht.
4. Thoth hält das Urteil sichtbar fest.
5. Osiris’ Tor öffnet sich.
6. Erinnerungsecho verlangt Herz, Feder und Schrifttafel in der erlebten Reihenfolge.

Falsche Echo-Auswahl erzeugt keinen Reset, keine rote/grüne Bewertung und keinen Fortschritt. Die fünf Lernziele und `completeGame` werden erst nach dem Echo und jeweils genau einmal gemeldet.

## Automatische Verifikation

Frisch nach Commit `fbe9c79` ausgeführt:

### `npm run heart-of-truth-check`

- Modellcheck: `OK`
- Asset-/Quellen-/Source-Vertrag: `OK`
- Responsive `844x390`: `PASS`
- Responsive `1024x768`: `PASS`
- Responsive `1440x900`: `PASS`
- Portrait `390x844`: `PASS` mit Drehhinweis und ohne Weltaktionen

### `npm run heart-of-truth-visual-check -- --stage echo`

- Geführter Ablauf bis Echo: `PASS`
- Falsche Echo-Auswahl ohne Abschluss: `PASS`
- Echo-Aktion per Leertaste: `PASS`

### `npm run game-slice-check`

- Runtime, CSP-Probe, Source-Validator, Signaturen und Admin-Lab: `PASS`
- `egypt-tomb` auf drei Ziel-Viewports: `PASS`, Desktop p95 `16.8 ms`
- `egypt-city` auf drei Ziel-Viewports: `PASS`, Desktop p95 `16.7 ms`

### `npm run build`

- TypeScript: `PASS`
- Vite-Produktionsbuild: `PASS`
- Bestehende Warnung: Hauptbundle ist größer als 500 kB; nicht durch diesen Slice eingeführt.

## Visuelle Prüfbilder

- `scripts/visual-out/game-studio/heart-of-truth-1440x900-arrival.png`
- `scripts/visual-out/game-studio/heart-of-truth-1440x900-balanced.png`
- `scripts/visual-out/game-studio/heart-of-truth-1440x900-gate-open.png`
- `scripts/visual-out/game-studio/heart-of-truth-1440x900-echo-ready.png`
- `scripts/visual-out/game-studio/heart-of-truth-1440x900-echo-miss.png`
- `scripts/visual-out/game-studio/heart-of-truth-390x844-rotate.png`

Geprüft wurden: nichtleerer Canvas, Lesbarkeit der Primärquelle, sichtbare Ba-Figur, korrekte Lage von Herz und Feder auf den Waagschalen, unterscheidbare Zustände, keine abgeschnittenen Pflichtaktionen und kein UI-Rechteck als zentrales Torobjekt.

## Offenes menschliches Gate

Der integrierte In-App-Browser war in dieser Sitzung nicht verfügbar. Automatisierte Affordance-Checks können technische Erreichbarkeit beweisen, aber nicht, ob ein Kind die Welt ohne Vorwissen versteht oder weiterspielen möchte.

Der Kandidat ist deshalb ausdrücklich **nicht angenommen**. Klaus spielt ihn ohne vorherige Anleitung und beantwortet anschließend:

1. War die Steuerung nach wenigen Sekunden klar?
2. War Ursache und Wirkung jederzeit verständlich?
3. Sind Herz, Ma’at, Anubis, Thoth und Osiris anschließend zuordenbar?
4. Fühlte es sich wie ein Spiel statt wie eine Lernoberfläche an?
5. Möchtest du sehen, wie es weitergeht?

Bei Nichtbestehen wird ausschließlich dieser Slice überarbeitet. Es entstehen keine weitere Welt und keine Generatorlogik.
