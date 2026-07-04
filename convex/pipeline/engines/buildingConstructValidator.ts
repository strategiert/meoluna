import type { BuildingEngineSpec, BuildingGoal, BuildingRoom, BuildingSlot } from "./buildingConstructTypes";
import { BUILDING_SHAPES, isAreaRoom, isComposeRoom, isFindErrorRoom } from "./buildingConstructTypes";

export type BuildingValidationResult = {
  passed: boolean;
  violations: string[];
};

// Session-Format v2: genug Aufgaben für eine 10-15-Minuten-Session.
const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
// find-error: Mindestabstand (0-100-ViewBox), ab dem eine Positions-Abweichung
// als eigenständiger Fehler zählt statt als Rundungsrauschen.
const MIN_ERROR_OFFSET = 4;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function goalSolvable(goal: BuildingGoal, cols: number, rows: number): string | null {
  if (goal.type === "exact") {
    if (!isPositiveInt(goal.width) || !isPositiveInt(goal.height)) return "exact goal needs positive integer width/height";
    if (goal.width > cols || goal.height > rows) return `exact goal ${goal.width}x${goal.height} does not fit grid ${cols}x${rows}`;
    return null;
  }
  if (goal.type === "area") {
    if (!isPositiveInt(goal.area) || goal.area < 2) return "area goal must be an integer >= 2";
    if (goal.area > cols * rows) return `area goal ${goal.area} exceeds grid capacity ${cols * rows}`;
    for (let width = 1; width <= cols; width += 1) {
      if (goal.area % width === 0 && goal.area / width <= rows) return null;
    }
    return `area goal ${goal.area} has no rectangle solution inside grid ${cols}x${rows}`;
  }
  if (goal.type === "perimeter") {
    if (!isPositiveInt(goal.perimeter) || goal.perimeter % 2 !== 0 || goal.perimeter < 6) {
      return "perimeter goal must be an even integer >= 6";
    }
    const half = goal.perimeter / 2;
    for (let width = 1; width <= cols; width += 1) {
      const height = half - width;
      if (height >= 1 && height <= rows) return null;
    }
    return `perimeter goal ${goal.perimeter} has no rectangle solution inside grid ${cols}x${rows}`;
  }
  return "goal type must be exact, area or perimeter";
}

function roomLabel(room: BuildingRoom): string {
  return room.roomId || "unknown";
}

// Gemeinsame Form-/Bounds-Prüfung für einen Bauteil-Slot (compose UND find-error).
function validateSlotShape(slot: BuildingSlot, label: string, violations: string[]): void {
  if (!BUILDING_SHAPES.includes(slot.shape)) {
    violations.push(`E_${label}: shape must be one of ${BUILDING_SHAPES.join(", ")}`);
  }
  if (typeof slot.x !== "number" || typeof slot.y !== "number" || typeof slot.w !== "number" || typeof slot.h !== "number") {
    violations.push(`E_${label}: x, y, w, h must be numbers`);
    return;
  }
  if (slot.w < 8 || slot.h < 8) {
    violations.push(`E_${label}: parts must be at least 8x8 in the 0-100 viewbox`);
  }
  if (slot.x < 0 || slot.y < 0 || slot.x + slot.w > 100 || slot.y + slot.h > 100) {
    violations.push(`E_${label}: part leaves the 0-100 viewbox`);
  }
  if (!hasText(slot.color)) {
    violations.push(`E_${label}: color is required`);
  }
}

function validateFeedback(room: BuildingRoom, violations: string[]): void {
  const label = roomLabel(room);
  // Nur das vom Modus tatsaechlich gerenderte Feedback ist Pflicht.
  if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
  if (!hasText(room.feedback?.wrongShape)) violations.push(`E_ROOM_${label}: wrongShape feedback missing`);
  if (isAreaRoom(room) && !hasText(room.feedback?.tooSmall)) violations.push(`E_ROOM_${label}: tooSmall feedback missing`);
  if (isAreaRoom(room) && !hasText(room.feedback?.tooBig)) violations.push(`E_ROOM_${label}: tooBig feedback missing`);
  if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
}

export function validateBuildingEngineSpec(spec: BuildingEngineSpec): BuildingValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "building-construct") {
    violations.push("E_ENGINE: engine must be building-construct");
  }
  if (spec.seed !== undefined && !hasText(spec.seed)) {
    violations.push("E_SEED: seed must be a non-empty string when present");
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

    if (isAreaRoom(room)) {
      const cols = room.grid?.cols;
      const rows = room.grid?.rows;
      if (!isPositiveInt(cols) || cols < 4 || cols > 12 || !isPositiveInt(rows) || rows < 3 || rows > 10) {
        violations.push(`E_ROOM_${label}: grid must be between 4x3 and 12x10`);
      } else {
        room.rounds.forEach((round, roundIndex) => {
          const problem = round.goal ? goalSolvable(round.goal, cols, rows) : "goal is required";
          if (problem) {
            violations.push(`E_ROOM_${label}[${roundIndex}]: ${problem}`);
          }
        });
      }
    } else if (isComposeRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        const roundLabel = `${label}[${roundIndex}]`;
        if (!hasText(round.figureName)) {
          violations.push(`E_ROOM_${roundLabel}: figureName is required`);
        }
        if (!Array.isArray(round.slots) || round.slots.length < 2 || round.slots.length > 6) {
          violations.push(`E_ROOM_${roundLabel}: compose round needs 2-6 slots`);
          return;
        }
        round.slots.forEach((slot, slotIndex) => {
          validateSlotShape(slot, `${roundLabel}.slots[${slotIndex}]`, violations);
        });
      });
    } else if (isFindErrorRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        const roundLabel = `${label}[${roundIndex}]`;
        if (!hasText(round.figureName)) {
          violations.push(`E_ROOM_${roundLabel}: figureName is required`);
        }
        if (!Array.isArray(round.slots) || round.slots.length < 2 || round.slots.length > 6) {
          violations.push(`E_ROOM_${roundLabel}: find-error round needs 2-6 slots`);
          return;
        }
        round.slots.forEach((slot, slotIndex) => {
          validateSlotShape(slot, `${roundLabel}.slots[${slotIndex}]`, violations);
        });

        if (typeof round.errorIndex !== "number" || !Number.isInteger(round.errorIndex) || round.errorIndex < 0 || round.errorIndex >= round.slots.length) {
          violations.push(`E_ROOM_${roundLabel}: errorIndex must point at one of the slots`);
          return;
        }
        if (!round.correctSlot) {
          violations.push(`E_ROOM_${roundLabel}: correctSlot is required`);
          return;
        }
        validateSlotShape(round.correctSlot, `${roundLabel}.correctSlot`, violations);

        const shown = round.slots[round.errorIndex];
        if (round.correctSlot.shape !== shown.shape) {
          violations.push(`E_ROOM_${roundLabel}: correctSlot must keep the same shape as the deviating slot (shape may not be the error)`);
        }
        const sizeDiffers = round.correctSlot.w !== shown.w || round.correctSlot.h !== shown.h;
        if (sizeDiffers) {
          violations.push(`E_ROOM_${roundLabel}: correctSlot must keep the same size (only color or position may deviate)`);
        }
        const colorDiffers = round.correctSlot.color !== shown.color;
        const dx = Math.abs(round.correctSlot.x - shown.x);
        const dy = Math.abs(round.correctSlot.y - shown.y);
        const positionDiffers = Math.max(dx, dy) >= MIN_ERROR_OFFSET;
        if (colorDiffers === positionDiffers) {
          violations.push(`E_ROOM_${roundLabel}: exactly one of color or position (offset >= ${MIN_ERROR_OFFSET}) must deviate, not both or neither`);
        }
      });
    } else {
      violations.push(`E_ROOM_${label}: mode must be area, compose or find-error`);
    }

    validateFeedback(room, violations);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
