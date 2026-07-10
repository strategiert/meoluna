# Game Studio V3 — Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parallele Phaser-Testumgebung (V3) neben den bestehenden 14 React-Engines: versionierte Runtime-Shell, sichere Bridge, Source-Validator, generischer Playthrough-Executor und zwei handgebaute Ägypten-Spiele — komplett getrennt vom produktiven Rendering-Pfad.

**Architecture:** Spiele sind Plain-JS-Module (`bootMeolunaGame(context)`), laufen in einem sandboxed iframe (opake Origin + CSP) auf einer statischen Runtime-Shell unter `public/game-runtime/v1/`. Parent-Kommunikation ausschließlich über MessageChannel. QA über eigenständige `.mjs`-Scripts nach Repo-Konvention (Playwright, `process.exit(1)` bei Fail). Kein Touch an `Sandbox.tsx`, `WorldView.tsx`, `convex/schema.ts` oder `convex/pipeline/engines/`.

**Tech Stack:** Phaser 4.2.1 (exakt gepinnt), React 18 (nur Lab-Seite), Playwright ^1.61 (devDep vorhanden), esbuild (transitiv vorhanden, gleiche Nutzung wie `visual-regression.mjs`), TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-07-10-generative-game-studio-design.md` (Abschnitte 5, 8, 10, 12)

## Global Constraints

- `phaser@4.2.1` exakt im Lockfile (`npm install --save-exact phaser@4.2.1`).
- Spiele: Plain JavaScript, kein React/JSX, kein `import` (statisch wie dynamisch), Phaser nur über `window.Phaser`, genau ein Export: `bootMeolunaGame(context)`.
- Kein `Math.random`, kein `Date.now()`/`performance.now()` in Spiellogik. Zufall: seeded PRNG (mulberry32 + djb2, Konvention aus `convex/pipeline/engines/kidKit.ts`). Zeit: Phaser-Clock (`this.time`).
- Basisauflösung pro Spiel aus festem Set: `1280x720` | `720x1280` | `960x960`. Phaser Scale `FIT`, zentriert.
- Touch-Ziele ≥ 48 CSS-px nach FIT-Skalierung im kleinsten Ziel-Viewport (`390x844`).
- Budgets: Source ≤ 250 KB, ≤ 12 Bitmap-Assets, ≤ 2 Audio-Assets, ≤ 5 MB gesamt.
- iframe: `sandbox="allow-scripts"` OHNE `allow-same-origin`. CSP per `<meta>` in der Shell.
- Ton startet stumm; Aktivierung nur durch Nutzergeste.
- Alle Mechaniken tap-only spielbar (kein Pflicht-Drag, kein Hover, kein Rechtsklick).
- UI-Texte Deutsch mit echten Umlauten (ä, ö, ü, ß).
- QA-Scripts: `.mjs`, still bei Pass, `process.exit(1)` bei Fail; `node --import tsx/esm` nur wenn `.ts` importiert wird.
- Bestehende Dateien NICHT anfassen: `src/components/Sandbox.tsx`, `src/components/WorldPreview.tsx`, `src/pages/WorldView.tsx`, `convex/schema.ts`, alles unter `convex/pipeline/`.
- Neue Fixtures/Dateien alphabetisch NACH Bestand benennen, wo Verzeichnisse alphabetisch geladen werden.

---

## Zentrales Protokoll (Referenz für alle Tasks)

Alle Tasks implementieren gegen diese Verträge. Bei Konflikt gilt dieser Abschnitt.

### Handshake

1. Shell (iframe) sendet wiederholt (alle 200 ms, max. 25x) an `window.parent` via `postMessage({ type: "MEOLUNA_RUNTIME_READY", version: "v1" }, "*")`, bis INIT ankommt.
2. Parent validiert `event.source === iframe.contentWindow`, antwortet mit `iframe.contentWindow.postMessage({ type: "MEOLUNA_INIT" }, "*", [channel.port2])` — MessageChannel, `port1` bleibt beim Parent.
3. Ab jetzt läuft ALLES über den Port. Window-Level-Messages werden beidseitig ignoriert.

### Nachrichten (über MessagePort)

```ts
// src/components/game-runtime/types.ts — kanonische Definition
export type GameAffordance = {
  id: string;          // stabile ID aus dem GDD, z. B. "c1.mural-1"
  x: number; y: number; width: number; height: number; // iframe-CSS-Pixel (Shell transformiert)
  state?: string;      // optionaler Zustands-Marker, z. B. "locked" | "active"
};

export type ParentToShell = {
  type: "LOAD_GAME";
  source: string;                                   // kompletter Spiel-Source (ES-Modul-Text)
  assets: Array<{ id: string; blob: Blob }>;        // structured clone
  seed: string;
  device: "touch" | "desktop";
  width: number; height: number;                    // logische Basisauflösung des Spiels
};

export type ShellToParent =
  | { type: "GAME_READY" }
  | { type: "PROGRESS"; event: "score" | "goal" | "complete"; amount: number; goalId?: string; context?: Record<string, unknown> }
  | { type: "SPEAK"; text: string }
  | { type: "AFFORDANCES"; affordances: GameAffordance[] }
  | { type: "TELEMETRY"; event: string; payload?: Record<string, unknown> }
  | { type: "GAME_ERROR"; message: string; stack?: string };
```

### Spiel-Kontext (von der Shell gebaut, einziges Argument von `bootMeolunaGame`)

```js
{
  parentId: "meoluna-game-root",   // DOM-Container-ID in der Shell
  width, height,                    // logische Basisauflösung (aus LOAD_GAME)
  device,                           // "touch" | "desktop"
  seed,                             // string, artifact-fix
  assets,                           // Record<assetId, blobUrl>
  api: {
    reportScore(amount, context),         // -> PROGRESS event:"score"
    completeGoal(goalId, evidence),       // -> PROGRESS event:"goal", amount:0, goalId
    completeGame(summary),                // -> PROGRESS event:"complete", amount = summary?.finalScore ?? 0
    speak(text),                          // -> SPEAK (max 500 Zeichen)
    emit(event, payload),                 // -> TELEMETRY
    setAffordances(list, base),           // list: LOGISCHE Koordinaten; base: {width,height};
                                          // Shell rechnet via canvas.getBoundingClientRect() in CSS-px um -> AFFORDANCES
  }
}
```

### Affordance-Koordinaten-Transformation (Shell)

```js
// Spiel meldet logische Koordinaten; Shell transformiert:
const rect = document.querySelector("#meoluna-game-root canvas").getBoundingClientRect();
const sx = rect.width / base.width, sy = rect.height / base.height;
cssX = rect.left + a.x * sx; cssY = rect.top + a.y * sy;
cssW = a.width * sx;         cssH = a.height * sy;
```

Der Playthrough-Harness addiert danach den iframe-Offset in der Parent-Seite.

### Playthrough-Plan-Format

```ts
// convex/gameStudio/types.ts
export type PlanStep =
  | { op: "waitFor"; affordance: string; timeoutMs?: number }   // Affordance sichtbar (default 10000)
  | { op: "tap"; affordance: string }                            // echter Pointer-Klick auf Mitte
  | { op: "waitTelemetry"; event: string; timeoutMs?: number }
  | { op: "assertGoal"; goalId: string }                         // PROGRESS goal muss gefallen sein
  | { op: "assertComplete" }                                     // genau EIN complete bis hier
  | { op: "wait"; ms: number }
  | { op: "screenshot"; name: string };

export type PlaythroughPlan = { game: string; seed: string; steps: PlanStep[] };
```

---

### Task 1: Phaser-Paket + Runtime-Shell + Runtime-Check

**Files:**
- Modify: `package.json` (dependency `phaser`)
- Create: `public/game-runtime/v1/index.html`
- Create: `public/game-runtime/v1/runtime.js`
- Create: `public/game-runtime/v1/phaser-4.2.1.min.js` (Kopie aus node_modules)
- Create: `scripts/game-studio/fixtures/hello-game.js`
- Test: `scripts/game-studio/phaser-runtime-check.mjs`

**Interfaces:**
- Produces: Handshake + Nachrichten-Protokoll exakt wie oben; Shell unter `/game-runtime/v1/index.html`.
- Consumes: nichts (erster Task).

- [ ] **Step 1: Phaser installieren und Bundle kopieren**

```powershell
npm install --save-exact phaser@4.2.1
Copy-Item node_modules/phaser/dist/phaser.min.js public/game-runtime/v1/phaser-4.2.1.min.js
```

Erwartung: `package.json` enthält `"phaser": "4.2.1"` (ohne Caret). Datei ~1.38 MB vorhanden.

- [ ] **Step 2: `public/game-runtime/v1/index.html` schreiben**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; script-src 'self' blob:; img-src blob: data:; media-src blob:; connect-src blob:; worker-src blob:; style-src 'unsafe-inline'" />
  <title>Meoluna Game Runtime v1</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #0a0a14; overflow: hidden; }
    #meoluna-game-root { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    #meoluna-game-root canvas { max-width: 100%; max-height: 100%; }
  </style>
</head>
<body>
  <div id="meoluna-game-root"></div>
  <script src="./phaser-4.2.1.min.js"></script>
  <script src="./runtime.js"></script>
</body>
</html>
```

Hinweis Sicherheit: `script-src 'self'` bezieht sich auf die URL-Origin des Dokuments (nicht auf die opake Browsing-Context-Origin) — der Runtime-Check in Step 5 verifiziert genau das: Shell-Scripts laden, `fetch` nach außen scheitert.

- [ ] **Step 3: `public/game-runtime/v1/runtime.js` schreiben**

```js
/* Meoluna Game Runtime Shell v1. Läuft in sandboxed iframe (opake Origin).
   Kommunikation ausschließlich über MessagePort (Handshake siehe Plan/Spec 5.2). */
(function () {
  "use strict";
  var port = null;
  var booted = false;
  var lastBase = null;

  function send(msg) { if (port) port.postMessage(msg); }

  function reportError(message, stack) {
    send({ type: "GAME_ERROR", message: String(message || "Unbekannter Fehler"), stack: stack ? String(stack) : undefined });
  }

  window.addEventListener("error", function (e) {
    reportError(e.message, e.error && e.error.stack);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason || {};
    reportError(r.message || String(e.reason), r.stack);
  });

  function transformAffordances(list, base) {
    var canvas = document.querySelector("#meoluna-game-root canvas");
    if (!canvas || !base) return [];
    var rect = canvas.getBoundingClientRect();
    var sx = rect.width / base.width;
    var sy = rect.height / base.height;
    return list.map(function (a) {
      return {
        id: a.id,
        x: rect.left + a.x * sx,
        y: rect.top + a.y * sy,
        width: a.width * sx,
        height: a.height * sy,
        state: a.state,
      };
    });
  }

  function buildContext(payload, assetUrls) {
    return {
      parentId: "meoluna-game-root",
      width: payload.width,
      height: payload.height,
      device: payload.device,
      seed: payload.seed,
      assets: assetUrls,
      api: {
        reportScore: function (amount, context) {
          send({ type: "PROGRESS", event: "score", amount: Number(amount) || 0, context: context || {} });
        },
        completeGoal: function (goalId, evidence) {
          send({ type: "PROGRESS", event: "goal", amount: 0, goalId: String(goalId), context: evidence || {} });
        },
        completeGame: function (summary) {
          var s = summary || {};
          send({ type: "PROGRESS", event: "complete", amount: Number(s.finalScore) || 0, context: s });
        },
        speak: function (text) {
          send({ type: "SPEAK", text: String(text || "").slice(0, 500) });
        },
        emit: function (event, payloadData) {
          send({ type: "TELEMETRY", event: String(event), payload: payloadData || {} });
        },
        setAffordances: function (list, base) {
          lastBase = base || lastBase;
          send({ type: "AFFORDANCES", affordances: transformAffordances(list || [], lastBase) });
        },
      },
    };
  }

  async function loadGame(payload) {
    if (booted) { reportError("LOAD_GAME wurde doppelt gesendet."); return; }
    booted = true;
    try {
      var assetUrls = {};
      (payload.assets || []).forEach(function (a) {
        assetUrls[a.id] = URL.createObjectURL(a.blob);
      });
      var srcUrl = URL.createObjectURL(new Blob([payload.source], { type: "text/javascript" }));
      var mod = await import(srcUrl);
      if (typeof mod.bootMeolunaGame !== "function") {
        reportError("Spiel exportiert kein bootMeolunaGame.");
        return;
      }
      await mod.bootMeolunaGame(buildContext(payload, assetUrls));
      requestAnimationFrame(function () { send({ type: "GAME_READY" }); });
    } catch (err) {
      reportError(err && err.message, err && err.stack);
    }
  }

  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "MEOLUNA_INIT" || !e.ports || !e.ports[0]) return;
    if (port) return; // nur ein INIT
    port = e.ports[0];
    port.onmessage = function (pe) {
      if (pe.data && pe.data.type === "LOAD_GAME") loadGame(pe.data);
    };
    clearInterval(readyTimer);
  });

  var attempts = 0;
  var readyTimer = setInterval(function () {
    attempts += 1;
    if (port || attempts > 25) { clearInterval(readyTimer); return; }
    try { window.parent.postMessage({ type: "MEOLUNA_RUNTIME_READY", version: "v1" }, "*"); } catch (_) {}
  }, 200);
  try { window.parent.postMessage({ type: "MEOLUNA_RUNTIME_READY", version: "v1" }, "*"); } catch (_) {}
})();
```

- [ ] **Step 4: Hello-Game-Fixture `scripts/game-studio/fixtures/hello-game.js` schreiben**

Minimales, protokoll-vollständiges Testspiel (960x960): Start-Button, 3 Sterne antippen, `completeGoal("goal-demo")`, `completeGame`. Nutzt seeded PRNG, meldet Affordances.

```js
// Testspiel für Runtime- und Playthrough-Checks. KEIN Produktionsspiel.
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootMeolunaGame(context) {
  const rnd = mulberry32(djb2(context.seed));
  const W = context.width, H = context.height;
  let stars = [];
  let found = 0;
  let started = false;

  class MainScene extends window.Phaser.Scene {
    create() {
      const g = this.add.graphics();
      g.fillStyle(0x1a1a2e, 1).fillRect(0, 0, W, H);
      const startBtn = this.add.rectangle(W / 2, H / 2, 300, 120, 0x4a7c59).setInteractive();
      const label = this.add.text(W / 2, H / 2, "Start", { fontSize: "48px", color: "#ffffff" }).setOrigin(0.5);
      context.api.setAffordances([{ id: "hello.start", x: W / 2 - 150, y: H / 2 - 60, width: 300, height: 120 }], { width: W, height: H });
      startBtn.on("pointerdown", () => {
        if (started) return;
        started = true;
        startBtn.destroy(); label.destroy();
        context.api.emit("game:started", {});
        for (let i = 0; i < 3; i += 1) {
          const x = 160 + Math.floor(rnd() * (W - 320));
          const y = 160 + Math.floor(rnd() * (H - 320));
          const star = this.add.star(x, y, 5, 24, 56, 0xffd166).setInteractive();
          stars.push({ id: `hello.star-${i + 1}`, x: x - 56, y: y - 56, width: 112, height: 112, obj: star });
          star.on("pointerdown", () => {
            star.destroy();
            found += 1;
            context.api.reportScore(10, { star: i + 1 });
            stars = stars.filter((s) => s.obj !== star);
            context.api.setAffordances(stars.map(({ id, x: ax, y: ay, width, height }) => ({ id, x: ax, y: ay, width, height })), { width: W, height: H });
            if (found === 3) {
              context.api.completeGoal("goal-demo", { found });
              context.api.completeGame({ finalScore: 30 });
            }
          });
        }
        context.api.setAffordances(stars.map(({ id, x: ax, y: ay, width, height }) => ({ id, x: ax, y: ay, width, height })), { width: W, height: H });
      });
    }
  }

  new window.Phaser.Game({
    type: window.Phaser.AUTO,
    parent: context.parentId,
    width: W,
    height: H,
    scale: { mode: window.Phaser.Scale.FIT, autoCenter: window.Phaser.Scale.CENTER_BOTH },
    backgroundColor: "#0a0a14",
    scene: [MainScene],
  });
}
```

- [ ] **Step 5: `scripts/game-studio/phaser-runtime-check.mjs` schreiben**

Playwright-Check ohne tsx (kein TS-Import). Startet Mini-HTTP-Server über `public/`, lädt eine Harness-Testseite, prüft:
1. `MEOLUNA_RUNTIME_READY` kommt an.
2. Nach `LOAD_GAME` mit hello-game kommt `GAME_READY` < 5 s.
3. `tap` auf Start via Affordance-Koordinaten → Sterne → `PROGRESS complete` genau 1x.
4. CSP-Probe: `LOAD_GAME` mit Source, der `fetch("https://example.com")` versucht → kein erfolgreicher Request (Response-Listener), `GAME_ERROR` oder still geschluckt, aber Spiel ohne Netz-Erfolg.
5. Doppeltes `LOAD_GAME` → `GAME_ERROR`, kein Crash.

```js
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
```

- [ ] **Step 6: npm-Script eintragen**

In `package.json` scripts ergänzen:

```json
"game-runtime-check": "node scripts/game-studio/phaser-runtime-check.mjs",
```

- [ ] **Step 7: Check ausführen**

Run: `npm run game-runtime-check`
Expected: `phaser-runtime-check: OK`, Exit 0. Falls die CSP-Probe zeigt, dass `script-src 'self'` in der sandboxed Origin die Shell-Scripts blockiert (Symptom: kein RUNTIME_READY): CSP-Fallback dokumentieren und umsetzen — `script-src` um explizite eigene Origin ergänzen ist NICHT möglich (dev localhost vs. prod); stattdessen Phaser+Runtime als ein Inline-Script mit `'sha256-…'`-Hash referenzieren wäre Umbau → in dem Fall STOPPEN und im Haupt-Thread eskalieren, nicht raten.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json public/game-runtime scripts/game-studio
git commit -m "feat(game-studio): Phaser 4.2.1 Runtime-Shell v1 mit MessagePort-Bridge und Runtime-Check"
```

---

### Task 2: Bridge (Parent), PhaserPreview, Lab-Route

**Files:**
- Create: `src/components/game-runtime/types.ts`
- Create: `src/components/game-runtime/bridge.ts`
- Create: `src/components/game-runtime/PhaserPreview.tsx`
- Create: `src/pages/admin/GameStudioLab.tsx`
- Modify: `src/App.tsx` (eine Route + ein Import)
- Create: `public/game-studio/games/index.json`
- Test: `scripts/game-studio/game-studio-lab-check.mjs`

**Interfaces:**
- Consumes: Shell-Protokoll aus Task 1.
- Produces: `createGameBridge(iframe, handlers): { load(payload: ParentToShell): void; dispose(): void }`; `<PhaserPreview manifest={GameManifest} onEvent={(e: ShellToParent) => void} />`; `GameManifest = { id: string; title: string; sourceUrl: string; width: number; height: number; seed: string; assets: Array<{ id: string; url: string }> }`.

- [ ] **Step 1: `types.ts` schreiben** — exakt die Typen aus „Zentrales Protokoll" plus:

```ts
export type GameManifest = {
  id: string;
  title: string;
  sourceUrl: string;          // z. B. "/game-studio/games/egypt-tomb/game.js"
  width: number;
  height: number;
  seed: string;
  assets: Array<{ id: string; url: string }>;
};
```

- [ ] **Step 2: `bridge.ts` schreiben**

```ts
import type { ParentToShell, ShellToParent } from "./types";

const SHELL_TYPES = new Set(["GAME_READY", "PROGRESS", "SPEAK", "AFFORDANCES", "TELEMETRY", "GAME_ERROR"]);

export type BridgeHandlers = {
  onMessage: (msg: ShellToParent) => void;
  onHandshake?: () => void;
};

export function createGameBridge(iframe: HTMLIFrameElement, handlers: BridgeHandlers) {
  let port: MessagePort | null = null;
  let pending: ParentToShell | null = null;

  const onWindowMessage = (e: MessageEvent) => {
    if (e.source !== iframe.contentWindow) return;
    if (!e.data || e.data.type !== "MEOLUNA_RUNTIME_READY" || port) return;
    const channel = new MessageChannel();
    port = channel.port1;
    port.onmessage = (pe: MessageEvent) => {
      const msg = pe.data as ShellToParent;
      if (!msg || typeof msg.type !== "string" || !SHELL_TYPES.has(msg.type)) return;
      handlers.onMessage(msg);
    };
    iframe.contentWindow?.postMessage({ type: "MEOLUNA_INIT" }, "*", [channel.port2]);
    handlers.onHandshake?.();
    if (pending) { port.postMessage(pending); pending = null; }
  };

  window.addEventListener("message", onWindowMessage);

  return {
    load(payload: ParentToShell) {
      if (port) port.postMessage(payload);
      else pending = payload;
    },
    dispose() {
      window.removeEventListener("message", onWindowMessage);
      port?.close();
      port = null;
    },
  };
}
```

- [ ] **Step 3: `PhaserPreview.tsx` schreiben**

Verantwortung: iframe rendern (sandbox="allow-scripts", src="/game-runtime/v1/index.html"), Manifest laden (Source-Text + Asset-Blobs via fetch im Parent), `bridge.load(...)` nach Handshake, 5-s-Watchdog auf GAME_READY, Events an `onEvent` durchreichen, `dispose()` + iframe-Unmount als Cleanup. Container: `aspect-ratio: width/height`, max 100%.

```tsx
import { useEffect, useRef, useState } from "react";
import { createGameBridge } from "./bridge";
import type { GameManifest, ShellToParent } from "./types";

type Props = { manifest: GameManifest; onEvent?: (msg: ShellToParent) => void };

export default function PhaserPreview({ manifest, onEvent }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let cancelled = false;
    const watchdog = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
      setErrorText((t) => t ?? "Spiel hat nicht innerhalb von 5 Sekunden geladen (GAME_READY fehlt).");
    }, 5000);

    const bridge = createGameBridge(iframe, {
      onMessage: (msg) => {
        if (msg.type === "GAME_READY") { setStatus("ready"); window.clearTimeout(watchdog); }
        if (msg.type === "GAME_ERROR") { setStatus("error"); setErrorText(msg.message); }
        onEvent?.(msg);
      },
    });

    (async () => {
      const source = await (await fetch(manifest.sourceUrl)).text();
      const assets = await Promise.all(
        manifest.assets.map(async (a) => ({ id: a.id, blob: await (await fetch(a.url)).blob() })),
      );
      if (cancelled) return;
      bridge.load({
        type: "LOAD_GAME",
        source,
        assets,
        seed: manifest.seed,
        device: "ontouchstart" in window ? "touch" : "desktop",
        width: manifest.width,
        height: manifest.height,
      });
    })().catch((err) => { setStatus("error"); setErrorText(String(err?.message ?? err)); });

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      bridge.dispose();
    };
  }, [manifest, onEvent]);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${manifest.width} / ${manifest.height}`, maxHeight: "80vh" }}>
      <iframe
        ref={iframeRef}
        title={manifest.title}
        src="/game-runtime/v1/index.html"
        sandbox="allow-scripts"
        className="h-full w-full rounded-lg border border-white/10 bg-[#0a0a14]"
      />
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-950/80 p-6 text-red-100">
          <div>
            <p className="font-semibold">Spiel konnte nicht geladen werden.</p>
            <p className="mt-2 text-sm opacity-80">{errorText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `public/game-studio/games/index.json` anlegen** (zunächst nur hello-game; Slice-Spiele registrieren sich in Task 6/7)

```json
{
  "games": [
    {
      "id": "hello-game",
      "title": "Hello Game (Runtime-Test)",
      "sourceUrl": "/game-studio/games/hello-game/game.js",
      "width": 960,
      "height": 960,
      "seed": "hello-seed-1",
      "assets": []
    }
  ]
}
```

Dazu: `scripts/game-studio/fixtures/hello-game.js` nach `public/game-studio/games/hello-game/game.js` kopieren (Quelle bleibt die Fixture; Kopie ist bewusst, damit Lab ohne Scripts läuft).

- [ ] **Step 5: `GameStudioLab.tsx` schreiben**

Admin-Gate exakt nach Muster `src/pages/admin/AdminHome.tsx:125-165` (`useUser()` + `useQuery(api.users.getUser, user?.id ? {} : "skip")`, Nicht-Admin → Hinweis-Karte). Inhalt: Spiel-Auswahl aus `/game-studio/games/index.json` (fetch + useState), links Spieleliste, rechts `<PhaserPreview>`, darunter Event-Log (letzte 50 `ShellToParent`-Events als JSON-Zeilen, PROGRESS/GAME_ERROR farblich hervorgehoben). Überschrift: „Game Studio V3 (Testumgebung)". Keine Convex-Writes, keine XP-Verbuchung — reine Sichtprüfung.

- [ ] **Step 6: Route in `src/App.tsx` ergänzen**

```tsx
import GameStudioLab from '@/pages/admin/GameStudioLab';
// bei den Admin-Routen:
<Route path="/admin/game-studio" element={<GameStudioLab />} />
```

- [ ] **Step 7: `scripts/game-studio/game-studio-lab-check.mjs` schreiben** (Muster `scripts/admin-panel-route-check.mjs`: statische Checks ohne Browser)

Prüft per `readFileSync` + Regex:
1. `src/App.tsx` enthält `path="/admin/game-studio"` und den Import.
2. `GameStudioLab.tsx` enthält `role === "admin"`-Gate und `api.users.getUser`.
3. `PhaserPreview.tsx` enthält `sandbox="allow-scripts"` und NICHT `allow-same-origin`.
4. `bridge.ts` enthält `e.source !== iframe.contentWindow`-Guard und `MessageChannel`.
5. `public/game-studio/games/index.json` parst und jedes Spiel hat `sourceUrl/width/height/seed`.

Exit 1 bei Verstoß, sonst still + `OK`.

- [ ] **Step 8: Typecheck + Checks ausführen**

Run: `npx tsc --noEmit && node scripts/game-studio/game-studio-lab-check.mjs && npm run game-runtime-check`
Expected: alles grün. Dann npm-Script `"game-studio-lab-check": "node scripts/game-studio/game-studio-lab-check.mjs"` eintragen.

- [ ] **Step 9: Commit**

```bash
git add src/components/game-runtime src/pages/admin/GameStudioLab.tsx src/App.tsx public/game-studio scripts/game-studio package.json
git commit -m "feat(game-studio): PhaserPreview + MessageChannel-Bridge + Admin-Lab-Route /admin/game-studio"
```

---

### Task 3: Source-Validator + Check

**Files:**
- Create: `convex/gameStudio/sourceValidator.ts` (pure TS, KEINE Convex-Imports — muss aus Scripts via tsx importierbar sein, wie die Engine-Validatoren)
- Test: `scripts/game-studio/source-validator-check.mjs`

**Interfaces:**
- Produces: `validateGameSource(source: string, opts: { requiredGoalIds: string[] }): { ok: boolean; violations: string[] }` und `FORBIDDEN_PATTERNS: Array<{ id: string; pattern: RegExp; message: string }>`.
- Wichtig: Der Validator ist Frühwarnsystem (Spec 5.3/5.5) — Syntax-Parse macht das Check-Script separat via esbuild `transform(source, { loader: "js", format: "esm" })`.

- [ ] **Step 1: `sourceValidator.ts` schreiben**

```ts
// Statischer Validator für generierten/handgebauten Phaser-Spiel-Source.
// Frühwarnsystem — die Sicherheitsgrenze ist die iframe-Sandbox + CSP (Spec 5.5).
export type SourceValidation = { ok: boolean; violations: string[] };

export const FORBIDDEN_PATTERNS: Array<{ id: string; pattern: RegExp; message: string }> = [
  { id: "eval", pattern: /\beval\s*\(/, message: "eval ist verboten" },
  { id: "function-ctor", pattern: /\bnew\s+Function\b|\bFunction\s*\(/, message: "Function-Konstruktor ist verboten" },
  { id: "fetch", pattern: /\bfetch\s*\(/, message: "Netzwerkzugriff (fetch) ist verboten" },
  { id: "xhr", pattern: /\bXMLHttpRequest\b/, message: "XMLHttpRequest ist verboten" },
  { id: "websocket", pattern: /\bWebSocket\b|\bEventSource\b|\bRTCPeerConnection\b/, message: "Netzwerk-Sockets sind verboten" },
  { id: "beacon", pattern: /\bsendBeacon\b/, message: "sendBeacon ist verboten" },
  { id: "storage", pattern: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/, message: "Storage/Cookies sind verboten" },
  { id: "parent", pattern: /window\s*\.\s*(parent|top|opener)\b/, message: "Zugriff auf window.parent/top/opener ist verboten" },
  { id: "postmessage", pattern: /\bpostMessage\s*\(/, message: "postMessage ist verboten (nur die Bridge kommuniziert)" },
  { id: "worker", pattern: /\bnew\s+(Worker|SharedWorker)\b|\bserviceWorker\b|\bimportScripts\b/, message: "Worker sind verboten" },
  { id: "import-static", pattern: /^\s*import[\s{]/m, message: "Imports sind verboten (Phaser über window.Phaser)" },
  { id: "import-dynamic", pattern: /\bimport\s*\(/, message: "Dynamischer Import ist verboten" },
  { id: "require", pattern: /\brequire\s*\(/, message: "require ist verboten" },
  { id: "dom-escape", pattern: /document\.(write|body|documentElement)\b/, message: "DOM-Zugriff außerhalb des Containers ist verboten" },
  { id: "script-inject", pattern: /createElement\s*\(\s*["'`]script["'`]\s*\)/, message: "Script-Injection ist verboten" },
  { id: "media-devices", pattern: /\bgeolocation\b|\bmediaDevices\b|navigator\s*\.\s*clipboard\b|\bNotification\b/, message: "Geräte-APIs sind verboten" },
  { id: "math-random", pattern: /\bMath\s*\.\s*random\s*\(/, message: "Math.random ist verboten — seeded PRNG aus context.seed verwenden" },
  { id: "wall-clock", pattern: /\bDate\s*\.\s*now\s*\(|\bperformance\s*\.\s*now\s*\(|\bnew\s+Date\s*\(/, message: "Wanduhr-Zeit ist verboten — Phaser-Clock verwenden" },
];

export const MAX_SOURCE_BYTES = 250 * 1024;

export function validateGameSource(source: string, opts: { requiredGoalIds: string[] }): SourceValidation {
  const violations: string[] = [];
  const bytes = new TextEncoder().encode(source).length;
  if (bytes > MAX_SOURCE_BYTES) violations.push(`Source-Budget überschritten: ${bytes} > ${MAX_SOURCE_BYTES} Bytes`);

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(source)) violations.push(`FORBIDDEN(${rule.id}): ${rule.message}`);
  }

  if (!/export\s+(async\s+)?function\s+bootMeolunaGame\b|export\s*\{[^}]*\bbootMeolunaGame\b/.test(source)) {
    violations.push("Pflicht-Export bootMeolunaGame fehlt");
  }
  const gameCount = (source.match(/new\s+(window\s*\.\s*)?Phaser\s*\.\s*Game\s*\(/g) || []).length;
  if (gameCount !== 1) violations.push(`Phaser.Game muss genau 1x erzeugt werden (gefunden: ${gameCount})`);
  if (!/\bcompleteGame\s*\(/.test(source)) violations.push("completeGame-Aufruf fehlt");
  if (!/\bsetAffordances\s*\(/.test(source)) violations.push("setAffordances-Aufruf fehlt (Playthrough-Pflicht)");

  for (const goalId of opts.requiredGoalIds) {
    if (!source.includes(goalId)) violations.push(`Pflichtlernziel ${goalId} kommt im Source nicht vor (completeGoal-Bindung fehlt)`);
  }

  return { ok: violations.length === 0, violations };
}
```

Achtung `import-static`-Regel vs. `export`: Das Muster matcht nur Zeilen, die mit `import` BEGINNEN — `export function` bleibt erlaubt.

- [ ] **Step 2: `scripts/game-studio/source-validator-check.mjs` schreiben** (Golden-Check-Stil, `node --import tsx/esm`)

Ablauf:
1. `validateGameSource` via `pathToFileURL(join(ROOT, "convex", "gameStudio", "sourceValidator.ts")).href` importieren.
2. Positiv: `scripts/game-studio/fixtures/hello-game.js` mit `requiredGoalIds: ["goal-demo"]` → `ok === true`.
3. Syntax-Probe: esbuild `transform(helloSource, { loader: "js", format: "esm" })` wirft nicht.
4. Negativ-Matrix: für JEDES `FORBIDDEN_PATTERNS`-Element ein Mini-Source (`hello + "\n" + trigger`), das genau diese Regel reißt — Trigger-Strings im Script als Tabelle (`fetch("x")`, `Math.random()`, `window.parent.x`, `new Worker("x")`, `import("x")`, `localStorage.x`, `Date.now()`, …). Jede Regel muss anschlagen.
5. Struktur-Negativ: Source ohne `bootMeolunaGame`-Export, ohne `completeGame`, mit 2x `new Phaser.Game`, mit fehlender goalId, mit >250 KB (`"x".repeat(...)` als Kommentar) → je erwartete Violation.
6. Obfuskations-Doku-Fälle: `window["fe"+"tch"]` und `[].constructor.constructor` — der Validator DARF sie verpassen; das Script loggt sie nur als `INFO: von CSP abgefangen (Spec 5.5)`, kein Fail.

Exit 1 bei Fail, npm-Script `"game-source-check": "node --import tsx/esm scripts/game-studio/source-validator-check.mjs"`.

- [ ] **Step 3: Ausführen + Commit**

Run: `npm run game-source-check` → `OK`. Dann:

```bash
git add convex/gameStudio/sourceValidator.ts scripts/game-studio/source-validator-check.mjs package.json
git commit -m "feat(game-studio): statischer Source-Validator mit Verbots-Matrix und Check"
```

---

### Task 4: Game-Studio-Typen, Originality Gate, Ägypten-Learning-Model

**Files:**
- Create: `convex/gameStudio/types.ts` (pure TS, keine Convex-Imports)
- Create: `convex/gameStudio/originalityGate.ts` (pure TS)
- Create: `scripts/game-studio/data/egypt-learning-model.json`
- Test: `scripts/game-studio/experience-signature-check.mjs`

**Interfaces:**
- Produces: Typen `LearningModel`, `GamePitch`, `ExperienceSignature`, `PlanStep`, `PlaythroughPlan` (exakt wie Spec 4.1/4.2/4.3 bzw. „Zentrales Protokoll"); `experienceSimilarity(a, b): number`; `countDistinctDimensions(a, b): number`; `passesOriginalityGate(candidate, existing, opts: { sameTopic: boolean }): { passed: boolean; nearestSimilarity: number; reasons: string[] }`.
- Consumes: nichts aus Task 1-3 (parallel zu Task 3 möglich).

- [ ] **Step 1: `types.ts` schreiben** — `LearningModel`/`GamePitch`/`ExperienceSignature` wörtlich aus Spec 4.1-4.3 übernehmen, plus `PlanStep`/`PlaythroughPlan` aus dem Protokoll-Abschnitt. `GameDesignDocument` als Typ mit den Pflichtbestandteilen aus Spec 4.4 (jedes Pflichtfeld ein benanntes Feld: `fantasy`, `baseResolution: { width, height }`, `sceneGraph`, `coreLoop`, `controls`, `rules`, `progression`, `failureRecovery`, `learningBindings`, `avFeedback`, `assetManifest`, `telemetryEvents`, `affordances: Array<{ id: string; description: string }>`, `playthroughPlan: PlaythroughPlan`).

- [ ] **Step 2: `originalityGate.ts` schreiben**

```ts
import type { ExperienceSignature } from "./types";

function normalizeSet(values: string[]): Set<string> {
  return new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean));
}

export function jaccard(a: string[], b: string[]): number {
  const sa = normalizeSet(a), sb = normalizeSet(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for (const v of sa) if (sb.has(v)) inter += 1;
  return inter / (sa.size + sb.size - inter);
}

const eq = (x: string | null | undefined, y: string | null | undefined) =>
  (x ?? "none").trim().toLowerCase() === (y ?? "none").trim().toLowerCase() ? 1 : 0;

// Gewichtung aus Spec 4.3
export function experienceSimilarity(a: ExperienceSignature, b: ExperienceSignature): number {
  return (
    0.30 * jaccard(a.coreVerbs, b.coreVerbs) +
    0.15 * eq(a.worldTopology, b.worldTopology) +
    0.15 * eq(a.progressionModel, b.progressionModel) +
    0.10 * eq(a.camera, b.camera) +
    0.10 * eq(a.controlModel, b.controlModel) +
    0.10 * eq(a.failureModel, b.failureModel) +
    0.05 * eq(a.narrativeStructure, b.narrativeStructure) +
    0.05 * eq(a.systemicModel, b.systemicModel)
  );
}

// Die 7 Produktdimensionen aus Spec 2.2
export function countDistinctDimensions(a: ExperienceSignature, b: ExperienceSignature): number {
  let distinct = 0;
  if (jaccard(a.coreVerbs, b.coreVerbs) < 0.5) distinct += 1;
  if (!eq(a.camera, b.camera)) distinct += 1;
  if (!eq(a.worldTopology, b.worldTopology)) distinct += 1;
  if (!eq(a.progressionModel, b.progressionModel)) distinct += 1;
  if (!eq(a.controlModel, b.controlModel)) distinct += 1;
  if (!eq(a.failureModel, b.failureModel)) distinct += 1;
  if (!eq(a.narrativeStructure, b.narrativeStructure)) distinct += 1;
  return distinct;
}

export function passesOriginalityGate(
  candidate: ExperienceSignature,
  existing: ExperienceSignature[],
  opts: { sameTopic: boolean },
): { passed: boolean; nearestSimilarity: number; reasons: string[] } {
  const threshold = opts.sameTopic ? 0.60 : 0.72;
  let nearest = 0;
  const reasons: string[] = [];
  for (const sig of existing) {
    const sim = experienceSimilarity(candidate, sig);
    if (sim > nearest) nearest = sim;
    if (sim >= threshold) reasons.push(`Ähnlichkeit ${sim.toFixed(2)} >= ${threshold}`);
    if (countDistinctDimensions(candidate, sig) < 4) reasons.push("Weniger als 4 von 7 Produktdimensionen verschieden");
  }
  return { passed: reasons.length === 0, nearestSimilarity: nearest, reasons };
}
```

- [ ] **Step 3: `egypt-learning-model.json` schreiben** — gemeinsame Faktenbasis beider Slice-Spiele (Spec 10.1). Vollständiger Inhalt:

```json
{
  "sourceMode": "curriculum",
  "subject": "Geschichte",
  "gradeLevel": "5-6",
  "ageRange": { "min": 10, "max": 12 },
  "sourceSummary": "Das Alte Ägypten: Nil als Lebensader, Schrift und Verwaltung, Gesellschaftsordnung, Jenseitsvorstellung, Pyramidenbau.",
  "requiredGoals": [
    {
      "id": "goal-nil-flut",
      "statement": "Erklären, wie die jährliche Nilüberschwemmung Landwirtschaft und Ernte ermöglicht (Achet, Peret, Schemu).",
      "evidenceOfMastery": "Ordnet Feldarbeiten den drei Nilphasen korrekt zu bzw. steuert Kanäle so, dass Felder ertragreich bleiben.",
      "commonMisconceptions": ["Die Flut zerstört die Ernte, statt sie zu ermöglichen.", "Es regnet in Ägypten genug für Landwirtschaft."],
      "importance": "core"
    },
    {
      "id": "goal-hieroglyphen",
      "statement": "Beschreiben, wozu Hieroglyphen dienten und welche Rolle Schreiber für Verwaltung und Überlieferung hatten.",
      "evidenceOfMastery": "Erschließt Zeichenbedeutungen aus Bildkontext bzw. erlebt, dass ohne Schreiber Vorräte und Planung unlesbar werden.",
      "commonMisconceptions": ["Hieroglyphen sind nur Deko.", "Jeder Ägypter konnte lesen und schreiben."],
      "importance": "core"
    },
    {
      "id": "goal-gesellschaft",
      "statement": "Die Grundidee der ägyptischen Gesellschaftsordnung wiedergeben (Pharao, Beamte/Priester/Schreiber, Handwerker, Bauern).",
      "evidenceOfMastery": "Weist Rollen ihren Aufgaben zu bzw. verteilt Arbeitskräfte rollenlogisch.",
      "commonMisconceptions": ["Sklaven bauten allein die Pyramiden.", "Alle Ägypter waren gleichgestellt."],
      "importance": "core"
    },
    {
      "id": "goal-jenseits",
      "statement": "Die religiöse Bedeutung von Mumifizierung und Jenseitsvorstellung erklären (Körper bewahren für das Leben nach dem Tod).",
      "evidenceOfMastery": "Verknüpft Grabbeigaben/Kanopen mit ihrem Zweck für die Jenseitsreise.",
      "commonMisconceptions": ["Mumifizierung war Bestrafung.", "Gräber waren nur Lagerräume."],
      "importance": "core"
    },
    {
      "id": "goal-pyramidenbau",
      "statement": "Organisatorische und materielle Anforderungen des Pyramidenbaus benennen (Arbeitskräfte, Versorgung, Verwaltung, Rampen).",
      "evidenceOfMastery": "Plant Bauabschnitte mit ausreichender Versorgung bzw. liest Bauorganisation aus Quellen.",
      "commonMisconceptions": ["Pyramiden entstanden ohne Planung.", "Außerirdische/Magie statt Logistik."],
      "importance": "core"
    }
  ],
  "facts": [
    { "id": "fact-achet", "statement": "Achet ist die Überschwemmungszeit; der Nil bringt fruchtbaren Schlamm auf die Felder.", "sourceEvidence": "Curriculum: Alte Kulturen — Ägypten, Nilzyklus" },
    { "id": "fact-peret", "statement": "Peret ist die Zeit der Aussaat nach dem Rückgang des Wassers.", "sourceEvidence": "Curriculum: Alte Kulturen — Ägypten, Nilzyklus" },
    { "id": "fact-schemu", "statement": "Schemu ist die Erntezeit vor der nächsten Flut.", "sourceEvidence": "Curriculum: Alte Kulturen — Ägypten, Nilzyklus" },
    { "id": "fact-schreiber", "statement": "Schreiber führten Listen über Vorräte, Abgaben und Arbeiter; nur wenige beherrschten die Schrift.", "sourceEvidence": "Curriculum: Alte Kulturen — Ägypten, Schrift und Verwaltung" },
    { "id": "fact-kanopen", "statement": "Bei der Mumifizierung wurden Organe in Kanopenkrügen aufbewahrt; der Körper sollte für das Jenseits erhalten bleiben.", "sourceEvidence": "Curriculum: Alte Kulturen — Ägypten, Totenkult" },
    { "id": "fact-pyramide-arbeiter", "statement": "Pyramiden bauten bezahlte, versorgte Arbeitertrupps in Saisonarbeit — organisiert über Verwaltung und Rampen-Technik.", "sourceEvidence": "Curriculum: Alte Kulturen — Ägypten, Pyramidenbau" },
    { "id": "fact-gesellschaft", "statement": "An der Spitze stand der Pharao; darunter Beamte, Priester und Schreiber, dann Handwerker und Bauern.", "sourceEvidence": "Curriculum: Alte Kulturen — Ägypten, Gesellschaft" }
  ],
  "constraints": { "sessionMinutes": 7, "readingLevel": "Klasse 5", "devices": ["touch", "mouse", "keyboard"] }
}
```

- [ ] **Step 4: `experience-signature-check.mjs` schreiben** (`node --import tsx/esm`)

Unit-Cases gegen `originalityGate.ts`:
1. Identische Signatur → `experienceSimilarity === 1` (±0.001), Gate lehnt ab.
2. Komplett disjunkte Signatur → Similarity 0, Gate akzeptiert.
3. Nur Skin-Änderung (gleiche Kategorien, 1 anderes Verb von 5) → Similarity ≥ 0.72, Gate lehnt ab.
4. `sameTopic: true` mit Similarity 0.65 → abgelehnt (0.60-Schwelle); `sameTopic: false` gleiches Paar → akzeptiert, sofern ≥4 Dimensionen verschieden.
5. Slice-Modus: WENN `scripts/game-studio/data/egypt-tomb.signature.json` UND `egypt-city.signature.json` existieren (entstehen in Task 6/7): Similarity < 0.40 und `countDistinctDimensions >= 4`, sonst Fail. Existieren sie noch nicht → `SKIP (Slice-Signaturen fehlen noch)`.

npm-Script: `"experience-signature-check": "node --import tsx/esm scripts/game-studio/experience-signature-check.mjs"`.

- [ ] **Step 5: Ausführen + Commit**

Run: `npm run experience-signature-check` → Unit-Cases grün, Slice-Teil SKIP.

```bash
git add convex/gameStudio scripts/game-studio/data scripts/game-studio/experience-signature-check.mjs package.json
git commit -m "feat(game-studio): Typen, Originality Gate (Jaccard + 7 Dimensionen) und Ägypten-Learning-Model"
```

---

### Task 5: Generischer Playthrough-Executor

**Files:**
- Create: `scripts/game-studio/run-playthrough.mjs`
- Create: `scripts/game-studio/plans/hello-game.plan.json`
- Modify: `package.json` (Scripts)

**Interfaces:**
- Consumes: Shell/Protokoll (Task 1), Plan-Format (Protokoll-Abschnitt), Harness-Muster aus `phaser-runtime-check.mjs` (Task 1 — denselben Inline-Harness + Static-Server-Code in eine gemeinsame Helper-Datei `scripts/game-studio/lib/harness.mjs` extrahieren und `phaser-runtime-check.mjs` darauf umstellen).
- Produces: CLI `node scripts/game-studio/run-playthrough.mjs --plan <pfad> [--viewport 390x844|768x1024|1440x900|all] [--throttle 4] [--update-shots]`.

**Verhalten (verbindlich):**
1. Plan-JSON laden; Spiel-Manifest aus `public/game-studio/games/index.json` per `plan.game` auflösen.
2. Static-Server (aus `lib/harness.mjs`) über `public/` + Harness.
3. Pro Viewport (bei `all`: alle drei aus Spec 5.4): frische Page, Harness laden, `LOAD_GAME` mit `plan.seed`.
4. Gates pro Lauf:
   - `GAME_READY` < 5 s (Spec 8.2).
   - Plan-Steps sequenziell ausführen. `tap` = `page.mouse.click` auf Affordance-Mitte (Umrechnung wie in `phaser-runtime-check.mjs::tapAffordance`); bei Viewport `390x844` zusätzlich prüfen: Affordance `width/height >= 48` CSS-px, sonst Fail (`Touch-Ziel zu klein: <id>`).
   - Keine Konsolenfehler, keine `GAME_ERROR`-Messages (Sammlung wie im Runtime-Check).
   - `assertComplete`: bis dahin GENAU EIN `PROGRESS complete`.
   - `assertGoal`: goalId in den PROGRESS-goal-Events.
   - `screenshot`: PNG nach `scripts/visual-out/game-studio/<plan.game>-<viewport>-<name>.png`; Vergleich gegen `scripts/visual-ref/game-studio/...` via pixelmatch (Muster + Schwellen exakt aus `scripts/visual-regression.mjs:83-101`, WARN > 2 %, `--update-shots` schreibt Baselines).
5. Performance-Probe (nur Viewport `1440x900`, nach Plan-Ende): CDP `Emulation.setCPUThrottlingRate({ rate: throttle })` via `page.context().newCDPSession(page)`, dann 10 s rAF-Sampling IM IFRAME-FRAME (`page.frames()` — Frame mit URL `/game-runtime/v1/index.html`, `frame.evaluate`): Frame-Deltas sammeln, p95 berechnen. Fail bei p95 > 33 ms (Spec 8.3).
6. Ausgabe: pro Viewport eine Zeile `PASS/FAIL <game> <viewport> ready=<ms> p95=<ms>`; Exit 1 bei irgendeinem Fail.

- [ ] **Step 1: `lib/harness.mjs` extrahieren** (Static-Server + HARNESS-HTML + `tapAffordance` aus Task 1 als exportierte Funktionen; `phaser-runtime-check.mjs` importiert sie danach)
- [ ] **Step 2: `run-playthrough.mjs` implementieren** (Verhalten oben, argv-Parsing mit `process.argv`, kein Dependency-Zusatz)
- [ ] **Step 3: `plans/hello-game.plan.json` schreiben:**

```json
{
  "game": "hello-game",
  "seed": "hello-seed-1",
  "steps": [
    { "op": "waitFor", "affordance": "hello.start" },
    { "op": "screenshot", "name": "start" },
    { "op": "tap", "affordance": "hello.start" },
    { "op": "waitFor", "affordance": "hello.star-1" },
    { "op": "tap", "affordance": "hello.star-1" },
    { "op": "waitFor", "affordance": "hello.star-2" },
    { "op": "tap", "affordance": "hello.star-2" },
    { "op": "waitFor", "affordance": "hello.star-3" },
    { "op": "tap", "affordance": "hello.star-3" },
    { "op": "assertGoal", "goalId": "goal-demo" },
    { "op": "assertComplete" },
    { "op": "screenshot", "name": "done" }
  ]
}
```

- [ ] **Step 4: npm-Scripts:**

```json
"game-playthrough": "node scripts/game-studio/run-playthrough.mjs",
"game-studio-check": "npm run game-runtime-check && npm run game-source-check && npm run experience-signature-check && npm run game-studio-lab-check"
```

- [ ] **Step 5: Ende-zu-Ende verifizieren**

Run: `npm run game-playthrough -- --plan scripts/game-studio/plans/hello-game.plan.json --viewport all --update-shots`
Expected: `PASS hello-game 390x844 ...`, `PASS hello-game 768x1024 ...`, `PASS hello-game 1440x900 ... p95=<x>ms`, Exit 0. Danach `npm run game-runtime-check` erneut (Refactor auf lib/harness.mjs darf nichts brechen).

- [ ] **Step 6: Commit**

```bash
git add scripts/game-studio package.json
git commit -m "feat(game-studio): generischer Playthrough-Executor (Affordance-Plan, 3 Viewports, Perf-Probe)"
```

---

### Task 6: Spiel A — „Das Siegel des vergessenen Schreibers"

**Files:**
- Create: `public/game-studio/games/egypt-tomb/game.js`
- Create: `scripts/game-studio/data/egypt-tomb.gdd.json` (GameDesignDocument nach `convex/gameStudio/types.ts`)
- Create: `scripts/game-studio/data/egypt-tomb.signature.json` (ExperienceSignature, Werte unten)
- Create: `scripts/game-studio/plans/egypt-tomb.plan.json`
- Modify: `public/game-studio/games/index.json` (Spiel registrieren, `seed: "tomb-v1"`, `width: 960, height: 960`)

**Interfaces:**
- Consumes: Runtime-Kontext (Task 1), Validator (Task 3: `requiredGoalIds` siehe unten), Executor (Task 5).
- Produces: vollständig spielbares Spiel, das `npm run game-playthrough -- --plan scripts/game-studio/plans/egypt-tomb.plan.json --viewport all` besteht.

**GDD (verbindliche Design-Vorgabe — Implementierer trifft keine eigenen Design-Entscheidungen auf dieser Ebene):**

- **Genre/Kamera:** Top-down Archäologie-Mystery, Basisauflösung `960x960`.
- **Fantasie:** Als junge Archäologin/Archäologe ein verschlossenes Schreiber-Grab öffnen, indem man die Welt der Ägypter aus ihren Spuren erschließt.
- **Struktur:** 3 verbundene Grabkammern, linear freigeschaltet, plus Journal-Overlay. Erster sichtbarer Screen = Kammer 1, spielbar (kein Menü, kein Hub).
- **Steuerung:** ausschließlich Antippen von Hotspots/Optionen (tap-only). Figur bewegt sich automatisch zum angetippten Hotspot (Tween, rein kosmetisch).
- **Fehlermodell:** Falsche Aktionen kosten 1 von 3 Fackelstufen; bei 0 → Kammer-Soft-Reset, gesammelte Journal-Erkenntnisse bleiben. Kein Game Over. Falsche Siegel-Kombination in Kammer 3 verändert sichtbar den Raum (Fackel flackert, ein zusätzliches Wandbild wird sichtbar = neuer Hinweis) statt rotem „Falsch".
- **Kammer 1 „Kammer der Zeichen"** (`goal-hieroglyphen`): 4 Wandbilder (Affordances `c1.mural-1..4`), jedes zeigt Szene + Hieroglyphe (Brot/Bäcker, Wasser/Fluss, Sonne/Tag, Schreiber/Liste — aus `fact-schreiber`). Antippen öffnet Detailansicht mit 1 Satz (`api.speak` liest vor). Tor mit 3 Zeichen (`c1.gate-slot-1..3`): pro Slot erscheinen 3 Bild-Optionen (`c1.gate-option-brot|wasser|sonne|schreiber|falle-1|falle-2`) — Zuordnung über die BEOBACHTETEN Wandszenen, kein Text-Quiz. 3 korrekte Slots → `completeGoal("goal-hieroglyphen")` + Tor öffnet sich (`c1.door-next`).
- **Kammer 2 „Kammer des Flusses"** (`goal-nil-flut`): mechanische Wandkarte des Nils. Drehrad (`c2.wheel`) schaltet zyklisch durch Achet/Peret/Schemu (sichtbar: Wasserstand-Animation). 4 Feld-Plättchen (`c2.field-1..4`: „Schlamm verteilt sich", „Aussaat", „Ernte", „Kanäle prüfen") müssen der richtigen Phase zugeordnet werden: Plättchen antippen → Phase am Rad einstellen → Bestätigen (`c2.wheel-confirm`). Falsch: Feld zeigt vertrocknete/ersäufte Mini-Animation + Hinweistext. Alle 4 korrekt → `completeGoal("goal-nil-flut")` + Durchgang (`c2.door-next`).
- **Kammer 3 „Kammer des Siegels"** (`goal-jenseits`, `goal-gesellschaft`): 2 Untersuchungs-Hotspots: Kanopenkrüge (`c3.hotspot-kanopen`, aus `fact-kanopen`) und Arbeiterliste des Schreibers (`c3.hotspot-liste`, aus `fact-pyramide-arbeiter` + `fact-gesellschaft`) — beide MÜSSEN untersucht werden, bevor das Siegel aktiv wird (state "locked" → "active"). Siegel = 3 Ringe (`c3.ring-1..3`), je 4 Symbol-Positionen, Fragen im Journal formuliert: Ring 1 „Wer steht an der Spitze?" (Pharao), Ring 2 „Was bewahrt den Körper für die Reise?" (Kanope), Ring 3 „Wer zählt und plant?" (Schreiber). Ring antippen rotiert zur nächsten Position. `c3.seal-confirm` prüft: korrekt → `completeGoal("goal-jenseits")` + `completeGoal("goal-gesellschaft")` + Finale (Siegel öffnet sich, Schreiber-Botschaft, `completeGame({ finalScore })`), Restart-Affordance `ui.restart` im Finale.
- **Score:** `reportScore(10)` je korrekte Einzelaktion, `reportScore(25)` je Kammerabschluss.
- **Telemetrie (Pflicht-Events):** `chamber:entered {n}`, `mural:inspected {id}`, `gate:attempt {slot, correct}`, `nil:assigned {field, phase, correct}`, `hotspot:inspected {id}`, `seal:attempt {correct}`, `torch:lost {remaining}`.
- **Audio:** WebAudio-Synthese (kurze Klicks/Erfolgs-Arpeggio), startet stumm, Lautsprecher-Toggle (`ui.sound-toggle`) oben rechts.
- **Visuals Phase 1:** Phaser-Geometrie + Canvas-Texturen (Sandstein-Töne 0xc2a878/0x8a6f4d, Fackellicht-Kreise, klare Silhouetten). KEINE Emojis. Asset-Slots im Code über `context.assets["bg-chamber-1"]` etc. vorbereiten mit Geometrie-Fallback, wenn Asset fehlt (Art-Pass kommt in Task 9).
- **requiredGoalIds für Validator:** `["goal-hieroglyphen", "goal-nil-flut", "goal-jenseits", "goal-gesellschaft"]` (deckt 4 von 5 — Spec 10.1 erfüllt; `goal-pyramidenbau` supporting über Arbeiterliste).

**ExperienceSignature (`egypt-tomb.signature.json`):**

```json
{
  "coreVerbs": ["erkunden", "beobachten", "entschlüsseln", "kombinieren"],
  "camera": "top-down",
  "worldTopology": "linear",
  "progressionModel": "gated-chambers",
  "controlModel": "tap-explore",
  "failureModel": "resource-soft-reset",
  "narrativeStructure": "mystery-aufdeckung",
  "systemicModel": null
}
```

- [ ] **Step 1: GDD-JSON schreiben** (obige Vorgabe in `GameDesignDocument`-Struktur, inkl. vollständigem `playthroughPlan`)
- [ ] **Step 2: `game.js` implementieren** (ein ES-Modul, PRNG/Boot-Muster wie `hello-game.js`, 3 Szenen als Phaser-Scene-Klassen + Journal-Overlay; nach JEDEM Zustandswechsel `setAffordances` mit komplettem aktuellem Satz)
- [ ] **Step 3: Validator lokal grün** — Run: `node --import tsx/esm -e "import('./convex/gameStudio/sourceValidator.ts').then(async m => { const fs = await import('node:fs'); const r = m.validateGameSource(fs.readFileSync('public/game-studio/games/egypt-tomb/game.js','utf8'), { requiredGoalIds: ['goal-hieroglyphen','goal-nil-flut','goal-jenseits','goal-gesellschaft'] }); if (!r.ok) { console.error(r.violations); process.exit(1); } console.log('OK'); })"`
- [ ] **Step 4: Playthrough-Plan schreiben** (glücklicher Pfad durch alle 3 Kammern MIT einem absichtlichen Fehlversuch in Kammer 3 vor der Korrektur — Spec 8.2 „mindestens ein Fehlerpfad" — dann `assertGoal` alle 4, `assertComplete`, Screenshots `c1|c2|c3|finale`)
- [ ] **Step 5: Playthrough alle Viewports grün** — Run: `npm run game-playthrough -- --plan scripts/game-studio/plans/egypt-tomb.plan.json --viewport all --update-shots` → 3x PASS
- [ ] **Step 6: Manifest registrieren + im Lab sichtprüfen** (`npm run dev`, `/admin/game-studio`, Spiel spielbar)
- [ ] **Step 7: Commit**

```bash
git add public/game-studio scripts/game-studio
git commit -m "feat(game-studio): Spiel A — Das Siegel des vergessenen Schreibers (Vertical Slice)"
```

---

### Task 7: Spiel B — „Stadt am großen Fluss"

**Files:**
- Create: `public/game-studio/games/egypt-city/game.js`
- Create: `scripts/game-studio/data/egypt-city.gdd.json`
- Create: `scripts/game-studio/data/egypt-city.signature.json`
- Create: `scripts/game-studio/plans/egypt-city.plan.json`
- Modify: `public/game-studio/games/index.json` (registrieren, `seed: "city-v1"`, `width: 1280, height: 720`)

**Interfaces:** wie Task 6.

**GDD (verbindlich):**

- **Genre/Kamera:** kompaktes systemisches Aufbauspiel, fixe Szene (stilisierte Flusslandschaft von schräg oben als ein Screen), Basisauflösung `1280x720` (Landscape). Auf Portrait-Viewports zeigt das Spiel einen kindgerechten Dreh-Hinweis („Dreh dein Gerät ☞"); der Playthrough für `390x844` läuft laut Spec 5.4 bei `844x390` (Executor-Aufruf mit `--viewport 844x390` dokumentieren im Plan-Kommentarfeld).
- **Fantasie:** Als Verwalterin/Verwalter des Pharao eine Flusssiedlung durch 3 Jahre führen: Felder, Speicher, Tempel-Werkstatt und Pyramidenbau im Gleichgewicht.
- **Struktur:** rundenbasiert — 3 Jahre × 3 Nilphasen (Achet/Peret/Schemu) = 9 Züge. Erster Screen = Jahr 1 Achet, sofort handelbar.
- **Kern-Systeme:**
  - **Wasser:** 3 Kanal-Reihen (`canal-1..3.toggle`, offen/zu). Achet: offene Kanäle bewässern Feldreihen (fruchtbarer Schlamm, `fact-achet`), geschlossene bleiben trocken; zu viele offene bei Hochflut → Siedlung nass (Stabilitätsverlust). Fluthöhe pro Jahr deterministisch aus Seed (PRNG), im UI vorher als „Nilstand-Vorhersage der Priester" sichtbar.
  - **Arbeitskräfte:** 12 Arbeiter auf 4 Bereiche (`alloc.fields|scribes|granary|pyramid` je `.plus`/`.minus`): Felder (Nahrung), Schreiber (Information), Speicher (Vorrat gegen Schwankung), Pyramide (Baufortschritt).
  - **Schreiber-Mechanik (Herzstück, `goal-hieroglyphen` als System):** 0 Schreiber → Vorrats- und Ertragsanzeigen zeigen „?" bzw. grobe Symbole, Zuteilungseffekte streuen (±); ≥2 Schreiber → exakte Zahlen + Vorschau der Zugfolgen. Der Unterschied wird im Berater-Text explizit gemacht („Ohne Listen weiß niemand, was im Speicher liegt").
  - **Jenseits (`goal-jenseits`):** In Schemu Jahr 2 Ereignis: Werkstatt bittet um Arbeiter für Grabausstattung/Kanopen (`event.grave-accept` / `event.grave-later`). Annahme kostet Baufortschritt, gibt Vertrauen + Erklärungstext (`fact-kanopen`); dauerhafte Ablehnung senkt Vertrauen.
  - **Ressourcen:** Nahrung, Vorrat, Baufortschritt (Ziel: 60 %), Vertrauen (0-100).
- **Zugablauf:** Phase zeigt Ereignis-/Vorhersage-Karte → Spieler stellt Kanäle + Zuteilung → `hud.phase-next` → Auswertungs-Animation (Felder wachsen/verdorren, Speicher füllt sich, Pyramiden-Ebenen wachsen) mit Berater-Kommentar (`advisor.next` blättert, `api.speak` liest vor).
- **Fehlermodell:** Nahrung < 0 → Hunger-Runde: Berater erklärt Ursache konkret („Peret ohne Aussaat-Arbeiter — die Felder blieben leer"), Zug wird auf Phasenanfang zurückgesetzt (Rollback, kein Game Over), `telemetry rollback {reason}`.
- **Sieg (Jahr 3 Schemu):** Baufortschritt ≥ 60 % UND Nahrung ≥ 0 UND Vertrauen ≥ 40 → Einweihungs-Finale, `completeGame`. Verfehlt → „Noch ein Versuch"-Screen (`ui.restart`), Zusammenfassung was fehlte.
- **Goal-Bindung:** `goal-nil-flut` → erstes Achet mit ≥1 korrekt bewässerter Feldreihe UND korrekter Peret-Aussaat (`completeGoal` nach Auswertung); `goal-pyramidenbau` → 3 Züge in Folge Pyramiden-Arbeiter versorgt (Nahrung ≥ 0) und Fortschritt gewachsen; `goal-gesellschaft` → alle 4 Bereiche mindestens einmal sinnvoll besetzt (je ≥1 Arbeiter über 2 Züge); `goal-hieroglyphen` → Spieler hat Schreiber von 0 auf ≥2 erhöht und die Anzeige-Präzision umgeschaltet erlebt (Event `scribes:unlocked`).
- **Score:** `reportScore(15)` je Phase ohne Verlust, `reportScore(40)` Sieg-Bonus.
- **Telemetrie:** `phase:resolved {year, phase, food, trust, build}`, `canal:toggled`, `alloc:changed {area, count}`, `scribes:unlocked`, `event:grave {accepted}`, `rollback {reason}`.
- **Audio/Visuals:** wie Task 6 (WebAudio-Synthese, Geometrie + Canvas-Texturen, Nil-Blau 0x2e6f95, Schilf-Grün 0x6a8f3c, Sand 0xd9c08a; Asset-Slots `bg-river`, `sprite-pyramid-stages` vorbereitet).
- **requiredGoalIds für Validator:** `["goal-nil-flut", "goal-pyramidenbau", "goal-gesellschaft", "goal-hieroglyphen"]` (`goal-jenseits` supporting über Grab-Ereignis — B deckt damit 4 Pflicht + 1 supporting).

**ExperienceSignature (`egypt-city.signature.json`):**

```json
{
  "coreVerbs": ["planen", "steuern", "verteilen", "abwägen", "bauen"],
  "camera": "fixed-scene",
  "worldTopology": "round-based",
  "progressionModel": "year-cycles",
  "controlModel": "tap-allocate",
  "failureModel": "phase-rollback",
  "narrativeStructure": "aufbau-chronik",
  "systemicModel": "economy-loop"
}
```

(Erwartete Similarity zu Spiel A: 0.0 — alle Kategorien verschieden, Verben disjunkt. Slice-Kriterium < 0.40 klar erfüllt; `experience-signature-check` verlässt den SKIP-Modus mit diesem Task.)

- [ ] **Step 1: GDD-JSON schreiben**
- [ ] **Step 2: `game.js` implementieren** (Muster Task 6; Ein-Screen-Layout, HUD-Leisten oben, Kanäle links, Zuteilungs-Panel rechts, Pyramide im Hintergrund wachsend)
- [ ] **Step 3: Validator grün** (Kommando analog Task 6 Step 3 mit den vier requiredGoalIds)
- [ ] **Step 4: Playthrough-Plan schreiben** (9 Züge Gewinnstrategie + 1 absichtlicher Hunger-Rollback in Jahr 2 als Fehlerpfad; `assertGoal` alle 4, `assertComplete`; Screenshots `jahr1|rollback|finale`)
- [ ] **Step 5: Playthrough grün** — Run: `npm run game-playthrough -- --plan scripts/game-studio/plans/egypt-city.plan.json --viewport all --update-shots` (Executor nutzt für 390x844 die gedrehte Prüfung 844x390, siehe GDD)
- [ ] **Step 6: `npm run experience-signature-check`** → Slice-Teil jetzt aktiv und grün (< 0.40)
- [ ] **Step 7: Manifest + Lab-Sichtprüfung, Commit**

```bash
git add public/game-studio scripts/game-studio
git commit -m "feat(game-studio): Spiel B — Stadt am großen Fluss (systemisches Aufbauspiel, Vertical Slice)"
```

---

### Task 8: Gesamtabnahme + Doku + menschliches Gate

**Files:**
- Modify: `package.json` (`game-studio-check` um `game-playthrough`-Läufe beider Spiele erweitern — als eigenes Script `game-slice-check`)
- Modify: `CLAUDE.md` (Activity-Log-Eintrag: was gebaut, Befehle, Status)
- Modify: `docs/superpowers/specs/2026-07-10-generative-game-studio-design.md` (Status-Zeile: „Phase 1 umgesetzt am <Datum>, Ergebnis menschliches Gate: <offen>")

- [ ] **Step 1: `"game-slice-check"` Script:** beide Playthrough-Pläne `--viewport all` + `game-studio-check`; kompletter Lauf grün.
- [ ] **Step 2: Bestehende QA darf nicht brechen:** `npx tsc --noEmit && npm run golden-check && npm run sandbox-entry-check && npm run playthrough-smoke` → alles grün (beweist: Engines/Sandbox unangetastet).
- [ ] **Step 3: Activity Log + Commit + Push** (Vercel deployt auto; danach `/admin/game-studio` auf Prod-URL live prüfen — Regel `feedback_deploy_live_verifizieren`).
- [ ] **Step 4: Menschliches Gate:** Klaus spielt beide Spiele auf Desktop UND einem echten Mobilgerät; Bewertung nach Spec 8.5 (5 Kriterien, 1-5). Ergebnis in Spec-Status + Activity Log dokumentieren. NICHT von Agents bewertbar.

---

### Task 9 (optional, NACH Klaus' Gameplay-Feedback): Art-Pass mit fal.ai

Art Bible je Spiel (Spec 6.1), Hintergründe/Schauplätze via fal.ai generieren (PII-frei, nur Szenen-Beschreibungen), WebP ≤ Budgets, nach `public/game-studio/games/<id>/assets/`, Manifest-`assets` befüllen, Geometrie-Fallback bleibt. Visual-Baselines aktualisieren. Wird erst geplant/beauftragt, wenn Task 8 Gate-Feedback vorliegt — Gameplay vor Grafik.

---

## Ausführungs-Zuordnung (Orchestrierung)

| Task | Agent | Grund |
|------|-------|-------|
| 1 | fast-worker | Code steht vollständig im Plan |
| 2 | fast-worker | Code steht vollständig im Plan |
| 3 | fast-worker | Code steht vollständig im Plan |
| 4 | fast-worker | Typen/Gate/Daten vollständig spezifiziert |
| 5 | claude (general) | Executor-Verhalten spezifiziert, aber Implementierungsspielraum (Playwright-Frame-Handling) |
| 6 | claude (general) | kreative Spiel-Implementierung nach GDD |
| 7 | claude (general) | kreative Spiel-Implementierung nach GDD |
| 8 | Orchestrator selbst | Abnahme, Doku, Deploy-Verifikation |
| Review | cavecrew-reviewer | nach Task 2, 5, 6, 7 |

Task 3 und 4 können parallel laufen (keine gemeinsamen Dateien). Task 6 und 7 NICHT parallel (beide schreiben `index.json` + `plans/`-Konventionen; sequenziell mit Review dazwischen).

## Self-Review (durchgeführt)

- Spec-Abdeckung Phase 1: Runtime-Shell ✓ (T1), PhaserPreview ✓ (T2), Source-Validator ✓ (T3), Learning Model ✓ (T4), zwei Spiele ✓ (T6/T7), Playthrough/Screenshots/Perf ✓ (T5), Auftraggeber-Gate ✓ (T8). Phase 0 bereits in `9a0120c` erledigt (verifiziert: `Sandbox.tsx` + `sandbox-entry-check.mjs`).
- Nicht in Phase 1 (bewusst, Spec Phase 2/3): Convex-Schema/`worldArtifacts`, WorldPreview-Dispatcher, Pitch/GDD/Originality als LLM-Schritte, fal.ai-Pipeline, signierte Worker-Requests.
- Typkonsistenz: `bootMeolunaGame(context)`, `setAffordances(list, base)`, `PROGRESS/SPEAK/AFFORDANCES/TELEMETRY/GAME_ERROR`, `GameManifest`, Plan-Ops — in T1/T2/T5/T6/T7 identisch verwendet.
- Bekannte Unsicherheit (explizit im Plan): CSP `'self'` unter opaker Origin (T1 Step 7 hat Eskalationsanweisung statt Rate-Versuch).
