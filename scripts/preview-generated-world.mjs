// Baut lokale HTML-Previews der deterministisch generierten Engine-Welten.
// Aufruf: node --import tsx/esm scripts/preview-generated-world.mjs
// Output: preview-out/movement.html + preview-out/focused.html
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = process.cwd();
const outDir = join(root, "preview-out");
mkdirSync(outDir, { recursive: true });

const { tryBuildArithmeticMovementSpec } = await import(
  pathToFileURL(join(root, "convex", "pipeline", "engines", "arithmeticMovementSpec.ts")).href
);
const { buildMovementSpaceWorldCode } = await import(
  pathToFileURL(join(root, "convex", "pipeline", "engines", "movementSpaceRenderer.ts")).href
);
const { buildFocusedArithmeticMiniAppCode, parseSignedIntegerAddition } = await import(
  pathToFileURL(join(root, "convex", "pipeline", "engines", "focusedArithmeticMiniApp.ts")).href
);
const { buildMixingBalanceWorldCode } = await import(
  pathToFileURL(join(root, "convex", "pipeline", "engines", "mixingBalanceRenderer.ts")).href
);
const { buildBuildingConstructWorldCode } = await import(
  pathToFileURL(join(root, "convex", "pipeline", "engines", "buildingConstructRenderer.ts")).href
);
const { buildTimeSequenceWorldCode } = await import(
  pathToFileURL(join(root, "convex", "pipeline", "engines", "timeSequenceRenderer.ts")).href
);

const brief = {
  inputMode: "material",
  subject: "mathematik",
  gradeLevel: "7",
  rawTopic: "Mein Kind versteht -66 + -33 nicht.",
  extractedTasks: ["-66 + (-33)"],
  learningGoals: ["Negative Zahlen addieren"],
  likelyMisconceptions: ["Zwei Minuszeichen ergeben immer Plus"],
  focus: "understand",
  confidence: "high",
};

const movementCode = buildMovementSpaceWorldCode(tryBuildArithmeticMovementSpec(brief));
const focusedCode = buildFocusedArithmeticMiniAppCode({
  prompt: brief.rawTopic,
  parsed: parseSignedIntegerAddition("-66 + (-33)"),
});

async function bundle(name, worldCode) {
  const worldPath = join(outDir, name + ".world.jsx");
  const entryPath = join(outDir, name + ".entry.jsx");
  writeFileSync(worldPath, worldCode, "utf8");
  writeFileSync(
    entryPath,
    [
      `import { createRoot } from 'react-dom/client';`,
      `import App from './${name}.world.jsx';`,
      `window.Meoluna = {`,
      `  reportScore: (...a) => console.log('Meoluna.reportScore', ...a),`,
      `  completeModule: (...a) => console.log('Meoluna.completeModule', ...a),`,
      `  complete: (...a) => console.log('Meoluna.complete', ...a),`,
      `};`,
      `createRoot(document.getElementById('root')).render(<App />);`,
    ].join("\n"),
    "utf8"
  );
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    loader: { ".jsx": "jsx" },
    define: { "process.env.NODE_ENV": '"production"' },
    absWorkingDir: root,
  });
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preview ${name}</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="margin:0">
<div id="root"></div>
<script>${result.outputFiles[0].text.replace(/<\/script>/g, "<\\/script>")}</script>
</body>
</html>`;
  writeFileSync(join(outDir, name + ".html"), html, "utf8");
  console.log("written", join(outDir, name + ".html"));
}

const mixingSpec = JSON.parse(
  readFileSync(join(root, "scripts", "fixtures", "mixing-balance", "mixed-bakery.json"), "utf8")
);
const mixingCode = buildMixingBalanceWorldCode(mixingSpec);

const buildingSpec = JSON.parse(
  readFileSync(join(root, "scripts", "fixtures", "building-construct", "baustelle-mixed.json"), "utf8")
);
const buildingCode = buildBuildingConstructWorldCode(buildingSpec);

const timeSpec = JSON.parse(
  readFileSync(join(root, "scripts", "fixtures", "time-sequence", "natur-zyklen.json"), "utf8")
);
const timeCode = buildTimeSequenceWorldCode(timeSpec);

await bundle("movement", movementCode);
await bundle("focused", focusedCode);
await bundle("mixing", mixingCode);
await bundle("building", buildingCode);
await bundle("time", timeCode);
