import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const FIXTURE_PATH = join(ROOT, "scripts", "game-studio", "fixtures", "hello-game.js");

const failures = [];

const { validateGameSource, FORBIDDEN_PATTERNS } = await import(
  pathToFileURL(join(ROOT, "convex", "gameStudio", "sourceValidator.ts")).href
);

const helloSource = readFileSync(FIXTURE_PATH, "utf8");

// 1. Positiv: hello-game.js muss durch den Validator kommen.
const positive = validateGameSource(helloSource, { requiredGoalIds: ["goal-demo"] });
if (!positive.ok) {
  failures.push(`hello-game.js muss ok===true liefern, Violations: ${positive.violations.join(" | ")}`);
}

// 2. Syntax-Probe: esbuild darf beim positiven Fixture nicht werfen.
try {
  await transform(helloSource, { loader: "js", format: "esm" });
} catch (error) {
  failures.push(`esbuild transform der hello-game.js ist fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
}

// 3. Negativ-Matrix: für JEDES FORBIDDEN_PATTERNS-Element ein Trigger, der genau diese Regel reißt.
const TRIGGERS = {
  "eval": 'eval("1");',
  "function-ctor": 'new Function("return 1");',
  "fetch": 'fetch("x");',
  "xhr": "new XMLHttpRequest();",
  "websocket": 'new WebSocket("x");',
  "beacon": 'navigator.sendBeacon("x", "y");',
  "storage": 'localStorage.setItem("x", "y");',
  "parent": "console.log(window.parent.location);",
  "postmessage": 'postMessage({ type: "x" }, "*");',
  "worker": 'new Worker("worker.js");',
  "import-static": 'import Something from "somewhere";',
  "import-dynamic": 'const mod = import("x");',
  "require": 'const mod = require("x");',
  "dom-escape": 'document.write("x");',
  "script-inject": 'document.createElement("script");',
  "media-devices": "navigator.mediaDevices.getUserMedia();",
  "math-random": "Math.random();",
  "wall-clock": "Date.now();",
};

for (const rule of FORBIDDEN_PATTERNS) {
  const trigger = TRIGGERS[rule.id];
  if (trigger === undefined) {
    failures.push(`Negativ-Matrix: kein Trigger-String für FORBIDDEN_PATTERNS-Regel '${rule.id}' hinterlegt.`);
    continue;
  }
  const source = `${helloSource}\n${trigger}\n`;
  const result = validateGameSource(source, { requiredGoalIds: ["goal-demo"] });
  const hit = result.violations.some((v) => v.startsWith(`FORBIDDEN(${rule.id})`));
  if (!hit) {
    failures.push(`Regel '${rule.id}' schlägt beim Trigger "${trigger}" nicht an. Violations: ${result.violations.join(" | ")}`);
  }
}

// 4. Struktur-Negativ: je eine gezielte Verletzung der strukturellen Pflichtchecks.
{
  const source = helloSource.replace("export function bootMeolunaGame", "export function bootOtherGame");
  const result = validateGameSource(source, { requiredGoalIds: ["goal-demo"] });
  if (result.ok || !result.violations.some((v) => v.includes("bootMeolunaGame fehlt"))) {
    failures.push(`Struktur-Negativ (fehlender bootMeolunaGame-Export) nicht erkannt. Violations: ${result.violations.join(" | ")}`);
  }
}
{
  const source = helloSource.replace("context.api.completeGame", "context.api.finishGame");
  const result = validateGameSource(source, { requiredGoalIds: ["goal-demo"] });
  if (result.ok || !result.violations.some((v) => v.includes("completeGame-Aufruf fehlt"))) {
    failures.push(`Struktur-Negativ (fehlender completeGame-Aufruf) nicht erkannt. Violations: ${result.violations.join(" | ")}`);
  }
}
{
  const source = `${helloSource}\nnew window.Phaser.Game({});\n`;
  const result = validateGameSource(source, { requiredGoalIds: ["goal-demo"] });
  if (result.ok || !result.violations.some((v) => v.includes("Phaser.Game muss genau 1x erzeugt werden (gefunden: 2)"))) {
    failures.push(`Struktur-Negativ (2x Phaser.Game) nicht erkannt. Violations: ${result.violations.join(" | ")}`);
  }
}
{
  const result = validateGameSource(helloSource, { requiredGoalIds: ["goal-nicht-vorhanden"] });
  if (result.ok || !result.violations.some((v) => v.includes("goal-nicht-vorhanden") && v.includes("kommt im Source nicht vor"))) {
    failures.push(`Struktur-Negativ (fehlende Pflichtlernziel-ID) nicht erkannt. Violations: ${result.violations.join(" | ")}`);
  }
}
{
  const source = `${helloSource}\n// ${"x".repeat(300000)}\n`;
  const result = validateGameSource(source, { requiredGoalIds: ["goal-demo"] });
  if (result.ok || !result.violations.some((v) => v.includes("Source-Budget überschritten"))) {
    failures.push(`Struktur-Negativ (>250 KB Source) nicht erkannt. Violations: ${result.violations.join(" | ")}`);
  }
}

// 5. Obfuskations-Doku-Fälle: der Validator DARF sie verpassen (CSP fängt sie ab, Spec 5.5) — nur INFO, kein Fail.
const OBFUSCATION_CASES = [
  { label: "window[computed fetch]", trigger: 'window["fe"+"tch"]("x");' },
  { label: "constructor.constructor", trigger: "[].constructor.constructor(\"return 1\")();" },
];
for (const { label, trigger } of OBFUSCATION_CASES) {
  const source = `${helloSource}\n${trigger}\n`;
  const result = validateGameSource(source, { requiredGoalIds: ["goal-demo"] });
  console.log(`INFO: Obfuskationsfall "${label}" (ok=${result.ok}) — von CSP abgefangen (Spec 5.5)`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OK");
