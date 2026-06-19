import { generateValidatedSpec } from "../utils/specGenerator";
import { DETECTIVE_EVIDENCE_SYSTEM_PROMPT } from "../prompts/detectiveEvidence";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { DetectiveEngineSpec } from "../engines/detectiveEvidenceTypes";
import { validateDetectiveEngineSpec } from "../engines/detectiveEvidenceValidator";
import { buildDetectiveEvidenceWorldCode } from "../engines/detectiveEvidenceRenderer";

export async function runDetectiveEvidenceGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: DetectiveEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  // Validierungs-Retry: Detective-Ausschlussraetsel haben harte Logik-
  // Constraints, die Opus mal verfehlt. Bei Fehler bekommt das Modell die
  // konkreten Verstoesse als Feedback statt sofortigem Broad-Fallback.
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<DetectiveEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: DETECTIVE_EVIDENCE_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 16000,
    temperature: 0.4,
    validate: validateDetectiveEngineSpec,
    label: "detective-evidence",
    maxAttempts: 2,
  });

  return {
    spec,
    code: buildDetectiveEvidenceWorldCode(spec),
    inputTokens,
    outputTokens,
  };
}
