import { Inngest } from "inngest";
import { serve } from "inngest/vercel";

// Create the Inngest client
const inngest = new Inngest({
  id: "meoluna",
  name: "Meoluna",
});

// Background job for world generation (can be triggered later)
const generateWorldBackground = inngest.createFunction(
  {
    id: "generate-world",
    name: "Generate Learning World",
    retries: 2,
  },
  { event: "world/generate.requested" },
  async ({ event, step }) => {
    const { prompt, gradeLevel, subject, style } = event.data;

    // Generate the world code via Claude API
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

      // Clean up markdown code blocks
      code = code
        .replace(/^```(?:jsx|tsx|javascript|typescript|react)?\n?/gm, "")
        .replace(/```$/gm, "")
        .trim();

      return code;
    });

    return {
      success: true,
      code: worldCode,
    };
  }
);

// Health check function
const healthCheck = inngest.createFunction(
  { id: "health-check", name: "Health Check" },
  { event: "system/health.check" },
  async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
);

// Serve the Inngest API
export default serve({
  client: inngest,
  functions: [generateWorldBackground, healthCheck],
});

// Required for Vercel Serverless
export const config = {
  maxDuration: 300,
};
