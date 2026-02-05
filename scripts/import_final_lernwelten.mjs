/**
 * Import final Kimi learning worlds into Convex database
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs";
import path from "path";

const CONVEX_URL = "https://helpful-blackbird-68.convex.cloud";
const WORLDS_DIR = "C:/Users/karent/.openclaw/workspace/meoluna/kimi/output/final lernwelten";

// Subject name mapping
const SUBJECT_MAP = {
  mathe: "Mathematik",
  deutsch: "Deutsch",
  englisch: "Englisch",
  sach: "Sachunterricht"
};

// Parse filename to extract metadata
function parseFilename(filename) {
  // Pattern: {subject}_{topic}_{grade}.jsx
  // Example: mathe_addition_bis_20_k1.jsx
  const base = filename.replace(".jsx", "");
  const parts = base.split("_");

  const subjectKey = parts[0];
  const subject = SUBJECT_MAP[subjectKey] || subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1);

  // Grade is last part (k1, k2, etc.)
  const gradePart = parts[parts.length - 1];
  const gradeLevel = gradePart.replace("k", "");

  // Topic is everything in between
  const topicParts = parts.slice(1, -1);
  const topicSlug = topicParts.join("_");
  const topicTitle = topicParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  return {
    subject,
    gradeLevel,
    topicSlug,
    title: `${topicTitle} (Klasse ${gradeLevel})`,
    prompt: `${subject}: ${topicTitle} für Klasse ${gradeLevel}`
  };
}

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  // Get all .jsx files
  const files = fs.readdirSync(WORLDS_DIR)
    .filter(f => f.endsWith(".jsx"))
    .sort();

  console.log(`Found ${files.length} learning worlds to import\n`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(WORLDS_DIR, file);
    const code = fs.readFileSync(filePath, "utf-8");
    const meta = parseFilename(file);

    try {
      const worldId = await client.mutation(api.worlds.create, {
        title: meta.title,
        prompt: meta.prompt,
        code: code,
        gradeLevel: meta.gradeLevel,
        subject: meta.subject,
        isPublic: true,
        userId: "kimi_generated"
      });

      console.log(`✅ ${meta.title}`);
      console.log(`   ${meta.subject} | Klasse ${meta.gradeLevel}`);
      console.log(`   ID: ${worldId}`);
      console.log(`   URL: https://meoluna.com/w/${worldId}\n`);

      results.push({
        file,
        id: worldId,
        title: meta.title,
        subject: meta.subject,
        gradeLevel: meta.gradeLevel,
        url: `https://meoluna.com/w/${worldId}`
      });
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}\n`);
      results.push({
        file,
        error: error.message
      });
    }
  }

  // Summary
  const success = results.filter(r => r.id).length;
  const failed = results.filter(r => r.error).length;

  console.log("═".repeat(50));
  console.log(`\nImport complete: ${success} success, ${failed} failed\n`);

  // Write results to JSON
  const reportPath = path.join(WORLDS_DIR, "../import_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Report saved: ${reportPath}`);
}

main().catch(console.error);
