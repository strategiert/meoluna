import type { CountEngineSpec, CountRoom, MakeEqualRound, TenFrameRound } from "./countingTypes";
import { COUNT_MAX, isCompareRoom, isCountRoom, isMakeEqualRoom, isMakeRoom, isTenFrameRoom } from "./countingTypes";

export type CountValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
// Ab so vielen Raeumen muss die Welt mindestens 2 verschiedene Modi nutzen
// (strukturelle Varianz erzwingen, nicht nur Content-Varianz). Beide
// bestehenden Fixtures erfuellen das bereits (count/make/compare gemischt).
const MODE_DIVERSITY_MIN_ROOMS = 3;
const TEN_FRAME_MAX = 10;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function isCountInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= COUNT_MAX;
}
function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
function roomLabel(room: CountRoom): string {
  return room.roomId || "unknown";
}

function validateTenFrameRound(r: TenFrameRound, rl: string, violations: string[]): void {
  if (!isIntInRange(r.target, 1, TEN_FRAME_MAX)) {
    violations.push(`E_ROOM_${rl}: target must be an integer 1-${TEN_FRAME_MAX}`);
  }
}

function validateMakeEqualRound(r: MakeEqualRound, rl: string, violations: string[]): void {
  if (!hasText(r.element)) {
    violations.push(`E_ROOM_${rl}: element is required`);
  }
  if (!isIntInRange(r.leftCount, 1, TEN_FRAME_MAX)) {
    violations.push(`E_ROOM_${rl}: leftCount must be an integer 1-${TEN_FRAME_MAX}`);
    return;
  }
  if (!isIntInRange(r.rightStart, 0, TEN_FRAME_MAX)) {
    violations.push(`E_ROOM_${rl}: rightStart must be an integer 0-${TEN_FRAME_MAX}`);
    return;
  }
  // rightStart darf nicht schon die Loesung sein, sonst nichts zu tun.
  if (r.rightStart === r.leftCount) {
    violations.push(`E_ROOM_${rl}: rightStart must differ from leftCount (nothing to equalize)`);
  }
}

export function validateCountEngineSpec(spec: CountEngineSpec): CountValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "counting") violations.push("E_ENGINE: engine must be counting");
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
    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    totalRounds += room.rounds.length;

    if (isCountRoom(room)) {
      room.rounds.forEach((r, i) => {
        if (!hasText(r.emoji)) violations.push(`E_ROOM_${label}[${i}]: emoji is required`);
        if (!isCountInt(r.count)) violations.push(`E_ROOM_${label}[${i}]: count must be an integer 1-${COUNT_MAX}`);
      });
    } else if (isMakeRoom(room)) {
      room.rounds.forEach((r, i) => {
        if (!hasText(r.emoji)) violations.push(`E_ROOM_${label}[${i}]: emoji is required`);
        if (!isCountInt(r.target)) violations.push(`E_ROOM_${label}[${i}]: target must be an integer 1-${COUNT_MAX}`);
      });
    } else if (isCompareRoom(room)) {
      room.rounds.forEach((r, i) => {
        const rl = `${label}[${i}]`;
        if (!hasText(r.leftEmoji) || !hasText(r.rightEmoji)) violations.push(`E_ROOM_${rl}: leftEmoji and rightEmoji are required`);
        if (!isCountInt(r.leftCount) || !isCountInt(r.rightCount)) {
          violations.push(`E_ROOM_${rl}: leftCount and rightCount must be integers 1-${COUNT_MAX}`);
          return;
        }
        if (r.ask !== "more" && r.ask !== "less" && r.ask !== "equal") {
          violations.push(`E_ROOM_${rl}: ask must be more, less or equal`);
          return;
        }
        // Eindeutigkeit: more/less brauchen ungleiche Mengen, equal gleiche.
        if (r.ask === "equal" && r.leftCount !== r.rightCount) {
          violations.push(`E_ROOM_${rl}: ask=equal but counts differ (${r.leftCount} vs ${r.rightCount})`);
        }
        if (r.ask !== "equal" && r.leftCount === r.rightCount) {
          violations.push(`E_ROOM_${rl}: ask=${r.ask} but counts are equal (no unique answer)`);
        }
      });
    } else if (isTenFrameRoom(room)) {
      room.rounds.forEach((r, i) => validateTenFrameRound(r, `${label}[${i}]`, violations));
    } else if (isMakeEqualRoom(room)) {
      room.rounds.forEach((r, i) => validateMakeEqualRound(r, `${label}[${i}]`, violations));
    } else {
      violations.push(`E_ROOM_${label}: mode must be count, make, compare, ten-frame or make-equal`);
    }

    // Nur das vom Modus genutzte Feedback ist Pflicht. ten-frame und
    // make-equal sind wie make aufgebaut (zu viel/zu wenig bis zum Ziel).
    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    const usesTooManyFew = isCountRoom(room) || isMakeRoom(room) || isTenFrameRoom(room) || isMakeEqualRoom(room);
    if (usesTooManyFew && !hasText(room.feedback?.tooMany)) violations.push(`E_ROOM_${label}: tooMany feedback missing`);
    if (usesTooManyFew && !hasText(room.feedback?.tooFew)) violations.push(`E_ROOM_${label}: tooFew feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  // Strukturelle Varianz: ab MODE_DIVERSITY_MIN_ROOMS Raeumen mindestens
  // 2 verschiedene Modi. Beide bestehenden Fixtures erfuellen das bereits.
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
