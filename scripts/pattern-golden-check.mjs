import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "pattern");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "patternValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "patternRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "patternTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validatePatternEngineSpec: validator.validatePatternEngineSpec,
    buildPatternWorldCode: renderer.buildPatternWorldCode,
    isLikelyPatternTopic: router.isLikelyPatternTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["PatternRoom", "Das Muster lautet", "gapIndex"]) {
    if (!code.includes(needle)) violations.push(`E_PATTERN_001: marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validatePatternEngineSpec, buildPatternWorldCode, isLikelyPatternTopic, pickEngineByKeywords } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Muster fortsetzen, Vorschule" }, true],
    [{ prompt: "ABAB Muster erkennen" }, true],
    [{ prompt: "Was kommt als naechstes in der Reihe?" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese fuer Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyPatternTopic(input) !== expected) { failed += 1; console.error(`FAIL router: expected ${expected} for "${input.prompt}"`); }
  }
  if (pickEngineByKeywords({ prompt: "Muster erkennen und fortsetzen, ABAB" }) !== "pattern") {
    failed += 1; console.error("FAIL registry: pattern prompt must route to pattern");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validatePatternEngineSpec(spec);
    if (!result.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of result.violations) console.error(`  - ${v}`); continue; }
    const code = buildPatternWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of gate.violations) console.error(`  - ${v}`); continue; }
    try { await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" }); }
    catch (error) { failed += 1; console.error(`FAIL ${file}: JSX compile: ${error instanceof Error ? error.message : String(error)}`); continue; }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: nicht-periodische Reihe (kein eindeutiges Muster)
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "muster-werkstatt.json"), "utf8"));
  broken.rooms[0].rounds[0].sequence = ["🔴", "🔵", "🔴", "🟢"];
  broken.rooms[0].rounds[0].options = ["🔵", "🟢"];
  if (validatePatternEngineSpec(broken).passed) { failed += 1; console.error("FAIL negative: non-periodic sequence must be rejected"); }
  else console.log("PASS negative (non-periodic sequence rejected)");

  // Negativ: continue-Modus mit Luecke nicht am Ende
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "muster-werkstatt.json"), "utf8"));
  broken2.rooms[0].rounds[0].gapIndex = 1;
  if (validatePatternEngineSpec(broken2).passed) { failed += 1; console.error("FAIL negative: continue mode gap not at end must be rejected"); }
  else console.log("PASS negative (continue gap not at end rejected)");

  // Negativ: Option enthaelt fremdes Emoji (nicht aus der sequence)
  const broken3 = JSON.parse(readFileSync(join(FIXTURE_DIR, "muster-werkstatt.json"), "utf8"));
  broken3.rooms[0].rounds[0].options = ["🔴", "🔵", "🟣"];
  if (validatePatternEngineSpec(broken3).passed) { failed += 1; console.error("FAIL negative: foreign option emoji must be rejected"); }
  else console.log("PASS negative (foreign option rejected)");

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "muster-werkstatt.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]]; tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validatePatternEngineSpec(tiny).passed) { failed += 1; console.error("FAIL negative: tiny world must be rejected"); }
  else console.log("PASS negative (tiny world rejected)");

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
