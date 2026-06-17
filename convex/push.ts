"use node";

// ============================================================================
// Web Push - Benachrichtigung wenn eine Lernwelt fertig gebaut ist.
// Funktioniert auch bei geschlossenem Browser (Service Worker + VAPID).
// ============================================================================

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import webpush from "web-push";

// sendWorldReady wird vom Scheduler aufgerufen, sobald completeSession feuert.
export const sendWorldReady = internalAction({
  args: {
    userId: v.string(),
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:info@meoluna.com";
    if (!publicKey || !privateKey) {
      console.warn("VAPID keys not configured, skipping push.");
      return;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subs = await ctx.runQuery(internal.pushDb.listSubscriptionsForUser, {
      userId: args.userId,
    });
    if (subs.length === 0) return;

    const world = await ctx.runQuery(api.worlds.get, { id: args.worldId });
    const title = world?.title ?? "Deine Lernwelt";

    const payload = JSON.stringify({
      title: "Deine Lernwelt ist fertig! 🌙",
      body: `${title} kann jetzt gespielt werden.`,
      worldId: args.worldId,
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (error: any) {
          // 404/410 = Subscription abgelaufen/abbestellt -> aufraeumen.
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await ctx.runMutation(internal.pushDb.deleteSubscription, { id: sub._id });
          } else {
            console.warn("push send failed:", error?.statusCode ?? error);
          }
        }
      }),
    );
  },
});
