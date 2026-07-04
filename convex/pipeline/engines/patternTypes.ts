import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: build (naechste Periode selbst bauen) und grow (wachsende Muster)
// kommen additiv zu continue/fill dazu. Alte Specs bleiben gueltig.
export type PatternMode = "continue" | "fill" | "build" | "grow";

// Eine Runde. Welche Felder Pflicht sind, haengt vom Raum-Modus ab:
// - continue/fill: sequence (periodisch) + gapIndex + options
// - build:         sequence (periodisch) + options (Bau-Pool); keine Luecke,
//                  das Kind baut die NAECHSTE Periode komplett selbst.
// - grow:          growElement + growSizes (wachsende Reihe); das Kind legt
//                  die naechste Gruppe mit der richtigen Anzahl.
export type PatternRound = {
  objective?: string;
  sequence?: string[];   // Emojis, 4-8 Elemente, periodisch (continue/fill/build)
  gapIndex?: number;     // Position der Luecke (continue/fill)
  options?: string[];    // Auswahl-/Bau-Emojis (continue/fill: 2-4, build: 2-6)
  growElement?: string;  // grow: das wachsende Element
  growSizes?: number[];  // grow: Gruppengroessen, streng monoton, konstante Differenz
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
