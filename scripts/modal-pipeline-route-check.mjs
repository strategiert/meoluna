import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const modalPath = resolve("src/components/WorldCreator/WorldCreatorModal.tsx");
const source = readFileSync(modalPath, "utf8");

const checks = [
  {
    ok: source.includes("api.pipeline.orchestrator.generateWorldV2"),
    message: "WorldCreatorModal must call pipeline.orchestrator.generateWorldV2.",
  },
  {
    ok: !source.includes("api.generate.generateWorld"),
    message: "WorldCreatorModal must not call legacy api.generate.generateWorld.",
  },
  {
    ok: !source.includes("api.generate.generateWorldFromPDF"),
    message: "WorldCreatorModal must not call legacy api.generate.generateWorldFromPDF.",
  },
  {
    ok: !source.includes("useMutation(api.worlds.create)"),
    message: "WorldCreatorModal must not save generated worlds itself; the V2 pipeline owns persistence.",
  },
  {
    ok: !/\bsaveWorld\s*\(/.test(source),
    message: "WorldCreatorModal must not call saveWorld directly.",
  },
  {
    ok: /pdfText:\s*pdfText\s*\|\|\s*undefined/.test(source),
    message: "WorldCreatorModal must forward extracted PDF text to generateWorldV2.",
  },
];

const failed = checks.filter((check) => !check.ok);

if (failed.length > 0) {
  console.error("Modal pipeline route check failed:");
  for (const check of failed) {
    console.error(`- ${check.message}`);
  }
  process.exit(1);
}

console.log("Modal pipeline route check passed.");
