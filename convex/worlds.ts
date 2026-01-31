import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("worlds")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("worlds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const create = mutation({
  args: {
    title: v.string(),
    prompt: v.string(),
    code: v.string(),
    userId: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("worlds", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("worlds"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { code: args.code });
  },
});

export const remove = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
