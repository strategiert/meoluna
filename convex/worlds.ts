import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import { requireUser, requireAdmin, getUserOrNull } from "./lib/auth";

// ============================================================================
// ACCESS HELPERS
// ============================================================================

// Darf der aktuelle Nutzer diese (ggf. private) Welt sehen?
// Öffentliche Welten: jeder. Private Welten: nur Eigentümer, Admin, oder ein
// Mitglied/Teacher einer Klasse, der die Welt als Assignment zugewiesen wurde.
async function canAccessWorld(
  ctx: Parameters<typeof requireUser>[0],
  world: Doc<"worlds">,
): Promise<boolean> {
  if (world.isPublic) return true;

  const user = await getUserOrNull(ctx);
  if (!user) return false;
  if (world.userId === user.clerkId || user.role === "admin") return true;

  // Zugewiesene Welt: Zugriff für Teacher/Mitglieder der Klasse.
  const assignments = await ctx.db
    .query("classroomAssignments")
    .withIndex("by_world", (q) => q.eq("worldId", world._id))
    .collect();

  for (const assignment of assignments) {
    const classroom = await ctx.db.get(assignment.classroomId);
    if (!classroom) continue;
    if (classroom.teacherId === user.clerkId) return true;
    const membership = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom_user", (q) =>
        q.eq("classroomId", assignment.classroomId).eq("userId", user.clerkId),
      )
      .first();
    if (membership) return true;
  }

  return false;
}

// ============================================================================
// QUERIES
// ============================================================================

// Öffentliche Welten für die Explore-Seite. Bewusst nur nicht-sensible Felder
// (kein Eigentümer-clerkId, kein prompt, kein code) für anonyme Besucher.
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const worlds = await ctx.db
      .query("worlds")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(50);

    return worlds.map((w) => ({
      _id: w._id,
      title: w.title,
      gradeLevel: w.gradeLevel,
      subject: w.subject,
      views: w.views ?? 0,
      likes: w.likes ?? 0,
      createdAt: w.createdAt,
    }));
  },
});

// Welten des angemeldeten Nutzers (Dashboard). Identität serverseitig.
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("worlds")
      .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
      .order("desc")
      .collect();
  },
});

// Einzelne Welt. Öffentliche Welten frei; private nur mit Zugriffsrecht.
export const get = query({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.id);
    if (!world) return null;
    if (!(await canAccessWorld(ctx, world))) {
      throw new Error("Nicht autorisiert für diese Welt.");
    }
    return world;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Neue Welt erstellen — Eigentümer = angemeldeter Nutzer.
export const create = mutation({
  args: {
    title: v.string(),
    code: v.string(),
    isPublic: v.boolean(),
    prompt: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
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
    const user = await requireUser(ctx);
    const id = await ctx.db.insert("worlds", {
      title: args.title,
      code: args.code,
      userId: user.clerkId,
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
    return id;
  },
});

// Interne Welt-Erstellung für die (serverseitige) Generierungs-Pipeline.
// Nicht öffentlich aufrufbar; userId wird vom authentifizierten Entrypoint
// der Pipeline durchgereicht und ist daher vertrauenswürdig.
export const internalCreate = internalMutation({
  args: {
    title: v.string(),
    code: v.string(),
    userId: v.string(),
    isPublic: v.boolean(),
    prompt: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
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

// Hilfsfunktion: Welt laden und Eigentum/Adminrecht prüfen.
async function requireWorldOwner(
  ctx: Parameters<typeof requireUser>[0],
  id: Id<"worlds">,
): Promise<Doc<"worlds">> {
  const user = await requireUser(ctx);
  const world = await ctx.db.get(id);
  if (!world) {
    throw new Error("Welt nicht gefunden.");
  }
  if (world.userId !== user.clerkId && user.role !== "admin") {
    throw new Error("Nicht autorisiert für diese Welt.");
  }
  return world;
}

// Welt aktualisieren — nur Eigentümer/Admin.
export const update = mutation({
  args: {
    id: v.id("worlds"),
    code: v.optional(v.string()),
    title: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireWorldOwner(ctx, args.id);
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, val]) => val !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Welt löschen — nur Eigentümer/Admin.
export const remove = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    await requireWorldOwner(ctx, args.id);
    await ctx.db.delete(args.id);
  },
});

// Aufrufe zählen — nur für Welten, die der Aufrufer sehen darf.
export const incrementViews = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.id);
    if (world && (await canAccessWorld(ctx, world))) {
      await ctx.db.patch(args.id, { views: (world.views || 0) + 1 });
    }
  },
});

// Like — erfordert Anmeldung; nur für sichtbare Welten.
export const toggleLike = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const world = await ctx.db.get(args.id);
    if (world && (await canAccessWorld(ctx, world))) {
      await ctx.db.patch(args.id, { likes: (world.likes || 0) + 1 });
      return { likes: (world.likes || 0) + 1 };
    }
    return { likes: world?.likes || 0 };
  },
});

// Öffentlich/privat umschalten — nur Eigentümer/Admin.
export const togglePublic = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    const world = await requireWorldOwner(ctx, args.id);
    const newValue = !world.isPublic;
    await ctx.db.patch(args.id, { isPublic: newValue });
    return { isPublic: newValue };
  },
});

// ============================================================================
// ADMIN: Alle Welten mit Status/Qualitätsinfo für Debug-View
// ============================================================================
export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const worlds = await ctx.db
      .query("worlds")
      .order("desc")
      .take(200);

    return worlds.map(w => ({
      _id: w._id,
      title: w.title,
      userId: w.userId,
      status: w.status ?? "published",
      qualityScore: w.qualityScore,
      error: w.error,
      validationMetadata: w.validationMetadata,
      createdAt: w.createdAt,
      prompt: w.prompt,
      subject: w.subject,
      gradeLevel: w.gradeLevel,
    }));
  },
});

// ============================================================================
// MIGRATION: Upgrade worlds to use Meoluna API (nur Admin)
// ============================================================================

export const listNeedingUpgrade = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const allWorlds = await ctx.db.query("worlds").collect();

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

type UpgradeResult = {
  success: boolean;
  skipped: boolean;
  reason?: string;
  hasMeolunaCall?: boolean;
  originalLength?: number;
  upgradedLength?: number;
};

// Action: Upgrade a single world — nur Admin.
export const upgradeWorld = action({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args): Promise<UpgradeResult> => {
    await ctx.runQuery(api.users.assertAdmin, {});

    const world = await ctx.runQuery(api.worlds.get, { id: args.worldId });

    if (!world) {
      throw new Error("World not found");
    }

    if (!world.code) {
      throw new Error("World has no code");
    }

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

    const result = await ctx.runAction(api.generate.upgradeWorldCode, {
      code: world.code,
    });

    if (!result.upgradedCode) {
      throw new Error("Upgrade failed - no code returned");
    }

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

// Action: Batch upgrade all worlds — nur Admin.
export const migrateAllWorlds = action({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<MigrationResult> => {
    await ctx.runQuery(api.users.assertAdmin, {});

    const dryRun = args.dryRun ?? true;
    const limit = args.limit ?? 10;

    const worldsToUpgrade: Array<{id: Id<"worlds">; title: string; userId: string | undefined; codeLength: number}> =
      await ctx.runQuery(api.worlds.listNeedingUpgrade, {});

    const results: MigrationResultItem[] = [];

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
        await new Promise(resolve => setTimeout(resolve, 2000));

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
