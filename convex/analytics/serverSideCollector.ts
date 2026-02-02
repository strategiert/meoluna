import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Simple hash function for GDPR compliance (djb2 algorithm)
// Note: For production, consider using a Node.js action for SHA-256
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// Hash IP for GDPR compliance
function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  return simpleHash(ip + "meoluna_salt_2026");
}

// Collect click data (pageview/session start)
export const collectClick = mutation({
  args: {
    sessionId: v.string(),
    anonymousId: v.string(),
    landingPage: v.string(),
    referrer: v.optional(v.string()),
    fbclid: v.optional(v.string()),
    gclid: v.optional(v.string()),
    ttclid: v.optional(v.string()),
    utm_source: v.optional(v.string()),
    utm_medium: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
    utm_term: v.optional(v.string()),
    utm_content: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    acceptLanguage: v.optional(v.string()),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ipHash = hashIp(args.clientIp);

    // Check if session already exists
    const existingSession = await ctx.db
      .query("sessionClicks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      // Update last seen time
      await ctx.db.patch(existingSession._id, {
        lastSeenTime: now,
      });
      return { sessionId: args.sessionId, isNew: false };
    }

    // Create new session click record
    await ctx.db.insert("sessionClicks", {
      sessionId: args.sessionId,
      anonymousId: args.anonymousId,
      fbclid: args.fbclid,
      gclid: args.gclid,
      ttclid: args.ttclid,
      utm_source: args.utm_source,
      utm_medium: args.utm_medium,
      utm_campaign: args.utm_campaign,
      utm_term: args.utm_term,
      utm_content: args.utm_content,
      referrer: args.referrer,
      landingPage: args.landingPage,
      ipHash,
      userAgent: args.userAgent,
      acceptLanguage: args.acceptLanguage,
      firstClickTime: now,
      lastSeenTime: now,
    });

    // Also initialize/update identity graph
    await initializeIdentity(ctx, args.anonymousId, args.sessionId, {
      fbclid: args.fbclid,
      gclid: args.gclid,
      utm_source: args.utm_source,
      utm_medium: args.utm_medium,
      utm_campaign: args.utm_campaign,
    });

    return { sessionId: args.sessionId, isNew: true };
  },
});

// Helper to initialize identity graph entry
async function initializeIdentity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  anonymousId: string,
  sessionId: string,
  attribution: {
    fbclid?: string;
    gclid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }
) {
  const now = Date.now();

  // Check if identity already exists for this anonymousId
  const existing = await ctx.db
    .query("userIdentityGraph")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_canonical_id", (q: any) => q.eq("canonicalUserId", anonymousId))
    .first();

  if (existing) {
    // Update existing identity - add session to device
    const devices = [...existing.devices];
    const webDevice = devices.find((d: any) => d.platform === "web");

    if (webDevice) {
      if (!webDevice.sessionIds.includes(sessionId)) {
        webDevice.sessionIds.push(sessionId);
      }
      webDevice.lastSeen = now;
    } else {
      devices.push({
        platform: "web",
        sessionIds: [sessionId],
        firstSeen: now,
        lastSeen: now,
      });
    }

    // Update last touch attribution if we have new attribution data
    const hasNewAttribution = attribution.fbclid || attribution.gclid || attribution.utm_source;

    await ctx.db.patch(existing._id, {
      devices,
      lastActivity: now,
      ...(hasNewAttribution && {
        lastTouchAttribution: {
          source: attribution.utm_source,
          medium: attribution.utm_medium,
          campaign: attribution.utm_campaign,
          fbclid: attribution.fbclid,
          gclid: attribution.gclid,
          timestamp: now,
        },
      }),
    });
  } else {
    // Create new identity
    const hasAttribution = attribution.fbclid || attribution.gclid || attribution.utm_source;
    const attributionData = hasAttribution
      ? {
          source: attribution.utm_source,
          medium: attribution.utm_medium,
          campaign: attribution.utm_campaign,
          fbclid: attribution.fbclid,
          gclid: attribution.gclid,
          timestamp: now,
        }
      : undefined;

    await ctx.db.insert("userIdentityGraph", {
      canonicalUserId: anonymousId,
      devices: [
        {
          platform: "web",
          sessionIds: [sessionId],
          firstSeen: now,
          lastSeen: now,
        },
      ],
      firstTouchAttribution: attributionData,
      lastTouchAttribution: attributionData,
      firstSeen: now,
      lastActivity: now,
    });
  }
}

// Query to get session data
export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessionClicks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Query to get sessions by anonymous ID
export const getSessionsByAnonymousId = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessionClicks")
      .withIndex("by_anonymous", (q) => q.eq("anonymousId", args.anonymousId))
      .collect();
  },
});
