// ============================================================================
// PIPELINE STATUS - Mutations for real-time progress tracking
// ============================================================================

import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { api } from "../_generated/api";

// --- Mutations (client-facing) ---

// Startet die Welt-Generierung als Hintergrund-Job. Die schwere Arbeit laeuft
// als gescheduelte Convex-Action und damit garantiert serverseitig zu Ende,
// unabhaengig davon, ob der Browser refresht, der Tab wechselt oder schliesst.
// Gibt sofort zurueck; der Client beobachtet den Fortschritt reaktiv ueber
// getSession(sessionId).
export const startGeneration = mutation({
  args: {
    prompt: v.string(),
    pdfText: v.optional(v.string()),
    imageDescription: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    contextAnswers: v.optional(v.object({
      intent: v.optional(v.string()),
      audience: v.optional(v.string()),
      guidance: v.optional(v.string()),
    })),
    userId: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, api.pipeline.orchestrator.generateWorldV2, args);
    return { sessionId: args.sessionId };
  },
});

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
    errorCode: v.optional(v.string()),
    gateViolations: v.optional(v.array(v.string())),
    qualityScore: v.optional(v.number()),
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
        completedAt: Date.now(),
      });
    }
  },
});
