# CLAUDE.md - Meoluna Project Briefing

---

## 🤝 KOORDINATION: Claw + Claude Code

**Zwei Agents, ein Repo. So vermeiden wir Konflikte:**

### Arbeitsaufteilung
| Agent | Zuständigkeit | Dateien |
|-------|---------------|---------|
| **Claude Code** | App-Entwicklung | `src/`, `convex/`, `api/` |
| **Claw (OpenClaw)** | Content, Marketing, Daten | `content/`, `scripts/`, `data/`, Docs |

### Regeln
1. **Vor dem Start:** `git pull` + CLAUDE.md checken ob der andere gerade arbeitet
2. **Nach Abschluss:** Änderungen committen, CLAUDE.md updaten
3. **Kommunikation:** Status-Updates in Activity Log unten
4. **Konflikte:** Wenn beide dieselbe Datei brauchen → Klaus fragen

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
   curl -X PATCH -H "Authorization: Bearer a8c0ea72755c4fe081c5156a03060695" \
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

### Aktueller Status (2026-02-01 21:30)
| Agent | Status | Working On |
|-------|--------|------------|
| Claude Code | ⏸️ Idle | Progress System fertig |
| Claw | 🔄 Active | Crawler läuft, Content fertig |

### Nächste Tasks (noch zu vergeben)
- [ ] Blog-System mit Content verbinden (wer?)
- [ ] Progress System testen + deployen (Claude Code)
- [ ] Crawler-Ergebnisse parsen (Claw)

### 🎯 Mission Control API (für Task-Tracking)

**URL:** `https://mission-control-etj.pages.dev`  
**Auth:** `Authorization: Bearer a8c0ea72755c4fe081c5156a03060695`

```bash
# Tasks abrufen
curl -H "Authorization: Bearer a8c0ea72755c4fe081c5156a03060695" \
  "https://mission-control-etj.pages.dev/api/tasks?project=meoluna"

# Task erstellen
curl -X POST -H "Authorization: Bearer a8c0ea72755c4fe081c5156a03060695" \
  -H "Content-Type: application/json" \
  -d '{"title": "Neuer Task", "status": "In Progress"}' \
  "https://mission-control-etj.pages.dev/api/tasks?project=meoluna"
```

**Regel:** Vor größerer Arbeit Task erstellen, danach Status updaten!

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

*Letztes Update: 2026-02-01 19:00 UTC*
