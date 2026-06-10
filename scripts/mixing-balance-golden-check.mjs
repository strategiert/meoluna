import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "mixing-balance");

async function loadModules() {
  const validatorPath = join(ROOT, "convex", "pipeline", "engines", "mixingBalanceValidator.ts");
  const rendererPath = join(ROOT, "convex", "pipeline", "engines", "mixingBalanceRenderer.ts");
  const routerPath = join(ROOT, "convex", "pipeline", "engines", "mixingTopicRouter.ts");

  const validator = await import(pathToFileURL(validatorPath).href);
  const renderer = await import(pathToFileURL(rendererPath).href);
  const router = await import(pathToFileURL(routerPath).href);

  return {
    validateMixingEngineSpec: validator.validateMixingEngineSpec,
    buildMixingBalanceWorldCode: renderer.buildMixingBalanceWorldCode,
    isLikelyMixingTopic: router.isLikelyMixingTopic,
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
  for (const needle of ["addIngredient", "mixPotion", "addChip", "Aus dem Rezept wird", "Aus der Waage wird"]) {
    if (!code.includes(needle)) {
      violations.push(`E_MIX_001: direct-manipulation marker fehlt: ${needle}`);
    }
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateMixingEngineSpec, buildMixingBalanceWorldCode, isLikelyMixingTopic } = await loadModules();
  let failed = 0;

  // Router-Checks
  const routerCases = [
    [{ prompt: "Mein Kind versteht Brüche nicht. Was bedeutet 3/4 von einer Pizza?" }, true],
    [{ prompt: "Saft im Verhältnis 2:3 mischen" }, true],
    [{ prompt: "Gleichungen mit Lücke: 4 + _ = 7 ausgleichen wie auf einer Waage" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese für Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyMixingTopic(input) !== expected) {
      failed += 1;
      console.error(`FAIL router: expected ${expected} for "${input.prompt}"`);
    }
  }

  const files = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateMixingEngineSpec(spec);

    if (!result.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const violation of result.violations) console.error(`  - ${violation}`);
      continue;
    }

    const code = buildMixingBalanceWorldCode(spec);
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

  // Negativ-Check: kaputte Specs müssen abgelehnt werden
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "balance-equation.json"), "utf8"));
  broken.rooms[0].leftWeights = [3];
  const brokenResult = validateMixingEngineSpec(broken);
  if (brokenResult.passed) {
    failed += 1;
    console.error("FAIL negative: unbalanced spec (left lighter than right) must be rejected");
  } else {
    console.log("PASS negative (unreachable balance rejected)");
  }

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
