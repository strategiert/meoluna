import type { MixingEngineSpec, MixingRoom } from "./mixingBalanceTypes";
import { isBalanceRoom, isRecipeRoom, sumWeights, totalTargetParts } from "./mixingBalanceTypes";

export type MixingValidationResult = {
  passed: boolean;
  violations: string[];
};

// Session-Format v2: genug Aufgaben für eine 10-15-Minuten-Session.
const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

// Kann diff aus den Chip-Werten (beliebig oft verwendbar) exakt gelegt werden?
function diffReachable(diff: number, chips: number[]): boolean {
  if (diff <= 0) return false;
  const reachable = new Array<boolean>(diff + 1).fill(false);
  reachable[0] = true;
  for (let value = 1; value <= diff; value += 1) {
    for (const chip of chips) {
      if (chip <= value && reachable[value - chip]) {
        reachable[value] = true;
        break;
      }
    }
  }
  return reachable[diff];
}

function roomLabel(room: MixingRoom): string {
  return room.roomId || "unknown";
}

function validateFeedback(room: MixingRoom, violations: string[]): void {
  const label = roomLabel(room);
  if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
  if (!hasText(room.feedback?.tooMuch)) violations.push(`E_ROOM_${label}: tooMuch feedback missing`);
  if (!hasText(room.feedback?.tooLittle)) violations.push(`E_ROOM_${label}: tooLittle feedback missing`);
  if (!hasText(room.feedback?.wrongMix)) violations.push(`E_ROOM_${label}: wrongMix feedback missing`);
  if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
}

export function validateMixingEngineSpec(spec: MixingEngineSpec): MixingValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "mixing-balance") {
    violations.push("E_ENGINE: engine must be mixing-balance");
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
    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) {
      violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    }
    totalRounds += room.rounds.length;

    if (isRecipeRoom(room)) {
      const ids = new Set<string>();
      if (!Array.isArray(room.ingredients) || room.ingredients.length < 2 || room.ingredients.length > 3) {
        violations.push(`E_ROOM_${label}: recipe needs 2-3 ingredients`);
      } else {
        for (const ingredient of room.ingredients) {
          if (!hasText(ingredient.id) || !hasText(ingredient.label) || !hasText(ingredient.emoji) || !hasText(ingredient.color)) {
            violations.push(`E_ROOM_${label}: ingredient needs id, label, emoji, color`);
          }
          if (ids.has(ingredient.id)) {
            violations.push(`E_ROOM_${label}: duplicate ingredient id ${ingredient.id}`);
          }
          ids.add(ingredient.id);
        }
      }

      room.rounds.forEach((round, roundIndex) => {
        const roundLabel = `${label}[${roundIndex}]`;
        const targetEntries = Object.entries(round.targetParts ?? {});
        if (targetEntries.length === 0) {
          violations.push(`E_ROOM_${roundLabel}: targetParts is required`);
          return;
        }
        for (const [id, parts] of targetEntries) {
          if (!ids.has(id)) {
            violations.push(`E_ROOM_${roundLabel}: targetParts references unknown ingredient ${id}`);
          }
          if (!isPositiveInt(parts) || parts > 9) {
            violations.push(`E_ROOM_${roundLabel}: targetParts.${id} must be an integer between 1 and 9`);
          }
        }
        const total = totalTargetParts(round);
        if (total < 2 || total > 12) {
          violations.push(`E_ROOM_${roundLabel}: total target parts must be between 2 and 12 (got ${total})`);
        }
      });
    } else if (isBalanceRoom(room)) {
      if (!Array.isArray(room.chips) || room.chips.length === 0 || !room.chips.every(isPositiveInt)) {
        violations.push(`E_ROOM_${label}: chips must be a non-empty list of positive integers`);
      }

      room.rounds.forEach((round, roundIndex) => {
        const roundLabel = `${label}[${roundIndex}]`;
        if (!Array.isArray(round.leftWeights) || round.leftWeights.length === 0 || !round.leftWeights.every(isPositiveInt)) {
          violations.push(`E_ROOM_${roundLabel}: leftWeights must be a non-empty list of positive integers`);
          return;
        }
        if (!Array.isArray(round.rightWeights) || !round.rightWeights.every(isPositiveInt)) {
          violations.push(`E_ROOM_${roundLabel}: rightWeights must be a list of positive integers`);
          return;
        }
        if (!Array.isArray(room.chips) || room.chips.length === 0) return;

        const left = sumWeights(round.leftWeights);
        const right = sumWeights(round.rightWeights);
        const diff = left - right;
        if (left > 50) {
          violations.push(`E_ROOM_${roundLabel}: left side too heavy for counting (max 50, got ${left})`);
        }
        if (diff < 1) {
          violations.push(`E_ROOM_${roundLabel}: left side must be heavier than right start (diff ${diff})`);
        } else if (diff > 30) {
          violations.push(`E_ROOM_${roundLabel}: missing amount too large for counting (max 30, got ${diff})`);
        } else if (!diffReachable(diff, room.chips)) {
          violations.push(`E_ROOM_${roundLabel}: missing amount ${diff} cannot be built from chips ${room.chips.join(",")}`);
        }
      });
    } else {
      violations.push(`E_ROOM_${label}: mode must be recipe or balance`);
    }

    validateFeedback(room, violations);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
