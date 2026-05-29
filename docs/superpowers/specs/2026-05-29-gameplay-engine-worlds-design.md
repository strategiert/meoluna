# Gameplay Engine Worlds Design

**Goal:** Improve Meoluna world quality by replacing the current single quiz-like skeleton output with stable, high-quality gameplay engines, starting with a vertical slice for spatial movement learning.

**Status:** Approved for implementation planning.

**Date:** 2026-05-29

---

## Problem

Meoluna currently has a creative multi-step generation pipeline, but the final output is too uniform. The code generator fills a JSON structure, and `convex/pipeline/skeleton/worldSkeleton.ts` renders that data through one deterministic app skeleton.

That architecture makes worlds more stable, but it flattens creative ideas into repeated challenge patterns:

- multiple choice
- true/false
- fill blank
- number input
- sorting
- matching
- simple simulation

The result is often a styled quiz rather than a true learning game. The target experience is different: the world should translate a learning problem into a playable metaphor. A child should understand by acting inside the world before reading an explanation.

Example: `-66 + -33` should not become a quiz question. It should become a spatial movement game where the player moves 66 steps in the negative direction, then 33 more in the same negative direction, and sees why the result is `-99`.

---

## Guiding Decision

Use a stable gameplay-engine architecture.

Do not rely on prompt tuning alone. The current skeleton would still pull outputs back toward the same structure.

Do not return to fully free React app generation as the default. It may produce more creative worlds, but first-run reliability is mandatory for Meoluna users.

Instead, build a small library of stable, tested gameplay engines. The AI remains responsible for diagnosis, metaphor, world composition, room design, content, and feedback. The renderer remains controlled and testable.

The first engine is a vertical slice: `movement-space`.

---

## Target Architecture

Generation should flow through these stages:

1. **Input Normalizer**
   Converts PDF, image OCR text, copy/paste text, curriculum topic selection, or later Teacher Studio chat into a neutral learning input.

2. **Learning Diagnosis**
   Extracts learning goals, likely misconceptions, focus, confidence, and the central learning problem. If needed, Meoluna asks one to three generic clarification questions.

3. **Gameplay Router**
   Selects a suitable gameplay engine. For the first slice, the supported engine is `movement-space`.

4. **World Composer**
   Designs the overall world: setting, rooms, guide, visual language, story, rewards, and progression.

5. **Engine Spec Generator**
   Produces strict, validated data for the selected engine. It does not generate React code.

6. **Validation Gate**
   Checks whether the engine spec is mathematically consistent, playable, non-quiz-like, and complete enough to render.

7. **Stable Renderer**
   Builds React code from tested components and the validated engine spec. The renderer owns scoring, completion, mobile layout, navigation, and sandbox compatibility.

---

## Input Modes

The quality pipeline should support all user-facing entry points as different sources for the same core process.

### Material Input

Inputs:

- PDF
- image
- copy/paste text
- text from school apps

Goal:

Help with the exact material in front of the learner.

Default behavior:

Detect the most important learning problem and likely misconceptions. Ask clarification questions only if focus is unclear.

### Curriculum Input

Inputs:

- class
- subject
- topic from the structured German curriculum database

Goal:

Build a broader learning world for the selected topic.

Default behavior:

Cover the topic more broadly, but start with one strong understanding-focused core game.

### Teacher Studio

Inputs:

- chat
- preview
- iterative refinement

Goal:

Let teachers shape and refine a world.

Status:

Out of scope for the first gameplay-engine slice. The architecture should not block this later mode.

---

## Clarification Questions

Questions must be generic. The product should not assume whether the user is a parent, teacher, or student.

Good question types:

- What is most important right now?
  - understand
  - practice
  - prepare
  - discover

- How secure does the topic feel?
  - not at all
  - a little
  - mostly okay, but mistakes happen
  - I want to strengthen it

- How should the world feel?
  - adventure
  - calm and explanatory
  - challenge/training
  - surprise me

Default behavior:

Ask no more than three short questions. If the input already gives enough signal, proceed automatically.

---

## Engine Roadmap

Define five target gameplay engines, but implement only one first.

### 1. Movement In Space

Use for:

- negative numbers
- addition/subtraction on number lines
- coordinates
- direction and distance
- temperature changes
- account balance
- height/depth
- simple vectors
- simple unit/distance problems

Core action:

The player moves an object, character, marker, vehicle, or route through space. The concept is experienced as direction, position, distance, and correction.

### 2. Mixing And Balancing

Use for:

- fractions
- ratios
- proportions
- equations
- chemical mixtures
- balancing quantities

### 3. Building And Constructing

Use for:

- geometry
- shapes
- area
- volume
- terms
- composition/decomposition

### 4. Detective And Evidence

Use for:

- text comprehension
- argumentation
- grammar
- source work
- word problems
- evidence-based reasoning

### 5. Time And Cause/Effect

Use for:

- history
- biology processes
- geography processes
- sequences
- cause/effect chains
- timelines

---

## Vertical Slice: Movement In Space

The first implementation should prove the new architecture with one excellent engine rather than many shallow engines.

### Suitable Topics

- negative numbers
- addition/subtraction on a number line
- coordinates
- height/depth
- temperature changes
- account balance
- vectors and directions in simple form
- distances and scale
- simple functions as movement/transformation

### Core Experience

Each room is a spatial task, not a quiz.

The player:

- chooses a direction
- builds a movement sequence
- drags a marker
- plans a route
- reaches a target
- receives immediate visual feedback
- gets a short explanation only after acting

The rule is:

The player must experience the core learning concept through an action before it is explained.

### Skins

The engine and skin are separate.

The same movement math can become:

- a block mine with east/west movement
- a desert expedition between oases
- a submarine descending and ascending
- an elevator in a tower
- a vault showing debt and credit
- a climate journey through temperature zones
- a star map with coordinates

This provides visual uniqueness without making the engine unstable.

---

## Data Models

### LearningBrief

```ts
type LearningBrief = {
  inputMode: "material" | "curriculum" | "teacherStudio";
  subject?: string;
  gradeLevel?: string;
  rawTopic: string;
  extractedTasks?: string[];
  learningGoals: string[];
  likelyMisconceptions: string[];
  focus: "understand" | "practice" | "prepare" | "discover";
  confidence: "low" | "medium" | "high";
};
```

### WorldSpec

```ts
type WorldSpec = {
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
```

### MovementEngineSpec

```ts
type MovementEngineSpec = {
  engine: "movement-space";
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  coordinateSystem: {
    dimensions: "1d-horizontal" | "1d-vertical" | "2d-grid";
    min: number;
    max: number;
    unitLabel: string;
    negativeDirectionLabel?: string;
    positiveDirectionLabel?: string;
  };
  rooms: Array<{
    roomId: string;
    objective: string;
    startPosition: number | { x: number; y: number };
    moves: Array<{
      value: number | { x: number; y: number };
      label: string;
      meaning: string;
    }>;
    targetPosition: number | { x: number; y: number };
    interaction: "choose-direction" | "build-route" | "drag-marker" | "step-sequencer";
    feedback: {
      correct: string;
      wrongDirection: string;
      wrongDistance: string;
      signConfusion: string;
    };
    explanationAfterSuccess: string;
  }>;
};
```

### Example

For `-66 + -33`:

```ts
const example = {
  startPosition: 0,
  moves: [
    { value: -66, label: "66 Schritte nach Westen", meaning: "-66" },
    { value: -33, label: "33 weitere Schritte nach Westen", meaning: "+ -33" }
  ],
  targetPosition: -99
};
```

---

## Movement Renderer Behavior

The first renderer should support:

- world hub
- room selection
- active play scene
- guide feedback
- progress/reward display
- completion via existing `Meoluna` API
- mobile-friendly layout

### Interaction Modes

#### choose-direction

The player chooses a direction and distance.

Best for first contact with negative numbers and directional quantities.

#### step-sequencer

The player builds a movement sequence from chips or arrows.

Best for expressions such as `-66 + -33`, temperature changes, and height/depth changes.

#### drag-marker

The player drags a marker to a target point.

Best for number lines, coordinates, balances, and target-state problems.

#### build-route

The player plans a route over multiple stations.

Best for simple 2D coordinates, maps, scale, and multi-step direction tasks.

---

## Validation Gate

A Movement Engine spec may render only if these checks pass:

- learning problem is concrete
- embodied metaphor is explicit
- every room is playable as movement
- every room has a mathematically consistent target
- all target positions are inside the coordinate system
- feedback includes correct, wrong direction, wrong distance, and sign confusion cases
- no room is a disguised multiple-choice question
- no room depends on free-form generated code
- the spec contains enough visual skin data to avoid a generic look

For one-dimensional rooms:

```ts
targetPosition === startPosition + sum(moves)
```

For two-dimensional rooms:

```ts
targetPosition.x === startPosition.x + sum(moves.x)
targetPosition.y === startPosition.y + sum(moves.y)
```

If validation fails, the pipeline must retry the engine spec or fall back to the existing generation path. It must not render a broken movement world.

---

## First Implementation Scope

### In Scope

- new pipeline types for `LearningBrief`, `WorldSpec`, and `MovementEngineSpec`
- new prompts for diagnosis and movement spec generation
- movement spec validator
- stable movement renderer
- 1D horizontal movement
- `step-sequencer`
- `drag-marker`
- theming/skinning through data
- Meoluna scoring and completion integration
- fallback to existing pipeline if movement generation fails
- golden checks for:
  - `-66 + -33`
  - temperature change
  - account balance/debt
  - height/depth

### Out Of Scope

- implementing all five engines
- free React app generation
- Teacher Studio rebuild
- complex 2D map tooling
- multiplayer
- audio as a core dependency
- perfect external image generation
- adaptive AI during play

---

## Success Criteria

The vertical slice succeeds only if a generated movement world is clearly better than the current skeleton for a suitable topic.

Required outcomes:

- no quiz feeling
- the main concept is experienced through action
- the visual skin fits the topic
- the room interactions are stable
- the world works on mobile
- completion and scoring work
- a negative-number test world produces a clear aha moment

If the first movement world does not meet these criteria, improve the slice before building additional engines.

---

## Implementation Principle

Build one excellent engine before adding breadth.

The first engine should prove the pipeline:

```text
input -> diagnosis -> gameplay intent -> movement engine spec -> validation -> stable renderer -> playable world
```

Only after this loop produces a noticeably better learning world should the next engines be added.
