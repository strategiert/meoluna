import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const appPath = resolve(root, "src/App.tsx");
const labPath = resolve(root, "src/pages/admin/GameStudioLab.tsx");
const previewPath = resolve(root, "src/components/game-runtime/PhaserPreview.tsx");
const bridgePath = resolve(root, "src/components/game-runtime/bridge.ts");
const indexJsonPath = resolve(root, "public/game-studio/games/index.json");

const app = readFileSync(appPath, "utf8");
const lab = readFileSync(labPath, "utf8");
const preview = readFileSync(previewPath, "utf8");
const bridge = readFileSync(bridgePath, "utf8");

const failures = [];

// 1. App.tsx: Route + Import
if (!app.includes('path="/admin/game-studio"')) {
  failures.push('App.tsx must expose the route path="/admin/game-studio".');
}
if (!app.includes("import GameStudioLab from '@/pages/admin/GameStudioLab';")) {
  failures.push("App.tsx must import GameStudioLab.");
}

// 2. GameStudioLab.tsx: Admin-Gate
if (!lab.includes('role === "admin"') && !lab.includes('role !== "admin"')) {
  failures.push("GameStudioLab.tsx must guard access with an admin role check.");
}
if (!lab.includes("api.users.getUser")) {
  failures.push("GameStudioLab.tsx must query api.users.getUser.");
}

// 3. PhaserPreview.tsx: sandbox ohne allow-same-origin
if (!preview.includes('sandbox="allow-scripts"')) {
  failures.push('PhaserPreview.tsx must set sandbox="allow-scripts".');
}
if (preview.includes("allow-same-origin")) {
  failures.push("PhaserPreview.tsx must NOT include allow-same-origin in the sandbox attribute.");
}

// 4. bridge.ts: Origin-Guard + MessageChannel
if (!bridge.includes("e.source !== iframe.contentWindow")) {
  failures.push("bridge.ts must guard against messages whose source is not the iframe's contentWindow.");
}
if (!bridge.includes("MessageChannel")) {
  failures.push("bridge.ts must use MessageChannel for the handshake.");
}

// 5. index.json: parsbar + Pflichtfelder pro Spiel
let index;
try {
  index = JSON.parse(readFileSync(indexJsonPath, "utf8"));
} catch (err) {
  failures.push(`public/game-studio/games/index.json must be valid JSON: ${err.message}`);
}
if (index) {
  if (!Array.isArray(index.games) || index.games.length === 0) {
    failures.push("index.json must contain a non-empty games array.");
  } else {
    for (const game of index.games) {
      for (const field of ["sourceUrl", "width", "height", "seed"]) {
        if (game[field] === undefined || game[field] === null || game[field] === "") {
          failures.push(`Game '${game.id ?? "?"}' in index.json is missing required field '${field}'.`);
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OK");
