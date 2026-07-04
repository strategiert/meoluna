import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: "scramble" (Buchstaben durcheinander, in Reihenfolge tippen) und
// "listen-and-build" (kein Wortbild, nur Vorlesen + Hoerverstehen) kommen
// additiv zu letters/syllables dazu. Alte Specs bleiben gueltig.
export type WordMode = "letters" | "syllables" | "scramble" | "listen-and-build";

// Eine Runde = ein Wort, das aus Bausteinen (Buchstaben bzw. Silben) in der
// richtigen Reihenfolge gebaut wird. chips stehen in KORREKTER Reihenfolge,
// der Renderer mischt chips + distractors.
export type WordRound = {
  objective?: string;
  word: string;          // Zielwort (z.B. "Hund" oder "Sommer")
  // Bild-Hinweis aufs Wort. Bei "listen-and-build" bewusst optional/ungenutzt,
  // da dort kein Wortbild gezeigt wird (nur Vorlesen).
  emoji?: string;
  chips: string[];       // korrekte Bausteine in Reihenfolge (z.B. ["H","u","n","d"] / ["Som","mer"])
  distractors?: string[]; // optionale falsche Bausteine zum Erschweren
};

export type WordFeedback = {
  correct: string;
  wrongChip: string;     // falscher Baustein an dieser Stelle
  wrongOrder: string;    // richtige Bausteine, falsche Reihenfolge
  tryAgain: string;
};

export type WordRoom = {
  roomId: string;
  objective: string;
  mode: WordMode;
  rounds: WordRound[];
  feedback: WordFeedback;
  explanationAfterSuccess: string;
};

export type WordEngineSpec = {
  engine: "word-builder";
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
  rooms: WordRoom[];
};

// Verbindet die Bausteine zum Wort. Bei Silben werden optionale Trennzeichen
// ignoriert, damit chips.join() mit dem Zielwort vergleichbar ist.
export function joinChips(chips: string[]): string {
  return chips.join("");
}

export function normalizeWord(word: string): string {
  return word.replace(/[\s-]/g, "").toLowerCase();
}
