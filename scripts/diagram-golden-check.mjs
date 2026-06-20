import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "diagram");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "diagramValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "diagramRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "diagramTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateDiagramEngineSpec: validator.validateDiagramEngineSpec,
    buildDiagramWorldCode: renderer.buildDiagramWorldCode,
    isLikelyDiagramTopic: router.isLikelyDiagramTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["DiagramStage", "Aus dem Schaubild wird", "pickLabel"]) {
    if (!code.includes(needle)) violations.push(`E_DIAGRAM_001: marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateDiagramEngineSpec, buildDiagramWorldCode, isLikelyDiagramTopic, pickEngineByKeywords } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Die Teile einer Pflanze benennen, Klasse 3" }, true],
    [{ prompt: "Aufbau des Stromkreises beschriften" }, true],
    [{ prompt: "Koerperteile benennen" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Bruchrechnen fuer Klasse 6." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyDiagramTopic(input) !== expected) { failed += 1; console.error(`FAIL router: expected ${expected} for "${input.prompt}"`); }
  }
  if (pickEngineByKeywords({ prompt: "Teile einer Pflanze benennen, Schaubild beschriften" }) !== "diagram") {
    failed += 1; console.error("FAIL registry: diagram prompt must route to diagram");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateDiagramEngineSpec(spec);
    if (!result.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of result.violations) console.error(`  - ${v}`); continue; }
    const code = buildDiagramWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of gate.violations) console.error(`  - ${v}`); continue; }
    try { await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" }); }
    catch (error) { failed += 1; console.error(`FAIL ${file}: JSX compile: ${error instanceof Error ? error.message : String(error)}`); continue; }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: label-Option mit fremdem Begriff (nicht aus den Markern)
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "pflanzen-schaubild.json"), "utf8"));
  broken.rooms[0].rounds[0].options = ["Wurzel", "Photosynthese"];
  if (validateDiagramEngineSpec(broken).passed) { failed += 1; console.error("FAIL negative: foreign option must be rejected"); }
  else console.log("PASS negative (foreign option rejected)");

  // Negativ: ueberlappende Marker
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "pflanzen-schaubild.json"), "utf8"));
  broken2.rooms[0].markers[1].x = broken2.rooms[0].markers[0].x;
  broken2.rooms[0].markers[1].y = broken2.rooms[0].markers[0].y;
  if (validateDiagramEngineSpec(broken2).passed) { failed += 1; console.error("FAIL negative: overlapping markers must be rejected"); }
  else console.log("PASS negative (overlapping markers rejected)");

  // Negativ: Marker-Position ausserhalb 0-100
  const broken3 = JSON.parse(readFileSync(join(FIXTURE_DIR, "pflanzen-schaubild.json"), "utf8"));
  broken3.rooms[0].markers[0].y = 140;
  if (validateDiagramEngineSpec(broken3).passed) { failed += 1; console.error("FAIL negative: out-of-stage marker must be rejected"); }
  else console.log("PASS negative (out-of-stage marker rejected)");

  // Negativ: doppelter Marker-Begriff
  const broken4 = JSON.parse(readFileSync(join(FIXTURE_DIR, "pflanzen-schaubild.json"), "utf8"));
  broken4.rooms[0].markers[2].label = broken4.rooms[0].markers[0].label;
  if (validateDiagramEngineSpec(broken4).passed) { failed += 1; console.error("FAIL negative: duplicate marker label must be rejected"); }
  else console.log("PASS negative (duplicate marker label rejected)");

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "pflanzen-schaubild.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]]; tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateDiagramEngineSpec(tiny).passed) { failed += 1; console.error("FAIL negative: tiny world must be rejected"); }
  else console.log("PASS negative (tiny world rejected)");

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
