import { callAnthropicJson } from "../utils/anthropicClient";
import { TIME_SEQUENCE_SYSTEM_PROMPT } from "../prompts/timeSequence";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { TimeEngineSpec } from "../engines/timeSequenceTypes";
import { validateTimeEngineSpec } from "../engines/timeSequenceValidator";
import { buildTimeSequenceWorldCode } from "../engines/timeSequenceRenderer";

export async function runTimeSequenceGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: TimeEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await callAnthropicJson<TimeEngineSpec>({
    model: "claude-opus-4-20250514",
    systemPrompt: TIME_SEQUENCE_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 12000,
    temperature: 0.4,
  });

  const validation = validateTimeEngineSpec(response.result);
  if (!validation.passed) {
    throw new Error(`Time spec failed validation: ${validation.violations.join(" | ")}`);
  }

  return {
    spec: response.result,
    code: buildTimeSequenceWorldCode(response.result),
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
