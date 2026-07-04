import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: "build" kommt additiv zu read/find dazu. Alte Specs bleiben gueltig.
export type ChartMode = "read" | "find" | "build";
export type ChartType = "bar" | "picto";
export type Extremum = "most" | "least";

export type Category = {
  label: string;
  value: number;
  emoji?: string;
};

// read: eine Kategorie ist hervorgehoben, das Kind liest ihren Wert ab.
export type ReadRound = {
  objective?: string;
  categoryIndex: number;
  options: number[]; // 2-4 Zahlen, enthaelt den korrekten Wert
};

// find: das Kind tippt die Kategorie mit dem groessten bzw. kleinsten Wert.
export type FindRound = {
  objective?: string;
  ask: Extremum;
};

// build: das Kind zeichnet die Daten selbst ein - pro Kategorie den Balken
// bzw. das Piktogramm per +/- auf die Ziel-Hoehe/-Anzahl bringen.
// targets hat genau so viele Eintraege wie room.categories, gleiche Reihenfolge.
export type BuildRound = {
  objective?: string;
  targets: number[];
};

export type ChartRound = ReadRound | FindRound | BuildRound;

export type ChartFeedback = {
  correct: string;
  wrongValue: string;
  tryAgain: string;
};

export type ChartRoom = {
  roomId: string;
  objective: string;
  mode: ChartMode;
  chartType: ChartType;
  categories: Category[];
  rounds: ChartRound[];
  feedback: ChartFeedback;
  explanationAfterSuccess: string;
};

export type ChartEngineSpec = {
  engine: "chart";
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
  rooms: ChartRoom[];
};

export function isReadRoom(room: ChartRoom): boolean {
  return room.mode === "read";
}
export function isFindRoom(room: ChartRoom): boolean {
  return room.mode === "find";
}

// Index der Kategorie mit dem eindeutigen Maximum/Minimum, sonst -1 (Gleichstand).
export function uniqueExtremumIndex(categories: Category[], ask: Extremum): number {
  const values = categories.map((c) => c.value);
  const target = ask === "most" ? Math.max(...values) : Math.min(...values);
  const hits = values.filter((v) => v === target);
  if (hits.length !== 1) return -1;
  return values.indexOf(target);
}
