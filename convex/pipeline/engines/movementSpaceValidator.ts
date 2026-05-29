import type { MovementEngineSpec, Position } from "./movementSpaceTypes";
import { is2DPosition } from "./movementSpaceTypes";

export type MovementValidationResult = {
  passed: boolean;
  violations: string[];
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sumPositions(start: Position, moves: Array<{ value: Position }>): Position {
  if (is2DPosition(start)) {
    return moves.reduce(
      (acc, move) => {
        if (!is2DPosition(move.value)) {
          throw new Error("Mixed 1D and 2D movement values are not allowed.");
        }
        return { x: acc.x + move.value.x, y: acc.y + move.value.y };
      },
      { x: start.x, y: start.y },
    );
  }

  return moves.reduce((acc, move) => {
    if (is2DPosition(move.value)) {
      throw new Error("Mixed 1D and 2D movement values are not allowed.");
    }
    return acc + move.value;
  }, start);
}

function samePosition(a: Position, b: Position): boolean {
  if (is2DPosition(a) || is2DPosition(b)) {
    return is2DPosition(a) && is2DPosition(b) && a.x === b.x && a.y === b.y;
  }

  return a === b;
}

function positionInBounds(position: Position, min: number, max: number): boolean {
  if (is2DPosition(position)) {
    return position.x >= min && position.x <= max && position.y >= min && position.y <= max;
  }

  return position >= min && position <= max;
}

function roomLabel(roomId: string): string {
  return roomId || "unknown";
}

export function validateMovementEngineSpec(spec: MovementEngineSpec): MovementValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "movement-space") {
    violations.push("E_ENGINE: engine must be movement-space");
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

  if (!spec.coordinateSystem || spec.coordinateSystem.min >= spec.coordinateSystem.max) {
    violations.push("E_COORDINATES: coordinate min must be smaller than max");
  }

  if (!Array.isArray(spec.rooms) || spec.rooms.length === 0) {
    violations.push("E_ROOMS: at least one room is required");
    return { passed: false, violations };
  }

  const min = spec.coordinateSystem?.min ?? Number.NEGATIVE_INFINITY;
  const max = spec.coordinateSystem?.max ?? Number.POSITIVE_INFINITY;

  for (const room of spec.rooms) {
    const label = roomLabel(room.roomId);

    if (!hasText(room.objective)) {
      violations.push(`E_ROOM_${label}: objective is required`);
    }
    if (!Array.isArray(room.moves) || room.moves.length === 0) {
      violations.push(`E_ROOM_${label}: at least one movement is required`);
    }
    if (!positionInBounds(room.startPosition, min, max)) {
      violations.push(`E_ROOM_${label}: startPosition outside coordinate bounds`);
    }
    if (!positionInBounds(room.targetPosition, min, max)) {
      violations.push(`E_ROOM_${label}: targetPosition outside coordinate bounds`);
    }

    try {
      const calculatedTarget = sumPositions(room.startPosition, room.moves ?? []);
      if (!samePosition(calculatedTarget, room.targetPosition)) {
        violations.push(`E_ROOM_${label}: targetPosition does not match startPosition + moves`);
      }
    } catch (error) {
      violations.push(
        `E_ROOM_${label}: ${error instanceof Error ? error.message : "invalid movement values"}`,
      );
    }

    if (!hasText(room.feedback?.correct)) {
      violations.push(`E_ROOM_${label}: correct feedback missing`);
    }
    if (!hasText(room.feedback?.wrongDirection)) {
      violations.push(`E_ROOM_${label}: wrongDirection feedback missing`);
    }
    if (!hasText(room.feedback?.wrongDistance)) {
      violations.push(`E_ROOM_${label}: wrongDistance feedback missing`);
    }
    if (!hasText(room.feedback?.signConfusion)) {
      violations.push(`E_ROOM_${label}: signConfusion feedback missing`);
    }
    if (!hasText(room.explanationAfterSuccess)) {
      violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
    }
  }

  return { passed: violations.length === 0, violations };
}
