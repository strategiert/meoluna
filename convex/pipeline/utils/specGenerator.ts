import { callAnthropicJson, type AnthropicCallOptions } from "./anthropicClient";

export type SpecValidation = { passed: boolean; violations: string[] };

// Generiert eine Engine-Spec und gibt dem Modell bei Validierungsfehlern die
// KONKRETEN Verstoesse als Feedback zurueck, statt sofort auf die langsame
// Broad-Pipeline zu fallen. Wichtig fuer Engines mit harten Logik-Constraints
// (z.B. Detective-Ausschlussraetsel), wo Opus die Regel mal verfehlt.
export async function generateValidatedSpec<T>(opts: {
  model: AnthropicCallOptions["model"];
  systemPrompt: string;
  brief: unknown;
  maxTokens: number;
  temperature: number;
  validate: (spec: T) => SpecValidation;
  label: string;
  maxAttempts?: number;
}): Promise<{ spec: T; inputTokens: number; outputTokens: number }> {
  const maxAttempts = opts.maxAttempts ?? 2;
  const baseMessage = JSON.stringify(opts.brief);
  let lastViolations: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const userMessage = attempt === 0
      ? baseMessage
      : `${baseMessage}\n\nDein letzter Versuch war UNGUELTIG. Behebe genau diese Fehler:\n- ${lastViolations.join("\n- ")}\nBaue die Welt komplett neu und pruefe die Logik Schritt fuer Schritt, bevor du antwortest.`;

    const response = await callAnthropicJson<T>({
      model: opts.model,
      systemPrompt: opts.systemPrompt,
      userMessage,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
    });
    inputTokens += response.inputTokens;
    outputTokens += response.outputTokens;

    const validation = opts.validate(response.result);
    if (validation.passed) {
      return { spec: response.result, inputTokens, outputTokens };
    }
    lastViolations = validation.violations;
    console.warn(`[${opts.label}] spec invalid on attempt ${attempt + 1}: ${validation.violations.slice(0, 3).join(" | ")}`);
  }

  throw new Error(`${opts.label} spec failed validation after ${maxAttempts} attempts: ${lastViolations.join(" | ")}`);
}
