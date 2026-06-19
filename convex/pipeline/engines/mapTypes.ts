import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type MapMode = "locate" | "path";
export type Direction = "north" | "south" | "east" | "west";

// Gitter-Koordinate: row 0 = oben (Norden), col 0 = links (Westen).
export type Cell = { row: number; col: number };

export type Landmark = {
  emoji: string;
  label: string;
  row: number;
  col: number;
};

// locate: das Kind tippt die Zelle eines gesuchten Wahrzeichens.
export type LocateRound = {
  objective?: string;
  targetIndex: number; // Index in landmarks
};

// path: das Kind folgt Himmelsrichtungs-Schritten ab einem Start-Wahrzeichen.
export type PathStep = { dir: Direction; count: number };
export type PathRound = {
  objective?: string;
  startIndex: number; // Index in landmarks
  steps: PathStep[];
};

export type MapRound = LocateRound | PathRound;

export type MapFeedback = {
  correct: string;
  wrongCell: string;
  tryAgain: string;
};

export type MapRoom = {
  roomId: string;
  objective: string;
  mode: MapMode;
  rows: number;
  cols: number;
  landmarks: Landmark[];
  rounds: MapRound[];
  feedback: MapFeedback;
  explanationAfterSuccess: string;
};

export type MapEngineSpec = {
  engine: "map";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: MapRoom[];
};

export function isLocateRoom(room: MapRoom): boolean {
  return room.mode === "locate";
}
export function isPathRoom(room: MapRoom): boolean {
  return room.mode === "path";
}

export function inBounds(cell: Cell, rows: number, cols: number): boolean {
  return cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols;
}

// Folgt den Schritten ab start. Liefert null, wenn der Weg das Gitter verlaesst.
export function resolvePath(start: Cell, steps: PathStep[], rows: number, cols: number): Cell | null {
  let { row, col } = start;
  for (const step of steps) {
    for (let i = 0; i < step.count; i += 1) {
      if (step.dir === "north") row -= 1;
      else if (step.dir === "south") row += 1;
      else if (step.dir === "east") col += 1;
      else if (step.dir === "west") col -= 1;
      if (!inBounds({ row, col }, rows, cols)) return null;
    }
  }
  return { row, col };
}
