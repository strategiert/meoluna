import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type CountMode = "count" | "make" | "compare";

// count: N Objekte erscheinen, Kind tippt die richtige Anzahl.
export type CountRound = {
  objective?: string;
  emoji: string;
  count: number;
};

// make: Kind legt genau target Objekte (hinzufuegen/wegnehmen).
export type MakeRound = {
  objective?: string;
  emoji: string;
  target: number;
};

// compare: zwei Gruppen, Kind tippt die Gruppe mit mehr/weniger (oder "gleich").
export type CompareRound = {
  objective?: string;
  leftEmoji: string;
  leftCount: number;
  rightEmoji: string;
  rightCount: number;
  ask: "more" | "less" | "equal"; // wonach gefragt wird
};

export type CountFeedback = {
  correct: string;
  tooMany: string;
  tooFew: string;
  tryAgain: string;
};

export type CountCountRoom = {
  roomId: string;
  objective: string;
  mode: "count";
  rounds: CountRound[];
  feedback: CountFeedback;
  explanationAfterSuccess: string;
};

export type CountMakeRoom = {
  roomId: string;
  objective: string;
  mode: "make";
  rounds: MakeRound[];
  feedback: CountFeedback;
  explanationAfterSuccess: string;
};

export type CountCompareRoom = {
  roomId: string;
  objective: string;
  mode: "compare";
  rounds: CompareRound[];
  feedback: CountFeedback;
  explanationAfterSuccess: string;
};

export type CountRoom = CountCountRoom | CountMakeRoom | CountCompareRoom;

export type CountEngineSpec = {
  engine: "counting";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: CountRoom[];
};

export function isCountRoom(room: CountRoom): room is CountCountRoom {
  return room.mode === "count";
}
export function isMakeRoom(room: CountRoom): room is CountMakeRoom {
  return room.mode === "make";
}
export function isCompareRoom(room: CountRoom): room is CountCompareRoom {
  return room.mode === "compare";
}

export const COUNT_MAX = 20;

// Erwartete richtige Antwort eines compare-Rounds: "left" | "right" | "equal".
export function compareAnswer(round: CompareRound): "left" | "right" | "equal" {
  if (round.ask === "equal") return "equal";
  if (round.ask === "more") return round.leftCount > round.rightCount ? "left" : "right";
  return round.leftCount < round.rightCount ? "left" : "right";
}
