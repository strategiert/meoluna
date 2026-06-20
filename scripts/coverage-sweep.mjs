// Faecher-Abdeckungs-Sweep: generiert echte Welten zu fachbreiten, natuerlich
// formulierten Lehrer-Prompts (KEINE Engine-Keyword-Tricks) und klassifiziert,
// welche Engine lief bzw. ob die Focused-Mini-App als Fallback einsprang.
// Ergebnis: Gap-Report, wo eigene Engines fehlen und der Fallback traegt.
//
//   node --import tsx/esm scripts/coverage-sweep.mjs
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://helpful-blackbird-68.convex.cloud";
const USER_ID = "user_3944Fgq6C1f01YA6dz2vFMo8Onl"; // klausarentde@gmail.com
const POLL_MS = 5000;
const TIMEOUT_MS = 7 * 60 * 1000;

// Distinktiver Marker je Engine -> Routing-Erkennung im generierten Code.
const ENGINE_MARKERS = [
  ["counting", "Aus dem Zaehlen wird"],
  ["pattern", "Das Muster lautet"],
  ["clock", "AnalogClock"],
  ["money", "MoneyRoomScene"],
  ["map", "MapGrid"],
  ["movement", "Aus der Bewegung wird"],
  ["mixing", "Aus dem Rezept wird"],
  ["mixing", "Aus der Waage wird"],
  ["building", "Aus dem Bauen wird"],
  ["time", "Aus der Reihenfolge wird"],
  ["detective", "Aus den Beweisen wird"],
  ["sort", "Aus dem Sortieren wird"],
  ["word", "Aus den Bausteinen wird"],
];

const PROMPTS = [
  { subj: "Bio", prompt: "Wie funktioniert die Fotosynthese bei Pflanzen? Klasse 7" },
  { subj: "Bio", prompt: "Der Wasserkreislauf in der Natur, Klasse 5" },
  { subj: "Chemie", prompt: "Die Aggregatzustaende fest, fluessig und gasfoermig, Klasse 6" },
  { subj: "Physik", prompt: "Wie entsteht ein einfacher Stromkreis? Klasse 8" },
  { subj: "Religion", prompt: "Die fuenf Weltreligionen im Ueberblick, Klasse 6" },
  { subj: "Ethik", prompt: "Was ist gerecht? Ueber Fairness und Teilen nachdenken, Klasse 5" },
  { subj: "Englisch", prompt: "Englische Vokabeln rund um die Familie lernen, Klasse 5" },
  { subj: "Franz.", prompt: "Franzoesische Zahlen von 1 bis 20 lernen, Klasse 6" },
  { subj: "Musik", prompt: "Notenwerte und Taktarten verstehen, Klasse 5" },
  { subj: "Geschichte", prompt: "Das alte Aegypten und die Pyramiden, Klasse 6" },
  { subj: "Erdkunde", prompt: "Die Kontinente und Ozeane der Erde, Klasse 5" },
  { subj: "Deutsch", prompt: "Die vier Faelle im Deutschen ueben, Klasse 4" },
  { subj: "Mathe", prompt: "Prozentrechnung im Alltag verstehen, Klasse 7" },
  { subj: "Mathe", prompt: "Das kleine Einmaleins ueben, Klasse 2" },
  { subj: "Sachk.", prompt: "Die Lebenszyklen von Schmetterling und Frosch, Klasse 3" },
];

const client = new ConvexHttpClient(CONVEX_URL);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function classify(code) {
  for (const [engine, marker] of ENGINE_MARKERS) {
    if (code.includes(marker)) return engine;
  }
  // Engine-Marker fehlen -> Focused-Mini-App-Fallback (freie LLM-Welt).
  return "focused";
}

async function fireOne(p, i) {
  const sessionId = `cov-${i}-${Date.now()}`;
  await client.mutation(api.pipeline.status.startGeneration, {
    prompt: p.prompt, userId: USER_ID, sessionId,
  });
  return { ...p, sessionId, startedAt: Date.now() };
}

async function pollOne(job) {
  while (Date.now() - job.startedAt < TIMEOUT_MS) {
    const s = await client.query(api.pipeline.status.getSession, { sessionId: job.sessionId });
    if (s && ["done", "complete", "completed"].includes(s.status) && s.worldId) {
      return { job, status: "ok", worldId: s.worldId, elapsedMs: Date.now() - job.startedAt };
    }
    if (s && ["error", "failed"].includes(s.status)) {
      return { job, status: "error", worldId: null, error: s.error ?? s.stepLabel };
    }
    await sleep(POLL_MS);
  }
  return { job, status: "timeout", worldId: null };
}

async function main() {
  console.log(`Feuere ${PROMPTS.length} Generierungen (Opus, fachbreit) ...`);
  const jobs = [];
  for (let i = 0; i < PROMPTS.length; i++) jobs.push(await fireOne(PROMPTS[i], i));

  console.log("Warte auf Fertigstellung ...\n");
  const results = await Promise.all(jobs.map(pollOne));

  const counts = {};
  const rows = [];
  for (const r of results) {
    let route = r.status === "ok" ? "?" : r.status.toUpperCase();
    let title = "", lines = 0, hasApi = false;
    if (r.worldId) {
      const w = await client.query(api.worlds.get, { id: r.worldId });
      const code = w?.code ?? "";
      route = classify(code);
      title = w?.title ?? "?";
      lines = code.split("\n").length;
      hasApi = code.includes("reportScore") && code.includes("Meoluna.complete");
    }
    counts[route] = (counts[route] ?? 0) + 1;
    const secs = r.elapsedMs ? `${Math.round(r.elapsedMs / 1000)}s` : "-";
    rows.push({ subj: r.job.subj, prompt: r.job.prompt, route, title, lines, hasApi, secs });
  }

  console.log("FACH        | ROUTE      | s    | API | TITEL");
  console.log("-".repeat(78));
  for (const x of rows) {
    const api_ = x.hasApi ? "ok " : "FEHLT";
    console.log(`${x.subj.padEnd(11)} | ${String(x.route).padEnd(10)} | ${x.secs.padStart(4)} | ${api_} | ${x.title}`);
  }
  console.log("-".repeat(78));
  console.log("Routing-Verteilung:", JSON.stringify(counts));
  const fails = rows.filter((x) => x.route === "ERROR" || x.route === "TIMEOUT" || !x.hasApi).length;
  console.log(fails === 0 ? "Alle Welten valide generiert." : `${fails} problematisch (Error/Timeout/API fehlt).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
