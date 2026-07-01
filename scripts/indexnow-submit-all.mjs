// Einmalige IndexNow-Erstmeldung: statische Seiten + oeffentliche Welten +
// veroeffentlichte Blogposts an Bing/IndexNow melden. Danach uebernimmt die
// automatische Meldung (convex/indexnow.ts) neue/geaenderte URLs.
//
//   node --import tsx/esm scripts/indexnow-submit-all.mjs
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const SITE = "https://meoluna.com";
const HOST = "meoluna.com";
const KEY = process.env.INDEXNOW_KEY ?? "031ffd58553158d766845bc2e78a9ba7";
const CONVEX_URL = process.env.CONVEX_URL ?? "https://helpful-blackbird-68.convex.cloud";

const STATIC = ["/", "/explore", "/blog", "/about", "/contact", "/privacy", "/imprint", "/terms"];

const client = new ConvexHttpClient(CONVEX_URL);

const [worlds, posts] = await Promise.all([
  client.query(api.worlds.listPublic, {}).catch(() => []),
  client.query(api.blog.listPublished, { limit: 500 }).catch(() => []),
]);

const urlList = [
  ...STATIC.map((p) => SITE + p),
  ...worlds.map((w) => `${SITE}/w/${w._id}`),
  ...posts.map((p) => `${SITE}/blog/${p.slug}`),
];

console.log(`Melde ${urlList.length} URLs an IndexNow (${STATIC.length} statisch, ${worlds.length} Welten, ${posts.length} Blog)...`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});

console.log(`IndexNow-Antwort: ${res.status} ${res.statusText}`);
if (res.status === 200 || res.status === 202) console.log("OK - URLs angenommen.");
else console.log("Body:", await res.text());
