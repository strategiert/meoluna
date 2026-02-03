import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Nachricht speichern
export const saveMessage = mutation({
  args: {
    worldId: v.optional(v.id("worlds")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      worldId: args.worldId,
      role: args.role,
      content: args.content,
      code: args.code,
      createdAt: Date.now(),
    });
  },
});

// Alle Nachrichten einer Welt laden
export const getByWorld = query({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .order("asc")
      .collect();
  },
});
