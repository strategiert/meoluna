// ============================================================================
// STEP 1: INTERPRETER - Analysiert User-Input, extrahiert Lernziele
// Model: Sonnet (schnell, analytisch) | Temp: 0 | Max: 2000
// ============================================================================

import { callAnthropicJson } from "../utils/anthropicClient";
import { INTERPRETER_SYSTEM_PROMPT } from "../prompts/interpreter";
import type { InterpreterOutput } from "../types";

interface InterpreterArgs {
  prompt: string;
  pdfText?: string;
  imageDescription?: string;
  gradeLevel?: string;
  subject?: string;
}

export async function runInterpreter(args: InterpreterArgs) {
  let userContent = "";

  if (args.pdfText) {
    userContent += `=== DOKUMENT (OCR) ===\n${args.pdfText}\n=== ENDE ===\n\n`;
  }

  if (args.imageDescription) {
    userContent += `=== BILD-BESCHREIBUNG ===\n${args.imageDescription}\n=== ENDE ===\n\n`;
  }

  userContent += `Aufgabe/Thema vom Schüler: "${args.prompt}"`;

  if (args.gradeLevel) userContent += `\nKlassenstufe: ${args.gradeLevel}`;
  if (args.subject) userContent += `\nFach: ${args.subject}`;

  const { result, inputTokens, outputTokens } = await callAnthropicJson<InterpreterOutput>({
    model: "claude-sonnet-4-20250514",
    systemPrompt: INTERPRETER_SYSTEM_PROMPT,
    userMessage: userContent,
    maxTokens: 2000,
    temperature: 0,
  });

  // Validate required fields
  if (!result.topic || !result.subject || !result.learningGoals?.length) {
    throw new Error("Interpreter output missing required fields (topic, subject, learningGoals)");
  }

  return { result, inputTokens, outputTokens };
}
