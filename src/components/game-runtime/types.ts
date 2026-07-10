// src/components/game-runtime/types.ts — kanonische Definition (siehe .superpowers/sdd/protocol.md)

export type GameAffordance = {
  id: string; // stabile ID aus dem GDD, z. B. "c1.mural-1"
  x: number;
  y: number;
  width: number;
  height: number; // iframe-CSS-Pixel (Shell transformiert)
  state?: string; // optionaler Zustands-Marker, z. B. "locked" | "active"
};

export type ParentToShell = {
  type: "LOAD_GAME";
  source: string; // kompletter Spiel-Source (ES-Modul-Text)
  assets: Array<{ id: string; blob: Blob }>; // structured clone
  seed: string;
  device: "touch" | "desktop";
  width: number;
  height: number; // logische Basisauflösung des Spiels
};

export type ShellToParent =
  | { type: "GAME_READY" }
  | { type: "PROGRESS"; event: "score" | "goal" | "complete"; amount: number; goalId?: string; context?: Record<string, unknown> }
  | { type: "SPEAK"; text: string }
  | { type: "AFFORDANCES"; affordances: GameAffordance[] }
  | { type: "TELEMETRY"; event: string; payload?: Record<string, unknown> }
  | { type: "GAME_ERROR"; message: string; stack?: string };

export type GameManifest = {
  id: string;
  title: string;
  sourceUrl: string; // z. B. "/game-studio/games/egypt-tomb/game.js"
  width: number;
  height: number;
  seed: string;
  assets: Array<{ id: string; url: string }>;
};
