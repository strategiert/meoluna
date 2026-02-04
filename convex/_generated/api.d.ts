/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

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
import type * as progress from "../progress.js";
import type * as seed from "../seed.js";
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
  progress: typeof progress;
  seed: typeof seed;
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
