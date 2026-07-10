import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const { experienceSimilarity, countDistinctDimensions, passesOriginalityGate } = await import(
  pathToFileURL(join(ROOT, "convex", "gameStudio", "originalityGate.ts")).href
);

const failures = [];
const approx = (value, expected, tolerance = 0.001) => Math.abs(value - expected) <= tolerance;

// 1. Identische Signatur → experienceSimilarity === 1 (±0.001), Gate lehnt ab.
{
  const sig = {
    coreVerbs: ["graben", "sammeln", "bauen", "handeln", "verteidigen"],
    camera: "top-down",
    worldTopology: "open-zone",
    progressionModel: "linear-unlocks",
    controlModel: "tap-and-drag",
    failureModel: "soft-fail-retry",
    narrativeStructure: "quest-chain",
    systemicModel: "resource-economy",
  };
  const clone = JSON.parse(JSON.stringify(sig));
  const sim = experienceSimilarity(sig, clone);
  if (!approx(sim, 1)) failures.push(`Case 1: identische Signatur muss Similarity 1 ergeben, war ${sim}`);
  const gate = passesOriginalityGate(sig, [clone], { sameTopic: false });
  if (gate.passed) failures.push(`Case 1: Gate muss identische Signatur ablehnen, war passed=${gate.passed}`);
}

// 2. Komplett disjunkte Signatur → Similarity 0, Gate akzeptiert.
{
  const a = {
    coreVerbs: ["graben", "sammeln", "bauen"],
    camera: "top-down",
    worldTopology: "open-zone",
    progressionModel: "linear-unlocks",
    controlModel: "tap-and-drag",
    failureModel: "soft-fail-retry",
    narrativeStructure: "quest-chain",
    systemicModel: "resource-economy",
  };
  const b = {
    coreVerbs: ["fliegen", "schießen", "ausweichen"],
    camera: "side",
    worldTopology: "linear",
    progressionModel: "score-based",
    controlModel: "keyboard-arrows",
    failureModel: "hard-fail-restart",
    narrativeStructure: "no-narrative",
    systemicModel: null,
  };
  const sim = experienceSimilarity(a, b);
  if (!approx(sim, 0)) failures.push(`Case 2: disjunkte Signatur muss Similarity 0 ergeben, war ${sim}`);
  const gate = passesOriginalityGate(a, [b], { sameTopic: false });
  if (!gate.passed) failures.push(`Case 2: Gate muss disjunkte Signatur akzeptieren, war passed=${gate.passed}, reasons=${gate.reasons.join(" | ")}`);
}

// 3. Nur Skin-Änderung (gleiche Kategorien, 4 von 5 coreVerbs geteilt) → Similarity >= 0.72, Gate lehnt ab.
// Erwartung: 0.30*jaccard(4/6=0.667)=0.20 + 0.70(alle übrigen 7 Kategorien identisch, Summe der Gewichte
// 0.15+0.15+0.10+0.10+0.10+0.05+0.05=0.70) = 0.90
{
  const original = {
    coreVerbs: ["graben", "sammeln", "bauen", "handeln", "verteidigen"],
    camera: "top-down",
    worldTopology: "open-zone",
    progressionModel: "linear-unlocks",
    controlModel: "tap-and-drag",
    failureModel: "soft-fail-retry",
    narrativeStructure: "quest-chain",
    systemicModel: "resource-economy",
  };
  const reskin = {
    ...original,
    coreVerbs: ["graben", "sammeln", "bauen", "handeln", "tauschen"], // 4 von 5 geteilt, "verteidigen" -> "tauschen"
  };
  const sim = experienceSimilarity(reskin, original);
  if (!approx(sim, 0.90)) failures.push(`Case 3: Reskin-Similarity erwartet 0.90, war ${sim}`);
  if (sim < 0.72) failures.push(`Case 3: Reskin-Similarity muss >= 0.72 sein, war ${sim}`);
  const gate = passesOriginalityGate(reskin, [original], { sameTopic: false });
  if (gate.passed) failures.push(`Case 3: Gate muss Reskin ablehnen, war passed=${gate.passed}`);
}

// 4. sameTopic: true bei Similarity 0.65 → abgelehnt (0.60-Schwelle);
//    sameTopic: false, gleiches Paar → akzeptiert, da 4 von 7 Produktdimensionen verschieden.
{
  const existing = {
    coreVerbs: ["erkunden", "sammeln", "bauen"],
    camera: "top-down",
    worldTopology: "open-zone",
    progressionModel: "linear-unlocks",
    controlModel: "tap-and-drag",
    failureModel: "soft-fail-retry",
    narrativeStructure: "quest-chain",
    systemicModel: "resource-economy",
  };
  const candidate = {
    ...existing,
    camera: "isometric", // verschieden
    controlModel: "click-to-move", // verschieden
    failureModel: "hard-fail-restart", // verschieden
    narrativeStructure: "branching-story", // verschieden
    // coreVerbs, worldTopology, progressionModel, systemicModel bleiben identisch
  };
  const sim = experienceSimilarity(candidate, existing);
  if (!approx(sim, 0.65)) failures.push(`Case 4: Similarity erwartet 0.65, war ${sim}`);
  const dims = countDistinctDimensions(candidate, existing);
  if (dims !== 4) failures.push(`Case 4: erwartet 4 verschiedene Produktdimensionen, war ${dims}`);

  const sameTopicGate = passesOriginalityGate(candidate, [existing], { sameTopic: true });
  if (sameTopicGate.passed) failures.push(`Case 4a: sameTopic:true bei Similarity 0.65 muss ablehnen (Schwelle 0.60), war passed=${sameTopicGate.passed}`);

  const differentTopicGate = passesOriginalityGate(candidate, [existing], { sameTopic: false });
  if (!differentTopicGate.passed) {
    failures.push(`Case 4b: sameTopic:false bei Similarity 0.65 und 4 verschiedenen Dimensionen muss akzeptieren, war passed=${differentTopicGate.passed}, reasons=${differentTopicGate.reasons.join(" | ")}`);
  }
}

// 5. Slice-Modus: Vergleich der echten Slice-Signaturen, sobald sie existieren (Task 6/7).
{
  const tombPath = join(ROOT, "scripts", "game-studio", "data", "egypt-tomb.signature.json");
  const cityPath = join(ROOT, "scripts", "game-studio", "data", "egypt-city.signature.json");
  if (!existsSync(tombPath) || !existsSync(cityPath)) {
    console.log("SKIP (Slice-Signaturen fehlen noch)");
  } else {
    const { readFileSync } = await import("node:fs");
    const tomb = JSON.parse(readFileSync(tombPath, "utf8"));
    const city = JSON.parse(readFileSync(cityPath, "utf8"));
    const sim = experienceSimilarity(tomb, city);
    const dims = countDistinctDimensions(tomb, city);
    if (!(sim < 0.40)) failures.push(`Slice: Similarity zwischen egypt-tomb und egypt-city muss < 0.40 sein, war ${sim}`);
    if (!(dims >= 4)) failures.push(`Slice: mind. 4 von 7 Produktdimensionen müssen verschieden sein, waren ${dims}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OK");
