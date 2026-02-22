// ============================================================================
// Gemini SVG Client - Generates standalone SVG (optionally animated)
// Used only for vector-style assets (icon/illustration/character)
// ============================================================================

type AspectRatio = "16:9" | "1:1" | "4:3";

export interface GeminiSvgRequest {
  prompt: string;
  category: string;
  purpose: string;
  aspectRatio: AspectRatio;
  timeoutMs?: number;
}

export interface GeminiSvgResult {
  svg: string | null;
  error?: string;
}

// Official Gemini API model code for "Gemini 3.1 Pro Preview" (Google docs).
const DEFAULT_MODEL = "gemini-3.1-pro-preview";

function resolveModelId(): string {
  const configured = process.env.GEMINI_SVG_MODEL?.trim();
  const model = configured || DEFAULT_MODEL;

  // Enforce Gemini 3.1 Pro for all in-world graphics to avoid silently using older aliases.
  if (model !== DEFAULT_MODEL) {
    throw new Error(
      `Ungültiges GEMINI_SVG_MODEL="${model}". Erlaubt ist nur "${DEFAULT_MODEL}".`
    );
  }

  return model;
}

function getCanvas(aspectRatio: AspectRatio): { width: number; height: number } {
  if (aspectRatio === "16:9") return { width: 1600, height: 900 };
  if (aspectRatio === "4:3") return { width: 1200, height: 900 };
  return { width: 1024, height: 1024 };
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:svg|xml)?\s*\n?/gim, "")
    .replace(/\n?```\s*$/gim, "")
    .trim();
}

function extractSvgMarkup(text: string): string | null {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("<svg");
  const end = cleaned.lastIndexOf("</svg>");
  if (start === -1 || end === -1 || end <= start) return null;
  return cleaned.slice(start, end + "</svg>".length).trim();
}

function sanitizeSvg(svg: string): string {
  const trimmed = svg.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed.startsWith("<svg")) {
    throw new Error("SVG fehlt <svg>-Root");
  }

  const blockedPatterns = [
    "<script",
    "javascript:",
    "onload=",
    "onerror=",
    "<foreignobject",
    "<iframe",
  ];
  for (const pattern of blockedPatterns) {
    if (lower.includes(pattern)) {
      throw new Error(`SVG enthaelt blockiertes Muster: ${pattern}`);
    }
  }

  let normalized = trimmed;
  if (!/\sxmlns=/.test(normalized)) {
    normalized = normalized.replace(
      /^<svg\b/,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  if (normalized.length > 120_000) {
    throw new Error("SVG zu gross");
  }

  return normalized;
}

function extractTextFromGeminiResponse(data: unknown): string {
  const root = data as Record<string, unknown>;
  const candidates = root?.candidates as Array<Record<string, unknown>> | undefined;
  const first = candidates?.[0];
  const content = first?.content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;
  const text = parts
    ?.map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Keine Textantwort von Gemini erhalten");
  }

  return text;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateSvgAsset(request: GeminiSvgRequest): Promise<GeminiSvgResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { svg: null, error: "GEMINI_API_KEY not configured" };
  }

  const model = resolveModelId();
  const apiBase = process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const timeoutMs = request.timeoutMs ?? 30000;
  const { width, height } = getCanvas(request.aspectRatio);

  const prompt = [
    "Erzeuge genau EIN standalone SVG.",
    "Antworte NUR mit dem SVG-Markup (kein Markdown, keine Erklaerung).",
    `Kategorie: ${request.category}`,
    `Zweck: ${request.purpose}`,
    `Bildidee: ${request.prompt}`,
    `Canvas: ${width}x${height}, mit viewBox="0 0 ${width} ${height}"`,
    "Stil: hochwertig, klar lesbar, 2D vector.",
    (request.category === "background" || request.category === "illustration")
      ? "PFLICHT: Animierter SVG! Integriere CSS-@keyframes ODER SMIL-Animationen (z.B. sanft schwingende Elemente, pulsierende Lichter, fließende Partikel, Farbübergänge, Rotation). Mindestens 2 animierte Elemente. Kein JavaScript."
      : "Empfohlen: Dezente SVG-Animation (SMIL oder CSS-@keyframes im <style>) ohne JavaScript.",
    "Keine externen Fonts, keine externen Bilder, keine Scripts, kein foreignObject.",
    "Transparenter Hintergrund, ausser der Prompt beschreibt explizit einen Hintergrund.",
  ].join("\n");

  try {
    const response = await fetchWithTimeout(
      `${apiBase}/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: "text/plain",
          },
        }),
      },
      timeoutMs
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[GeminiSVG] API error ${response.status}: ${errorText}`);
      return { svg: null, error: `gemini ${response.status}` };
    }

    const data = await response.json();
    const text = extractTextFromGeminiResponse(data);
    const rawSvg = extractSvgMarkup(text);
    if (!rawSvg) {
      return { svg: null, error: "Gemini response enthält kein <svg>" };
    }

    const sanitized = sanitizeSvg(rawSvg);
    return { svg: sanitized };
  } catch (error) {
    const msg =
      error instanceof Error && error.name === "AbortError"
        ? `Gemini SVG timeout after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : String(error);
    console.error(`[GeminiSVG] ${msg}`);
    return { svg: null, error: msg };
  }
}
