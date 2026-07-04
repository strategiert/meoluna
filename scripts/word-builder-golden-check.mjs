import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "word-builder");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "wordBuilderValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "wordBuilderRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "wordTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateWordEngineSpec: validator.validateWordEngineSpec,
    buildWordBuilderWorldCode: renderer.buildWordBuilderWorldCode,
    isLikelyWordTopic: router.isLikelyWordTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
    ENGINE_NAMES: registry.ENGINE_NAMES,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["placeChip", "buildPool", "Aus den Bausteinen wird"]) {
    if (!code.includes(needle)) violations.push(`E_WORD_001: direct-manipulation marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateWordEngineSpec, buildWordBuilderWorldCode, isLikelyWordTopic, pickEngineByKeywords, ENGINE_NAMES } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Rechtschreibung ueben fuer Klasse 1" }, true],
    [{ prompt: "Silbentrennung lernen" }, true],
    [{ prompt: "Lesen lernen mit kurzen Woertern" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese fuer Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyWordTopic(input) !== expected) {
      failed += 1;
      console.error(`FAIL router: expected ${expected} for "${input.prompt}"`);
    }
  }

  if (ENGINE_NAMES.length !== 14) {
    failed += 1;
    console.error(`FAIL registry: expected 14 engines, got ${ENGINE_NAMES.length}`);
  }
  if (pickEngineByKeywords({ prompt: "Rechtschreibung: Woerter richtig schreiben" }) !== "word-builder") {
    failed += 1;
    console.error("FAIL registry: spelling prompt must route to word-builder");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateWordEngineSpec(spec);
    if (!result.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const v of result.violations) console.error(`  - ${v}`);
      continue;
    }
    const code = buildWordBuilderWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const v of gate.violations) console.error(`  - ${v}`);
      continue;
    }
    try {
      await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" });
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${file}: JSX compile failed: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: chips ergeben nicht das Zielwort
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "buchstaben-werkstatt.json"), "utf8"));
  broken.rooms[0].rounds[0].chips = ["H", "u", "d"];
  if (validateWordEngineSpec(broken).passed) {
    failed += 1;
    console.error("FAIL negative: chips not matching the word must be rejected");
  } else {
    console.log("PASS negative (chip/word mismatch rejected)");
  }

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "buchstaben-werkstatt.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]];
  tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateWordEngineSpec(tiny).passed) {
    failed += 1;
    console.error("FAIL negative: 1-room/1-round world must be rejected (session size)");
  } else {
    console.log("PASS negative (tiny world rejected)");
  }

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
