// Gemeinsamer Harness fuer alle Game-Studio-Playwright-Checks (Runtime-Check + Playthrough-Executor).
// Stellt Static-Server, Parent-Harness-Seite (Handshake + LOAD_GAME) und Tap-Helper bereit.
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".webp": "image/webp" };

// Inline-Harness: Parent-Seite, die Handshake + LOAD_GAME macht und Events in window.__gs sammelt.
// Das iframe fuellt den kompletten Browser-Viewport (Playwright-Page), damit Phaser Scale.FIT
// gegen die tatsaechliche Ziel-Geraete-Groesse skaliert (relevant fuer Touch-Target-Gate).
export const HARNESS = `<!DOCTYPE html><html><body style="margin:0">
<iframe id="gf" src="/game-runtime/v1/index.html" sandbox="allow-scripts" style="position:fixed;inset:0;width:100vw;height:100vh;border:0;display:block"></iframe>
<script>
window.__gs = { ready: false, gameReady: false, events: [], affordances: [], errors: [] };
const iframe = document.getElementById("gf");
let port = null;
window.addEventListener("message", (e) => {
  if (e.source !== iframe.contentWindow) return;
  if (e.data && e.data.type === "MEOLUNA_RUNTIME_READY" && !port) {
    const ch = new MessageChannel();
    port = ch.port1;
    port.onmessage = (pe) => {
      const m = pe.data;
      window.__gs.events.push(m);
      if (m.type === "GAME_READY") window.__gs.gameReady = true;
      if (m.type === "AFFORDANCES") window.__gs.affordances = m.affordances;
      if (m.type === "GAME_ERROR") window.__gs.errors.push(m.message);
    };
    window.__gs.ready = true;
    iframe.contentWindow.postMessage({ type: "MEOLUNA_INIT" }, "*", [ch.port2]);
  }
});
window.__loadGame = async (sourceUrl, seed, opts) => {
  const o = opts || {};
  const source = await (await fetch(sourceUrl)).text();
  const assetDefs = o.assets || [];
  const assets = [];
  for (const a of assetDefs) {
    const blob = await (await fetch(a.url)).blob();
    assets.push({ id: a.id, blob });
  }
  port.postMessage({ type: "LOAD_GAME", source, assets, seed, device: o.device || "desktop", width: o.width || 960, height: o.height || 960 });
};
window.__loadRaw = (source, opts) => {
  const o = opts || {};
  port.postMessage({ type: "LOAD_GAME", source, assets: [], seed: o.seed || "x", device: o.device || "desktop", width: o.width || 960, height: o.height || 960 });
};
</script></body></html>`;

export function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = req.url.split("?")[0];
      if (url === "/harness.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(HARNESS); return; }
      if (url === "/fixtures/hello-game.js") {
        res.writeHead(200, { "content-type": "text/javascript" });
        res.end(readFileSync(join(ROOT, "scripts", "game-studio", "fixtures", "hello-game.js")));
        return;
      }
      const file = join(ROOT, "public", url.replace(/^\//, ""));
      if (existsSync(file)) {
        res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
        res.end(readFileSync(file));
      } else { res.writeHead(404); res.end(); }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

export async function tapAffordance(page, id) {
  const a = await page.evaluate((aid) => (window.__gs.affordances || []).find((x) => x.id === aid), id);
  if (!a) throw new Error(`Affordance ${id} nicht gefunden`);
  const rect = await page.evaluate(() => {
    const r = document.getElementById("gf").getBoundingClientRect();
    return { left: r.left, top: r.top };
  });
  await page.mouse.click(rect.left + a.x + a.width / 2, rect.top + a.y + a.height / 2);
}
