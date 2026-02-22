// ============================================================================
// Anthropic API Client - Shared helper for all pipeline steps
// ============================================================================

export interface AnthropicCallOptions {
  model: "claude-sonnet-4-6" | "claude-opus-4-6";
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
  timeoutMs?: number;
}

export interface AnthropicResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  stopReason?: string;
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

  const timeoutMs = options.timeoutMs ?? 120000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Anthropic API timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }

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
    stopReason: data.stop_reason ?? undefined,
  };
}

function extractJsonCandidate(text: string): string {
  // Strip markdown code blocks.
  let cleaned = text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();

  // Sometimes the model wraps extra text around the JSON.
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return cleaned;
}

function findBalancedJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Parses a JSON response from the LLM, handling common issues.
 * Strips markdown code blocks, attempts parse, retries on failure.
 */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = extractJsonCandidate(text);

  const candidates: string[] = [cleaned];
  const balanced = findBalancedJsonObject(cleaned);
  if (balanced && balanced !== cleaned) candidates.push(balanced);

  const cleanedNoTrailingCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
  if (cleanedNoTrailingCommas !== cleaned) candidates.push(cleanedNoTrailingCommas);

  if (balanced) {
    const balancedNoTrailingCommas = balanced.replace(/,\s*([}\]])/g, "$1");
    if (balancedNoTrailingCommas !== balanced) candidates.push(balancedNoTrailingCommas);
  }

  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));
  let lastError: unknown = null;

  for (const candidate of uniqueCandidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(
    `JSON parse failed: ${lastError instanceof Error ? lastError.message : "Unknown error"}\n` +
    `Length: ${cleaned.length} chars\n` +
    `Raw text (first 500 chars): ${cleaned.substring(0, 500)}\n` +
    `Raw text (last 250 chars): ${cleaned.substring(Math.max(0, cleaned.length - 250))}`
  );
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
  let currentMaxTokens = options.maxTokens;
  let lastStopReason: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const message = attempt === 0
      ? options.userMessage
      : `${options.userMessage}\n\n` +
        `WICHTIG FORMATREGELN:\n` +
        `- Antworte NUR mit validem JSON.\n` +
        `- Starte direkt mit { und ende mit }.\n` +
        `- Keine Markdown-Codefences, keine Kommentare, keine Erklärungen.\n` +
        `- Verwende ausschließlich doppelte Anführungszeichen für Strings.`;

    const response = await callAnthropic({
      ...options,
      userMessage: message,
      maxTokens: currentMaxTokens,
    });
    lastStopReason = response.stopReason;

    try {
      const result = parseJsonResponse<T>(response.text);
      return {
        result,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      };
    } catch (e) {
      const baseError = e instanceof Error ? e : new Error(String(e));
      const stopReasonSuffix = response.stopReason
        ? ` (stop_reason=${response.stopReason}, max_tokens=${currentMaxTokens})`
        : "";
      lastError = new Error(`${baseError.message}${stopReasonSuffix}`);

      if (response.stopReason === "max_tokens") {
        currentMaxTokens = Math.min(Math.ceil(currentMaxTokens * 1.5), 24000);
      }

      if (attempt < maxRetries) {
        console.warn(
          `JSON parse attempt ${attempt + 1} failed, retrying...` +
          ` (next max_tokens=${currentMaxTokens})`
        );
      }
    }
  }

  if (lastError) {
    throw new Error(
      `JSON parse failed after ${maxRetries + 1} attempts` +
      `${lastStopReason ? ` (last stop_reason=${lastStopReason})` : ""}: ` +
      `${lastError.message}`
    );
  }

  throw new Error("JSON parse failed after retries");
}
