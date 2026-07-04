import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: "contradiction" (widerspruechliche Zeugenaussage finden) kommt
// additiv zu evidence/suspects dazu. Alte Specs bleiben gueltig.
export type DetectiveMode = "evidence" | "suspects" | "contradiction";

// evidence: Belegstellen finden — Fall-Text mit tappbaren Sätzen,
// jede Runde eine Frage, deren Antwort genau ein Satz belegt.
export type EvidenceRound = {
  objective?: string;
  question: string;
  evidenceIndex: number;
};

export type DetectiveEvidenceRoom = {
  roomId: string;
  objective: string;
  mode: "evidence";
  caseText: {
    title: string;
    sentences: string[];
  };
  rounds: EvidenceRound[];
  feedback: DetectiveFeedback;
  explanationAfterSuccess: string;
};

// suspects: Indizien kombinieren — pro Indiz scheidet genau ein
// Verdächtiger aus, am Ende bleibt der Täter übrig.
export type DetectiveSuspect = {
  id: string;
  name: string;
  emoji: string;
  traits: Record<string, string>;
};

export type DetectiveClue = {
  text: string;
  attribute: string;
  value: string;
};

export type SuspectsRound = {
  objective?: string;
  intro: string;
  suspects: DetectiveSuspect[];
  clues: DetectiveClue[];
  culpritId: string;
};

export type DetectiveSuspectsRoom = {
  roomId: string;
  objective: string;
  mode: "suspects";
  rounds: SuspectsRound[];
  feedback: DetectiveFeedback;
  explanationAfterSuccess: string;
};

// contradiction: 1-2 Beweiskarten werden gezeigt, dazu 3-4 Zeugenaussagen.
// Genau eine Aussage widerspricht den gezeigten Beweisen; das Kind tippt sie
// an. Alles ist explizit in der Spec (kein Weltwissen noetig): evidence[] +
// statements[] + contradictionIndex + Begruendungssatz.
export type ContradictionRound = {
  objective?: string;
  evidence: string[];    // 1-2 Beweis-Saetze, aus denen sich der Widerspruch ableiten laesst
  statements: string[];  // 3-4 Zeugenaussagen
  contradictionIndex: number; // welche Aussage widerspricht den Beweisen
  reason: string;        // Begruendung, wird nach dem Treffer angezeigt/vorgelesen
};

export type DetectiveContradictionRoom = {
  roomId: string;
  objective: string;
  mode: "contradiction";
  rounds: ContradictionRound[];
  feedback: DetectiveFeedback;
  explanationAfterSuccess: string;
};

export type DetectiveFeedback = {
  correct: string;
  wrongEvidence: string;
  wrongSuspect: string;
  tryAgain: string;
  wrongStatement?: string; // contradiction: angetippte Aussage widerspricht den Beweisen nicht
};

export type DetectiveRoom = DetectiveEvidenceRoom | DetectiveSuspectsRoom | DetectiveContradictionRoom;

export type DetectiveEngineSpec = {
  engine: "detective-evidence";
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
  rooms: DetectiveRoom[];
};

export function isEvidenceRoom(room: DetectiveRoom): room is DetectiveEvidenceRoom {
  return room.mode === "evidence";
}

export function isSuspectsRoom(room: DetectiveRoom): room is DetectiveSuspectsRoom {
  return room.mode === "suspects";
}

export function isContradictionRoom(room: DetectiveRoom): room is DetectiveContradictionRoom {
  return room.mode === "contradiction";
}
