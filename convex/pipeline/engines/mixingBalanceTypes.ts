import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type MixingMode = "recipe" | "balance";

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

export type MixingRecipeRoom = {
  roomId: string;
  objective: string;
  mode: "recipe";
  ingredients: MixingIngredient[];
  rounds: MixingRecipeRound[];
  feedback: {
    correct: string;
    tooMuch: string;
    tooLittle: string;
    wrongMix: string;
  };
  explanationAfterSuccess: string;
};

export type MixingBalanceRoom = {
  roomId: string;
  objective: string;
  mode: "balance";
  chips: number[];
  rounds: MixingBalanceRound[];
  feedback: {
    correct: string;
    tooMuch: string;
    tooLittle: string;
    wrongMix: string;
  };
  explanationAfterSuccess: string;
};

export type MixingRoom = MixingRecipeRoom | MixingBalanceRoom;

export type MixingEngineSpec = {
  engine: "mixing-balance";
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

export function sumWeights(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function totalTargetParts(round: MixingRecipeRound): number {
  return Object.values(round.targetParts).reduce((sum, value) => sum + value, 0);
}
