#!/usr/bin/env node
// Kompiliert die 3 Meoluna-Arbeitsblatt-PDFs (Klassenarbeit, Lernzielkontrolle, Hausaufgabe)
// aus den Authored-Content-JSONs im Web-Repo. Siehe docs/seo-pages-spec.md Abschnitt 3.
//
// Usage:
//   node scripts/pdf/build-pdfs.mjs             # alle Topics, Cache respektieren
//   node scripts/pdf/build-pdfs.mjs --force      # Cache ignorieren, alles neu kompilieren
//   node scripts/pdf/build-pdfs.mjs mathematik/zahlen-bis-20   # nur Topics, deren Pfad den String enthält
//
// Env overrides:
//   MEOLUNA_WEB_REPO   Pfad zum Web-Repo (Default: Sibling-Ordner "meoluna-web")
//   TYPST_BIN          Absoluter Pfad zur typst.exe (Default: PATH, sonst WinGet-Install-Ordner)

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_ROOT = __dirname; // scripts/pdf -- dient Typst als --root
const TEMPLATES_DIR = path.join(PDF_ROOT, "templates");
const TMP_DIR = path.join(PDF_ROOT, ".tmp");
const CACHE_FILE = path.join(PDF_ROOT, ".pdf-cache.json");

const APP_ROOT = path.resolve(__dirname, "..", "..");
const WEB_REPO = process.env.MEOLUNA_WEB_REPO || path.resolve(APP_ROOT, "..", "meoluna-web");
const CONTENT_DIR = path.join(WEB_REPO, "src", "data", "topic-content");
const TOPICS_JSON = path.join(WEB_REPO, "src", "data", "topics.json");
const PDF_OUT_ROOT = path.join(WEB_REPO, "public", "pdf");

const PDF_TYPES = ["klassenarbeit", "lernzielkontrolle", "hausaufgabe"];
const NUTZUNG_TAG = {
  klassenarbeit: "klassenarbeit",
  lernzielkontrolle: "lzk",
  hausaufgabe: "hausaufgabe",
};

const FACH_DISPLAY = {
  mathematik: "Mathematik",
  deutsch: "Deutsch",
  englisch: "Englisch",
  sachunterricht: "Sachunterricht",
  "religion-ethik": "Religion/Ethik",
  politik: "Politik",
  sport: "Sport",
  geschichte: "Geschichte",
};

function titleCase(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function fachDisplayName(fachSlug) {
  return FACH_DISPLAY[fachSlug] || titleCase(fachSlug);
}

function findTypstBin() {
  if (process.env.TYPST_BIN && existsSync(process.env.TYPST_BIN)) {
    return process.env.TYPST_BIN;
  }
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", ["typst"], {
      stdio: ["ignore", "ignore", "ignore"],
    });
    return "typst";
  } catch {
    // nicht im PATH -- weiter unten im WinGet-Ordner suchen
  }
  const wingetBase = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages");
  if (existsSync(wingetBase)) {
    const pkgDirs = readdirSync(wingetBase).filter((d) => d.toLowerCase().startsWith("typst.typst"));
    for (const pkgDir of pkgDirs) {
      const inner = path.join(wingetBase, pkgDir);
      let subDirs = [];
      try {
        subDirs = readdirSync(inner);
      } catch {
        continue;
      }
      const sub = subDirs.find((d) => d.toLowerCase().startsWith("typst-"));
      if (sub) {
        const exe = path.join(inner, sub, "typst.exe");
        if (existsSync(exe)) return exe;
      }
    }
  }
  throw new Error(
    "Typst CLI nicht gefunden. `winget install Typst.Typst` ausführen (neue Shell öffnen) oder TYPST_BIN setzen."
  );
}

function walkJsonFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

function loadTopicNameLookup() {
  const lookup = new Map();
  if (!existsSync(TOPICS_JSON)) return lookup;
  try {
    const topics = JSON.parse(readFileSync(TOPICS_JSON, "utf8"));
    for (const t of topics) {
      if (t.subjectSlug && t.slug && t.name) {
        lookup.set(`${t.subjectSlug}/${t.slug}`, t.name);
      }
    }
  } catch (e) {
    console.warn(`Warnung: topics.json konnte nicht gelesen werden (${e.message}). Fallback auf Slug-Titel.`);
  }
  return lookup;
}

function round2Half(x) {
  return Math.round(x * 2) / 2;
}

function defaultArbeitszeit(klasse) {
  if (klasse <= 2) return 30;
  if (klasse <= 7) return 45;
  return 90;
}

function buildNotenschluessel(gesamtpunkte) {
  const pct = { 1: 0.96, 2: 0.8, 3: 0.6, 4: 0.45, 5: 0.2 };
  const schluessel = [1, 2, 3, 4, 5].map((note) => ({
    note,
    minPunkte: round2Half(gesamtpunkte * pct[note]),
  }));
  schluessel.push({ note: 6, minPunkte: 0 });
  return schluessel;
}

function filterByNutzung(aufgaben, tag) {
  return aufgaben.filter((a) => Array.isArray(a.nutzung) && a.nutzung.includes(tag));
}

function toTaskData(aufgaben) {
  return aufgaben.map((a) => ({
    frage: a.frage,
    loesung: a.loesung,
    schwierigkeit: a.schwierigkeit,
    punkte: a.punkte ?? null,
  }));
}

function compileOne(typstBin, type, data, outPath) {
  mkdirSync(path.dirname(outPath), { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });
  const tmpName = `${randomUUID()}.json`;
  const tmpPath = path.join(TMP_DIR, tmpName);
  const templatePath = path.join(TEMPLATES_DIR, `${type}.typ`);
  writeFileSync(tmpPath, JSON.stringify(data), "utf8");
  try {
    execFileSync(
      typstBin,
      ["compile", "--root", PDF_ROOT, "--input", `data=/.tmp/${tmpName}`, templatePath, outPath],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
  } finally {
    rmSync(tmpPath, { force: true });
  }
}

function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const filterArg = args.find((a) => !a.startsWith("--"));

  const typstBin = findTypstBin();
  const topicNameLookup = loadTopicNameLookup();

  let cache = {};
  if (existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    } catch {
      cache = {};
    }
  }

  let files = walkJsonFiles(CONTENT_DIR);
  if (filterArg) {
    files = files.filter((f) => f.replace(/\\/g, "/").includes(filterArg));
  }
  console.log(`Gefunden: ${files.length} Topic-Content-Datei(en) in ${CONTENT_DIR}`);

  let compiled = 0;
  let skipped = 0;
  let removed = 0;
  let errors = 0;

  for (const file of files) {
    const relPath = path.relative(CONTENT_DIR, file).replace(/\\/g, "/");
    try {
      const raw = readFileSync(file, "utf8");
      const content = JSON.parse(raw);

      const dirFach = path.dirname(relPath);
      const filenameSlug = path.basename(relPath, ".json");
      const fach = content.fach || dirFach;
      const slug = content.topic || filenameSlug;

      if (content.fach && content.fach !== dirFach) {
        console.warn(`Warnung [${relPath}]: fach "${content.fach}" != Ordner "${dirFach}"`);
      }
      if (content.topic && content.topic !== filenameSlug) {
        console.warn(`Warnung [${relPath}]: topic "${content.topic}" != Dateiname "${filenameSlug}"`);
      }
      if (!Array.isArray(content.beispielaufgaben) || content.beispielaufgaben.length === 0) {
        throw new Error("keine beispielaufgaben im Content-JSON");
      }

      const topicName = topicNameLookup.get(`${fach}/${slug}`) || titleCase(slug);
      const fachDisplay = fachDisplayName(fach);
      const footerUrl = `meoluna.com/lernwelten/${fach}/klasse-${content.klasse}/${slug}/`;

      const hash = createHash("sha256").update(raw).digest("hex");
      const prev = cache[relPath];
      const hashChanged = !prev || prev.hash !== hash;

      for (const type of PDF_TYPES) {
        const outPath = path.join(PDF_OUT_ROOT, fach, slug, `${slug}-${type}.pdf`);
        const tagged = filterByNutzung(content.beispielaufgaben, NUTZUNG_TAG[type]);

        if (tagged.length === 0) {
          if (existsSync(outPath)) {
            unlinkSync(outPath);
            removed++;
            console.warn(`Entfernt (keine ${type}-Aufgaben mehr getaggt): ${outPath}`);
          }
          continue;
        }

        if (!force && !hashChanged && existsSync(outPath)) {
          skipped++;
          continue;
        }

        let data;
        if (type === "klassenarbeit") {
          const gesamtpunkte = tagged.reduce((sum, a) => sum + (a.punkte || 0), 0);
          const arbeitszeitMinuten = content.arbeitszeitMinuten ?? defaultArbeitszeit(content.klasse);
          data = {
            topicName,
            fachDisplay,
            klasse: content.klasse,
            footerUrl,
            aufgaben: toTaskData(tagged),
            gesamtpunkte,
            notenschluessel: buildNotenschluessel(gesamtpunkte),
            arbeitszeitMinuten,
          };
        } else if (type === "lernzielkontrolle") {
          data = {
            topicName,
            fachDisplay,
            klasse: content.klasse,
            footerUrl,
            lernziele: content.lernziele || [],
            aufgaben: toTaskData(tagged),
          };
        } else {
          data = {
            topicName,
            fachDisplay,
            klasse: content.klasse,
            footerUrl,
            aufgaben: toTaskData(tagged),
          };
        }

        compileOne(typstBin, type, data, outPath);
        compiled++;
      }

      cache[relPath] = { hash, compiledAt: new Date().toISOString() };
    } catch (e) {
      errors++;
      console.error(`Fehler bei ${relPath}: ${e.message}`);
    }
  }

  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  console.log(
    `Fertig. Kompiliert: ${compiled}, übersprungen (Cache): ${skipped}, entfernt: ${removed}, Fehler: ${errors}`
  );
  if (errors > 0) process.exitCode = 1;
}

main();
