import { Inngest } from "inngest";
import { serve } from "inngest/next";

// Create the Inngest client. Der Event-Key wird aus der Umgebung gelesen,
// damit nur autorisierte Sender Events auslösen können.
const inngest = new Inngest({
  id: "meoluna",
  name: "Meoluna",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Background job for world generation
const generateWorldBackground = inngest.createFunction(
  {
    id: "generate-world",
    name: "Generate Learning World",
    retries: 2,
  },
  { event: "world/generate.requested" },
  async ({ event, step }) => {
    const { prompt, gradeLevel, subject, style } = event.data;

    const worldCode = await step.run("generate-code", async () => {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 64000,
          messages: [
            {
              role: "user",
              content: `Erstelle eine Lernwelt zu: "${prompt}"${gradeLevel ? `\nKlassenstufe: ${gradeLevel}` : ""}${subject ? `\nFach: ${subject}` : ""}${style ? `\nStil: ${style}` : ""}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API Error: ${response.status}`);
      }

      const data = await response.json();
      let code = data.content[0]?.text || "";

      code = code
        .replace(/^```(?:jsx|tsx|javascript|typescript|react)?\n?/gm, "")
        .replace(/```$/gm, "")
        .trim();

      return code;
    });

    return { success: true, code: worldCode };
  }
);

// Health check
const healthCheck = inngest.createFunction(
  { id: "health-check", name: "Health Check" },
  { event: "system/health.check" },
  async () => ({ status: "ok", timestamp: new Date().toISOString() })
);

// Fail-closed: In Produktion MUSS INNGEST_SIGNING_KEY gesetzt sein, sonst
// würden eingehende Aufrufe unverifiziert akzeptiert (unautorisiertes
// Auslösen bezahlter Generierung). Lieber Endpoint tot als offen.
if (process.env.NODE_ENV === "production" && !process.env.INNGEST_SIGNING_KEY) {
  throw new Error(
    "[inngest] INNGEST_SIGNING_KEY ist in Produktion nicht gesetzt — Endpoint verweigert den Start.",
  );
}

// Export handler. Der Signing-Key verifiziert, dass Aufrufe wirklich von
// Inngest stammen (verhindert unautorisiertes Auslösen bezahlter Generierung).
export default serve({
  client: inngest,
  functions: [generateWorldBackground, healthCheck],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
