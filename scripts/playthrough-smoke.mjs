// Interaktions-Smoke: rendert eine Engine-Fixture mit einem AUFZEICHNENDEN
// Meoluna-Stub, betritt Raum 1, klickt die KORREKTE erste Antwort und prueft,
// dass window.Meoluna.reportScore mit einer Zahl gefeuert hat (XP-Contract) und
// keine Konsolenfehler auftraten. Verifiziert den Klick->XP-Pfad end-to-end
// (genau der frueher kaputte reportScore-Bug) auf den echten Renderern.
//
//   node --import tsx/esm scripts/playthrough-smoke.mjs
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build, transform } from "esbuild";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "preview-out", "smoke");
mkdirSync(OUT, { recursive: true });

function pad2(n) { return String(n).padStart(2, "0"); }
function fmtClock(h, m) { return h + ":" + pad2(m) + " Uhr"; }
function coinLabel(c) {
  if (c < 100) return c + "ct";
  const e = Math.floor(c / 100), r = c % 100;
  return r === 0 ? e + "€" : e + "," + pad2(r);
}

// Pro Engine: Renderer + Fixture-Ordner + Loeser, der aus der Spec die Klick-
// Texte fuer Raum 0 / Runde 0 ableitet (Reihenfolge = Klick-Reihenfolge).
const ENGINES = [
  ["counting", "countingRenderer.ts", "buildCountingWorldCode", "counting", (s) => {
    const r = s.rooms[0]; if (r.mode !== "count") return null;
    return [String(r.rounds[0].count)];
  }],
  ["chart", "chartRenderer.ts", "buildChartWorldCode", "chart", (s) => {
    const r = s.rooms[0]; if (r.mode !== "read") return null;
    return [String(r.categories[r.rounds[0].categoryIndex].value)];
  }],
  ["pattern", "patternRenderer.ts", "buildPatternWorldCode", "pattern", (s) => {
    const r = s.rooms[0]; const rd = r.rounds[0];
    return [rd.sequence[rd.gapIndex]];
  }],
  ["clock", "clockRenderer.ts", "buildClockWorldCode", "clock", (s) => {
    const r = s.rooms[0]; if (r.mode !== "read") return null;
    return [fmtClock(r.rounds[0].hour, r.rounds[0].minute)];
  }],
  ["diagram", "diagramRenderer.ts", "buildDiagramWorldCode", "diagram", (s) => {
    const r = s.rooms[0]; if (r.mode !== "label") return null;
    return [r.markers[r.rounds[0].markerIndex].label];
  }],
  ["money", "moneyRenderer.ts", "buildMoneyWorldCode", "money", (s) => {
    const r = s.rooms[0]; if (r.mode !== "pay") return null;
    let rest = r.rounds[0].targetCents;
    const denoms = [...r.rounds[0].denoms].sort((a, b) => b - a);
    const clicks = [];
    for (const d of denoms) while (rest >= d) { clicks.push(coinLabel(d)); rest -= d; }
    if (rest !== 0) return null;
    clicks.push("✓ Bezahlen");
    return clicks;
  }],
  ["map", "mapRenderer.ts", "buildMapWorldCode", "map", (s) => {
    const r = s.rooms[0]; if (r.mode !== "locate") return null;
    return [r.landmarks[r.rounds[0].targetIndex].emoji];
  }],
];

function firstFixture(dir) {
  const d = join(ROOT, "scripts", "fixtures", dir);
  const f = readdirSync(d).filter((n) => n.endsWith(".json")).sort()[0];
  return JSON.parse(readFileSync(join(d, f), "utf8"));
}

async function makeHtml(name, code) {
  const w = join(OUT, name + ".world.jsx"), e = join(OUT, name + ".entry.jsx");
  writeFileSync(w, code, "utf8");
  writeFileSync(e, [
    `import { createRoot } from 'react-dom/client';`,
    `import App from './${name}.world.jsx';`,
    `window.__m = [];`,
    `window.Meoluna = {`,
    `  reportScore: (p, meta) => window.__m.push({ m: 'reportScore', p, meta }),`,
    `  completeModule: (...a) => window.__m.push({ m: 'completeModule', a }),`,
    `  complete: (...a) => window.__m.push({ m: 'complete', a }),`,
    `};`,
    `createRoot(document.getElementById('root')).render(<App />);`,
  ].join("\n"), "utf8");
  const res = await build({ entryPoints: [e], bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".jsx": "jsx" }, define: { "process.env.NODE_ENV": '"production"' }, absWorkingDir: ROOT });
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8" />
<script src="https://cdn.tailwindcss.com"></script>
<style>*{animation:none!important;transition:none!important;}</style></head>
<body style="margin:0"><div id="root"></div>
<script>${res.outputFiles[0].text.replace(/<\/script>/g, "<\\/script>")}</script></body></html>`;
  const p = join(OUT, name + ".html");
  writeFileSync(p, html, "utf8");
  return p;
}

async function clickExact(page, text) {
  // Bevorzugt den letzten passenden, aktivierbaren Button (Antwort-/Aktionsleiste
  // liegt im DOM hinter Hub-/Ablage-Buttons mit gleichem Text).
  const loc = page.getByRole("button", { name: text, exact: true });
  const n = await loc.count();
  if (n === 0) throw new Error(`button "${text}" not found`);
  await loc.nth(n - 1).click({ timeout: 8000 });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  let failed = 0;

  for (const [name, file, fn, dir, solve] of ENGINES) {
    const errors = [];
    page.removeAllListeners("console"); page.removeAllListeners("pageerror");
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));
    try {
      const spec = firstFixture(dir);
      const clicks = solve(spec);
      if (!clicks) { console.log(`SKIP ${name.padEnd(9)} (room0 mode not covered)`); continue; }
      const mod = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", file)).href);
      const htmlPath = await makeHtml(name, mod[fn](spec));
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle", timeout: 30000 });

      // Raum 1 betreten: erste Hub-Karte (Titel aus world.rooms[0]).
      const roomTitle = spec.world.rooms[0].title;
      await page.getByRole("button", { name: roomTitle, exact: false }).first().click({ timeout: 8000 });
      await page.waitForTimeout(500);

      for (const t of clicks) { await clickExact(page, t); await page.waitForTimeout(250); }
      await page.waitForTimeout(400);

      const m = await page.evaluate(() => window.__m || []);
      const scored = m.find((x) => x.m === "reportScore" && typeof x.p === "number" && x.p > 0);
      if (errors.length) { failed += 1; console.log(`FAIL ${name.padEnd(9)} console error: ${errors[0].slice(0, 100)}`); continue; }
      if (!scored) { failed += 1; console.log(`FAIL ${name.padEnd(9)} no numeric reportScore after correct click (calls: ${JSON.stringify(m.map((x) => x.m))})`); continue; }
      console.log(`PASS ${name.padEnd(9)} reportScore(${scored.p}) fired  [${clicks.join(" + ")}]`);
    } catch (e) {
      failed += 1;
      console.log(`FAIL ${name.padEnd(9)} ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
    }
  }

  await browser.close();

  // ── Focused-TypeScript-Regression ──────────────────────────────────
  // Focused-Welten sind freier LLM-Code und emittieren manchmal TypeScript
  // (useState<Foo[]>(), Typannotationen). Der Sandpack-Renderer legt den Code
  // als /App.tsx ab und transpiliert TS. Faellt das auf /App.js zurueck,
  // crasht jede TS-Welt ("Unexpected token") - genau der Familien-Stammbaum-Bug.
  const TS_WORLD = [
    `import { useState } from 'react';`,
    `type Item = { en: string; de: string };`,
    `export default function App() {`,
    `  const [items, setItems] = useState<Item[]>([{ en: 'mother', de: 'Mutter' }]);`,
    `  const [score, setScore] = useState<number>(0);`,
    `  return <button onClick={() => { setScore(score + 1); window.Meoluna.reportScore(10, {}); window.Meoluna.completeModule('a', 25); window.Meoluna.complete({}); }}>{items[0].de} {score}</button>;`,
    `}`,
  ].join("\n");

  let tsOkAsTsx = false, tsFailsAsJs = false;
  try { await transform(TS_WORLD, { loader: "tsx", jsx: "automatic" }); tsOkAsTsx = true; } catch {}
  try { await transform(TS_WORLD, { loader: "jsx", jsx: "automatic" }); } catch { tsFailsAsJs = true; }
  const sandbox = readFileSync(join(ROOT, "src", "components", "Sandbox.tsx"), "utf8");
  const sandboxUsesTsx = sandbox.includes("'/App.tsx'") || sandbox.includes('"/App.tsx"');

  if (tsOkAsTsx && tsFailsAsJs && sandboxUsesTsx) {
    console.log(`PASS ts-world  Focused-TS rendert als .tsx, Sandbox-Entry ist /App.tsx`);
  } else {
    failed += 1;
    console.log(`FAIL ts-world  tsxOK=${tsOkAsTsx} failsAsJs=${tsFailsAsJs} sandboxTsx=${sandboxUsesTsx} (Sandbox muss /App.tsx nutzen)`);
  }

  console.log(`\n${failed === 0 ? "XP-Contract + TS-Toleranz OK" : failed + " problematisch"}.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
