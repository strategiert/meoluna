import type { LearningBrief } from "./movementSpaceTypes";
import { isLikelyMovementTopic } from "./movementTopicRouter";
import { isLikelyMixingTopic } from "./mixingTopicRouter";
import { isLikelyBuildingTopic } from "./buildingTopicRouter";
import { isLikelyTimeTopic } from "./timeTopicRouter";
import { isLikelyDetectiveTopic } from "./detectiveTopicRouter";
import { isLikelySortTopic } from "./sortTopicRouter";
import { isLikelyWordTopic } from "./wordTopicRouter";
import { isLikelyCountingTopic } from "./countingTopicRouter";
import { runMovementSpaceGenerator } from "../steps/movementSpaceGenerator";
import { runCountingGenerator } from "../steps/countingGenerator";
import { runMixingBalanceGenerator } from "../steps/mixingBalanceGenerator";
import { runBuildingConstructGenerator } from "../steps/buildingConstructGenerator";
import { runTimeSequenceGenerator } from "../steps/timeSequenceGenerator";
import { runDetectiveEvidenceGenerator } from "../steps/detectiveEvidenceGenerator";
import { runSortMatchGenerator } from "../steps/sortMatchGenerator";
import { runWordBuilderGenerator } from "../steps/wordBuilderGenerator";

export type EngineName =
  | "movement-space"
  | "mixing-balance"
  | "building-construct"
  | "time-sequence"
  | "detective-evidence"
  | "sort-match"
  | "word-builder"
  | "counting";

export const ENGINE_NAMES: EngineName[] = [
  "movement-space",
  "mixing-balance",
  "building-construct",
  "time-sequence",
  "detective-evidence",
  "sort-match",
  "word-builder",
  "counting",
];

type RouterInput = {
  prompt: string;
  pdfText?: string;
  imageDescription?: string;
  subject?: string;
};

// Schneller, kostenloser Pfad: Keyword-Router in Prioritätsreihenfolge.
// Liefert null, wenn kein Keyword greift — dann entscheidet der LLM-Gameplay-Router.
export function pickEngineByKeywords(input: RouterInput): EngineName | null {
  if (isLikelyCountingTopic(input)) return "counting";
  if (isLikelyMovementTopic(input)) return "movement-space";
  if (isLikelyMixingTopic(input)) return "mixing-balance";
  if (isLikelyBuildingTopic(input)) return "building-construct";
  if (isLikelyTimeTopic(input)) return "time-sequence";
  if (isLikelyDetectiveTopic(input)) return "detective-evidence";
  if (isLikelyWordTopic(input)) return "word-builder";
  if (isLikelySortTopic(input)) return "sort-match";
  return null;
}

export type EngineGenerationResult = {
  worldName: string;
  code: string;
  inputTokens: number;
  outputTokens: number;
};

export const ENGINE_GENERATORS: Record<
  EngineName,
  (input: { brief: LearningBrief }) => Promise<EngineGenerationResult>
> = {
  "movement-space": async (input) => {
    const result = await runMovementSpaceGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
  "mixing-balance": async (input) => {
    const result = await runMixingBalanceGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
  "building-construct": async (input) => {
    const result = await runBuildingConstructGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
  "time-sequence": async (input) => {
    const result = await runTimeSequenceGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
  "detective-evidence": async (input) => {
    const result = await runDetectiveEvidenceGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
  "sort-match": async (input) => {
    const result = await runSortMatchGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
  "word-builder": async (input) => {
    const result = await runWordBuilderGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
  "counting": async (input) => {
    const result = await runCountingGenerator(input);
    return { worldName: result.spec.world.worldName, code: result.code, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  },
};
