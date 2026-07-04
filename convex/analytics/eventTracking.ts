import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../lib/auth";

// Track an analytics event (öffentliches Beacon; canonicalUserId ist nicht
// vertrauenswürdig und rein für Aggregation, kein Autorisierungsmerkmal).
export const trackEvent = mutation({
  args: {
    canonicalUserId: v.optional(v.string()),
    sessionId: v.string(),
    eventType: v.string(),
    eventData: v.string(), // JSON string
    platform: v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    route: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const canonicalUserId = args.canonicalUserId || args.sessionId;
    const eventId = await ctx.db.insert("analyticsEvents", {
      canonicalUserId,
      sessionId: args.sessionId,
      eventType: args.eventType,
      eventData: args.eventData,
      platform: args.platform,
      route: args.route,
      timestamp: Date.now(),
    });

    // Update identity last activity
    const identity = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", canonicalUserId))
      .first();

    if (identity) {
      await ctx.db.patch(identity._id, {
        lastActivity: Date.now(),
      });
    }

    return { eventId };
  },
});

// Get events by session
export const getEventsBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("analyticsEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Get events by canonical user
export const getEventsByUser = query({
  args: {
    canonicalUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_canonical_user", (q) => q.eq("canonicalUserId", args.canonicalUserId))
      .order("desc")
      .take(args.limit || 100);

    return events;
  },
});

// Get events by type
export const getEventsByType = query({
  args: {
    eventType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("analyticsEvents")
      .withIndex("by_event_type", (q) => q.eq("eventType", args.eventType))
      .order("desc")
      .take(args.limit || 100);
  },
});

// Get recent events
export const getRecentEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 100);
  },
});

// Count events by type in time range
export const countEventsByType = query({
  args: {
    eventType: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_event_type", (q) => q.eq("eventType", args.eventType))
      .collect();

    const startTime = args.startTime || 0;
    const endTime = args.endTime || Date.now();

    const filtered = events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );

    return filtered.length;
  },
});
