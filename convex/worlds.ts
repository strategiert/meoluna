import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

// List public worlds for Explore page
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("worlds")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(50);
  },
});

// List worlds by user for Dashboard
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("worlds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a single world
export const get = query({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Create a new world
export const create = mutation({
  args: {
    title: v.string(),
    code: v.string(),
    userId: v.string(),
    isPublic: v.boolean(),
    prompt: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    // Pipeline v3: Qualitätsstatus
    status: v.optional(v.union(
      v.literal("published"),
      v.literal("quarantined"),
      v.literal("failed")
    )),
    qualityScore: v.optional(v.number()),
    error: v.optional(v.string()),
    validationMetadata: v.optional(v.object({
      validatorSuccess: v.boolean(),
      validatorIterations: v.number(),
      gateScore: v.number(),
      gatePassed: v.boolean(),
      gateViolations: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("worlds", {
      title: args.title,
      code: args.code,
      userId: args.userId,
      isPublic: args.isPublic,
      prompt: args.prompt,
      gradeLevel: args.gradeLevel,
      subject: args.subject,
      status: args.status ?? "published",
      qualityScore: args.qualityScore,
      error: args.error,
      validationMetadata: args.validationMetadata,
      views: 0,
      likes: 0,
      createdAt: Date.now(),
    });
  },
});

// Update world code
export const update = mutation({
  args: {
    id: v.id("worlds"),
    code: v.optional(v.string()),
    title: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Delete a world
export const remove = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Increment views
export const incrementViews = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.id);
    if (world) {
      await ctx.db.patch(args.id, { views: (world.views || 0) + 1 });
    }
  },
});

// Toggle like (simple increment for now)
export const toggleLike = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.id);
    if (world) {
      await ctx.db.patch(args.id, { likes: (world.likes || 0) + 1 });
    }
    return { likes: (world?.likes || 0) + 1 };
  },
});

// Toggle public/private
export const togglePublic = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.id);
    if (world) {
      const newValue = !world.isPublic;
      await ctx.db.patch(args.id, { isPublic: newValue });
      return { isPublic: newValue };
    }
    return { isPublic: false };
  },
});

// ============================================================================
// MIGRATION: Upgrade worlds to use Meoluna API
// ============================================================================

// List all worlds that need upgrading (don't have Meoluna.reportScore)
export const listNeedingUpgrade = query({
  args: {},
  handler: async (ctx) => {
    const allWorlds = await ctx.db.query("worlds").collect();
    
    // Filter worlds that don't have Meoluna API calls
    return allWorlds.filter(world => {
      const code = world.code || '';
      const hasMeolunaCall = code.includes('Meoluna.reportScore') || 
                            code.includes('Meoluna.completeModule') ||
                            code.includes('Meoluna.complete(');
      return !hasMeolunaCall;
    }).map(w => ({
      id: w._id,
      title: w.title,
      userId: w.userId,
      codeLength: w.code?.length || 0,
    }));
  },
});

// Internal mutation to update a single world's code
export const updateWorldCode = internalMutation({
  args: {
    worldId: v.id("worlds"),
    newCode: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.worldId, { 
      code: args.newCode,
    });
  },
});

// Types for upgrade results
type UpgradeResult = {
  success: boolean;
  skipped: boolean;
  reason?: string;
  hasMeolunaCall?: boolean;
  originalLength?: number;
  upgradedLength?: number;
};

// Action: Upgrade a single world
export const upgradeWorld = action({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args): Promise<UpgradeResult> => {
    // 1. Get the world
    const world = await ctx.runQuery(api.worlds.get, { id: args.worldId });
    
    if (!world) {
      throw new Error("World not found");
    }
    
    if (!world.code) {
      throw new Error("World has no code");
    }
    
    // Check if already upgraded
    const hasMeolunaCall = world.code.includes('Meoluna.reportScore') || 
                          world.code.includes('Meoluna.completeModule') ||
                          world.code.includes('Meoluna.complete(');
    
    if (hasMeolunaCall) {
      return { 
        success: true, 
        skipped: true, 
        reason: "Already has Meoluna API calls" 
      };
    }
    
    // 2. Upgrade the code via Claude
    const result = await ctx.runAction(api.generate.upgradeWorldCode, {
      code: world.code,
    });
    
    if (!result.upgradedCode) {
      throw new Error("Upgrade failed - no code returned");
    }
    
    // 3. Save the upgraded code
    await ctx.runMutation(internal.worlds.updateWorldCode, {
      worldId: args.worldId,
      newCode: result.upgradedCode,
    });
    
    return {
      success: true,
      skipped: false,
      hasMeolunaCall: result.hasMeolunaCall,
      originalLength: result.originalLength,
      upgradedLength: result.upgradedLength,
    };
  },
});

// Types for migration
type MigrationResultItem = {
  worldId: string;
  title: string;
  success: boolean;
  skipped?: boolean;
  error?: string;
};

type MigrationResult = {
  totalNeedingUpgrade: number;
  processed: number;
  dryRun: boolean;
  results: MigrationResultItem[];
};

// Action: Batch upgrade all worlds (with rate limiting)
export const migrateAllWorlds = action({
  args: { 
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<MigrationResult> => {
    const dryRun = args.dryRun ?? true;
    const limit = args.limit ?? 10;
    
    // Get worlds needing upgrade
    const worldsToUpgrade: Array<{id: Id<"worlds">; title: string; userId: string | undefined; codeLength: number}> = 
      await ctx.runQuery(api.worlds.listNeedingUpgrade, {});
    
    const results: MigrationResultItem[] = [];
    
    // Process up to limit worlds
    const toProcess = worldsToUpgrade.slice(0, limit);
    
    for (const world of toProcess) {
      if (dryRun) {
        results.push({
          worldId: world.id as string,
          title: world.title,
          success: true,
          skipped: true,
        });
        continue;
      }
      
      try {
        // Add delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get full world data
        const fullWorld = await ctx.runQuery(api.worlds.get, { id: world.id });
        
        if (!fullWorld?.code) {
          results.push({
            worldId: world.id as string,
            title: world.title,
            success: false,
            error: "No code found",
          });
          continue;
        }
        
        // Upgrade code via Claude
        const upgradeResult = await ctx.runAction(api.generate.upgradeWorldCode, {
          code: fullWorld.code,
        });
        
        if (!upgradeResult.upgradedCode) {
          results.push({
            worldId: world.id as string,
            title: world.title,
            success: false,
            error: "Upgrade failed - no code returned",
          });
          continue;
        }
        
        // Save upgraded code
        await ctx.runMutation(internal.worlds.updateWorldCode, {
          worldId: world.id,
          newCode: upgradeResult.upgradedCode,
        });
        
        results.push({
          worldId: world.id as string,
          title: world.title,
          success: true,
          skipped: false,
        });
      } catch (error) {
        results.push({
          worldId: world.id as string,
          title: world.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
    
    return {
      totalNeedingUpgrade: worldsToUpgrade.length,
      processed: results.length,
      dryRun,
      results,
    };
  },
});
