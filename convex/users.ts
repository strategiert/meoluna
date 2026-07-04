import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity, requireAdmin } from "./lib/auth";

// Upsert: User aus Clerk-Daten erstellen oder aktualisieren.
// clerkId wird IMMER serverseitig aus dem verifizierten Clerk-Token abgeleitet
// (nie aus Client-Argumenten), damit niemand fremde Profile überschreiben kann.
export const syncUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const clerkId = identity.subject;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      role: "student",
      createdAt: Date.now(),
    });
  },
});

// Eigenes User-Profil abrufen — nur der angemeldete Nutzer selbst.
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// Query-Wrapper, damit Actions Adminrechte prüfen können (Actions haben kein
// ctx.db, aber können via ctx.runQuery diese Query aufrufen — die Auth-Identität
// wird dabei durchgereicht). Wirft, wenn der Aufrufer kein Admin ist.
export const assertAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return true;
  },
});

// Rollen setzen.
// - Ein angemeldeter Admin darf die Rolle beliebiger Nutzer setzen.
// - Ohne Adminrechte ist nur das Bootstrapping der EIGENEN Rolle über ein
//   hochentropes ADMIN_ROLE_SECRET möglich (Erst-Einrichtung). Es ist NICHT
//   möglich, mit dem Secret die Rolle fremder Nutzer zu ändern.
export const setRole = mutation({
  args: {
    role: v.union(
      v.literal("student"),
      v.literal("creator"),
      v.literal("teacher"),
      v.literal("admin"),
    ),
    // Optionales Ziel (nur für Admins erlaubt). Ohne Angabe: eigener Account.
    targetClerkId: v.optional(v.string()),
    // Nur für Bootstrap der eigenen Admin-Rolle.
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    // Prüfe, ob der Aufrufer bereits Admin ist.
    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    const callerIsAdmin = caller?.role === "admin";

    let targetClerkId: string;
    if (args.targetClerkId && args.targetClerkId !== identity.subject) {
      // Fremdes Ziel: nur für Admins.
      if (!callerIsAdmin) {
        throw new Error("Nur Admins dürfen fremde Rollen ändern.");
      }
      targetClerkId = args.targetClerkId;
    } else {
      // Eigenes Ziel: entweder Admin, oder gültiges Bootstrap-Secret.
      targetClerkId = identity.subject;
      if (!callerIsAdmin) {
        const expectedSecret = process.env.ADMIN_ROLE_SECRET;
        if (!expectedSecret || args.adminSecret !== expectedSecret) {
          throw new Error("Nicht autorisiert.");
        }
      }
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", targetClerkId))
      .first();

    if (!existing) {
      return await ctx.db.insert("users", {
        clerkId: targetClerkId,
        role: args.role,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, {
      role: args.role,
    });
    return existing._id;
  },
});
