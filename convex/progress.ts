import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser, requireAdmin } from "./lib/auth";
import {
  DEFAULT_CONVERSION_RATE,
  DEFAULT_XP_PER_MODULE,
  DEFAULT_XP_FOR_COMPLETION,
  calculateXPFromScore,
} from "./worldConfig";

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
// USER STATS HELPERS
// ============================================================================

/**
 * UserStats für einen User sicherstellen (erstellen falls nicht vorhanden)
 */
async function ensureUserStats(
  ctx: { db: any },
  userId: string
): Promise<{
  _id: Id<"userStats">;
  userId: string;
  totalXP: number;
  level: number;
  lifetimeXP: number;
  lastActivityAt: number;
  createdAt: number;
}> {
  const existing = await ctx.db
    .query("userStats")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (existing) {
    return existing;
  }

  // Erstelle neue UserStats
  const newId = await ctx.db.insert("userStats", {
    userId,
    totalXP: 0,
    level: 1,
    lifetimeXP: 0,
    lastActivityAt: Date.now(),
    createdAt: Date.now(),
  });

  return {
    _id: newId,
    userId,
    totalXP: 0,
    level: 1,
    lifetimeXP: 0,
    lastActivityAt: Date.now(),
    createdAt: Date.now(),
  };
}

/**
 * UserStats aktualisieren nach XP-Gewinn
 */
async function updateUserStats(
  ctx: { db: any },
  userId: string,
  xpEarned: number
): Promise<{ newTotalXP: number; newLevel: number; leveledUp: boolean; previousLevel: number }> {
  const stats = await ensureUserStats(ctx, userId);
  const previousLevel = stats.level;
  const newTotalXP = stats.totalXP + xpEarned;
  const newLevel = calculateLevel(newTotalXP);
  const newLifetimeXP = stats.lifetimeXP + xpEarned;

  await ctx.db.patch(stats._id, {
    totalXP: newTotalXP,
    level: newLevel,
    lifetimeXP: newLifetimeXP,
    lastActivityAt: Date.now(),
  });

  return {
    newTotalXP,
    newLevel,
    leveledUp: newLevel > previousLevel,
    previousLevel,
  };
}

// ============================================================================
// QUERIES
//
// Sicherheitsfix: Fortschritt/XP sind Kinder-PII. Kein Endpoint darf einen
// client-gelieferten `userId` mehr entgegennehmen — die Identität kommt
// ausschließlich aus `ctx.auth` (requireUser). Jede Abfrage liefert daher nur
// die eigenen Daten des angemeldeten Nutzers zurück. Lehrer sehen
// Schüler-Fortschritt weiterhin nur über den bereits abgesicherten
// `classrooms.getMembers` (requireClassroomOwner).
// ============================================================================

/**
 * NEU: Schnelle User-Statistiken aus denormalisierter userStats Tabelle
 * Nur die eigenen Statistiken des angemeldeten Nutzers.
 */
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    const userId = caller.clerkId;

    // Versuche aus userStats zu lesen (schnell, denormalisiert)
    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (stats) {
      const levelProgress = xpToNextLevel(stats.totalXP);

      // Zähle abgeschlossene Welten
      const progressList = await ctx.db
        .query("progress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      const completedWorlds = progressList.filter(p => p.completedAt).length;
      const totalWorlds = progressList.length;

      return {
        totalXP: stats.totalXP,
        level: stats.level,
        lifetimeXP: stats.lifetimeXP,
        levelProgress,
        completedWorlds,
        totalWorlds,
        lastActivityAt: stats.lastActivityAt,
      };
    }

    // Fallback: Berechne aus progress (für Migration/Abwärtskompatibilität)
    const progressList = await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalXP = progressList.reduce((sum, p) => sum + (p.xpEarned ?? p.xp), 0);
    const level = calculateLevel(totalXP);
    const levelProgress = xpToNextLevel(totalXP);
    const completedWorlds = progressList.filter(p => p.completedAt).length;

    return {
      totalXP,
      level,
      lifetimeXP: totalXP,
      levelProgress,
      completedWorlds,
      totalWorlds: progressList.length,
      lastActivityAt: null,
    };
  },
});

// Alle Fortschritte des angemeldeten Nutzers (Legacy + erweitert)
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    const progressList = await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", caller.clerkId))
      .collect();

    // Berechne Gesamt-XP und Level (nutze xpEarned wenn vorhanden)
    const totalXP = progressList.reduce((sum, p) => sum + (p.xpEarned ?? p.xp), 0);
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

// Fortschritt für eine spezifische Welt — nur der eigene Fortschritt.
export const getByWorld = query({
  args: {
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const caller = await requireUser(ctx);
    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) =>
        q.eq("userId", caller.clerkId).eq("worldId", args.worldId)
      )
      .first();

    return progress;
  },
});

// Gesamt-XP und Level des angemeldeten Nutzers (Legacy - nutzt jetzt getUserStats intern)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    const userId = caller.clerkId;

    // Versuche aus userStats zu lesen
    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (stats) {
      const levelProgress = xpToNextLevel(stats.totalXP);

      const progressList = await ctx.db
        .query("progress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      const completedWorlds = progressList.filter(p => p.completedAt).length;
      const totalWorlds = progressList.length;

      return {
        totalXP: stats.totalXP,
        level: stats.level,
        levelProgress,
        completedWorlds,
        totalWorlds,
      };
    }

    // Fallback für bestehende User ohne userStats
    const progressList = await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalXP = progressList.reduce((sum, p) => sum + (p.xpEarned ?? p.xp), 0);
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
//
// Sicherheitsfix: `userId` kommt nie mehr vom Client. Jede Mutation schreibt
// ausschließlich unter der Identität des angemeldeten Nutzers
// (requireUser(ctx).clerkId).
// ============================================================================

/**
 * NEU: Score aus einer Welt melden (mit XP-Konvertierung)
 * Ersetzt addXP mit erweiterter Funktionalität
 */
export const reportScore = mutation({
  args: {
    worldId: v.id("worlds"),
    worldScore: v.number(),           // Rohpunkte der Welt
    eventType: v.union(
      v.literal("score"),
      v.literal("module"),
      v.literal("complete")
    ),
    moduleIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const caller = await requireUser(ctx);
    const userId = caller.clerkId;

    // 1. WorldConfig laden (Conversion Rate)
    const worldConfig = await ctx.db
      .query("worldConfig")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .first();

    const config = {
      xpConversionRate: worldConfig?.xpConversionRate ?? DEFAULT_CONVERSION_RATE,
      xpPerModule: worldConfig?.xpPerModule ?? DEFAULT_XP_PER_MODULE,
      xpForCompletion: worldConfig?.xpForCompletion ?? DEFAULT_XP_FOR_COMPLETION,
    };

    // 2. XP berechnen
    const xpAwarded = calculateXPFromScore(args.worldScore, config, args.eventType);

    // 3. Progress aktualisieren
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) =>
        q.eq("userId", userId).eq("worldId", args.worldId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      const newWorldScore = (existing.worldScore ?? 0) + args.worldScore;
      const newXpEarned = (existing.xpEarned ?? 0) + xpAwarded;
      const newBestScore = Math.max(existing.bestScore ?? 0, args.worldScore);
      const newAttempts = (existing.attempts ?? 0) + (args.eventType === "complete" ? 1 : 0);

      await ctx.db.patch(existing._id, {
        xp: existing.xp + xpAwarded, // Legacy-Feld auch aktualisieren
        worldScore: newWorldScore,
        xpEarned: newXpEarned,
        bestScore: newBestScore,
        attempts: newAttempts,
        moduleIndex: args.moduleIndex ?? existing.moduleIndex,
        completedAt: args.eventType === "complete" ? now : existing.completedAt,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("progress", {
        userId,
        worldId: args.worldId,
        xp: xpAwarded, // Legacy
        worldScore: args.worldScore,
        xpEarned: xpAwarded,
        bestScore: args.worldScore,
        attempts: args.eventType === "complete" ? 1 : 0,
        moduleIndex: args.moduleIndex ?? 0,
        completedAt: args.eventType === "complete" ? now : undefined,
        updatedAt: now,
      });
    }

    // 4. UserStats aktualisieren
    const statsResult = await updateUserStats(ctx, userId, xpAwarded);

    // 5. Return result
    return {
      success: true,
      xpAwarded,
      worldScore: args.worldScore,
      leveledUp: statsResult.leveledUp,
      newLevel: statsResult.newLevel,
      newTotalXP: statsResult.newTotalXP,
    };
  },
});

// XP für eine Welt hinzufügen/aktualisieren (Legacy - ruft reportScore auf)
export const addXP = mutation({
  args: {
    worldId: v.id("worlds"),
    xpEarned: v.number(),
    moduleIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const caller = await requireUser(ctx);
    const userId = caller.clerkId;

    // Prüfe ob bereits Fortschritt existiert
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) =>
        q.eq("userId", userId).eq("worldId", args.worldId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update bestehenden Fortschritt
      const newXP = existing.xp + args.xpEarned;
      const newXpEarned = (existing.xpEarned ?? 0) + args.xpEarned;

      await ctx.db.patch(existing._id, {
        xp: newXP,
        xpEarned: newXpEarned,
        worldScore: (existing.worldScore ?? 0) + args.xpEarned, // Für Legacy: worldScore = xp
        moduleIndex: args.moduleIndex ?? existing.moduleIndex,
        updatedAt: now,
      });

      // UserStats aktualisieren
      const statsResult = await updateUserStats(ctx, userId, args.xpEarned);

      return {
        success: true,
        newXP,
        leveledUp: statsResult.leveledUp,
        newLevel: statsResult.newLevel,
      };
    } else {
      // Neuen Fortschritt erstellen
      await ctx.db.insert("progress", {
        userId,
        worldId: args.worldId,
        xp: args.xpEarned,
        xpEarned: args.xpEarned,
        worldScore: args.xpEarned, // Für Legacy: worldScore = xp
        moduleIndex: args.moduleIndex ?? 0,
        updatedAt: now,
      });

      // UserStats aktualisieren
      const statsResult = await updateUserStats(ctx, userId, args.xpEarned);

      return {
        success: true,
        newXP: args.xpEarned,
        leveledUp: statsResult.leveledUp,
        newLevel: statsResult.newLevel,
      };
    }
  },
});

// Welt als abgeschlossen markieren
export const completeWorld = mutation({
  args: {
    worldId: v.id("worlds"),
    bonusXP: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const caller = await requireUser(ctx);
    const userId = caller.clerkId;

    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_world", (q) =>
        q.eq("userId", userId).eq("worldId", args.worldId)
      )
      .first();

    // WorldConfig für Completion XP laden
    const worldConfig = await ctx.db
      .query("worldConfig")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .first();

    const bonusXP = args.bonusXP ?? worldConfig?.xpForCompletion ?? DEFAULT_XP_FOR_COMPLETION;
    const now = Date.now();

    if (existing) {
      // Nur markieren wenn noch nicht abgeschlossen
      if (!existing.completedAt) {
        const newXP = existing.xp + bonusXP;
        const newXpEarned = (existing.xpEarned ?? 0) + bonusXP;

        await ctx.db.patch(existing._id, {
          xp: newXP,
          xpEarned: newXpEarned,
          attempts: (existing.attempts ?? 0) + 1,
          completedAt: now,
          updatedAt: now,
        });

        // UserStats aktualisieren
        const statsResult = await updateUserStats(ctx, userId, bonusXP);

        return {
          success: true,
          alreadyCompleted: false,
          xpAwarded: bonusXP,
          leveledUp: statsResult.leveledUp,
          newLevel: statsResult.newLevel,
        };
      }
      return {
        success: true,
        alreadyCompleted: true,
        xpAwarded: 0,
        leveledUp: false,
        newLevel: calculateLevel((await ensureUserStats(ctx, userId)).totalXP),
      };
    } else {
      // Neuen Fortschritt mit Abschluss erstellen
      await ctx.db.insert("progress", {
        userId,
        worldId: args.worldId,
        xp: bonusXP,
        xpEarned: bonusXP,
        worldScore: 0,
        moduleIndex: 0,
        attempts: 1,
        completedAt: now,
        updatedAt: now,
      });

      // UserStats aktualisieren
      const statsResult = await updateUserStats(ctx, userId, bonusXP);

      return {
        success: true,
        alreadyCompleted: false,
        xpAwarded: bonusXP,
        leveledUp: statsResult.leveledUp,
        newLevel: statsResult.newLevel,
      };
    }
  },
});

// Progress zurücksetzen (für Debugging/Admin).
// Standardmäßig setzt jeder Nutzer nur seinen eigenen Fortschritt zurück.
// Nur wenn explizit ein `userId` (Fremd-Ziel) übergeben wird, ist Admin
// erforderlich — so bleibt das Debug-Tool für Admins nutzbar, ohne dass
// normale Nutzer fremde Fortschritte manipulieren können.
export const reset = mutation({
  args: {
    userId: v.optional(v.string()),
    worldId: v.optional(v.id("worlds")),
  },
  handler: async (ctx, args) => {
    let targetUserId: string;
    if (args.userId) {
      await requireAdmin(ctx);
      targetUserId = args.userId;
    } else {
      const caller = await requireUser(ctx);
      targetUserId = caller.clerkId;
    }

    let xpToRemove = 0;

    if (args.worldId) {
      // Nur für eine Welt
      const worldId = args.worldId;
      const progress = await ctx.db
        .query("progress")
        .withIndex("by_user_world", (q) =>
          q.eq("userId", targetUserId).eq("worldId", worldId)
        )
        .first();
      if (progress) {
        xpToRemove = progress.xpEarned ?? progress.xp;
        await ctx.db.delete(progress._id);
      }
    } else {
      // Alle Progress für User
      const progressList = await ctx.db
        .query("progress")
        .withIndex("by_user", (q) => q.eq("userId", targetUserId))
        .collect();
      for (const p of progressList) {
        xpToRemove += p.xpEarned ?? p.xp;
        await ctx.db.delete(p._id);
      }
    }

    // UserStats aktualisieren (XP abziehen, aber lifetimeXP bleibt)
    if (xpToRemove > 0) {
      const stats = await ctx.db
        .query("userStats")
        .withIndex("by_user", (q) => q.eq("userId", targetUserId))
        .first();

      if (stats) {
        const newTotalXP = Math.max(0, stats.totalXP - xpToRemove);
        const newLevel = calculateLevel(newTotalXP);

        await ctx.db.patch(stats._id, {
          totalXP: newTotalXP,
          level: newLevel,
          lastActivityAt: Date.now(),
        });
      }
    }

    return { success: true, xpRemoved: xpToRemove };
  },
});

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migration: UserStats für bestehende User erstellen.
 * Schreibt/patcht Progress-Zeilen eines beliebigen Ziel-Users — daher
 * Admin-only (kein normaler Nutzer darf fremde Progress-Datensätze anfassen).
 * Sollte einmalig nach Schema-Update von einem Admin ausgeführt werden.
 */
export const migrateUserStats = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Prüfe ob bereits userStats existiert
    const existing = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return { success: true, migrated: false, reason: "already_exists" };
    }

    // Berechne XP aus bestehenden Progress-Einträgen
    const progressList = await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalXP = progressList.reduce((sum, p) => sum + (p.xpEarned ?? p.xp), 0);
    const level = calculateLevel(totalXP);

    // Erstelle userStats
    await ctx.db.insert("userStats", {
      userId: args.userId,
      totalXP,
      level,
      lifetimeXP: totalXP,
      lastActivityAt: Date.now(),
      createdAt: Date.now(),
    });

    // Aktualisiere Progress-Einträge mit xpEarned und worldScore
    for (const p of progressList) {
      if (p.xpEarned === undefined || p.worldScore === undefined) {
        await ctx.db.patch(p._id, {
          xpEarned: p.xpEarned ?? p.xp,
          worldScore: p.worldScore ?? p.xp,
        });
      }
    }

    return {
      success: true,
      migrated: true,
      totalXP,
      level,
      progressCount: progressList.length,
    };
  },
});

/**
 * Initialisiere UserStats für den angemeldeten Nutzer (für automatische
 * Migration bei Login). Immer self-service — es gibt keinen legitimen Grund,
 * warum ein Client die UserStats eines anderen Nutzers initialisieren müsste.
 */
export const initializeUserStats = mutation({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    await ensureUserStats(ctx, caller.clerkId);
    return { success: true };
  },
});
