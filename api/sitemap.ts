/**
 * api/sitemap.ts — Vercel Serverless Function
 *
 * Dynamische sitemap.xml: statische oeffentliche Seiten + oeffentliche Welten
 * (isPublic) + veroeffentlichte Blogposts. Wird via vercel.json-Rewrite unter
 * /sitemap.xml ausgeliefert.
 *
 * Ruft Convex bewusst per nacktem fetch gegen die HTTP-Query-API auf (KEIN
 * ConvexHttpClient / generierter api-Import) - dieser Bundling-Pfad crasht in
 * der Vercel-Function-Runtime (FUNCTION_INVOCATION_FAILED). Faellt bei jedem
 * Fehler auf die statischen Seiten zurueck, damit die Sitemap nie 500t.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE = 'https://meoluna.com';
const CONVEX_URL = (
  process.env.CONVEX_URL ??
  process.env.VITE_CONVEX_URL ??
  'https://helpful-blackbird-68.convex.cloud'
).replace(/\/$/, '');

const STATIC_PATHS = ['/', '/explore', '/blog', '/about', '/contact', '/privacy', '/imprint', '/terms'];

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T | null> {
  try {
    const r = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args, format: 'json' }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { status?: string; value?: T };
    return data.status === 'success' ? (data.value ?? null) : null;
  } catch {
    return null;
  }
}

function urlEntry(loc: string, lastmod?: number): string {
  const lm = lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${lm}\n  </url>`;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const entries: string[] = STATIC_PATHS.map((p) => urlEntry(SITE + p));

  // Welten (/w/:id) werden BEWUSST NICHT indexiert - das sind interaktive
  // App-Inhalte, keine SEO-Landingpages. Nur Blogposts + statische Seiten.
  const posts = (await convexQuery<Array<{ slug: string; updatedAt?: number; publishedAt?: number }>>('blog:listPublished', { limit: 500 })) ?? [];
  for (const p of posts) entries.push(urlEntry(`${SITE}/blog/${p.slug}`, p.updatedAt ?? p.publishedAt));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
