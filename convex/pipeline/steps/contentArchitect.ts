// ============================================================================
// STEP 6: CONTENT ARCHITECT - Spiel-Challenges, Lösungen, Feedback, Hints
// Model: Sonnet (schneller, timeout-sicherer) | Temp: 0.5 | Max: 8000
// ============================================================================

import { callAnthropicJson } from "../utils/anthropicClient";
import { CONTENT_ARCHITECT_SYSTEM_PROMPT } from "../prompts/contentArchitect";
import type {
  InterpreterOutput,
  CreativeDirectorOutput,
  GameDesignerOutput,
  QualityGateOutput,
  ContentArchitectOutput,
} from "../types";

export async function runContentArchitect(
  interpreted: InterpreterOutput,
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput,
  qualityFeedback?: QualityGateOutput
) {
  let userMessage = `Erstelle die kompletten Spiel-Challenges für diese Minigame-Welt:

=== PÄDAGOGISCHE GRUNDLAGE ===
${JSON.stringify(interpreted, null, 2)}

=== KREATIVES KONZEPT ===
${JSON.stringify(concept, null, 2)}

=== MODUL-STRUKTUR & MINIGAME-MECHANIKEN ===
${JSON.stringify(gameDesign, null, 2)}

Erstelle jetzt ALLE Spiel-Challenges mit gameData, Lösungen, Feedback und Socratic Hints.
WICHTIG: Jede Challenge muss sich wie ein SPIEL anfühlen, nicht wie eine Schulaufgabe!
Achte auf absolute fachliche Korrektheit!`;

  // If Quality Gate gave feedback (retry), include it
  if (qualityFeedback) {
    userMessage += `

=== QUALITY-GATE FEEDBACK (Fehler korrigieren!) ===
${JSON.stringify(qualityFeedback, null, 2)}

WICHTIG: Korrigiere ALLE criticalErrors aus dem Quality-Gate!`;
  }

  const { result, inputTokens, outputTokens } = await callAnthropicJson<ContentArchitectOutput>({
    model: "claude-sonnet-4-20250514",
    systemPrompt: CONTENT_ARCHITECT_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 8000,
    temperature: 0.5,
  });

  // Validate
  if (!result.modules?.length) {
    throw new Error("Content Architect output missing modules");
  }
  if (!result.modules[0]?.challenges?.length) {
    throw new Error("Content Architect output missing challenges in modules");
  }

  return { result, inputTokens, outputTokens };
}
