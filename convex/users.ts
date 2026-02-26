import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upsert: User aus Clerk-Daten erstellen oder aktualisieren
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Aktualisiere nur geänderte Felder
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    // Neuen User erstellen
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      role: "student",
      createdAt: Date.now(),
    });
  },
});

// User-Profil abrufen
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Admin bootstrap (optional): Setzt Rolle eines Users über Secret.
export const setRole = mutation({
  args: {
    clerkId: v.string(),
    role: v.union(
      v.literal("student"),
      v.literal("creator"),
      v.literal("teacher"),
      v.literal("admin"),
    ),
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.ADMIN_ROLE_SECRET;
    if (!expectedSecret || args.adminSecret !== expectedSecret) {
      throw new Error("Invalid admin secret.");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existing) {
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        role: args.role,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, {
      role: args.role,
    });
    return existing._id;
  },
});
