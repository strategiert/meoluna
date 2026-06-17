import { callAnthropicJson } from "../utils/anthropicClient";
import { SORT_MATCH_SYSTEM_PROMPT } from "../prompts/sortMatch";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { SortEngineSpec } from "../engines/sortMatchTypes";
import { validateSortEngineSpec } from "../engines/sortMatchValidator";
import { buildSortMatchWorldCode } from "../engines/sortMatchRenderer";

export async function runSortMatchGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: SortEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await callAnthropicJson<SortEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: SORT_MATCH_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 12000,
    temperature: 0.4,
  });

  const validation = validateSortEngineSpec(response.result);
  if (!validation.passed) {
    throw new Error(`Sort spec failed validation: ${validation.violations.join(" | ")}`);
  }

  return {
    spec: response.result,
    code: buildSortMatchWorldCode(response.result),
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
