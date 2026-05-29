# Movement Space Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first gameplay-engine vertical slice for Meoluna: stable spatial movement worlds for topics such as negative numbers, temperature changes, account balances, and height/depth.

**Architecture:** Add a new deterministic `movement-space` engine beside the existing world skeleton. The AI produces validated engine data, not free React code. A stable renderer turns that data into a playable world with Meoluna scoring/completion.

**Tech Stack:** Convex actions, TypeScript, Vite React, Framer Motion, existing Sandpack runtime, existing `Meoluna` in-world API, Node/tsx golden-check scripts.

---

## Files Overview

- Create `convex/pipeline/engines/movementSpaceTypes.ts`  
  Owns the `MovementEngineSpec` TypeScript types and helper predicates.

- Create `convex/pipeline/engines/movementSpaceValidator.ts`  
  Validates mathematical consistency, room completeness, coordinate bounds, and non-quiz requirements.

- Create `convex/pipeline/engines/movementSpaceRenderer.ts`  
  Builds stable React code from a valid `MovementEngineSpec`.

- Create `convex/pipeline/prompts/learningDiagnosis.ts`  
  Prompt for extracting `LearningBrief` from material/curriculum input.

- Create `convex/pipeline/prompts/movementSpace.ts`  
  Prompt for generating `MovementEngineSpec` and movement-focused world skin data.

- Create `convex/pipeline/steps/learningDiagnosis.ts`  
  Convex/node step wrapper around the diagnosis prompt.

- Create `convex/pipeline/steps/movementSpaceGenerator.ts`  
  Convex/node step wrapper that calls Anthropic, parses JSON, validates spec, and renders code.

- Modify `convex/pipeline/orchestrator.ts`  
  Add guarded routing for movement-space generation while preserving the existing pipeline fallback.

- Modify `convex/pipeline/types.ts`  
  Add step labels and telemetry names for diagnosis/movement generation if needed.

- Create `scripts/fixtures/movement-space/*.json`  
  Golden input/output fixtures for negative numbers, temperature, account balance, and height/depth.

- Create `scripts/movement-space-golden-check.mjs`  
  Runs deterministic validation and code-structure checks on movement fixtures.

- Modify `package.json`  
  Add `movement-golden-check` script.

---

## Task 1: Add Movement Engine Types

**Files:**
- Create: `convex/pipeline/engines/movementSpaceTypes.ts`

- [ ] **Step 1: Add type definitions**

Create `convex/pipeline/engines/movementSpaceTypes.ts`:

```ts
export type MovementInputMode = "material" | "curriculum" | "teacherStudio";
export type MovementFocus = "understand" | "practice" | "prepare" | "discover";
export type MovementConfidence = "low" | "medium" | "high";

export type MovementDimension = "1d-horizontal" | "1d-vertical" | "2d-grid";
export type MovementInteraction =
  | "choose-direction"
  | "build-route"
  | "drag-marker"
  | "step-sequencer";

export type Position = number | { x: number; y: number };

export type LearningBrief = {
  inputMode: MovementInputMode;
  subject?: string;
  gradeLevel?: string;
  rawTopic: string;
  extractedTasks?: string[];
  learningGoals: string[];
  likelyMisconceptions: string[];
  focus: MovementFocus;
  confidence: MovementConfidence;
};

export type WorldSpec = {
  worldName: string;
  coreMetaphor: string;
  setting: string;
  visualStyle: {
    palette: string[];
    mood: string;
    shapes: string;
    effects: string;
  };
  guide: {
    name: string;
    role: string;
    personality: string;
  };
  rooms: Array<{
    id: string;
    title: string;
    purpose: string;
    scene: string;
    reward: string;
  }>;
};

export type MovementEngineSpec = {
  engine: "movement-space";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  coordinateSystem: {
    dimensions: MovementDimension;
    min: number;
    max: number;
    unitLabel: string;
    negativeDirectionLabel?: string;
    positiveDirectionLabel?: string;
  };
  rooms: Array<{
    roomId: string;
    objective: string;
    startPosition: Position;
    moves: Array<{
      value: Position;
      label: string;
      meaning: string;
    }>;
    targetPosition: Position;
    interaction: MovementInteraction;
    feedback: {
      correct: string;
      wrongDirection: string;
      wrongDistance: string;
      signConfusion: string;
    };
    explanationAfterSuccess: string;
  }>;
};

export function is2DPosition(position: Position): position is { x: number; y: number } {
  return typeof position === "object" && position !== null && "x" in position && "y" in position;
}
```

- [ ] **Step 2: Run TypeScript check**

Run:

```powershell
npm run build
```

Expected: Build passes or fails only on files introduced later. At this task it should pass.

- [ ] **Step 3: Commit**

```powershell
git add convex/pipeline/engines/movementSpaceTypes.ts
git commit -m "feat: add movement space engine types"
```

---

## Task 2: Add Movement Spec Validator

**Files:**
- Create: `convex/pipeline/engines/movementSpaceValidator.ts`
- Test later through: `scripts/movement-space-golden-check.mjs`

- [ ] **Step 1: Add validator implementation**

Create `convex/pipeline/engines/movementSpaceValidator.ts`:

```ts
import type { MovementEngineSpec, Position } from "./movementSpaceTypes";
import { is2DPosition } from "./movementSpaceTypes";

export type MovementValidationResult = {
  passed: boolean;
  violations: string[];
};

function sumPositions(start: Position, moves: Array<{ value: Position }>): Position {
  if (is2DPosition(start)) {
    return moves.reduce(
      (acc, move) => {
        if (!is2DPosition(move.value)) {
          throw new Error("Mixed 1D and 2D movement values are not allowed.");
        }
        return { x: acc.x + move.value.x, y: acc.y + move.value.y };
      },
      { x: start.x, y: start.y },
    );
  }

  return moves.reduce((acc, move) => {
    if (is2DPosition(move.value)) {
      throw new Error("Mixed 1D and 2D movement values are not allowed.");
    }
    return acc + move.value;
  }, start);
}

function samePosition(a: Position, b: Position): boolean {
  if (is2DPosition(a) || is2DPosition(b)) {
    return is2DPosition(a) && is2DPosition(b) && a.x === b.x && a.y === b.y;
  }
  return a === b;
}

function positionInBounds(position: Position, min: number, max: number): boolean {
  if (is2DPosition(position)) {
    return position.x >= min && position.x <= max && position.y >= min && position.y <= max;
  }
  return position >= min && position <= max;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateMovementEngineSpec(spec: MovementEngineSpec): MovementValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "movement-space") violations.push("E_ENGINE: engine must be movement-space");
  if (!hasText(spec.concept.learningProblem)) violations.push("E_CONCEPT: learningProblem is required");
  if (!hasText(spec.concept.embodiedMetaphor)) violations.push("E_CONCEPT: embodiedMetaphor is required");
  if (!hasText(spec.concept.successInsight)) violations.push("E_CONCEPT: successInsight is required");
  if (!spec.rooms.length) violations.push("E_ROOMS: at least one room is required");

  for (const room of spec.rooms) {
    if (!hasText(room.objective)) violations.push(`E_ROOM_${room.roomId}: objective is required`);
    if (room.moves.length === 0) violations.push(`E_ROOM_${room.roomId}: at least one movement is required`);
    if (!positionInBounds(room.startPosition, spec.coordinateSystem.min, spec.coordinateSystem.max)) {
      violations.push(`E_ROOM_${room.roomId}: startPosition outside coordinate bounds`);
    }
    if (!positionInBounds(room.targetPosition, spec.coordinateSystem.min, spec.coordinateSystem.max)) {
      violations.push(`E_ROOM_${room.roomId}: targetPosition outside coordinate bounds`);
    }

    try {
      const calculatedTarget = sumPositions(room.startPosition, room.moves);
      if (!samePosition(calculatedTarget, room.targetPosition)) {
        violations.push(`E_ROOM_${room.roomId}: targetPosition does not match startPosition + moves`);
      }
    } catch (error) {
      violations.push(`E_ROOM_${room.roomId}: ${error instanceof Error ? error.message : "invalid movement values"}`);
    }

    if (!hasText(room.feedback.correct)) violations.push(`E_ROOM_${room.roomId}: correct feedback missing`);
    if (!hasText(room.feedback.wrongDirection)) violations.push(`E_ROOM_${room.roomId}: wrongDirection feedback missing`);
    if (!hasText(room.feedback.wrongDistance)) violations.push(`E_ROOM_${room.roomId}: wrongDistance feedback missing`);
    if (!hasText(room.feedback.signConfusion)) violations.push(`E_ROOM_${room.roomId}: signConfusion feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${room.roomId}: explanationAfterSuccess missing`);
  }

  return { passed: violations.length === 0, violations };
}
```

- [ ] **Step 2: Run build**

```powershell
npm run build
```

Expected: TypeScript passes.

- [ ] **Step 3: Commit**

```powershell
git add convex/pipeline/engines/movementSpaceValidator.ts
git commit -m "feat: validate movement space specs"
```

---

## Task 3: Add Golden Movement Fixtures And Check Script

**Files:**
- Create: `scripts/fixtures/movement-space/negative-numbers.json`
- Create: `scripts/fixtures/movement-space/temperature-change.json`
- Create: `scripts/fixtures/movement-space/account-balance.json`
- Create: `scripts/fixtures/movement-space/height-depth.json`
- Create: `scripts/movement-space-golden-check.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add one fixture shape**

Create `scripts/fixtures/movement-space/negative-numbers.json`:

```json
{
  "engine": "movement-space",
  "learningBrief": {
    "inputMode": "material",
    "subject": "Mathematik",
    "gradeLevel": "6",
    "rawTopic": "-66 + -33",
    "extractedTasks": ["-66 + -33"],
    "learningGoals": ["Negative Summanden als Bewegung in negativer Richtung verstehen"],
    "likelyMisconceptions": ["Plus vor einer negativen Zahl als Richtungswechsel lesen"],
    "focus": "understand",
    "confidence": "low"
  },
  "world": {
    "worldName": "Westmine der Minus-Kristalle",
    "coreMetaphor": "Negative Zahlen sind Schritte nach Westen.",
    "setting": "Eine Blockmine mit einem Eingang bei 0 und Kristallen tief im Westen.",
    "visualStyle": {
      "palette": ["#0f172a", "#334155", "#f59e0b", "#38bdf8", "#f8fafc"],
      "mood": "abenteuerlich",
      "shapes": "blockige Höhlenformen und klare Achsen",
      "effects": "Kristallglühen und Staubpartikel"
    },
    "guide": {
      "name": "Nera",
      "role": "Minen-Scout",
      "personality": "Präzise, ruhig und direkt. Sie erklärt erst nach der Bewegung."
    },
    "rooms": [
      {
        "id": "west-tunnel",
        "title": "Der Westtunnel",
        "purpose": "Verstehen, dass + -33 weiter nach Westen führt.",
        "scene": "Ein Tunnel von 0 bis -100 mit Markierungen.",
        "reward": "Ein Minus-Kristall leuchtet auf."
      }
    ]
  },
  "concept": {
    "learningProblem": "Der Ausdruck -66 + -33 wird als Richtungswechsel missverstanden.",
    "embodiedMetaphor": "Jede negative Zahl ist eine Bewegung nach Westen.",
    "successInsight": "+ -33 bedeutet, noch 33 Schritte in negativer Richtung hinzuzufügen."
  },
  "coordinateSystem": {
    "dimensions": "1d-horizontal",
    "min": -120,
    "max": 20,
    "unitLabel": "Schritte",
    "negativeDirectionLabel": "Westen",
    "positiveDirectionLabel": "Osten"
  },
  "rooms": [
    {
      "roomId": "west-tunnel",
      "objective": "Erreiche den Kristall bei -99.",
      "startPosition": 0,
      "moves": [
        { "value": -66, "label": "66 Schritte nach Westen", "meaning": "-66" },
        { "value": -33, "label": "33 weitere Schritte nach Westen", "meaning": "+ -33" }
      ],
      "targetPosition": -99,
      "interaction": "step-sequencer",
      "feedback": {
        "correct": "Genau. Du bist weiter nach Westen gegangen und landest bei -99.",
        "wrongDirection": "Du hast die zweite Bewegung in die falsche Richtung gesetzt.",
        "wrongDistance": "Die Richtung stimmt, aber die Anzahl der Schritte passt noch nicht.",
        "signConfusion": "Plus minus 33 bedeutet nicht zurück nach Osten, sondern noch eine negative Bewegung dazu."
      },
      "explanationAfterSuccess": "-66 + -33 heißt: Du startest bei 0, gehst 66 nach Westen und dann noch 33 nach Westen. Deshalb bist du bei -99."
    }
  ]
}
```

Add similar fixtures for temperature, account balance, and height/depth using the same schema with mathematically consistent movement values.

- [ ] **Step 2: Add check script**

Create `scripts/movement-space-golden-check.mjs`:

```js
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMovementEngineSpec } from "../convex/pipeline/engines/movementSpaceValidator.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = join(ROOT, "scripts/fixtures/movement-space");

let failures = 0;

for (const file of readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".json"))) {
  const fixturePath = join(FIXTURE_DIR, file);
  const spec = JSON.parse(readFileSync(fixturePath, "utf8"));
  const result = validateMovementEngineSpec(spec);

  if (!result.passed) {
    failures += 1;
    console.error(`FAIL ${file}`);
    for (const violation of result.violations) console.error(`  - ${violation}`);
  } else {
    console.log(`PASS ${file}`);
  }
}

if (failures > 0) {
  process.exit(1);
}
```

- [ ] **Step 3: Add npm script**

Modify `package.json`:

```json
"movement-golden-check": "node --import tsx/esm scripts/movement-space-golden-check.mjs"
```

- [ ] **Step 4: Run golden check**

```powershell
npm run movement-golden-check
```

Expected: all movement fixtures pass.

- [ ] **Step 5: Commit**

```powershell
git add scripts/fixtures/movement-space scripts/movement-space-golden-check.mjs package.json
git commit -m "test: add movement space golden checks"
```

---

## Task 4: Add Movement Renderer

**Files:**
- Create: `convex/pipeline/engines/movementSpaceRenderer.ts`

- [ ] **Step 1: Add deterministic code builder**

Create `convex/pipeline/engines/movementSpaceRenderer.ts`.

The exported API must be:

```ts
import type { MovementEngineSpec } from "./movementSpaceTypes";
import { validateMovementEngineSpec } from "./movementSpaceValidator";

export function buildMovementSpaceWorldCode(spec: MovementEngineSpec): string {
  const validation = validateMovementEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid movement-space spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return [
    `import { useMemo, useState } from 'react';`,
    `import { motion, AnimatePresence } from 'framer-motion';`,
    `import confetti from 'canvas-confetti';`,
    ``,
    `const SPEC = ${dataJson};`,
    ``,
    `function addPositions(start, moves) {`,
    `  if (typeof start === 'number') return moves.reduce((sum, move) => sum + move.value, start);`,
    `  return moves.reduce((sum, move) => ({ x: sum.x + move.value.x, y: sum.y + move.value.y }), start);`,
    `}`,
    ``,
    `function positionLabel(position) {`,
    `  if (typeof position === 'number') return String(position);`,
    `  return '(' + position.x + ', ' + position.y + ')';`,
    `}`,
    ``,
    `function RoomScene({ room, spec, onComplete }) {`,
    `  const [stepIndex, setStepIndex] = useState(0);`,
    `  const [position, setPosition] = useState(room.startPosition);`,
    `  const [message, setMessage] = useState('');`,
    `  const currentMove = room.moves[stepIndex];`,
    `  function applyMove() {`,
    `    if (!currentMove) return;`,
    `    const next = typeof position === 'number' ? position + currentMove.value : { x: position.x + currentMove.value.x, y: position.y + currentMove.value.y };`,
    `    setPosition(next);`,
    `    setMessage(currentMove.meaning + ': ' + currentMove.label);`,
    `    if (stepIndex + 1 >= room.moves.length) {`,
    `      const target = addPositions(room.startPosition, room.moves);`,
    `      const ok = JSON.stringify(target) === JSON.stringify(room.targetPosition);`,
    `      if (ok) {`,
    `        window.Meoluna?.reportScore?.(25, { action: 'movement-room-complete', roomId: room.roomId });`,
    `        window.Meoluna?.completeModule?.(room.roomId, 25);`,
    `        confetti({ particleCount: 80, spread: 70 });`,
    `        setTimeout(onComplete, 900);`,
    `      }`,
    `    }`,
    `    setStepIndex((value) => value + 1);`,
    `  }`,
    `  return (`,
    `    <div className="min-h-screen text-white p-4 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">`,
    `      <div className="max-w-5xl mx-auto space-y-6">`,
    `        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl">`,
    `          <p className="text-sm uppercase tracking-wide text-white/60">{spec.world.guide.name}</p>`,
    `          <h1 className="text-2xl sm:text-4xl font-black">{room.objective}</h1>`,
    `          <p className="mt-2 text-white/75">{spec.concept.embodiedMetaphor}</p>`,
    `        </div>`,
    `        <div className="rounded-3xl bg-black/30 border border-white/10 p-6 overflow-hidden">`,
    `          <div className="relative h-56 sm:h-72">`,
    `            <div className="absolute left-4 right-4 top-1/2 h-1 bg-white/30" />`,
    `            <motion.div animate={{ left: typeof position === 'number' ? Math.max(4, Math.min(92, ((position - spec.coordinateSystem.min) / (spec.coordinateSystem.max - spec.coordinateSystem.min)) * 88 + 4)) + '%' : '50%' }} className="absolute top-[calc(50%-22px)] w-11 h-11 rounded-xl bg-amber-400 shadow-lg shadow-amber-400/40 flex items-center justify-center text-slate-950 font-black">`,
    `              {positionLabel(position)}`,
    `            </motion.div>`,
    `            <div className="absolute left-4 top-[calc(50%+18px)] text-xs text-white/60">{spec.coordinateSystem.negativeDirectionLabel}</div>`,
    `            <div className="absolute right-4 top-[calc(50%+18px)] text-xs text-white/60">{spec.coordinateSystem.positiveDirectionLabel}</div>`,
    `          </div>`,
    `        </div>`,
    `        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-stretch">`,
    `          <div className="rounded-2xl bg-white/10 border border-white/10 p-4">`,
    `            <p className="text-white/60 text-sm">Aktuelle Bewegung</p>`,
    `            <p className="text-xl font-bold">{currentMove ? currentMove.label : room.explanationAfterSuccess}</p>`,
    `            {message && <p className="mt-2 text-amber-200">{message}</p>}`,
    `          </div>`,
    `          <button onClick={applyMove} disabled={!currentMove} className="rounded-2xl bg-amber-400 px-6 py-4 text-slate-950 font-black disabled:opacity-50">`,
    `            Schritt ausführen`,
    `          </button>`,
    `        </div>`,
    `      </div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `export default function App() {`,
    `  const [roomIndex, setRoomIndex] = useState(0);`,
    `  const room = SPEC.rooms[roomIndex];`,
    `  function nextRoom() {`,
    `    if (roomIndex + 1 >= SPEC.rooms.length) {`,
    `      window.Meoluna?.complete?.({ engine: 'movement-space' });`,
    `    } else {`,
    `      setRoomIndex((value) => value + 1);`,
    `    }`,
    `  }`,
    `  return <RoomScene room={room} spec={SPEC} onComplete={nextRoom} />;`,
    `}`,
  ].join("\\n");
}
```

This is intentionally minimal for the first pass. Later tasks can improve presentation and add true drag behavior.

- [ ] **Step 2: Add code generation to golden check**

Update `scripts/movement-space-golden-check.mjs` to import `buildMovementSpaceWorldCode`, build code for every fixture, and check:

```js
if (!code.includes("export default function App")) throw new Error(`${file}: missing App export`);
if (!code.includes("completeModule")) throw new Error(`${file}: missing completeModule`);
if (!code.includes("complete?.")) throw new Error(`${file}: missing complete call`);
```

- [ ] **Step 3: Run checks**

```powershell
npm run movement-golden-check
npm run build
```

Expected: both pass.

- [ ] **Step 4: Commit**

```powershell
git add convex/pipeline/engines/movementSpaceRenderer.ts scripts/movement-space-golden-check.mjs
git commit -m "feat: render movement space worlds"
```

---

## Task 5: Add Diagnosis And Movement Prompts

**Files:**
- Create: `convex/pipeline/prompts/learningDiagnosis.ts`
- Create: `convex/pipeline/prompts/movementSpace.ts`

- [ ] **Step 1: Add diagnosis prompt**

Create `convex/pipeline/prompts/learningDiagnosis.ts`:

```ts
export const LEARNING_DIAGNOSIS_SYSTEM_PROMPT = `Du bist ein didaktischer Game-Design-Diagnostiker für Meoluna.

Analysiere Material, Thema oder Curriculum-Auswahl. Extrahiere kein Quiz, sondern das zentrale Lernproblem.

Antworte ausschließlich als JSON:
{
  "inputMode": "material" | "curriculum" | "teacherStudio",
  "subject": "string optional",
  "gradeLevel": "string optional",
  "rawTopic": "string",
  "extractedTasks": ["string"],
  "learningGoals": ["string"],
  "likelyMisconceptions": ["string"],
  "focus": "understand" | "practice" | "prepare" | "discover",
  "confidence": "low" | "medium" | "high"
}

Regeln:
- Formuliere konkrete Denkfehler, nicht nur Themen.
- Bei Rechenaufgaben identifiziere die mentale Operation.
- Bei Material-Input priorisiere Verständnisblockaden.
- Bei Curriculum-Input decke das Thema breiter ab, aber benenne ein Kernproblem.
- Keine Rollenannahmen über Eltern, Lehrer oder Schüler.
`;
```

- [ ] **Step 2: Add movement prompt**

Create `convex/pipeline/prompts/movementSpace.ts` with a prompt that requires `MovementEngineSpec` JSON and explicitly forbids quiz structures:

```ts
export const MOVEMENT_SPACE_SYSTEM_PROMPT = `Du bist ein Learning Game Designer für Meoluna.

Du erzeugst eine movement-space Lernwelt. Der Spieler soll das Lernkonzept durch Bewegung im Raum erleben.

Verboten:
- Multiple Choice
- Richtig/Falsch
- klassische Rechenfrage mit Eingabefeld
- reine Textkarte mit Antwortbutton

Erlaubt:
- Richtung wählen
- Bewegungsfolge ausführen
- Marker auf Zielpunkt ziehen
- Route bauen

Antworte ausschließlich als MovementEngineSpec JSON:
{
  "engine": "movement-space",
  "learningBrief": { ... },
  "world": { ... },
  "concept": { ... },
  "coordinateSystem": { ... },
  "rooms": [ ... ]
}

Mathematikregel:
Für 1D gilt targetPosition = startPosition + Summe aller moves.value.
Alle Positionen müssen innerhalb min/max liegen.

Qualitätsregel:
Jeder Raum muss diesen Satz erfüllen:
"Der Spieler erlebt das Konzept durch eine Handlung, bevor es erklärt wird."
`;
```

- [ ] **Step 3: Commit**

```powershell
git add convex/pipeline/prompts/learningDiagnosis.ts convex/pipeline/prompts/movementSpace.ts
git commit -m "feat: add movement diagnosis prompts"
```

---

## Task 6: Add Convex Steps For Diagnosis And Movement Generation

**Files:**
- Create: `convex/pipeline/steps/learningDiagnosis.ts`
- Create: `convex/pipeline/steps/movementSpaceGenerator.ts`

- [ ] **Step 1: Implement learning diagnosis step**

Create `convex/pipeline/steps/learningDiagnosis.ts`:

```ts
import { callAnthropicJson } from "../utils/anthropicClient";
import { LEARNING_DIAGNOSIS_SYSTEM_PROMPT } from "../prompts/learningDiagnosis";
import type { LearningBrief } from "../engines/movementSpaceTypes";

export async function runLearningDiagnosis(input: {
  prompt: string;
  pdfText?: string;
  gradeLevel?: string;
  subject?: string;
}): Promise<{ result: LearningBrief; inputTokens?: number; outputTokens?: number }> {
  const userMessage = JSON.stringify({
    inputMode: input.pdfText ? "material" : "curriculum",
    prompt: input.prompt,
    pdfText: input.pdfText,
    gradeLevel: input.gradeLevel,
    subject: input.subject,
  });

  return await callAnthropicJson<LearningBrief>({
    model: "claude-sonnet-4-20250514",
    systemPrompt: LEARNING_DIAGNOSIS_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 3000,
    temperature: 0,
  });
}
```

- [ ] **Step 2: Implement movement generator step**

Create `convex/pipeline/steps/movementSpaceGenerator.ts`:

```ts
import { callAnthropicJson } from "../utils/anthropicClient";
import { MOVEMENT_SPACE_SYSTEM_PROMPT } from "../prompts/movementSpace";
import type { LearningBrief, MovementEngineSpec } from "../engines/movementSpaceTypes";
import { validateMovementEngineSpec } from "../engines/movementSpaceValidator";
import { buildMovementSpaceWorldCode } from "../engines/movementSpaceRenderer";

export async function runMovementSpaceGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: MovementEngineSpec;
  code: string;
  inputTokens?: number;
  outputTokens?: number;
}> {
  const response = await callAnthropicJson<MovementEngineSpec>({
    model: "claude-opus-4-20250514",
    systemPrompt: MOVEMENT_SPACE_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 10000,
    temperature: 0.4,
  });

  const validation = validateMovementEngineSpec(response.result);
  if (!validation.passed) {
    throw new Error(`Movement spec failed validation: ${validation.violations.join(" | ")}`);
  }

  return {
    spec: response.result,
    code: buildMovementSpaceWorldCode(response.result),
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
```

- [ ] **Step 3: Build**

```powershell
npm run build
```

Expected: TypeScript passes after adjusting to the real Anthropic utility signature.

- [ ] **Step 4: Commit**

```powershell
git add convex/pipeline/steps/learningDiagnosis.ts convex/pipeline/steps/movementSpaceGenerator.ts
git commit -m "feat: add movement space generation steps"
```

---

## Task 7: Route Suitable Inputs Through Movement Space

**Files:**
- Modify: `convex/pipeline/orchestrator.ts`
- Possibly modify: `convex/pipeline/types.ts`

- [ ] **Step 1: Add conservative movement suitability helper**

In `convex/pipeline/orchestrator.ts`, add a local helper:

```ts
function isLikelyMovementTopic(input: {
  prompt: string;
  pdfText?: string;
  subject?: string;
}): boolean {
  const text = `${input.prompt}\n${input.pdfText ?? ""}\n${input.subject ?? ""}`.toLowerCase();
  return [
    "negative zahl",
    "negative zahlen",
    "zahlenstrahl",
    "koordinaten",
    "temperatur",
    "höhe",
    "tiefe",
    "kontostand",
    "schulden",
    "guthaben",
    "richtung",
    "distanz",
    "meter",
    "schritte",
  ].some((needle) => text.includes(needle));
}
```

This is intentionally conservative. Avoid routing unrelated topics into the new engine.

- [ ] **Step 2: Add guarded movement branch**

Near the start of `generateWorldV2`, after session creation and before the existing 10-step pipeline, add:

```ts
if (isLikelyMovementTopic(args)) {
  try {
    await setStatus(0);
    const diagnosis = await runLearningDiagnosis({
      prompt: args.prompt,
      pdfText: args.pdfText,
      gradeLevel: args.gradeLevel,
      subject: args.subject,
    });

    await setStatus(1);
    const movement = await runMovementSpaceGenerator({ brief: diagnosis.result });

    const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
      title: movement.spec.world.worldName,
      code: movement.code,
      userId: args.userId,
      isPublic: false,
      prompt: args.prompt,
      gradeLevel: args.gradeLevel,
      subject: args.subject,
      status: "published",
      qualityScore: 8,
      validationMetadata: {
        validatorSuccess: true,
        validatorIterations: 0,
        gateScore: 100,
        gatePassed: true,
        gateViolations: [],
      },
    });

    await ctx.runMutation(internal.pipeline.status.completeSession, {
      sessionId: args.sessionId,
      worldId,
    });

    return {
      worldId,
      code: movement.code,
      worldName: movement.spec.world.worldName,
      duration: Date.now() - startTime,
      qualityScore: 8,
    };
  } catch (error) {
    console.warn("movement-space generation failed, falling back to existing pipeline:", error);
  }
}
```

Import `runLearningDiagnosis` and `runMovementSpaceGenerator`.

- [ ] **Step 3: Preserve fallback**

Do not remove the existing pipeline. If movement generation fails, existing generation continues.

- [ ] **Step 4: Run checks**

```powershell
npm run movement-golden-check
npm run build
```

Expected: both pass.

- [ ] **Step 5: Commit**

```powershell
git add convex/pipeline/orchestrator.ts convex/pipeline/types.ts
git commit -m "feat: route movement topics to movement space engine"
```

---

## Task 8: Deploy And Verify

**Files:**
- No code changes expected unless fixes are needed.

- [ ] **Step 1: Run full local verification**

```powershell
npm run movement-golden-check
npm run build
```

Expected:

- all movement fixtures pass
- Vite/TypeScript build exits 0

- [ ] **Step 2: Commit any verification fixes**

If fixes are needed:

```powershell
git add <changed-files>
git commit -m "fix: stabilize movement space vertical slice"
```

- [ ] **Step 3: Push**

```powershell
git push origin main
```

- [ ] **Step 4: Deploy Convex prod**

```powershell
npm run deploy:convex:prod
```

Expected: deploys to `https://helpful-blackbird-68.convex.cloud`.

- [ ] **Step 5: Check Vercel production**

```powershell
npx vercel ls meoluna --scope strategiert
```

Expected: latest production deployment reaches `Ready`.

- [ ] **Step 6: HTTP smoke checks**

```powershell
Invoke-WebRequest -Uri "https://meoluna.com" -UseBasicParsing
Invoke-WebRequest -Uri "https://meoluna.com/dashboard" -UseBasicParsing
Invoke-WebRequest -Uri "https://meoluna-production.up.railway.app/health" -UseBasicParsing
```

Expected: all return 200; Railway health returns JSON with `"status":"ok"`.

---

## Task 9: Product Review Fixture

**Files:**
- Optional create: `docs/superpowers/reviews/movement-space-negative-numbers-review.md`

- [ ] **Step 1: Generate a negative-number test world**

Use the live UI or local dev UI with prompt:

```text
Mein Kind versteht -66 + -33 nicht. Baue eine Welt, die negative Zahlen als Bewegung verständlich macht.
```

- [ ] **Step 2: Review against success criteria**

Create a short review note:

```md
# Movement Space Negative Numbers Review

- No quiz feeling: yes/no
- Concept experienced through action: yes/no
- Visual skin fits topic: yes/no
- Mobile usable: yes/no
- Completion works: yes/no
- Aha moment is clear: yes/no

Decision:
- ship
- improve movement engine first
- disable movement routing
```

- [ ] **Step 3: Commit review note if useful**

```powershell
git add docs/superpowers/reviews/movement-space-negative-numbers-review.md
git commit -m "docs: review movement space negative numbers slice"
```

---

## Rollback

The pre-implementation backup is:

- Branch: `backup/pre-gameplay-engine`
- Tag: `backup/pre-gameplay-engine-2026-05-29`
- Commit: `459e4f7f13b2cad0812d97d3d0e638253e08e96f`

If the movement engine causes production problems:

1. Revert the movement commits, or
2. Disable `isLikelyMovementTopic` routing by returning `false`, then deploy Convex prod, or
3. Reset to the backup branch only after explicit owner approval.

Do not delete the existing skeleton pipeline during this slice.
