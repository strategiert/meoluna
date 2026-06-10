import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "time-sequence");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "timeSequenceValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "timeSequenceRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "timeTopicRouter.ts")).href);
  return {
    validateTimeEngineSpec: validator.validateTimeEngineSpec,
    buildTimeSequenceWorldCode: renderer.buildTimeSequenceWorldCode,
    isLikelyTimeTopic: router.isLikelyTimeTopic,
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
  for (const needle of ["placeEvent", "buildEventPool", "Aus der Reihenfolge wird"]) {
    if (!code.includes(needle)) {
      violations.push(`E_TIME_001: direct-manipulation marker fehlt: ${needle}`);
    }
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateTimeEngineSpec, buildTimeSequenceWorldCode, isLikelyTimeTopic } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Zeitleiste: Epochen von der Steinzeit bis heute ordnen" }, true],
    [{ prompt: "Lebenszyklus des Schmetterlings für Klasse 2" }, true],
    [{ prompt: "Ursache und Wirkung beim Wetter" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Brüche für Klasse 3." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyTimeTopic(input) !== expected) {
      failed += 1;
      console.error(`FAIL router: expected ${expected} for "${input.prompt}"`);
    }
  }

  const files = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateTimeEngineSpec(spec);
    if (!result.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const violation of result.violations) console.error(`  - ${violation}`);
      continue;
    }
    const code = buildTimeSequenceWorldCode(spec);
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

  // Negativ: doppelte Event-Id in einer Runde muss abgelehnt werden
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "natur-zyklen.json"), "utf8"));
  broken.rooms[0].rounds[0].events[1].id = broken.rooms[0].rounds[0].events[0].id;
  if (validateTimeEngineSpec(broken).passed) {
    failed += 1;
    console.error("FAIL negative: duplicate event id must be rejected");
  } else {
    console.log("PASS negative (duplicate event id rejected)");
  }

  // Negativ: zu kleine Welt muss abgelehnt werden
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "natur-zyklen.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]];
  tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateTimeEngineSpec(tiny).passed) {
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
