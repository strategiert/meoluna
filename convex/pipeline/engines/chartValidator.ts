import type { ChartEngineSpec, ChartRoom, ReadRound, FindRound, BuildRound, Category } from "./chartTypes";
import { uniqueExtremumIndex } from "./chartTypes";

export type ChartValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const MIN_CATS = 3;
const MAX_CATS = 6;
const MAX_BAR_VALUE = 100;
const MAX_PICTO_VALUE = 12;
const VALID_MODES = ["read", "find", "build"] as const;
// Ab so vielen Raeumen muss die Welt mindestens 2 verschiedene Modi nutzen
// (strukturelle Varianz erzwingen). Beide Bestands-Fixtures erfuellen das
// bereits (read+read+find bzw. read+find+find).
const MODE_DIVERSITY_MIN_ROOMS = 3;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: ChartRoom): string {
  return room.roomId || "unknown";
}
function isPosInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

// build: das Kind zeichnet targets[] selbst ein (ein Ziel pro Kategorie,
// gleiche Reihenfolge), Werte im selben Bereich wie die Kategorie-Werte.
function validateBuildRound(r: BuildRound, rl: string, categories: Category[], maxVal: number, violations: string[]): void {
  if (!Array.isArray(r.targets) || r.targets.length !== categories.length) {
    violations.push(`E_ROOM_${rl}: build mode needs exactly ${categories.length} targets (one per category)`);
    return;
  }
  r.targets.forEach((t, i) => {
    if (!isPosInt(t) || t > maxVal) {
      violations.push(`E_ROOM_${rl}: target[${i}] must be an integer 1-${maxVal}`);
    }
  });
}

export function validateChartEngineSpec(spec: ChartEngineSpec): ChartValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "chart") violations.push("E_ENGINE: engine must be chart");
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
    if (room.chartType !== "bar" && room.chartType !== "picto") violations.push(`E_ROOM_${label}: chartType must be bar or picto`);

    if (!Array.isArray(room.categories) || room.categories.length < MIN_CATS || room.categories.length > MAX_CATS) {
      violations.push(`E_ROOM_${label}: needs ${MIN_CATS}-${MAX_CATS} categories`);
      continue;
    }
    const maxVal = room.chartType === "picto" ? MAX_PICTO_VALUE : MAX_BAR_VALUE;
    const seen = new Set<string>();
    room.categories.forEach((c, i) => {
      if (!hasText(c.label)) violations.push(`E_ROOM_${label}.c[${i}]: category label required`);
      else {
        const key = c.label.trim().toLowerCase();
        if (seen.has(key)) violations.push(`E_ROOM_${label}.c[${i}]: duplicate category "${c.label}"`);
        seen.add(key);
      }
      if (!isPosInt(c.value) || c.value > maxVal) {
        violations.push(`E_ROOM_${label}.c[${i}]: value must be an integer 1-${maxVal} for ${room.chartType}`);
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
      if (room.mode === "read") {
        const rr = r as ReadRound;
        if (typeof rr.categoryIndex !== "number" || rr.categoryIndex < 0 || rr.categoryIndex >= room.categories.length) {
          violations.push(`E_ROOM_${rl}: categoryIndex out of range`);
          return;
        }
        const correct = room.categories[rr.categoryIndex].value;
        if (!Array.isArray(rr.options) || rr.options.length < 2 || rr.options.length > 4) {
          violations.push(`E_ROOM_${rl}: needs 2-4 options`);
          return;
        }
        if (rr.options.some((o) => !isPosInt(o))) {
          violations.push(`E_ROOM_${rl}: options must be positive integers`);
        }
        if (!rr.options.includes(correct)) {
          violations.push(`E_ROOM_${rl}: options must include the correct value ${correct}`);
        }
        if (new Set(rr.options).size !== rr.options.length) {
          violations.push(`E_ROOM_${rl}: options must be unique`);
        }
      } else if (room.mode === "find") {
        const fr = r as FindRound;
        if (fr.ask !== "most" && fr.ask !== "least") {
          violations.push(`E_ROOM_${rl}: ask must be most or least`);
          return;
        }
        if (uniqueExtremumIndex(room.categories, fr.ask) === -1) {
          violations.push(`E_ROOM_${rl}: ${fr.ask} has no unique answer (tie) - make the extreme value unique`);
        }
      } else if (room.mode === "build") {
        validateBuildRound(r as BuildRound, rl, room.categories, maxVal, violations);
      }
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongValue)) violations.push(`E_ROOM_${label}: wrongValue feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

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
