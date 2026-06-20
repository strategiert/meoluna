import { generateValidatedSpec } from "../utils/specGenerator";
import { DIAGRAM_SYSTEM_PROMPT } from "../prompts/diagram";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { DiagramEngineSpec } from "../engines/diagramTypes";
import { validateDiagramEngineSpec } from "../engines/diagramValidator";
import { buildDiagramWorldCode } from "../engines/diagramRenderer";

export async function runDiagramGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: DiagramEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<DiagramEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: DIAGRAM_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 12000,
    temperature: 0.4,
    validate: validateDiagramEngineSpec,
    label: "diagram",
    maxAttempts: 2,
  });

  return { spec, code: buildDiagramWorldCode(spec), inputTokens, outputTokens };
}
