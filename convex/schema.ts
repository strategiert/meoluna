import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================================
  // USER STATS (Denormalisierte User-Level Statistiken)
  // ============================================================================
  userStats: defineTable({
    userId: v.string(),           // Clerk User ID
    totalXP: v.number(),          // Aggregiertes XP (denormalisiert für schnellen Zugriff)
    level: v.number(),            // Aktuelles Level
    lifetimeXP: v.number(),       // Gesamt-XP (nie verringert, auch wenn totalXP reset)
    lastActivityAt: v.number(),   // Letzter Fortschritt
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_level", ["level"]),   // Für Leaderboards

  // ============================================================================
  // WORLD CONFIG (XP-Konvertierung pro Welt)
  // ============================================================================
  worldConfig: defineTable({
    worldId: v.id("worlds"),
    xpConversionRate: v.number(),    // z.B. 0.5 = 100 Punkte → 50 XP
    xpPerModule: v.optional(v.number()),      // XP für Modul-Abschluss
    xpForCompletion: v.optional(v.number()),  // XP für Welt-Abschluss
    scoreType: v.optional(v.string()),        // "points", "stars", "percentage"
    scoreLabel: v.optional(v.string()),       // "Punkte", "Sterne", etc.
    maxScore: v.optional(v.number()),         // Maximale Punktzahl
    createdAt: v.number(),
  })
    .index("by_world", ["worldId"]),

  // ============================================================================
  // LERNWELTEN
  // ============================================================================
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
    role: v.optional(v.union(
      v.literal("student"),
      v.literal("creator"),
      v.literal("teacher"),
      v.literal("admin")
    )),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"]),

  // ============================================================================
  // WORLD PROGRESS (Lernfortschritt pro User pro Welt)
  // ============================================================================
  progress: defineTable({
    userId: v.string(),
    worldId: v.id("worlds"),

    // Modul-Tracking
    moduleIndex: v.number(),

    // Legacy: Wird für Abwärtskompatibilität behalten
    xp: v.number(),

    // NEU: Welt-spezifische Punkte (Rohpunkte der Welt)
    worldScore: v.optional(v.number()),

    // NEU: XP-Beitrag zum User-Account (konvertierte XP)
    xpEarned: v.optional(v.number()),

    // NEU: Erweitertes Tracking
    bestScore: v.optional(v.number()),        // Beste erreichte Punktzahl
    attempts: v.optional(v.number()),         // Anzahl der Versuche

    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user_world", ["userId", "worldId"])
    .index("by_user", ["userId"]),

  // Classrooms (Teacher-managed groups)
  classrooms: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    teacherId: v.string(), // Clerk ID
    inviteCode: v.string(), // 6-stelliger Code zum Beitreten
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_invite_code", ["inviteCode"]),

  // Classroom Members (Students in a classroom)
  classroomMembers: defineTable({
    classroomId: v.id("classrooms"),
    userId: v.string(), // Clerk ID
    role: v.union(v.literal("student"), v.literal("assistant")),
    joinedAt: v.number(),
  })
    .index("by_classroom", ["classroomId"])
    .index("by_user", ["userId"])
    .index("by_classroom_user", ["classroomId", "userId"]),

  // Classroom Assignments (Worlds assigned to a classroom)
  classroomAssignments: defineTable({
    classroomId: v.id("classrooms"),
    worldId: v.id("worlds"),
    assignedBy: v.string(), // Teacher's Clerk ID
    title: v.optional(v.string()), // Optional custom title
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_classroom", ["classroomId"])
    .index("by_world", ["worldId"]),

  // Blog Posts
  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    author: v.string(),
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished", "publishedAt"])
    .index("by_category", ["category", "isPublished"]),
});
