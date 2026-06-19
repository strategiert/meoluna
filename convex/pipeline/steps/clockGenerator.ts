import { generateValidatedSpec } from "../utils/specGenerator";
import { CLOCK_SYSTEM_PROMPT } from "../prompts/clock";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { ClockEngineSpec } from "../engines/clockTypes";
import { validateClockEngineSpec } from "../engines/clockValidator";
import { buildClockWorldCode } from "../engines/clockRenderer";

export async function runClockGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: ClockEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<ClockEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: CLOCK_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 12000,
    temperature: 0.4,
    validate: validateClockEngineSpec,
    label: "clock",
    maxAttempts: 2,
  });

  return { spec, code: buildClockWorldCode(spec), inputTokens, outputTokens };
}
