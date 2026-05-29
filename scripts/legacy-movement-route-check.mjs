import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const legacyGeneratePath = resolve("convex/generate.ts");
const source = readFileSync(legacyGeneratePath, "utf8");

const checks = [
  {
    ok: source.includes("isLikelyMovementTopic"),
    message: "Legacy generate actions must detect movement-space topics.",
  },
  {
    ok: source.includes("runLearningDiagnosis"),
    message: "Legacy generate actions must create the same learning diagnosis as pipeline V2.",
  },
  {
    ok: source.includes("runMovementSpaceGenerator"),
    message: "Legacy generate actions must use the movement-space generator for movement topics.",
  },
  {
    ok: /tryGenerateMovementSpaceLegacy\(\{[\s\S]*prompt:\s*args\.prompt[\s\S]*\}\)/.test(source),
    message: "generateWorld must try movement-space before calling the legacy freeform generator.",
  },
  {
    ok: /tryGenerateMovementSpaceLegacy\(\{[\s\S]*pdfText:\s*args\.pdfText[\s\S]*\}\)/.test(source),
    message: "generateWorldFromPDF must forward PDF text to the movement-space legacy route.",
  },
];

const failed = checks.filter((check) => !check.ok);

if (failed.length > 0) {
  console.error("Legacy movement route check failed:");
  for (const check of failed) {
    console.error(`- ${check.message}`);
  }
  process.exit(1);
}

console.log("Legacy movement route check passed.");
