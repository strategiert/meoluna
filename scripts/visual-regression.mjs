// Visual-Regression-Harness fuer die deterministischen Engine-Renderer.
// Pro Engine: erste Fixture -> Renderer -> esbuild-Bundle -> HTML -> Playwright
// laedt die Welt (Hub-Ansicht, ohne Interaktion) und prueft:
//   HART FAIL: Render-/Konsolenfehler oder leerer #root (kaputte Welt).
//   WARN:     Pixel-Abweichung > Schwelle gegenueber Baseline (umgebungsabhaengig).
// Screenshots landen in scripts/visual-out/. Baselines in scripts/visual-ref/.
//
//   node --import tsx/esm scripts/visual-regression.mjs            (pruefen)
//   node --import tsx/esm scripts/visual-regression.mjs --update   (Baselines neu schreiben)
//
// Hinweis: Baselines sind umgebungsspezifisch (Font-/Emoji-Rendering). Auf einer
// neuen Maschine zuerst mit --update erzeugen, dann committen.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "preview-out", "vr");
const SHOTS = join(ROOT, "scripts", "visual-out");
const REF = join(ROOT, "scripts", "visual-ref");
[OUT, SHOTS, REF].forEach((d) => mkdirSync(d, { recursive: true }));

const UPDATE = process.argv.includes("--update");
const VIEWPORT = { width: 900, height: 1100 };
const MISMATCH_WARN = 0.02; // 2 % abweichende Pixel -> Warnung

// engine -> Renderer-Datei + Export + Fixture-Ordner.
const ENGINES = [
  ["movement-space", "movementSpaceRenderer.ts", "buildMovementSpaceWorldCode", "movement-space"],
  ["mixing-balance", "mixingBalanceRenderer.ts", "buildMixingBalanceWorldCode", "mixing-balance"],
  ["building-construct", "buildingConstructRenderer.ts", "buildBuildingConstructWorldCode", "building-construct"],
  ["time-sequence", "timeSequenceRenderer.ts", "buildTimeSequenceWorldCode", "time-sequence"],
  ["detective-evidence", "detectiveEvidenceRenderer.ts", "buildDetectiveEvidenceWorldCode", "detective-evidence"],
  ["sort-match", "sortMatchRenderer.ts", "buildSortMatchWorldCode", "sort-match"],
  ["word-builder", "wordBuilderRenderer.ts", "buildWordBuilderWorldCode", "word-builder"],
  ["counting", "countingRenderer.ts", "buildCountingWorldCode", "counting"],
  ["pattern", "patternRenderer.ts", "buildPatternWorldCode", "pattern"],
  ["clock", "clockRenderer.ts", "buildClockWorldCode", "clock"],
  ["money", "moneyRenderer.ts", "buildMoneyWorldCode", "money"],
  ["map", "mapRenderer.ts", "buildMapWorldCode", "map"],
  ["diagram", "diagramRenderer.ts", "buildDiagramWorldCode", "diagram"],
  ["chart", "chartRenderer.ts", "buildChartWorldCode", "chart"],
];

function firstFixture(dir) {
  const d = join(ROOT, "scripts", "fixtures", dir);
  const f = readdirSync(d).filter((n) => n.endsWith(".json")).sort()[0];
  if (!f) throw new Error(`no fixture json in ${dir}`);
  return JSON.parse(readFileSync(join(d, f), "utf8"));
}

async function makeHtml(name, worldCode) {
  const worldPath = join(OUT, name + ".world.jsx");
  const entryPath = join(OUT, name + ".entry.jsx");
  writeFileSync(worldPath, worldCode, "utf8");
  writeFileSync(entryPath, [
    `import { createRoot } from 'react-dom/client';`,
    `import App from './${name}.world.jsx';`,
    `window.Meoluna = { reportScore:()=>{}, completeModule:()=>{}, complete:()=>{} };`,
    `createRoot(document.getElementById('root')).render(<App />);`,
  ].join("\n"), "utf8");
  const result = await build({
    entryPoints: [entryPath], bundle: true, write: false, format: "iife",
    jsx: "automatic", loader: { ".jsx": "jsx" },
    define: { "process.env.NODE_ENV": '"production"' }, absWorkingDir: ROOT,
  });
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8" />
<script src="https://cdn.tailwindcss.com"></script>
<style>*{animation:none!important;transition:none!important;caret-color:transparent!important;}</style>
</head><body style="margin:0"><div id="root"></div>
<script>${result.outputFiles[0].text.replace(/<\/script>/g, "<\\/script>")}</script>
</body></html>`;
  const htmlPath = join(OUT, name + ".html");
  writeFileSync(htmlPath, html, "utf8");
  return htmlPath;
}

function compare(name, buf) {
  const refPath = join(REF, name + ".png");
  if (UPDATE || !existsSync(refPath)) {
    writeFileSync(refPath, buf);
    return { state: existsSync(refPath) && !UPDATE ? "baseline" : "updated", ratio: 0 };
  }
  const cur = PNG.sync.read(buf);
  const ref = PNG.sync.read(readFileSync(refPath));
  if (cur.width !== ref.width || cur.height !== ref.height) {
    return { state: "size-changed", ratio: 1 };
  }
  const diff = new PNG({ width: cur.width, height: cur.height });
  const bad = pixelmatch(ref.data, cur.data, diff.data, cur.width, cur.height, { threshold: 0.1 });
  const ratio = bad / (cur.width * cur.height);
  if (ratio > MISMATCH_WARN) {
    writeFileSync(join(SHOTS, name + ".diff.png"), PNG.sync.write(diff));
  }
  return { state: ratio > MISMATCH_WARN ? "diff" : "ok", ratio };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  let hardFail = 0, warn = 0;

  for (const [name, file, fn, dir] of ENGINES) {
    let status = "?";
    const errors = [];
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));
    try {
      const mod = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", file)).href);
      const code = mod[fn](firstFixture(dir));
      const htmlPath = await makeHtml(name, code);
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(600);
      const info = await page.evaluate(() => {
        const r = document.getElementById("root");
        return { text: (r?.innerText || "").trim().length, buttons: document.querySelectorAll("button").length };
      });
      if (errors.length) { hardFail += 1; console.log(`FAIL ${name.padEnd(18)} render errors: ${errors[0].slice(0, 120)}`); continue; }
      if (info.text < 15 || info.buttons < 1) { hardFail += 1; console.log(`FAIL ${name.padEnd(18)} empty/blank root (text=${info.text}, buttons=${info.buttons})`); continue; }
      const buf = await page.screenshot({ clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height } });
      writeFileSync(join(SHOTS, name + ".png"), buf);
      const cmp = compare(name, buf);
      if (cmp.state === "diff" || cmp.state === "size-changed") { warn += 1; status = `WARN ${(cmp.ratio * 100).toFixed(1)}% diff`; }
      else status = cmp.state === "ok" ? "PASS" : cmp.state;
      console.log(`${status.padEnd(13)} ${name.padEnd(18)} text=${info.text} buttons=${info.buttons}`);
    } catch (e) {
      hardFail += 1;
      console.log(`FAIL ${name.padEnd(18)} ${e instanceof Error ? e.message.slice(0, 140) : String(e)}`);
    }
  }

  await browser.close();
  console.log(`\nScreenshots: scripts/visual-out/  | Baselines: scripts/visual-ref/`);
  console.log(`${hardFail === 0 ? "Alle Welten gerendert" : hardFail + " HART fehlerhaft"}${warn ? `, ${warn} mit Pixel-Abweichung (WARN)` : ""}.`);
  if (hardFail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
