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

// Hash email for GDPR compliance
function hashEmail(email: string): string {
  return simpleHash(email.toLowerCase().trim() + "meoluna_salt_2026");
}

// Resolve identity - get or create canonical user ID
export const resolveIdentity = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", args.anonymousId))
      .first();

    if (!identity) {
      return {
        canonicalUserId: args.anonymousId,
        isLinked: false,
        userId: undefined,
      };
    }

    return {
      canonicalUserId: identity.canonicalUserId,
      isLinked: !!identity.userId,
      userId: identity.userId,
      firstTouchAttribution: identity.firstTouchAttribution,
      lastTouchAttribution: identity.lastTouchAttribution,
    };
  },
});

// Link user ID to anonymous ID (called after login/signup)
export const linkUserId = mutation({
  args: {
    anonymousId: v.string(),
    userId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const emailHash = args.email ? hashEmail(args.email) : undefined;

    // Find existing identity by anonymousId
    const existingByAnonymous = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", args.anonymousId))
      .first();

    // Check if there's already an identity for this userId
    const existingByUser = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existingByUser && existingByAnonymous && existingByUser._id !== existingByAnonymous._id) {
      // Merge identities - combine sessions and devices
      const mergedDevices = [...existingByUser.devices];

      for (const device of existingByAnonymous.devices) {
        const existingDevice = mergedDevices.find((d) => d.platform === device.platform);
        if (existingDevice) {
          // Merge session IDs
          const allSessions = new Set([...existingDevice.sessionIds, ...device.sessionIds]);
          existingDevice.sessionIds = Array.from(allSessions);
          existingDevice.firstSeen = Math.min(existingDevice.firstSeen, device.firstSeen);
          existingDevice.lastSeen = Math.max(existingDevice.lastSeen, device.lastSeen);
        } else {
          mergedDevices.push(device);
        }
      }

      // Keep first touch from earlier identity
      const firstTouch =
        existingByUser.firstSeen < existingByAnonymous.firstSeen
          ? existingByUser.firstTouchAttribution
          : existingByAnonymous.firstTouchAttribution;

      // Keep last touch from later identity
      const lastTouch =
        existingByUser.lastActivity > existingByAnonymous.lastActivity
          ? existingByUser.lastTouchAttribution
          : existingByAnonymous.lastTouchAttribution;

      // Update the user's identity
      await ctx.db.patch(existingByUser._id, {
        devices: mergedDevices,
        emailHash: emailHash || existingByUser.emailHash,
        firstTouchAttribution: firstTouch,
        lastTouchAttribution: lastTouch,
        firstSeen: Math.min(existingByUser.firstSeen, existingByAnonymous.firstSeen),
        lastActivity: now,
      });

      // Delete the anonymous identity (merged into user identity)
      await ctx.db.delete(existingByAnonymous._id);

      return {
        canonicalUserId: existingByUser.canonicalUserId,
        merged: true,
      };
    }

    if (existingByAnonymous) {
      // Link user ID to existing anonymous identity
      await ctx.db.patch(existingByAnonymous._id, {
        userId: args.userId,
        emailHash,
        lastActivity: now,
      });

      return {
        canonicalUserId: existingByAnonymous.canonicalUserId,
        merged: false,
      };
    }

    if (existingByUser) {
      // Add anonymous session to existing user identity
      const devices = [...existingByUser.devices];
      const webDevice = devices.find((d) => d.platform === "web");

      if (webDevice) {
        webDevice.lastSeen = now;
      } else {
        devices.push({
          platform: "web",
          sessionIds: [],
          firstSeen: now,
          lastSeen: now,
        });
      }

      await ctx.db.patch(existingByUser._id, {
        devices,
        emailHash: emailHash || existingByUser.emailHash,
        lastActivity: now,
      });

      return {
        canonicalUserId: existingByUser.canonicalUserId,
        merged: false,
      };
    }

    // Create new identity with user ID
    await ctx.db.insert("userIdentityGraph", {
      canonicalUserId: args.anonymousId,
      userId: args.userId,
      emailHash,
      devices: [
        {
          platform: "web",
          sessionIds: [],
          firstSeen: now,
          lastSeen: now,
        },
      ],
      firstSeen: now,
      lastActivity: now,
    });

    return {
      canonicalUserId: args.anonymousId,
      merged: false,
    };
  },
});

// Get identity by user ID
export const getIdentityByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get identity by canonical ID
export const getIdentityByCanonicalId = query({
  args: { canonicalUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", args.canonicalUserId))
      .first();
  },
});

// Update attribution when user returns with new campaign
export const updateAttribution = mutation({
  args: {
    canonicalUserId: v.string(),
    attribution: v.object({
      source: v.optional(v.string()),
      medium: v.optional(v.string()),
      campaign: v.optional(v.string()),
      fbclid: v.optional(v.string()),
      gclid: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", args.canonicalUserId))
      .first();

    if (!existing) {
      return { success: false, reason: "Identity not found" };
    }

    // Update last touch attribution
    await ctx.db.patch(existing._id, {
      lastTouchAttribution: {
        ...args.attribution,
        timestamp: now,
      },
      lastActivity: now,
    });

    return { success: true };
  },
});
