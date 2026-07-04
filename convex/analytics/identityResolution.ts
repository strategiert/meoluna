import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { hashEmail } from "./hash";
import { requireIdentity, requireAdmin, getUserOrNull } from "../lib/auth";

// Resolve identity - liefert nur minimale, nicht-sensible Infos zurück
// (kein verknüpfter userId, keine Attribution) – anonyme Clients nutzen dies,
// um ihre eigene canonicalUserId zu ermitteln.
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
      };
    }

    return {
      canonicalUserId: identity.canonicalUserId,
      isLinked: !!identity.userId,
    };
  },
});

// Verknüpft die anonyme Identität mit dem ANGEMELDETEN Nutzer.
// userId wird serverseitig aus ctx.auth abgeleitet – niemals aus Client-Args –
// damit niemand seine anonyme Identität an ein fremdes Konto hängen kann.
export const linkUserId = mutation({
  args: {
    anonymousId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;
    const now = Date.now();
    const emailHash = args.email ? await hashEmail(args.email) : undefined;

    // Find existing identity by anonymousId
    const existingByAnonymous = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", args.anonymousId))
      .first();

    // Check if there's already an identity for this userId
    const existingByUser = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
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
        userId,
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
      userId,
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

// Eigene verknüpfte Identität abrufen (oder Admin). Der Identity-Graph enthält
// verknüpfte userId, emailHash und Attribution – daher nicht frei abfragbar.
export const getIdentityByUserId = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    return await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_user_id", (q) => q.eq("userId", user.subject))
      .first();
  },
});

// Get identity by canonical ID — nur Admin (Reporting/Debug).
export const getIdentityByCanonicalId = query({
  args: { canonicalUserId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", args.canonicalUserId))
      .first();
  },
});

// Update attribution — nur für die eigene (angemeldete) Identität.
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
    const user = await getUserOrNull(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("userIdentityGraph")
      .withIndex("by_canonical_id", (q) => q.eq("canonicalUserId", args.canonicalUserId))
      .first();

    if (!existing) {
      return { success: false, reason: "Identity not found" };
    }

    // Ist die Identität bereits mit einem Konto verknüpft, darf nur dieser
    // Nutzer (oder ein Admin) die Attribution ändern.
    if (existing.userId && existing.userId !== user?.clerkId && user?.role !== "admin") {
      return { success: false, reason: "Nicht autorisiert" };
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
