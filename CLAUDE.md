# CLAUDE.md - Meoluna Project Briefing

> **Neu hier?** Lies zuerst das zentrale Onboarding:
> `C:\Users\karent\.openclaw\workspace\ONBOARDING.md`

---

## Orchestration Workflow — meoluna.com

You (Fable) are the orchestrator: plan, decompose, synthesize. If a task is trivial (one file, under 5 minutes, no architectural impact), just do it yourself — no delegation overhead.

Subagent definitions: `.claude/agents/deep-reasoner.md` (Opus) and `.claude/agents/fast-worker.md` (Sonnet). Kickoff prompts per track: `docs/kickoff-prompts.md`.

### Active tracks
1. **Game engines** — extend the existing deterministic engines (currently 14 renderers in `convex/pipeline/engines/`): larger scope, more interactivity, higher production value and visual appeal. Every change must preserve Meoluna's core differentiator: no two generated worlds are ever structurally identical.
2. **Security audit** — the platform runs in schools and handles children's data. This is the highest-stakes track in this repo; treat it accordingly.
3. **Programmatic SEO pages** — one landing page per curriculum topic, generated at scale. Each page: SEO content, an embedded example game, flashcards, example tasks, and three downloadable PDFs (class test, learning-objective check, homework) — all matched to the stored curriculum.

### Delegation rules
- Architecture, engine/game design, curriculum data-model design, analysis of a fully packaged security finding → **deep-reasoner**
- Boilerplate, per-topic page/PDF generation, tests, formatting, mechanical edits → **fast-worker**
- Live/iterative debugging, or anything too entangled with prior conversation to package cleanly → handle yourself, don't delegate
- Independent second opinion, adversarial review, isolated patch → **Codex** (via CLI: `codex exec "<task>"`; the `/codex:rescue` plugin skill is not installed), treated as a peer, not a subordinate

### Track-specific routing
- **Engines**: new mechanics and anything touching the uniqueness architecture → deep-reasoner. Wiring an engine into the existing generation pipeline/sandbox → fast-worker. Get Codex's independent take on any engine architecture change in parallel with deep-reasoner (high blast radius — affects every future world).
- **Security**: dispatch deep-reasoner and Codex as two fully independent audits of the same scope, no shared context between them. Synthesize: findings confirmed by both first, then single-source findings with your own confidence rating. Anything touching PII, auth, session handling, data retention, or third-party data flows is high severity by default until shown otherwise.
- **SEO pages**: template/data-model design (what a page needs, how curriculum fields map to content) → deep-reasoner, once. Then batch generation of pages/PDFs → fast-worker, sample-first (3–5 pages across different subjects/grades) before scaling to the full curriculum.

### Conflict avoidance
fast-worker and Codex never write to the same working tree at the same time. Give Codex its own worktree, or keep it to analysis/read-only when fast-worker is active.

### High-stakes parallel synthesis (exception, not default)
For irreversible or broad-blast-radius decisions — engine architecture, anything affecting how children's data is stored/transmitted, the curriculum data model: dispatch deep-reasoner and Codex in parallel with no cross-visibility, then synthesize explicitly where they agree and disagree before acting.

### Output standards
- deep-reasoner returns: assumptions, confidence (high/medium/low), recommendation, open questions.
- fast-worker returns: diff summary, test result (pass/fail), any deviation from the plan — flagged, not silently decided.

### Your own context
Summarize subagent output before acting on it. Don't mirror full subagent reasoning traces back into your own context.

---

## 🤝 KOORDINATION: Fünf Agents, ein Repo

**OpenClaw + Claude Code + Goose arbeiten zusammen.**

### Die Agents (5 AIs + 1 Human)
| Agent | Stärke | Besonderheit |
|-------|--------|--------------|
| **OpenClaw** | Autonomie, 24/7, Allrounder | Arbeitet via WhatsApp/Telegram, proaktiv, Memory, kann selbst Skills schreiben. |
| **Claude Code** | Code-Tiefe, IDE-Integration | Primär Code-Experte, Skills-basiert, direkt im Terminal. |
| **Goose** | Lead/Worker, Recipes, Memory | Lokal, MCP-Server, gute Memory. |
| **Gemini/Antigravity** | Google-Integration | Neu im Team |
| **OpenAI Codex** | Code-Generierung | Neu im Team |

### Arbeitsaufteilung (flexibel)
| Bereich | Primär | Auch möglich |
|---------|--------|--------------|
| App-Code (`src/`, `convex/`) | Claude Code | Goose, OpenClaw |
| Content, Marketing, Daten | OpenClaw | Goose |
| Autonome Tasks (nachts/abwesend) | OpenClaw | - |
| Komplexe Debugging-Sessions | Goose, Claude Code | - |
| Scripts, Tooling | Alle | - |

### Regeln
1. **Vor dem Start:** `git pull` + CLAUDE.md checken ob ein anderer Agent gerade arbeitet
2. **Nach Abschluss:** Änderungen committen, CLAUDE.md updaten, Mission Control updaten
3. **Kommunikation:** Status-Updates in Activity Log + Mission Control
4. **Konflikte:** Wenn mehrere dieselbe Datei brauchen → Klaus fragen

### 🚀 Workflow nach Code-Änderungen (WICHTIG!)

**Nach jeder abgeschlossenen Implementierung SELBSTSTÄNDIG:**

1. **Git Commit & Push**
   ```bash
   git add <geänderte-dateien>
   git commit -m "feat/fix/chore: Beschreibung"
   git push
   ```

2. **Deploy auslösen** (falls nötig)
   - Convex: `npx convex deploy` (bei Backend-Änderungen)
   - Vercel: Automatisch bei Push zu main

3. **Mission Control updaten**
   ```bash
   # Task-Status updaten
   curl -X PATCH -H "Authorization: Bearer ${MISSION_CONTROL_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"status": "Done"}' \
     "https://mission-control-etj.pages.dev/api/tasks/<task-id>?project=meoluna"
   ```

4. **Activity Log in CLAUDE.md updaten** mit:
   - Was wurde implementiert
   - Welche Dateien wurden geändert
   - Aktueller Status

5. **Task beenden** (nur wenn wirklich fertig!)

**Keine halben Sachen!** Erst wenn alles committed, deployed und dokumentiert ist, ist der Task abgeschlossen.

### Aktueller Status (2026-02-05 22:00)
| Agent | Status | Working On |
|-------|--------|------------|
| OpenClaw | 🔄 Active | Content, Marketing |
| Claude Code | ✅ Done | Kimi Wave 1 Import abgeschlossen |
| Goose | ⏸️ Idle | - |
| Gemini | 🆕 Neu | Onboarding |
| Codex | 🔄 Active | Kimi Lernwelten-Generierung |

### Nächste Tasks (noch zu vergeben)
- [ ] Blog-System mit Content verbinden
- [x] XP-Anzeige Konsistenz Fix (Claude Code) ✅
- [x] Kimi Wave 1 Import (Claude Code) ✅
- [ ] Kimi Wave 2 starten (Codex)

### 🎯 Mission Control API (für Task-Tracking)

**URL:** `https://mission-control-etj.pages.dev`
**Auth:** `Authorization: Bearer ${MISSION_CONTROL_TOKEN}`
**Projekt:** `meoluna`

#### Alle Tasks abrufen
```bash
curl -H "Authorization: Bearer ${MISSION_CONTROL_TOKEN}" \
  "https://mission-control-etj.pages.dev/api/tasks?project=meoluna"
```

#### Neuen Task erstellen
```bash
curl -X POST -H "Authorization: Bearer ${MISSION_CONTROL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task-Titel hier",
    "status": "In Progress",
    "notes": "Beschreibung was gemacht wird",
    "tags": "meoluna,feature,bereich"
  }' \
  "https://mission-control-etj.pages.dev/api/tasks?project=meoluna"
```

#### Task updaten (Status ändern)
```bash
curl -X PATCH -H "Authorization: Bearer ${MISSION_CONTROL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status": "Done", "notes": "Ergebnis: Was wurde erreicht. Commit xyz."}' \
  "https://mission-control-etj.pages.dev/api/tasks/<TASK-ID>?project=meoluna"
```

#### Verfügbare Status-Werte
| Status | Verwendung |
|--------|------------|
| `Backlog` | Geplant, aber noch nicht begonnen |
| `In Progress` | Aktiv in Arbeit |
| `In Review` | Fertig, wartet auf Review/Test |
| `Blocked` | Blockiert durch Abhängigkeit |
| `Done` | Abgeschlossen |

#### Task-Felder
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `title` | string | Kurzer Titel (Pflicht) |
| `status` | string | Siehe Status-Werte oben |
| `notes` | string | Längere Beschreibung, Ergebnisse, Links |
| `tags` | string | Komma-separiert: `meoluna,feature,frontend` |
| `owner` | string | Wer arbeitet dran (optional) |
| `due` | string | Fälligkeitsdatum ISO-Format (optional) |

#### Workflow für Agents
1. **Vor Arbeitsbeginn:** Task erstellen mit `status: "In Progress"`
2. **Während Arbeit:** Bei Bedarf `notes` updaten
3. **Nach Abschluss:** Status auf `"Done"` setzen + Ergebnis in `notes`

**Regel:** Jeder abgeschlossene Task muss in Mission Control dokumentiert sein!

---

## Was ist Meoluna?

**"Lovable für Bildung"** — Eine App die interaktive Lernwelten aus natürlicher Sprache oder PDFs generiert.

**Mission:** Die Welt schlauer machen. Spielend lernen, gemeinsam wachsen.

---

## Tech Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | Vite + React 18 + TypeScript |
| **Backend** | Convex (real-time DB + serverless functions) |
| **Auth** | Clerk |
| **UI** | shadcn/ui (Radix + Tailwind + CVA) |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **OCR** | PaddleOCR (separater Python-Service) |
| **Background Jobs** | Inngest (geplant) |

---

## Projektstruktur

```
meoluna/
├── src/
│   ├── components/     # React Components
│   │   ├── ui/         # shadcn/ui Basis-Components
│   │   ├── landing/    # Landing Page Sections
│   │   ├── layout/     # Layout Components
│   │   └── icons/      # Custom Icons
│   ├── pages/          # Route Pages
│   ├── hooks/          # Custom React Hooks
│   └── lib/            # Utilities
├── convex/             # Backend (Convex)
│   ├── schema.ts       # Datenbank-Schema
│   ├── worlds.ts       # Lernwelten CRUD
│   ├── generate.ts     # AI Generation Actions
│   ├── documents.ts    # PDF/OCR Handling
│   └── blog.ts         # Blog Posts
├── api/                # Vercel Serverless (falls nötig)
├── paddleocr-service/  # Python OCR Service
└── public/             # Static Assets
```

---

## Kernkonzepte

### 1. Lernwelten (Worlds)
- User beschreibt was er lernen will
- AI generiert React-Code
- Code wird in sandboxed iframe gerendert
- User kann speichern, teilen, Fortschritt tracken

### 2. PDF-to-World
- Lehrer lädt Arbeitsblatt hoch
- PaddleOCR extrahiert Text
- AI macht daraus interaktive Lernwelt

### 3. Progress System
- XP-basiert
- Module innerhalb einer Welt
- Fortschritt wird pro User gespeichert

---

## Convex Schema (Kurzform)

```typescript
worlds: { title, prompt, code, userId, gradeLevel, subject, isPublic, views, likes }
messages: { worldId, role, content, code, createdAt }
users: { clerkId, email, name, role: student|creator|teacher|admin }
progress: { userId, worldId, moduleIndex, xp, completedAt }
classrooms: { name, description, teacherId, inviteCode, gradeLevel, subject, isArchived }
classroomMembers: { classroomId, userId, role: student|assistant, joinedAt }
classroomAssignments: { classroomId, worldId, assignedBy, title, instructions, dueDate, isRequired }
blogPosts: { slug, title, content, category, tags, isPublished }
```

---

## Wichtige Dateien

| Datei | Funktion |
|-------|----------|
| `src/pages/Create.tsx` | Haupt-Generator (Chat + Preview) |
| `src/pages/WorldView.tsx` | Lernwelt spielen |
| `src/pages/Dashboard.tsx` | User Dashboard |
| `src/pages/Explore.tsx` | Öffentliche Welten entdecken |
| `src/pages/TeacherDashboard.tsx` | Lehrer-Dashboard (Klassen verwalten) |
| `src/pages/ClassroomDetail.tsx` | Einzelne Klasse (Schüler, Assignments) |
| `src/pages/JoinClassroom.tsx` | Klasse beitreten (für Schüler) |
| `src/components/WorldPreview.tsx` | Sandboxed Code Renderer |
| `src/components/ProgressStats.tsx` | XP/Level Anzeige |
| `convex/generate.ts` | AI Generation Logic |
| `convex/documents.ts` | PDF Extraction |
| `convex/progress.ts` | XP/Level System |
| `convex/classrooms.ts` | Classroom CRUD |

---

## Commands

```bash
# Development
npm run dev           # Vite Frontend
npm run dev:convex    # Convex Backend
npm run dev:all       # Beide parallel

# Build
npm run build         # Production Build

# PaddleOCR Service (separates Terminal)
cd paddleocr-service && python main.py
```

---

## Environment Variables

Siehe `.env.example` für alle Keys. Wichtig:
- `CONVEX_DEPLOYMENT` - Convex Project
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk Auth
- `OPENAI_API_KEY` oder `ANTHROPIC_API_KEY` - AI Generation
- `PADDLEOCR_URL` - OCR Service Endpoint

---

## Code Style

- **TypeScript** überall, strict mode
- **shadcn/ui** für neue UI Components (`npx shadcn-ui@latest add <component>`)
- **Convex Conventions**: queries sind `query()`, mutations sind `mutation()`, actions sind `action()`
- **Deutsche UI** - App ist auf Deutsch
- **Animations** sparsam, mit Framer Motion

---

## Aktuelle Prioritäten (Update 2026-02-01 19:00)

### PRIO 1: Progress System ✅ FERTIG
- [x] XP-Tracking wenn User Module abschließt
- [x] Level-System (XP → Level)
- [x] Progress-Dashboard im User-Bereich (ProgressStats.tsx)
- [ ] Badges/Achievements (später)

### PRIO 2: Rollen-System ✅ FERTIG
- [x] Teacher zu Schema hinzufügen (`student|creator|teacher|admin`)
- [ ] Rollenbasierte UI (Navbar zeigt Teacher-Link für alle)
- [ ] Permissions in Convex Functions (noch offen)

### PRIO 3: Teacher/Classroom Features ✅ FERTIG
- [x] Klassen/Gruppen erstellen (`/teacher`)
- [x] Schüler einladen (6-stelliger Invite-Code)
- [x] Schüler beitreten (`/join`)
- [x] Welten an Klassen zuweisen
- [x] Schüler-Fortschritt Dashboard
- [ ] Reports: Detaillierte Berichte (später)

### PRIO 4: Bewertungs-System
- [ ] Likes (views/likes Felder existieren)
- [ ] Sterne-Rating (1-5)?
- [ ] Reviews/Kommentare

### Kontext: Share-First Philosophy
**"Es soll sich schlecht anfühlen, nicht zu teilen."**
- Sharing = Default
- Gute Creator werden belohnt
- KEIN Social Network (kein Feed, keine Follower)

### Infrastruktur (vorher)
1. **PaddleOCR Railway** - Config-Pfad fixen (siehe Activity Log)
2. **Stabilität** - Generation zuverlässig
3. **Auto-Fix** - Fehlerhafte Welten reparieren

---

## Deployment & Services

| Service | Provider | Status | URL |
|---------|----------|--------|-----|
| Frontend | Vercel | ✅ Live | meoluna.de |
| Backend | Convex | ✅ Live | dashboard.convex.dev |
| Auth | Clerk | ✅ Live | clerk.com |
| OCR | Railway | ⚠️ Config Fix needed | meoluna-production.up.railway.app |
| Domain | Raidboxes | ✅ | meoluna.de |
| CDN | Cloudflare | ✅ | cloudflare.com |
| AI Jobs | Inngest | ⚠️ Konfiguration pending | |

### Railway CLI (eingerichtet)
```bash
railway login --browserless   # Bereits authentifiziert
railway logs --service meoluna
railway up --service meoluna
```

### Railway Projekt
- **Projekt:** virtuous-compassion
- **Service:** meoluna

---

## Offene Tasks

### PaddleOCR Railway (PRIORITY)
- [ ] Railway Config-Pfad fixen:
  - **Problem:** Railway sucht `paddleocr-service/paddleocr-service/railway.json`
  - **Fix:** Settings → Root Directory: `paddleocr-service`, Config Path: `railway.json`
- [ ] Nach Fix neu deployen
- [ ] PDF Upload in `/create` testen

### Inngest
- [ ] Konfiguration prüfen

---

## Kontakt

- **Entwickler:** Klaus Arent
- **Geschäftsführer (Persona):** Kai Linden
- **E-Mail:** info@meoluna.com

---

# Activity Log

## 2026-02-01 - PaddleOCR Integration Session

### Implementiert ✅
| Komponente | Beschreibung |
|------------|--------------|
| `paddleocr-service/` | Docker-basierter OCR Service mit FastAPI |
| `paddleocr-service/main.py` | Endpoints: `/health`, `/extract-pdf`, `/extract-base64`, `/extract-image` |
| `paddleocr-service/Dockerfile` | Python 3.10 slim-bookworm, PaddleOCR 2.7.3 |
| `paddleocr-service/railway.json` | Railway Deployment Config |
| `convex/documents.ts` | `extractTextFromPDF` und `checkOCRService` Actions |
| `src/components/PdfUpload.tsx` | Drag & Drop PDF Upload Komponente |
| `src/pages/Create.tsx` | PDF Upload Integration |
| Landing Page Redesign | StarField, HeroSection, FeaturesSection, etc. |
| Meoluna Theme | CSS Variables für moon, stars, aurora, nebula |

### Commits
```
fix: Add libgomp1 for PaddlePaddle OpenMP support
fix: Update PaddleOCR API for v3+ (remove deprecated use_gpu, show_log)
fix: Add robust error handling for PaddleOCR v3+
fix: Pin PaddleOCR to v2.7.3 for stability and lower memory usage
chore: Force rebuild with PaddleOCR 2.7.3
fix: Disable Docker cache to force clean rebuild
```

### Probleme & Lösungen
| Problem | Lösung | Status |
|---------|--------|--------|
| Debian Trixie hat `libgl1-mesa-glx` nicht | Base image zu `bookworm` gewechselt | ✅ |
| `libgomp.so.1` fehlt | `libgomp1` zu apt-get hinzugefügt | ✅ |
| PaddleOCR v3 API Breaking Changes | Parameter `use_gpu`, `show_log`, `cls` entfernt in v3 | ✅ |
| PaddleOCR v3 Memory ~1GB, Container crasht | Auf v2.7.3 gepinnt | ✅ |
| Railway Docker Cache | `dockerBuildNoCache: true` in railway.json | ✅ |
| Railway Config-Pfad falsch | Fix: Root Dir + Config Path Settings | ⚠️ PENDING |

### Nächste Schritte
1. Railway Dashboard → Service Settings
2. Root Directory: `paddleocr-service`
3. Config Path: `railway.json` (nicht `paddleocr-service/railway.json`)
4. Neu deployen
5. Testen

### Technische Details
- **PaddleOCR Version:** 2.7.3 (stabiler als v3)
- **PaddlePaddle Version:** 2.5.2
- **Railway Projekt:** virtuous-compassion
- **Railway Service:** meoluna
- **Convex Env:** `PADDLEOCR_URL=https://meoluna-production.up.railway.app`

---

## 2026-02-01 - Classroom System Implementation

### Implementiert ✅
| Komponente | Beschreibung |
|------------|--------------|
| `convex/schema.ts` | Teacher-Rolle + classrooms/members/assignments Tabellen |
| `convex/classrooms.ts` | Vollständiges CRUD für Classroom-System |
| `src/pages/TeacherDashboard.tsx` | Lehrer-Dashboard mit Klassenübersicht |
| `src/pages/ClassroomDetail.tsx` | Einzelne Klasse verwalten (Schüler, Assignments) |
| `src/pages/JoinClassroom.tsx` | Schüler können mit Code beitreten |
| `src/components/layout/Navbar.tsx` | Teacher-Link hinzugefügt |
| `src/App.tsx` | Routes: /teacher, /teacher/classroom/:id, /join |

### Features
- 6-stelliger Invite-Code (keine verwechselbaren Zeichen)
- Klassen mit Klassenstufe und Fach
- Welten an Klassen zuweisen mit optionalen Anweisungen und Fälligkeitsdatum
- Schüler-Fortschritt pro Assignment tracken
- Code-Regenerierung für Sicherheit

### Neue Routes
| Route | Funktion |
|-------|----------|
| `/teacher` | Lehrer-Dashboard |
| `/teacher/classroom/:id` | Klassen-Detail |
| `/join` | Klasse beitreten (mit ?code=ABC123) |

---

## 2026-02-02 - Meoluna Tracking Engine Implementation

### Implementiert ✅
| Komponente | Beschreibung |
|------------|--------------|
| `convex/schema.ts` | +4 Tabellen: sessionClicks, userIdentityGraph, analyticsEvents, conversions |
| `convex/http.ts` | HTTP Router für `/api/track/pageview` und `/api/track/event` |
| `convex/analytics/serverSideCollector.ts` | `collectClick` Mutation + Session-Handling |
| `convex/analytics/identityResolution.ts` | `resolveIdentity`, `linkUserId`, Identity-Merging |
| `convex/analytics/eventTracking.ts` | `trackEvent` Mutation + Query-Funktionen |
| `src/lib/analytics/types.ts` | TypeScript Types für alle Events |
| `src/lib/analytics/MeolunaAnalytics.ts` | Client-Side Analytics Singleton Class |
| `src/hooks/useAnalytics.ts` | React Hook mit Auto-Init + Page-Tracking |
| `src/App.tsx` | `useAnalytics()` Hook integriert |

### Features
- **Server-Side Click Tracking:** IP-Hashing (DSGVO), fbclid/gclid/ttclid/UTM-Parameter
- **Identity Resolution:** Anonymous → User Linking, Identity-Merging bei Login
- **Event Tracking:** Meoluna-spezifische Events (session_started, page_viewed, world_generation_completed, etc.)
- **Auto Page Tracking:** Route-Changes werden automatisch getrackt
- **User Linking:** Clerk-User wird automatisch mit Anonymous-ID verknüpft
- **Cross-Platform Ready:** Schema unterstützt web/ios/android

### Commits
```
b170dea feat: Implement Meoluna Tracking Engine (Server-Side Analytics)
8cdb575 fix: Replace Node.js crypto with Convex-compatible hash function
```

### Technische Details
- **Hash-Algorithmus:** djb2 (statt SHA-256, da Convex kein Node.js crypto)
- **Session Timeout:** 30 Minuten
- **Storage:** localStorage (anonymousId), sessionStorage (sessionId)
- **Convex HTTP Endpoints:** /api/track/pageview, /api/track/event

### Nächste Schritte (optional)
1. `convex/analytics/reporting.ts` - Dashboard Queries
2. `convex/analytics/conversionAPI.ts` - Facebook/Google Conversion API
3. Events an kritischen Stellen einbauen (Signup, World-Create, etc.)

---

## 2026-02-05 - Kimi Agent Swarm Wave 1 Complete

### Implementiert ✅
| Komponente | Beschreibung |
|------------|--------------|
| `kimi/KIMI_LERNWELTEN_PROMPT.md` | Aktualisiert auf 1062 Topics, konsistente API-Doku |
| `kimi/api/MEOLUNA_API.md` | Vereinheitlicht (kein typeof-Check, complete(finalScore?)) |
| `kimi/SCHNELLREFERENZ.md` | 5 Module, konsistente Beispiele |
| `kimi/scripts/validate_kimi_worlds.ps1` | QA-Validator für generierte Welten |
| `scripts/import_final_lernwelten.mjs` | Import-Script für Kimi-Welten |

### Schema-Entscheidung (Konsens Claude Code + Codex)
- **7 Interaction Types FEST:** multiple-choice, fill-blank, matching, sorting, true-false, short-answer, image-analysis
- **Visuals FREI:** JSX, SVG, Tailwind, p5, Recharts, Framer Motion
- **Metadata OPTIONAL:** variant, difficulty, visualType (für Analytics)

### 19 Lernwelten importiert und LIVE
| Fach | Anzahl | Klassenstufen |
|------|--------|---------------|
| Mathematik | 10 | 1-4 |
| Deutsch | 5 | 1-2 |
| Englisch | 2 | 5 |
| Sachunterricht | 2 | 1 |

**URLs:** `https://meoluna.com/w/{id}` - siehe `kimi/output/import_report.json`

### Commits
```
4a08df8 feat: Add Kimi learning worlds import script (19 worlds)
e5a001a feat: Complete curriculum import with 1062 topics
e4c8252 feat: Add Node.js topic import script
8b8492f feat: Add curriculum PDF parser scripts
```

### Agent: Claude Code

---

## 2026-07-04 - Engine-Upgrade Wave 0+1 (kidKit, Uniqueness-Check, neue Modi)

### Architektur-Entscheidungen (Synthese deep-reasoner + Codex, unabhängige Audits)
- **kidKit** (`convex/pipeline/engines/kidKit.ts`): Shared-UI-Fragmente als Build-Time-String-Komposition, inline in den emittierten Sandbox-Code. KEIN Runtime-Import, kein Sandbox-Umbau. Enthält: seeded PRNG (mulberry32+djb2), 5 Backdrop-Themes (wiese/dämmerung/weltraum/unterwasser/wald), WebAudio-Sound (default STUMM + Toggle), StreakMeter, Luno/Sky/SpeechBubble/etc.
- **Seed-Kosmetik**: optionales Spec-Feld `seed` (Fallback: worldName-Hash) wählt Theme deterministisch — Varianz ohne Extra-Token, replay-sicher.
- **Uniqueness messbar**: `structureSignature.ts` (Skelett-Hash ohne Content) + `npm run uniqueness-check` (Fixture-Signaturen paarweise verschieden + Theme-Spread). Speicherzeit-Gate bewusst vertagt.
- **Spec-Evolution nur additiv**: neue Felder optional, Legacy-Fixtures bleiben für immer als Backward-Compat-Beweis.
- Harte Regeln: jede Drag-Mechanik braucht Tipp-Fallback (Kl. 1); Sound startet stumm (Klassenraum).

### Engine-Upgrades (Wave 1)
| Engine | Neu |
|--------|-----|
| pattern | Modi **build** (nächste Periode selbst bauen) + **grow** (wachsende Muster), Kachel-Töne/Melodie, Modus-Diversitäts-Validator |
| sort-match | Modi **odd-one-out** + **two-axis** (2x2-Raster), kidKit, seeded Pair-Shuffle (Math.random-Fix) |
| word-builder | Modi **scramble** + **listen-and-build** (Phonics), kidKit, Math.random → seeded PRNG (Determinismus-Fix) |

### Tests (alle grün)
Alle 14 Golden-Checks, playthrough-smoke (Klick→XP-Contract), uniqueness-check, visual-regression (Baselines aktualisiert), tsc.

### Offene Waves (Priorisierung aus Synthese)
- Wave 2: counting, money, clock, building-construct (+ Math.random-Fix building/movement/timeSequence/focusedArithmetic)
- Wave 3: mixing-balance, detective-evidence, time-sequence, map, chart, diagram
- Wave 4: movement-space auf kidKit nachziehen; optional Speicherzeit-Fingerprint-Gate

### Agent: Claude Code (Fable, Orchestrator) + deep-reasoner + Codex + 2× fast-worker

---

*Letztes Update: 2026-07-04*
