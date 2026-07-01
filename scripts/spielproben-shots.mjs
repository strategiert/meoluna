// Rendert echte Meoluna-Welten (erste Fixture je Engine), betritt Raum 1 und
// macht einen Gameplay-Screenshot -> meoluna-web/public/spielproben/<engine>.png.
// Fallback: Hub-Screenshot, falls Raum-Eintritt scheitert.
//   node --import tsx/esm scripts/spielproben-shots.mjs
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "preview-out", "spielproben");
const DEST = join(ROOT, "..", "meoluna-web", "public", "spielproben");
mkdirSync(OUT, { recursive: true });
mkdirSync(DEST, { recursive: true });

const ENGINES = [
  ["counting", "countingRenderer.ts", "buildCountingWorldCode", "counting"],
  ["word-builder", "wordBuilderRenderer.ts", "buildWordBuilderWorldCode", "word-builder"],
  ["sort-match", "sortMatchRenderer.ts", "buildSortMatchWorldCode", "sort-match"],
  ["diagram", "diagramRenderer.ts", "buildDiagramWorldCode", "diagram"],
  ["building-construct", "buildingConstructRenderer.ts", "buildBuildingConstructWorldCode", "building-construct"],
  ["clock", "clockRenderer.ts", "buildClockWorldCode", "clock"],
  ["money", "moneyRenderer.ts", "buildMoneyWorldCode", "money"],
  ["map", "mapRenderer.ts", "buildMapWorldCode", "map"],
  ["movement-space", "movementSpaceRenderer.ts", "buildMovementSpaceWorldCode", "movement-space"],
  ["time-sequence", "timeSequenceRenderer.ts", "buildTimeSequenceWorldCode", "time-sequence"],
  ["detective-evidence", "detectiveEvidenceRenderer.ts", "buildDetectiveEvidenceWorldCode", "detective-evidence"],
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
    `window.Meoluna = { reportScore:()=>{}, completeModule:()=>{}, complete:()=>{} };`,
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

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 });
  let ok = 0;
  for (const [engine, file, fn, dir] of ENGINES) {
    try {
      const spec = firstFixture(dir);
      const mod = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", file)).href);
      const html = await makeHtml(engine, mod[fn](spec));
      await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(500);
      // Raum 1 betreten: erste Hub-Karte (Titel aus world.rooms[0]).
      let entered = false;
      try {
        const roomTitle = spec.world.rooms[0].title;
        await page.getByRole("button", { name: roomTitle, exact: false }).first().click({ timeout: 5000 });
        await page.waitForTimeout(700);
        entered = true;
      } catch {}
      const buf = await page.screenshot();
      writeFileSync(join(DEST, engine + ".png"), buf);
      ok += 1;
      console.log(`${entered ? "GAMEPLAY" : "HUB     "} ${engine}.png`);
    } catch (e) {
      console.log(`FAIL ${engine}: ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
    }
  }
  await browser.close();
  console.log(`\n${ok}/${ENGINES.length} Spielproben -> meoluna-web/public/spielproben/`);
}
main().catch((e) => { console.error(e); process.exit(1); });
