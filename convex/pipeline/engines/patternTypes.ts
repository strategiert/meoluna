import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type PatternMode = "continue" | "fill";

// Eine Runde = ein periodisches Muster mit genau einer Luecke.
// sequence ist das VOLLSTAENDIGE korrekte Muster; gapIndex markiert die Luecke.
// options sind die Auswahlkarten (enthalten das richtige Element).
export type PatternRound = {
  objective?: string;
  sequence: string[];   // Emojis, 4-8 Elemente, periodisch
  gapIndex: number;     // Position der Luecke
  options: string[];    // 2-4 Auswahl-Emojis, enthaelt sequence[gapIndex]
};

export type PatternFeedback = {
  correct: string;
  wrongPiece: string;
  tryAgain: string;
};

export type PatternRoom = {
  roomId: string;
  objective: string;
  mode: PatternMode;
  rounds: PatternRound[];
  feedback: PatternFeedback;
  explanationAfterSuccess: string;
};

export type PatternEngineSpec = {
  engine: "pattern";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: PatternRoom[];
};

// Kleinste Periode p (1..floor(len/2)), fuer die die Reihe streng p-periodisch
// ist. null, wenn kein periodisches Muster -> nicht eindeutig fortsetzbar.
export function smallestPeriod(sequence: string[]): number | null {
  const n = sequence.length;
  for (let p = 1; p <= Math.floor(n / 2); p += 1) {
    let ok = true;
    for (let i = p; i < n; i += 1) {
      if (sequence[i] !== sequence[i - p]) { ok = false; break; }
    }
    if (ok) return p;
  }
  return null;
}
