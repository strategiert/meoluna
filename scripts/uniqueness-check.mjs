// Uniqueness-Check: macht "keine zwei Welten strukturell identisch" messbar.
//
// 1. Fixture-Sweep: innerhalb jeder Engine duerfen keine zwei Fixtures dieselbe
//    Struktur-Signatur haben (gleiches Skelett = nur Content-Varianz = zu wenig).
// 2. Theme-Spread: die seeded Theme-Wahl muss ueber viele Seeds streuen
//    (mindestens 4 von 5 Themes ueber 50 Seeds).
//
// Ausfuehren: npm run uniqueness-check  (node --import tsx/esm)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURES_ROOT = join(__dirname, "fixtures");

const sigModule = await import(
  pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "structureSignature.ts")).href
);
const { structureSignature, structureSignatureText, themeIndexForSeed } = sigModule;

let failed = 0;

// 1. Fixture-Sweep pro Engine-Verzeichnis
const engineDirs = readdirSync(FIXTURES_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const engine of engineDirs) {
  const dir = join(FIXTURES_ROOT, engine);
  const files = readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
  const seen = new Map();
  for (const file of files) {
    let spec;
    try {
      spec = JSON.parse(readFileSync(join(dir, file), "utf8"));
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${engine}/${file}: kein valides JSON (${error.message})`);
      continue;
    }
    const sig = structureSignature(spec);
    if (seen.has(sig)) {
      failed += 1;
      console.error(`FAIL ${engine}: ${file} und ${seen.get(sig)} haben identische Struktur-Signatur ${sig}`);
      console.error(`  Skelett:\n${structureSignatureText(spec).split("\n").map((l) => "    " + l).join("\n")}`);
    } else {
      seen.set(sig, file);
    }
  }
  if (files.length > 0) {
    console.log(`PASS ${engine}: ${files.length} Fixtures, ${seen.size} unterschiedliche Struktur-Signaturen`);
  }
}

// 2. Theme-Spread ueber synthetische Seeds
const seeds = Array.from({ length: 50 }, (_, i) => `welt-${i}-${(i * 7919) % 997}`);
const themes = new Set(seeds.map((seed) => themeIndexForSeed(seed)));
if (themes.size < 4) {
  failed += 1;
  console.error(`FAIL theme-spread: nur ${themes.size}/5 Themes ueber 50 Seeds — Seed-Streuung zu schwach`);
} else {
  console.log(`PASS theme-spread: ${themes.size}/5 Themes ueber 50 Seeds`);
}

if (failed > 0) {
  console.error(`\n${failed} Verstoss/Verstoesse — Uniqueness-Garantie strukturell verletzt.`);
  process.exit(1);
}
console.log("\nAlle Uniqueness-Checks bestanden.");
