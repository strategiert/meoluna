import type { TimeEngineSpec, TimeRoom } from "./timeSequenceTypes";

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

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function roomLabel(room: TimeRoom): string {
  return room.roomId || "unknown";
}

export function validateTimeEngineSpec(spec: TimeEngineSpec): TimeValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "time-sequence") {
    violations.push("E_ENGINE: engine must be time-sequence");
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
    if (room.mode !== "timeline" && room.mode !== "chain") {
      violations.push(`E_ROOM_${label}: mode must be timeline or chain`);
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
      const ids = new Set<string>();
      round.events.forEach((event, eventIndex) => {
        if (!hasText(event.id) || !hasText(event.label) || !hasText(event.emoji)) {
          violations.push(`E_ROOM_${roundLabel}.events[${eventIndex}]: id, label and emoji are required`);
        }
        if (ids.has(event.id)) {
          violations.push(`E_ROOM_${roundLabel}: duplicate event id ${event.id}`);
        }
        ids.add(event.id);
        if (event.label && event.label.length > 40) {
          violations.push(`E_ROOM_${roundLabel}.events[${eventIndex}]: label too long for a card (max 40 chars)`);
        }
      });
    });

    // Nur das vom Modus tatsaechlich gerenderte Feedback ist Pflicht.
    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (room.mode === "timeline" && !hasText(room.feedback?.wrongOrder)) violations.push(`E_ROOM_${label}: wrongOrder feedback missing`);
    if (room.mode === "chain" && !hasText(room.feedback?.wrongLink)) violations.push(`E_ROOM_${label}: wrongLink feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
