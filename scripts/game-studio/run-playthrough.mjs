// Generischer Playthrough-Executor: laedt ein Spiel per Manifest, spielt einen Affordance-Plan
// (siehe .superpowers/sdd/protocol.md, PlanStep/PlaythroughPlan) auf 1-3 Ziel-Viewports durch
// und prueft Gates (GAME_READY-Latenz, Touch-Ziele, Konsolen-/GAME_ERROR-Freiheit, Goal/Complete-
// Assertions, Screenshots, Performance-Probe). Siehe .superpowers/sdd/task-5-brief.md.
//
// CLI: node scripts/game-studio/run-playthrough.mjs --plan <pfad>
//        [--viewport 390x844|768x1024|1440x900|all] [--throttle 4] [--update-shots]
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { ROOT, startServer, tapAffordance } from "./lib/harness.mjs";

const SHOTS = join(ROOT, "scripts", "visual-out", "game-studio");
const REF = join(ROOT, "scripts", "visual-ref", "game-studio");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(REF, { recursive: true });

const MISMATCH_WARN = 0.02; // 2 % abweichende Pixel -> Warnung (nicht Fail)

// Spec 5.4 — die drei Ziel-Viewports.
const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844, device: "touch" },
  { name: "768x1024", width: 768, height: 1024, device: "touch" },
  { name: "1440x900", width: 1440, height: 900, device: "desktop" },
];

function parseArgs(argv) {
  const args = { viewport: "all", throttle: 4, updateShots: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--plan") args.plan = argv[(i += 1)];
    else if (a === "--viewport") args.viewport = argv[(i += 1)];
    else if (a === "--throttle") args.throttle = Number(argv[(i += 1)]);
    else if (a === "--update-shots") args.updateShots = true;
    else { console.error(`Unbekanntes Argument: ${a}`); process.exit(1); }
  }
  if (!args.plan) {
    console.error("Usage: node scripts/game-studio/run-playthrough.mjs --plan <pfad> [--viewport 390x844|768x1024|1440x900|all] [--throttle N] [--update-shots]");
    process.exit(1);
  }
  return args;
}

function orientationOf(w, h) {
  return w > h ? "landscape" : w < h ? "portrait" : "square";
}

// Viewport-Orientierung muss der Manifest-Orientierung entsprechen; quadratische Manifeste
// (z. B. hello-game 960x960) nutzen den Viewport unveraendert.
function resolveViewport(vp, manifest) {
  const manifestOr = orientationOf(manifest.width, manifest.height);
  const vpOr = orientationOf(vp.width, vp.height);
  if (manifestOr !== "square" && vpOr !== "square" && vpOr !== manifestOr) {
    return { width: vp.height, height: vp.width, label: `${vp.height}x${vp.width}` };
  }
  return { width: vp.width, height: vp.height, label: vp.name };
}

function compareScreenshot(name, buf, updateShots) {
  const refPath = join(REF, `${name}.png`);
  if (updateShots || !existsSync(refPath)) {
    writeFileSync(refPath, buf);
    return { state: "baseline" };
  }
  const cur = PNG.sync.read(buf);
  const ref = PNG.sync.read(readFileSync(refPath));
  if (cur.width !== ref.width || cur.height !== ref.height) return { state: "size-changed", ratio: 1 };
  const diff = new PNG({ width: cur.width, height: cur.height });
  const bad = pixelmatch(ref.data, cur.data, diff.data, cur.width, cur.height, { threshold: 0.1 });
  const ratio = bad / (cur.width * cur.height);
  if (ratio > MISMATCH_WARN) writeFileSync(join(SHOTS, `${name}.diff.png`), PNG.sync.write(diff));
  return { state: ratio > MISMATCH_WARN ? "diff" : "ok", ratio };
}

async function doScreenshot(page, game, viewportLabel, stepName, updateShots, notes) {
  const name = `${game}-${viewportLabel}-${stepName}`;
  const buf = await page.screenshot();
  writeFileSync(join(SHOTS, `${name}.png`), buf);
  const cmp = compareScreenshot(name, buf, updateShots);
  if (cmp.state === "baseline") notes.push(`Screenshot ${name}: Baseline geschrieben`);
  else if (cmp.state === "diff" || cmp.state === "size-changed") notes.push(`Screenshot ${name}: WARN ${cmp.state === "size-changed" ? "Groesse geaendert" : `${(cmp.ratio * 100).toFixed(1)}% Pixel-Abweichung`}`);
}

async function tapWithTouchGate(page, id, checkTouchTarget) {
  const a = await page.evaluate((aid) => (window.__gs.affordances || []).find((x) => x.id === aid), id);
  if (!a) throw new Error(`Affordance ${id} nicht gefunden (tap)`);
  if (checkTouchTarget && (a.width < 48 || a.height < 48)) {
    throw new Error(`Touch-Ziel zu klein: ${id}`);
  }
  await tapAffordance(page, id);
}

async function runStep(page, step, ctx, notes) {
  switch (step.op) {
    case "waitFor": {
      const timeout = step.timeoutMs ?? 10000;
      const ok = await page
        .waitForFunction((aid) => (window.__gs.affordances || []).some((a) => a.id === aid), step.affordance, { timeout })
        .then(() => true)
        .catch(() => false);
      if (!ok) throw new Error(`waitFor ${step.affordance}: Timeout (${timeout}ms)`);
      break;
    }
    case "tap": {
      await tapWithTouchGate(page, step.affordance, ctx.checkTouchTarget);
      break;
    }
    case "waitTelemetry": {
      const timeout = step.timeoutMs ?? 10000;
      const ok = await page
        .waitForFunction((ev) => (window.__gs.events || []).some((e) => e.type === "TELEMETRY" && e.event === ev), step.event, { timeout })
        .then(() => true)
        .catch(() => false);
      if (!ok) throw new Error(`waitTelemetry ${step.event}: Timeout (${timeout}ms)`);
      break;
    }
    case "assertGoal": {
      // Events kommen asynchron per postMessage/MessageChannel an — kurz pollen statt
      // einmalig zu pruefen, sonst Race zwischen Klick und Event-Zustellung.
      const timeout = step.timeoutMs ?? 3000;
      const ok = await page
        .waitForFunction((gid) => (window.__gs.events || []).some((e) => e.type === "PROGRESS" && e.event === "goal" && e.goalId === gid), step.goalId, { timeout })
        .then(() => true)
        .catch(() => false);
      if (!ok) throw new Error(`assertGoal ${step.goalId}: kein PROGRESS goal-Event gefunden (${timeout}ms)`);
      break;
    }
    case "assertComplete": {
      const timeout = step.timeoutMs ?? 3000;
      const ok = await page
        .waitForFunction(() => (window.__gs.events || []).filter((e) => e.type === "PROGRESS" && e.event === "complete").length === 1, null, { timeout })
        .then(() => true)
        .catch(() => false);
      if (!ok) {
        const count = await page.evaluate(() => (window.__gs.events || []).filter((e) => e.type === "PROGRESS" && e.event === "complete").length);
        throw new Error(`assertComplete: complete kam ${count}x nach ${timeout}ms, erwartet genau 1x`);
      }
      break;
    }
    case "wait": {
      await page.waitForTimeout(step.ms);
      break;
    }
    case "screenshot": {
      await doScreenshot(page, ctx.game, ctx.viewportLabel, step.name, ctx.updateShots, notes);
      break;
    }
    default:
      throw new Error(`Unbekannter Plan-Step: ${step.op}`);
  }
}

async function measurePerformance(page, throttle) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  try {
    const frame = page.frames().find((f) => f.url().includes("/game-runtime/v1/index.html"));
    if (!frame) throw new Error("Runtime-Frame fuer Perf-Probe nicht gefunden");
    const warmupMs = 1000;
    const sampleMs = 10000;
    const deltas = await frame.evaluate(
      ({ warmupMs, sampleMs }) =>
        new Promise((resolve) => {
          const out = [];
          let last = null;
          let phase = "warmup";
          let phaseStart = performance.now();
          function tick(t) {
            if (phase === "sample" && last !== null) out.push(t - last);
            last = t;
            const elapsed = performance.now() - phaseStart;
            if (phase === "warmup" && elapsed >= warmupMs) {
              phase = "sample";
              phaseStart = performance.now();
              last = null;
            } else if (phase === "sample" && elapsed >= sampleMs) {
              resolve(out);
              return;
            }
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }),
      { warmupMs, sampleMs },
    );
    if (!deltas.length) throw new Error("Perf-Probe lieferte keine Samples");
    const sorted = [...deltas].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1);
    return sorted[idx];
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  }
}

async function runViewport(vpSpec, manifest, plan, args, browser, base, notes) {
  const resolved = resolveViewport(vpSpec, manifest);
  const failures = [];
  const page = await browser.newPage({ viewport: { width: resolved.width, height: resolved.height } });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

  let readyMs = null;
  let p95 = null;

  try {
    await page.goto(`${base}/harness.html`);
    await page.waitForFunction(() => window.__gs.ready, null, { timeout: 5000 });
  } catch {
    failures.push("Handshake/RUNTIME_READY nicht erhalten");
  }

  if (!failures.length) {
    const t0 = Date.now();
    try {
      await page.evaluate(
        ({ src, seed, opts }) => window.__loadGame(src, seed, opts),
        {
          src: `${base}${manifest.sourceUrl}`,
          seed: plan.seed,
          opts: { width: manifest.width, height: manifest.height, device: vpSpec.device, assets: manifest.assets || [] },
        },
      );
      await page.waitForFunction(() => window.__gs.gameReady, null, { timeout: 5000 });
      readyMs = Date.now() - t0;
      if (readyMs >= 5000) failures.push(`GAME_READY-Latenz >= 5s (${readyMs}ms)`);
    } catch {
      readyMs = Date.now() - t0;
      failures.push("GAME_READY nicht < 5s erhalten");
    }
  }

  if (!failures.length) {
    const ctx = {
      game: plan.game,
      viewportLabel: resolved.label,
      updateShots: args.updateShots,
      checkTouchTarget: vpSpec.name === "390x844",
    };
    for (const step of plan.steps) {
      try {
        await runStep(page, step, ctx, notes);
      } catch (e) {
        failures.push(e instanceof Error ? e.message : String(e));
        break;
      }
    }
  }

  const gameErrors = await page.evaluate(() => window.__gs.errors.slice()).catch(() => []);
  if (gameErrors.length) failures.push(`GAME_ERROR: ${gameErrors.join(" | ")}`);
  if (consoleErrors.length) failures.push(`Konsolenfehler: ${consoleErrors.join(" | ")}`);

  if (!failures.length && vpSpec.name === "1440x900") {
    try {
      p95 = await measurePerformance(page, args.throttle);
      if (p95 > 33) failures.push(`Perf p95 ${p95.toFixed(1)}ms > 33ms (throttle ${args.throttle}x)`);
    } catch (e) {
      failures.push(`Perf-Probe Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  await page.close();
  return { pass: failures.length === 0, failures, readyMs, p95, label: resolved.label };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = JSON.parse(readFileSync(resolvePath(process.cwd(), args.plan), "utf8"));
  const index = JSON.parse(readFileSync(join(ROOT, "public", "game-studio", "games", "index.json"), "utf8"));
  const manifest = index.games.find((g) => g.id === plan.game);
  if (!manifest) {
    console.error(`Spiel '${plan.game}' nicht in public/game-studio/games/index.json gefunden`);
    process.exit(1);
  }

  const viewportsToRun = args.viewport === "all" ? VIEWPORTS : VIEWPORTS.filter((v) => v.name === args.viewport);
  if (viewportsToRun.length === 0) {
    console.error(`Unbekannter Viewport: ${args.viewport} (erlaubt: 390x844, 768x1024, 1440x900, all)`);
    process.exit(1);
  }

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  // Ohne diesen Flag faellt headless Chromium auf SwiftShader (Software-Rendering) zurueck,
  // das unter CPU-Throttling kuenstlich auf ~30fps kollabiert (p95 ~33.4ms), unabhaengig vom
  // Spiel. Mit echtem GPU-Backend (ANGLE) misst die Perf-Probe reale Geraete-Performance.
  const browser = await chromium.launch({ args: ["--use-gl=angle"] });
  const notes = [];
  let anyFail = false;

  try {
    for (const vp of viewportsToRun) {
      const result = await runViewport(vp, manifest, plan, args, browser, base, notes);
      if (!result.pass) anyFail = true;
      const status = result.pass ? "PASS" : "FAIL";
      let line = `${status} ${plan.game} ${result.label} ready=${result.readyMs != null ? result.readyMs : "?"}ms`;
      if (result.p95 != null) line += ` p95=${result.p95.toFixed(1)}ms`;
      console.log(line);
      result.failures.forEach((f) => console.error(`  - ${f}`));
    }
  } finally {
    notes.forEach((n) => console.log(`  · ${n}`));
    await browser.close();
    server.close();
  }

  process.exit(anyFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
