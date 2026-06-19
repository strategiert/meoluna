import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

export type ClockMode = "read" | "set";

// Kindgerechte Minuten: volle Stunde, Viertel, Halb, Dreiviertel.
export const ALLOWED_MINUTES = [0, 15, 30, 45];

export type ClockTime = { hour: number; minute: number };

// read: die Uhr zeigt eine Zeit, das Kind waehlt die richtige aus options.
export type ReadRound = {
  objective?: string;
  hour: number;          // 1-12
  minute: number;        // aus ALLOWED_MINUTES
  options: ClockTime[];  // 2-4 Zeiten, enthaelt die korrekte
};

// set: das Kind stellt die Zeiger auf die Zielzeit.
export type SetRound = {
  objective?: string;
  hour: number;
  minute: number;
};

export type ClockRound = ReadRound | SetRound;

export type ClockFeedback = {
  correct: string;
  wrongTime: string;
  tryAgain: string;
};

export type ClockRoom = {
  roomId: string;
  objective: string;
  mode: ClockMode;
  rounds: ClockRound[];
  feedback: ClockFeedback;
  explanationAfterSuccess: string;
};

export type ClockEngineSpec = {
  engine: "clock";
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: ClockRoom[];
};

export function isReadRoom(room: ClockRoom): boolean {
  return room.mode === "read";
}
export function isSetRoom(room: ClockRoom): boolean {
  return room.mode === "set";
}

export function isAllowedMinute(minute: number): boolean {
  return ALLOWED_MINUTES.includes(minute);
}

export function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 1 && hour <= 12;
}

export function sameTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}
