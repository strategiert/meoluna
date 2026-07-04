import type { LearningBrief, WorldSpec } from "./movementSpaceTypes";

// v2: "shopping" kommt additiv zu pay/change dazu. Alte Specs bleiben gueltig.
export type MoneyMode = "pay" | "change" | "shopping";

// Euro-Stueckelung in Cent (Muenzen + kleine Scheine).
export const EURO_DENOMS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];

// pay: das Kind legt genau den Zielbetrag mit den verfuegbaren Muenzen/Scheinen.
export type PayRound = {
  objective?: string;
  targetCents: number;
  denoms: number[]; // verfuegbare Stueckelungen in Cent (unbegrenzter Vorrat)
};

// change: das Kind legt das Rueckgeld (paid - price) mit den verfuegbaren Stueckelungen.
export type ChangeRound = {
  objective?: string;
  priceCents: number;
  paidCents: number;
  denoms: number[];
};

// Ein Artikel im Regal (shopping-Modus).
export type ShoppingItem = {
  name: string;
  emoji: string;
  priceCents: number;
};

// shopping: das Kind waehlt zuerst die richtigen Artikel (buyNames, Teilmenge
// von items) in den Korb, dann legt es die Gesamtsumme mit Muenzen/Scheinen.
export type ShoppingRound = {
  objective?: string;
  items: ShoppingItem[];
  buyNames: string[]; // Teilmenge von items[].name, 1-3 Artikel = der Einkaufsauftrag
  denoms: number[];
};

export type MoneyRound = PayRound | ChangeRound | ShoppingRound;

export type MoneyFeedback = {
  correct: string;
  wrongAmount: string;
  tryAgain: string;
  // shopping: falscher Artikel im Korb. Optional, faellt sonst auf
  // wrongAmount zurueck (additiv, bestehende Fixtures bleiben gueltig).
  wrongItem?: string;
};

export type MoneyRoom = {
  roomId: string;
  objective: string;
  mode: MoneyMode;
  rounds: MoneyRound[];
  feedback: MoneyFeedback;
  explanationAfterSuccess: string;
};

export type MoneyEngineSpec = {
  engine: "money";
  // Optional: deterministischer Seed fuer Kosmetik-Varianz (Theme, Deko).
  // Fehlt er, faellt der Renderer auf worldName zurueck.
  seed?: string;
  learningBrief: LearningBrief;
  world: WorldSpec;
  concept: {
    learningProblem: string;
    embodiedMetaphor: string;
    successInsight: string;
  };
  rooms: MoneyRoom[];
};

export function isPayRoom(room: MoneyRoom): boolean {
  return room.mode === "pay";
}
export function isChangeRoom(room: MoneyRoom): boolean {
  return room.mode === "change";
}

export function isValidDenom(cents: number): boolean {
  return EURO_DENOMS.includes(cents);
}

// Ist target mit unbegrenztem Vorrat der denoms exakt legbar? (Coin-DP)
export function canMakeAmount(target: number, denoms: number[]): boolean {
  if (target < 0) return false;
  if (target === 0) return true;
  const usable = denoms.filter((d) => d > 0);
  if (usable.length === 0) return false;
  const reachable = new Array(target + 1).fill(false);
  reachable[0] = true;
  for (let amount = 1; amount <= target; amount += 1) {
    for (const d of usable) {
      if (d <= amount && reachable[amount - d]) { reachable[amount] = true; break; }
    }
  }
  return reachable[target];
}
