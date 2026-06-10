import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type BuildingMode = "area" | "compose";

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

export type BuildingRoom = BuildingAreaRoom | BuildingComposeRoom;

export type BuildingEngineSpec = {
  engine: "building-construct";
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

export const BUILDING_SHAPES: BuildingShape[] = ["square", "rectangle", "triangle", "circle", "semicircle"];
