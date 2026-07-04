import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

// Sicherheitsfix: Der Generations-Chat gehört dem Besitzer der Welt. Die
// Identität kommt ausschließlich aus ctx.auth (requireUser) — ein
// client-gelieferter userId/clerkId-Wert wird nirgends mehr akzeptiert.
//
// Achtung/Ambiguität: `worldId` ist im Schema optional (Nachrichten können
// offenbar entstehen, bevor eine Welt gespeichert ist — es gibt aktuell
// keinen Aufrufer im Repo, weder Frontend noch generate.ts). Für den Fall
// ohne worldId gibt es kein Objekt, dessen Besitz geprüft werden könnte, also
// wird hier nur Anmeldung verlangt. Bitte gegenprüfen, ob das gewünscht ist,
// oder ob worldId für saveMessage künftig verpflichtend werden soll.

// Nachricht speichern — nur der Weltbesitzer (oder Admin) darf schreiben.
export const saveMessage = mutation({
  args: {
    worldId: v.optional(v.id("worlds")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await requireUser(ctx);

    if (args.worldId !== undefined) {
      const world = await ctx.db.get(args.worldId);
      if (!world) {
        throw new Error("Welt nicht gefunden.");
      }
      if (world.userId !== caller.clerkId && caller.role !== "admin") {
        throw new Error("Nicht autorisiert für diese Welt.");
      }
    }

    return await ctx.db.insert("messages", {
      worldId: args.worldId,
      role: args.role,
      content: args.content,
      code: args.code,
      createdAt: Date.now(),
    });
  },
});

// Alle Nachrichten einer Welt laden — nur der Weltbesitzer (oder Admin).
export const getByWorld = query({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args) => {
    const caller = await requireUser(ctx);

    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error("Welt nicht gefunden.");
    }
    if (world.userId !== caller.clerkId && caller.role !== "admin") {
      throw new Error("Nicht autorisiert für diese Welt.");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .order("asc")
      .collect();
  },
});
