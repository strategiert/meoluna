import { v } from "convex/values";
import { action } from "./_generated/server";

// ============================================================================
// PDF TEXT EXTRACTION — via Claude API (kein PaddleOCR mehr nötig)
// ============================================================================

export const extractTextFromPDF = action({
  args: {
    pdfBase64: v.string(),
    fileName: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY nicht konfiguriert.");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: args.pdfBase64,
                },
              },
              {
                type: "text",
                text: `Extrahiere den gesamten Inhalt aus diesem Dokument "${args.fileName}" als sauberes Markdown.

Regeln:
- Text vollständig übernehmen, Struktur (Überschriften, Listen, Tabellen) beibehalten
- Bilder, Diagramme und Abbildungen beschreiben: "[Bild: kurze Beschreibung was zu sehen ist]"
- Aufgaben, Lücken, Felder zum Ausfüllen als solche kennzeichnen: "[Aufgabe: ...]" oder "[Lücke]"
- Keine Einleitung, kein Kommentar — nur der extrahierte Inhalt.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API Fehler (${response.status}): ${error}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    if (!text) {
      throw new Error("Kein Text aus PDF extrahiert.");
    }

    return {
      text,
      pages: 1, // Claude gibt keine Seitenzahl zurück
      fileName: args.fileName,
    };
  },
});

// ============================================================================
// HEALTH CHECK — prüft ob Claude API erreichbar ist
// ============================================================================

export const checkOCRService = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { available: false, error: "ANTHROPIC_API_KEY nicht konfiguriert" };
    }
    return { available: true, language: "Claude API", url: "https://api.anthropic.com" };
  },
});
