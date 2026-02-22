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

// Letzte 5 fehlgeschlagenen Sessions (für CLI-Debug: npx convex run pipeline/status:listRecentFailed)
export const listRecentFailed = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("generationSessions").order("desc").take(20);
    return sessions.filter((s) => s.status === "failed").slice(0, 5).map((s) => ({
      sessionId: s.sessionId,
      error: s.error,
      errorCode: s.errorCode,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      durationMs: s.completedAt ? s.completedAt - s.startedAt : null,
      stepTimings: s.stepOutputs,
    }));
  },
});

// Letzte 30 Sessions (für Debug-Page: /admin/debug)
export const listAllRecent = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("generationSessions").order("desc").take(30);
    return sessions.map((s) => ({
      sessionId: s.sessionId,
      userId: s.userId,
      status: s.status,
      currentStep: s.currentStep,
      stepLabel: s.stepLabel,
      error: s.error,
      errorCode: s.errorCode,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      durationMs: s.completedAt
        ? s.completedAt - s.startedAt
        : Date.now() - s.startedAt,
      stepTimings: s.stepOutputs,
    }));
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

    if (session && args.currentStep >= (session.currentStep ?? 0)) {
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
    stepTimings: v.optional(v.any()),
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
        stepOutputs: args.stepTimings,
        completedAt: Date.now(),
      });
    }
  },
});

export const failSession = internalMutation({
  args: {
    sessionId: v.string(),
    error: v.string(),
    errorCode: v.optional(v.string()),
    gateViolations: v.optional(v.array(v.string())),
    qualityScore: v.optional(v.number()),
    stepTimings: v.optional(v.any()),
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
        errorCode: args.errorCode,
        gateViolations: args.gateViolations,
        qualityScore: args.qualityScore,
        stepOutputs: args.stepTimings,
        completedAt: Date.now(),
      });
    }
  },
});
