import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "building-construct");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "buildingConstructValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "buildingConstructRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "buildingTopicRouter.ts")).href);
  return {
    validateBuildingEngineSpec: validator.validateBuildingEngineSpec,
    buildBuildingConstructWorldCode: renderer.buildBuildingConstructWorldCode,
    isLikelyBuildingTopic: router.isLikelyBuildingTopic,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) {
    violations.push("E_STRUCT_001: export default function App fehlt");
  }
  if (!code.includes("completeModule")) {
    violations.push("E_NAV_001: completeModule fehlt");
  }
  if (!code.includes("complete")) {
    violations.push("E_NAV_002: complete fehlt");
  }
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) {
    violations.push("E_CODE_001: HTML-Dokument-Struktur ist im generierten React-Code verboten");
  }
  for (const needle of ["adjustWidth", "adjustHeight", "checkBuild", "placeShape", "Aus dem Bauen wird"]) {
    if (!code.includes(needle)) {
      violations.push(`E_BUILD_001: direct-manipulation marker fehlt: ${needle}`);
    }
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateBuildingEngineSpec, buildBuildingConstructWorldCode, isLikelyBuildingTopic } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Mein Kind versteht Fläche und Umfang nicht." }, true],
    [{ prompt: "Lernwelt zur Geometrie: Rechteck und Quadrat, Klasse 3" }, true],
    [{ prompt: "Formen erkennen für die erste Klasse" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese für Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyBuildingTopic(input) !== expected) {
      failed += 1;
      console.error(`FAIL router: expected ${expected} for "${input.prompt}"`);
    }
  }

  const files = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateBuildingEngineSpec(spec);
    if (!result.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const violation of result.violations) console.error(`  - ${violation}`);
      continue;
    }
    const code = buildBuildingConstructWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const violation of gate.violations) console.error(`  - ${violation}`);
      continue;
    }
    try {
      await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" });
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${file}`);
      console.error(`  - E_CODE_002: JSX compile failed: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: Fläche ohne Rechteck-Lösung im Raster muss abgelehnt werden
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "flaeche-garten.json"), "utf8"));
  broken.rooms[1].rounds[0].goal = { type: "area", area: 47 };
  if (validateBuildingEngineSpec(broken).passed) {
    failed += 1;
    console.error("FAIL negative: unsolvable area goal (47 in 8x6) must be rejected");
  } else {
    console.log("PASS negative (unsolvable area rejected)");
  }

  // Negativ: zu kleine Welt muss abgelehnt werden
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "flaeche-garten.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]];
  tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateBuildingEngineSpec(tiny).passed) {
    failed += 1;
    console.error("FAIL negative: 1-room/1-round world must be rejected (session size)");
  } else {
    console.log("PASS negative (tiny world rejected)");
  }

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
