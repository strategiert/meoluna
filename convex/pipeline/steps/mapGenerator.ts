import { generateValidatedSpec } from "../utils/specGenerator";
import { MAP_SYSTEM_PROMPT } from "../prompts/map";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { MapEngineSpec } from "../engines/mapTypes";
import { validateMapEngineSpec } from "../engines/mapValidator";
import { buildMapWorldCode } from "../engines/mapRenderer";

export async function runMapGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: MapEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<MapEngineSpec>({
    model: "claude-sonnet-4-6",
    escalateModel: "claude-opus-4-6",
    systemPrompt: MAP_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 12000,
    temperature: 0.4,
    validate: validateMapEngineSpec,
    label: "map",
    maxAttempts: 2,
  });

  return { spec, code: buildMapWorldCode(spec), inputTokens, outputTokens };
}
