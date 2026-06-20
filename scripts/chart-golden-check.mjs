import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "chart");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "chartValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "chartRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "chartTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateChartEngineSpec: validator.validateChartEngineSpec,
    buildChartWorldCode: renderer.buildChartWorldCode,
    isLikelyChartTopic: router.isLikelyChartTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["ChartStage", "Aus dem Diagramm wird", "pickValue"]) {
    if (!code.includes(needle)) violations.push(`E_CHART_001: marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateChartEngineSpec, buildChartWorldCode, isLikelyChartTopic, pickEngineByKeywords } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Balkendiagramm ablesen, Klasse 3" }, true],
    [{ prompt: "Daten und Haeufigkeit, Piktogramm lesen" }, true],
    [{ prompt: "Strichliste auswerten" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Fotosynthese fuer Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyChartTopic(input) !== expected) { failed += 1; console.error(`FAIL router: expected ${expected} for "${input.prompt}"`); }
  }
  if (pickEngineByKeywords({ prompt: "Balkendiagramm ablesen, Daten und Haeufigkeit" }) !== "chart") {
    failed += 1; console.error("FAIL registry: chart prompt must route to chart");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateChartEngineSpec(spec);
    if (!result.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of result.violations) console.error(`  - ${v}`); continue; }
    const code = buildChartWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of gate.violations) console.error(`  - ${v}`); continue; }
    try { await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" }); }
    catch (error) { failed += 1; console.error(`FAIL ${file}: JSX compile: ${error instanceof Error ? error.message : String(error)}`); continue; }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: read-Option ohne korrekten Wert
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "klassen-umfrage.json"), "utf8"));
  broken.rooms[0].rounds[0].options = [5, 6, 7];
  if (validateChartEngineSpec(broken).passed) { failed += 1; console.error("FAIL negative: options without correct value must be rejected"); }
  else console.log("PASS negative (missing correct value rejected)");

  // Negativ: find "most" mit Gleichstand an der Spitze
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "klassen-umfrage.json"), "utf8"));
  broken2.rooms[2].categories[0].value = 9; // jetzt zwei mit 9 (Mo + Di)
  if (validateChartEngineSpec(broken2).passed) { failed += 1; console.error("FAIL negative: tie at most must be rejected"); }
  else console.log("PASS negative (tie at most rejected)");

  // Negativ: picto-Wert ueber 12
  const broken3 = JSON.parse(readFileSync(join(FIXTURE_DIR, "piktogramm-garten.json"), "utf8"));
  broken3.rooms[0].categories[0].value = 20;
  if (validateChartEngineSpec(broken3).passed) { failed += 1; console.error("FAIL negative: picto value>12 must be rejected"); }
  else console.log("PASS negative (picto value too high rejected)");

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "klassen-umfrage.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]]; tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateChartEngineSpec(tiny).passed) { failed += 1; console.error("FAIL negative: tiny world must be rejected"); }
  else console.log("PASS negative (tiny world rejected)");

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
