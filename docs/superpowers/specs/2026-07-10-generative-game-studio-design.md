# Generative Game Studio mit Phaser

**Status:** Freigegeben für die Umsetzung

**Datum:** 2026-07-10

**Produktziel:** Jede Lernwelt soll wie ein eigenständiges Videospiel wirken. Kinder sollen durch Spielen lernen, nicht durch ein verkleidetes Quiz.

## 1. Entscheidung

Meoluna baut für neue Lernwelten ein **generatives Spielestudio** auf Basis von Phaser 4.2.1.

Die KI wählt nicht länger nur eine feste Engine und füllt deren Datenmodell. Sie entwickelt pro Generierung ein eigenes Spielkonzept, eine eigene Weltstruktur, konkrete Spielhandlungen, Progression, Dramaturgie und Assets. Zwei Kinder dürfen aus demselben Ausgangsmaterial zwei strukturell verschiedene Spiele erhalten, solange beide dieselben Lernziele zuverlässig abdecken.

Phaser ist dabei nur die unsichtbare technische Laufzeit für Rendering, Szenen, Eingabe, Kamera, Physik, Animation und Audio. Phaser definiert **nicht** das Spielkonzept. Neue Lernwelten bestehen aus individuell generiertem JavaScript und einem individuellen Asset-Manifest.

Die bestehenden 14 deterministischen React-Engines bleiben vorerst unverändert als stabiler Fallback erhalten. Es werden keine weiteren festen Engines gebaut, bis der Phaser-Vertical-Slice die Qualitätsziele dieses Dokuments erreicht.

Diese Spec löst folgende Dokumente als strategische Standardrichtung für neue Generierungen ab:

- `docs/superpowers/specs/2026-05-29-gameplay-engine-worlds-design.md`
- `docs/superpowers/specs/2026-06-19-engine-roadmap.md`

Die darin dokumentierten Engines bleiben kompatibel und weiterhin nutzbar. Nur die Empfehlung, die Engine-Bibliothek als primäre Zukunftsarchitektur auszubauen, wird ersetzt.

## 2. Nicht Verhandelbare Produktprinzipien

### 2.1 Spiel zuerst

- Der erste sichtbare Screen ist eine spielbare Szene, kein Hub mit Levelkarten.
- Das Kernlernziel wird durch eine Handlung erfahren, bevor es erklärt wird.
- Lernfortschritt entsteht durch Spielzustände: erkunden, bewegen, bauen, kombinieren, steuern, planen, beobachten oder experimentieren.
- Multiple Choice, Karteikarten und Texteingaben sind nur erlaubt, wenn sie die natürliche Handlung des Spiels darstellen, etwa das Entschlüsseln eines Codes oder das Verfassen eines Satzes.
- Eine Quizfrage über einem dekorativen Hintergrund gilt nicht als Spielmechanik.

### 2.2 Echte Einzigartigkeit

Ein neuer Skin, eine andere Farbpalette oder ein anderer Seed reichen nicht aus. Eine Welt gilt nur dann als strukturell eigenständig, wenn sie sich in mindestens vier der folgenden sieben Dimensionen von ihrer ähnlichsten bestehenden Welt unterscheidet:

1. Kernhandlungen des Spielers
2. Kameraperspektive und räumliche Darstellung
3. Welt- und Levelstruktur
4. Progressionsmodell
5. Steuerungsmodell
6. Fehler-, Risiko- und Wiederholungsmodell
7. Dramaturgie und erzählerischer Aufbau

### 2.3 Lernzieltreue

- Jede Quelle wird zuerst in überprüfbare Lernziele, Zusammenhänge und typische Fehlvorstellungen zerlegt.
- Jedes verpflichtende Lernziel muss mindestens einer konkreten Spielhandlung und einem messbaren Spielzustand zugeordnet sein.
- Dekorative Erwähnung eines Themas zählt nicht als Lernzielabdeckung.
- Die Generierung darf kreative Freiheit bei Spiel und Inszenierung haben, nicht bei fachlicher Richtigkeit.

### 2.4 Zuverlässigkeit vor automatischem Rollout

- Kein frei generiertes Spiel wird ungeprüft veröffentlicht.
- Ein Spiel muss Syntax-, Sicherheits-, Laufzeit-, Playthrough- und Lernzielprüfungen bestehen.
- Scheitert der Phaser-Pfad, bleibt die bestehende Engine-Pipeline der Fallback.
- Die automatische Phaser-Generierung startet ausschließlich hinter einem Admin-Feature-Flag.

## 3. Bestehende Produkttrennung bleibt bestehen

Die Aufteilung der Websites ist richtig und wird nicht zurückgebaut:

| Bereich | Repository | Domain | Aufgabe |
|---|---|---|---|
| Marketing, redaktioneller Content, SEO | `meoluna-web` | `meoluna.com` | Statisches Astro, crawlbarer HTML-Content, Themenseiten, Blog und Conversion |
| Anwendung und Spiele | `meoluna-main-clean` | `app.meoluna.com` | Login, Welterstellung, Dashboard, Spielen und Fortschritt |

`meoluna-web/public/_redirects` leitet App-Routen wie `/create` und `/w/*` zu `app.meoluna.com`. Diese Grenze bleibt erhalten. Die Phaser-Arbeit findet ausschließlich in `meoluna-main-clean` statt und verändert die Astro-Seite nicht.

## 4. Zielarchitektur

```text
Quelle
  -> Learning Model
  -> Creative Pitch Set
  -> Originality Gate
  -> Game Design Document
  -> Art Bible + Asset Manifest
  -> Phaser Source Generator
  -> Static/Security Validation
  -> Runtime Build
  -> Automated Playthrough
  -> Visual/Performance QA
  -> Human Quality Gate während Pilotphase
  -> Publish oder bestehender Engine-Fallback
```

### 4.1 Learning Model

Der vorhandene `LearningBrief` wird zu einem fachlichen Vertrag erweitert. Er beschreibt nicht, welches Spiel entstehen soll.

```ts
type LearningModel = {
  sourceMode: "material" | "curriculum" | "creator";
  subject: string;
  gradeLevel: string;
  ageRange: { min: number; max: number };
  sourceSummary: string;
  requiredGoals: Array<{
    id: string;
    statement: string;
    evidenceOfMastery: string;
    commonMisconceptions: string[];
    importance: "core" | "supporting";
  }>;
  facts: Array<{
    id: string;
    statement: string;
    sourceEvidence: string;
  }>;
  constraints: {
    sessionMinutes: number;
    readingLevel: string;
    devices: Array<"touch" | "mouse" | "keyboard">;
  };
};
```

Fakten ohne ausreichende Quellenbasis werden nicht erfunden. Bei Dokumenten enthält `sourceEvidence` einen kurzen Verweis auf die Textstelle. Bei Curriculum-Themen verweist es auf den normalisierten Curriculum-Eintrag.

### 4.2 Creative Pitch Set

Der Creative Director erzeugt zunächst fünf Konzepte, noch keinen Code. Die fünf Pitches müssen unterschiedliche Kernhandlungen und Weltstrukturen verwenden.

```ts
type GamePitch = {
  id: string;
  title: string;
  oneSentenceFantasy: string;
  playerRole: string;
  coreVerbs: string[];
  camera: "top-down" | "side" | "isometric" | "fixed-scene" | "abstract";
  worldTopology: "linear" | "branching" | "open-zone" | "round-based" | "systemic";
  coreLoop: string[];
  progression: string;
  failureAndRecovery: string;
  learningBindings: Array<{
    goalId: string;
    playerAction: string;
    observedState: string;
  }>;
  estimatedMinutes: number;
};
```

Der Pitch-Selector bewertet:

- Spielbarkeit im Browser
- Stärke der Lernzielbindung
- erwartete Eigenständigkeit
- Eignung für Alter und Eingabegeräte
- Produktionsrisiko
- erwartete audiovisuelle Wirkung

Er wählt genau einen Pitch. Ein Pitch mit hoher Originalität, aber schwacher Lernzielbindung wird abgelehnt.

### 4.3 Originality Gate

Jede veröffentlichte Phaser-Welt speichert eine `ExperienceSignature`.

```ts
type ExperienceSignature = {
  coreVerbs: string[];
  camera: string;
  worldTopology: string;
  progressionModel: string;
  controlModel: string;
  failureModel: string;
  narrativeStructure: string;
  systemicModel: string | null;
};
```

Initiale Vergleichsregeln:

- Kategorien werden normalisiert, sortiert und als kanonisches JSON gespeichert.
- `coreVerbs` werden über Jaccard-Ähnlichkeit verglichen.
- Die übrigen Felder werden als exakte Kategorien verglichen.
- Gewichtung: Kernhandlungen 30 %, Topologie 15 %, Progression 15 %, Kamera 10 %, Steuerung 10 %, Fehler/Risiko 10 %, Dramaturgie 5 %, Systemmodell 5 %.
- Ein Kandidat wird verworfen, wenn die gewichtete Ähnlichkeit zu einer bestehenden Welt `>= 0.72` beträgt.
- Für Welten mit demselben normalisierten Thema gilt der strengere Grenzwert `>= 0.60`.
- Zusätzlich müssen mindestens vier der sieben Produktdimensionen aus Abschnitt 2.2 verschieden sein.

Die Grenzwerte werden später anhand echter Generierungen kalibriert, aber nicht während des Vertical Slices gelockert.

### 4.4 Game Design Document

Der ausgewählte Pitch wird zu einem vollständigen, maschinenlesbaren `GameDesignDocument` ausgearbeitet.

Pflichtbestandteile:

- Spielerfantasie und Ziel
- Szenen-Graph mit Start-, Spiel-, Erfolgs- und Wiederholungszuständen
- Kernloop und sekundäre Loops
- Steuerung für Touch sowie Maus/Tastatur
- konkrete Regeln und Zustandsübergänge
- Progression, Schwierigkeit und Hilfesystem
- Verlustbedingungen und schnelle Wiederaufnahme
- Lernzielbindung pro Mechanik
- audiovisuelle Feedbackregeln
- Asset-Manifest
- Telemetrieereignisse
- deterministischer Playthrough-Plan für QA

Das GDD darf keine allgemeinen Aussagen wie „macht Spaß“ oder „interaktiv“ enthalten. Jede Anforderung muss als beobachtbares Verhalten beschrieben werden.

## 5. Phaser-Laufzeit

### 5.1 Technische Entscheidung

- Paket: `phaser@4.2.1`, exakt im Lockfile fixiert.
- Generierte Spiele verwenden Plain JavaScript, kein React und kein JSX.
- Der generierte Code nutzt Phaser über `window.Phaser`; externe Imports sind verboten.
- Ein Spiel exportiert genau eine Funktion `bootMeolunaGame(context)`.
- Der Kontext liefert Container, Viewport, Asset-URLs, Seed und die Meoluna-Bridge.

```ts
type MeolunaGameContext = {
  parentId: string;
  width: number;
  height: number;
  device: "touch" | "desktop";
  seed: string;
  assets: Record<string, string>;
  api: {
    reportScore(amount: number, context?: Record<string, unknown>): void;
    completeGoal(goalId: string, evidence?: Record<string, unknown>): void;
    completeGame(summary?: Record<string, unknown>): void;
    speak(text: string): void;
    emit(event: string, payload?: Record<string, unknown>): void;
  };
};
```

### 5.2 Runtime Shell

Ein statischer, versionierter Runtime-Shell wird unter `public/game-runtime/v1/` ausgeliefert:

```text
public/game-runtime/v1/
  index.html
  runtime.js
  phaser-4.2.1.min.js
```

Ablauf:

1. `PhaserPreview` lädt `index.html` in einem `iframe` mit `sandbox="allow-scripts"`.
2. Der Shell meldet `MEOLUNA_RUNTIME_READY` an das Parent-Fenster.
3. Das Parent sendet den bereits autorisiert geladenen World-Artifact per `postMessage`.
4. Der Shell erstellt aus dem Source einen JavaScript-Blob und lädt ihn als Modul.
5. Das Modul exportiert `bootMeolunaGame` und erhält ausschließlich den kontrollierten Kontext.
6. Fortschritt und Fehler gehen über typisierte Bridge-Nachrichten zurück.

Der generierte Code erhält keinen direkten Zugriff auf Convex-Tokens oder Clerk-Daten.

### 5.3 Verbotene APIs

Der Source-Validator lehnt mindestens Folgendes ab:

- `eval`, `Function` und dynamische Code-Nachladung
- `fetch`, `XMLHttpRequest`, `WebSocket` und direkte Netzwerkaufrufe
- `localStorage`, `sessionStorage`, IndexedDB und Cookies
- direkter Zugriff auf `window.parent`, `window.top` oder beliebige `postMessage`-Ziele
- DOM-Manipulation außerhalb des übergebenen Containers
- externe Script- oder Modulimporte
- Kamera, Mikrofon, Geolocation und Clipboard
- Endlosschleifen in offensichtlich statischer Form

Nur die Runtime-Bridge darf Daten aus dem Spiel herausreichen.

### 5.4 Responsive Vertrag

- Logische Basisauflösung: `1280 x 720`.
- Phaser Scale Mode: `FIT`, zentriert im verfügbaren Container.
- Touch-Ziele mindestens 48 CSS-Pixel.
- Das Spiel muss bei `390 x 844`, `768 x 1024` und `1440 x 900` ohne abgeschnittene Pflichtaktionen funktionieren.
- Steuerung darf nie ausschließlich Hover, Rechtsklick oder Tastatur voraussetzen.
- Ton startet stumm und wird erst durch eine Nutzergeste aktiviert.

## 6. Assets und Art Direction

### 6.1 Art Bible vor Asset-Generierung

Jedes Spiel erhält eine kurze Art Bible:

- visuelle Epoche und Referenzwelt
- Formen- und Materiallogik
- Farbrollen, nicht nur eine Palette
- Figurenproportionen
- Perspektive und Licht
- Animationscharakter
- verbotene Stilbrüche

Alle Asset-Prompts werden daraus abgeleitet. Einzelne unabhängig erzeugte Bilder ohne gemeinsame Art Bible sind nicht erlaubt.

### 6.2 Asset-Strategie für den Vertical Slice

- KI-generierte Bitmap-Assets für Hintergrund, große Schauplätze und charakteristische Requisiten.
- Interaktive Objekte, Hitboxen, Partikel und Statusfeedback werden zunächst mit Phaser-Geometrie und kleinen geprüften Sprites umgesetzt.
- Keine Emojis als zentrale Spielgrafik.
- Keine dekorativen Bilder, die für die Spielhandlung unlesbar oder funktionslos sind.
- Jedes Asset erhält semantische ID, Typ, Abmessungen, Dateigröße und Herkunftsprompt.
- Temporäre fal.ai-URLs werden sofort in Convex Storage persistiert; Welten referenzieren keine ablaufenden Drittanbieter-URLs.

### 6.3 Budget

Initiale Grenzen pro Spiel:

- maximal 12 persistierte Bitmap-Assets
- maximal 5 MB gesamtes Asset-Budget
- maximal 250 KB generierter JavaScript-Source
- WebP für Bitmap-Assets, PNG nur bei benötigter Transparenz
- keine Videos im Vertical Slice

## 7. Speicherung und Rückwärtskompatibilität

### 7.1 Worlds-Tabelle

Die bestehende Spalte `code` bleibt erhalten, damit alle React-Welten weiter funktionieren. Ergänzt werden optionale Felder:

```ts
runtime: "react-sandpack-v3" | "phaser-v1";
artifactId?: Id<"worldArtifacts">;
experienceSignature?: ExperienceSignature;
generationStrategy?: "deterministic-engine" | "focused-react" | "generative-phaser";
```

Für bestehende Dokumente gilt ohne Migration `runtime = "react-sandpack-v3"`.

### 7.2 World Artifacts

```ts
type WorldArtifact = {
  worldId: Id<"worlds">;
  schemaVersion: 1;
  runtime: "phaser-v1";
  phaserVersion: "4.2.1";
  source: string;
  designDocument: GameDesignDocument;
  learningModel: LearningModel;
  experienceSignature: ExperienceSignature;
  assets: Array<{
    id: string;
    storageId: Id<"_storage">;
    mediaType: "image/webp" | "image/png" | "audio/mpeg";
    width?: number;
    height?: number;
    bytes: number;
    prompt?: string;
  }>;
  validation: {
    sourcePassed: boolean;
    runtimePassed: boolean;
    playthroughPassed: boolean;
    viewportPassed: boolean;
    learningCoverage: number;
    nearestSimilarity: number;
    report: string[];
  };
  createdAt: number;
};
```

`worldArtifacts` wird über `worldId` indexiert. Abruf und Asset-URLs verwenden dieselben Eigentümer-/Öffentlichkeitsregeln wie `worlds.get`.

### 7.3 Renderer-Auswahl

`WorldPreview` wird zu einem kleinen Dispatcher:

```text
react-sandpack-v3 -> bestehende Sandbox
phaser-v1         -> neuer PhaserPreview
```

Bestehende React-Welten werden weder neu gespeichert noch automatisch konvertiert.

## 8. Generierungs- und Qualitätsgates

### 8.1 Statische Source-Prüfung

Vor jedem Runtime-Test:

- JavaScript kann vollständig geparst werden.
- `bootMeolunaGame` wird exportiert.
- Phaser-Spiel wird genau einmal erzeugt und kann zerstört werden.
- verbotene APIs fehlen.
- jedes Pflichtlernziel besitzt mindestens ein Telemetrieereignis.
- `completeGame` ist von einem erreichbaren Erfolgszustand aus aufrufbar.
- Source- und Asset-Budgets werden eingehalten.

### 8.2 Automatischer Playthrough

Das GDD liefert einen maschinenlesbaren `playthroughPlan`. Ein separater Playwright-Worker führt ihn aus.

Pflichtprüfungen:

- Runtime meldet innerhalb von fünf Sekunden `GAME_READY`.
- Keine unbehandelten Fehler oder Error-Logs.
- Jeder Pflichtzustand ist über echte Pointer-, Touch- oder Tastatureingaben erreichbar.
- Mindestens ein Fehlerpfad wird gespielt und kann ohne Reload fortgesetzt werden.
- Ein vollständiger Erfolgsweg löst genau einmal `completeGame` aus.
- Jedes Kernlernziel erzeugt nachvollziehbare Mastery-Evidence.
- Neustart und erneuter Versuch funktionieren.

Playwright-Screenshots werden an den drei Ziel-Viewports erzeugt und per visueller Regression verglichen. Playwright unterstützt dafür native Screenshot-Vergleiche mit `toHaveScreenshot`.

### 8.3 Performance

- Ziel: 60 FPS auf einem durchschnittlichen aktuellen Mobilgerät.
- Harte Untergrenze im automatischen Desktop-Test: p95 Frame-Zeit unter 33 ms.
- `GAME_READY` unter fünf Sekunden bei warmem CDN und normaler Breitbandverbindung.
- Kein kontinuierliches Speicherwachstum über einen zehnminütigen Testlauf.
- Runtime muss Phaser beim Unmount vollständig zerstören.

### 8.4 Menschliches Pilot-Gate

Automatische Tests können Funktion und Lernzielabdeckung prüfen, aber nicht zuverlässig feststellen, ob ein Spiel Spaß macht. Während des Piloten bewertet ein Mensch jedes neue Konzept auf einer Skala von 1 bis 5:

- fühlt sich wie ein Spiel an
- möchte man freiwillig weiterspielen
- Lernhandlung und Spielhandlung sind dieselbe Handlung
- audiovisuelle Kohärenz
- Eigenständigkeit gegenüber bestehenden Welten

Ein Pilotspiel wird nur akzeptiert, wenn kein Wert unter 3 liegt und der Mittelwert mindestens 4 beträgt.

## 9. Fehlerbehandlung und Fallback

Der Phaser-Pfad darf bestehende Produktion nicht blockieren.

```text
Pitch/GDD ungültig
  -> einmal gezielt regenerieren
Source ungültig oder Runtime-Test fehlgeschlagen
  -> einmal mit konkretem Fehlerbericht reparieren
zweiter Fehler
  -> vorhandene deterministische Engine verwenden
keine Engine passend
  -> bestehender Focused-React-Fallback
Fallback ebenfalls fehlgeschlagen
  -> Session als failed markieren, keine leere Welt speichern
```

Alle Fallbacks speichern `generationStrategy`, Fehlercode, betroffenen Gate-Schritt und Reparaturanzahl in der Generation Session.

## 10. Vertical Slice: Ägypten

Die Architektur wird nicht zuerst vollautomatisch gebaut. Zuerst entstehen zwei handwerklich vollständige Phaser-Spiele auf derselben Runtime und demselben Learning Model. Damit wird bewiesen, dass Meoluna die gewünschte Qualität technisch tragen kann.

### 10.1 Gemeinsame Rahmenbedingungen

- Zielgruppe: 10 bis 12 Jahre
- Spielzeit pro Welt: 5 bis 8 Minuten
- Geräte: Touch, Maus und Tastatur
- Lernziele:
  1. Zusammenhang zwischen Nilüberschwemmung und Landwirtschaft
  2. Funktion von Hieroglyphen und Schreibern
  3. Grundidee der ägyptischen Gesellschaftsordnung
  4. religiöse Bedeutung von Mumifizierung und Jenseitsvorstellung
  5. organisatorische und materielle Anforderungen des Pyramidenbaus
- Jede Welt muss mindestens vier der fünf Ziele durch Handlungen vermitteln.
- Keine klassische Multiple-Choice-Ansicht.
- Beide Welten verwenden dieselbe Faktenbasis, aber unterschiedliche Experience Signatures.

### 10.2 Spiel A: Das Siegel des vergessenen Schreibers

**Genre:** Top-down Archäologie-Mystery

**Kernhandlungen:** Erkunden, beobachten, entschlüsseln, kombinieren, entkommen

**Struktur:** Drei verbundene Grabkammern mit wiederverwendbaren Hinweisen

Spielablauf:

1. Der Spieler untersucht Wandbilder und findet Hieroglyphen im Raum.
2. Zeichen werden nicht per Quiz übersetzt, sondern über räumliche Zusammenhänge und wiederkehrende Symbole erschlossen.
3. Eine Kammer rekonstruiert den Nilzyklus durch eine mechanische Wandkarte.
4. In der letzten Kammer müssen Hinweise zu Gesellschaft, Jenseitsvorstellung und Bauorganisation kombiniert werden, um das Siegel zu öffnen.
5. Falsche Kombinationen verändern den Raum und liefern neue beobachtbare Hinweise statt eines roten „Falsch“.

### 10.3 Spiel B: Stadt am großen Fluss

**Genre:** Kompaktes systemisches Aufbauspiel

**Kernhandlungen:** Planen, Wasser steuern, Ressourcen verteilen, bauen, abwägen

**Struktur:** Eine offene Simulationszone über drei Nilphasen

Spielablauf:

1. Der Spieler öffnet und schließt Kanäle während der Nilüberschwemmung.
2. Er verteilt Arbeitskräfte zwischen Feldern, Schriftverwaltung, Vorräten und Pyramidenbau.
3. Entscheidungen verändern Nahrung, Stabilität, Baufortschritt und Vertrauen der Bevölkerung.
4. Schreiber machen Ressourcen und Lieferketten erst planbar; ihre historische Funktion wird als System erlebt.
5. Mumifizierung und Jenseitsvorstellung beeinflussen Ziele und Prioritäten der Gesellschaft, ohne als isolierter Fragetext aufzutauchen.

### 10.4 Erfolg des Vertical Slices

Der Slice ist erfolgreich, wenn:

- beide Spiele ohne React und Sandpack laufen
- beide auf den drei Ziel-Viewports vollständig spielbar sind
- beide Playthrough-Pläne automatisch erfolgreich laufen
- die Experience-Ähnlichkeit unter `0.40` liegt
- mindestens vier Lernziele pro Spiel über Telemetrie nachgewiesen werden
- beide Spiele das menschliche Pilot-Gate bestehen
- der Auftraggeber nach tatsächlichem Spielen bestätigt, dass mindestens eines der Spiele klar in die gewünschte Richtung geht

Scheitert dieser Slice, wird keine automatische Phaser-Generierung gebaut. Stattdessen werden Runtime, GDD-Vertrag und Qualitätsmaßstab überarbeitet.

## 11. Umsetzungsphasen

### Phase 0: Aktuelle App reparieren

- Sandpack-Entry importiert explizit `/App.tsx`.
- Regressionstest verhindert die Rückkehr des eingebauten Sandpack-„Hello world“.
- Build und eine existierende Produktionswelt werden im Browser geprüft.

### Phase 1: Phaser Runtime und zwei Vertical Slices

- `phaser@4.2.1` installieren und pinnen.
- Runtime-Shell und `PhaserPreview` bauen.
- statischen Source-Validator implementieren.
- gemeinsame Ägypten-Faktenbasis und Learning Model festlegen.
- beide Spiele als unabhängige Phaser-Projekte umsetzen.
- Playwright-Playthroughs, Viewport-Screenshots und Performance-Probe hinzufügen.
- Auftraggeber spielt beide Welten; Ergebnis wird dokumentiert.

### Phase 2: Artifact-Modell und Admin-Generierung

- Schema um Runtime und Artifacts erweitern.
- WorldPreview-Dispatcher hinzufügen.
- Pitch-, GDD- und Originality-Schritte implementieren.
- Phaser-Source-Generator und einmalige Repair-Schleife hinzufügen.
- Generierung nur für Admins unter `PHASER_GENERATION_ENABLED` aktivieren.
- Automatisch generierte Phaser-Artifacts bleiben in dieser Phase `quarantined`, sind nur im Admin-Preview erreichbar und werden nicht an reguläre Nutzer ausgeliefert.
- bestehende Engine-Pipeline bleibt Standard für alle anderen Nutzer.

### Phase 3: Playtest Worker und Asset-Pipeline

- separaten Node/Playwright-Worker als lang laufenden Generierungsjob bereitstellen.
- Job-Aufrufe mit signierten Requests absichern.
- fal.ai-Assets sofort in Convex Storage persistieren.
- statische, Runtime-, Playthrough-, visuelle und Performance-Gates verbinden.
- nur vollständig bestandene Artifacts als `published` speichern.

### Phase 4: Kontrollierter Rollout

- zuerst interne Nutzer, danach kleiner prozentualer Anteil realer Generierungen.
- Fallback-Rate, Reparatur-Rate, Generierungszeit, Kosten und Spielabbrüche messen.
- Phaser wird erst Standard, wenn mindestens 90 % der Pilotgenerierungen ohne menschliche Code-Reparatur veröffentlichbar sind und das menschliche Qualitäts-Gate überwiegend bestehen.

## 12. Vorgeschlagene Code-Struktur

```text
src/components/game-runtime/
  PhaserPreview.tsx
  WorldRuntimeDispatcher.tsx
  bridge.ts
  types.ts

public/game-runtime/v1/
  index.html
  runtime.js
  phaser-4.2.1.min.js

convex/gameStudio/
  types.ts
  learningModel.ts
  creativeDirector.ts
  pitchSelector.ts
  originalityGate.ts
  designDocument.ts
  sourceGenerator.ts
  sourceValidator.ts
  artifactStore.ts
  orchestrator.ts

scripts/game-studio/
  sandbox-entry-check.mjs
  phaser-runtime-check.mjs
  egypt-tomb-playthrough.mjs
  egypt-city-playthrough.mjs
  experience-signature-check.mjs
```

Die bestehenden Dateien unter `convex/pipeline/engines/` werden in Phase 1 nicht verändert.

## 13. Teststrategie

### Unit- und Contract-Tests

- Learning Model verlangt Evidence of Mastery für jedes Kernziel.
- Pitch Set enthält fünf strukturell verschiedene Kandidaten.
- Originality Gate akzeptiert und verwirft bekannte Signaturen korrekt.
- Source Validator erkennt jede verbotene API.
- Bridge akzeptiert nur bekannte Nachrichtentypen und das zugehörige iframe.
- Legacy-Welten werden weiterhin an Sandpack geroutet.
- Phaser-Welten werden ausschließlich an PhaserPreview geroutet.

### Integrationstests

- autorisierter Artifact-Abruf für Eigentümer und öffentliche Welt
- verweigerter Abruf für fremde private Welt
- Asset-URLs sind erreichbar und gehören zum World Artifact
- Runtime READY/LOAD/ERROR/COMPLETE-Protokoll
- Unmount zerstört Phaser und Event Listener
- Fallback nach zwei fehlgeschlagenen Phaser-Versuchen

### End-to-End

- beide Ägypten-Spiele vollständig spielen
- Touch-, Maus- und Tastaturpfade
- Fehler machen, Hilfe erhalten und ohne Reload fortfahren
- Fortschritt und Abschluss genau einmal verbuchen
- drei Viewports ohne Überlappung oder unzugängliche Aktionen
- bestehende React-Welt weiterhin fehlerfrei spielen

## 14. Observability und Kosten

Pro Generierung werden gespeichert:

- Modell, Tokens, Dauer und Kosten je Schritt
- Anzahl Pitch-, Repair- und Fallback-Versuche
- nächste Experience-Ähnlichkeit
- Asset-Anzahl und Bytes
- Runtime-, Playthrough- und Performance-Ergebnis
- tatsächlich verwendete Generation Strategy
- Abbruchpunkt im Spiel und erreichte Lernziele

Personenbezogene Quelltexte, Kinderantworten und private Dokumentinhalte werden nicht in allgemeine Logs geschrieben. Debug-Berichte referenzieren IDs und Fehlercodes, nicht vollständige Nutzereingaben.

## 15. Explizite Nicht-Ziele

- keine 3D-Welten im ersten Release
- kein Multiplayer
- keine offene Netzwerkfähigkeit für generierten Code
- keine Abschaffung der bestehenden Engines vor erfolgreichem Pilot
- keine automatische Konvertierung alter React-Welten
- kein SEO-Rendering von Spielen auf `meoluna.com`
- kein Versuch, „Spaß“ allein durch LLM-Scores oder Screenshots zu beweisen

## 16. Referenzen

- Phaser positioniert sich als Web-zentriertes 2D-Game-Framework: <https://phaser.io/why-phaser>
- Phaser Scenes bündeln unter anderem Display, Update, Kamera, Input und Loader: <https://docs.phaser.io/phaser/concepts/scenes>
- Phaser vereinheitlicht Pointer-, Touch-, Tastatur- und Gamepad-Eingaben: <https://docs.phaser.io/phaser/concepts/input>
- Playwright Screenshot-Vergleiche: <https://playwright.dev/docs/test-snapshots>
