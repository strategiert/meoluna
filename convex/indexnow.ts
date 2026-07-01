"use node";

// ============================================================================
// IndexNow - meldet neue/geaenderte URLs sofort an Bing (und andere IndexNow-
// Suchmaschinen), statt auf den naechsten Crawl zu warten.
// Key liegt oeffentlich unter https://meoluna.com/<key>.txt (public/).
// Wird vom Scheduler gefeuert, wenn eine Welt oeffentlich wird oder ein
// Blogpost veroeffentlicht wird.
// ============================================================================

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const SITE_HOST = "meoluna.com";
// Fallback = der committete Key in public/<key>.txt. Ueberschreibbar per Env.
const KEY = process.env.INDEXNOW_KEY ?? "031ffd58553158d766845bc2e78a9ba7";
const ENDPOINT = "https://api.indexnow.org/indexnow";

export const pingUrls = internalAction({
  args: { urls: v.array(v.string()) },
  handler: async (_ctx, args) => {
    const urlList = args.urls.filter((u) => u.startsWith(`https://${SITE_HOST}/`));
    if (urlList.length === 0) return { submitted: 0 };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: SITE_HOST,
          key: KEY,
          keyLocation: `https://${SITE_HOST}/${KEY}.txt`,
          urlList,
        }),
      });
      // 200 = ok, 202 = angenommen (wird verarbeitet). Beides Erfolg.
      if (res.status !== 200 && res.status !== 202) {
        console.warn(`[indexnow] unexpected status ${res.status}: ${await res.text()}`);
      }
      return { submitted: urlList.length, status: res.status };
    } catch (e) {
      console.warn(`[indexnow] ping failed: ${e instanceof Error ? e.message : String(e)}`);
      return { submitted: 0, error: true };
    }
  },
});
