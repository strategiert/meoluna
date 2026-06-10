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
  const mainRoom = spec.rooms.find((room) => room.roomId === "westweg");
  const mainRound = mainRoom?.rounds?.[0];
  const firstMove = mainRound?.moves?.[0]?.value;
  const secondMove = mainRound?.moves?.[1]?.value;

  if (!/west/i.test(spec.world.worldName + " " + spec.world.coreMetaphor + " " + spec.world.setting)) {
    failures.push("Expected a west/east block-world metaphor for plain negative addition.");
  }
  if (mainRound?.startPosition !== 0) {
    failures.push("Expected main round to start at 0.");
  }
  if (firstMove !== -66 || secondMove !== -33) {
    failures.push(`Expected main round moves [-66, -33], got [${firstMove}, ${secondMove}].`);
  }
  if (mainRound?.targetPosition !== -99) {
    failures.push(`Expected main round target -99, got ${mainRound?.targetPosition}.`);
  }

  // Session-Format v2: genug Aufgaben für 10-15 Minuten
  const totalRounds = spec.rooms.reduce((sum, room) => sum + (room.rounds?.length ?? 0), 0);
  if (spec.rooms.length < 4) {
    failures.push(`Expected at least 4 rooms for a full session, got ${spec.rooms.length}.`);
  }
  if (totalRounds < 8) {
    failures.push(`Expected at least 8 total rounds for a full session, got ${totalRounds}.`);
  }
  if (!spec.rooms.some((room) => room.interaction === "step-sequencer")) {
    failures.push("Expected at least one step-sequencer room for mechanic variety.");
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
