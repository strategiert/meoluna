import type { WordEngineSpec, WordRoom } from "./wordBuilderTypes";
import { joinChips, normalizeWord } from "./wordBuilderTypes";

export type WordValidationResult = {
  passed: boolean;
  violations: string[];
};

// Session-Format v2: genug Aufgaben fuer eine 10-15-Minuten-Session.
const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function roomLabel(room: WordRoom): string {
  return room.roomId || "unknown";
}

export function validateWordEngineSpec(spec: WordEngineSpec): WordValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "word-builder") {
    violations.push("E_ENGINE: engine must be word-builder");
  }

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
    if (room.mode !== "letters" && room.mode !== "syllables") {
      violations.push(`E_ROOM_${label}: mode must be letters or syllables`);
    }
    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    totalRounds += room.rounds.length;

    room.rounds.forEach((round, roundIndex) => {
      const rl = `${label}[${roundIndex}]`;
      if (!hasText(round.word)) {
        violations.push(`E_ROOM_${rl}: word is required`);
        return;
      }
      if (!hasText(round.emoji)) violations.push(`E_ROOM_${rl}: emoji hint is required`);
      if (!Array.isArray(round.chips) || round.chips.length < 2 || round.chips.length > 9) {
        violations.push(`E_ROOM_${rl}: needs 2-9 chips`);
        return;
      }
      if (round.chips.some((c) => !hasText(c) || c.length > 6)) {
        violations.push(`E_ROOM_${rl}: each chip must be non-empty and at most 6 chars`);
      }
      // Kernpruefung: die Bausteine ergeben in Reihenfolge genau das Zielwort.
      if (normalizeWord(joinChips(round.chips)) !== normalizeWord(round.word)) {
        violations.push(`E_ROOM_${rl}: chips do not join to the target word "${round.word}" (got "${joinChips(round.chips)}")`);
      }
      if (round.distractors) {
        if (!Array.isArray(round.distractors) || round.distractors.length > 4) {
          violations.push(`E_ROOM_${rl}: at most 4 distractors`);
        } else if (round.distractors.some((d) => !hasText(d) || d.length > 6)) {
          violations.push(`E_ROOM_${rl}: each distractor must be non-empty and at most 6 chars`);
        }
      }
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongChip)) violations.push(`E_ROOM_${label}: wrongChip feedback missing`);
    if (!hasText(room.feedback?.wrongOrder)) violations.push(`E_ROOM_${label}: wrongOrder feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
