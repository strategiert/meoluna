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

const VALID_MODES = ["letters", "syllables", "scramble", "listen-and-build"] as const;
// scramble/listen-and-build sind reine Buchstaben-Bau-Modi (keine Silben):
// jeder Chip genau ein deutscher Buchstabe, das Zielwort 2-10 Zeichen lang.
const GERMAN_LETTER_WORD_RE = /^[a-zA-ZÄÖÜäöüß]+$/;
const GERMAN_LETTER_RE = /^[a-zA-ZÄÖÜäöüß]$/;
const LETTER_ONLY_MODES = new Set(["scramble", "listen-and-build"]);

function validateLetterOnlyRules(mode: string, r: WordRoom["rounds"][number], rl: string, violations: string[]): void {
  if (!LETTER_ONLY_MODES.has(mode)) return;
  const word = r.word || "";
  if (word.length < 2 || word.length > 10) {
    violations.push(`E_ROOM_${rl}: word must be 2-10 characters for mode "${mode}" (got ${word.length})`);
  }
  if (!GERMAN_LETTER_WORD_RE.test(word)) {
    violations.push(`E_ROOM_${rl}: word must contain only German letters (a-z, Umlaute, ss) for mode "${mode}"`);
  }
  if (Array.isArray(r.chips) && r.chips.some((c) => typeof c !== "string" || !GERMAN_LETTER_RE.test(c))) {
    violations.push(`E_ROOM_${rl}: chips must be single German letters for mode "${mode}"`);
  }
  if (r.distractors && r.distractors.some((d) => typeof d !== "string" || !GERMAN_LETTER_RE.test(d))) {
    violations.push(`E_ROOM_${rl}: distractors must be single German letters for mode "${mode}"`);
  }
}

export function validateWordEngineSpec(spec: WordEngineSpec): WordValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "word-builder") {
    violations.push("E_ENGINE: engine must be word-builder");
  }
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

    room.rounds.forEach((round, roundIndex) => {
      const rl = `${label}[${roundIndex}]`;
      if (!hasText(round.word)) {
        violations.push(`E_ROOM_${rl}: word is required`);
        return;
      }
      // "listen-and-build" zeigt bewusst KEIN Wortbild - emoji ist dort optional.
      if (room.mode !== "listen-and-build" && !hasText(round.emoji)) {
        violations.push(`E_ROOM_${rl}: emoji hint is required`);
      }
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
      validateLetterOnlyRules(room.mode, round, rl, violations);
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
