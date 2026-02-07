# MEOLUNA — Übergabe-Dokument für neue KI

**Erstellt:** 07.02.2026
**Von:** Claude Code (Opus 4.6)
**Für:** Nächste KI, die an Meoluna weiterarbeitet
**Auftraggeber:** Klaus Arent (Head of Marketing, "KI ohne Bullshit")

---

## WAS IST MEOLUNA?

Lernapp für Kinder/Familien. Nutzer beschreiben ein Thema ("Römisches Reich Klasse 6"), eine 10-Schritt-KI-Pipeline generiert daraus eine spielbare React-Lernwelt mit Minigames. Kostet ~€4 pro Generierung (Anthropic API + fal.ai).

**Live:** https://meoluna.com
**Repo:** `C:\Users\karent\Documents\Software\meoluna`
**GitHub:** https://github.com/strategiert/meoluna

---

## TECH STACK

| Was | Technologie |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| Backend/DB | **Convex** (NICHT Supabase!) |
| Auth | Clerk |
| Hosting Frontend | Vercel (auto-deploy bei push auf main) |
| Hosting Backend | Convex Cloud (`helpful-blackbird-68.convex.cloud`) |
| KI | Anthropic Claude (Opus + Sonnet) |
| Bilder | fal.ai |
| Styling | Tailwind CSS |

### KRITISCH: Zwei separate Deployments!

1. **Frontend** → Vercel → automatisch bei `git push origin main`
2. **Backend** → Convex → **MANUELL** mit `npx convex deploy --yes`

**Git push alleine reicht NICHT.** Nach jeder Änderung an `convex/`-Dateien MUSS `npx convex deploy --yes` ausgeführt werden. Das wurde mehrfach vergessen und hat Stunden gekostet.

---

## ARCHITEKTUR-ÜBERBLICK

```
Nutzer gibt Prompt ein (Create.tsx)
        ↓
generateWorldV2() — Convex Action
        ↓
┌─────────────────────────────────────────────┐
│  PIPELINE V2 (10 Schritte, sequenziell)     │
│                                             │
│  1. Interpreter      → Thema analysieren    │
│  2. Creative Director → Universum erfinden  │
│  3. Game Designer    → Minigames designen   │
│  4. Asset Planner    → Grafiken planen      │
│  5. Asset Generator  → Bilder via fal.ai    │
│  6. Content Architect → Challenges + Lösungen│
│  7. Quality Gate     → Qualitätsprüfung     │
│  8. Code Generator   → React-Code erzeugen  │
│  9. Validator        → Syntax prüfen/fixen  │
│  10. Output          → In DB speichern      │
└─────────────────────────────────────────────┘
        ↓
React-Code wird in Sandbox.tsx ausgeführt (iframe)
        ↓
Nutzer spielt die Lernwelt
```

---

## SCHLÜSSEL-DATEIEN

### Frontend
| Datei | Funktion |
|---|---|
| `src/pages/Create.tsx` | Hauptseite für Welt-Generierung. Ruft `generateWorldV2` auf |
| `src/components/Sandbox.tsx` | **KRITISCH** — iframe-basierte Code-Ausführung |
| `src/components/GenerationProgress.tsx` | Fortschrittsanzeige während Generierung |
| `src/hooks/useAnimatedTitle.ts` | Mond-Phasen im Browser-Tab |
| `src/App.tsx` | Routing, globale Hooks |

### Backend (Convex)
| Datei | Funktion |
|---|---|
| `convex/pipeline/orchestrator.ts` | **HAUPTDATEI** — koordiniert alle 10 Schritte |
| `convex/pipeline/types.ts` | TypeScript-Interfaces für alle Pipeline-Outputs |
| `convex/pipeline/status.ts` | Echtzeit-Fortschritt (generationSessions-Tabelle) |
| `convex/pipeline/prompts/*.ts` | System-Prompts für jeden Schritt |
| `convex/pipeline/steps/*.ts` | Implementierung jedes Schritts |
| `convex/pipeline/utils/anthropicClient.ts` | Anthropic API Wrapper |
| `convex/pipeline/utils/falClient.ts` | fal.ai API Wrapper |
| `convex/pipeline/utils/validation.ts` | Code-Validierung |
| `convex/schema.ts` | Datenbank-Schema |

---

## DIE SANDBOX — DAS GRÖSSTE PROBLEMKIND

`src/components/Sandbox.tsx` führt den generierten React-Code in einem iframe aus. Das ist der fragile Teil des Systems.

### So funktioniert's:
1. Generierter Code kommt als String rein
2. ES6 Imports werden zu dynamischen `await import("https://esm.sh/...")` umgeschrieben
3. `export` Statements werden entfernt
4. PI/TWO_PI Redeclarations werden entfernt (Konflikt mit p5.js)
5. React + alle Hooks werden als `window.*` Globals geladen **VOR** dem User-Code
6. Babel transpiliert JSX → JavaScript
7. Code wird als `<script type="module">` ins iframe injiziert

### Verfügbare Pakete (Import Map):
- react, react-dom/client
- framer-motion, lucide-react
- canvas-confetti, recharts
- @dnd-kit/core, p5, howler
- clsx, lodash, date-fns, zustand

### Meoluna API (automatisch im iframe verfügbar):
```javascript
Meoluna.reportScore(punkte, { action: 'correct', module: 0 });
Meoluna.completeModule(moduleIndex);
Meoluna.complete(totalScore);
```

### BEKANNTE PROBLEME (Stand 07.02.2026):
1. **React is not defined** — Wurde gefixt mit `window.React = ...` vor User-Code (Commit `5fe1b91`). Aber: **Noch nicht verifiziert ob der Fix funktioniert!**
2. **PI Redeclaration** — Wird gestrippt, aber p5.js Warnung bleibt in Console
3. **Fehlender Weiter-Button** — Der generierte Code hat oft keine Navigation zwischen Modulen/Challenges
4. **Mixed Import Kollision** — `_mod` Variable bei mehreren `import X, { Y } from 'pkg'` Statements. Wurde zu separaten Imports geändert (noch ungetestet)

---

## WAS WURDE IN DIESER SESSION GEMACHT

### Commits (chronologisch):
| Commit | Was |
|---|---|
| `26763cf` | **Minigame-Shift** — Alle Prompts von Schulaufgaben auf Minigames umgestellt |
| `3f065d5` | Sandbox: Doppelte React-Imports strippen (hat dann useState kaputt gemacht) |
| `e5d530f` | Sandbox: Aggressives Stripping rückgängig, sichere Variable-Namen |
| `af17d2a` | Animierter Mond-Tab-Titel |
| `1ba2181` | Duplikat-Welten verhindert (V2 speichert direkt, Save navigiert nur) |
| `5fe1b91` | React global vor User-Code laden (window.React + Hooks) |

### Was NICHT funktioniert hat:
- Jeder Sandbox-Fix hat einen neuen Bug erzeugt
- V2 Pipeline wurde nie erfolgreich End-to-End getestet
- Ob V2 tatsächlich benutzt wird (statt V1) wurde nie im Log verifiziert
- Generierte Welten wurden inhaltlich nie geprüft

---

## OFFENE PROBLEME (PRIORITÄT)

### 1. SANDBOX STABILISIEREN (HÖCHSTE PRIORITÄT)
Die Sandbox ist das Nadelöhr. Solange der generierte Code nicht zuverlässig läuft, ist alles andere egal.

**Empfehlung:** Statt immer neue Regex-Hacks → **richtiger Ansatz:**
- Babel mit `runtime: 'automatic'` nutzen (kein `React.createElement` mehr nötig)
- ODER: Import Map im Browser nutzen statt Regex-Replacement
- Generierte Test-Codes manuell in der Sandbox testen bevor Pipeline deployed wird

### 2. V2 VERIFIZIEREN
Niemand weiß ob V2 tatsächlich läuft. Schritte:
- Convex Dashboard öffnen (`helpful-blackbird-68.convex.cloud`)
- generationSessions-Tabelle prüfen — gibt es Sessions mit `status: "completed"`?
- Logs prüfen ob `generateWorldV2` aufgerufen wird
- Falls V1 (`generateWorld`) noch aufgerufen wird: Create.tsx prüfen

### 3. GENERIERTER CODE: NAVIGATION FEHLT
Der Code-Generator-Prompt hat zwar Anweisungen für Hub-Navigation und Modul-Abschluss, aber der generierte Code implementiert das oft nicht. Der "Weiter"-Button fehlt.

**Mögliche Ursachen:**
- Prompt ist zu lang und die Navigation-Anweisungen gehen unter
- Content Architect liefert keine klare Modul-Struktur
- Code Generator ignoriert die Navigation-Patterns

### 4. QUALITÄT DER GENERIERTEN WELTEN
Klaus sagt: "Sieht alles genau so aus wie V1." Das bedeutet entweder:
- V2 läuft nicht (siehe Punkt 2)
- Oder V2 läuft, aber die Prompts erzeugen trotzdem quiz-artige Inhalte

---

## ENVIRONMENT VARIABLES

### Convex Production (`helpful-blackbird-68.convex.cloud`)
- `ANTHROPIC_API_KEY` = `sk-ant-api03-Izq6aucwG99nDz...` (gesetzt)
- `FAL_API_KEY` = `985a816d-b7f2-496d-bd5e-7106f9bd0c1d:...` (gesetzt)

### Convex Dev (`merry-leopard-276.convex.cloud`)
- Separate Instanz für lokale Entwicklung

### Vercel
- Auto-Deploy von `main` Branch

---

## DATENBANK-SCHEMA (Wichtigste Tabellen)

### worlds
```
title, code (React-String), userId, gradeLevel, subject, isPublic, views, likes
```

### generationSessions (Pipeline-Fortschritt)
```
sessionId, userId, status (running|completed|failed), currentStep (0-9), stepLabel, worldId
```

### progress (Nutzer-Fortschritt pro Welt)
```
userId, worldId, moduleIndex, worldScore, xpEarned, completedAt
```

---

## PIPELINE V2: TYPE-INTERFACES (Kurzfassung)

### generateWorldV2 Input:
```typescript
{ prompt: string, pdfText?: string, userId: string, sessionId: string, gradeLevel?: string, subject?: string }
```

### generateWorldV2 Output:
```typescript
{ worldId: Id<"worlds">, code: string, worldName: string, duration: number, qualityScore: number }
```

### ContentChallenge (was der Content Architect liefert):
```typescript
{
  id: string
  type: string           // "slider", "drag-drop", "matching", "sorting", "number-input", etc.
  challengeText: string
  gameData: Record<string, unknown>   // Typ-spezifische Daten
  correctAnswer: string | number
  tolerance?: number
  feedbackCorrect: string
  feedbackWrong: string
  hints: { level1: string, level2: string, level3: string }
  xpValue: number
}
```

### GameDesignerModule:
```typescript
{
  index: number, title: string, learningFocus: string,
  gameplayType: string,    // z.B. "drag-and-drop", "slider", "sorting"
  interactionMethod: string, winCondition: string,
  estimatedChallenges: number
}
```

---

## BEFEHLE

```bash
# Lokale Entwicklung
cd C:\Users\karent\Documents\Software\meoluna
npm run dev:all          # Frontend + Convex dev gleichzeitig

# Deployment
git add <files>
git commit -m "beschreibung"
git push origin main     # → Vercel Frontend Deploy (auto)
npx convex deploy --yes  # → Convex Backend Deploy (MANUELL!)

# Convex Env Vars
npx convex env list --url https://helpful-blackbird-68.convex.cloud
npx convex env set KEY "value"

# TypeScript Check
npx tsc --noEmit --pretty
```

---

## MISSION CONTROL

- URL: https://mission-control-etj.pages.dev
- API Key: `a8c0ea72755c4fe081c5156a03060695`
- Projekt: `meoluna`
- Auth: `?apiKey=...` oder Bearer Token

---

## HINWEISE FÜR DIE NÄCHSTE KI

1. **Jede Generierung kostet ~€4.** Teste gründlich bevor du Klaus bittest zu testen.
2. **Convex Deploy nicht vergessen.** Das ist der #1 Fehler gewesen.
3. **Sandbox nicht mit Regex-Hacks fixen.** Der richtige Ansatz wäre ein sauberer Import-Mechanismus.
4. **Klaus will Ergebnisse, keine Erklärungen.** "Machen, nicht fragen."
5. **Deutsche Umlaute:** ä, ö, ü, ß — NIEMALS ae, oe, ue.
6. **V2 Pipeline erst verifizieren** bevor neue Features gebaut werden.
7. **Generierte Welten im Browser testen** bevor "fertig" gemeldet wird.
