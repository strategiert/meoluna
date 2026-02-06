// ============================================================================
// PIPELINE STATUS - Mutations for real-time progress tracking
// ============================================================================

import { v } from "convex/values";
import { query, internalMutation } from "../_generated/server";

// --- Queries ---

export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generationSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const getActiveSession = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generationSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "running"))
      .first();
  },
});

// --- Internal Mutations (called from actions) ---

export const createSession = internalMutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generationSessions", {
      sessionId: args.sessionId,
      userId: args.userId,
      status: "running",
      currentStep: 0,
      stepLabel: "Analysiere deine Aufgabe...",
      startedAt: Date.now(),
    });
  },
});

export const updateSession = internalMutation({
  args: {
    sessionId: v.string(),
    currentStep: v.number(),
    stepLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        currentStep: args.currentStep,
        stepLabel: args.stepLabel,
      });
    }
  },
});

export const completeSession = internalMutation({
  args: {
    sessionId: v.string(),
    worldId: v.optional(v.id("worlds")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        status: "completed",
        currentStep: 9,
        stepLabel: "Fertig! Deine Spielwelt ist bereit!",
        worldId: args.worldId,
        completedAt: Date.now(),
      });
    }
  },
});

export const failSession = internalMutation({
  args: {
    sessionId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        status: "failed",
        error: args.error,
        completedAt: Date.now(),
      });
    }
  },
});
