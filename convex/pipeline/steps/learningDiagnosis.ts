import { callAnthropicJson } from "../utils/anthropicClient";
import { LEARNING_DIAGNOSIS_SYSTEM_PROMPT } from "../prompts/learningDiagnosis";
import type { LearningBrief } from "../engines/movementSpaceTypes";

export async function runLearningDiagnosis(input: {
  prompt: string;
  pdfText?: string;
  gradeLevel?: string;
  subject?: string;
}): Promise<{ result: LearningBrief; inputTokens: number; outputTokens: number }> {
  const userMessage = JSON.stringify({
    inputMode: input.pdfText ? "material" : "curriculum",
    prompt: input.prompt,
    pdfText: input.pdfText,
    gradeLevel: input.gradeLevel,
    subject: input.subject,
  });

  const response = await callAnthropicJson<LearningBrief>({
    model: "claude-sonnet-4-20250514",
    systemPrompt: LEARNING_DIAGNOSIS_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 3000,
    temperature: 0,
  });

  if (!response.result.rawTopic || !response.result.learningGoals?.length) {
    throw new Error("Learning diagnosis missing rawTopic or learningGoals");
  }

  return response;
}
