import type { DiagramEngineSpec, DiagramRoom, LabelRound, FindRound } from "./diagramTypes";
import { inStage, tooClose } from "./diagramTypes";

export type DiagramValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const MIN_MARKERS = 3;
const MAX_MARKERS = 8;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: DiagramRoom): string {
  return room.roomId || "unknown";
}

export function validateDiagramEngineSpec(spec: DiagramEngineSpec): DiagramValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "diagram") violations.push("E_ENGINE: engine must be diagram");
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
    if (room.mode !== "label" && room.mode !== "find") violations.push(`E_ROOM_${label}: mode must be label or find`);
    if (!hasText(room.backdrop)) violations.push(`E_ROOM_${label}: backdrop symbol is required`);

    if (!Array.isArray(room.markers) || room.markers.length < MIN_MARKERS || room.markers.length > MAX_MARKERS) {
      violations.push(`E_ROOM_${label}: needs ${MIN_MARKERS}-${MAX_MARKERS} markers`);
      continue;
    }
    const seenLabels = new Set<string>();
    room.markers.forEach((m, i) => {
      if (!hasText(m.label)) violations.push(`E_ROOM_${label}.m[${i}]: marker label required`);
      else {
        const key = m.label.trim().toLowerCase();
        if (seenLabels.has(key)) violations.push(`E_ROOM_${label}.m[${i}]: duplicate marker label "${m.label}"`);
        seenLabels.add(key);
      }
      if (typeof m.x !== "number" || typeof m.y !== "number" || !inStage(m)) {
        violations.push(`E_ROOM_${label}.m[${i}]: marker position must be 0-100 in x and y`);
      }
    });
    // Marker duerfen sich nicht ueberlappen (eindeutig antippbar).
    for (let i = 0; i < room.markers.length; i++) {
      for (let j = i + 1; j < room.markers.length; j++) {
        if (inStage(room.markers[i]) && inStage(room.markers[j]) && tooClose(room.markers[i], room.markers[j])) {
          violations.push(`E_ROOM_${label}: markers ${i} and ${j} overlap (too close)`);
        }
      }
    }

    if (!Array.isArray(room.rounds) || room.rounds.length === 0) {
      violations.push(`E_ROOM_${label}: at least one round is required`);
      continue;
    }
    if (room.rounds.length > MAX_ROUNDS_PER_ROOM) violations.push(`E_ROOM_${label}: at most ${MAX_ROUNDS_PER_ROOM} rounds per room`);
    totalRounds += room.rounds.length;

    const inventory = new Set(room.markers.map((m) => m.label));
    room.rounds.forEach((r, i) => {
      const rl = `${label}[${i}]`;
      if (room.mode === "label") {
        const lr = r as LabelRound;
        if (typeof lr.markerIndex !== "number" || lr.markerIndex < 0 || lr.markerIndex >= room.markers.length) {
          violations.push(`E_ROOM_${rl}: markerIndex out of range`);
          return;
        }
        const correct = room.markers[lr.markerIndex].label;
        if (!Array.isArray(lr.options) || lr.options.length < 2 || lr.options.length > 4) {
          violations.push(`E_ROOM_${rl}: needs 2-4 options`);
          return;
        }
        if (!lr.options.includes(correct)) {
          violations.push(`E_ROOM_${rl}: options must include the correct label "${correct}"`);
        }
        if (new Set(lr.options).size !== lr.options.length) {
          violations.push(`E_ROOM_${rl}: options must be unique`);
        }
        if (lr.options.some((o) => !inventory.has(o))) {
          violations.push(`E_ROOM_${rl}: options must be terms from the diagram's own markers`);
        }
      } else {
        const fr = r as FindRound;
        if (typeof fr.targetIndex !== "number" || fr.targetIndex < 0 || fr.targetIndex >= room.markers.length) {
          violations.push(`E_ROOM_${rl}: targetIndex out of range`);
        }
      }
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongSpot)) violations.push(`E_ROOM_${label}: wrongSpot feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
