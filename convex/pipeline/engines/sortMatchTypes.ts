import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: odd-one-out (Gruppen-Ausreisser finden) und two-axis (2x2-Raster)
// kommen additiv zu baskets/pairs dazu. Alte Specs bleiben gueltig.
export type SortMode = "baskets" | "pairs" | "odd-one-out" | "two-axis";

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
  wrongOdd?: string;      // odd-one-out: falsche Karte angetippt
  wrongQuadrant?: string; // two-axis: falsches Feld angetippt
};

// odd-one-out: mehrere Karten teilen eine Eigenschaft, genau eine nicht.
// Das Kind tippt die Ausreisser-Karte an.
export type OddCard = {
  id: string;
  label: string;
  emoji: string;
};

export type OddOneOutRound = {
  objective?: string;
  cards: OddCard[];  // 4-6 Karten
  oddIndex: number;  // Index der Karte, die nicht zur Gruppe passt
  reason: string;    // Begruendungssatz, warum sie nicht passt
};

// two-axis: 2x2-Raster aus zwei binaeren Achsen (z.B. klein/gross x Wasser/Land).
// Jede Karte hat eine feste Position auf beiden Achsen -> genau ein Quadrant.
export type AxisLabels = {
  negative: string; // linke/untere Seite der Achse
  positive: string; // rechte/obere Seite der Achse
};

export type TwoAxisCard = {
  id: string;
  label: string;
  emoji: string;
  x: "negative" | "positive";
  y: "negative" | "positive";
};

export type TwoAxisRound = {
  objective?: string;
  xAxis: AxisLabels;
  yAxis: AxisLabels;
  cards: TwoAxisCard[]; // 4-8 Karten, jede eindeutig einem Quadranten zugeordnet
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

export type SortOddOneOutRoom = {
  roomId: string;
  objective: string;
  mode: "odd-one-out";
  rounds: OddOneOutRound[];
  feedback: SortFeedback;
  explanationAfterSuccess: string;
};

export type SortTwoAxisRoom = {
  roomId: string;
  objective: string;
  mode: "two-axis";
  rounds: TwoAxisRound[];
  feedback: SortFeedback;
  explanationAfterSuccess: string;
};

export type SortRoom = SortBasketsRoom | SortPairsRoom | SortOddOneOutRoom | SortTwoAxisRoom;

export type SortEngineSpec = {
  engine: "sort-match";
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
  rooms: SortRoom[];
};

export function isBasketsRoom(room: SortRoom): room is SortBasketsRoom {
  return room.mode === "baskets";
}

export function isPairsRoom(room: SortRoom): room is SortPairsRoom {
  return room.mode === "pairs";
}

export function isOddOneOutRoom(room: SortRoom): room is SortOddOneOutRoom {
  return room.mode === "odd-one-out";
}

export function isTwoAxisRoom(room: SortRoom): room is SortTwoAxisRoom {
  return room.mode === "two-axis";
}
