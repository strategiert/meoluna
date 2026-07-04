import type { OddOneOutRound, SortEngineSpec, SortRoom, TwoAxisRound } from "./sortMatchTypes";
import { isBasketsRoom, isOddOneOutRoom, isPairsRoom, isTwoAxisRoom } from "./sortMatchTypes";

export type SortValidationResult = {
  passed: boolean;
  violations: string[];
};

// Session-Format v2: genug Aufgaben für eine 10-15-Minuten-Session.
const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
// Ab so vielen Raeumen muss die Welt mindestens 2 verschiedene Modi nutzen
// (strukturelle Varianz erzwingen, nicht nur Content-Varianz). Beide
// bestehenden Fixtures erfuellen das bereits (baskets+pairs gemischt).
const MODE_DIVERSITY_MIN_ROOMS = 3;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function roomLabel(room: SortRoom): string {
  return room.roomId || "unknown";
}

const MIN_ODD_CARDS = 4;
const MAX_ODD_CARDS = 6;

function validateOddOneOutRound(round: OddOneOutRound, roundLabel: string, violations: string[]): void {
  if (!Array.isArray(round.cards) || round.cards.length < MIN_ODD_CARDS || round.cards.length > MAX_ODD_CARDS) {
    violations.push(`E_ROOM_${roundLabel}: odd-one-out needs ${MIN_ODD_CARDS}-${MAX_ODD_CARDS} cards`);
    return;
  }
  const cardIds = new Set<string>();
  const seenSignatures = new Set<string>();
  for (const card of round.cards) {
    if (!hasText(card.id) || !hasText(card.label) || !hasText(card.emoji)) {
      violations.push(`E_ROOM_${roundLabel}: every card needs id, label and emoji`);
    }
    if (cardIds.has(card.id)) {
      violations.push(`E_ROOM_${roundLabel}: duplicate card id ${card.id}`);
    }
    cardIds.add(card.id);
    // Zwei identische Karten (gleiches Label+Emoji) machen die Ausreisser-Karte
    // mehrdeutig -> nicht maschinell eindeutig loesbar.
    const signature = `${card.label}::${card.emoji}`;
    if (seenSignatures.has(signature)) {
      violations.push(`E_ROOM_${roundLabel}: duplicate card "${card.label}" makes the odd one ambiguous`);
    }
    seenSignatures.add(signature);
  }
  if (typeof round.oddIndex !== "number" || round.oddIndex < 0 || round.oddIndex >= round.cards.length) {
    violations.push(`E_ROOM_${roundLabel}: oddIndex out of range`);
  }
  if (!hasText(round.reason)) {
    violations.push(`E_ROOM_${roundLabel}: reason is required (explains why the odd card doesn't fit)`);
  }
}

const MIN_TWO_AXIS_CARDS = 4;
const MAX_TWO_AXIS_CARDS = 8;

function validateTwoAxisRound(round: TwoAxisRound, roundLabel: string, violations: string[]): void {
  if (!hasText(round.xAxis?.negative) || !hasText(round.xAxis?.positive)) {
    violations.push(`E_ROOM_${roundLabel}: xAxis needs negative and positive labels`);
  } else if (round.xAxis.negative === round.xAxis.positive) {
    violations.push(`E_ROOM_${roundLabel}: xAxis labels must differ`);
  }
  if (!hasText(round.yAxis?.negative) || !hasText(round.yAxis?.positive)) {
    violations.push(`E_ROOM_${roundLabel}: yAxis needs negative and positive labels`);
  } else if (round.yAxis.negative === round.yAxis.positive) {
    violations.push(`E_ROOM_${roundLabel}: yAxis labels must differ`);
  }
  if (!Array.isArray(round.cards) || round.cards.length < MIN_TWO_AXIS_CARDS || round.cards.length > MAX_TWO_AXIS_CARDS) {
    violations.push(`E_ROOM_${roundLabel}: two-axis needs ${MIN_TWO_AXIS_CARDS}-${MAX_TWO_AXIS_CARDS} cards`);
    return;
  }
  const cardIds = new Set<string>();
  const quadrants = new Set<string>();
  const xValues = new Set<string>();
  const yValues = new Set<string>();
  for (const card of round.cards) {
    if (!hasText(card.id) || !hasText(card.label) || !hasText(card.emoji)) {
      violations.push(`E_ROOM_${roundLabel}: every card needs id, label and emoji`);
    }
    if (cardIds.has(card.id)) {
      violations.push(`E_ROOM_${roundLabel}: duplicate card id ${card.id}`);
    }
    cardIds.add(card.id);
    if (card.x !== "negative" && card.x !== "positive") {
      violations.push(`E_ROOM_${roundLabel}: card ${card.id} needs x = negative|positive`);
    } else {
      xValues.add(card.x);
    }
    if (card.y !== "negative" && card.y !== "positive") {
      violations.push(`E_ROOM_${roundLabel}: card ${card.id} needs y = negative|positive`);
    } else {
      yValues.add(card.y);
    }
    quadrants.add(`${card.x}:${card.y}`);
  }
  // Jede Karte hat durch (x,y) genau einen Quadranten -> per Konstruktion
  // eindeutig. Beide Achsen muessen aber tatsaechlich unterscheiden, sonst
  // ist das Raster degeneriert (z.B. alle Karten auf derselben Seite einer
  // Achse -> die Achse traegt nichts zur Aufgabe bei).
  if (xValues.size < 2) {
    violations.push(`E_ROOM_${roundLabel}: cards must use both sides of the x axis`);
  }
  if (yValues.size < 2) {
    violations.push(`E_ROOM_${roundLabel}: cards must use both sides of the y axis`);
  }
  if (quadrants.size < 2) {
    violations.push(`E_ROOM_${roundLabel}: cards must cover at least 2 different quadrants`);
  }
}

export function validateSortEngineSpec(spec: SortEngineSpec): SortValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "sort-match") {
    violations.push("E_ENGINE: engine must be sort-match");
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

    if (isBasketsRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        const roundLabel = `${label}[${roundIndex}]`;
        if (!Array.isArray(round.categories) || round.categories.length < 2 || round.categories.length > 3) {
          violations.push(`E_ROOM_${roundLabel}: needs 2-3 categories`);
          return;
        }
        const categoryIds = new Set<string>();
        for (const category of round.categories) {
          if (!hasText(category.id) || !hasText(category.label) || !hasText(category.emoji)) {
            violations.push(`E_ROOM_${roundLabel}: every category needs id, label and emoji`);
          }
          if (categoryIds.has(category.id)) {
            violations.push(`E_ROOM_${roundLabel}: duplicate category id ${category.id}`);
          }
          categoryIds.add(category.id);
        }
        if (!Array.isArray(round.cards) || round.cards.length < 4 || round.cards.length > 10) {
          violations.push(`E_ROOM_${roundLabel}: needs 4-10 cards`);
          return;
        }
        const cardIds = new Set<string>();
        const usedCategories = new Set<string>();
        for (const card of round.cards) {
          if (!hasText(card.id) || !hasText(card.label) || !hasText(card.emoji)) {
            violations.push(`E_ROOM_${roundLabel}: every card needs id, label and emoji`);
          }
          if (card.label && card.label.length > 40) {
            violations.push(`E_ROOM_${roundLabel}: card label "${card.label}" too long (max 40 chars)`);
          }
          if (cardIds.has(card.id)) {
            violations.push(`E_ROOM_${roundLabel}: duplicate card id ${card.id}`);
          }
          cardIds.add(card.id);
          if (!categoryIds.has(card.categoryId)) {
            violations.push(`E_ROOM_${roundLabel}: card ${card.id} references unknown category ${card.categoryId}`);
          }
          usedCategories.add(card.categoryId);
        }
        if (usedCategories.size < categoryIds.size) {
          violations.push(`E_ROOM_${roundLabel}: every category needs at least one card`);
        }
      });
    } else if (isPairsRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        const roundLabel = `${label}[${roundIndex}]`;
        if (!Array.isArray(round.pairs) || round.pairs.length < 3 || round.pairs.length > 6) {
          violations.push(`E_ROOM_${roundLabel}: needs 3-6 pairs`);
          return;
        }
        const pairIds = new Set<string>();
        const rightLabels = new Set<string>();
        for (const pair of round.pairs) {
          if (!hasText(pair.id) || !hasText(pair.left?.label) || !hasText(pair.right?.label)) {
            violations.push(`E_ROOM_${roundLabel}: every pair needs id, left.label and right.label`);
            continue;
          }
          if (pairIds.has(pair.id)) {
            violations.push(`E_ROOM_${roundLabel}: duplicate pair id ${pair.id}`);
          }
          pairIds.add(pair.id);
          if (rightLabels.has(pair.right.label)) {
            violations.push(`E_ROOM_${roundLabel}: right label "${pair.right.label}" appears twice (pairs would be ambiguous)`);
          }
          rightLabels.add(pair.right.label);
          if (pair.left.label.length > 40 || pair.right.label.length > 40) {
            violations.push(`E_ROOM_${roundLabel}: pair labels max 40 chars`);
          }
        }
      });
    } else if (isOddOneOutRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        validateOddOneOutRound(round, `${label}[${roundIndex}]`, violations);
      });
    } else if (isTwoAxisRoom(room)) {
      room.rounds.forEach((round, roundIndex) => {
        validateTwoAxisRound(round, `${label}[${roundIndex}]`, violations);
      });
    } else {
      violations.push(`E_ROOM_${label}: mode must be baskets, pairs, odd-one-out or two-axis`);
    }

    // Nur das vom Modus tatsaechlich gerenderte Feedback ist Pflicht.
    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (isBasketsRoom(room) && !hasText(room.feedback?.wrongBasket)) violations.push(`E_ROOM_${label}: wrongBasket feedback missing`);
    if (isPairsRoom(room) && !hasText(room.feedback?.wrongPair)) violations.push(`E_ROOM_${label}: wrongPair feedback missing`);
    if (isOddOneOutRoom(room) && !hasText(room.feedback?.wrongOdd)) violations.push(`E_ROOM_${label}: wrongOdd feedback missing`);
    if (isTwoAxisRoom(room) && !hasText(room.feedback?.wrongQuadrant)) violations.push(`E_ROOM_${label}: wrongQuadrant feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  // Strukturelle Varianz: ab MODE_DIVERSITY_MIN_ROOMS Raeumen mindestens
  // 2 verschiedene Modi. Beide bestehenden Fixtures erfuellen das bereits
  // (baskets+pairs gemischt), daher additiv sicher.
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
