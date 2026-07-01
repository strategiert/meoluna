/**
 * api/sitemap.ts — Vercel Serverless Function
 *
 * Dynamische sitemap.xml: statische oeffentliche Seiten + oeffentliche Welten
 * (isPublic) + veroeffentlichte Blogposts. Wird via vercel.json-Rewrite unter
 * /sitemap.xml ausgeliefert. Faellt bei Convex-Fehler auf die statischen Seiten
 * zurueck, damit die Sitemap nie 500t.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const SITE = 'https://meoluna.com';
const CONVEX_URL =
  process.env.CONVEX_URL ??
  process.env.VITE_CONVEX_URL ??
  'https://helpful-blackbird-68.convex.cloud';

// Statische, indexierbare Routen (keine privaten/Account-Bereiche).
const STATIC_PATHS = ['/', '/explore', '/blog', '/about', '/contact', '/privacy', '/imprint', '/terms'];

function urlEntry(loc: string, lastmod?: number): string {
  const lm = lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${lm}\n  </url>`;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const entries: string[] = STATIC_PATHS.map((p) => urlEntry(SITE + p));

  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    const [worlds, posts] = await Promise.all([
      client.query(api.worlds.listPublic, {}).catch(() => []),
      client.query(api.blog.listPublished, { limit: 500 }).catch(() => []),
    ]);
    for (const w of worlds as Array<{ _id: string; updatedAt?: number; _creationTime: number }>) {
      entries.push(urlEntry(`${SITE}/w/${w._id}`, w.updatedAt ?? w._creationTime));
    }
    for (const p of posts as Array<{ slug: string; updatedAt?: number; publishedAt?: number }>) {
      entries.push(urlEntry(`${SITE}/blog/${p.slug}`, p.updatedAt ?? p.publishedAt));
    }
  } catch {
    // Convex nicht erreichbar -> nur statische Seiten ausliefern.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
