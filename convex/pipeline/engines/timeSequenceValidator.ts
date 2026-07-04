import type { TimeEngineSpec, TimeEvent, TimeRoom, TimeRound } from "./timeSequenceTypes";

export type TimeValidationResult = {
  passed: boolean;
  violations: string[];
};

// Session-Format v2: genug Aufgaben für eine 10-15-Minuten-Session.
const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const MIN_EVENTS = 3;
const MAX_EVENTS = 6;
const MIN_GAP_OPTIONS = 3;
const MAX_GAP_OPTIONS = 4;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function roomLabel(room: TimeRoom): string {
  return room.roomId || "unknown";
}

// Gemeinsame Regeln für eine Liste von Ereignis-Karten (events ODER options):
// id/label/emoji Pflicht, ids innerhalb der Liste eindeutig, Label max 40 Zeichen.
function validateEventList(list: unknown, label: string, violations: string[]): list is TimeEvent[] {
  if (!Array.isArray(list)) return false;
  const ids = new Set<string>();
  let ok = true;
  list.forEach((event, index) => {
    const e = (event || {}) as Partial<TimeEvent>;
    if (!hasText(e.id) || !hasText(e.label) || !hasText(e.emoji)) {
      violations.push(`E_ROOM_${label}[${index}]: id, label and emoji are required`);
      ok = false;
    }
    if (e.id && ids.has(e.id)) {
      violations.push(`E_ROOM_${label}: duplicate id ${e.id}`);
      ok = false;
    }
    if (e.id) ids.add(e.id);
    if (e.label && e.label.length > 40) {
      violations.push(`E_ROOM_${label}[${index}]: label too long for a card (max 40 chars)`);
    }
  });
  return ok;
}

// missing-event: gapIndex muss strikt innen liegen, options müssen genau eine
// zur Lücke passende Karte enthalten (gleiche id/label/emoji) und eindeutig sein.
function validateMissingEventRound(round: TimeRound, roundLabel: string, violations: string[]): void {
  const events = round.events;
  if (typeof round.gapIndex !== "number" || round.gapIndex <= 0 || round.gapIndex >= events.length - 1) {
    violations.push(`E_ROOM_${roundLabel}: missing-event mode requires gapIndex strictly between the first and last event (got ${round.gapIndex})`);
    return;
  }
  const expected = events[round.gapIndex];

  if (!Array.isArray(round.options) || round.options.length < MIN_GAP_OPTIONS || round.options.length > MAX_GAP_OPTIONS) {
    violations.push(`E_ROOM_${roundLabel}: missing-event mode needs ${MIN_GAP_OPTIONS}-${MAX_GAP_OPTIONS} options`);
    return;
  }
  if (!validateEventList(round.options, `${roundLabel}.options`, violations)) return;

  const matches = round.options.filter((option) => option.id === expected.id);
  if (matches.length !== 1) {
    violations.push(`E_ROOM_${roundLabel}: options must contain exactly one card matching the missing event "${expected.id}"`);
  } else if (matches[0].label !== expected.label || matches[0].emoji !== expected.emoji) {
    violations.push(`E_ROOM_${roundLabel}: the option matching the missing event must have the same label and emoji as events[gapIndex]`);
  }
}

export function validateTimeEngineSpec(spec: TimeEngineSpec): TimeValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "time-sequence") {
    violations.push("E_ENGINE: engine must be time-sequence");
  }
  if (spec.seed !== undefined && !hasText(spec.seed)) {
    violations.push("E_SEED: seed must be a non-empty string when present");
  }

  if (!hasText(spec.concept?.learningProblem)) {
    violations.push("E_CONCEPT: learningProblem is required");
  }
  if (!hasText(spec.concept?.embodiedMetaphor)) {
    violations.push("E_CONCEPT: embodiedMetaphor is required");
  }
  if (!hasText(spec.concept?.successInsight)) {
    violations.push("E_CONCEPT: successInsight is required");
  }

  if (!Array.isArray(spec.rooms) || spec.rooms.length === 0) {
    violations.push("E_ROOMS: at least one room is required");
    return { passed: false, violations };
  }
  if (spec.rooms.length < MIN_ROOMS) {
    violations.push(`E_ROOMS: at least ${MIN_ROOMS} rooms are required for a full session`);
  }
  if (spec.rooms.length > MAX_ROOMS) {
    violations.push(`E_ROOMS: at most ${MAX_ROOMS} rooms are allowed`);
  }

  let totalRounds = 0;

  for (const room of spec.rooms) {
    const label = roomLabel(room);

    if (!hasText(room.objective)) {
      violations.push(`E_ROOM_${label}: objective is required`);
    }
    if (room.mode !== "timeline" && room.mode !== "chain" && room.mode !== "missing-event") {
      violations.push(`E_ROOM_${label}: mode must be timeline, chain or missing-event`);
    }
    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) {
      violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    }
    totalRounds += room.rounds.length;

    room.rounds.forEach((round, roundIndex) => {
      const roundLabel = `${label}[${roundIndex}]`;
      if (!hasText(round.title)) {
        violations.push(`E_ROOM_${roundLabel}: title is required`);
      }
      if (!Array.isArray(round.events) || round.events.length < MIN_EVENTS || round.events.length > MAX_EVENTS) {
        violations.push(`E_ROOM_${roundLabel}: needs ${MIN_EVENTS}-${MAX_EVENTS} events`);
        return;
      }
      if (!validateEventList(round.events, `${roundLabel}.events`, violations)) return;

      if (room.mode === "missing-event") {
        validateMissingEventRound(round, roundLabel, violations);
      }
    });

    // Nur das vom Modus tatsaechlich gerenderte Feedback ist Pflicht.
    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (room.mode === "timeline" && !hasText(room.feedback?.wrongOrder)) violations.push(`E_ROOM_${label}: wrongOrder feedback missing`);
    if (room.mode === "chain" && !hasText(room.feedback?.wrongLink)) violations.push(`E_ROOM_${label}: wrongLink feedback missing`);
    if (room.mode === "missing-event" && !hasText(room.feedback?.wrongGap)) violations.push(`E_ROOM_${label}: wrongGap feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
