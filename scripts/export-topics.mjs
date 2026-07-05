// Export: Convex-Curriculum -> Web-Repo (statische SEO-Landingpages).
// Siehe docs/seo-pages-spec.md Abschnitt 1.
//
// Liest ALLE aktiven Topics + Subjects über curriculum:getAllTopicsForExport,
// filtert Test-Topics, bestimmt die Engine je Topic per Keyword-Router
// (gleicher Code-Pfad wie die App: convex/pipeline/engines/engineRegistry.ts)
// und schreibt zwei JSON-Dateien ins Web-Repo.

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WEB_ROOT = join(ROOT, "..", "meoluna-web");
const CONVEX_URL = "https://helpful-blackbird-68.convex.cloud";

const OUT_TOPICS = join(WEB_ROOT, "src", "data", "topics.json");
const OUT_ENGINES = join(WEB_ROOT, "src", "data", "topic-engines.json");

// Legacy-Seed (63 kuratierte Topics): eingefroren aus dem Web-Repo-Git-HEAD
// (`git show HEAD:src/data/topics.json` / `topic-engines.json`), zum
// Zeitpunkt bevor dieser Export die Datei überschrieben hat. Zweck:
// URL-Stabilität der 63 bereits live/indexierten Seiten unter
// meoluna.com/lernwelten/... — Prod-Convex enthält diesen Seed NICHT mehr
// (andere Slugs, z. B. natuerliche-zahlen-bis-20-k1 statt zahlen-bis-20),
// darum werden die alten Slugs hier separat gepflegt und VOR die
// Convex-Topics gemerged. Engine-Werte werden ebenfalls aus dem alten
// topic-engines.json übernommen (nicht neu geraten), da die Live-
// Spielproben-Screenshots an diesen Werten hängen.
const LEGACY_TOPICS = JSON.parse(readFileSync(join(__dirname, "topics-legacy.json"), "utf8"));
const LEGACY_ENGINES = JSON.parse(readFileSync(join(__dirname, "topics-legacy-engines.json"), "utf8"));

async function loadEngineRegistry() {
  const registry = await import(
    pathToFileURL(join(ROOT, "convex", "pipeline", "engines", "engineRegistry.ts")).href
  );
  return { pickEngineByKeywords: registry.pickEngineByKeywords, ENGINE_NAMES: registry.ENGINE_NAMES };
}

function isTestTopic(topic) {
  if (topic.name.includes("Test Topic")) return true;
  if (topic.keywords.length === 1 && topic.keywords[0] === "test") return true;
  return false;
}

// Deterministischer 32-Bit-Hash (djb2) für den Engine-Fallback, wenn der
// Keyword-Router kein Ergebnis liefert (z. B. Religion/Ethik, Politik,
// Kunst, Musik, Geschichte, Biologie, Physik, Chemie, Geografie,
// Informatik — Fächer ohne dedizierte Engine). Die echte App entscheidet
// für diese Themen zur Laufzeit per LLM-Gameplay-Router (nicht
// deterministisch); der Export braucht aber einen stabilen Wert, damit
// die Web-Seite eine feste Spielprobe (Screenshot) zeigen kann. Das ist
// eine Abweichung/Ergänzung zur Spec, die keinen Fallback definiert.
function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

async function main() {
  const { pickEngineByKeywords, ENGINE_NAMES } = await loadEngineRegistry();

  const client = new ConvexHttpClient(CONVEX_URL);
  const { topics, subjects } = await client.query(api.curriculum.getAllTopicsForExport, {});

  const subjectSlugById = new Map(subjects.map((s) => [s._id, s.slug]));

  const outTopics = [];
  const outEngines = {};
  const engineCounts = {};
  let skippedTest = 0;
  let skippedNoSubject = 0;
  let fallbackCount = 0;
  let collisionCount = 0;

  const seenKeys = new Set();

  // Legacy zuerst: gewinnt bei Kollision mit Convex-Topics.
  for (const t of LEGACY_TOPICS) {
    const key = `${t.subjectSlug}/${t.slug}`;
    seenKeys.add(key);
    const engine = LEGACY_ENGINES[key];
    if (engine) engineCounts[engine] = (engineCounts[engine] || 0) + 1;
    outTopics.push({ ...t, legacy: true });
    if (engine) outEngines[key] = engine;
  }

  for (const t of topics) {
    if (isTestTopic(t)) {
      skippedTest++;
      continue;
    }
    const subjectSlug = subjectSlugById.get(t.subjectId);
    if (!subjectSlug) {
      skippedNoSubject++;
      continue;
    }

    const key = `${subjectSlug}/${t.slug}`;
    if (seenKeys.has(key)) {
      collisionCount++;
      console.warn(`WARN Kollision (Legacy gewinnt): ${key} — Convex-Topic "${t.name}" übersprungen`);
      continue;
    }
    seenKeys.add(key);

    let engine = pickEngineByKeywords({ prompt: `${t.name} ${t.keywords.join(", ")}` });
    if (!engine) {
      fallbackCount++;
      engine = ENGINE_NAMES[djb2(`${subjectSlug}/${t.slug}`) % ENGINE_NAMES.length];
    }
    engineCounts[engine] = (engineCounts[engine] || 0) + 1;

    outTopics.push({
      subjectSlug,
      name: t.name,
      slug: t.slug,
      gradeLevel: t.gradeLevel,
      bundesland: t.bundesland,
      keywords: t.keywords,
    });
    outEngines[key] = engine;
  }

  writeFileSync(OUT_TOPICS, JSON.stringify(outTopics, null, 2) + "\n", "utf8");
  writeFileSync(OUT_ENGINES, JSON.stringify(outEngines, null, 2) + "\n", "utf8");

  console.log(`Legacy-Topics (eingefroren): ${LEGACY_TOPICS.length}`);
  console.log(`Topics gesamt (Convex):    ${topics.length}`);
  console.log(`Übersprungen (Test):       ${skippedTest}`);
  console.log(`Übersprungen (kein Fach):  ${skippedNoSubject}`);
  console.log(`Kollisionen (Legacy gewinnt): ${collisionCount}`);
  console.log(`Exportiert gesamt:         ${outTopics.length}`);
  console.log(`Davon Engine-Fallback:     ${fallbackCount}`);
  console.log("Engine-Verteilung:", engineCounts);
  console.log(`Geschrieben: ${OUT_TOPICS}`);
  console.log(`Geschrieben: ${OUT_ENGINES}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
