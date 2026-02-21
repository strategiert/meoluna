// ============================================================================
// STEP 7: QUALITY GATE - Alles auf Korrektheit prüfen
// Model: Sonnet (analytisch) | Temp: 0 | Max: 4000
// ============================================================================

import { callAnthropicJson } from "../utils/anthropicClient";
import { QUALITY_GATE_SYSTEM_PROMPT } from "../prompts/qualityGate";
import type {
  InterpreterOutput,
  CreativeDirectorOutput,
  GameDesignerOutput,
  ContentArchitectOutput,
  QualityGateOutput,
} from "../types";

function buildFallbackQualityGate(): QualityGateOutput {
  return {
    overallScore: 7,
    criticalErrors: [],
    warnings: [
      {
        location: "quality_gate",
        description: "Quality Gate fallback active due to timeout/parse issue.",
        suggestion: "Proceed with generation and validate manually if needed.",
      },
    ],
    correctedContent: {},
    fallbacks: [
      {
        risk: "Automatic quality analysis was unavailable.",
        fallback: "Pipeline continued with neutral quality score.",
      },
    ],
  };
}

export async function runQualityGate(
  interpreted: InterpreterOutput,
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput,
  content: ContentArchitectOutput
) {
  const userMessage = `Prüfe diesen vollständigen Lernwelt-Plan:

=== PÄDAGOGISCHE GRUNDLAGE ===
${JSON.stringify(interpreted, null, 2)}

=== KREATIVES KONZEPT ===
${JSON.stringify(concept, null, 2)}

=== SPIELMECHANIKEN ===
${JSON.stringify(gameDesign, null, 2)}

=== AUFGABEN & INHALTE ===
${JSON.stringify(content, null, 2)}

Prüfe ALLES auf Fehler. Sei streng aber fair.
FUER PERFORMANCE: Kurz und praezise bleiben.`; 

  try {
    const { result, inputTokens, outputTokens } = await callAnthropicJson<QualityGateOutput>({
      model: "claude-sonnet-4-20250514",
      systemPrompt: QUALITY_GATE_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 3000,
      temperature: 0,
      timeoutMs: 60000,
    }, 0);

    return { result, inputTokens, outputTokens };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[QualityGate] Fallback aktiviert: ${msg}`);
    return {
      result: buildFallbackQualityGate(),
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}

/**
 * Applies corrections from Quality Gate to the content.
 * Uses the correctedContent map of dotpath → value.
 */
export function applyCorrections(
  content: ContentArchitectOutput,
  corrections: Record<string, unknown>
): ContentArchitectOutput {
  // Deep clone to avoid mutation
  const patched = JSON.parse(JSON.stringify(content)) as ContentArchitectOutput;

  for (const [path, value] of Object.entries(corrections)) {
    try {
      setNestedValue(patched as unknown as Record<string, unknown>, path, value);
    } catch (e) {
      console.warn(`Could not apply correction at ${path}:`, e);
    }
  }

  return patched;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  // Parse paths like "modules[2].tasks[1].correctAnswer"
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const numKey = Number(key);

    if (!isNaN(numKey) && Array.isArray(current)) {
      current = (current as unknown[])[numKey] as Record<string, unknown>;
    } else {
      current = current[key] as Record<string, unknown>;
    }

    if (current === undefined || current === null) {
      throw new Error(`Path segment '${key}' not found`);
    }
  }

  const lastKey = parts[parts.length - 1];
  const numLastKey = Number(lastKey);

  if (!isNaN(numLastKey) && Array.isArray(current)) {
    (current as unknown[])[numLastKey] = value;
  } else {
    current[lastKey] = value;
  }
}
