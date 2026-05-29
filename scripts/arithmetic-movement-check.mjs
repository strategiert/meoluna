import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { transform } from "esbuild";

const root = process.cwd();
const modulePath = join(root, "convex", "pipeline", "engines", "arithmeticMovementSpec.ts");
const rendererPath = join(root, "convex", "pipeline", "engines", "movementSpaceRenderer.ts");

const { tryBuildArithmeticMovementSpec } = await import(pathToFileURL(modulePath).href);
const { buildMovementSpaceWorldCode } = await import(pathToFileURL(rendererPath).href);

const brief = {
  inputMode: "material",
  subject: "mathematik",
  gradeLevel: "7",
  rawTopic: "Mein Kind versteht -66 + -33 nicht.",
  extractedTasks: ["-66 + (-33)"],
  learningGoals: ["Negative Zahlen addieren"],
  likelyMisconceptions: ["Zwei Minuszeichen ergeben immer Plus"],
  focus: "understand",
  confidence: "high",
};

const spec = tryBuildArithmeticMovementSpec(brief);
const failures = [];

if (!spec) {
  failures.push("Expected deterministic arithmetic movement spec.");
} else {
  const firstRoom = spec.rooms[0];
  const firstMove = firstRoom?.moves?.[0]?.value;
  const secondMove = firstRoom?.moves?.[1]?.value;

  if (!/west/i.test(spec.world.worldName + " " + spec.world.coreMetaphor + " " + spec.world.setting)) {
    failures.push("Expected a west/east block-world metaphor for plain negative addition.");
  }
  if (firstRoom?.startPosition !== 0) {
    failures.push("Expected first room to start at 0.");
  }
  if (firstMove !== -66 || secondMove !== -33) {
    failures.push(`Expected first room moves [-66, -33], got [${firstMove}, ${secondMove}].`);
  }
  if (firstRoom?.targetPosition !== -99) {
    failures.push(`Expected first room target -99, got ${firstRoom?.targetPosition}.`);
  }

  const code = buildMovementSpaceWorldCode(spec);
  for (const needle of [
    "handleTrackClick",
    "selectedPosition",
    "commitSelectedPosition",
    "Nach Westen",
    "Aus der Bewegung wird",
  ]) {
    if (!code.includes(needle)) {
      failures.push(`Expected generated code to include direct-manipulation marker: ${needle}`);
    }
  }
  if (/onClick=\{applyMove\}/.test(code)) {
    failures.push("Generated movement room must not be a passive applyMove button flow.");
  }
  await transform(code, {
    loader: "jsx",
    jsx: "automatic",
    format: "esm",
  });
}

if (failures.length > 0) {
  console.error("Arithmetic movement check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Arithmetic movement check passed.");
