import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sandboxPath = resolve("src/components/Sandbox.tsx");
const source = readFileSync(sandboxPath, "utf8");

const failures = [];

if (!source.includes("'/App.tsx': { code: sanitized")) {
  failures.push("Sandbox must provide generated world code as /App.tsx.");
}

if (!source.includes('import App from "./App.tsx";')) {
  failures.push(
    "Sandbox entry must import ./App.tsx explicitly so Sandpack cannot resolve its built-in /App.js Hello World template.",
  );
}

if (/import App from ["']\.\/App["'];/.test(source)) {
  failures.push("Sandbox entry must not use the ambiguous extensionless ./App import.");
}

if (failures.length > 0) {
  console.error("Sandbox entry check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Sandbox entry check passed.");
