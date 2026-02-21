// ============================================================================
// STEP 8: CODE GENERATION (v3 — Skeleton-basiert)
//
// Statt freier App-Generierung:
// 1. LLM generiert JSON (worldConfig + modules + challenges)
// 2. Skeleton-Assembler baut daraus deterministischen React-Code
//
// Garantiert: Navigation, Meoluna API Calls, kein kaputtes HTML
// ============================================================================

import { callAnthropic } from "../utils/anthropicClient";
import { CODE_GENERATOR_SYSTEM_PROMPT } from "../prompts/codeGenerator";
import { buildWorldCode } from "../skeleton/worldSkeleton";
import type { WorldData } from "../skeleton/worldSkeleton";
import type {
  CreativeDirectorOutput,
  GameDesignerOutput,
  ContentArchitectOutput,
  AssetManifest,
  QualityGateOutput,
} from "../types";

/**
 * Extrahiert JSON aus dem LLM-Response (robust gegen Markdown-Wrapper).
 */
function extractJson(text: string): WorldData {
  // Entferne Markdown-Wrapper falls vorhanden
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();

  // Suche nach dem ersten { ... } Block
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Kein JSON-Objekt im LLM-Response gefunden");
  }

  const jsonStr = cleaned.slice(start, end + 1);
  return JSON.parse(jsonStr) as WorldData;
}

export async function runCodeGenerator(
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput,
  content: ContentArchitectOutput,
  assetManifest: AssetManifest,
  quality: QualityGateOutput
) {
  // Hub-Background URL aus AssetManifest extrahieren (erste Background-Asset mit gültiger URL)
  const hubBgUrl = Object.values(assetManifest).find(
    entry => entry.category === 'background' && entry.url
  )?.url ?? undefined;
  const userMessage = `Generiere das WorldData-JSON für diese Lernwelt:

=== KREATIVES KONZEPT ===
Weltname: ${concept.worldName}
Setting: ${concept.universe.setting}
Metapher: ${concept.universe.metaphor}
Farbpalette: ${concept.visualIdentity.colorPalette.join(", ")}
Stimmung: ${concept.visualIdentity.mood}

=== MODULE & SPIELMECHANIKEN ===
${gameDesign.modules.map((m, i) => `Modul ${i}: ${m.title} (${m.gameplayType})`).join("\n")}

=== AUFGABEN & CHALLENGES ===
${JSON.stringify(content, null, 2)}

=== QUALITY-GATE HINWEISE ===
Score: ${quality.overallScore}/10
Kritische Fehler: ${quality.criticalErrors.map(e => e.description).join("; ") || "keine"}

Generiere jetzt das WorldData-JSON. Gib NUR das JSON zurück, kein Markdown, keine Erklärungen.`;

  const response = await callAnthropic({
    model: "claude-sonnet-4-20250514",
    systemPrompt: CODE_GENERATOR_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 16000,
    temperature: 0.3,
  });

  // JSON parsen
  const worldData = extractJson(response.text);

  // Hub-Background injizieren (fal.ai Asset, falls vorhanden)
  if (hubBgUrl && worldData.config) {
    worldData.config.hubBgUrl = hubBgUrl;
  }

  // Validierung: Mindeststruktur
  if (!worldData.config || !worldData.modules || !Array.isArray(worldData.modules)) {
    throw new Error("Ungültiges WorldData-JSON: config oder modules fehlen");
  }
  if (worldData.modules.length === 0) {
    throw new Error("Ungültiges WorldData-JSON: keine Module");
  }
  for (const mod of worldData.modules) {
    if (!mod.challenges || mod.challenges.length === 0) {
      throw new Error(`Modul "${mod.title}" hat keine Challenges`);
    }
  }

  // Skeleton-Assembler: JSON → React-Code
  const code = buildWorldCode(worldData);

  return {
    code,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
