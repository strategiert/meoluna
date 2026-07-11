import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { ROOT, startServer, tapAffordance } from "./lib/harness.mjs";

const screenshotRoot = join(ROOT, "scripts", "visual-out", "game-studio");
mkdirSync(screenshotRoot, { recursive: true });

function parseStage(argv) {
  const stageIndex = argv.indexOf("--stage");
  const stage = stageIndex >= 0 ? argv[stageIndex + 1] : "movement";
  if (!stage || !["movement", "guided", "responsive"].includes(stage)) {
    throw new Error(`Unbekannte Stage: ${stage ?? "(fehlt)"}`);
  }
  return stage;
}

function pixelDifference(beforeBuffer, afterBuffer) {
  const before = PNG.sync.read(beforeBuffer);
  const after = PNG.sync.read(afterBuffer);
  assert.equal(after.width, before.width);
  assert.equal(after.height, before.height);
  const diff = new PNG({ width: before.width, height: before.height });
  const changed = pixelmatch(
    before.data,
    after.data,
    diff.data,
    before.width,
    before.height,
    { threshold: 0.1 },
  );
  return changed / (before.width * before.height);
}

async function loadGame(page, base, manifest) {
  await page.goto(`${base}/harness.html`);
  await page.waitForFunction(() => window.__gs.ready, null, { timeout: 5000 });
  await page.evaluate(
    ({ sourceUrl, seed, width, height, assets }) =>
      window.__loadGame(sourceUrl, seed, { width, height, device: "desktop", assets }),
    {
      sourceUrl: `${base}${manifest.sourceUrl}`,
      seed: manifest.seed,
      width: manifest.width,
      height: manifest.height,
      assets: manifest.assets,
    },
  );
  await page.waitForFunction(() => window.__gs.gameReady, null, { timeout: 5000 });
  const frame = page.frames().find((candidate) => candidate.url().includes("/game-runtime/v1/index.html"));
  assert.ok(frame, "Runtime-Frame fehlt");
  await frame.locator("canvas").waitFor({ state: "visible" });
  return frame;
}

async function checkMovement(page, frame) {
  await page.waitForFunction(
    () => window.__gs.affordances.some((affordance) => affordance.id === "move.heart"),
    null,
    { timeout: 3000 },
  );
  const before = await frame.locator("canvas").screenshot();
  await tapAffordance(page, "move.heart");
  await page.waitForFunction(
    () => window.__gs.events.some((event) => event.type === "TELEMETRY" && event.event === "first-input"),
    null,
    { timeout: 500 },
  );
  await page.waitForTimeout(450);
  const after = await frame.locator("canvas").screenshot();
  assert.ok(pixelDifference(before, after) > 0.002, "Erster Input verändert zu wenige Canvas-Pixel");
}

async function waitForAffordance(page, id) {
  await page.waitForFunction(
    (affordanceId) => window.__gs.affordances.some((affordance) => affordance.id === affordanceId),
    id,
    { timeout: 4000 },
  );
}

async function waitForTelemetry(page, eventName) {
  await page.waitForFunction(
    (expectedEvent) => window.__gs.events.some((event) => event.type === "TELEMETRY" && event.event === expectedEvent),
    eventName,
    { timeout: 4000 },
  );
}

async function saveScreenshot(page, name) {
  await page.screenshot({ path: join(screenshotRoot, `heart-of-truth-1440x900-${name}.png`) });
}

async function checkGuided(page) {
  await saveScreenshot(page, "arrival");
  const steps = [
    { id: "heart", event: "heart.raised" },
    { id: "feather", event: "scale.balanced", screenshot: "balanced" },
    { id: "thoth", event: "thoth.recorded" },
    { id: "gate", event: "echo.ready", screenshot: "gate-open" },
  ];

  for (const step of steps) {
    await waitForAffordance(page, `move.${step.id}`);
    await tapAffordance(page, `move.${step.id}`);
    await waitForAffordance(page, `action.${step.id}`);
    await tapAffordance(page, `action.${step.id}`);
    await waitForTelemetry(page, step.event);
    if (step.screenshot) await saveScreenshot(page, step.screenshot);
  }

  await saveScreenshot(page, "echo-ready");
  const completeCount = await page.evaluate(
    () => window.__gs.events.filter((event) => event.type === "PROGRESS" && event.event === "complete").length,
  );
  assert.equal(completeCount, 0, "Geführter Check darf das Erinnerungsecho nicht lösen");
}

async function main() {
  const stage = parseStage(process.argv.slice(2));
  const index = JSON.parse(readFileSync(join(ROOT, "public", "game-studio", "games", "index.json"), "utf8"));
  const manifest = index.games.find((entry) => entry.id === "heart-of-truth");
  assert.ok(manifest, "heart-of-truth fehlt im Manifest");

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ args: ["--use-gl=angle"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    const frame = await loadGame(page, base, manifest);
    if (stage === "movement") await checkMovement(page, frame);
    if (stage === "guided") await checkGuided(page);
    assert.deepEqual(await page.evaluate(() => window.__gs.errors), []);
    assert.deepEqual(consoleErrors, []);
    console.log(`PASS ${stage} 1440x900`);
  } finally {
    await page.close();
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
