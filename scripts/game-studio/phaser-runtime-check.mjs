import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".webp": "image/webp" };
let failed = 0;
const fail = (msg) => { failed += 1; console.error("FAIL:", msg); };

// Inline-Harness: Parent-Seite, die Handshake + LOAD_GAME macht und Events in window.__gs sammelt.
const HARNESS = `<!DOCTYPE html><html><body style="margin:0">
<iframe id="gf" src="/game-runtime/v1/index.html" sandbox="allow-scripts" style="width:960px;height:960px;border:0"></iframe>
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
window.__loadGame = async (sourceUrl, seed) => {
  const source = await (await fetch(sourceUrl)).text();
  port.postMessage({ type: "LOAD_GAME", source, assets: [], seed, device: "desktop", width: 960, height: 960 });
};
window.__loadRaw = (source) => {
  port.postMessage({ type: "LOAD_GAME", source, assets: [], seed: "x", device: "desktop", width: 960, height: 960 });
};
</script></body></html>`;

function startServer() {
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

async function tapAffordance(page, id) {
  const a = await page.evaluate((aid) => (window.__gs.affordances || []).find((x) => x.id === aid), id);
  if (!a) throw new Error(`Affordance ${id} nicht gefunden`);
  const rect = await page.evaluate(() => {
    const r = document.getElementById("gf").getBoundingClientRect();
    return { left: r.left, top: r.top };
  });
  await page.mouse.click(rect.left + a.x + a.width / 2, rect.top + a.y + a.height / 2);
}

const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
let externalRequests = 0;
page.on("request", (r) => { if (r.url().startsWith("https://example.com")) externalRequests += 1; });

try {
  await page.goto(`${base}/harness.html`);
  await page.waitForFunction(() => window.__gs.ready, null, { timeout: 5000 }).catch(() => fail("RUNTIME_READY/Handshake kam nicht an"));

  const t0 = Date.now();
  await page.evaluate((u) => window.__loadGame(u, "check-seed"), `${base}/fixtures/hello-game.js`);
  await page.waitForFunction(() => window.__gs.gameReady, null, { timeout: 5000 }).catch(() => fail("GAME_READY nicht < 5s"));
  if (Date.now() - t0 >= 5000) fail("GAME_READY-Latenz >= 5s");

  await page.waitForFunction(() => window.__gs.affordances.some((a) => a.id === "hello.start"), null, { timeout: 3000 });
  await tapAffordance(page, "hello.start");
  for (const sid of ["hello.star-1", "hello.star-2", "hello.star-3"]) {
    await page.waitForFunction((aid) => window.__gs.affordances.some((a) => a.id === aid), sid, { timeout: 3000 }).catch(() => fail(`${sid} fehlt`));
    await tapAffordance(page, sid);
    await page.waitForTimeout(150);
  }
  const completes = await page.evaluate(() => window.__gs.events.filter((e) => e.type === "PROGRESS" && e.event === "complete").length);
  if (completes !== 1) fail(`complete kam ${completes}x, erwartet 1x`);
  const goals = await page.evaluate(() => window.__gs.events.filter((e) => e.type === "PROGRESS" && e.event === "goal" && e.goalId === "goal-demo").length);
  if (goals !== 1) fail(`goal-demo kam ${goals}x, erwartet 1x`);

  // CSP-Probe in frischer Seite (booted-Flag der Shell erlaubt nur ein LOAD_GAME)
  const page2 = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
  page2.on("request", (r) => { if (r.url().startsWith("https://example.com")) externalRequests += 1; });
  await page2.goto(`${base}/harness.html`);
  await page2.waitForFunction(() => window.__gs.ready, null, { timeout: 5000 });
  await page2.evaluate(() => window.__loadRaw('export function bootMeolunaGame(){ fetch("https://example.com/x").then(()=>{}).catch(()=>{}); }'));
  await page2.waitForTimeout(1500);
  if (externalRequests > 0) fail("CSP hat externen fetch NICHT geblockt");
  await page2.close();

  // Doppel-LOAD auf Seite 1
  await page.evaluate(() => window.__loadRaw("export function bootMeolunaGame(){}"));
  await page.waitForTimeout(300);
  const dupErr = await page.evaluate(() => window.__gs.errors.some((m) => m.includes("doppelt")));
  if (!dupErr) fail("Doppeltes LOAD_GAME erzeugte keinen GAME_ERROR");

  const fatalConsole = consoleErrors.filter((t) => !t.includes("example.com"));
  if (fatalConsole.length) fail(`Konsolenfehler: ${fatalConsole.join(" | ")}`);
} finally {
  await browser.close();
  server.close();
}
if (failed > 0) { console.error(`phaser-runtime-check: ${failed} Fehler`); process.exit(1); }
console.log("phaser-runtime-check: OK");
