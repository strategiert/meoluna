import { callAnthropicJson } from "../utils/anthropicClient";
import { MOVEMENT_SPACE_SYSTEM_PROMPT } from "../prompts/movementSpace";
import type { LearningBrief, MovementEngineSpec } from "../engines/movementSpaceTypes";
import { validateMovementEngineSpec } from "../engines/movementSpaceValidator";
import { buildMovementSpaceWorldCode } from "../engines/movementSpaceRenderer";
import { tryBuildArithmeticMovementSpec } from "../engines/arithmeticMovementSpec";

export async function runMovementSpaceGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: MovementEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const arithmeticSpec = tryBuildArithmeticMovementSpec(input.brief);
  if (arithmeticSpec) {
    const validation = validateMovementEngineSpec(arithmeticSpec);
    if (!validation.passed) {
      throw new Error(`Arithmetic movement spec failed validation: ${validation.violations.join(" | ")}`);
    }

    return {
      spec: arithmeticSpec,
      code: buildMovementSpaceWorldCode(arithmeticSpec),
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  const response = await callAnthropicJson<MovementEngineSpec>({
    model: "claude-opus-4-6",
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
