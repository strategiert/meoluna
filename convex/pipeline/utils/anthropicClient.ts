// ============================================================================
// Anthropic API Client - Shared helper for all pipeline steps
// WICHTIG: Nur via /v1/models verifizierte Modell-IDs verwenden. Die alten
// Mai-2025-IDs (claude-*-4-20250514) liefern 404 not_found. Aktuell gueltig:
// claude-sonnet-4-6 (schnelle Steps) und claude-opus-4-6 (kreative Generatoren).
// ============================================================================

export interface AnthropicCallOptions {
  model: "claude-sonnet-4-6" | "claude-opus-4-6";
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
}

export interface AnthropicResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  stopReason: string | null;   // "end_turn" | "max_tokens" | ...
}

/**
 * Makes a call to the Anthropic Messages API.
 * Used by all pipeline steps that need LLM inference.
 */
export async function callAnthropic(options: AnthropicCallOptions): Promise<AnthropicResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [{ role: "user", content: options.userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  return {
    text,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
    model: options.model,
    stopReason: data.stop_reason ?? null,
  };
}

/**
 * Parses a JSON response from the LLM, handling common issues.
 * Strips markdown code blocks, attempts parse, retries on failure.
 */
export function parseJsonResponse<T>(text: string): T {
  // Strip markdown code blocks
  let cleaned = text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();

  // Sometimes the model wraps in extra text before/after JSON
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError) {
    // Haeufigster LLM-Fehler: trailing commas vor } oder ]. Einmal reparieren.
    const repaired = cleaned.replace(/,(\s*[}\]])/g, "$1");
    try {
      return JSON.parse(repaired) as T;
    } catch (e) {
      // Bei Fehler das ENDE zeigen - dort wird Truncation (abgeschnittenes
      // JSON wegen max_tokens) sichtbar.
      const tail = cleaned.slice(-300);
      throw new Error(
        `JSON parse failed: ${e instanceof Error ? e.message : "Unknown error"}\n\nLast 300 chars: ...${tail}`
      );
    }
  }
}

/**
 * Calls Anthropic and parses the JSON response.
 * Retries once with a "respond only with valid JSON" nudge on parse failure.
 */
export async function callAnthropicJson<T>(
  options: AnthropicCallOptions,
  maxRetries = 2
): Promise<{ result: T; inputTokens: number; outputTokens: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await callAnthropic({
      ...options,
      userMessage: attempt === 0
        ? options.userMessage
        : `${options.userMessage}\n\nWICHTIG: Antworte NUR mit einem einzigen validen JSON-Objekt. Keine Erklärungen, kein Markdown, keine trailing commas.`,
    });

    // Truncation (Output wegen max_tokens abgeschnitten) ist nicht durch einen
    // Prompt-Hinweis behebbar - der Output muss kuerzer werden bzw. das Budget
    // hoeher. Sichtbar machen statt blind retryen.
    if (response.stopReason === "max_tokens") {
      lastError = new Error(
        `Antwort wegen max_tokens (${options.maxTokens}) abgeschnitten - Output zu lang fuer das Budget.`
      );
      console.warn(`[anthropicJson] truncated at max_tokens=${options.maxTokens}, attempt ${attempt + 1}`);
      continue;
    }

    try {
      const result = parseJsonResponse<T>(response.text);
      return {
        result,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries) {
        console.warn(`[anthropicJson] parse attempt ${attempt + 1} failed (stop_reason=${response.stopReason}), retrying...`);
      }
    }
  }

  throw lastError || new Error("JSON parse failed after retries");
}
