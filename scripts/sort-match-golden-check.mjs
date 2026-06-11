import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "sort-match");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "sortMatchValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "sortMatchRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "sortTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateSortEngineSpec: validator.validateSortEngineSpec,
    buildSortMatchWorldCode: renderer.buildSortMatchWorldCode,
    isLikelySortTopic: router.isLikelySortTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
    ENGINE_NAMES: registry.ENGINE_NAMES,
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
  for (const needle of ["sortCard", "pickPair", "Aus dem Sortieren wird"]) {
    if (!code.includes(needle)) {
      violations.push(`E_SORT_001: direct-manipulation marker fehlt: ${needle}`);
    }
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateSortEngineSpec, buildSortMatchWorldCode, isLikelySortTopic, pickEngineByKeywords, ENGINE_NAMES } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Englisch Vokabeln: Tiere für Klasse 3" }, true],
    [{ prompt: "der die das: Artikel üben" }, true],
    [{ prompt: "Einzahl und Mehrzahl zuordnen" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese für Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelySortTopic(input) !== expected) {
      failed += 1;
      console.error(`FAIL router: expected ${expected} for "${input.prompt}"`);
    }
  }

  // Registry: Keyword-Kette liefert für jedes Engine-Beispiel die richtige Engine
  const registryCases = [
    [{ prompt: "Zahlenstrahl mit negativen Zahlen" }, "movement-space"],
    [{ prompt: "Brüche verstehen: Was bedeutet 3/4 von einer Pizza?" }, "mixing-balance"],
    [{ prompt: "Fläche und Umfang von Rechtecken" }, "building-construct"],
    [{ prompt: "Lebenszyklus des Schmetterlings" }, "time-sequence"],
    [{ prompt: "Textverständnis üben mit kurzen Geschichten" }, "detective-evidence"],
    [{ prompt: "Englisch Vokabeln Tiere" }, "sort-match"],
    [{ prompt: "Photosynthese für Klasse 7" }, null],
  ];
  for (const [input, expected] of registryCases) {
    const got = pickEngineByKeywords(input);
    if (got !== expected) {
      failed += 1;
      console.error(`FAIL registry: expected ${expected} for "${input.prompt}", got ${got}`);
    }
  }
  if (ENGINE_NAMES.length !== 6) {
    failed += 1;
    console.error(`FAIL registry: expected 6 engines, got ${ENGINE_NAMES.length}`);
  }

  const files = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateSortEngineSpec(spec);
    if (!result.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const violation of result.violations) console.error(`  - ${violation}`);
      continue;
    }
    const code = buildSortMatchWorldCode(spec);
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

  // Negativ: Karte mit unbekannter Kategorie muss abgelehnt werden
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "grammatik-werkstatt.json"), "utf8"));
  broken.rooms[0].rounds[0].cards[0].categoryId = "unbekannt";
  if (validateSortEngineSpec(broken).passed) {
    failed += 1;
    console.error("FAIL negative: card with unknown category must be rejected");
  } else {
    console.log("PASS negative (unknown category rejected)");
  }

  // Negativ: doppeltes rechtes Label in pairs muss abgelehnt werden
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "vokabeln-tiere.json"), "utf8"));
  broken2.rooms[0].rounds[0].pairs[1].right.label = broken2.rooms[0].rounds[0].pairs[0].right.label;
  if (validateSortEngineSpec(broken2).passed) {
    failed += 1;
    console.error("FAIL negative: duplicate right label must be rejected");
  } else {
    console.log("PASS negative (ambiguous pair rejected)");
  }

  // Negativ: zu kleine Welt muss abgelehnt werden
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "grammatik-werkstatt.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]];
  tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateSortEngineSpec(tiny).passed) {
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
