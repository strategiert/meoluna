import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURE_DIR = join(__dirname, "fixtures", "money");

async function loadModules() {
  const validator = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "moneyValidator.ts")).href);
  const renderer = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "moneyRenderer.ts")).href);
  const router = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "moneyTopicRouter.ts")).href);
  const registry = await import(pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href);
  return {
    validateMoneyEngineSpec: validator.validateMoneyEngineSpec,
    buildMoneyWorldCode: renderer.buildMoneyWorldCode,
    isLikelyMoneyTopic: router.isLikelyMoneyTopic,
    pickEngineByKeywords: registry.pickEngineByKeywords,
  };
}

function structuralGate(code) {
  const violations = [];
  if (!/export default function App/.test(code)) violations.push("E_STRUCT_001: export default function App fehlt");
  if (!code.includes("completeModule")) violations.push("E_NAV_001: completeModule fehlt");
  if (!code.includes("complete")) violations.push("E_NAV_002: complete fehlt");
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) violations.push("E_CODE_001: HTML-Dokument-Struktur verboten");
  for (const needle of ["MoneyRoomScene", "Das macht zusammen", "addCoin"]) {
    if (!code.includes(needle)) violations.push(`E_MONEY_001: marker fehlt: ${needle}`);
  }
  return { passed: violations.length === 0, violations };
}

async function main() {
  const { validateMoneyEngineSpec, buildMoneyWorldCode, isLikelyMoneyTopic, pickEngineByKeywords } = await loadModules();
  let failed = 0;

  const routerCases = [
    [{ prompt: "Mit Geld bezahlen lernen, Klasse 2" }, true],
    [{ prompt: "Euro und Cent, Rueckgeld geben" }, true],
    [{ prompt: "Muenzen zaehlen und bezahlen" }, true],
    [{ prompt: "Erstelle eine Lernwelt zum Thema Photosynthese fuer Klasse 7." }, false],
  ];
  for (const [input, expected] of routerCases) {
    if (isLikelyMoneyTopic(input) !== expected) { failed += 1; console.error(`FAIL router: expected ${expected} for "${input.prompt}"`); }
  }
  if (pickEngineByKeywords({ prompt: "Mit Euro und Cent bezahlen, Rueckgeld geben" }) !== "money") {
    failed += 1; console.error("FAIL registry: money prompt must route to money");
  }

  const files = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json")).sort();
  for (const file of files) {
    const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const result = validateMoneyEngineSpec(spec);
    if (!result.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of result.violations) console.error(`  - ${v}`); continue; }
    const code = buildMoneyWorldCode(spec);
    const gate = structuralGate(code);
    if (!gate.passed) { failed += 1; console.error(`FAIL ${file}`); for (const v of gate.violations) console.error(`  - ${v}`); continue; }
    try { await transform(code, { loader: "jsx", jsx: "automatic", format: "esm" }); }
    catch (error) { failed += 1; console.error(`FAIL ${file}: JSX compile: ${error instanceof Error ? error.message : String(error)}`); continue; }
    console.log(`PASS ${file} (${code.split("\n").length} lines)`);
  }

  // Negativ: pay target nicht legbar mit denoms
  const broken = JSON.parse(readFileSync(join(FIXTURE_DIR, "markt-von-luno.json"), "utf8"));
  broken.rooms[0].rounds[0].targetCents = 3;
  broken.rooms[0].rounds[0].denoms = [10, 20];
  if (validateMoneyEngineSpec(broken).passed) { failed += 1; console.error("FAIL negative: unpayable target must be rejected"); }
  else console.log("PASS negative (unpayable target rejected)");

  // Negativ: change paid <= price
  const broken2 = JSON.parse(readFileSync(join(FIXTURE_DIR, "markt-von-luno.json"), "utf8"));
  broken2.rooms[2].rounds[0].paidCents = 80;
  if (validateMoneyEngineSpec(broken2).passed) { failed += 1; console.error("FAIL negative: paid<=price must be rejected"); }
  else console.log("PASS negative (paid<=price rejected)");

  // Negativ: ungueltige Stueckelung
  const broken3 = JSON.parse(readFileSync(join(FIXTURE_DIR, "markt-von-luno.json"), "utf8"));
  broken3.rooms[0].rounds[0].denoms = [3, 7];
  if (validateMoneyEngineSpec(broken3).passed) { failed += 1; console.error("FAIL negative: invalid denom must be rejected"); }
  else console.log("PASS negative (invalid denom rejected)");

  // Negativ: Betrag ueber 20 Euro
  const broken4 = JSON.parse(readFileSync(join(FIXTURE_DIR, "markt-von-luno.json"), "utf8"));
  broken4.rooms[0].rounds[0].targetCents = 5000;
  broken4.rooms[0].rounds[0].denoms = [1000, 2000];
  if (validateMoneyEngineSpec(broken4).passed) { failed += 1; console.error("FAIL negative: amount>20 Euro must be rejected"); }
  else console.log("PASS negative (amount over 20 Euro rejected)");

  // Negativ: zu kleine Welt
  const tiny = JSON.parse(readFileSync(join(FIXTURE_DIR, "markt-von-luno.json"), "utf8"));
  tiny.rooms = [tiny.rooms[0]]; tiny.rooms[0].rounds = tiny.rooms[0].rounds.slice(0, 1);
  if (validateMoneyEngineSpec(tiny).passed) { failed += 1; console.error("FAIL negative: tiny world must be rejected"); }
  else console.log("PASS negative (tiny world rejected)");

  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
