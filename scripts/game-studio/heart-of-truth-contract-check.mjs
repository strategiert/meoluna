import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const gameRoot = join(root, "public", "game-studio", "games", "heart-of-truth");
const assetPath = join(gameRoot, "assets", "papyrus-nauny.jpg");
const sourcesPath = join(gameRoot, "assets", "sources.json");
const sourcePath = join(gameRoot, "game.js");
const manifestPath = join(root, "public", "game-studio", "games", "index.json");
const validatorPath = join(root, "convex", "gameStudio", "sourceValidator.ts");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const game = manifest.games.find((entry) => entry.id === "heart-of-truth");

assert.ok(game, "heart-of-truth fehlt im Game-Studio-Manifest");
assert.equal(game.title, "Das Herz der Wahrheit");
assert.equal(game.width, 1280);
assert.equal(game.height, 720);
assert.equal(game.seed, "heart-of-truth-v1");
assert.deepEqual(game.assets, [
  {
    id: "papyrus",
    url: "/game-studio/games/heart-of-truth/assets/papyrus-nauny.jpg",
  },
]);

assert.ok(existsSync(assetPath), "Papyrus-Asset fehlt");
assert.ok(statSync(assetPath).size > 100_000, "Papyrus-Asset ist zu klein");
assert.ok(existsSync(sourcesPath), "Quellenmetadaten fehlen");

const sources = JSON.parse(readFileSync(sourcesPath, "utf8"));
assert.equal(sources.length, 1);
assert.equal(sources[0].objectId, 548344);
assert.equal(sources[0].rights, "Public Domain");
assert.match(sources[0].collectionUrl, /^https:\/\/www\.metmuseum\.org\//);
assert.match(sources[0].imageUrl, /^https:\/\/images\.metmuseum\.org\//);

const source = readFileSync(sourcePath, "utf8");
const { validateGameSource } = await import(pathToFileURL(validatorPath).href);
const requiredGoalIds = [
  "goal-heart-meaning",
  "goal-maat-truth",
  "goal-anubis-weighs",
  "goal-thoth-records",
  "goal-osiris-afterlife",
];
const validation = validateGameSource(source, { requiredGoalIds });
assert.equal(validation.ok, true, validation.violations.join(" | "));

console.log("OK");
