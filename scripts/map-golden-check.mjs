import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "map");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "mapValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "mapRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "mapTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateMapEngineSpec: validator.validateMapEngineSpec,
    buildMapWorldCode: renderer.buildMapWorldCode,
    isLikelyMapTopic: router.isLikelyMapTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["MapRoomScene", "MapGrid", "pickCell", "Kompass"]) {
    if (!code.includes(needle)) violations.push(`E_MAP_001: marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateMapEngineSpec, buildMapWorldCode, isLikelyMapTopic, pickEngineByKeywords } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Himmelsrichtungen lernen, Klasse 2" }, true],
    [{ prompt: "Schatzkarte lesen und Kompass" }, true],
    [{ prompt: "Karte lesen, Orientierung" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese fuer Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyMapTopic(input) !== expected) { failed += 1; console.error(`FAIL router: expected ${expected} for "${input.prompt}"`); }
  }
  if (pickEngineByKeywords({ prompt: "Himmelsrichtungen und Karte lesen mit Kompass" }) !== "map") {
    failed += 1; console.error("FAIL registry: map prompt must route to map");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateMapEngineSpec(spec);
    if (!result.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of result.violations) console.error(`  - ${v}`); continue; }
    const code = buildMapWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of gate.violations) console.error(`  - ${v}`); continue; }
    try { await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" }); }
    catch (error) { failed += 1; console.error(`FAIL ${file}: JSX compile: ${error instanceof Error ? error.message : String(error)}`); continue; }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: Pfad verlaesst das Gitter
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "schatzinsel.json"), "utf8"));
  broken.rooms[2].rounds[0].steps = [{ dir: "north", count: 9 }];
  if (validateMapEngineSpec(broken).passed) { failed += 1; console.error("FAIL negative: out-of-grid path must be rejected"); }
  else console.log("PASS negative (out-of-grid path rejected)");

  // Negativ: Pfad endet auf Startzelle (trivial)
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "schatzinsel.json"), "utf8"));
  broken2.rooms[2].rounds[0].steps = [{ dir: "east", count: 1 }, { dir: "west", count: 1 }];
  if (validateMapEngineSpec(broken2).passed) { failed += 1; console.error("FAIL negative: path ending on start must be rejected"); }
  else console.log("PASS negative (trivial path rejected)");

  // Negativ: landmark ausserhalb des Gitters
  const broken3 = JSON.parse(readFileSync(join(FIXTURE_DIR, "schatzinsel.json"), "utf8"));
  broken3.rooms[0].landmarks[0].row = 9;
  if (validateMapEngineSpec(broken3).passed) { failed += 1; console.error("FAIL negative: out-of-bounds landmark must be rejected"); }
  else console.log("PASS negative (out-of-bounds landmark rejected)");

  // Negativ: zwei landmarks auf derselben Zelle
  const broken4 = JSON.parse(readFileSync(join(FIXTURE_DIR, "schatzinsel.json"), "utf8"));
  broken4.rooms[0].landmarks[1].row = broken4.rooms[0].landmarks[0].row;
  broken4.rooms[0].landmarks[1].col = broken4.rooms[0].landmarks[0].col;
  if (validateMapEngineSpec(broken4).passed) { failed += 1; console.error("FAIL negative: duplicate landmark cell must be rejected"); }
  else console.log("PASS negative (duplicate landmark cell rejected)");

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "schatzinsel.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]]; tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateMapEngineSpec(tiny).passed) { failed += 1; console.error("FAIL negative: tiny world must be rejected"); }
  else console.log("PASS negative (tiny world rejected)");

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
