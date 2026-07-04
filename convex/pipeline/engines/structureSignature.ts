// Struktur-Signatur einer Engine-Spec: deterministischer Hash ueber das
// SKELETT einer Welt (Modi, Raum-/Rundenzahlen, Array-Laengen, numerische
// Parameter, Theme), bewusst OHNE Text-/Emoji-Content.
//
// Zweck: "keine zwei Welten strukturell identisch" messbar machen.
// Zwei Welten mit gleicher Signatur haben dasselbe Spiel-Skelett und
// unterscheiden sich nur im Content — das wollen wir erkennen koennen.
// Genutzt von scripts/uniqueness-check.mjs (CI); spaeter optional als
// Speicherzeit-Gate.

const THEME_COUNT = 5; // muss zu KID_THEMES in kidKit.ts passen

export function hashStringDjb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// Repliziert die Theme-Wahl des Renderers (mulberry32, erster Zug).
export function themeIndexForSeed(seedText: string): number {
  let a = hashStringDjb2(String(seedText || "meoluna")) | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return Math.floor(r * THEME_COUNT) % THEME_COUNT;
}

type AnySpec = {
  engine?: string;
  seed?: string;
  world?: { worldName?: string };
  rooms?: unknown[];
};

// Strukturelle Reduktion eines Wertes: Arrays -> Laenge + Element-Struktur,
// Zahlen -> Wert, Strings -> nur "s" (Content zaehlt nicht), Objekte -> rekursiv.
function structuralToken(value: unknown, depth: number): string {
  if (depth > 4) return "x";
  if (Array.isArray(value)) {
    return "a" + value.length + "[" + value.map((v) => structuralToken(v, depth + 1)).join(",") + "]";
  }
  if (typeof value === "number") return "n" + value;
  if (typeof value === "boolean") return value ? "b1" : "b0";
  if (typeof value === "string") return "s";
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return "o{" + keys.map((k) => k + ":" + structuralToken(obj[k], depth + 1)).join(",") + "}";
  }
  return "_";
}

// Felder, die pro Raum strukturell zaehlen. "mode"/"type"/"variant" sind
// Strings, tragen aber STRUKTUR (nicht Content) — deshalb wortwoertlich rein.
const ROOM_DISCRIMINATORS = ["mode", "type", "variant", "kind", "chartType"];

export function structureSignatureText(spec: AnySpec): string {
  const parts: string[] = [];
  parts.push("engine=" + (spec.engine || "unknown"));
  const seed = spec.seed || spec.world?.worldName || "meoluna";
  parts.push("theme=" + themeIndexForSeed(String(seed)));

  const rooms = Array.isArray(spec.rooms) ? spec.rooms : [];
  parts.push("rooms=" + rooms.length);
  rooms.forEach((room, index) => {
    const r = (room || {}) as Record<string, unknown>;
    const disc = ROOM_DISCRIMINATORS.map((k) => (typeof r[k] === "string" ? r[k] : "")).join("|");
    const rounds = Array.isArray(r.rounds) ? (r.rounds as unknown[]) : [];
    const roundTokens = rounds.map((round) => {
      const rr = (round || {}) as Record<string, unknown>;
      const keys = Object.keys(rr).filter((k) => k !== "objective").sort();
      return "{" + keys.map((k) => k + ":" + structuralToken(rr[k], 0)).join(",") + "}";
    });
    parts.push("room" + index + "=" + disc + "#" + rounds.length + ":" + roundTokens.join(";"));
  });
  return parts.join("\n");
}

export function structureSignature(spec: AnySpec): string {
  const text = structureSignatureText(spec);
  // Zwei unabhaengige djb2-Varianten fuer 64 Bit Kollisionsfestigkeit.
  const h1 = hashStringDjb2(text);
  let h2 = 0;
  for (let i = 0; i < text.length; i += 1) h2 = (Math.imul(h2, 33) ^ text.charCodeAt(i)) >>> 0;
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}
