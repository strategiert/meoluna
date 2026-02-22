// ============================================================================
// STEP 6: CONTENT ARCHITECT - Spiel-Challenges, Lösungen, Feedback, Hints
// Model: Sonnet (schneller, timeout-sicherer) | Temp: 0.5 | Max: 8000
// ============================================================================

import { callAnthropicJson } from "../utils/anthropicClient";
import { CONTENT_ARCHITECT_SYSTEM_PROMPT } from "../prompts/contentArchitect";
import type {
  InterpreterOutput,
  CreativeDirectorOutput,
  GameDesignerOutput,
  QualityGateOutput,
  ContentArchitectOutput,
  ContentChallenge,
  ContentModule,
} from "../types";

function fallbackHint(term: string) {
  return {
    level1: `Denk an den Begriff ${term} im Modulkontext.`,
    level2: `Suche die Aussage, die ${term} korrekt mit dem Thema verbindet.`,
    level3: `Der richtige Kernbegriff ist ${term}.`,
  };
}

function buildFallbackChallenge(
  moduleIndex: number,
  challengeIndex: number,
  topic: string,
  term: string
): ContentChallenge {
  return {
    id: `m${moduleIndex}_c${challengeIndex}`,
    type: "multiple-choice",
    challengeText: `Welche Aussage passt am besten zum Begriff ${term}?`,
    visualDescription: `Ein einfaches Quiz-Panel zum Thema ${topic}`,
    gameData: {
      options: [
        `${term} gehört zentral zu ${topic}.`,
        `${term} ist völlig unabhängig von ${topic}.`,
        `${term} ist nur eine Fantasiebezeichnung.`,
        `${term} ist hier nicht relevant.`,
      ],
      correctIndex: 0,
    },
    correctAnswer: 0,
    tolerance: null,
    feedbackCorrect: `Richtig! ${term} ist ein Schlüsselbegriff für ${topic}.`,
    feedbackWrong: `Fast. Prüfe nochmal, welche Aussage fachlich korrekt ist.`,
    hints: fallbackHint(term),
    xpValue: 10 + challengeIndex,
  };
}

function buildFallbackContent(
  interpreted: InterpreterOutput,
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput
): ContentArchitectOutput {
  const terms = [
    ...interpreted.keyConcepts,
    ...interpreted.learningGoals,
    interpreted.topic,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const safeTerms = terms.length > 0 ? terms : ["Plattentektonik", "Erdplatten", "Vulkanismus"];

  const sourceModules = gameDesign.modules.length > 0
    ? gameDesign.modules.slice(0, 4)
    : [{ index: 0, title: "Grundlagen", learningFocus: interpreted.topic }];

  const modules: ContentModule[] = sourceModules.map((module, i) => {
    const termA = safeTerms[(i * 3) % safeTerms.length];
    const termB = safeTerms[(i * 3 + 1) % safeTerms.length];
    const termC = safeTerms[(i * 3 + 2) % safeTerms.length];

    return {
      index: i,
      title: module.title || `Modul ${i + 1}`,
      introText: `${concept.guide.name} begleitet dich durch ${module.title || `Modul ${i + 1}`}.`,
      challenges: [
        buildFallbackChallenge(i, 0, interpreted.topic, termA),
        buildFallbackChallenge(i, 1, interpreted.topic, termB),
        buildFallbackChallenge(i, 2, interpreted.topic, termC),
      ],
      summaryText: `Du hast zentrale Begriffe zu ${interpreted.topic} geuebt.`,
      moduleCompleteMessage: `Modul ${i + 1} geschafft!`,
    };
  });

  return {
    modules,
    finalChallenge: {
      title: "Abschluss-Check",
      introText: `Zum Schluss pruefst du die wichtigsten Begriffe zu ${interpreted.topic}.`,
      challenges: [
        buildFallbackChallenge(99, 0, interpreted.topic, safeTerms[0]),
        buildFallbackChallenge(99, 1, interpreted.topic, safeTerms[1 % safeTerms.length]),
        buildFallbackChallenge(99, 2, interpreted.topic, safeTerms[2 % safeTerms.length]),
      ],
      completionMessage: `Stark gemacht! Du hast die Kernideen von ${interpreted.topic} gesichert.`,
    },
    guideDialogues: {
      welcome: `Willkommen bei ${concept.worldName}!`,
      encouragement: [
        "Du bist auf dem richtigen Weg.",
        "Schritt fuer Schritt wird es klarer.",
        "Sehr gut, weiter so!",
      ],
      moduleTransitions: modules.map((m, idx) => `${m.title} abgeschlossen. Weiter zu Modul ${idx + 2}.`),
    },
  };
}

// Legacy fallback path intentionally retained for potential future opt-in mode.
// Strict mode does not call it, but keeping the symbol referenced avoids TS6133.
void buildFallbackContent;

export async function runContentArchitect(
  interpreted: InterpreterOutput,
  concept: CreativeDirectorOutput,
  gameDesign: GameDesignerOutput,
  qualityFeedback?: QualityGateOutput
) {
  let userMessage = `Erstelle die kompletten Spiel-Challenges für diese Minigame-Welt:

=== PÄDAGOGISCHE GRUNDLAGE ===
${JSON.stringify(interpreted, null, 2)}

=== KREATIVES KONZEPT ===
${JSON.stringify(concept, null, 2)}

=== MODUL-STRUKTUR & MINIGAME-MECHANIKEN ===
${JSON.stringify(gameDesign, null, 2)}

Erstelle jetzt ALLE Spiel-Challenges mit gameData, Lösungen, Feedback und Socratic Hints.
WICHTIG: Jede Challenge muss sich wie ein SPIEL anfühlen, nicht wie eine Schulaufgabe!
Achte auf absolute fachliche Korrektheit!

FORMATAUFLAGEN (KRITISCH):
- Liefere ausschließlich valides JSON.
- Keine Markdown-Codeblöcke, keine Kommentare, kein Fließtext außerhalb des JSON.
- Verwende nur doppelte Anführungszeichen für Strings.
- Halte Texte kompakt, damit die Antwort vollständig bleibt:
  introText max 240 Zeichen, challengeText max 180 Zeichen,
  feedback/hints jeweils max 140 Zeichen.
- FUER PERFORMANCE: Maximal 4 Module und genau 3 Challenges pro Modul.`;

  // If Quality Gate gave feedback (retry), include it
  if (qualityFeedback) {
    userMessage += `

=== QUALITY-GATE FEEDBACK (Fehler korrigieren!) ===
${JSON.stringify(qualityFeedback, null, 2)}

WICHTIG: Korrigiere ALLE criticalErrors aus dem Quality-Gate!`;
  }

  try {
    const { result, inputTokens, outputTokens } = await callAnthropicJson<ContentArchitectOutput>({
      model: "claude-sonnet-4-20250514",
      systemPrompt: CONTENT_ARCHITECT_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 8000,
      temperature: 0.2,
      timeoutMs: 90000,
    }, 0);

    // Validate
    if (!result.modules?.length) {
      throw new Error("Content Architect output missing modules");
    }
    if (!result.modules[0]?.challenges?.length) {
      throw new Error("Content Architect output missing challenges in modules");
    }

    return { result, inputTokens, outputTokens };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ContentArchitect] Strict mode: aborting instead of fallback: ${msg}`);
    throw error;
  }
}
