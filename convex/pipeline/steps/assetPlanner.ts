// ============================================================================
// STEP 4: ASSET PLANNER - Asset-Liste mit Bild-Prompts erstellen
// Model: Sonnet (schnell, präzise) | Temp: 0.3 | Max: 3000
// ============================================================================

import { callAnthropicJson } from "../utils/anthropicClient";
import { ASSET_PLANNER_SYSTEM_PROMPT } from "../prompts/assetPlanner";
import type { CreativeDirectorOutput, GameDesignerOutput, AssetPlannerOutput } from "../types";

export async function runAssetPlanner(
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput
) {
  const userMessage = `Erstelle die Asset-Liste für diese Lernwelt:

=== KREATIVES KONZEPT ===
${JSON.stringify(concept, null, 2)}

=== MODUL-STRUKTUR ===
${JSON.stringify(gameDesign, null, 2)}

Erstelle maximal 12 Assets. Priorisiere: Hub-Hintergrund, Guide-Charakter, Modul-Icons.`;

  const { result, inputTokens, outputTokens } = await callAnthropicJson<AssetPlannerOutput>({
    model: "claude-sonnet-4-6",
    systemPrompt: ASSET_PLANNER_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 3000,
    temperature: 0.3,
  });

  // Validate
  if (!result.styleBase || !result.assets?.length) {
    throw new Error("Asset Planner output missing styleBase or assets");
  }

  return { result, inputTokens, outputTokens };
}
