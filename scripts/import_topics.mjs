#!/usr/bin/env node
/**
 * Import Topics to Convex
 * Usage: node scripts/import_topics.mjs [topics.json]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Convex URL from environment or .env
const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://helpful-blackbird-68.convex.cloud";

// Slug generator
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  // Find input file
  let inputFile = process.argv[2];

  if (!inputFile) {
    // Find latest file in parsed directory
    const parsedDir = join(__dirname, "..", "data", "curricula", "parsed");
    try {
      const files = readdirSync(parsedDir)
        .filter(f => f.endsWith(".json"))
        .sort()
        .reverse();

      if (files.length === 0) {
        console.error("Keine JSON-Dateien gefunden. Führe zuerst parse_curriculum_pdfs.py aus.");
        process.exit(1);
      }

      inputFile = join(parsedDir, files[0]);
      console.log(`Verwende neueste Datei: ${files[0]}`);
    } catch (e) {
      console.error("Fehler beim Lesen des parsed-Verzeichnisses:", e.message);
      process.exit(1);
    }
  }

  // Load topics
  console.log(`Lade: ${inputFile}`);
  const data = JSON.parse(readFileSync(inputFile, "utf-8"));
  const topics = data.topics || [];

  if (topics.length === 0) {
    console.log("Keine Topics gefunden!");
    return;
  }

  console.log(`Gefunden: ${topics.length} Topics`);

  // Format for Convex
  const formattedTopics = topics
    .filter(t => t.name && t.subject)
    .map(t => ({
      subjectSlug: t.subject,
      name: t.name,
      slug: generateSlug(t.name),
      gradeLevel: t.gradeLevel || 5,
      keywords: t.keywords || [],
      ...(t.bundesland && { bundesland: t.bundesland }),
      ...(t.competencies && { competencies: t.competencies }),
      ...(t.sourceUrl && { sourceUrl: t.sourceUrl }),
    }));

  console.log(`Formatiert: ${formattedTopics.length} Topics`);

  // Connect to Convex
  const client = new ConvexHttpClient(CONVEX_URL);

  // Import in batches
  const BATCH_SIZE = 50;
  let totalImported = 0;

  for (let i = 0; i < formattedTopics.length; i += BATCH_SIZE) {
    const batch = formattedTopics.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} Topics`);

    try {
      const result = await client.mutation(api.curriculum.batchImportTopics, {
        topics: batch,
      });

      totalImported += result.imported;
      console.log(`  Importiert: ${result.imported}`);
    } catch (e) {
      console.error(`  Fehler: ${e.message}`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`FERTIG!`);
  console.log(`  Total: ${topics.length}`);
  console.log(`  Importiert: ${totalImported}`);
}

main().catch(console.error);
