import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "movement-space");

async function loadMovementModules() {
  const validatorPath = join(ROOT, "convex", "pipeline", "engines", "movementSpaceValidator.ts");
  const rendererPath = join(ROOT, "convex", "pipeline", "engines", "movementSpaceRenderer.ts");

  const validator = await import(pathToFileURL(validatorPath).href);
  let renderer = null;
  try {
    renderer = await import(pathToFileURL(rendererPath).href);
  } catch {
    // Renderer is added after the first validator checks exist.
  }

  return {
    validateMovementEngineSpec: validator.validateMovementEngineSpec,
    buildMovementSpaceWorldCode: renderer?.buildMovementSpaceWorldCode,
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
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateMovementEngineSpec, buildMovementSpaceWorldCode } = await loadMovementModules();
  const files = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".json")).sort();
  let failed = 0;

  for (const file of files) {
    const fixturePath = join(FIXTURE_DIR, file);
    const spec = JSON.parse(readFileSync(fixturePath, "utf8"));
    const result = validateMovementEngineSpec(spec);

    if (!result.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const violation of result.violations) console.error(`  - ${violation}`);
      continue;
    }

    if (buildMovementSpaceWorldCode) {
      const code = buildMovementSpaceWorldCode(spec);
      const gate = structuralGate(code);
      if (!gate.passed) {
        failed += 1;
        console.error(`FAIL ${file}`);
        for (const violation of gate.violations) console.error(`  - ${violation}`);
        continue;
      }
      console.log(`PASS ${file} (${code.split("\n").length} lines)`);
    } else {
      console.log(`PASS ${file}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
