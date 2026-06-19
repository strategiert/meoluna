import type { MapEngineSpec, MapRoom, LocateRound, PathRound } from "./mapTypes";
import { inBounds, resolvePath } from "./mapTypes";

export type MapValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const MIN_GRID = 3;
const MAX_GRID = 6;
const VALID_DIRS = ["north", "south", "east", "west"];

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: MapRoom): string {
  return room.roomId || "unknown";
}

export function validateMapEngineSpec(spec: MapEngineSpec): MapValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "map") violations.push("E_ENGINE: engine must be map");
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
    if (room.mode !== "locate" && room.mode !== "path") violations.push(`E_ROOM_${label}: mode must be locate or path`);

    const rows = room.rows;
    const cols = room.cols;
    if (typeof rows !== "number" || rows < MIN_GRID || rows > MAX_GRID || typeof cols !== "number" || cols < MIN_GRID || cols > MAX_GRID) {
      violations.push(`E_ROOM_${label}: rows and cols must each be ${MIN_GRID}-${MAX_GRID}`);
      continue;
    }

    if (!Array.isArray(room.landmarks) || room.landmarks.length === 0) {
      violations.push(`E_ROOM_${label}: at least one landmark is required`);
      continue;
    }
    const seenCells = new Set<string>();
    room.landmarks.forEach((lm, i) => {
      if (!hasText(lm.emoji)) violations.push(`E_ROOM_${label}.lm[${i}]: emoji required`);
      if (!hasText(lm.label)) violations.push(`E_ROOM_${label}.lm[${i}]: label required`);
      if (!inBounds({ row: lm.row, col: lm.col }, rows, cols)) {
        violations.push(`E_ROOM_${label}.lm[${i}]: landmark out of grid bounds`);
      } else {
        const key = `${lm.row},${lm.col}`;
        if (seenCells.has(key)) violations.push(`E_ROOM_${label}.lm[${i}]: two landmarks on the same cell`);
        seenCells.add(key);
      }
    });

    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    totalRounds += room.rounds.length;

    room.rounds.forEach((r, i) => {
      const rl = `${label}[${i}]`;
      if (room.mode === "locate") {
        const loc = r as LocateRound;
        if (typeof loc.targetIndex !== "number" || loc.targetIndex < 0 || loc.targetIndex >= room.landmarks.length) {
          violations.push(`E_ROOM_${rl}: targetIndex out of range`);
        }
      } else {
        const path = r as PathRound;
        if (typeof path.startIndex !== "number" || path.startIndex < 0 || path.startIndex >= room.landmarks.length) {
          violations.push(`E_ROOM_${rl}: startIndex out of range`);
          return;
        }
        if (!Array.isArray(path.steps) || path.steps.length === 0) {
          violations.push(`E_ROOM_${rl}: path needs at least one step`);
          return;
        }
        if (path.steps.some((s) => !VALID_DIRS.includes(s.dir) || typeof s.count !== "number" || !Number.isInteger(s.count) || s.count < 1)) {
          violations.push(`E_ROOM_${rl}: each step needs a valid direction and a positive integer count`);
          return;
        }
        const start = room.landmarks[path.startIndex];
        const end = resolvePath({ row: start.row, col: start.col }, path.steps, rows, cols);
        if (end === null) {
          violations.push(`E_ROOM_${rl}: path leaves the grid - not solvable`);
        } else if (end.row === start.row && end.col === start.col) {
          violations.push(`E_ROOM_${rl}: path ends on the start cell - too trivial`);
        }
      }
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongCell)) violations.push(`E_ROOM_${label}: wrongCell feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
