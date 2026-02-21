// ============================================================================
// STRUCTURAL GATE (Step 9.5)
// 10 harte Assertions — läuft NACH Validator, VOR DB-Speicherung.
// Bei Fail: Exception → generationSessions.status = "failed", kein worlds-Insert.
// ============================================================================

export interface StructuralGateResult {
  passed: boolean;
  violations: string[];  // Fehlercodes (E_STRUCT_001, E_NAV_001, ...)
  score: number;         // 0-10 (10 = alle Checks bestanden)
}

/**
 * Führt alle strukturellen Checks auf dem generierten Code durch.
 * Wirft KEINE Exception — gibt Ergebnis-Objekt zurück.
 * Der Orchestrator ist für das Exception-Throwing zuständig.
 */
export function runStructuralGate(code: string): StructuralGateResult {
  const violations: string[] = [];

  // ── CHECK 1: App-Komponente vorhanden ────────────────────────────────────
  if (!code.includes("function App") && !code.includes("const App")) {
    violations.push("E_STRUCT_001: App-Komponente fehlt (function App / const App)");
  }

  // ── CHECK 2: export default vorhanden ────────────────────────────────────
  if (!code.includes("export default")) {
    violations.push("E_STRUCT_002: export default fehlt");
  }

  // ── CHECK 3: Meoluna.completeModule() mindestens 1x vorhanden ────────────
  if (!code.includes("Meoluna.completeModule(") && !code.includes("window.Meoluna.completeModule(")) {
    violations.push("E_NAV_001: Meoluna.completeModule() fehlt — Modul-Abschluss nicht implementiert");
  }

  // ── CHECK 4: Meoluna.complete() mindestens 1x vorhanden ──────────────────
  // Zähle alle complete()-Calls und completeModule()-Calls
  // Wenn nur completeModule() vorhanden ist, fehlt das echte complete()
  const completeCallCount = (code.match(/Meoluna\.complete\s*\(/g) || []).length;
  const completeModuleCallCount = (code.match(/Meoluna\.completeModule\s*\(/g) || []).length;
  if (completeCallCount <= completeModuleCallCount) {
    // Nur completeModule gefunden, kein echtes complete()
    violations.push("E_NAV_002: Meoluna.complete() fehlt — Welt-Abschluss nicht implementiert");
  }

  // ── CHECK 5: Keine verbotenen HTML-Tags (Full-Document-Fehler) ────────────
  if (/<!DOCTYPE/i.test(code)) {
    violations.push("E_CODE_003: <!DOCTYPE> gefunden — kein vollständiges HTML-Dokument erlaubt");
  }
  if (/<html[\s>]/i.test(code)) {
    violations.push("E_CODE_004: <html>-Tag gefunden — kein vollständiges HTML-Dokument erlaubt");
  }
  if (/<body[\s>]/i.test(code)) {
    violations.push("E_CODE_005: <body>-Tag gefunden — kein vollständiges HTML-Dokument erlaubt");
  }

  // ── CHECK 6: Keine <script src=...> Tags ────────────────────────────────
  if (/<script\s+src=/i.test(code)) {
    violations.push("E_CODE_006: <script src=...> gefunden — externe Scripts nicht erlaubt");
  }

  // ── CHECK 7: Keine gefährlichen DOM-Manipulationen ────────────────────────
  if (/window\.location\.replace|document\.write\s*\(/.test(code)) {
    violations.push("E_CODE_007: window.location.replace / document.write gefunden — nicht erlaubt");
  }

  // ── CHECK 8: Keine doppelten Funktionsdeklarationen ──────────────────────
  const funcDecls = [...code.matchAll(/^function\s+(\w+)\s*\(/gm)].map(m => m[1]);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const name of funcDecls) {
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }
  if (duplicates.size > 0) {
    violations.push(`E_CODE_008: Doppelte Funktionsdeklaration(en): ${[...duplicates].join(", ")}`);
  }

  // ── CHECK 9: Kein Markdown in Strings (** bold **) ────────────────────────
  if (/["'`][^"'`]{0,200}\*\*[^"'`]{1,100}\*\*[^"'`]{0,200}["'`]/.test(code)) {
    violations.push("E_CODE_009: Markdown-Bold (**...**) in String gefunden — LLM-Artefakt");
  }

  // ── CHECK 10: Code nicht leer / Mindestlänge ────────────────────────────
  const trimmed = code.trim();
  if (trimmed.length === 0) {
    violations.push("E_CODE_010: Code ist leer");
  } else if (trimmed.split("\n").length < 20) {
    violations.push(`E_CODE_011: Code zu kurz (${trimmed.split("\n").length} Zeilen, Minimum: 20)`);
  }

  const score = Math.max(0, Math.round(10 - (violations.length * 10 / 10)));

  return {
    passed: violations.length === 0,
    violations,
    score,
  };
}
