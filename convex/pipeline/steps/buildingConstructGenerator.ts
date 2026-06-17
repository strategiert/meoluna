import { callAnthropicJson } from "../utils/anthropicClient";
import { BUILDING_CONSTRUCT_SYSTEM_PROMPT } from "../prompts/buildingConstruct";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { BuildingEngineSpec } from "../engines/buildingConstructTypes";
import { validateBuildingEngineSpec } from "../engines/buildingConstructValidator";
import { buildBuildingConstructWorldCode } from "../engines/buildingConstructRenderer";

export async function runBuildingConstructGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: BuildingEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await callAnthropicJson<BuildingEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: BUILDING_CONSTRUCT_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 12000,
    temperature: 0.4,
  });

  const validation = validateBuildingEngineSpec(response.result);
  if (!validation.passed) {
    throw new Error(`Building spec failed validation: ${validation.violations.join(" | ")}`);
  }

  return {
    spec: response.result,
    code: buildBuildingConstructWorldCode(response.result),
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
