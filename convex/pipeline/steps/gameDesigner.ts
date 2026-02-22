// ============================================================================
// STEP 3: GAME DESIGNER - Spielmechaniken & Modulstruktur erfinden
// Model: Sonnet-4.6 (schnell, kreativ) | Temp: 0.9 | Max: 6000
// ============================================================================

import { callAnthropicJson } from "../utils/anthropicClient";
import { GAME_DESIGNER_SYSTEM_PROMPT } from "../prompts/gameDesigner";
import type { InterpreterOutput, CreativeDirectorOutput, GameDesignerOutput } from "../types";

export async function runGameDesigner(
  interpreted: InterpreterOutput,
  concept: CreativeDirectorOutput
) {
  const userMessage = `Erstelle den Game-Design-Plan für diese Lernwelt:

=== PÄDAGOGISCHE GRUNDLAGE ===
${JSON.stringify(interpreted, null, 2)}

=== KREATIVES KONZEPT ===
${JSON.stringify(concept, null, 2)}

Erfinde jetzt 10-15 Module mit JEWEILS einzigartigen Spielmechaniken.
Jedes Modul muss sich wie ein eigenständiges Mini-Spiel anfühlen.`;

  const { result, inputTokens, outputTokens } = await callAnthropicJson<GameDesignerOutput>({
    model: "claude-sonnet-4-6",
    systemPrompt: GAME_DESIGNER_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 6000,
    temperature: 0.9,
    timeoutMs: 90000,
  });

  // Validate
  if (!result.modules?.length || !result.bossModule) {
    throw new Error("Game Designer output missing modules or bossModule");
  }

  return { result, inputTokens, outputTokens };
}
