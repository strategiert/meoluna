import { v } from "convex/values";
import { action } from "./_generated/server";

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
    const PADDLEOCR_URL = process.env.PADDLEOCR_URL;

    if (!PADDLEOCR_URL) {
      throw new Error(
        "PADDLEOCR_URL nicht konfiguriert. Bitte im Convex Dashboard unter Environment Variables setzen."
      );
    }

    if (!args.pdfBase64 && !args.storageId) {
      throw new Error("pdfBase64 oder storageId ist erforderlich");
    }

    let response: Response;

    if (args.storageId) {
      const storedFile = await ctx.storage.get(args.storageId);
      if (!storedFile) {
        throw new Error("Datei wurde im Convex Storage nicht gefunden.");
      }

      const fileBytes = await storedFile.arrayBuffer();
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([fileBytes], { type: "application/pdf" }),
        args.fileName,
      );

      response = await fetch(`${PADDLEOCR_URL}/extract-pdf`, {
        method: "POST",
        body: formData,
      });
    } else {
      response = await fetch(`${PADDLEOCR_URL}/extract-base64`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      fileName: args.fileName,
    };
  },
});

// ============================================================================
// HEALTH CHECK FOR OCR SERVICE
// ============================================================================

export const checkOCRService = action({
  args: {},
  handler: async () => {
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
