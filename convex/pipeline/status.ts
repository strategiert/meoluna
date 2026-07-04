// ============================================================================
// PIPELINE STATUS - Mutations for real-time progress tracking
// ============================================================================

import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireUser } from "../lib/auth";

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
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Identitaet serverseitig aus dem Clerk-JWT ableiten, nie vom Client
    // uebernehmen. Geplante (scheduler.runAfter) Funktionsaufrufe behalten
    // den Auth-Kontext des Aufrufers NICHT bei, deshalb rufen wir hier die
    // interne, vertrauenswuerdige Variante der Pipeline-Action auf und
    // reichen die bereits verifizierte userId explizit durch.
    const user = await requireUser(ctx);
    await ctx.scheduler.runAfter(0, internal.pipeline.orchestrator.generateWorldV2Internal, {
      ...args,
      userId: user.clerkId,
    });
    return { sessionId: args.sessionId };
  },
});

// --- Queries ---

// sessionId ist zwar ein unerratbarer Zufallstoken, gehoert aber trotzdem
// einem konkreten Nutzer. Wir verlangen Authentifizierung und geben die
// Session nur an ihren Eigentuemer (oder einen Admin) heraus.
export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!session) return null;
    if (session.userId !== user.clerkId && user.role !== "admin") {
      throw new Error("Nicht autorisiert für diese Session.");
    }
    return session;
  },
});

export const getActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("generationSessions")
      .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
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
      // Web-Push an den Nutzer (auch bei geschlossenem Browser).
      if (args.worldId) {
        await ctx.scheduler.runAfter(0, internal.push.sendWorldReady, {
          userId: session.userId,
          worldId: args.worldId,
        });
      }
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
