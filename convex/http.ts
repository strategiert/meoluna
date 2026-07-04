import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Erlaubte Ursprünge für die Tracking-Beacons (kein Wildcard-CORS mehr).
const ALLOWED_ORIGINS = new Set([
  "https://meoluna.com",
  "https://www.meoluna.com",
  "https://meoluna.de",
  "https://www.meoluna.de",
  "http://localhost:5173",
  "http://localhost:3000",
]);

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://meoluna.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

// String bereinigen: nur Strings, Länge begrenzen, sonst undefined.
function str(value: unknown, maxLen = 512): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : undefined;
}

// Maximale Größe der eingehenden JSON-Payload (Bytes).
const MAX_BODY_BYTES = 8 * 1024;

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// OPTIONS handler for CORS preflight
http.route({
  path: "/api/track/pageview",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }),
});

http.route({
  path: "/api/track/event",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }),
});

// POST /api/track/pageview - Track page views and session starts
http.route({
  path: "/api/track/pageview",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const cors = corsHeaders(request);
    try {
      const body = await readJson(request);
      if (!body) {
        return new Response(JSON.stringify({ success: false, error: "Invalid payload" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const sessionId = str(body.sessionId, 128);
      const anonymousId = str(body.anonymousId, 128);
      const landingPage = str(body.landingPage, 2048);
      if (!sessionId || !anonymousId || !landingPage) {
        return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const userAgent = request.headers.get("user-agent")?.slice(0, 512) || undefined;
      const acceptLanguage = request.headers.get("accept-language")?.slice(0, 128) || undefined;
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || undefined;

      await ctx.runMutation(api.analytics.serverSideCollector.collectClick, {
        sessionId,
        anonymousId,
        landingPage,
        referrer: str(body.referrer, 2048),
        fbclid: str(body.fbclid, 256),
        gclid: str(body.gclid, 256),
        ttclid: str(body.ttclid, 256),
        utm_source: str(body.utm_source, 256),
        utm_medium: str(body.utm_medium, 256),
        utm_campaign: str(body.utm_campaign, 256),
        utm_term: str(body.utm_term, 256),
        utm_content: str(body.utm_content, 256),
        userAgent,
        acceptLanguage,
        clientIp,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Pageview tracking error:", error);
      return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }),
});

// POST /api/track/event - Track custom events
http.route({
  path: "/api/track/event",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const cors = corsHeaders(request);
    try {
      const body = await readJson(request);
      if (!body) {
        return new Response(JSON.stringify({ success: false, error: "Invalid payload" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const sessionId = str(body.sessionId, 128);
      const eventType = str(body.eventType, 64);
      if (!sessionId || !eventType) {
        return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // eventData serialisiert und auf sichere Größe begrenzen.
      let eventData = "{}";
      try {
        const serialized = JSON.stringify(body.eventData ?? {});
        eventData = serialized.slice(0, 4096);
      } catch {
        eventData = "{}";
      }

      const platformRaw = str(body.platform, 32);
      const platform =
        platformRaw === "ios" || platformRaw === "android" ? platformRaw : "web";

      await ctx.runMutation(api.analytics.eventTracking.trackEvent, {
        canonicalUserId: str(body.canonicalUserId, 128),
        sessionId,
        eventType,
        eventData,
        platform,
        route: str(body.route, 2048),
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Event tracking error:", error);
      return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
