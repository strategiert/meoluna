import { generateValidatedSpec } from "../utils/specGenerator";
import { CHART_SYSTEM_PROMPT } from "../prompts/chart";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { ChartEngineSpec } from "../engines/chartTypes";
import { validateChartEngineSpec } from "../engines/chartValidator";
import { buildChartWorldCode } from "../engines/chartRenderer";

export async function runChartGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: ChartEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<ChartEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: CHART_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 12000,
    temperature: 0.4,
    validate: validateChartEngineSpec,
    label: "chart",
    maxAttempts: 2,
  });

  return { spec, code: buildChartWorldCode(spec), inputTokens, outputTokens };
}
