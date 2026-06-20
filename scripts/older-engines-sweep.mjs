// Live-Sweep der 7 aelteren Engines mit echtem Opus: pro Engine ein typischer
// Prompt durch die prod-Pipeline, dann Routing+Validitaet via Code-Marker
// pruefen (lief die ERWARTETE Engine, nicht Fallback?).
//
//   node --import tsx/esm scripts/older-engines-sweep.mjs
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://helpful-blackbird-68.convex.cloud";
const USER_ID = "user_3944Fgq6C1f01YA6dz2vFMo8Onl";
const POLL_MS = 5000;
const TIMEOUT_MS = 9 * 60 * 1000;

// engine -> distinktiver Code-Marker (zur Routing-Erkennung).
const MARKER = {
  "movement-space": "Aus der Bewegung wird",
  "mixing-balance": "Aus dem Rezept wird",
  "mixing-balance-2": "Aus der Waage wird",
  "building-construct": "Aus dem Bauen wird",
  "time-sequence": "Aus der Reihenfolge wird",
  "detective-evidence": "Aus den Beweisen wird",
  "sort-match": "Aus dem Sortieren wird",
  "word-builder": "Aus den Bausteinen wird",
};

const CASES = [
  { engine: "movement-space", prompt: "Negative Zahlen auf dem Zahlenstrahl, plus und minus rechnen, Klasse 6", markers: ["Aus der Bewegung wird"] },
  { engine: "mixing-balance", prompt: "Brueche und Anteile verstehen und vergleichen, Klasse 6", markers: ["Aus dem Rezept wird", "Aus der Waage wird"] },
  { engine: "building-construct", prompt: "Flaecheninhalt und Umfang von Rechtecken berechnen, Klasse 5", markers: ["Aus dem Bauen wird"] },
  { engine: "time-sequence", prompt: "Ereignisse in die richtige Reihenfolge bringen, Ablauf einer Geschichte, Klasse 3", markers: ["Aus der Reihenfolge wird"] },
  { engine: "detective-evidence", prompt: "Leseverstehen: Wer war es? Indizien im Text finden, Klasse 5", markers: ["Aus den Beweisen wird"] },
  { engine: "sort-match", prompt: "Englische Vokabeln nach Kategorien sortieren, Klasse 5", markers: ["Aus dem Sortieren wird"] },
  { engine: "word-builder", prompt: "Woerter richtig schreiben lernen, Rechtschreibung Klasse 2", markers: ["Aus den Bausteinen wird"] },
];

const client = new ConvexHttpClient(CONVEX_URL);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function detect(code) {
  for (const [name, marker] of Object.entries(MARKER)) {
    if (code.includes(marker)) return name.replace("-2", "");
  }
  return "focused/other";
}

async function fireOne(c) {
  const sessionId = `older-${c.engine}-${Date.now()}`;
  await client.mutation(api.pipeline.status.startGeneration, { prompt: c.prompt, userId: USER_ID, sessionId });
  return { ...c, sessionId, startedAt: Date.now() };
}

async function pollOne(job) {
  while (Date.now() - job.startedAt < TIMEOUT_MS) {
    const s = await client.query(api.pipeline.status.getSession, { sessionId: job.sessionId });
    if (s && ["done", "complete", "completed"].includes(s.status) && s.worldId) {
      return { job, status: "ok", worldId: s.worldId, elapsedMs: Date.now() - job.startedAt };
    }
    if (s && ["error", "failed"].includes(s.status)) return { job, status: "error", worldId: null, error: s.error ?? s.stepLabel };
    await sleep(POLL_MS);
  }
  return { job, status: "timeout", worldId: null };
}

async function main() {
  console.log(`Feuere ${CASES.length} Generierungen (aeltere Engines, echtes Opus) ...`);
  const jobs = [];
  for (const c of CASES) jobs.push(await fireOne(c));
  console.log("Warte auf Fertigstellung ...\n");
  const results = await Promise.all(jobs.map(pollOne));

  let failed = 0;
  for (const r of results) {
    const tag = r.job.engine.padEnd(19);
    if (!r.worldId) { failed += 1; console.log(`FAIL ${tag} status=${r.status} ${r.error ?? ""}`); continue; }
    const world = await client.query(api.worlds.get, { id: r.worldId });
    const code = world?.code ?? "";
    const got = detect(code);
    const ok = r.job.markers.some((m) => code.includes(m));
    const secs = r.elapsedMs ? `${Math.round(r.elapsedMs / 1000)}s` : "-";
    if (ok) console.log(`PASS ${tag} ${secs.padStart(5)} -> ${got.padEnd(18)} "${world?.title}"`);
    else { failed += 1; console.log(`FAIL ${tag} ${secs.padStart(5)} -> got "${got}" (expected ${r.job.engine}) "${world?.title}"`); }
  }
  console.log(`\n${failed === 0 ? "ALLE 7 ALTEN ENGINES OK" : failed + " problematisch"}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
