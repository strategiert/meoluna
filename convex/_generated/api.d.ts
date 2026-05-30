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
import type * as pipeline_engines_focusedArithmeticMiniApp from "../pipeline/engines/focusedArithmeticMiniApp.js";
import type * as pipeline_engines_focusedInterventionGate from "../pipeline/engines/focusedInterventionGate.js";
import type * as pipeline_engines_focusedInterventionRouter from "../pipeline/engines/focusedInterventionRouter.js";
import type * as pipeline_engines_movementSpaceRenderer from "../pipeline/engines/movementSpaceRenderer.js";
import type * as pipeline_engines_movementSpaceTypes from "../pipeline/engines/movementSpaceTypes.js";
import type * as pipeline_engines_movementSpaceValidator from "../pipeline/engines/movementSpaceValidator.js";
import type * as pipeline_engines_movementTopicRouter from "../pipeline/engines/movementTopicRouter.js";
import type * as pipeline_orchestrator from "../pipeline/orchestrator.js";
import type * as pipeline_prompts_assetPlanner from "../pipeline/prompts/assetPlanner.js";
import type * as pipeline_prompts_autoFix from "../pipeline/prompts/autoFix.js";
import type * as pipeline_prompts_codeGenerator from "../pipeline/prompts/codeGenerator.js";
import type * as pipeline_prompts_contentArchitect from "../pipeline/prompts/contentArchitect.js";
import type * as pipeline_prompts_creativeDirector from "../pipeline/prompts/creativeDirector.js";
import type * as pipeline_prompts_focusedIntervention from "../pipeline/prompts/focusedIntervention.js";
import type * as pipeline_prompts_gameDesigner from "../pipeline/prompts/gameDesigner.js";
import type * as pipeline_prompts_interpreter from "../pipeline/prompts/interpreter.js";
import type * as pipeline_prompts_learningDiagnosis from "../pipeline/prompts/learningDiagnosis.js";
import type * as pipeline_prompts_movementSpace from "../pipeline/prompts/movementSpace.js";
import type * as pipeline_prompts_qualityGate from "../pipeline/prompts/qualityGate.js";
import type * as pipeline_skeleton_worldSkeleton from "../pipeline/skeleton/worldSkeleton.js";
import type * as pipeline_status from "../pipeline/status.js";
import type * as pipeline_steps_assetGenerator from "../pipeline/steps/assetGenerator.js";
import type * as pipeline_steps_assetPlanner from "../pipeline/steps/assetPlanner.js";
import type * as pipeline_steps_codeGenerator from "../pipeline/steps/codeGenerator.js";
import type * as pipeline_steps_contentArchitect from "../pipeline/steps/contentArchitect.js";
import type * as pipeline_steps_creativeDirector from "../pipeline/steps/creativeDirector.js";
import type * as pipeline_steps_focusedInterventionGenerator from "../pipeline/steps/focusedInterventionGenerator.js";
import type * as pipeline_steps_gameDesigner from "../pipeline/steps/gameDesigner.js";
import type * as pipeline_steps_interpreter from "../pipeline/steps/interpreter.js";
import type * as pipeline_steps_learningDiagnosis from "../pipeline/steps/learningDiagnosis.js";
import type * as pipeline_steps_movementSpaceGenerator from "../pipeline/steps/movementSpaceGenerator.js";
import type * as pipeline_steps_qualityGate from "../pipeline/steps/qualityGate.js";
import type * as pipeline_steps_structuralGate from "../pipeline/steps/structuralGate.js";
import type * as pipeline_steps_validator from "../pipeline/steps/validator.js";
import type * as pipeline_types from "../pipeline/types.js";
import type * as pipeline_utils_anthropicClient from "../pipeline/utils/anthropicClient.js";
import type * as pipeline_utils_falClient from "../pipeline/utils/falClient.js";
import type * as pipeline_utils_validation from "../pipeline/utils/validation.js";
import type * as progress from "../progress.js";
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
  "pipeline/engines/focusedArithmeticMiniApp": typeof pipeline_engines_focusedArithmeticMiniApp;
  "pipeline/engines/focusedInterventionGate": typeof pipeline_engines_focusedInterventionGate;
  "pipeline/engines/focusedInterventionRouter": typeof pipeline_engines_focusedInterventionRouter;
  "pipeline/engines/movementSpaceRenderer": typeof pipeline_engines_movementSpaceRenderer;
  "pipeline/engines/movementSpaceTypes": typeof pipeline_engines_movementSpaceTypes;
  "pipeline/engines/movementSpaceValidator": typeof pipeline_engines_movementSpaceValidator;
  "pipeline/engines/movementTopicRouter": typeof pipeline_engines_movementTopicRouter;
  "pipeline/orchestrator": typeof pipeline_orchestrator;
  "pipeline/prompts/assetPlanner": typeof pipeline_prompts_assetPlanner;
  "pipeline/prompts/autoFix": typeof pipeline_prompts_autoFix;
  "pipeline/prompts/codeGenerator": typeof pipeline_prompts_codeGenerator;
  "pipeline/prompts/contentArchitect": typeof pipeline_prompts_contentArchitect;
  "pipeline/prompts/creativeDirector": typeof pipeline_prompts_creativeDirector;
  "pipeline/prompts/focusedIntervention": typeof pipeline_prompts_focusedIntervention;
  "pipeline/prompts/gameDesigner": typeof pipeline_prompts_gameDesigner;
  "pipeline/prompts/interpreter": typeof pipeline_prompts_interpreter;
  "pipeline/prompts/learningDiagnosis": typeof pipeline_prompts_learningDiagnosis;
  "pipeline/prompts/movementSpace": typeof pipeline_prompts_movementSpace;
  "pipeline/prompts/qualityGate": typeof pipeline_prompts_qualityGate;
  "pipeline/skeleton/worldSkeleton": typeof pipeline_skeleton_worldSkeleton;
  "pipeline/status": typeof pipeline_status;
  "pipeline/steps/assetGenerator": typeof pipeline_steps_assetGenerator;
  "pipeline/steps/assetPlanner": typeof pipeline_steps_assetPlanner;
  "pipeline/steps/codeGenerator": typeof pipeline_steps_codeGenerator;
  "pipeline/steps/contentArchitect": typeof pipeline_steps_contentArchitect;
  "pipeline/steps/creativeDirector": typeof pipeline_steps_creativeDirector;
  "pipeline/steps/focusedInterventionGenerator": typeof pipeline_steps_focusedInterventionGenerator;
  "pipeline/steps/gameDesigner": typeof pipeline_steps_gameDesigner;
  "pipeline/steps/interpreter": typeof pipeline_steps_interpreter;
  "pipeline/steps/learningDiagnosis": typeof pipeline_steps_learningDiagnosis;
  "pipeline/steps/movementSpaceGenerator": typeof pipeline_steps_movementSpaceGenerator;
  "pipeline/steps/qualityGate": typeof pipeline_steps_qualityGate;
  "pipeline/steps/structuralGate": typeof pipeline_steps_structuralGate;
  "pipeline/steps/validator": typeof pipeline_steps_validator;
  "pipeline/types": typeof pipeline_types;
  "pipeline/utils/anthropicClient": typeof pipeline_utils_anthropicClient;
  "pipeline/utils/falClient": typeof pipeline_utils_falClient;
  "pipeline/utils/validation": typeof pipeline_utils_validation;
  progress: typeof progress;
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
