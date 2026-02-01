import { v } from "convex/values";
import { action } from "./_generated/server";

// ============================================================================
// PDF TEXT EXTRACTION ACTION
// ============================================================================

export const extractTextFromPDF = action({
  args: {
    pdfBase64: v.string(),
    fileName: v.string(),
  },
  handler: async (_ctx, args) => {
    const PADDLEOCR_URL = process.env.PADDLEOCR_URL;

    if (!PADDLEOCR_URL) {
      throw new Error(
        "PADDLEOCR_URL nicht konfiguriert. Bitte im Convex Dashboard unter Environment Variables setzen."
      );
    }

    // Call PaddleOCR service
    const response = await fetch(`${PADDLEOCR_URL}/extract-base64`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pdf: args.pdfBase64,
      }),
    });

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
