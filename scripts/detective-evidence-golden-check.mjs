import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "detective-evidence");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "detectiveEvidenceValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "detectiveEvidenceRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "detectiveTopicRouter.ts")).href);
  return {
    validateDetectiveEngineSpec: validator.validateDetectiveEngineSpec,
    buildDetectiveEvidenceWorldCode: renderer.buildDetectiveEvidenceWorldCode,
    isLikelyDetectiveTopic: router.isLikelyDetectiveTopic,
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
  for (const needle of ["pickSentence", "eliminateSuspect", "Aus den Beweisen wird"]) {
    if (!code.includes(needle)) {
      violations.push(`E_DETECT_001: direct-manipulation marker fehlt: ${needle}`);
    }
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateDetectiveEngineSpec, buildDetectiveEvidenceWorldCode, isLikelyDetectiveTopic } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Textverständnis üben für Klasse 2" }, true],
    [{ prompt: "Detektiv-Lernwelt: Antworten im Text belegen" }, true],
    [{ prompt: "Argumente begründen und Schlussfolgern, Klasse 4" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Brüche für Klasse 3." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyDetectiveTopic(input) !== expected) {
      failed += 1;
      console.error(`FAIL router: expected ${expected} for "${input.prompt}"`);
    }
  }

  const files = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateDetectiveEngineSpec(spec);
    if (!result.passed) {
      failed += 1;
      console.error(`FAIL ${file}`);
      for (const violation of result.violations) console.error(`  - ${violation}`);
      continue;
    }
    const code = buildDetectiveEvidenceWorldCode(spec);
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

  // Negativ: Hinweis, der zwei Verdächtige gleichzeitig ausschließt, muss abgelehnt werden
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "kuchen-krimi.json"), "utf8"));
  const suspectsRoom = broken.rooms.find((room) => room.mode === "suspects");
  suspectsRoom.rounds[0].suspects[0].traits.ort = "Garten";
  if (validateDetectiveEngineSpec(broken).passed) {
    failed += 1;
    console.error("FAIL negative: clue eliminating two suspects at once must be rejected");
  } else {
    console.log("PASS negative (ambiguous clue rejected)");
  }

  // Negativ: evidenceIndex außerhalb des Textes muss abgelehnt werden
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "sachtext-forscher.json"), "utf8"));
  broken2.rooms[0].rounds[0].evidenceIndex = 99;
  if (validateDetectiveEngineSpec(broken2).passed) {
    failed += 1;
    console.error("FAIL negative: out-of-range evidenceIndex must be rejected");
  } else {
    console.log("PASS negative (out-of-range evidence rejected)");
  }

  // Negativ: zu kleine Welt muss abgelehnt werden
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "kuchen-krimi.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]];
  tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateDetectiveEngineSpec(tiny).passed) {
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
