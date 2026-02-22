// ============================================================================
// STEP 9: VALIDATION & FIX LOOP
// Programmatic checks first, then LLM fix if needed (max 3 iterations)
// ============================================================================

import { callAnthropic } from "../utils/anthropicClient";
import { AUTO_FIX_SYSTEM_PROMPT } from "../prompts/autoFix";
import { validateCode, quickFix, cleanCodeOutput } from "../utils/validation";
import type { ValidationResult } from "../types";

export async function runValidator(rawCode: string, maxRetries = 3): Promise<ValidationResult> {
  let code = rawCode;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < maxRetries; i++) {
    const errors = validateCode(code);

    if (errors.length === 0) {
      return {
        code,
        success: true,
        iterations: i,
      };
    }

    console.log(`Validation attempt ${i + 1}: ${errors.length} errors found`);

    // Try programmatic quick-fixes first
    const { code: quickFixed, fixed } = quickFix(code, errors);
    if (fixed) {
      code = quickFixed;
      // Re-validate after quick fix
      const remainingErrors = validateCode(code);
      if (remainingErrors.length === 0) {
        return {
          code,
          success: true,
          iterations: i,
        };
      }
    }

    // If quick-fix wasn't enough, use LLM to fix
    const remainingErrors = validateCode(code);
    if (remainingErrors.length > 0) {
      const userMessage = `Dieser React-Code hat folgende Fehler:

FEHLER:
${remainingErrors.join("\n")}

CODE:
${code}

Repariere den Code und gib NUR den reparierten Code zurück.`;

      try {
        const response = await callAnthropic({
          model: "claude-sonnet-4-6",
          systemPrompt: AUTO_FIX_SYSTEM_PROMPT,
          userMessage,
          maxTokens: 64000,
          temperature: 0,
          timeoutMs: 60000,
        });

        totalInputTokens += response.inputTokens;
        totalOutputTokens += response.outputTokens;

        code = cleanCodeOutput(response.text);
      } catch (e) {
        console.error(`LLM fix attempt ${i + 1} failed:`, e);
        // Continue with current code to next iteration
      }
    }
  }

  // Final check after all retries
  const finalErrors = validateCode(code);
  return {
    code,
    success: finalErrors.length === 0,
    iterations: maxRetries,
    errors: finalErrors.length > 0 ? finalErrors : undefined,
  };
}
