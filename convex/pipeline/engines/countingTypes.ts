import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: ten-frame (Zehnerfeld) und make-equal (Mengen angleichen) kommen
// additiv zu count/make/compare dazu. Alte Specs bleiben gueltig.
export type CountMode = "count" | "make" | "compare" | "ten-frame" | "make-equal";

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

// ten-frame: Zehnerfeld (2 Reihen a 5 Felder). Kind tippt leere Felder an, bis
// genau target Felder gefuellt sind (Tipp auf gefuelltes Feld leert es wieder).
export type TenFrameRound = {
  objective?: string;
  target: number; // 1-10
};

// make-equal: links eine feste Menge, rechts eine Start-Menge. Kind gleicht
// rechts per Hinzufuegen/Wegnehmen an, bis beide Seiten gleich viele sind.
export type MakeEqualRound = {
  objective?: string;
  element: string; // ein Emoji, auf beiden Seiten gleich
  leftCount: number;  // 1-10, feste linke Menge
  rightStart: number; // 0-10, Start-Menge rechts, != leftCount
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

export type CountTenFrameRoom = {
  roomId: string;
  objective: string;
  mode: "ten-frame";
  rounds: TenFrameRound[];
  feedback: CountFeedback;
  explanationAfterSuccess: string;
};

export type CountMakeEqualRoom = {
  roomId: string;
  objective: string;
  mode: "make-equal";
  rounds: MakeEqualRound[];
  feedback: CountFeedback;
  explanationAfterSuccess: string;
};

export type CountRoom = CountCountRoom | CountMakeRoom | CountCompareRoom | CountTenFrameRoom | CountMakeEqualRoom;

export type CountEngineSpec = {
  engine: "counting";
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
export function isTenFrameRoom(room: CountRoom): room is CountTenFrameRoom {
  return room.mode === "ten-frame";
}
export function isMakeEqualRoom(room: CountRoom): room is CountMakeEqualRoom {
  return room.mode === "make-equal";
}

export const COUNT_MAX = 20;

// Erwartete richtige Antwort eines compare-Rounds: "left" | "right" | "equal".
export function compareAnswer(round: CompareRound): "left" | "right" | "equal" {
  if (round.ask === "equal") return "equal";
  if (round.ask === "more") return round.leftCount > round.rightCount ? "left" : "right";
  return round.leftCount < round.rightCount ? "left" : "right";
}
