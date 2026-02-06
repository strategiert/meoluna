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
 */
export function validateCode(code: string): string[] {
  const errors: string[] = [];

  // 1. App component present
  if (!code.includes("function App") && !code.includes("const App")) {
    errors.push("MISSING: App component definition");
  }

  // 2. export default present
  if (!code.includes("export default")) {
    errors.push("MISSING: export default statement");
  }

  // 3. Forbidden: PI/TWO_PI/HALF_PI redeclaration
  if (/^(const|let|var)\s+(PI|TWO_PI|HALF_PI)\s*=/m.test(code)) {
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
    errors.push("MISSING: Meoluna.reportScore() calls");
  }
  if (!code.includes("Meoluna.complete")) {
    errors.push("MISSING: Meoluna.complete() call");
  }

  // 7. Markdown in strings
  if (/["'`][^"'`]{0,200}\*\*[^"'`]{1,100}\*\*[^"'`]{0,200}["'`]/.test(code)) {
    errors.push("FORBIDDEN: Markdown bold (**) in strings");
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

  // 9. HTML wrapper
  if (/<html|<head|<script/i.test(code)) {
    errors.push("FORBIDDEN: HTML wrapper tags (<html>, <head>, <script>)");
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
  if (errors.includes("MISSING: export default statement")) {
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
    result = result.replace(/^(const|let|var)\s+(PI|TWO_PI|HALF_PI)\s*=.*$/gm, "// Removed: $2 redeclaration (using Math.PI instead)");
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
