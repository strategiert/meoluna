import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type DetectiveMode = "evidence" | "suspects";

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

export type DetectiveFeedback = {
  correct: string;
  wrongEvidence: string;
  wrongSuspect: string;
  tryAgain: string;
};

export type DetectiveRoom = DetectiveEvidenceRoom | DetectiveSuspectsRoom;

export type DetectiveEngineSpec = {
  engine: "detective-evidence";
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
