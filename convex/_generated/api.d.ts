/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as analytics_eventTracking from "../analytics/eventTracking.js";
import type * as analytics_identityResolution from "../analytics/identityResolution.js";
import type * as analytics_serverSideCollector from "../analytics/serverSideCollector.js";
import type * as blog from "../blog.js";
import type * as classrooms from "../classrooms.js";
import type * as curriculum from "../curriculum.js";
import type * as documents from "../documents.js";
import type * as generate from "../generate.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as pipeline_engines_arithmeticMovementSpec from "../pipeline/engines/arithmeticMovementSpec.js";
import type * as pipeline_engines_buildingConstructRenderer from "../pipeline/engines/buildingConstructRenderer.js";
import type * as pipeline_engines_buildingConstructTypes from "../pipeline/engines/buildingConstructTypes.js";
import type * as pipeline_engines_buildingConstructValidator from "../pipeline/engines/buildingConstructValidator.js";
import type * as pipeline_engines_buildingTopicRouter from "../pipeline/engines/buildingTopicRouter.js";
import type * as pipeline_engines_chartRenderer from "../pipeline/engines/chartRenderer.js";
import type * as pipeline_engines_chartTopicRouter from "../pipeline/engines/chartTopicRouter.js";
import type * as pipeline_engines_chartTypes from "../pipeline/engines/chartTypes.js";
import type * as pipeline_engines_chartValidator from "../pipeline/engines/chartValidator.js";
import type * as pipeline_engines_clockRenderer from "../pipeline/engines/clockRenderer.js";
import type * as pipeline_engines_clockTopicRouter from "../pipeline/engines/clockTopicRouter.js";
import type * as pipeline_engines_clockTypes from "../pipeline/engines/clockTypes.js";
import type * as pipeline_engines_clockValidator from "../pipeline/engines/clockValidator.js";
import type * as pipeline_engines_countingRenderer from "../pipeline/engines/countingRenderer.js";
import type * as pipeline_engines_countingTopicRouter from "../pipeline/engines/countingTopicRouter.js";
import type * as pipeline_engines_countingTypes from "../pipeline/engines/countingTypes.js";
import type * as pipeline_engines_countingValidator from "../pipeline/engines/countingValidator.js";
import type * as pipeline_engines_detectiveEvidenceRenderer from "../pipeline/engines/detectiveEvidenceRenderer.js";
import type * as pipeline_engines_detectiveEvidenceTypes from "../pipeline/engines/detectiveEvidenceTypes.js";
import type * as pipeline_engines_detectiveEvidenceValidator from "../pipeline/engines/detectiveEvidenceValidator.js";
import type * as pipeline_engines_detectiveTopicRouter from "../pipeline/engines/detectiveTopicRouter.js";
import type * as pipeline_engines_diagramRenderer from "../pipeline/engines/diagramRenderer.js";
import type * as pipeline_engines_diagramTopicRouter from "../pipeline/engines/diagramTopicRouter.js";
import type * as pipeline_engines_diagramTypes from "../pipeline/engines/diagramTypes.js";
import type * as pipeline_engines_diagramValidator from "../pipeline/engines/diagramValidator.js";
import type * as pipeline_engines_engineRegistry from "../pipeline/engines/engineRegistry.js";
import type * as pipeline_engines_focusedArithmeticMiniApp from "../pipeline/engines/focusedArithmeticMiniApp.js";
import type * as pipeline_engines_focusedInterventionGate from "../pipeline/engines/focusedInterventionGate.js";
import type * as pipeline_engines_focusedInterventionRouter from "../pipeline/engines/focusedInterventionRouter.js";
import type * as pipeline_engines_mapRenderer from "../pipeline/engines/mapRenderer.js";
import type * as pipeline_engines_mapTopicRouter from "../pipeline/engines/mapTopicRouter.js";
import type * as pipeline_engines_mapTypes from "../pipeline/engines/mapTypes.js";
import type * as pipeline_engines_mapValidator from "../pipeline/engines/mapValidator.js";
import type * as pipeline_engines_mixingBalanceRenderer from "../pipeline/engines/mixingBalanceRenderer.js";
import type * as pipeline_engines_mixingBalanceTypes from "../pipeline/engines/mixingBalanceTypes.js";
import type * as pipeline_engines_mixingBalanceValidator from "../pipeline/engines/mixingBalanceValidator.js";
import type * as pipeline_engines_mixingTopicRouter from "../pipeline/engines/mixingTopicRouter.js";
import type * as pipeline_engines_moneyRenderer from "../pipeline/engines/moneyRenderer.js";
import type * as pipeline_engines_moneyTopicRouter from "../pipeline/engines/moneyTopicRouter.js";
import type * as pipeline_engines_moneyTypes from "../pipeline/engines/moneyTypes.js";
import type * as pipeline_engines_moneyValidator from "../pipeline/engines/moneyValidator.js";
import type * as pipeline_engines_movementSpaceRenderer from "../pipeline/engines/movementSpaceRenderer.js";
import type * as pipeline_engines_movementSpaceTypes from "../pipeline/engines/movementSpaceTypes.js";
import type * as pipeline_engines_movementSpaceValidator from "../pipeline/engines/movementSpaceValidator.js";
import type * as pipeline_engines_movementTopicRouter from "../pipeline/engines/movementTopicRouter.js";
import type * as pipeline_engines_patternRenderer from "../pipeline/engines/patternRenderer.js";
import type * as pipeline_engines_patternTopicRouter from "../pipeline/engines/patternTopicRouter.js";
import type * as pipeline_engines_patternTypes from "../pipeline/engines/patternTypes.js";
import type * as pipeline_engines_patternValidator from "../pipeline/engines/patternValidator.js";
import type * as pipeline_engines_sortMatchRenderer from "../pipeline/engines/sortMatchRenderer.js";
import type * as pipeline_engines_sortMatchTypes from "../pipeline/engines/sortMatchTypes.js";
import type * as pipeline_engines_sortMatchValidator from "../pipeline/engines/sortMatchValidator.js";
import type * as pipeline_engines_sortTopicRouter from "../pipeline/engines/sortTopicRouter.js";
import type * as pipeline_engines_timeSequenceRenderer from "../pipeline/engines/timeSequenceRenderer.js";
import type * as pipeline_engines_timeSequenceTypes from "../pipeline/engines/timeSequenceTypes.js";
import type * as pipeline_engines_timeSequenceValidator from "../pipeline/engines/timeSequenceValidator.js";
import type * as pipeline_engines_timeTopicRouter from "../pipeline/engines/timeTopicRouter.js";
import type * as pipeline_engines_wordBuilderRenderer from "../pipeline/engines/wordBuilderRenderer.js";
import type * as pipeline_engines_wordBuilderTypes from "../pipeline/engines/wordBuilderTypes.js";
import type * as pipeline_engines_wordBuilderValidator from "../pipeline/engines/wordBuilderValidator.js";
import type * as pipeline_engines_wordTopicRouter from "../pipeline/engines/wordTopicRouter.js";
import type * as pipeline_orchestrator from "../pipeline/orchestrator.js";
import type * as pipeline_prompts_autoFix from "../pipeline/prompts/autoFix.js";
import type * as pipeline_prompts_buildingConstruct from "../pipeline/prompts/buildingConstruct.js";
import type * as pipeline_prompts_chart from "../pipeline/prompts/chart.js";
import type * as pipeline_prompts_clock from "../pipeline/prompts/clock.js";
import type * as pipeline_prompts_counting from "../pipeline/prompts/counting.js";
import type * as pipeline_prompts_detectiveEvidence from "../pipeline/prompts/detectiveEvidence.js";
import type * as pipeline_prompts_diagram from "../pipeline/prompts/diagram.js";
import type * as pipeline_prompts_focusedIntervention from "../pipeline/prompts/focusedIntervention.js";
import type * as pipeline_prompts_learningDiagnosis from "../pipeline/prompts/learningDiagnosis.js";
import type * as pipeline_prompts_map from "../pipeline/prompts/map.js";
import type * as pipeline_prompts_mixingBalance from "../pipeline/prompts/mixingBalance.js";
import type * as pipeline_prompts_money from "../pipeline/prompts/money.js";
import type * as pipeline_prompts_movementSpace from "../pipeline/prompts/movementSpace.js";
import type * as pipeline_prompts_pattern from "../pipeline/prompts/pattern.js";
import type * as pipeline_prompts_sortMatch from "../pipeline/prompts/sortMatch.js";
import type * as pipeline_prompts_timeSequence from "../pipeline/prompts/timeSequence.js";
import type * as pipeline_prompts_wordBuilder from "../pipeline/prompts/wordBuilder.js";
import type * as pipeline_skeleton_worldSkeleton from "../pipeline/skeleton/worldSkeleton.js";
import type * as pipeline_status from "../pipeline/status.js";
import type * as pipeline_steps_buildingConstructGenerator from "../pipeline/steps/buildingConstructGenerator.js";
import type * as pipeline_steps_chartGenerator from "../pipeline/steps/chartGenerator.js";
import type * as pipeline_steps_clockGenerator from "../pipeline/steps/clockGenerator.js";
import type * as pipeline_steps_countingGenerator from "../pipeline/steps/countingGenerator.js";
import type * as pipeline_steps_detectiveEvidenceGenerator from "../pipeline/steps/detectiveEvidenceGenerator.js";
import type * as pipeline_steps_diagramGenerator from "../pipeline/steps/diagramGenerator.js";
import type * as pipeline_steps_focusedInterventionGenerator from "../pipeline/steps/focusedInterventionGenerator.js";
import type * as pipeline_steps_gameplayRouter from "../pipeline/steps/gameplayRouter.js";
import type * as pipeline_steps_learningDiagnosis from "../pipeline/steps/learningDiagnosis.js";
import type * as pipeline_steps_mapGenerator from "../pipeline/steps/mapGenerator.js";
import type * as pipeline_steps_mixingBalanceGenerator from "../pipeline/steps/mixingBalanceGenerator.js";
import type * as pipeline_steps_moneyGenerator from "../pipeline/steps/moneyGenerator.js";
import type * as pipeline_steps_movementSpaceGenerator from "../pipeline/steps/movementSpaceGenerator.js";
import type * as pipeline_steps_patternGenerator from "../pipeline/steps/patternGenerator.js";
import type * as pipeline_steps_sortMatchGenerator from "../pipeline/steps/sortMatchGenerator.js";
import type * as pipeline_steps_structuralGate from "../pipeline/steps/structuralGate.js";
import type * as pipeline_steps_timeSequenceGenerator from "../pipeline/steps/timeSequenceGenerator.js";
import type * as pipeline_steps_validator from "../pipeline/steps/validator.js";
import type * as pipeline_steps_wordBuilderGenerator from "../pipeline/steps/wordBuilderGenerator.js";
import type * as pipeline_types from "../pipeline/types.js";
import type * as pipeline_utils_anthropicClient from "../pipeline/utils/anthropicClient.js";
import type * as pipeline_utils_falClient from "../pipeline/utils/falClient.js";
import type * as pipeline_utils_specGenerator from "../pipeline/utils/specGenerator.js";
import type * as pipeline_utils_validation from "../pipeline/utils/validation.js";
import type * as progress from "../progress.js";
import type * as push from "../push.js";
import type * as pushDb from "../pushDb.js";
import type * as siteStudio from "../siteStudio.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";
import type * as worldConfig from "../worldConfig.js";
import type * as worlds from "../worlds.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  "analytics/eventTracking": typeof analytics_eventTracking;
  "analytics/identityResolution": typeof analytics_identityResolution;
  "analytics/serverSideCollector": typeof analytics_serverSideCollector;
  blog: typeof blog;
  classrooms: typeof classrooms;
  curriculum: typeof curriculum;
  documents: typeof documents;
  generate: typeof generate;
  http: typeof http;
  messages: typeof messages;
  "pipeline/engines/arithmeticMovementSpec": typeof pipeline_engines_arithmeticMovementSpec;
  "pipeline/engines/buildingConstructRenderer": typeof pipeline_engines_buildingConstructRenderer;
  "pipeline/engines/buildingConstructTypes": typeof pipeline_engines_buildingConstructTypes;
  "pipeline/engines/buildingConstructValidator": typeof pipeline_engines_buildingConstructValidator;
  "pipeline/engines/buildingTopicRouter": typeof pipeline_engines_buildingTopicRouter;
  "pipeline/engines/chartRenderer": typeof pipeline_engines_chartRenderer;
  "pipeline/engines/chartTopicRouter": typeof pipeline_engines_chartTopicRouter;
  "pipeline/engines/chartTypes": typeof pipeline_engines_chartTypes;
  "pipeline/engines/chartValidator": typeof pipeline_engines_chartValidator;
  "pipeline/engines/clockRenderer": typeof pipeline_engines_clockRenderer;
  "pipeline/engines/clockTopicRouter": typeof pipeline_engines_clockTopicRouter;
  "pipeline/engines/clockTypes": typeof pipeline_engines_clockTypes;
  "pipeline/engines/clockValidator": typeof pipeline_engines_clockValidator;
  "pipeline/engines/countingRenderer": typeof pipeline_engines_countingRenderer;
  "pipeline/engines/countingTopicRouter": typeof pipeline_engines_countingTopicRouter;
  "pipeline/engines/countingTypes": typeof pipeline_engines_countingTypes;
  "pipeline/engines/countingValidator": typeof pipeline_engines_countingValidator;
  "pipeline/engines/detectiveEvidenceRenderer": typeof pipeline_engines_detectiveEvidenceRenderer;
  "pipeline/engines/detectiveEvidenceTypes": typeof pipeline_engines_detectiveEvidenceTypes;
  "pipeline/engines/detectiveEvidenceValidator": typeof pipeline_engines_detectiveEvidenceValidator;
  "pipeline/engines/detectiveTopicRouter": typeof pipeline_engines_detectiveTopicRouter;
  "pipeline/engines/diagramRenderer": typeof pipeline_engines_diagramRenderer;
  "pipeline/engines/diagramTopicRouter": typeof pipeline_engines_diagramTopicRouter;
  "pipeline/engines/diagramTypes": typeof pipeline_engines_diagramTypes;
  "pipeline/engines/diagramValidator": typeof pipeline_engines_diagramValidator;
  "pipeline/engines/engineRegistry": typeof pipeline_engines_engineRegistry;
  "pipeline/engines/focusedArithmeticMiniApp": typeof pipeline_engines_focusedArithmeticMiniApp;
  "pipeline/engines/focusedInterventionGate": typeof pipeline_engines_focusedInterventionGate;
  "pipeline/engines/focusedInterventionRouter": typeof pipeline_engines_focusedInterventionRouter;
  "pipeline/engines/mapRenderer": typeof pipeline_engines_mapRenderer;
  "pipeline/engines/mapTopicRouter": typeof pipeline_engines_mapTopicRouter;
  "pipeline/engines/mapTypes": typeof pipeline_engines_mapTypes;
  "pipeline/engines/mapValidator": typeof pipeline_engines_mapValidator;
  "pipeline/engines/mixingBalanceRenderer": typeof pipeline_engines_mixingBalanceRenderer;
  "pipeline/engines/mixingBalanceTypes": typeof pipeline_engines_mixingBalanceTypes;
  "pipeline/engines/mixingBalanceValidator": typeof pipeline_engines_mixingBalanceValidator;
  "pipeline/engines/mixingTopicRouter": typeof pipeline_engines_mixingTopicRouter;
  "pipeline/engines/moneyRenderer": typeof pipeline_engines_moneyRenderer;
  "pipeline/engines/moneyTopicRouter": typeof pipeline_engines_moneyTopicRouter;
  "pipeline/engines/moneyTypes": typeof pipeline_engines_moneyTypes;
  "pipeline/engines/moneyValidator": typeof pipeline_engines_moneyValidator;
  "pipeline/engines/movementSpaceRenderer": typeof pipeline_engines_movementSpaceRenderer;
  "pipeline/engines/movementSpaceTypes": typeof pipeline_engines_movementSpaceTypes;
  "pipeline/engines/movementSpaceValidator": typeof pipeline_engines_movementSpaceValidator;
  "pipeline/engines/movementTopicRouter": typeof pipeline_engines_movementTopicRouter;
  "pipeline/engines/patternRenderer": typeof pipeline_engines_patternRenderer;
  "pipeline/engines/patternTopicRouter": typeof pipeline_engines_patternTopicRouter;
  "pipeline/engines/patternTypes": typeof pipeline_engines_patternTypes;
  "pipeline/engines/patternValidator": typeof pipeline_engines_patternValidator;
  "pipeline/engines/sortMatchRenderer": typeof pipeline_engines_sortMatchRenderer;
  "pipeline/engines/sortMatchTypes": typeof pipeline_engines_sortMatchTypes;
  "pipeline/engines/sortMatchValidator": typeof pipeline_engines_sortMatchValidator;
  "pipeline/engines/sortTopicRouter": typeof pipeline_engines_sortTopicRouter;
  "pipeline/engines/timeSequenceRenderer": typeof pipeline_engines_timeSequenceRenderer;
  "pipeline/engines/timeSequenceTypes": typeof pipeline_engines_timeSequenceTypes;
  "pipeline/engines/timeSequenceValidator": typeof pipeline_engines_timeSequenceValidator;
  "pipeline/engines/timeTopicRouter": typeof pipeline_engines_timeTopicRouter;
  "pipeline/engines/wordBuilderRenderer": typeof pipeline_engines_wordBuilderRenderer;
  "pipeline/engines/wordBuilderTypes": typeof pipeline_engines_wordBuilderTypes;
  "pipeline/engines/wordBuilderValidator": typeof pipeline_engines_wordBuilderValidator;
  "pipeline/engines/wordTopicRouter": typeof pipeline_engines_wordTopicRouter;
  "pipeline/orchestrator": typeof pipeline_orchestrator;
  "pipeline/prompts/autoFix": typeof pipeline_prompts_autoFix;
  "pipeline/prompts/buildingConstruct": typeof pipeline_prompts_buildingConstruct;
  "pipeline/prompts/chart": typeof pipeline_prompts_chart;
  "pipeline/prompts/clock": typeof pipeline_prompts_clock;
  "pipeline/prompts/counting": typeof pipeline_prompts_counting;
  "pipeline/prompts/detectiveEvidence": typeof pipeline_prompts_detectiveEvidence;
  "pipeline/prompts/diagram": typeof pipeline_prompts_diagram;
  "pipeline/prompts/focusedIntervention": typeof pipeline_prompts_focusedIntervention;
  "pipeline/prompts/learningDiagnosis": typeof pipeline_prompts_learningDiagnosis;
  "pipeline/prompts/map": typeof pipeline_prompts_map;
  "pipeline/prompts/mixingBalance": typeof pipeline_prompts_mixingBalance;
  "pipeline/prompts/money": typeof pipeline_prompts_money;
  "pipeline/prompts/movementSpace": typeof pipeline_prompts_movementSpace;
  "pipeline/prompts/pattern": typeof pipeline_prompts_pattern;
  "pipeline/prompts/sortMatch": typeof pipeline_prompts_sortMatch;
  "pipeline/prompts/timeSequence": typeof pipeline_prompts_timeSequence;
  "pipeline/prompts/wordBuilder": typeof pipeline_prompts_wordBuilder;
  "pipeline/skeleton/worldSkeleton": typeof pipeline_skeleton_worldSkeleton;
  "pipeline/status": typeof pipeline_status;
  "pipeline/steps/buildingConstructGenerator": typeof pipeline_steps_buildingConstructGenerator;
  "pipeline/steps/chartGenerator": typeof pipeline_steps_chartGenerator;
  "pipeline/steps/clockGenerator": typeof pipeline_steps_clockGenerator;
  "pipeline/steps/countingGenerator": typeof pipeline_steps_countingGenerator;
  "pipeline/steps/detectiveEvidenceGenerator": typeof pipeline_steps_detectiveEvidenceGenerator;
  "pipeline/steps/diagramGenerator": typeof pipeline_steps_diagramGenerator;
  "pipeline/steps/focusedInterventionGenerator": typeof pipeline_steps_focusedInterventionGenerator;
  "pipeline/steps/gameplayRouter": typeof pipeline_steps_gameplayRouter;
  "pipeline/steps/learningDiagnosis": typeof pipeline_steps_learningDiagnosis;
  "pipeline/steps/mapGenerator": typeof pipeline_steps_mapGenerator;
  "pipeline/steps/mixingBalanceGenerator": typeof pipeline_steps_mixingBalanceGenerator;
  "pipeline/steps/moneyGenerator": typeof pipeline_steps_moneyGenerator;
  "pipeline/steps/movementSpaceGenerator": typeof pipeline_steps_movementSpaceGenerator;
  "pipeline/steps/patternGenerator": typeof pipeline_steps_patternGenerator;
  "pipeline/steps/sortMatchGenerator": typeof pipeline_steps_sortMatchGenerator;
  "pipeline/steps/structuralGate": typeof pipeline_steps_structuralGate;
  "pipeline/steps/timeSequenceGenerator": typeof pipeline_steps_timeSequenceGenerator;
  "pipeline/steps/validator": typeof pipeline_steps_validator;
  "pipeline/steps/wordBuilderGenerator": typeof pipeline_steps_wordBuilderGenerator;
  "pipeline/types": typeof pipeline_types;
  "pipeline/utils/anthropicClient": typeof pipeline_utils_anthropicClient;
  "pipeline/utils/falClient": typeof pipeline_utils_falClient;
  "pipeline/utils/specGenerator": typeof pipeline_utils_specGenerator;
  "pipeline/utils/validation": typeof pipeline_utils_validation;
  progress: typeof progress;
  push: typeof push;
  pushDb: typeof pushDb;
  siteStudio: typeof siteStudio;
  storage: typeof storage;
  users: typeof users;
  worldConfig: typeof worldConfig;
  worlds: typeof worlds;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
