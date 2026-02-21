/**
 * api/speak.ts — Vercel Serverless Function
 *
 * TTS-Proxy für Meoluna Voice Mode.
 * Versucht ElevenLabs, fällt auf OpenAI TTS zurück.
 * Keys werden server-seitig gelesen — kein Leak in den Browser.
 *
 * POST /api/speak
 * Body: { text: string }
 * Response: audio/mpeg
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ELEVENLABS_KEY  = process.env.ELEVENLABS_API_KEY;
const OPENAI_KEY      = process.env.OPENAI_API_KEY;
const VOICE_ID        = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB'; // Adam multilingual

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

  // ── ElevenLabs ────────────────────────────────────────────────────────────
  if (ELEVENLABS_KEY) {
    try {
      const r = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: safeText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.45, similarity_boost: 0.80 },
          }),
        }
      );

      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(buf);
      }

      console.warn('[speak] ElevenLabs error', r.status, await r.text().catch(() => ''));
    } catch (e) {
      console.warn('[speak] ElevenLabs exception:', (e as Error).message);
    }
  }

  // ── OpenAI TTS Fallback ───────────────────────────────────────────────────
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
