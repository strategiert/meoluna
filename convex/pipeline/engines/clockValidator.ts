import type { ClockEngineSpec, ClockRoom, ReadRound, SetRound, DurationRound } from "./clockTypes";
import { isAllowedMinute, isAllowedMinuteStep, isValidHour, sameTime, computeDurationEnd } from "./clockTypes";

export type ClockValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const VALID_MODES = ["read", "set", "duration"] as const;
// Ab so vielen Raeumen muss die Welt mindestens 2 verschiedene Modi nutzen
// (strukturelle Varianz erzwingen, nicht nur Content-Varianz).
// Geprueft gegen beide Bestands-Fixtures (uhren-turm, tagesreise): beide
// haben 3 Raeume mit read+set gemischt, erfuellen die Regel bereits.
const MODE_DIVERSITY_MIN_ROOMS = 3;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: ClockRoom): string {
  return room.roomId || "unknown";
}
function validTime(t: { hour: number; minute: number }): boolean {
  return isValidHour(t.hour) && isAllowedMinute(t.minute);
}

function validateReadRound(r: ReadRound, rl: string, violations: string[]): void {
  if (!validTime(r)) {
    violations.push(`E_ROOM_${rl}: time must be hour 1-12 and minute in {0,15,30,45} (got ${r.hour}:${r.minute})`);
    return;
  }
  if (!Array.isArray(r.options) || r.options.length < 2 || r.options.length > 4) {
    violations.push(`E_ROOM_${rl}: read round needs 2-4 options`);
    return;
  }
  if (r.options.some((o) => !validTime(o))) {
    violations.push(`E_ROOM_${rl}: all options must be valid kid times`);
  }
  const correct = r.options.filter((o) => sameTime(o, { hour: r.hour, minute: r.minute }));
  if (correct.length !== 1) {
    violations.push(`E_ROOM_${rl}: options must include the displayed time exactly once`);
  }
  const seen = new Set(r.options.map((o) => `${o.hour}:${o.minute}`));
  if (seen.size !== r.options.length) {
    violations.push(`E_ROOM_${rl}: options must be unique`);
  }
}

// set: ohne minuteStep exakt wie bisher (minute aus ALLOWED_MINUTES).
// Mit minuteStep (5/15/30): minute 0-59, muss durch minuteStep teilbar sein.
function validateSetRound(r: SetRound, rl: string, violations: string[]): void {
  if (!isValidHour(r.hour)) {
    violations.push(`E_ROOM_${rl}: hour must be 1-12 (got ${r.hour})`);
    return;
  }
  if (r.minuteStep !== undefined) {
    if (!isAllowedMinuteStep(r.minuteStep)) {
      violations.push(`E_ROOM_${rl}: minuteStep must be 5, 15 or 30 (got ${r.minuteStep})`);
      return;
    }
    if (typeof r.minute !== "number" || !Number.isInteger(r.minute) || r.minute < 0 || r.minute > 59) {
      violations.push(`E_ROOM_${rl}: minute must be an integer 0-59 (got ${r.minute})`);
      return;
    }
    if (r.minute % r.minuteStep !== 0) {
      violations.push(`E_ROOM_${rl}: minute ${r.minute} must be divisible by minuteStep ${r.minuteStep}`);
    }
  } else if (!isAllowedMinute(r.minute)) {
    violations.push(`E_ROOM_${rl}: minute must be in {0,15,30,45} when minuteStep is not set (got ${r.minute})`);
  }
}

function validateDurationRound(r: DurationRound, rl: string, violations: string[]): void {
  if (!isValidHour(r.startHour)) {
    violations.push(`E_ROOM_${rl}: startHour must be 1-12 (got ${r.startHour})`);
    return;
  }
  if (!isAllowedMinute(r.startMinute)) {
    violations.push(`E_ROOM_${rl}: startMinute must be in {0,15,30,45} (got ${r.startMinute})`);
    return;
  }
  if (typeof r.durationMinutes !== "number" || !Number.isInteger(r.durationMinutes) || r.durationMinutes < 5 || r.durationMinutes > 180) {
    violations.push(`E_ROOM_${rl}: durationMinutes must be an integer 5-180 (got ${r.durationMinutes})`);
    return;
  }
  if (!Array.isArray(r.options) || r.options.length < 3 || r.options.length > 4) {
    violations.push(`E_ROOM_${rl}: duration round needs 3-4 options`);
    return;
  }
  if (r.options.some((o) => !isValidHour(o.hour) || typeof o.minute !== "number" || !Number.isInteger(o.minute) || o.minute < 0 || o.minute > 59)) {
    violations.push(`E_ROOM_${rl}: options must be valid times (hour 1-12, minute 0-59)`);
    return;
  }
  const seen = new Set(r.options.map((o) => `${o.hour}:${o.minute}`));
  if (seen.size !== r.options.length) {
    violations.push(`E_ROOM_${rl}: options must be unique`);
  }
  const target = computeDurationEnd(r.startHour, r.startMinute, r.durationMinutes);
  const correct = r.options.filter((o) => sameTime(o, target));
  if (correct.length !== 1) {
    violations.push(`E_ROOM_${rl}: options must include the computed end time (${target.hour}:${target.minute}) exactly once`);
  }
}

export function validateClockEngineSpec(spec: ClockEngineSpec): ClockValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "clock") violations.push("E_ENGINE: engine must be clock");
  if (spec.seed !== undefined && !hasText(spec.seed)) violations.push("E_SEED: seed must be a non-empty string when present");
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
    if (!VALID_MODES.includes(room.mode as (typeof VALID_MODES)[number])) {
      violations.push(`E_ROOM_${label}: mode must be one of ${VALID_MODES.join("/")}`);
    }
    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    totalRounds += room.rounds.length;

    room.rounds.forEach((r, i) => {
      const rl = `${label}[${i}]`;
      if (room.mode === "read") validateReadRound(r as ReadRound, rl, violations);
      else if (room.mode === "set") validateSetRound(r as SetRound, rl, violations);
      else if (room.mode === "duration") validateDurationRound(r as DurationRound, rl, violations);
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongTime)) violations.push(`E_ROOM_${label}: wrongTime feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  // Strukturelle Varianz: ab MODE_DIVERSITY_MIN_ROOMS Raeumen mindestens
  // 2 verschiedene Modi. Beide Bestands-Fixtures erfuellen das bereits.
  if (spec.rooms.length >= MODE_DIVERSITY_MIN_ROOMS) {
    const distinctModes = new Set(spec.rooms.map((room) => room.mode));
    if (distinctModes.size < 2) {
      violations.push(`E_STRUCTURE: worlds with ${MODE_DIVERSITY_MIN_ROOMS}+ rooms need at least 2 distinct modes (got only "${spec.rooms[0]?.mode}")`);
    }
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
