import { callAnthropicJson } from "../utils/anthropicClient";
import { MIXING_BALANCE_SYSTEM_PROMPT } from "../prompts/mixingBalance";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { MixingEngineSpec } from "../engines/mixingBalanceTypes";
import { validateMixingEngineSpec } from "../engines/mixingBalanceValidator";
import { buildMixingBalanceWorldCode } from "../engines/mixingBalanceRenderer";

export async function runMixingBalanceGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: MixingEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await callAnthropicJson<MixingEngineSpec>({
    model: "claude-opus-4-20250514",
    systemPrompt: MIXING_BALANCE_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 10000,
    temperature: 0.4,
  });

  const validation = validateMixingEngineSpec(response.result);
  if (!validation.passed) {
    throw new Error(`Mixing spec failed validation: ${validation.violations.join(" | ")}`);
  }

  return {
    spec: response.result,
    code: buildMixingBalanceWorldCode(response.result),
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
