import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "clock");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "clockValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "clockRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "clockTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateClockEngineSpec: validator.validateClockEngineSpec,
    buildClockWorldCode: renderer.buildClockWorldCode,
    isLikelyClockTopic: router.isLikelyClockTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["AnalogClock", "Die Uhr zeigt", "hourHand"]) {
    if (!code.includes(needle)) violations.push(`E_CLOCK_001: marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateClockEngineSpec, buildClockWorldCode, isLikelyClockTopic, pickEngineByKeywords } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Uhr lesen lernen, Klasse 2" }, true],
    [{ prompt: "Uhrzeit ablesen und Zeiger stellen" }, true],
    [{ prompt: "Viertel nach drei, analoge Uhr" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese fuer Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyClockTopic(input) !== expected) { failed += 1; console.error(`FAIL router: expected ${expected} for "${input.prompt}"`); }
  }
  if (pickEngineByKeywords({ prompt: "Uhrzeit lesen, analoge Uhr, Zeiger stellen" }) !== "clock") {
    failed += 1; console.error("FAIL registry: clock prompt must route to clock");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateClockEngineSpec(spec);
    if (!result.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of result.violations) console.error(`  - ${v}`); continue; }
    const code = buildClockWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of gate.violations) console.error(`  - ${v}`); continue; }
    try { await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" }); }
    catch (error) { failed += 1; console.error(`FAIL ${file}: JSX compile: ${error instanceof Error ? error.message : String(error)}`); continue; }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: krumme Minute (nicht 0/15/30/45)
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "uhren-turm.json"), "utf8"));
  broken.rooms[0].rounds[0].minute = 10;
  broken.rooms[0].rounds[0].options[0].minute = 10;
  if (validateClockEngineSpec(broken).passed) { failed += 1; console.error("FAIL negative: crooked minute must be rejected"); }
  else console.log("PASS negative (crooked minute rejected)");

  // Negativ: read ohne korrekte Option
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "uhren-turm.json"), "utf8"));
  broken2.rooms[0].rounds[0].hour = 5;
  if (validateClockEngineSpec(broken2).passed) { failed += 1; console.error("FAIL negative: read without correct option must be rejected"); }
  else console.log("PASS negative (read missing correct option rejected)");

  // Negativ: Stunde ausserhalb 1-12
  const broken3 = JSON.parse(readFileSync(join(FIXTURE_DIR, "uhren-turm.json"), "utf8"));
  broken3.rooms[2].rounds[0].hour = 14;
  if (validateClockEngineSpec(broken3).passed) { failed += 1; console.error("FAIL negative: hour>12 must be rejected"); }
  else console.log("PASS negative (out-of-range hour rejected)");

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "uhren-turm.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]]; tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateClockEngineSpec(tiny).passed) { failed += 1; console.error("FAIL negative: tiny world must be rejected"); }
  else console.log("PASS negative (tiny world rejected)");

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
