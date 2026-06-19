import type { ClockEngineSpec, ClockRoom, ReadRound, SetRound } from "./clockTypes";
import { isAllowedMinute, isValidHour, sameTime } from "./clockTypes";

export type ClockValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: ClockRoom): string {
  return room.roomId || "unknown";
}
function validTime(t: { hour: number; minute: number }): boolean {
  return isValidHour(t.hour) && isAllowedMinute(t.minute);
}

export function validateClockEngineSpec(spec: ClockEngineSpec): ClockValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "clock") violations.push("E_ENGINE: engine must be clock");
  if (!hasText(spec.concept?.learningProblem)) violations.push("E_CONCEPT: learningProblem is required");
  if (!hasText(spec.concept?.embodiedMetaphor)) violations.push("E_CONCEPT: embodiedMetaphor is required");
  if (!hasText(spec.concept?.successInsight)) violations.push("E_CONCEPT: successInsight is required");

  if (!Array.isArray(spec.rooms) || spec.rooms.length === 0) {
    violations.push("E_ROOMS: at least one room is required");
    return { passed: false, violations };
  }
  if (spec.rooms.length < MIN_ROOMS) violations.push(`E_ROOMS: at least ${MIN_ROOMS} rooms are required for a full session`);
  if (spec.rooms.length > MAX_ROOMS) violations.push(`E_ROOMS: at most ${MAX_ROOMS} rooms are allowed`);

  let totalRounds = 0;

  for (const room of spec.rooms) {
    const label = roomLabel(room);
    if (!hasText(room.objective)) violations.push(`E_ROOM_${label}: objective is required`);
    if (room.mode !== "read" && room.mode !== "set") violations.push(`E_ROOM_${label}: mode must be read or set`);
    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    totalRounds += room.rounds.length;

    room.rounds.forEach((r, i) => {
      const rl = `${label}[${i}]`;
      if (!validTime(r)) {
        violations.push(`E_ROOM_${rl}: time must be hour 1-12 and minute in {0,15,30,45} (got ${r.hour}:${r.minute})`);
        return;
      }
      if (room.mode === "read") {
        const read = r as ReadRound;
        if (!Array.isArray(read.options) || read.options.length < 2 || read.options.length > 4) {
          violations.push(`E_ROOM_${rl}: read round needs 2-4 options`);
          return;
        }
        if (read.options.some((o) => !validTime(o))) {
          violations.push(`E_ROOM_${rl}: all options must be valid kid times`);
        }
        const correct = read.options.filter((o) => sameTime(o, { hour: read.hour, minute: read.minute }));
        if (correct.length !== 1) {
          violations.push(`E_ROOM_${rl}: options must include the displayed time exactly once`);
        }
        const seen = new Set(read.options.map((o) => `${o.hour}:${o.minute}`));
        if (seen.size !== read.options.length) {
          violations.push(`E_ROOM_${rl}: options must be unique`);
        }
      } else {
        // set mode: nur die Zielzeit, bereits oben validiert
        const set = r as SetRound;
        if (typeof set.hour !== "number" || typeof set.minute !== "number") {
          violations.push(`E_ROOM_${rl}: set round needs target hour and minute`);
        }
      }
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongTime)) violations.push(`E_ROOM_${label}: wrongTime feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
