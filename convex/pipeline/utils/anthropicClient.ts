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

// Harte Obergrenze pro einzelnem Request. Ohne Timeout kann ein haengender
// Socket die ganze Convex-Action bis zum Wall-Clock-Kill blockieren -> die
// Session bleibt ewig "running" (Zombie), weil der Kill den catch-Block nie
// erreicht. Mit Abort wirft der Call sauber -> Orchestrator-catch -> failSession.
const REQUEST_TIMEOUT_MS = 120_000;
const NETWORK_RETRIES = 2;

function isTransientNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    // AbortError (Timeout) oder generische fetch/Netzwerk-Fehler ("fetch failed",
    // ECONNRESET, ETIMEDOUT, socket hang up ...). HTTP-Status-Fehler werden NICHT
    // hier behandelt (die kommen als eigene Exception mit Status).
    return error.name === "AbortError" || /fetch failed|network|ECONNRESET|ETIMEDOUT|socket hang up|terminated/i.test(error.message);
  }
  return false;
}

/**
 * Makes a call to the Anthropic Messages API.
 * Used by all pipeline steps that need LLM inference.
 * Each attempt is bounded by REQUEST_TIMEOUT_MS; transient network/timeout
 * failures are retried, HTTP status errors surface immediately.
 */
export async function callAnthropic(options: AnthropicCallOptions): Promise<AnthropicResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= NETWORK_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
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
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        // 429/5xx sind serverseitig transient -> retry. 4xx (ausser 429) nicht.
        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(`Anthropic API Error: ${response.status} - ${error}`);
          console.warn(`[anthropic] ${response.status}, attempt ${attempt + 1}/${NETWORK_RETRIES + 1}, retrying...`);
          continue;
        }
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
    } catch (error) {
      if (isTransientNetworkError(error)) {
        const aborted = error instanceof Error && error.name === "AbortError";
        lastError = new Error(aborted ? `Anthropic request timed out after ${REQUEST_TIMEOUT_MS}ms` : `Anthropic network error: ${error instanceof Error ? error.message : String(error)}`);
        console.warn(`[anthropic] ${lastError.message}, attempt ${attempt + 1}/${NETWORK_RETRIES + 1}, retrying...`);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("Anthropic request failed after retries");
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
