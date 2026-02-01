import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

// Toggle like
export const toggleLike = mutation({
  args: { id: v.id("worlds") },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.id);
    if (world) {
      await ctx.db.patch(args.id, { likes: (world.likes || 0) + 1 });
    }
  },
});
