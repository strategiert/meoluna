import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Lernwelten
  worlds: defineTable({
    title: v.string(),
    prompt: v.optional(v.string()),
    code: v.string(),
    userId: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    isPublic: v.boolean(),
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  // Generation History (für Chat)
  messages: defineTable({
    worldId: v.optional(v.id("worlds")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    code: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // User Profiles (synced from Clerk)
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("student"), v.literal("creator"), v.literal("admin"))),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"]),

  // World Progress (Lernfortschritt)
  progress: defineTable({
    userId: v.string(),
    worldId: v.id("worlds"),
    moduleIndex: v.number(),
    xp: v.number(),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user_world", ["userId", "worldId"]),
});
