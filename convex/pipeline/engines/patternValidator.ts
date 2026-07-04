import type { PatternEngineSpec, PatternRoom, PatternRound } from "./patternTypes";
import { smallestPeriod } from "./patternTypes";

export type PatternValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const VALID_MODES = ["continue", "fill", "build", "grow"] as const;
// Ab so vielen Raeumen muss die Welt mindestens 2 verschiedene Modi nutzen
// (strukturelle Varianz erzwingen, nicht nur Content-Varianz).
const MODE_DIVERSITY_MIN_ROOMS = 3;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: PatternRoom): string {
  return room.roomId || "unknown";
}

// Gemeinsame Regeln fuer periodische Sequenzen (continue/fill/build).
function validateSequence(r: PatternRound, rl: string, violations: string[]): number | null {
  if (!Array.isArray(r.sequence) || r.sequence.length < 4 || r.sequence.length > 8) {
    violations.push(`E_ROOM_${rl}: sequence needs 4-8 elements`);
    return null;
  }
  if (r.sequence.some((s) => !hasText(s))) {
    violations.push(`E_ROOM_${rl}: sequence elements must be non-empty`);
    return null;
  }
  const period = smallestPeriod(r.sequence);
  if (period === null) {
    violations.push(`E_ROOM_${rl}: sequence is not a periodic pattern (not uniquely solvable)`);
    return null;
  }
  if (period < 2 && new Set(r.sequence).size > 1) {
    violations.push(`E_ROOM_${rl}: pattern period too trivial`);
    return null;
  }
  return period;
}

function validateChoiceRound(r: PatternRound, rl: string, mode: "continue" | "fill", violations: string[]): void {
  const period = validateSequence(r, rl, violations);
  if (period === null || !r.sequence) return;
  const seq = r.sequence;

  if (typeof r.gapIndex !== "number" || r.gapIndex < 0 || r.gapIndex >= seq.length) {
    violations.push(`E_ROOM_${rl}: gapIndex out of range`);
    return;
  }
  const last = seq.length - 1;
  if (mode === "continue" && r.gapIndex !== last) {
    violations.push(`E_ROOM_${rl}: continue mode requires gapIndex at the end (got ${r.gapIndex}, last ${last})`);
  }
  if (mode === "fill" && (r.gapIndex === 0 || r.gapIndex === last)) {
    violations.push(`E_ROOM_${rl}: fill mode requires gapIndex in the middle (got ${r.gapIndex})`);
  }
  const answer = seq[r.gapIndex];
  if (!Array.isArray(r.options) || r.options.length < 2 || r.options.length > 4) {
    violations.push(`E_ROOM_${rl}: needs 2-4 options`);
    return;
  }
  if (!r.options.includes(answer)) {
    violations.push(`E_ROOM_${rl}: options must include the correct element "${answer}"`);
  }
  if (new Set(r.options).size !== r.options.length) {
    violations.push(`E_ROOM_${rl}: options must be unique`);
  }
  const inventory = new Set(seq);
  if (r.options.some((o) => !inventory.has(o))) {
    violations.push(`E_ROOM_${rl}: options must come from the pattern's own elements`);
  }
}

function validateBuildRound(r: PatternRound, rl: string, violations: string[]): void {
  const period = validateSequence(r, rl, violations);
  if (period === null || !r.sequence) return;
  if (period > 4) {
    violations.push(`E_ROOM_${rl}: build mode needs period 2-4 (got ${period}) so the child builds at most 4 tiles`);
  }
  if (!Array.isArray(r.options) || r.options.length < 2 || r.options.length > 6) {
    violations.push(`E_ROOM_${rl}: build mode needs 2-6 options`);
    return;
  }
  if (new Set(r.options).size !== r.options.length) {
    violations.push(`E_ROOM_${rl}: options must be unique`);
  }
  const inventory = new Set(r.sequence);
  if (r.options.some((o) => !inventory.has(o))) {
    violations.push(`E_ROOM_${rl}: options must come from the pattern's own elements`);
  }
  // Jedes Element der ersten Periode muss im Bau-Pool liegen, sonst unloesbar.
  const periodElements = new Set(r.sequence.slice(0, period));
  for (const el of periodElements) {
    if (!r.options.includes(el)) {
      violations.push(`E_ROOM_${rl}: build options must include every element of the period (missing "${el}")`);
    }
  }
}

function validateGrowRound(r: PatternRound, rl: string, violations: string[]): void {
  if (!hasText(r.growElement)) {
    violations.push(`E_ROOM_${rl}: grow mode requires growElement`);
    return;
  }
  if (!Array.isArray(r.growSizes) || r.growSizes.length < 3 || r.growSizes.length > 6) {
    violations.push(`E_ROOM_${rl}: grow mode needs 3-6 growSizes`);
    return;
  }
  if (r.growSizes.some((n) => typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 9)) {
    violations.push(`E_ROOM_${rl}: growSizes must be integers 1-9`);
    return;
  }
  const diff = r.growSizes[1] - r.growSizes[0];
  if (diff < 1) {
    violations.push(`E_ROOM_${rl}: growSizes must strictly increase`);
    return;
  }
  for (let i = 1; i < r.growSizes.length; i += 1) {
    if (r.growSizes[i] - r.growSizes[i - 1] !== diff) {
      violations.push(`E_ROOM_${rl}: growSizes must increase by a constant step (not uniquely solvable otherwise)`);
      return;
    }
  }
}

export function validatePatternEngineSpec(spec: PatternEngineSpec): PatternValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "pattern") violations.push("E_ENGINE: engine must be pattern");
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
      if (room.mode === "continue" || room.mode === "fill") validateChoiceRound(r, rl, room.mode, violations);
      else if (room.mode === "build") validateBuildRound(r, rl, violations);
      else if (room.mode === "grow") validateGrowRound(r, rl, violations);
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongPiece)) violations.push(`E_ROOM_${label}: wrongPiece feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  // Strukturelle Varianz: ab MODE_DIVERSITY_MIN_ROOMS Raeumen mindestens
  // 2 verschiedene Modi. Bestehende Specs erfuellen das bereits (der Prompt
  // verlangt seit v1 continue UND fill).
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
