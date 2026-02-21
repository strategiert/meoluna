/**
 * Meoluna Golden Check
 *
 * Prüft alle Fixture-WorldData JSONs durch:
 *   1. buildWorldCode() — deterministischer Assembler
 *   2. Structural Gate — 10 harte Assertions
 *
 * Kein LLM. Rein deterministisch. Schnell (<2s).
 *
 * Verwendung:
 *   npm run golden-check
 *   node --import tsx/esm scripts/golden-check.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Structural Gate (reimplementiert ohne Convex-Deps) ─────────────────────
function structuralGate(code) {
  const violations = [];

  if (!/(function App|const App\s*=)/.test(code))
    violations.push('E_STRUCT_001: App-Komponente fehlt');

  if (!/export default/.test(code))
    violations.push('E_STRUCT_002: export default fehlt');

  if (!code.includes('Meoluna.completeModule(') && !code.includes('window.Meoluna.completeModule('))
    violations.push('E_NAV_001: Meoluna.completeModule() fehlt');

  if (!/Meoluna\.complete(?!Module)\s*\(/.test(code))
    violations.push('E_NAV_002: Meoluna.complete() fehlt');

  if (/<!DOCTYPE/i.test(code))     violations.push('E_CODE_003: DOCTYPE gefunden');
  if (/<html[\s>]/i.test(code))    violations.push('E_CODE_004: <html> gefunden');
  if (/<body[\s>]/i.test(code))    violations.push('E_CODE_005: <body> gefunden');
  if (/<script\s+src=/i.test(code)) violations.push('E_CODE_006: <script src> gefunden');

  if (/window\.location\.replace|document\.write\s*\(/.test(code))
    violations.push('E_CODE_007: gefährliche DOM-Operation');

  const funcNames = [...code.matchAll(/^function\s+(\w+)\s*\(/gm)].map(m => m[1]);
  const seen = new Set(); const dupes = new Set();
  for (const n of funcNames) { if (seen.has(n)) dupes.add(n); seen.add(n); }
  if (dupes.size > 0) violations.push(`E_CODE_008: Doppelte Funktionen: ${[...dupes].join(', ')}`);

  if (/["'`][^"'`]{0,200}\*\*[^"'`]{1,100}\*\*[^"'`]{0,200}["'`]/.test(code))
    violations.push('E_CODE_009: Markdown (**bold**) in String');

  if (code.trim().length === 0) violations.push('E_CODE_010: Code ist leer');
  else if (code.trim().split('\n').length < 20) violations.push('E_CODE_011: Code zu kurz');

  return { passed: violations.length === 0, violations };
}

// ── buildWorldCode laden (via tsx ESM) ────────────────────────────────────
async function loadBuildWorldCode() {
  try {
    const skeletonPath = join(ROOT, 'convex/pipeline/skeleton/worldSkeleton.ts');
    const skeletonUrl = pathToFileURL(skeletonPath).href;
    const mod = await import(skeletonUrl);
    return mod.buildWorldCode;
  } catch (e) {
    console.error('\n❌ Fehler beim Laden von worldSkeleton.ts:');
    console.error('   ', e.message);
    console.error('\n   Stelle sicher dass tsx installiert ist: npm install -D tsx');
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Meoluna Golden Check\n');

  const buildWorldCode = await loadBuildWorldCode();
  const fixturesDir = join(__dirname, 'fixtures');

  let files;
  try {
    files = readdirSync(fixturesDir).filter(f => f.endsWith('.json')).sort();
  } catch {
    console.error(`❌ Fixtures-Verzeichnis nicht gefunden: ${fixturesDir}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('❌ Keine JSON-Fixtures in scripts/fixtures/');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const path = join(fixturesDir, file);

    // JSON parsen
    let worldData;
    try {
      worldData = JSON.parse(readFileSync(path, 'utf-8'));
    } catch (e) {
      console.log(`❌ ${file}: JSON-Fehler: ${e.message}`);
      failed++;
      continue;
    }

    // Skeleton assemblieren
    let code;
    try {
      code = buildWorldCode(worldData);
    } catch (e) {
      console.log(`❌ ${file}: buildWorldCode Fehler: ${e.message}`);
      failed++;
      continue;
    }

    // Structural Gate
    const gate = structuralGate(code);
    if (gate.passed) {
      console.log(`✅ ${file} (${code.split('\n').length} Zeilen)`);
      passed++;
    } else {
      console.log(`❌ ${file}:`);
      gate.violations.forEach(v => console.log(`   ${v}`));
      failed++;
    }
  }

  const total = passed + failed;
  console.log(`\n${passed}/${total} Golden Fixtures bestanden.`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Unerwarteter Fehler:', e);
  process.exit(1);
});
