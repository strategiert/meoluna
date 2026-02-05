/**
 * Import Sekundarstufe I Topics into Convex
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

// Transform topic to match Convex schema
function transformTopic(topic) {
  return {
    subjectSlug: topic.subject, // Rename subject to subjectSlug
    name: topic.name,
    slug: generateSlug(topic.name),
    gradeLevel: topic.gradeLevel,
    bundesland: topic.bundesland || null,
    keywords: topic.keywords || [],
  };
}

async function main() {
  const convexUrl = "https://helpful-blackbird-68.convex.cloud";
  const client = new ConvexHttpClient(convexUrl);

  const parsedDir = path.join(__dirname, "..", "data", "curricula", "parsed");

  // Files to import
  const filesToImport = [
    "chemie_politik_gaps.json"
  ];

  let totalImported = 0;
  let totalSkipped = 0;

  for (const fileName of filesToImport) {
    const filePath = path.join(parsedDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`Skip: ${fileName} not found`);
      continue;
    }

    console.log(`\nImporting ${fileName}...`);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (!data.topics || !Array.isArray(data.topics)) {
        console.log(`  No topics found in ${fileName}`);
        continue;
      }

      // Transform and import in batches of 10
      const batchSize = 10;
      for (let i = 0; i < data.topics.length; i += batchSize) {
        const batch = data.topics.slice(i, i + batchSize).map(transformTopic);

        try {
          const result = await client.mutation(api.curriculum.batchImportTopics, {
            topics: batch
          });

          totalImported += result.imported;
          totalSkipped += batch.length - result.imported;

          process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, data.topics.length)}/${data.topics.length} (${result.imported} imported in batch)`);
        } catch (error) {
          console.error(`\n  Batch error at ${i}: ${error.message}`);
        }
      }

      console.log(`\n  Done: ${fileName}`);
    } catch (error) {
      console.error(`Error reading ${fileName}: ${error.message}`);
    }
  }

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Total imported: ${totalImported}`);
  console.log(`Total skipped (duplicates): ${totalSkipped}`);
}

main().catch(console.error);
