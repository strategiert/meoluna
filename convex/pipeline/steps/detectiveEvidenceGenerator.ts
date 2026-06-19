import { callAnthropicJson } from "../utils/anthropicClient";
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
  const response = await callAnthropicJson<DetectiveEngineSpec>({
    model: "claude-opus-4-6",
    systemPrompt: DETECTIVE_EVIDENCE_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 16000,
    temperature: 0.4,
  });

  const validation = validateDetectiveEngineSpec(response.result);
  if (!validation.passed) {
    throw new Error(`Detective spec failed validation: ${validation.violations.join(" | ")}`);
  }

  return {
    spec: response.result,
    code: buildDetectiveEvidenceWorldCode(response.result),
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
