import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireIdentity } from "./lib/auth";

// Max. erlaubte PDF-Größe (Bytes). Schützt OCR-Service vor Missbrauch/DoS.
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB

// Dateiname bereinigen (keine Pfade/Steuerzeichen, begrenzte Länge).
function sanitizeFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  const base = name.replace(/[\\/]/g, "_").replace(/[\x00-\x1f]/g, "").trim();
  return (base || "upload.pdf").slice(0, 200);
}

// Header für den (privaten) OCR-Service. Server-zu-Server-Key verhindert,
// dass der Railway-Dienst als offener Endpunkt genutzt wird.
function ocrHeaders(base: Record<string, string> = {}): Record<string, string> {
  const key = process.env.PADDLEOCR_API_KEY;
  return key ? { ...base, "X-API-Key": key } : base;
}

// ============================================================================
// PDF TEXT EXTRACTION ACTION
// ============================================================================

export const extractTextFromPDF = action({
  args: {
    pdfBase64: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    // Nur angemeldete Nutzer dürfen OCR auslösen (Kosten-/Missbrauchsschutz,
    // und Arbeitsblätter enthalten häufig Kinder-Daten).
    const identity = await requireIdentity(ctx);

    const PADDLEOCR_URL = process.env.PADDLEOCR_URL;
    if (!PADDLEOCR_URL) {
      throw new Error(
        "PADDLEOCR_URL nicht konfiguriert. Bitte im Convex Dashboard unter Environment Variables setzen."
      );
    }

    if (!args.pdfBase64 && !args.storageId) {
      throw new Error("pdfBase64 oder storageId ist erforderlich");
    }

    const fileName = sanitizeFileName(args.fileName);
    let response: Response;

    if (args.storageId) {
      // Eigentum prüfen: nur eigene hochgeladene Dateien dürfen verarbeitet werden.
      const owner = await ctx.runQuery(internal.storage.getFileOwner, {
        storageId: args.storageId,
      });
      if (!owner || owner.userId !== identity.subject) {
        throw new Error("Nicht autorisiert für diese Datei.");
      }
      if (owner.fileSize && owner.fileSize > MAX_PDF_BYTES) {
        throw new Error("Datei ist zu groß.");
      }

      const storedFile = await ctx.storage.get(args.storageId);
      if (!storedFile) {
        throw new Error("Datei wurde im Convex Storage nicht gefunden.");
      }

      const fileBytes = await storedFile.arrayBuffer();
      if (fileBytes.byteLength > MAX_PDF_BYTES) {
        throw new Error("Datei ist zu groß.");
      }

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([fileBytes], { type: "application/pdf" }),
        fileName,
      );

      response = await fetch(`${PADDLEOCR_URL}/extract-pdf`, {
        method: "POST",
        headers: ocrHeaders(),
        body: formData,
      });
    } else {
      // Base64-Pfad: grobe Größenprüfung (base64 ≈ 4/3 der Rohbytes).
      const approxBytes = Math.floor((args.pdfBase64!.length * 3) / 4);
      if (approxBytes > MAX_PDF_BYTES) {
        throw new Error("Datei ist zu groß.");
      }

      response = await fetch(`${PADDLEOCR_URL}/extract-base64`, {
        method: "POST",
        headers: ocrHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          pdf: args.pdfBase64,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR service error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("OCR extraction failed");
    }

    return {
      text: result.markdown,
      pages: result.pages,
      fileName,
    };
  },
});

// ============================================================================
// HEALTH CHECK FOR OCR SERVICE
// ============================================================================

export const checkOCRService = action({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);

    const PADDLEOCR_URL = process.env.PADDLEOCR_URL;

    if (!PADDLEOCR_URL) {
      return {
        available: false,
        error: "PADDLEOCR_URL nicht konfiguriert",
      };
    }

    try {
      const response = await fetch(`${PADDLEOCR_URL}/health`, {
        method: "GET",
        headers: ocrHeaders(),
      });

      if (!response.ok) {
        return { available: false, error: `Status: ${response.status}` };
      }

      const data = await response.json();
      return {
        available: data.status === "ok",
        language: data.language,
        url: PADDLEOCR_URL,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },
});
