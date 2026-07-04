import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { requireUser } from "./lib/auth";

// ============================================================================
// FILE STORAGE - Upload von Bildern und PDFs
// ============================================================================

/**
 * Generiert eine Upload-URL für den Client. Nur für angemeldete Nutzer,
 * damit der Storage nicht als offener, anonymer Datei-Host missbraucht wird.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Speichert File-Metadaten nach erfolgreichem Upload und hinterlegt den
 * Eigentümer (clerkId), damit URL-Abruf/Löschung/OCR autorisiert werden können.
 * Der frühere Client-`userId`-Parameter wird ignoriert (Identität aus ctx.auth).
 */
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    userId: v.optional(v.string()), // veraltet, wird ignoriert
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Vorhandenen Eigentümer-Eintrag aktualisieren oder neu anlegen.
    const existing = await ctx.db
      .query("fileUploads")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();
    if (!existing) {
      await ctx.db.insert("fileUploads", {
        storageId: args.storageId,
        userId: user.clerkId,
        fileName: args.fileName,
        fileType: args.fileType,
        fileSize: args.fileSize,
        createdAt: Date.now(),
      });
    }

    const url = await ctx.storage.getUrl(args.storageId);

    return {
      storageId: args.storageId,
      url,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
    };
  },
});

/** Prüft, ob der angemeldete Nutzer Eigentümer der Datei ist (oder Admin). */
async function assertFileOwner(
  ctx: Parameters<typeof requireUser>[0],
  storageId: import("./_generated/dataModel").Id<"_storage">,
) {
  const user = await requireUser(ctx);
  const record = await ctx.db
    .query("fileUploads")
    .withIndex("by_storage", (q) => q.eq("storageId", storageId))
    .first();
  if (!record) {
    throw new Error("Datei nicht gefunden.");
  }
  if (record.userId !== user.clerkId && user.role !== "admin") {
    throw new Error("Nicht autorisiert für diese Datei.");
  }
  return record;
}

/**
 * Holt die URL für eine gespeicherte Datei — nur für den Eigentümer/Admin.
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await assertFileOwner(ctx, args.storageId);
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Löscht eine Datei aus dem Storage — nur für den Eigentümer/Admin.
 */
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const record = await assertFileOwner(ctx, args.storageId);
    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(record._id);
    return { success: true };
  },
});

/**
 * Interner Eigentümer-Lookup für Actions (z. B. OCR), die kein ctx.db haben.
 * Nicht öffentlich aufrufbar.
 */
export const getFileOwner = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("fileUploads")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();
    return record ? { userId: record.userId, fileType: record.fileType, fileSize: record.fileSize } : null;
  },
});
