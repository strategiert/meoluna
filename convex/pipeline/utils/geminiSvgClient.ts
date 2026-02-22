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

// ── SVG-Qualitätsprüfung ────────────────────────────────────────────────────

interface QualityCheck {
  hasAnimations: boolean;
  animationCount: number;
  svgLength: number;
}

function checkSvgQuality(svg: string): QualityCheck {
  const smilAnimations = (svg.match(/<animate(?:Transform|Motion)?\b/gi) ?? []).length;
  const cssKeyframes  = (svg.match(/@keyframes\s/gi) ?? []).length;
  const cssAnimation  = (svg.match(/\banimation\s*:/gi) ?? []).length;

  const animationCount = smilAnimations + cssKeyframes;
  const hasAnimations  = animationCount > 0 || cssAnimation > 0;

  return { hasAnimations, animationCount: animationCount + (cssAnimation > 0 ? 1 : 0), svgLength: svg.length };
}

function buildRetryPrompt(check: QualityCheck, category: string): string {
  const issues: string[] = [];

  if (!check.hasAnimations) {
    issues.push(
      `KRITISCHER FEHLER: Das SVG enthält KEINE Animationen (gefunden: ${check.animationCount})! ` +
      `Du MUSST mindestens 3 Animationen einbauen. Nutze ENTWEDER CSS @keyframes in <style> ` +
      `(z.B. @keyframes pulse { 0%,100%{opacity:.7} 50%{opacity:1} } .el{animation:pulse 2s infinite}) ` +
      `ODER SMIL-Elemente (<animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>). ` +
      `Kein JavaScript. Jetzt animieren!`
    );
  }

  if (check.svgLength < 1500 && (category === "background" || category === "illustration")) {
    issues.push(
      `SVG ist zu simpel (${check.svgLength} Zeichen). ` +
      `Füge mehr Schichten, Texturen, Hintergrundelemente und Details hinzu für eine reichhaltige Szene.`
    );
  }

  return issues.join(" ");
}

// ── Asset-Generierung mit Iterations-Loop ───────────────────────────────────

export async function generateSvgAsset(request: GeminiSvgRequest): Promise<GeminiSvgResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { svg: null, error: "GEMINI_API_KEY not configured" };
  }

  const model   = resolveModelId();
  const apiBase = process.env.GEMINI_API_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
  const { width, height } = getCanvas(request.aspectRatio);

  // background + illustration: bis zu 3 Versuche; icon + character: 1 Versuch
  const needsAnimation = request.category === "background" || request.category === "illustration";
  const MAX_ATTEMPTS   = needsAnimation ? 3 : 1;
  const totalBudgetMs  = request.timeoutMs ?? 30000;
  const deadline       = Date.now() + totalBudgetMs;

  const animationInstruction = needsAnimation
    ? "PFLICHT: Animierter SVG! Baue mindestens 3 CSS-@keyframes oder SMIL-Animationen ein " +
      "(schwingende Elemente, pulsierende Lichter, fließende Partikel, Farbübergänge, Rotation). " +
      "Kein JavaScript. Ohne Animationen ist das SVG wertlos."
    : "Empfohlen: Dezente SVG-Animation (SMIL oder CSS-@keyframes im <style>) ohne JavaScript.";

  let bestSvg: string | null = null;
  let lastError: string | undefined;
  let lastQuality: QualityCheck | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 4000) {
      console.warn(`[GeminiSVG] Kein Zeit-Budget mehr für Versuch ${attempt}`);
      break;
    }

    const attemptTimeout = Math.min(22000, remaining - 2000);

    // Beim Retry-Versuch Feedback aus vorherigem Fehler anhängen
    const retryNote = attempt > 1 && lastQuality
      ? `\n\nVERBESSERUNGSBEDARF AUS VORHERIGEM VERSUCH:\n${buildRetryPrompt(lastQuality, request.category)}`
      : "";

    const promptText = [
      "Erzeuge genau EIN standalone SVG.",
      "Antworte NUR mit dem SVG-Markup (kein Markdown, keine Erklaerung).",
      `Kategorie: ${request.category}`,
      `Zweck: ${request.purpose}`,
      `Bildidee: ${request.prompt}`,
      `Canvas: ${width}x${height}, mit viewBox="0 0 ${width} ${height}"`,
      "Stil: hochwertig, detailreich, 2D vector.",
      animationInstruction,
      "Keine externen Fonts, keine externen Bilder, keine Scripts, kein foreignObject.",
      "Transparenter Hintergrund, ausser der Prompt beschreibt explizit einen Hintergrund.",
      retryNote,
    ].join("\n");

    try {
      const response = await fetchWithTimeout(
        `${apiBase}/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: attempt === 1 ? 0.4 : 0.6,  // Versuch 2+ kreativer
              maxOutputTokens: 8192,
              responseMimeType: "text/plain",
            },
          }),
        },
        attemptTimeout
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`[GeminiSVG] Versuch ${attempt} API-Fehler ${response.status}: ${errText}`);
        lastError = `gemini ${response.status}`;
        continue;
      }

      const data   = await response.json();
      const text   = extractTextFromGeminiResponse(data);
      const rawSvg = extractSvgMarkup(text);

      if (!rawSvg) {
        lastError = "Gemini response enthält kein <svg>";
        console.warn(`[GeminiSVG] Versuch ${attempt}: kein SVG-Markup gefunden`);
        continue;
      }

      const sanitized = sanitizeSvg(rawSvg);
      const quality   = checkSvgQuality(sanitized);
      lastQuality     = quality;
      bestSvg         = sanitized; // immer als Fallback merken

      const qualityOk = !needsAnimation || quality.hasAnimations;
      console.log(
        `[GeminiSVG] Versuch ${attempt}/${MAX_ATTEMPTS}: ` +
        `animations=${quality.animationCount}, size=${quality.svgLength}, ok=${qualityOk}`
      );

      if (qualityOk) {
        return { svg: sanitized };
      }

      // Qualität nicht ausreichend → nächster Versuch mit Feedback
    } catch (error) {
      const msg =
        error instanceof Error && error.name === "AbortError"
          ? `Timeout bei Versuch ${attempt} (${attemptTimeout}ms)`
          : error instanceof Error ? error.message : String(error);
      console.error(`[GeminiSVG] Versuch ${attempt} Fehler: ${msg}`);
      lastError = msg;
    }
  }

  // Bestes Ergebnis zurückgeben, auch wenn Qualitätsgrenze nicht erreicht
  if (bestSvg) {
    const q = lastQuality;
    console.warn(
      `[GeminiSVG] Nutze bestes verfügbares SVG nach ${MAX_ATTEMPTS} Versuchen ` +
      `(animations=${q?.animationCount ?? 0}, size=${q?.svgLength ?? 0})`
    );
    return { svg: bestSvg };
  }

  return { svg: null, error: lastError ?? "Alle Versuche fehlgeschlagen" };
}
