export type MovementInputMode = "material" | "curriculum" | "teacherStudio";
export type MovementFocus = "understand" | "practice" | "prepare" | "discover";
export type MovementConfidence = "low" | "medium" | "high";

export type MovementDimension = "1d-horizontal" | "1d-vertical" | "2d-grid";
export type MovementInteraction =
  | "choose-direction"
  | "build-route"
  | "drag-marker"
  | "step-sequencer";

export type Position = number | { x: number; y: number };

export type LearningBrief = {
  inputMode: MovementInputMode;
  subject?: string;
  gradeLevel?: string;
  rawTopic: string;
  extractedTasks?: string[];
  learningGoals: string[];
  likelyMisconceptions: string[];
  focus: MovementFocus;
  confidence: MovementConfidence;
};

export type WorldSpec = {
  worldName: string;
  coreMetaphor: string;
  setting: string;
  visualStyle: {
    palette: string[];
    mood: string;
    shapes: string;
    effects: string;
  };
  guide: {
    name: string;
    role: string;
    personality: string;
  };
  rooms: Array<{
    id: string;
    title: string;
    purpose: string;
    scene: string;
    reward: string;
  }>;
};

export type MovementMove = {
  value: Position;
  label: string;
  meaning: string;
};

// Eine Runde = eine spielbare Aufgabe. Räume enthalten 1-4 Runden
// mit gleicher Mechanik und steigender Schwierigkeit (Session-Format v2).
export type MovementRound = {
  startPosition: Position;
  moves: MovementMove[];
  targetPosition: Position;
};

export type MovementRoom = {
  roomId: string;
  objective: string;
  rounds: MovementRound[];
  interaction: MovementInteraction;
  feedback: {
    correct: string;
    wrongDirection: string;
    wrongDistance: string;
    signConfusion: string;
  };
  explanationAfterSuccess: string;
};

export type MovementEngineSpec = {
  engine: "movement-space";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  coordinateSystem: {
    dimensions: MovementDimension;
    min: number;
    max: number;
    unitLabel: string;
    negativeDirectionLabel?: string;
    positiveDirectionLabel?: string;
  };
  rooms: MovementRoom[];
};

export function is2DPosition(position: Position): position is { x: number; y: number } {
  return typeof position === "object" && position !== null && "x" in position && "y" in position;
}
