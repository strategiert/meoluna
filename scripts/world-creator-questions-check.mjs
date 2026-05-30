import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const modalSource = readFileSync(resolve("src/components/WorldCreator/WorldCreatorModal.tsx"), "utf8");
const topicSource = readFileSync(resolve("src/components/WorldCreator/TopicPicker.tsx"), "utf8");
const combined = `${modalSource}\n${topicSource}`;

const failures = [];

for (const needle of [
  "clarificationAnswers",
  "Sofort verstehen",
  "Kind / Schüler",
  "Sehr geführt",
  "contextAnswers",
]) {
  if (!combined.includes(needle)) {
    failures.push(`World creator must include generic clarification signal: ${needle}`);
  }
}

if (!/generateWorldV2\(\{[\s\S]*contextAnswers:\s*clarificationAnswers/.test(modalSource)) {
  failures.push("WorldCreatorModal must forward clarificationAnswers to generateWorldV2 as contextAnswers.");
}

if (failures.length > 0) {
  console.error("World creator questions check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("World creator questions check passed.");
