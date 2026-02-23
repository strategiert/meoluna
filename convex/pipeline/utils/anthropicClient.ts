// ============================================================================
// Anthropic API Client - Shared helper for all pipeline steps
// ============================================================================

export interface AnthropicCallOptions {
  model: "claude-sonnet-4-20250514" | "claude-opus-4-20250514";
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
  } catch (e) {
    throw new Error(
      `JSON parse failed: ${e instanceof Error ? e.message : "Unknown error"}\n\nRaw text (first 500 chars): ${cleaned.substring(0, 500)}`
    );
  }
}

/**
 * Calls Anthropic and parses the JSON response.
 * Retries once with a "respond only with valid JSON" nudge on parse failure.
 */
export async function callAnthropicJson<T>(
  options: AnthropicCallOptions,
  maxRetries = 1
): Promise<{ result: T; inputTokens: number; outputTokens: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const message = attempt === 0
      ? options.userMessage
      : `${options.userMessage}\n\nWICHTIG: Antworte NUR mit validem JSON. Keine Erklärungen, kein Markdown-Wrapper.`;

    const response = await callAnthropic({
      ...options,
      userMessage: message,
    });

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
        console.warn(`JSON parse attempt ${attempt + 1} failed, retrying...`);
      }
    }
  }

  throw lastError || new Error("JSON parse failed after retries");
}
