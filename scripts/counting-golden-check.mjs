import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "counting");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "countingValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "countingRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "countingTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateCountEngineSpec: validator.validateCountEngineSpec,
    buildCountingWorldCode: renderer.buildCountingWorldCode,
    isLikelyCountingTopic: router.isLikelyCountingTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["ObjectField", "numberChoices", "Aus dem Zaehlen wird"]) {
    if (!code.includes(needle)) violations.push(`E_COUNT_001: marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateCountEngineSpec, buildCountingWorldCode, isLikelyCountingTopic, pickEngineByKeywords } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Zaehlen bis 10 lernen, Vorschule" }, true],
    [{ prompt: "Mengen vergleichen: mehr oder weniger" }, true],
    [{ prompt: "Wie viele Tiere? Anzahl bestimmen" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese fuer Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyCountingTopic(input) !== expected) { failed += 1; console.error(`FAIL router: expected ${expected} for "${input.prompt}"`); }
  }
  if (pickEngineByKeywords({ prompt: "Zaehlen bis 10, Anzahl bestimmen" }) !== "counting") {
    failed += 1; console.error("FAIL registry: counting prompt must route to counting");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateCountEngineSpec(spec);
    if (!result.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of result.violations) console.error(`  - ${v}`); continue; }
    const code = buildCountingWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of gate.violations) console.error(`  - ${v}`); continue; }
    try { await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" }); }
    catch (error) { failed += 1; console.error(`FAIL ${file}: JSX compile: ${error instanceof Error ? error.message : String(error)}`); continue; }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: compare more mit gleichen Counts (keine eindeutige Antwort)
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "zaehl-zoo.json"), "utf8"));
  const cmp = broken.rooms.find((r) => r.mode === "compare");
  cmp.rounds[0].rightCount = cmp.rounds[0].leftCount;
  if (validateCountEngineSpec(broken).passed) { failed += 1; console.error("FAIL negative: compare=more with equal counts must be rejected"); }
  else console.log("PASS negative (ambiguous compare rejected)");

  // Negativ: count ausserhalb 1-20
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "sternen-zaehlerei.json"), "utf8"));
  broken2.rooms[0].rounds[0].count = 99;
  if (validateCountEngineSpec(broken2).passed) { failed += 1; console.error("FAIL negative: count>20 must be rejected"); }
  else console.log("PASS negative (out-of-range count rejected)");

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "zaehl-zoo.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]]; tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateCountEngineSpec(tiny).passed) { failed += 1; console.error("FAIL negative: tiny world must be rejected"); }
  else console.log("PASS negative (tiny world rejected)");

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
