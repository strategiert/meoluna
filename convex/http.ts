import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// CORS headers for tracking endpoints
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS handler for CORS preflight
http.route({
  path: "/api/track/pageview",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/track/event",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// POST /api/track/pageview - Track page views and session starts
http.route({
  path: "/api/track/pageview",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const {
        sessionId,
        anonymousId,
        landingPage,
        referrer,
        fbclid,
        gclid,
        ttclid,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
      } = body;

      // Extract headers for server-side data
      const userAgent = request.headers.get("user-agent") || undefined;
      const acceptLanguage = request.headers.get("accept-language") || undefined;
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || undefined;

      // Call the collector mutation
      await ctx.runMutation(api.analytics.serverSideCollector.collectClick, {
        sessionId,
        anonymousId,
        landingPage,
        referrer,
        fbclid,
        gclid,
        ttclid,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        userAgent,
        acceptLanguage,
        clientIp,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Pageview tracking error:", error);
      return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// POST /api/track/event - Track custom events
http.route({
  path: "/api/track/event",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const {
        canonicalUserId,
        sessionId,
        eventType,
        eventData,
        platform,
        route,
      } = body;

      await ctx.runMutation(api.analytics.eventTracking.trackEvent, {
        canonicalUserId,
        sessionId,
        eventType,
        eventData: JSON.stringify(eventData || {}),
        platform: platform || "web",
        route,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Event tracking error:", error);
      return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
