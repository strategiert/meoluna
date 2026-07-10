import { chromium } from "playwright";
import { startServer, tapAffordance } from "./lib/harness.mjs";

let failed = 0;
const fail = (msg) => { failed += 1; console.error("FAIL:", msg); };

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
  await page.evaluate((u) => window.__loadGame(u, "check-seed", { width: 960, height: 960, device: "desktop" }), `${base}/fixtures/hello-game.js`);
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
