import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type SortMode = "baskets" | "pairs";

// baskets: Karten erscheinen nacheinander, das Kind tippt den richtigen Korb.
export type SortCategory = {
  id: string;
  label: string;
  emoji: string;
};

export type SortCard = {
  id: string;
  label: string;
  emoji: string;
  categoryId: string;
};

export type BasketsRound = {
  objective?: string;
  categories: SortCategory[];
  cards: SortCard[];
};

// pairs: linke Karte antippen, dann den Partner rechts (Wort↔Bild, DE↔EN, Einzahl↔Mehrzahl).
export type PairSide = {
  label: string;
  emoji?: string;
};

export type SortPair = {
  id: string;
  left: PairSide;
  right: PairSide;
};

export type PairsRound = {
  objective?: string;
  pairs: SortPair[];
};

export type SortFeedback = {
  correct: string;
  wrongBasket: string;
  wrongPair: string;
  tryAgain: string;
};

export type SortBasketsRoom = {
  roomId: string;
  objective: string;
  mode: "baskets";
  rounds: BasketsRound[];
  feedback: SortFeedback;
  explanationAfterSuccess: string;
};

export type SortPairsRoom = {
  roomId: string;
  objective: string;
  mode: "pairs";
  rounds: PairsRound[];
  feedback: SortFeedback;
  explanationAfterSuccess: string;
};

export type SortRoom = SortBasketsRoom | SortPairsRoom;

export type SortEngineSpec = {
  engine: "sort-match";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: SortRoom[];
};

export function isBasketsRoom(room: SortRoom): room is SortBasketsRoom {
  return room.mode === "baskets";
}

export function isPairsRoom(room: SortRoom): room is SortPairsRoom {
  return room.mode === "pairs";
}
