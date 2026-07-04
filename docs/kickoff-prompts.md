# Kickoff prompts

Paste one of these into a fresh Fable session started in `C:\Users\karent\Documents\Software\meoluna-main-clean`. All `[Context]` brackets are pre-filled with the actual repo paths.

## Track 1 — Game engines

Goal: Extend Meoluna's existing game engines — bigger scope, more interactivity, higher production value and visual appeal — without breaking the "every generated world is unique" guarantee.

Context:
- Engine implementations (14 deterministic renderers): `convex/pipeline/engines/*Renderer.ts` (buildingConstruct, chart, clock, counting, detectiveEvidence, diagram, map, mixingBalance, money, movementSpace, pattern, sortMatch, timeSequence, wordBuilder)
- Engine routing (topic → engine): `convex/pipeline/engines/engineRegistry.ts` (`pickEngineByKeywords`)
- World-generation pipeline: `convex/pipeline/` and `convex/generate.ts`; fallback for unmatched topics is the LLM-based Focused-Mini-App path (pure JS/JSX, no TypeScript in generated code)
- Sandbox constraints: `src/components/Sandbox.tsx` — Sandpack, world code mounted as `/App.tsx`, `window.Meoluna` API (`reportScore`, `completeModule`, `complete`)
- Test fixtures per engine: `scripts/fixtures/<engine>/`; golden checks: `scripts/*-golden-check.mjs`; playthrough smoke test: `scripts/playthrough-smoke.mjs`; gameplay screenshots: `scripts/spielproben-shots.mjs`
- Cost ceiling: engine worlds are deterministic (no LLM cost per world); only the Focused fallback calls an LLM — keep it that way

Stakes: high — changes affect every world generated from now on, across every school currently using the platform.

You're the lead. First tell me whether this is trivial enough to handle yourself or needs delegation.
If delegating: engine/mechanic design → deep-reasoner. Wiring new engines into the existing generation pipeline and sandbox → fast-worker. Because this is high-stakes, also get Codex's independent take on the engine architecture in parallel with deep-reasoner — no cross-visibility — then synthesize.
Show me your plan first: which engines you'd touch, why, and what "bigger/more interactive" means concretely per engine. Then execute.

## Track 2 — Security audit

Goal: Full security audit of the Meoluna platform. It runs in schools and processes children's data — treat every finding touching PII, auth, session handling, data retention, or third-party data flows as high severity until proven otherwise.

Context:
- Repo structure: see `CLAUDE.md` (Vite + React + TypeScript frontend, Convex backend, Clerk auth, Vercel hosting)
- Backend: `convex/` — `schema.ts` (users, worlds, progress, classrooms, classroomMembers, classroomAssignments + analytics tables sessionClicks, userIdentityGraph, analyticsEvents, conversions)
- Auth flow: Clerk (`users.clerkId`, `VITE_CLERK_PUBLISHABLE_KEY`); permission checks in Convex functions are a known weak spot ("Permissions in Convex Functions — noch offen" in CLAUDE.md)
- Public HTTP endpoints: `convex/http.ts` (`/api/track/pageview`, `/api/track/event`) and Vercel serverless functions in `api/`
- Analytics/tracking: `convex/analytics/` (serverSideCollector.ts, identityResolution.ts, eventTracking.ts) — IP hashing uses djb2 (not cryptographic), stores fbclid/gclid/ttclid/UTM, anonymous→user identity merging
- Data collected from students/teachers: Clerk profile (email, name), XP/progress per world, classroom membership via 6-digit invite codes, uploaded worksheet PDFs (sent to PaddleOCR service on Railway: `paddleocr-service/`)
- Sandbox for generated code: `src/components/Sandbox.tsx` (Sandpack iframe)
- Data-processing agreements: [noch offen — vorhandene AV-Verträge/DPAs dokumentieren]

Stakes: high — the highest-priority track in this repo.

You're the lead. Do not fix anything yet.
Dispatch deep-reasoner and Codex as two fully independent audits of the same scope — no shared context. Each returns: findings by severity, confidence, recommended fix.
Synthesize both: findings confirmed by both first, then single-source findings with your own confidence rating.
Show me the synthesized findings list before any fix is applied. Once I approve: mechanical/low-risk fixes → fast-worker. Anything touching how children's data is stored or transmitted gets reasoned through explicitly, never auto-applied.

## Track 3 — Programmatic SEO pages

Goal: Programmatically generate one SEO landing page per curriculum topic. Each page needs: SEO content, an embedded example game, flashcards, example tasks, and three downloadable PDFs (class test, learning-objective check, homework) — all matched to the stored curriculum for that topic/grade/subject.

Context:
- Curriculum data source: Convex table `topics` (1062 imported topics; schema in `convex/schema.ts`, table `topics` + `curriculumSources`); import scripts in `scripts/` and `kimi/`
- Existing page template (63 topics already live): marketing repo `C:\Users\karent\Documents\Software\meoluna-web` — `src/pages/lernwelten/[fach]/[klasse]/[thema].astro` (Astro 6 static, GEO-optimized, LearningResource/HowTo/FAQPage schema)
- Current SEO content pattern: `meoluna-web/src/lib/content.ts` (engine-parametrized blocks), `src/lib/deep-content.ts` (hand-written examples for top topics), `src/lib/topics.ts`, data in `src/data/topics.json` + `src/data/topic-engines.json`
- Gameplay screenshots per engine: `meoluna-web/public/spielproben/`
- SEO strategy docs: `meoluna-web/docs/seo/gesamtkonzept.md` + `competitor-analysis.md`
- Existing PDF generation approach: none yet — greenfield

Stakes: medium — reversible, but scales to hundreds of pages, so get the template right before batch-generating.

You're the lead. First define with deep-reasoner: the data model — what a page needs, how curriculum fields map to content sections, how the example game and PDFs get selected/generated per topic.
Show me that plan first.
Once approved, hand generation to fast-worker in batches — first batch: 3–5 sample pages across different subjects/grades, for my review, before generating the full set.
