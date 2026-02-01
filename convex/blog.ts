/**
 * Blog functions for Meoluna
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all published blog posts
export const listPublished = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    let q = ctx.db
      .query("blogPosts")
      .withIndex("by_published")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc");
    
    const posts = await q.take(limit);
    
    // Filter by category if provided
    if (args.category) {
      return posts.filter(p => p.category === args.category);
    }
    
    return posts;
  },
});

// Get a single blog post by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (!post || !post.isPublished) {
      return null;
    }
    
    return post;
  },
});

// Get all categories with post counts
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    
    const categoryCounts: Record<string, number> = {};
    for (const post of posts) {
      categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
    }
    
    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));
  },
});

// Create a new blog post (admin only)
export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    author: v.string(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const id = await ctx.db.insert("blogPosts", {
      ...args,
      publishedAt: args.isPublished ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
    
    return id;
  },
});

// Update a blog post
export const update = mutation({
  args: {
    id: v.id("blogPosts"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();
    
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Post not found");
    
    // Set publishedAt when first published
    let publishedAt = existing.publishedAt;
    if (updates.isPublished && !existing.isPublished) {
      publishedAt = now;
    }
    
    await ctx.db.patch(id, {
      ...updates,
      publishedAt,
      updatedAt: now,
    });
    
    return id;
  },
});

// Delete a blog post
export const remove = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
