import { generateValidatedSpec } from "../utils/specGenerator";
import { PATTERN_SYSTEM_PROMPT } from "../prompts/pattern";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { PatternEngineSpec } from "../engines/patternTypes";
import { validatePatternEngineSpec } from "../engines/patternValidator";
import { buildPatternWorldCode } from "../engines/patternRenderer";

export async function runPatternGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: PatternEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<PatternEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: PATTERN_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 12000,
    temperature: 0.4,
    validate: validatePatternEngineSpec,
    label: "pattern",
    maxAttempts: 2,
  });

  return { spec, code: buildPatternWorldCode(spec), inputTokens, outputTokens };
}
