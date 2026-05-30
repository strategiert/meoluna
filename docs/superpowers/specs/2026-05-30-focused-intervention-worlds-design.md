# Focused Intervention Worlds Design

Date: 2026-05-30

## Problem

Meoluna currently treats many free-text inputs as broad world-generation requests. That is wrong for prompts like "Mein Kind versteht -66 + -33 nicht" or "Erkläre meinem Kind den Unterschied zwischen Dativ und Akkusativ". These are acute understanding problems. The user usually will not provide a metaphor, game mechanic, or learning diagnosis. The system must infer those.

The current movement-space path improved routing, but it is still too rigid: it can turn an arithmetic problem into a themed movement room, yet it does not guarantee the complete mini-app shape that made the ChatGPT comparison effective.

## Product Decision

Add a separate `focused-intervention` generation mode for free-text or document-based requests where the user needs immediate understanding, not a full curriculum world.

This mode optimizes for:

- one concrete misconception or stuck point
- one strong metaphor chosen by the AI
- a visible interactive model
- a short demonstration
- a practice loop
- immediate feedback on mistakes
- light gamification in the same screen

It must not require the user to invent the metaphor. User-provided metaphors are accepted as hints, but not required.

## Routing

Use `focused-intervention` when the input has signals such as:

- "mein Kind versteht ..."
- "ich verstehe ..."
- "erkläre ..."
- "Mini-App"
- "sofort verständlich"
- a concrete task from a worksheet or chat
- one or a few exercises rather than a curriculum topic
- a PDF/image plus a short "das soll erklärt werden" prompt

Curriculum topic selection remains broader and can use the existing world/pipeline path. Teacher Studio remains separate.

## Generic Questions

The UI should ask at most three generic questions after a free-text/file input, before generation. The questions are not subject-specific and should never ask the user to invent the design.

Default questions:

1. What should happen first?
   - "Sofort verstehen"
   - "Üben"
   - "Klassenarbeit vorbereiten"

2. Who is this for?
   - "Kind / Schüler"
   - "Elternteil hilft"
   - "Lehrkraft"

3. How much guidance?
   - "Sehr geführt"
   - "Normal"
   - "Mehr Herausforderung"

These answers are optional and encoded into the generation prompt as user context. If the user skips them, the defaults apply.

## Backend Architecture

Add a focused-intervention path near the start of `generateWorldV2`, after session creation and before movement-space and the broad 10-step pipeline.

The path:

1. Diagnose the user input into a compact `FocusedInterventionBrief`.
2. Generate a full React mini-app directly from that brief.
3. Run existing validator and structural gate.
4. Save the world with `status: "published"` and metadata.

Movement-space can still serve as a deterministic fallback/playbook for arithmetic movement concepts, but `focused-intervention` is the default for acute help prompts.

## Mini-App Requirements

Generated focused interventions must include:

- `export default function App`
- one visible interaction zone that teaches the concept
- a current state shown visually, not only text
- a practice loop with at least three attempts possible
- immediate wrong-answer feedback explaining the misconception
- `Meoluna.reportScore`
- `Meoluna.completeModule`
- `Meoluna.complete`
- no external image URLs
- no full HTML document wrapper

The code may use React, framer-motion, lucide icons, canvas-confetti, SVG, CSS shapes, and Tailwind.

## Quality Gate

Add a focused-intervention static check that rejects generated code missing the core experience:

- no XP/reporting
- no practice loop
- no visible interaction terms
- no feedback state
- no completion calls
- HTML document output

This is not a perfect semantic evaluator, but it prevents the most common failures: passive explanation cards, one-button animations, and worksheet-only outputs.

## Scope

This first implementation does not replace the entire world pipeline. It adds a new route and UI questions. Later work should add more deterministic playbooks and a visual regression harness for generated worlds.
