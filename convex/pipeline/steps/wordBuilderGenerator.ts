import { callAnthropicJson } from "../utils/anthropicClient";
import { WORD_BUILDER_SYSTEM_PROMPT } from "../prompts/wordBuilder";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { WordEngineSpec } from "../engines/wordBuilderTypes";
import { validateWordEngineSpec } from "../engines/wordBuilderValidator";
import { buildWordBuilderWorldCode } from "../engines/wordBuilderRenderer";

export async function runWordBuilderGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: WordEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await callAnthropicJson<WordEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: WORD_BUILDER_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 16000,
    temperature: 0.4,
  });

  const validation = validateWordEngineSpec(response.result);
  if (!validation.passed) {
    throw new Error(`Word spec failed validation: ${validation.violations.join(" | ")}`);
  }

  return {
    spec: response.result,
    code: buildWordBuilderWorldCode(response.result),
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
