import { FOCUSED_INTERVENTION_SYSTEM_PROMPT } from "../prompts/focusedIntervention";
import { callAnthropic } from "../utils/anthropicClient";
import { runFocusedInterventionGate } from "../engines/focusedInterventionGate";
import { buildFocusedArithmeticMiniAppCode, parseSignedIntegerAddition } from "../engines/focusedArithmeticMiniApp";
import { contextAnswersToPrompt, type InterventionContextAnswers } from "../engines/focusedInterventionRouter";

function stripCodeFence(code: string): string {
  return code
    .replace(/^```(?:jsx|tsx|javascript|typescript|react)?\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();
}

export async function runFocusedInterventionGenerator(input: {
  prompt: string;
  pdfText?: string;
  imageDescription?: string;
  gradeLevel?: string;
  subject?: string;
  contextAnswers?: InterventionContextAnswers;
}): Promise<{
  code: string;
  worldName: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const source = [
    input.prompt,
    input.pdfText ?? "",
    input.imageDescription ?? "",
  ].join("\n");
  const parsedAddition = parseSignedIntegerAddition(source);

  if (parsedAddition) {
    const code = buildFocusedArithmeticMiniAppCode({
      prompt: input.prompt,
      parsed: parsedAddition,
    });
    const gate = runFocusedInterventionGate(code);
    if (!gate.passed) {
      throw new Error(`Focused arithmetic app failed gate: ${gate.violations.join(" | ")}`);
    }

    return {
      code,
      worldName: "Minus-Welt: Nach Westen wird es kleiner",
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  const userMessage = [
    `Nutzerwunsch:\n${input.prompt}`,
    input.pdfText ? `Dokument/OCR:\n${input.pdfText}` : "",
    input.imageDescription ? `Bildbeschreibung:\n${input.imageDescription}` : "",
    input.gradeLevel ? `Klasse: ${input.gradeLevel}` : "",
    input.subject ? `Fach: ${input.subject}` : "",
    `Kontextantworten:\n${contextAnswersToPrompt(input.contextAnswers)}`,
    "Baue jetzt die fokussierte Mini-App.",
  ].filter(Boolean).join("\n\n");

  const response = await callAnthropic({
    model: "claude-opus-4-6",
    systemPrompt: FOCUSED_INTERVENTION_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 24000,
    temperature: 0.65,
  });

  let code = stripCodeFence(response.text);
  if (!code.includes("export default")) {
    code += "\n\nexport default App;";
  }

  const gate = runFocusedInterventionGate(code);
  if (!gate.passed) {
    throw new Error(`Focused intervention gate failed: ${gate.violations.join(" | ")}`);
  }

  return {
    code,
    worldName: "Mini-App: Sofort verstehen",
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
