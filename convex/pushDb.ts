// ============================================================================
// Web Push - DB-Funktionen (Nicht-Node, da push.ts ein "use node"-Modul ist).
// ============================================================================

import { v } from "convex/values";
import { mutation, internalQuery, internalMutation } from "./_generated/server";
import { requireUser } from "./lib/auth";

// Client meldet seine Push-Subscription an (Upsert ueber endpoint).
// Sicherheitsfix: userId kommt nicht mehr vom Client — sonst könnte jeder
// beliebige Push-Subscriptions unter einer fremden Clerk-ID registrieren
// (und damit fremde Push-Benachrichtigungen abfangen). Immer die eigene,
// per ctx.auth verifizierte Identität verwenden.
export const savePushSubscription = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await requireUser(ctx);

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: caller.clerkId,
        p256dh: args.p256dh,
        auth: args.auth,
      });
      return existing._id;
    }
    return await ctx.db.insert("pushSubscriptions", {
      userId: caller.clerkId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
    });
  },
});

export const listSubscriptionsForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deleteSubscription = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
