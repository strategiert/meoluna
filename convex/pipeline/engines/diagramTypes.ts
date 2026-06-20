import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type DiagramMode = "label" | "find";

// Ein Marker sitzt auf einer relativen Position (0-100 %) der Schaubild-Buehne
// und traegt den korrekten Begriff.
export type DiagramMarker = {
  label: string;
  x: number; // 0-100, links->rechts
  y: number; // 0-100, oben->unten
};

// label: eine markierte Stelle ist hervorgehoben, das Kind waehlt den Begriff.
export type LabelRound = {
  objective?: string;
  markerIndex: number;
  options: string[]; // 2-4 Begriffe, enthaelt markers[markerIndex].label
};

// find: ein Begriff ist genannt, das Kind tippt die richtige Stelle.
export type FindRound = {
  objective?: string;
  targetIndex: number;
};

export type DiagramRound = LabelRound | FindRound;

export type DiagramFeedback = {
  correct: string;
  wrongSpot: string;
  tryAgain: string;
};

export type DiagramRoom = {
  roomId: string;
  objective: string;
  mode: DiagramMode;
  backdrop: string;   // grosses Emoji/Symbol fuer das Ganze (z.B. "🌱", "🔌", "🗺️")
  caption?: string;   // kurze Bildunterschrift
  markers: DiagramMarker[];
  rounds: DiagramRound[];
  feedback: DiagramFeedback;
  explanationAfterSuccess: string;
};

export type DiagramEngineSpec = {
  engine: "diagram";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: DiagramRoom[];
};

export function isLabelRoom(room: DiagramRoom): boolean {
  return room.mode === "label";
}
export function isFindRoom(room: DiagramRoom): boolean {
  return room.mode === "find";
}

export function inStage(m: { x: number; y: number }): boolean {
  return m.x >= 0 && m.x <= 100 && m.y >= 0 && m.y <= 100;
}

// Mindestabstand zwischen zwei Markern (in % der Buehne), damit sie auf dem
// Schaubild nicht ueberlappen und eindeutig antippbar bleiben.
export function tooClose(a: DiagramMarker, b: DiagramMarker, minDist = 12): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy) < minDist;
}
