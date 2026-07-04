import type { MoneyEngineSpec, MoneyRoom, PayRound, ChangeRound, ShoppingRound } from "./moneyTypes";
import { isValidDenom, canMakeAmount } from "./moneyTypes";

export type MoneyValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const MAX_CENTS = 2000; // bis 20 Euro, kindgerecht
const VALID_MODES = ["pay", "change", "shopping"] as const;
// Ab so vielen Raeumen muss die Welt mindestens 2 verschiedene Modi nutzen
// (strukturelle Varianz erzwingen, nicht nur Content-Varianz). Beide
// Bestands-Fixtures erfuellen das bereits (pay+pay+change).
const MODE_DIVERSITY_MIN_ROOMS = 3;
const MIN_SHOP_ITEMS = 2;
const MAX_SHOP_ITEMS = 6;
const MIN_BUY = 1;
const MAX_BUY = 3;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: MoneyRoom): string {
  return room.roomId || "unknown";
}
function validDenomList(denoms: unknown): denoms is number[] {
  return Array.isArray(denoms) && denoms.length > 0 && denoms.every((d) => typeof d === "number" && isValidDenom(d));
}

// shopping: erst die richtigen Artikel (buyNames) in den Korb, dann die
// Gesamtsumme legen. buyNames muss Teilmenge von items sein und die Summe
// der gekauften Artikel muss mit den denoms exakt legbar sein.
function validateShoppingRound(r: ShoppingRound, rl: string, violations: string[]): void {
  if (!Array.isArray(r.items) || r.items.length < MIN_SHOP_ITEMS || r.items.length > MAX_SHOP_ITEMS) {
    violations.push(`E_ROOM_${rl}: shopping mode needs ${MIN_SHOP_ITEMS}-${MAX_SHOP_ITEMS} items`);
    return;
  }
  const names = new Set<string>();
  let itemsOk = true;
  for (const it of r.items) {
    if (!it || !hasText(it.name)) { violations.push(`E_ROOM_${rl}: every item needs a name`); itemsOk = false; continue; }
    if (!hasText(it.emoji)) { violations.push(`E_ROOM_${rl}: item "${it.name}" needs an emoji`); itemsOk = false; }
    if (typeof it.priceCents !== "number" || !Number.isInteger(it.priceCents) || it.priceCents < 1 || it.priceCents > MAX_CENTS) {
      violations.push(`E_ROOM_${rl}: item "${it.name}" priceCents must be an integer 1-${MAX_CENTS}`);
      itemsOk = false;
    }
    if (names.has(it.name)) { violations.push(`E_ROOM_${rl}: duplicate item name "${it.name}"`); itemsOk = false; }
    names.add(it.name);
  }
  if (!itemsOk) return;

  if (!Array.isArray(r.buyNames) || r.buyNames.length < MIN_BUY || r.buyNames.length > MAX_BUY) {
    violations.push(`E_ROOM_${rl}: buyNames needs ${MIN_BUY}-${MAX_BUY} entries`);
    return;
  }
  if (new Set(r.buyNames).size !== r.buyNames.length) {
    violations.push(`E_ROOM_${rl}: buyNames must be unique`);
  }
  if (r.buyNames.some((n) => !names.has(n))) {
    violations.push(`E_ROOM_${rl}: buyNames must be a subset of items`);
    return;
  }
  const total = r.items.filter((it) => r.buyNames.includes(it.name)).reduce((sum, it) => sum + it.priceCents, 0);
  if (total > MAX_CENTS) {
    violations.push(`E_ROOM_${rl}: total ${total} exceeds ${MAX_CENTS} cents (20 Euro)`);
  }
  if (!canMakeAmount(total, r.denoms)) {
    violations.push(`E_ROOM_${rl}: total ${total} is not exactly payable with the given denoms`);
  }
}

export function validateMoneyEngineSpec(spec: MoneyEngineSpec): MoneyValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "money") violations.push("E_ENGINE: engine must be money");
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

    room.rounds.forEach((r, i) => {
      const rl = `${label}[${i}]`;
      if (!validDenomList(r.denoms)) {
        violations.push(`E_ROOM_${rl}: denoms must be a non-empty list of Euro denominations in cents`);
        return;
      }
      if (room.mode === "pay") {
        const pay = r as PayRound;
        if (typeof pay.targetCents !== "number" || !Number.isInteger(pay.targetCents) || pay.targetCents <= 0) {
          violations.push(`E_ROOM_${rl}: targetCents must be a positive integer`);
          return;
        }
        if (pay.targetCents > MAX_CENTS) {
          violations.push(`E_ROOM_${rl}: targetCents must be <= ${MAX_CENTS} cents (20 Euro)`);
        }
        if (!canMakeAmount(pay.targetCents, pay.denoms)) {
          violations.push(`E_ROOM_${rl}: targetCents ${pay.targetCents} is not exactly payable with the given denoms`);
        }
      } else if (room.mode === "change") {
        const ch = r as ChangeRound;
        if (typeof ch.priceCents !== "number" || !Number.isInteger(ch.priceCents) || ch.priceCents <= 0 ||
            typeof ch.paidCents !== "number" || !Number.isInteger(ch.paidCents) || ch.paidCents <= 0) {
          violations.push(`E_ROOM_${rl}: priceCents and paidCents must be positive integers`);
          return;
        }
        if (ch.paidCents <= ch.priceCents) {
          violations.push(`E_ROOM_${rl}: paidCents (${ch.paidCents}) must be greater than priceCents (${ch.priceCents})`);
        }
        if (ch.paidCents > MAX_CENTS) {
          violations.push(`E_ROOM_${rl}: paidCents must be <= ${MAX_CENTS} cents (20 Euro)`);
        }
        const changeCents = ch.paidCents - ch.priceCents;
        if (changeCents > 0 && !canMakeAmount(changeCents, ch.denoms)) {
          violations.push(`E_ROOM_${rl}: change ${changeCents} is not exactly payable with the given denoms`);
        }
      } else if (room.mode === "shopping") {
        validateShoppingRound(r as ShoppingRound, rl, violations);
      }
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongAmount)) violations.push(`E_ROOM_${label}: wrongAmount feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  // Strukturelle Varianz: ab MODE_DIVERSITY_MIN_ROOMS Raeumen mindestens
  // 2 verschiedene Modi (beide Bestands-Fixtures erfuellen das bereits).
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
