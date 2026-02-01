import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// XP/LEVEL SYSTEM
// ============================================================================

// Level-Formel: XP für Level n = 50 * n * (n-1)
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, Level 4: 600 XP, ...
export function calculateLevel(totalXP: number): number {
  // Umkehrformel: n = floor((1 + sqrt(1 + totalXP/25)) / 2)
  return Math.floor((1 + Math.sqrt(1 + totalXP / 25)) / 2);
}

export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function xpToNextLevel(totalXP: number): { current: number; needed: number; progress: number } {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(currentLevel + 1);
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;

  return {
    current: xpInCurrentLevel,
    needed: xpNeededForNext,
    progress: xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

// Alle Fortschritte eines Users
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const progressList = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) => q.eq("userId", args.userId))
      .collect();

    // Berechne Gesamt-XP und Level
    const totalXP = progressList.reduce((sum, p) => sum + p.xp, 0);
    const level = calculateLevel(totalXP);
    const levelProgress = xpToNextLevel(totalXP);

    return {
      progress: progressList,
      totalXP,
      level,
      levelProgress,
    };
  },
});

// Fortschritt für eine spezifische Welt
export const getByWorld = query({
  args: {
    userId: v.string(),
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) =>
        q.eq("userId", args.userId).eq("worldId", args.worldId)
      )
      .first();

    return progress;
  },
});

// Gesamt-XP und Level eines Users (lightweight)
export const getStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const progressList = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) => q.eq("userId", args.userId))
      .collect();

    const totalXP = progressList.reduce((sum, p) => sum + p.xp, 0);
    const level = calculateLevel(totalXP);
    const levelProgress = xpToNextLevel(totalXP);
    const completedWorlds = progressList.filter(p => p.completedAt).length;
    const totalWorlds = progressList.length;

    return {
      totalXP,
      level,
      levelProgress,
      completedWorlds,
      totalWorlds,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// XP für eine Welt hinzufügen/aktualisieren
export const addXP = mutation({
  args: {
    userId: v.string(),
    worldId: v.id("worlds"),
    xpEarned: v.number(),
    moduleIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Prüfe ob bereits Fortschritt existiert
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) =>
        q.eq("userId", args.userId).eq("worldId", args.worldId)
      )
      .first();

    if (existing) {
      // Update bestehenden Fortschritt
      await ctx.db.patch(existing._id, {
        xp: existing.xp + args.xpEarned,
        moduleIndex: args.moduleIndex ?? existing.moduleIndex,
        updatedAt: Date.now(),
      });
      return { success: true, newXP: existing.xp + args.xpEarned };
    } else {
      // Neuen Fortschritt erstellen
      await ctx.db.insert("progress", {
        userId: args.userId,
        worldId: args.worldId,
        xp: args.xpEarned,
        moduleIndex: args.moduleIndex ?? 0,
        updatedAt: Date.now(),
      });
      return { success: true, newXP: args.xpEarned };
    }
  },
});

// Welt als abgeschlossen markieren
export const completeWorld = mutation({
  args: {
    userId: v.string(),
    worldId: v.id("worlds"),
    bonusXP: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) =>
        q.eq("userId", args.userId).eq("worldId", args.worldId)
      )
      .first();

    const bonusXP = args.bonusXP ?? 50; // Standard-Bonus für Abschluss

    if (existing) {
      // Nur markieren wenn noch nicht abgeschlossen
      if (!existing.completedAt) {
        await ctx.db.patch(existing._id, {
          xp: existing.xp + bonusXP,
          completedAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      return { success: true, alreadyCompleted: !!existing.completedAt };
    } else {
      // Neuen Fortschritt mit Abschluss erstellen
      await ctx.db.insert("progress", {
        userId: args.userId,
        worldId: args.worldId,
        xp: bonusXP,
        moduleIndex: 0,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, alreadyCompleted: false };
    }
  },
});

// Progress zurücksetzen (für Debugging/Admin)
export const reset = mutation({
  args: {
    userId: v.string(),
    worldId: v.optional(v.id("worlds")),
  },
  handler: async (ctx, args) => {
    if (args.worldId) {
      // Nur für eine Welt
      const worldId = args.worldId;
      const progress = await ctx.db
        .query("progress")
        .withIndex("by_user_world", (q) =>
          q.eq("userId", args.userId).eq("worldId", worldId)
        )
        .first();
      if (progress) {
        await ctx.db.delete(progress._id);
      }
    } else {
      // Alle Progress für User
      const progressList = await ctx.db
        .query("progress")
        .withIndex("by_user_world", (q) => q.eq("userId", args.userId))
        .collect();
      for (const p of progressList) {
        await ctx.db.delete(p._id);
      }
    }
    return { success: true };
  },
});
