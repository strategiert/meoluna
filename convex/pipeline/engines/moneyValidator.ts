import type { MoneyEngineSpec, MoneyRoom, PayRound, ChangeRound } from "./moneyTypes";
import { isValidDenom, canMakeAmount } from "./moneyTypes";

export type MoneyValidationResult = { passed: boolean; violations: string[] };

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;
const MAX_ROUNDS_PER_ROOM = 4;
const MIN_TOTAL_ROUNDS = 6;
const MAX_CENTS = 2000; // bis 20 Euro, kindgerecht

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function roomLabel(room: MoneyRoom): string {
  return room.roomId || "unknown";
}
function validDenomList(denoms: unknown): denoms is number[] {
  return Array.isArray(denoms) && denoms.length > 0 && denoms.every((d) => typeof d === "number" && isValidDenom(d));
}

export function validateMoneyEngineSpec(spec: MoneyEngineSpec): MoneyValidationResult {
  const violations: string[] = [];

  if (spec.engine !== "money") violations.push("E_ENGINE: engine must be money");
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
    if (room.mode !== "pay" && room.mode !== "change") violations.push(`E_ROOM_${label}: mode must be pay or change`);
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
      } else {
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
      }
    });

    if (!hasText(room.feedback?.correct)) violations.push(`E_ROOM_${label}: correct feedback missing`);
    if (!hasText(room.feedback?.wrongAmount)) violations.push(`E_ROOM_${label}: wrongAmount feedback missing`);
    if (!hasText(room.feedback?.tryAgain)) violations.push(`E_ROOM_${label}: tryAgain feedback missing`);
    if (!hasText(room.explanationAfterSuccess)) violations.push(`E_ROOM_${label}: explanationAfterSuccess missing`);
  }

  if (totalRounds < MIN_TOTAL_ROUNDS) {
    violations.push(`E_SESSION: world has only ${totalRounds} rounds, needs at least ${MIN_TOTAL_ROUNDS} for a 10-15 minute session`);
  }

  return { passed: violations.length === 0, violations };
}
