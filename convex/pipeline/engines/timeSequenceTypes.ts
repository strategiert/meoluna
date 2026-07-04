import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: "missing-event" kommt additiv dazu (Lücke in einer bekannten
// Ereigniskette, das Kind wählt aus 3-4 Optionskarten). Alte Specs
// (timeline/chain) bleiben unverändert gültig.
export type TimeMode = "timeline" | "chain" | "missing-event";

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
  // missing-event only: Index in `events`, der als Lücke gezeigt wird.
  // Muss strikt innen liegen (nicht erstes, nicht letztes Ereignis).
  gapIndex?: number;
  // missing-event only: 3-4 Auswahlkarten, genau eine davon passt zur Lücke.
  options?: TimeEvent[];
};

export type TimeRoom = {
  roomId: string;
  objective: string;
  // timeline: chronologische Reihenfolge (Lebenszyklen, Epochen, Abläufe).
  // chain: Ursache-Wirkungs-Kette, erstes Glied liegt vor, Frage "Was passiert dadurch?".
  // missing-event: die komplette Kette wird gezeigt, ein mittleres Ereignis fehlt.
  mode: TimeMode;
  rounds: TimeRound[];
  feedback: {
    correct: string;
    wrongOrder: string;
    wrongLink: string;
    // missing-event only (additiv, optional): falsche Auswahlkarte für die Lücke.
    wrongGap?: string;
    tryAgain: string;
  };
  explanationAfterSuccess: string;
};

export type TimeEngineSpec = {
  engine: "time-sequence";
  // Optional: deterministischer Seed für Kosmetik-Varianz (Theme, Deko).
  // Fehlt er, fällt der Renderer auf worldName zurück.
  seed?: string;
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: TimeRoom[];
};
