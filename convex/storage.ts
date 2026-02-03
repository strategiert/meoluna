import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// FILE STORAGE - Upload von Bildern und PDFs
// ============================================================================

/**
 * Generiert eine Upload-URL für den Client
 * Der Client kann dann direkt zu dieser URL hochladen
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Speichert File-Metadaten nach erfolgreichem Upload
 * Gibt die öffentliche URL zurück
 */
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // URL für die Datei generieren
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

/**
 * Holt die URL für eine gespeicherte Datei
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Löscht eine Datei aus dem Storage
 */
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});
