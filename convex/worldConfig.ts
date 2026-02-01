import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// WORLD CONFIG - XP-Konvertierung und Punktesystem pro Welt
// ============================================================================

// Default-Werte für verschiedene Welt-Typen
export const DEFAULT_CONVERSION_RATE = 1.0;
export const DEFAULT_XP_PER_MODULE = 20;
export const DEFAULT_XP_FOR_COMPLETION = 50;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Config für eine Welt abrufen
 */
export const getConfig = query({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("worldConfig")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .first();

    // Return defaults wenn keine Config existiert
    if (!config) {
      return {
        worldId: args.worldId,
        xpConversionRate: DEFAULT_CONVERSION_RATE,
        xpPerModule: DEFAULT_XP_PER_MODULE,
        xpForCompletion: DEFAULT_XP_FOR_COMPLETION,
        scoreType: "points",
        scoreLabel: "Punkte",
        maxScore: null,
        isDefault: true,
      };
    }

    return {
      ...config,
      xpPerModule: config.xpPerModule ?? DEFAULT_XP_PER_MODULE,
      xpForCompletion: config.xpForCompletion ?? DEFAULT_XP_FOR_COMPLETION,
      scoreType: config.scoreType ?? "points",
      scoreLabel: config.scoreLabel ?? "Punkte",
      isDefault: false,
    };
  },
});

/**
 * Configs für mehrere Welten abrufen (für Listen/Dashboards)
 */
export const getConfigsForWorlds = query({
  args: { worldIds: v.array(v.id("worlds")) },
  handler: async (ctx, args) => {
    const configs: Record<string, {
      xpConversionRate: number;
      xpPerModule: number;
      xpForCompletion: number;
      scoreType: string;
      scoreLabel: string;
      maxScore: number | null;
    }> = {};

    for (const worldId of args.worldIds) {
      const config = await ctx.db
        .query("worldConfig")
        .withIndex("by_world", (q) => q.eq("worldId", worldId))
        .first();

      configs[worldId] = {
        xpConversionRate: config?.xpConversionRate ?? DEFAULT_CONVERSION_RATE,
        xpPerModule: config?.xpPerModule ?? DEFAULT_XP_PER_MODULE,
        xpForCompletion: config?.xpForCompletion ?? DEFAULT_XP_FOR_COMPLETION,
        scoreType: config?.scoreType ?? "points",
        scoreLabel: config?.scoreLabel ?? "Punkte",
        maxScore: config?.maxScore ?? null,
      };
    }

    return configs;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Config für eine Welt setzen/aktualisieren
 */
export const setConfig = mutation({
  args: {
    worldId: v.id("worlds"),
    xpConversionRate: v.optional(v.number()),
    xpPerModule: v.optional(v.number()),
    xpForCompletion: v.optional(v.number()),
    scoreType: v.optional(v.string()),
    scoreLabel: v.optional(v.string()),
    maxScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("worldConfig")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .first();

    if (existing) {
      // Update
      await ctx.db.patch(existing._id, {
        xpConversionRate: args.xpConversionRate ?? existing.xpConversionRate,
        xpPerModule: args.xpPerModule ?? existing.xpPerModule,
        xpForCompletion: args.xpForCompletion ?? existing.xpForCompletion,
        scoreType: args.scoreType ?? existing.scoreType,
        scoreLabel: args.scoreLabel ?? existing.scoreLabel,
        maxScore: args.maxScore ?? existing.maxScore,
      });
      return { success: true, updated: true };
    } else {
      // Insert
      await ctx.db.insert("worldConfig", {
        worldId: args.worldId,
        xpConversionRate: args.xpConversionRate ?? DEFAULT_CONVERSION_RATE,
        xpPerModule: args.xpPerModule,
        xpForCompletion: args.xpForCompletion,
        scoreType: args.scoreType,
        scoreLabel: args.scoreLabel,
        maxScore: args.maxScore,
        createdAt: Date.now(),
      });
      return { success: true, updated: false };
    }
  },
});

/**
 * Config löschen (zurück zu Defaults)
 */
export const deleteConfig = mutation({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("worldConfig")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, deleted: true };
    }

    return { success: true, deleted: false };
  },
});

// ============================================================================
// HELPER FUNCTIONS (für interne Verwendung)
// ============================================================================

/**
 * XP aus World Score berechnen
 */
export function calculateXPFromScore(
  worldScore: number,
  config: { xpConversionRate: number; xpPerModule?: number; xpForCompletion?: number } | null,
  eventType: "score" | "module" | "complete"
): number {
  const rate = config?.xpConversionRate ?? DEFAULT_CONVERSION_RATE;

  switch (eventType) {
    case "score":
      return Math.floor(worldScore * rate);
    case "module":
      return config?.xpPerModule ?? DEFAULT_XP_PER_MODULE;
    case "complete":
      return config?.xpForCompletion ?? DEFAULT_XP_FOR_COMPLETION;
  }
}

/**
 * Config für eine Welt laden (interner Helper)
 */
export async function getConfigInternal(
  ctx: { db: { query: (table: "worldConfig") => { withIndex: (indexName: string, indexRange: (q: { eq: (field: string, value: Id<"worlds">) => unknown }) => unknown) => { first: () => Promise<{
    worldId: Id<"worlds">;
    xpConversionRate: number;
    xpPerModule?: number;
    xpForCompletion?: number;
    scoreType?: string;
    scoreLabel?: string;
    maxScore?: number;
  } | null> } } } },
  worldId: Id<"worlds">
): Promise<{
  xpConversionRate: number;
  xpPerModule: number;
  xpForCompletion: number;
  scoreType: string;
  scoreLabel: string;
  maxScore: number | null;
}> {
  const config = await ctx.db
    .query("worldConfig")
    .withIndex("by_world", (q) => q.eq("worldId", worldId))
    .first();

  return {
    xpConversionRate: config?.xpConversionRate ?? DEFAULT_CONVERSION_RATE,
    xpPerModule: config?.xpPerModule ?? DEFAULT_XP_PER_MODULE,
    xpForCompletion: config?.xpForCompletion ?? DEFAULT_XP_FOR_COMPLETION,
    scoreType: config?.scoreType ?? "points",
    scoreLabel: config?.scoreLabel ?? "Punkte",
    maxScore: config?.maxScore ?? null,
  };
}
