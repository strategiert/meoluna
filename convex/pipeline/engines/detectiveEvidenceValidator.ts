import type { ContradictionRound, DetectiveEngineSpec, DetectiveRoom, SuspectsRound } from "./detectiveEvidenceTypes";
import { isContradictionRoom, isEvidenceRoom, isSuspectsRoom } from "./detectiveEvidenceTypes";

export type DetectiveValidationResult = {
  passed: boolean;
  violations: string[];
};

// Session-Format v2: genug Aufgaben für eine 10-15-Minuten-Session.
const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const MIN_EVIDENCE_CARDS = 1;
const MAX_EVIDENCE_CARDS = 2;
const MIN_STATEMENTS = 3;
const MAX_STATEMENTS = 4;
// Ab so vielen Raeumen muss die Welt mindestens 2 verschiedene Modi nutzen
// (strukturelle Varianz erzwingen, nicht nur Content-Varianz). Beide
// bestehenden Fixtures erfuellen das bereits (evidence+suspects gemischt).
const MODE_DIVERSITY_MIN_ROOMS = 3;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function roomLabel(room: DetectiveRoom): string {
  return room.roomId || "unknown";
}

// contradiction: die Spec macht alles explizit (evidence + statements +
// contradictionIndex + reason) - keine Weltwissen-Ableitung noetig. Wir
// pruefen nur Struktur/Eindeutigkeit, nicht die inhaltliche Logik der
// Beweise (die liegt in der Verantwortung des Prompts).
function validateContradictionRound(round: ContradictionRound, roundLabel: string, violations: string[]): void {
  if (!Array.isArray(round.evidence) || round.evidence.length < MIN_EVIDENCE_CARDS || round.evidence.length > MAX_EVIDENCE_CARDS) {
    violations.push(`E_ROOM_${roundLabel}: needs ${MIN_EVIDENCE_CARDS}-${MAX_EVIDENCE_CARDS} evidence cards`);
  } else if (round.evidence.some((e) => !hasText(e))) {
    violations.push(`E_ROOM_${roundLabel}: every evidence card must be non-empty`);
  }
  if (!Array.isArray(round.statements) || round.statements.length < MIN_STATEMENTS || round.statements.length > MAX_STATEMENTS) {
    violations.push(`E_ROOM_${roundLabel}: needs ${MIN_STATEMENTS}-${MAX_STATEMENTS} statements`);
    return;
  }
  const seen = new Set<string>();
  for (const statement of round.statements) {
    if (!hasText(statement)) {
      violations.push(`E_ROOM_${roundLabel}: every statement must be non-empty`);
      continue;
    }
    // Zwei identische Aussagen machen die widersprechende Karte mehrdeutig.
    if (seen.has(statement)) {
      violations.push(`E_ROOM_${roundLabel}: duplicate statement makes the contradiction ambiguous`);
    }
    seen.add(statement);
  }
  if (!Number.isInteger(round.contradictionIndex) || round.contradictionIndex < 0 || round.contradictionIndex >= round.statements.length) {
    violations.push(`E_ROOM_${roundLabel}: contradictionIndex out of range`);
  }
  if (!hasText(round.reason)) {
    violations.push(`E_ROOM_${roundLabel}: reason is required (explains why the statement contradicts the evidence)`);
  }
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
    } else if (isContradictionRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        validateContradictionRound(round, `${label}[${roundIndex}]`, violations);
      });
    } else {
      violations.push(`E_ROOM_${label}: mode must be evidence, suspects or contradiction`);
    }

    // Nur das vom Modus tatsaechlich gerenderte Feedback ist Pflicht.
    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (isEvidenceRoom(room) && !hasText(room.feedback?.wrongEvidence)) violations.push(`E_ROOM_${label}: wrongEvidence feedback missing`);
    if (isSuspectsRoom(room) && !hasText(room.feedback?.wrongSuspect)) violations.push(`E_ROOM_${label}: wrongSuspect feedback missing`);
    if (isContradictionRoom(room) && !hasText(room.feedback?.wrongStatement)) violations.push(`E_ROOM_${label}: wrongStatement feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  // Strukturelle Varianz: ab MODE_DIVERSITY_MIN_ROOMS Raeumen mindestens
  // 2 verschiedene Modi. Beide bestehenden Fixtures erfuellen das bereits.
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
