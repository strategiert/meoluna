/**
 * api/speak.ts — Vercel Serverless Function
 *
 * TTS-Proxy für Meoluna Voice Mode.
 * Primär: OpenAI TTS-1-HD, Voice "nova" (natürlich, gutes Deutsch).
 * Keys werden server-seitig gelesen — kein Leak in den Browser.
 *
 * POST /api/speak
 * Body: { text: string }
 * Response: audio/mpeg
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body as { text?: string };

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text required' });
  }

  // Maximal 500 Zeichen — Feedback-Texte sind kurz
  const safeText = text.trim().slice(0, 500);

  // ── OpenAI TTS (Nova) ─────────────────────────────────────────────────────
  if (OPENAI_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: 'nova',   // Natürlichste Stimme, gutes Deutsch
          input: safeText,
          speed: 1.0,
        }),
      });

      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(buf);
      }

      console.error('[speak] OpenAI TTS error', r.status, await r.text().catch(() => ''));
    } catch (e) {
      console.error('[speak] OpenAI TTS exception:', (e as Error).message);
    }
  }

  // Beide fehlgeschlagen
  return res.status(503).json({ error: 'Kein TTS-Provider verfügbar' });
}
