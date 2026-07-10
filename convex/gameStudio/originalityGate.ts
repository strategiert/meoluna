import type { ExperienceSignature } from "./types";

function normalizeSet(values: string[]): Set<string> {
  return new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean));
}

export function jaccard(a: string[], b: string[]): number {
  const sa = normalizeSet(a), sb = normalizeSet(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for (const v of sa) if (sb.has(v)) inter += 1;
  return inter / (sa.size + sb.size - inter);
}

const eq = (x: string | null | undefined, y: string | null | undefined) =>
  (x ?? "none").trim().toLowerCase() === (y ?? "none").trim().toLowerCase() ? 1 : 0;

// Gewichtung aus Spec 4.3
export function experienceSimilarity(a: ExperienceSignature, b: ExperienceSignature): number {
  return (
    0.30 * jaccard(a.coreVerbs, b.coreVerbs) +
    0.15 * eq(a.worldTopology, b.worldTopology) +
    0.15 * eq(a.progressionModel, b.progressionModel) +
    0.10 * eq(a.camera, b.camera) +
    0.10 * eq(a.controlModel, b.controlModel) +
    0.10 * eq(a.failureModel, b.failureModel) +
    0.05 * eq(a.narrativeStructure, b.narrativeStructure) +
    0.05 * eq(a.systemicModel, b.systemicModel)
  );
}

// Die 7 Produktdimensionen aus Spec 2.2
export function countDistinctDimensions(a: ExperienceSignature, b: ExperienceSignature): number {
  let distinct = 0;
  if (jaccard(a.coreVerbs, b.coreVerbs) < 0.5) distinct += 1;
  if (!eq(a.camera, b.camera)) distinct += 1;
  if (!eq(a.worldTopology, b.worldTopology)) distinct += 1;
  if (!eq(a.progressionModel, b.progressionModel)) distinct += 1;
  if (!eq(a.controlModel, b.controlModel)) distinct += 1;
  if (!eq(a.failureModel, b.failureModel)) distinct += 1;
  if (!eq(a.narrativeStructure, b.narrativeStructure)) distinct += 1;
  return distinct;
}

export function passesOriginalityGate(
  candidate: ExperienceSignature,
  existing: ExperienceSignature[],
  opts: { sameTopic: boolean },
): { passed: boolean; nearestSimilarity: number; reasons: string[] } {
  const threshold = opts.sameTopic ? 0.60 : 0.72;
  let nearest = 0;
  const reasons: string[] = [];
  for (const sig of existing) {
    const sim = experienceSimilarity(candidate, sig);
    if (sim > nearest) nearest = sim;
    if (sim >= threshold) reasons.push(`Ähnlichkeit ${sim.toFixed(2)} >= ${threshold}`);
    if (countDistinctDimensions(candidate, sig) < 4) reasons.push("Weniger als 4 von 7 Produktdimensionen verschieden");
  }
  return { passed: reasons.length === 0, nearestSimilarity: nearest, reasons };
}
