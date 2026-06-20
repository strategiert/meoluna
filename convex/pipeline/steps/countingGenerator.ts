import { generateValidatedSpec } from "../utils/specGenerator";
import { COUNTING_SYSTEM_PROMPT } from "../prompts/counting";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { CountEngineSpec } from "../engines/countingTypes";
import { validateCountEngineSpec } from "../engines/countingValidator";
import { buildCountingWorldCode } from "../engines/countingRenderer";

export async function runCountingGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: CountEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<CountEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: COUNTING_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 12000,
    temperature: 0.4,
    validate: validateCountEngineSpec,
    label: "counting",
    maxAttempts: 2,
  });

  return { spec, code: buildCountingWorldCode(spec), inputTokens, outputTokens };
}
