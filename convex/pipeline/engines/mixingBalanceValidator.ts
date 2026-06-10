import type { MixingEngineSpec, MixingRoom } from "./mixingBalanceTypes";
import { isBalanceRoom, isRecipeRoom, sumWeights, totalTargetParts } from "./mixingBalanceTypes";

export type MixingValidationResult = {
  passed: boolean;
  violations: string[];
};

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
  if (spec.rooms.length > 6) {
    violations.push("E_ROOMS: at most 6 rooms are allowed");
  }

  for (const room of spec.rooms) {
    const label = roomLabel(room);

    if (!hasText(room.objective)) {
      violations.push(`E_ROOM_${label}: objective is required`);
    }

    if (isRecipeRoom(room)) {
      if (!Array.isArray(room.ingredients) || room.ingredients.length < 2 || room.ingredients.length > 3) {
        violations.push(`E_ROOM_${label}: recipe needs 2-3 ingredients`);
      } else {
        const ids = new Set<string>();
        for (const ingredient of room.ingredients) {
          if (!hasText(ingredient.id) || !hasText(ingredient.label) || !hasText(ingredient.emoji) || !hasText(ingredient.color)) {
            violations.push(`E_ROOM_${label}: ingredient needs id, label, emoji, color`);
          }
          if (ids.has(ingredient.id)) {
            violations.push(`E_ROOM_${label}: duplicate ingredient id ${ingredient.id}`);
          }
          ids.add(ingredient.id);
        }

        const targetEntries = Object.entries(room.targetParts ?? {});
        if (targetEntries.length === 0) {
          violations.push(`E_ROOM_${label}: targetParts is required`);
        }
        for (const [id, parts] of targetEntries) {
          if (!ids.has(id)) {
            violations.push(`E_ROOM_${label}: targetParts references unknown ingredient ${id}`);
          }
          if (!isPositiveInt(parts) || parts > 9) {
            violations.push(`E_ROOM_${label}: targetParts.${id} must be an integer between 1 and 9`);
          }
        }
        const total = totalTargetParts(room);
        if (total < 2 || total > 12) {
          violations.push(`E_ROOM_${label}: total target parts must be between 2 and 12 (got ${total})`);
        }
      }
    } else if (isBalanceRoom(room)) {
      if (!Array.isArray(room.leftWeights) || room.leftWeights.length === 0 || !room.leftWeights.every(isPositiveInt)) {
        violations.push(`E_ROOM_${label}: leftWeights must be a non-empty list of positive integers`);
      }
      if (!Array.isArray(room.rightWeights) || !room.rightWeights.every(isPositiveInt)) {
        violations.push(`E_ROOM_${label}: rightWeights must be a list of positive integers`);
      }
      if (!Array.isArray(room.chips) || room.chips.length === 0 || !room.chips.every(isPositiveInt)) {
        violations.push(`E_ROOM_${label}: chips must be a non-empty list of positive integers`);
      }

      if (Array.isArray(room.leftWeights) && Array.isArray(room.rightWeights) && Array.isArray(room.chips)) {
        const left = sumWeights(room.leftWeights);
        const right = sumWeights(room.rightWeights);
        const diff = left - right;
        if (left > 50) {
          violations.push(`E_ROOM_${label}: left side too heavy for counting (max 50, got ${left})`);
        }
        if (diff < 1) {
          violations.push(`E_ROOM_${label}: left side must be heavier than right start (diff ${diff})`);
        } else if (diff > 30) {
          violations.push(`E_ROOM_${label}: missing amount too large for counting (max 30, got ${diff})`);
        } else if (!diffReachable(diff, room.chips)) {
          violations.push(`E_ROOM_${label}: missing amount ${diff} cannot be built from chips ${room.chips.join(",")}`);
        }
      }
    } else {
      violations.push(`E_ROOM_${label}: mode must be recipe or balance`);
    }

    validateFeedback(room, violations);
  }

  return { passed: violations.length === 0, violations };
}
