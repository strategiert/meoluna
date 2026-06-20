import { generateValidatedSpec } from "../utils/specGenerator";
import { MONEY_SYSTEM_PROMPT } from "../prompts/money";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { MoneyEngineSpec } from "../engines/moneyTypes";
import { validateMoneyEngineSpec } from "../engines/moneyValidator";
import { buildMoneyWorldCode } from "../engines/moneyRenderer";

export async function runMoneyGenerator(input: {
  brief: LearningBrief;
}): Promise<{
  spec: MoneyEngineSpec;
  code: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { spec, inputTokens, outputTokens } = await generateValidatedSpec<MoneyEngineSpec>({
    model: "claude-sonnet-4-6",
    escalateModel: "claude-opus-4-6",
    systemPrompt: MONEY_SYSTEM_PROMPT,
    brief: input.brief,
    maxTokens: 12000,
    temperature: 0.4,
    validate: validateMoneyEngineSpec,
    label: "money",
    maxAttempts: 2,
  });

  return { spec, code: buildMoneyWorldCode(spec), inputTokens, outputTokens };
}
