import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: "duration" kommt additiv dazu. "set" bleibt bestehen, bekommt aber ein
// optionales minuteStep-Feld (5/15/30) fuer feinere Minuten-Schritte; ohne
// minuteStep verhaelt sich "set" exakt wie bisher (Viertelstunden-Rasterung).
export type ClockMode = "read" | "set" | "duration";

// Kindgerechte Minuten: volle Stunde, Viertel, Halb, Dreiviertel.
export const ALLOWED_MINUTES = [0, 15, 30, 45];

// Erlaubte Schrittweiten fuer das feinere Stellen der Minuten (set-Modus).
export const ALLOWED_MINUTE_STEPS = [5, 15, 30];

export type ClockTime = { hour: number; minute: number };

// read: die Uhr zeigt eine Zeit, das Kind waehlt die richtige aus options.
export type ReadRound = {
  objective?: string;
  hour: number;          // 1-12
  minute: number;        // aus ALLOWED_MINUTES
  options: ClockTime[];  // 2-4 Zeiten, enthaelt die korrekte
};

// set: das Kind stellt die Zeiger auf die Zielzeit.
// minuteStep optional: 5, 15 oder 30 - minute muss durch minuteStep teilbar
// sein. Fehlt minuteStep, gilt wie bisher: minute aus ALLOWED_MINUTES.
export type SetRound = {
  objective?: string;
  hour: number;
  minute: number;
  minuteStep?: number;
};

// duration: Startzeit + Dauer, das Kind waehlt die berechnete Endzeit aus
// options. hour-Felder bleiben im 1-12-Zifferblatt-Format (kein 24h-Wrap);
// die reale Tageszeit steckt im Objective-Text (z.B. "15:00" -> startHour 3).
export type DurationRound = {
  objective?: string;
  startHour: number;       // 1-12
  startMinute: number;     // aus ALLOWED_MINUTES
  durationMinutes: number; // 5-180
  options: ClockTime[];    // 3-4 Zeiten, enthaelt die berechnete Endzeit
};

export type ClockRound = ReadRound | SetRound | DurationRound;

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
  rooms: ClockRoom[];
};

export function isReadRoom(room: ClockRoom): boolean {
  return room.mode === "read";
}
export function isSetRoom(room: ClockRoom): boolean {
  return room.mode === "set";
}
export function isDurationRoom(room: ClockRoom): boolean {
  return room.mode === "duration";
}

export function isAllowedMinute(minute: number): boolean {
  return ALLOWED_MINUTES.includes(minute);
}

export function isAllowedMinuteStep(step: number): boolean {
  return ALLOWED_MINUTE_STEPS.includes(step);
}

export function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 1 && hour <= 12;
}

export function sameTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

// Endzeit einer Dauer-Aufgabe auf dem 12h-Zifferblatt (kein AM/PM-Tracking,
// wie der Rest der Engine). startHour/-Minute + durationMinutes -> Endzeit.
export function computeDurationEnd(startHour: number, startMinute: number, durationMinutes: number): ClockTime {
  const half = 12 * 60;
  const base = (startHour % 12) * 60 + startMinute + durationMinutes;
  const norm = ((base % half) + half) % half;
  let hour = Math.floor(norm / 60);
  if (hour === 0) hour = 12;
  const minute = norm % 60;
  return { hour, minute };
}
