// ============================================================================
// STEP 2: CREATIVE DIRECTOR - Einzigartiges Weltkonzept erfinden
// Model: Sonnet (schneller, timeout-sicherer) | Temp: 1.0 | Max: 4000
// ============================================================================

import { callAnthropicJson } from "../utils/anthropicClient";
import { CREATIVE_DIRECTOR_SYSTEM_PROMPT } from "../prompts/creativeDirector";
import type { InterpreterOutput, CreativeDirectorOutput } from "../types";

export async function runCreativeDirector(interpreted: InterpreterOutput) {
  const userMessage = `Erstelle ein einzigartiges Lernwelt-Konzept für folgendes Thema:

Thema: ${interpreted.topic}
Fach: ${interpreted.subject}
Klassenstufe: ${interpreted.gradeLevel} (Alter: ${interpreted.ageRange})
Lernziele: ${interpreted.learningGoals.join(", ")}
Schwierigkeit: ${interpreted.difficulty}

Erfinde jetzt ein Universum, das noch NIEMAND für dieses Thema verwendet hat.`;

  const { result, inputTokens, outputTokens } = await callAnthropicJson<CreativeDirectorOutput>({
    model: "claude-sonnet-4-20250514",
    systemPrompt: CREATIVE_DIRECTOR_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 4000,
    temperature: 1.0,
  });

  // Validate
  if (!result.worldName || !result.universe || !result.visualIdentity) {
    throw new Error("Creative Director output missing required fields");
  }

  return { result, inputTokens, outputTokens };
}
