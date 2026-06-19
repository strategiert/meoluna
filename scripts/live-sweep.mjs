// Live-Sweep: generiert pro neuer Engine eine echte Welt mit echtem Opus ueber
// die prod-Pipeline (startGeneration -> Scheduler), pollt bis fertig und prueft
// im generierten Code die Engine-Marker (bestaetigt: richtige Engine lief, kein
// Focused-Fallback). Laeuft auf Klaus' Standard-Account.
//
//   node --import tsx/esm scripts/live-sweep.mjs
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://helpful-blackbird-68.convex.cloud";
const USER_ID = "user_3944Fgq6C1f01YA6dz2vFMo8Onl"; // klausarentde@gmail.com
const POLL_MS = 5000;
const TIMEOUT_MS = 6 * 60 * 1000;

const CASES = [
  { engine: "counting", prompt: "Zaehlen bis 20 und Mengen vergleichen fuer die Vorschule", subject: "mathematik", gradeLevel: "1", markers: ["ObjectField", "numberChoices", "Aus dem Zaehlen wird"] },
  { engine: "pattern", prompt: "Muster erkennen und fortsetzen, ABAB-Reihen, Klasse 1", subject: "mathematik", gradeLevel: "1", markers: ["PatternRoom", "Das Muster lautet", "gapIndex"] },
  { engine: "clock", prompt: "Die analoge Uhr lesen und die Zeiger stellen, Klasse 2", subject: "mathematik", gradeLevel: "2", markers: ["AnalogClock", "Die Uhr zeigt", "hourHand"] },
  { engine: "money", prompt: "Mit Euro und Cent genau bezahlen und Rueckgeld geben, Klasse 2", subject: "mathematik", gradeLevel: "2", markers: ["MoneyRoomScene", "Das macht zusammen", "addCoin"] },
  { engine: "map", prompt: "Himmelsrichtungen und eine Schatzkarte lesen mit Kompass, Klasse 3", subject: "sachunterricht", gradeLevel: "3", markers: ["MapRoomScene", "MapGrid", "pickCell", "Kompass"] },
];

const client = new ConvexHttpClient(CONVEX_URL);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fireOne(c) {
  const sessionId = `sweep-${c.engine}-${Date.now()}`;
  await client.mutation(api.pipeline.status.startGeneration, {
    prompt: c.prompt,
    subject: c.subject,
    gradeLevel: c.gradeLevel,
    userId: USER_ID,
    sessionId,
  });
  return { ...c, sessionId, startedAt: Date.now() };
}

async function pollOne(job) {
  while (Date.now() - job.startedAt < TIMEOUT_MS) {
    const s = await client.query(api.pipeline.status.getSession, { sessionId: job.sessionId });
    if (s && (s.status === "done" || s.status === "complete" || s.status === "completed") && s.worldId) {
      return { job, status: s.status, worldId: s.worldId };
    }
    if (s && (s.status === "error" || s.status === "failed")) {
      return { job, status: s.status, worldId: s.worldId ?? null, error: s.error ?? s.stepLabel };
    }
    await sleep(POLL_MS);
  }
  return { job, status: "timeout", worldId: null };
}

async function main() {
  console.log("Feuere 5 Generierungen ...");
  const jobs = [];
  for (const c of CASES) { jobs.push(await fireOne(c)); console.log(`  -> ${c.engine}: ${jobs.at(-1).sessionId}`); }

  console.log("\nWarte auf Fertigstellung (echtes Opus, ~100s/Welt) ...\n");
  const results = await Promise.all(jobs.map(pollOne));

  let failed = 0;
  for (const r of results) {
    const tag = r.job.engine.padEnd(9);
    if (!r.worldId) { failed += 1; console.log(`FAIL ${tag} status=${r.status} ${r.error ?? ""}`); continue; }
    const world = await client.query(api.worlds.get, { id: r.worldId });
    const code = world?.code ?? "";
    const missing = r.job.markers.filter((m) => !code.includes(m));
    if (missing.length > 0) {
      failed += 1;
      console.log(`FAIL ${tag} status=${r.status} worldId=${r.worldId} title="${world?.title ?? "?"}" -> Marker fehlen: ${missing.join(", ")} (FALLBACK statt Engine?)`);
    } else {
      console.log(`PASS ${tag} status=${r.status} worldId=${r.worldId} title="${world?.title ?? "?"}" (${code.split("\n").length} Zeilen Code)`);
    }
  }

  console.log(`\n${failed === 0 ? "ALLE 5 ENGINES LIVE BESTAETIGT" : failed + " Engine(s) fehlerhaft"}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
