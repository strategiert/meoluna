import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: "compare" kommt additiv zu recipe/balance dazu.
export type MixingMode = "recipe" | "balance" | "compare";

export type MixingIngredient = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

// Eine Runde = eine spielbare Aufgabe (Session-Format v2).
export type MixingRecipeRound = {
  objective?: string;
  targetParts: Record<string, number>;
};

export type MixingBalanceRound = {
  objective?: string;
  leftWeights: number[];
  rightWeights: number[];
};

// compare: schnelles Waagen-Urteil ohne Ausgleichen - das Kind vergleicht nur.
// Keine Zusatzbedingung an die Summen: alle drei Ausgaenge (links/rechts/
// gleich schwer) sind erlaubt, die Runde ist per Definition eindeutig.
export type MixingCompareRound = {
  objective?: string;
  leftWeights: number[];
  rightWeights: number[];
};

export type MixingFeedback = {
  correct: string;
  tooMuch: string;
  tooLittle: string;
  wrongMix: string;
  // Nur fuer compare-Raeume: Feedback bei falschem Urteil (links/rechts/gleich).
  wrongGuess?: string;
};

export type MixingRecipeRoom = {
  roomId: string;
  objective: string;
  mode: "recipe";
  ingredients: MixingIngredient[];
  rounds: MixingRecipeRound[];
  feedback: MixingFeedback;
  explanationAfterSuccess: string;
};

export type MixingBalanceRoom = {
  roomId: string;
  objective: string;
  mode: "balance";
  chips: number[];
  rounds: MixingBalanceRound[];
  feedback: MixingFeedback;
  explanationAfterSuccess: string;
};

export type MixingCompareRoom = {
  roomId: string;
  objective: string;
  mode: "compare";
  rounds: MixingCompareRound[];
  feedback: MixingFeedback;
  explanationAfterSuccess: string;
};

export type MixingRoom = MixingRecipeRoom | MixingBalanceRoom | MixingCompareRoom;

export type MixingEngineSpec = {
  engine: "mixing-balance";
  // Optional: deterministischer Seed fuer Kosmetik-Varianz (Theme, Deko).
  // Fehlt er, faellt der Renderer auf worldName zurueck.
  seed?: string;
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: MixingRoom[];
};

export function isRecipeRoom(room: MixingRoom): room is MixingRecipeRoom {
  return room.mode === "recipe";
}

export function isBalanceRoom(room: MixingRoom): room is MixingBalanceRoom {
  return room.mode === "balance";
}

export function isCompareRoom(room: MixingRoom): room is MixingCompareRoom {
  return room.mode === "compare";
}

export function sumWeights(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function totalTargetParts(round: MixingRecipeRound): number {
  return Object.values(round.targetParts).reduce((sum, value) => sum + value, 0);
}

export const COMPARE_WEIGHT_MIN = 1;
export const COMPARE_WEIGHT_MAX = 20;
export const COMPARE_STONES_MIN = 1;
export const COMPARE_STONES_MAX = 5;

export type CompareOutcome = "left" | "right" | "equal";

// Welche Seite ist schwerer (oder gleich)? Per Definition immer eindeutig,
// da sie direkt aus den festen Gewichten der Runde folgt.
export function compareOutcome(round: MixingCompareRound): CompareOutcome {
  const left = sumWeights(round.leftWeights);
  const right = sumWeights(round.rightWeights);
  if (left > right) return "left";
  if (right > left) return "right";
  return "equal";
}
