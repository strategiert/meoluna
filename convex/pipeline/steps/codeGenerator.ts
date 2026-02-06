// ============================================================================
// STEP 8: CODE GENERATION - Plan in React-Code umsetzen
// Model: Opus (max Tokens) | Temp: 0.2 | Max: 64000
// ============================================================================

import { callAnthropic } from "../utils/anthropicClient";
import { CODE_GENERATOR_SYSTEM_PROMPT } from "../prompts/codeGenerator";
import { cleanCodeOutput } from "../utils/validation";
import type {
  CreativeDirectorOutput,
  GameDesignerOutput,
  ContentArchitectOutput,
  AssetManifest,
  QualityGateOutput,
} from "../types";

export async function runCodeGenerator(
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput,
  content: ContentArchitectOutput,
  assetManifest: AssetManifest,
  quality: QualityGateOutput
) {
  const userMessage = `Setze diesen vollständigen Lernwelt-Plan in React-Code um:

=== KREATIVES KONZEPT ===
${JSON.stringify(concept, null, 2)}

=== SPIELMECHANIKEN & MODULE ===
${JSON.stringify(gameDesign, null, 2)}

=== AUFGABEN, LÖSUNGEN & FEEDBACK ===
${JSON.stringify(content, null, 2)}

=== ASSET-MANIFEST (generierte Bilder) ===
${JSON.stringify(assetManifest, null, 2)}

=== QUALITY-GATE ERGEBNISSE (beachte Fallbacks!) ===
${JSON.stringify(quality, null, 2)}

Programmiere jetzt die komplette React-App. Folge dem Plan exakt.
Nutze die Asset-URLs wo verfügbar, SVG-Fallbacks wo nicht.`;

  const response = await callAnthropic({
    model: "claude-opus-4-20250514",
    systemPrompt: CODE_GENERATOR_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 64000,
    temperature: 0.2,
  });

  const code = cleanCodeOutput(response.text);

  return {
    code,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
