// ============================================================================
// Code Validation - Programmatic checks for generated React code
// ============================================================================

const ALLOWED_PACKAGES = [
  "react",
  "framer-motion",
  "lucide-react",
  "canvas-confetti",
  "clsx",
  "recharts",
  "p5",
  "lodash",
  "date-fns",
  "@dnd-kit/core",
  "howler",
];

/**
 * Validates generated React code against known error patterns.
 * Returns an array of error descriptions. Empty array = valid.
 *
 * Fehlercode-Taxonomie (Pipeline v3):
 *   E_STRUCT_001  missing App component
 *   E_STRUCT_002  missing export default
 *   E_NAV_001     missing completeModule()
 *   E_NAV_002     missing complete()
 *   E_CODE_003    full HTML document (<!DOCTYPE)
 *   E_CODE_004    full HTML document (<html>)
 *   E_CODE_005    full HTML document (<body>)
 *   E_CODE_006    external script src
 *   E_CODE_007    window.location.replace / document.write
 *   E_CODE_008    duplicate function declaration
 *   E_CODE_009    Markdown in strings
 *   E_CODE_010    empty code
 *   E_CODE_011    code too short
 *   E_UI_001      Tailwind not loaded (runtime check — in Sandbox)
 */
export function validateCode(code: string): string[] {
  const errors: string[] = [];

  // 1. App component present
  if (!code.includes("function App") && !code.includes("const App")) {
    errors.push("E_STRUCT_001: MISSING App component definition");
  }

  // 2. export default present
  if (!code.includes("export default")) {
    errors.push("E_STRUCT_002: MISSING export default statement");
  }

  // 3. Forbidden: PI/TWO_PI/HALF_PI redeclaration
  if (/^\s*(const|let|var)\s+(PI|TWO_PI|HALF_PI)\s*=/m.test(code)) {
    errors.push("FORBIDDEN: PI/TWO_PI/HALF_PI redeclaration (conflicts with p5.js)");
  }

  // 4. Forbidden: top-level await
  if (/await\s+import\(/m.test(code)) {
    errors.push("FORBIDDEN: top-level await import");
  }

  // 5. Forbidden: ReactDOM/createRoot (sandbox handles rendering)
  if (/createRoot|ReactDOM/m.test(code)) {
    errors.push("FORBIDDEN: ReactDOM/createRoot (Sandbox handles rendering)");
  }

  // 6. Meoluna API integration check
  if (!code.includes("Meoluna.reportScore")) {
    errors.push("E_NAV_003: MISSING Meoluna.reportScore() calls");
  }
  if (!code.includes("Meoluna.completeModule")) {
    errors.push("E_NAV_001: MISSING Meoluna.completeModule() calls — every module must call this on completion");
  }
  if (!code.includes("Meoluna.complete")) {
    errors.push("E_NAV_002: MISSING Meoluna.complete() call — must be called when all modules are done");
  }

  // 6b. Interactive element checks
  // If code has <input type="range" it should have onChange
  if (code.includes('type="range"') || code.includes("type='range'")) {
    if (!code.includes("onChange")) {
      errors.push("BROKEN: Slider (<input type=\"range\">) without onChange handler — slider won't move!");
    }
  }

  // If code references DndContext, check for onDragEnd
  if (code.includes("DndContext")) {
    if (!code.includes("onDragEnd")) {
      errors.push("BROKEN: DndContext without onDragEnd handler — drag & drop won't work!");
    }
  }

  // If code has number input, check for parseFloat/parseInt (not string comparison)
  if (code.includes('type="number"') || code.includes("type='number'")) {
    if (!code.includes("parseFloat") && !code.includes("parseInt") && !code.includes("Number(")) {
      errors.push("WARNING: Number input found but no parseFloat/parseInt/Number() — string comparison may fail");
    }
  }

  // 7. Markdown in strings
  if (/["'`][^"'`]{0,200}\*\*[^"'`]{1,100}\*\*[^"'`]{0,200}["'`]/.test(code)) {
    errors.push("E_CODE_009: FORBIDDEN Markdown bold (**) in strings");
  }

  // 8. Invalid imports
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const pkg = match[1];
    if (!ALLOWED_PACKAGES.some((allowed) => pkg === allowed || pkg.startsWith(allowed + "/"))) {
      errors.push(`FORBIDDEN: Import from '${pkg}' not in allowed packages`);
    }
  }

  // 9. HTML wrapper tags (leichte Prüfung — hartes Gate passiert im structuralGate)
  if (/<html[\s>]/i.test(code)) {
    errors.push("E_CODE_004: FORBIDDEN <html> tag found — no full HTML documents");
  }
  if (/<head[\s>]/i.test(code)) {
    errors.push("FORBIDDEN: HTML <head> tag found");
  }
  if (/<script[\s>]/i.test(code) && !/<script\s+type="application/i.test(code)) {
    errors.push("FORBIDDEN: HTML <script> tag found");
  }

  // 10. Full-document patterns (Blockliste v3)
  if (/<!DOCTYPE/i.test(code)) {
    errors.push("E_CODE_003: FORBIDDEN <!DOCTYPE> found — kein vollständiges HTML-Dokument");
  }
  if (/<body[\s>]/i.test(code)) {
    errors.push("E_CODE_005: FORBIDDEN <body> tag found — kein vollständiges HTML-Dokument");
  }

  return errors;
}

/**
 * Attempts quick programmatic fixes for common issues.
 * Returns the fixed code and whether a fix was applied.
 */
export function quickFix(code: string, errors: string[]): { code: string; fixed: boolean } {
  let result = code;
  let fixed = false;

  // Auto-add export default if missing
  if (errors.some((e) => e.includes("MISSING export default statement"))) {
    if (!result.includes("export default")) {
      result += "\n\nexport default App;";
      fixed = true;
    }
  }

  // Remove createRoot/ReactDOM usage
  if (errors.some((e) => e.includes("ReactDOM/createRoot"))) {
    result = result
      .replace(/import\s+.*?from\s+['"]react-dom.*?['"];?\n?/g, "")
      .replace(/const\s+.*?=\s*createRoot.*?\n?/g, "")
      .replace(/.*?\.render\s*\(.*?\).*?\n?/g, "");
    fixed = true;
  }

  // Remove PI redeclarations
  if (errors.some((e) => e.includes("PI/TWO_PI/HALF_PI"))) {
    result = result.replace(/^\s*(const|let|var)\s+(PI|TWO_PI|HALF_PI)\s*=.*$/gm, "// Removed: $2 redeclaration (using Math.PI instead)");
    fixed = true;
  }

  // Remove HTML wrappers
  if (errors.some((e) => e.includes("HTML wrapper"))) {
    result = result
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<\/?head[^>]*>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    fixed = true;
  }

  return { code: result, fixed };
}

/**
 * Cleans up raw LLM code output (removes markdown wrappers etc.)
 */
export function cleanCodeOutput(raw: string): string {
  return raw
    .replace(/^```(?:jsx|tsx|javascript|typescript|react)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
}
