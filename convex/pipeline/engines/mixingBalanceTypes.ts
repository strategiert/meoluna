import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type MixingMode = "recipe" | "balance";

export type MixingIngredient = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export type MixingRecipeRoom = {
  roomId: string;
  objective: string;
  mode: "recipe";
  ingredients: MixingIngredient[];
  targetParts: Record<string, number>;
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
  leftWeights: number[];
  rightWeights: number[];
  chips: number[];
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

export function totalTargetParts(room: MixingRecipeRoom): number {
  return Object.values(room.targetParts).reduce((sum, value) => sum + value, 0);
}
