import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type BuildingMode = "area" | "compose" | "find-error";

// Ziel eines Raster-Bau-Auftrags: exakte Maße, Ziel-Fläche (mehrere Lösungen
// möglich -> Faktoren-Verständnis) oder Ziel-Umfang (Zaun).
export type BuildingGoal =
  | { type: "exact"; width: number; height: number }
  | { type: "area"; area: number }
  | { type: "perimeter"; perimeter: number };

export type BuildingAreaRound = {
  objective?: string;
  goal: BuildingGoal;
};

export type BuildingShape = "square" | "rectangle" | "triangle" | "circle" | "semicircle";

// Ein Bauteil der Ziel-Figur, Koordinaten in einer 0-100-ViewBox.
export type BuildingSlot = {
  shape: BuildingShape;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

export type BuildingComposeRound = {
  objective?: string;
  figureName: string;
  slots: BuildingSlot[];
};

// find-error: die fertig gebaute Figur wird gezeigt, slots[errorIndex] weicht
// vom Bauplan ab (Farbe ODER Position, nie Form/Größe). correctSlot ist die
// Bauplan-Variante des abweichenden Steins - die Abweichung steht explizit im
// Spec, nichts wird zur Laufzeit erraten.
export type BuildingFindErrorRound = {
  objective?: string;
  figureName: string;
  slots: BuildingSlot[];
  errorIndex: number;
  correctSlot: BuildingSlot;
};

export type BuildingFeedback = {
  correct: string;
  tooSmall: string;
  tooBig: string;
  wrongShape: string;
};

export type BuildingAreaRoom = {
  roomId: string;
  objective: string;
  mode: "area";
  grid: { cols: number; rows: number };
  tileEmoji?: string;
  rounds: BuildingAreaRound[];
  feedback: BuildingFeedback;
  explanationAfterSuccess: string;
};

export type BuildingComposeRoom = {
  roomId: string;
  objective: string;
  mode: "compose";
  rounds: BuildingComposeRound[];
  feedback: BuildingFeedback;
  explanationAfterSuccess: string;
};

export type BuildingFindErrorRoom = {
  roomId: string;
  objective: string;
  mode: "find-error";
  rounds: BuildingFindErrorRound[];
  feedback: BuildingFeedback;
  explanationAfterSuccess: string;
};

export type BuildingRoom = BuildingAreaRoom | BuildingComposeRoom | BuildingFindErrorRoom;

export type BuildingEngineSpec = {
  engine: "building-construct";
  // Optional: deterministischer Seed fuer Kosmetik-Varianz (Theme, Deko,
  // Bau-Pool-Reihenfolge). Fehlt er, faellt der Renderer auf worldName zurueck.
  seed?: string;
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: BuildingRoom[];
};

export function isAreaRoom(room: BuildingRoom): room is BuildingAreaRoom {
  return room.mode === "area";
}

export function isComposeRoom(room: BuildingRoom): room is BuildingComposeRoom {
  return room.mode === "compose";
}

export function isFindErrorRoom(room: BuildingRoom): room is BuildingFindErrorRoom {
  return room.mode === "find-error";
}

export const BUILDING_SHAPES: BuildingShape[] = ["square", "rectangle", "triangle", "circle", "semicircle"];
