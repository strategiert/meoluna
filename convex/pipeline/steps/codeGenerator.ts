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

function normalizeText(value: unknown, fallback: string, maxLen = 120): string {
  const raw = typeof value === "string" ? value : String(value ?? "");
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

function validateWorldData(worldData: WorldData): void {
  if (!worldData.config || !worldData.modules || !Array.isArray(worldData.modules)) {
    throw new Error("Ungueltiges WorldData-JSON: config oder modules fehlen");
  }
  if (worldData.modules.length === 0) {
    throw new Error("Ungueltiges WorldData-JSON: keine Module");
  }
  for (const mod of worldData.modules) {
    if (!mod.challenges || mod.challenges.length === 0) {
      throw new Error(`Modul "${mod.title}" hat keine Challenges`);
    }
  }
}

function buildFallbackWorldData(
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput,
  content: ContentArchitectOutput
): WorldData {
  const fallbackModules = Math.max(
    1,
    Math.min(4, Math.max(gameDesign.modules.length, content.modules.length, 1))
  );

  const modules: WorldData["modules"] = Array.from({ length: fallbackModules }, (_, i) => {
    const designModule = gameDesign.modules[i];
    const contentModule = content.modules.find((m) => m.index === i) ?? content.modules[i];
    const moduleTitle = normalizeText(
      contentModule?.title ?? designModule?.title,
      `Modul ${i + 1}`,
      70
    );

    const sourceChallenges = (contentModule?.challenges ?? []).slice(0, 3);
    const challenges = Array.from({ length: 3 }, (_, j) => {
      const source = sourceChallenges[j];
      const fallbackAnswer = normalizeText(
        contentModule?.title ?? gameDesign.modules[i]?.learningFocus,
        concept.worldName,
        40
      );
      const answer =
        typeof source?.correctAnswer === "number"
          ? String(source.correctAnswer)
          : normalizeText(source?.correctAnswer, fallbackAnswer, 40);

      return {
        type: "fill-blank" as const,
        questionBefore: normalizeText(
          source?.challengeText,
          `Nenne einen wichtigen Begriff aus ${moduleTitle}:`,
          140
        ),
        questionAfter: "",
        answer,
        xp: 10 + j,
        feedbackCorrect: normalizeText(source?.feedbackCorrect, "Richtig! Gute Arbeit.", 120),
        feedbackWrong: normalizeText(source?.feedbackWrong, "Noch nicht ganz. Versuch es erneut.", 120),
        hints: {
          level1: normalizeText(source?.hints?.level1, `Denk an das Thema ${moduleTitle}.`, 120),
          level2: normalizeText(source?.hints?.level2, "Suche den zentralen Fachbegriff.", 120),
          level3: normalizeText(source?.hints?.level3, `Ein passender Begriff ist ${answer}.`, 120),
        },
      };
    });

    return {
      id: i,
      title: moduleTitle,
      emoji: `M${i + 1}`,
      description: normalizeText(
        designModule?.gameplayType ?? contentModule?.summaryText,
        "Interaktive Uebungen",
        80
      ),
      challenges,
    };
  });

  return {
    config: {
      name: normalizeText(concept.worldName, "Neue Lernwelt", 60),
      tagline: normalizeText(concept.story?.mission, "Lerne spielerisch und Schritt fuer Schritt.", 60),
      emoji: "GEO",
      primaryColor: "#0ea5e9",
      bgGradient: "from-slate-900 via-cyan-900 to-slate-950",
      cardBg: "bg-slate-900/60 backdrop-blur-sm",
      accentClass: "bg-cyan-500 hover:bg-cyan-400 text-white",
    },
    modules,
  };
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
  console.log(`[CodeGenerator] AssetManifest Einträge: ${Object.keys(assetManifest).length}, hubBgUrl: ${hubBgUrl ? 'JA (' + hubBgUrl.slice(0, 60) + '...)' : 'NEIN (kein background-Asset mit URL)'}`);
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

  let worldData: WorldData;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await callAnthropic({
      model: "claude-sonnet-4-20250514",
      systemPrompt: CODE_GENERATOR_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 10000,
      temperature: 0.2,
      timeoutMs: 60000,
    });
    inputTokens = response.inputTokens;
    outputTokens = response.outputTokens;
    worldData = extractJson(response.text);
    validateWorldData(worldData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[CodeGenerator] Fallback aktiviert: ${msg}`);
    worldData = buildFallbackWorldData(concept, gameDesign, content);
  }

  // Hub-Background injizieren (fal.ai Asset, falls vorhanden)
  if (hubBgUrl && worldData.config) {
    worldData.config.hubBgUrl = hubBgUrl;
  }

  validateWorldData(worldData);

  // Skeleton-Assembler: JSON → React-Code
  const code = buildWorldCode(worldData);

  return {
    code,
    inputTokens,
    outputTokens,
  };
}
