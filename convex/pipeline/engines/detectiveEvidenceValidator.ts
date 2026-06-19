import type { DetectiveEngineSpec, DetectiveRoom, SuspectsRound } from "./detectiveEvidenceTypes";
import { isEvidenceRoom, isSuspectsRoom } from "./detectiveEvidenceTypes";

export type DetectiveValidationResult = {
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

function roomLabel(room: DetectiveRoom): string {
  return room.roomId || "unknown";
}

// Simuliert das Ausschluss-Spiel: jeder Hinweis muss genau einen der noch
// übrigen Verdächtigen ausschließen, am Ende bleibt genau der Täter.
function simulateSuspectsRound(round: SuspectsRound): string | null {
  const ids = new Set<string>();
  for (const suspect of round.suspects) {
    if (!hasText(suspect.id) || !hasText(suspect.name) || !hasText(suspect.emoji)) {
      return "every suspect needs id, name and emoji";
    }
    if (ids.has(suspect.id)) return `duplicate suspect id ${suspect.id}`;
    ids.add(suspect.id);
    if (!suspect.traits || Object.keys(suspect.traits).length === 0) {
      return `suspect ${suspect.id} needs traits`;
    }
  }
  if (!ids.has(round.culpritId)) return `culpritId ${round.culpritId} is not a suspect`;
  if (round.clues.length !== round.suspects.length - 1) {
    return `needs exactly ${round.suspects.length - 1} clues for ${round.suspects.length} suspects (one elimination per clue), got ${round.clues.length}`;
  }

  let remaining = [...round.suspects];
  for (const [clueIndex, clue] of round.clues.entries()) {
    if (!hasText(clue.text) || !hasText(clue.attribute) || !hasText(clue.value)) {
      return `clue ${clueIndex} needs text, attribute and value`;
    }
    const mismatches = remaining.filter((suspect) => suspect.traits[clue.attribute] !== clue.value);
    if (mismatches.length !== 1) {
      return `clue ${clueIndex} ("${clue.text}") must eliminate exactly one remaining suspect, eliminates ${mismatches.length}`;
    }
    if (mismatches[0].id === round.culpritId) {
      return `clue ${clueIndex} would eliminate the culprit`;
    }
    remaining = remaining.filter((suspect) => suspect.id !== mismatches[0].id);
  }
  if (remaining.length !== 1 || remaining[0].id !== round.culpritId) {
    return "after all clues exactly the culprit must remain";
  }
  return null;
}

export function validateDetectiveEngineSpec(spec: DetectiveEngineSpec): DetectiveValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "detective-evidence") {
    violations.push("E_ENGINE: engine must be detective-evidence");
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

    if (isEvidenceRoom(room)) {
      const sentences = room.caseText?.sentences;
      if (!hasText(room.caseText?.title)) {
        violations.push(`E_ROOM_${label}: caseText.title is required`);
      }
      if (!Array.isArray(sentences) || sentences.length < 3 || sentences.length > 8) {
        violations.push(`E_ROOM_${label}: caseText needs 3-8 sentences`);
      } else {
        sentences.forEach((sentence, index) => {
          if (!hasText(sentence)) {
            violations.push(`E_ROOM_${label}: sentence ${index} is empty`);
          } else if (sentence.length > 130) {
            violations.push(`E_ROOM_${label}: sentence ${index} too long for a card (max 130 chars)`);
          }
        });
        const usedIndices = new Set<number>();
        room.rounds.forEach((round, roundIndex) => {
          if (!hasText(round.question)) {
            violations.push(`E_ROOM_${label}[${roundIndex}]: question is required`);
          }
          if (!Number.isInteger(round.evidenceIndex) || round.evidenceIndex < 0 || round.evidenceIndex >= sentences.length) {
            violations.push(`E_ROOM_${label}[${roundIndex}]: evidenceIndex out of range`);
          } else if (usedIndices.has(round.evidenceIndex)) {
            violations.push(`E_ROOM_${label}[${roundIndex}]: evidenceIndex ${round.evidenceIndex} already used in this room (each question needs its own sentence)`);
          } else {
            usedIndices.add(round.evidenceIndex);
          }
        });
      }
    } else if (isSuspectsRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        const roundLabel = `${label}[${roundIndex}]`;
        if (!hasText(round.intro)) {
          violations.push(`E_ROOM_${roundLabel}: intro is required`);
        }
        if (!Array.isArray(round.suspects) || round.suspects.length < 3 || round.suspects.length > 4) {
          violations.push(`E_ROOM_${roundLabel}: needs 3-4 suspects (kleine Raetsel sind zuverlaessig korrekt)`);
          return;
        }
        if (!Array.isArray(round.clues)) {
          violations.push(`E_ROOM_${roundLabel}: clues are required`);
          return;
        }
        const problem = simulateSuspectsRound(round);
        if (problem) {
          violations.push(`E_ROOM_${roundLabel}: ${problem}`);
        }
      });
    } else {
      violations.push(`E_ROOM_${label}: mode must be evidence or suspects`);
    }

    // Nur das vom Modus tatsaechlich gerenderte Feedback ist Pflicht.
    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (isEvidenceRoom(room) && !hasText(room.feedback?.wrongEvidence)) violations.push(`E_ROOM_${label}: wrongEvidence feedback missing`);
    if (isSuspectsRoom(room) && !hasText(room.feedback?.wrongSuspect)) violations.push(`E_ROOM_${label}: wrongSuspect feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
