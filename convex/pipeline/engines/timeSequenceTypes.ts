import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type TimeMode = "timeline" | "chain";

export type TimeEvent = {
  id: string;
  label: string;
  emoji: string;
};

// Eine Runde = eine Kette/Zeitleiste. events stehen in der KORREKTEN Reihenfolge.
export type TimeRound = {
  objective?: string;
  title: string;
  events: TimeEvent[];
};

export type TimeRoom = {
  roomId: string;
  objective: string;
  // timeline: chronologische Reihenfolge (Lebenszyklen, Epochen, Abläufe).
  // chain: Ursache-Wirkungs-Kette, erstes Glied liegt vor, Frage "Was passiert dadurch?".
  mode: TimeMode;
  rounds: TimeRound[];
  feedback: {
    correct: string;
    wrongOrder: string;
    wrongLink: string;
    tryAgain: string;
  };
  explanationAfterSuccess: string;
};

export type TimeEngineSpec = {
  engine: "time-sequence";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: TimeRoom[];
};
