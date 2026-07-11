# Heart of Truth Gold Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 60–90 second playable admin-lab slice “Das Herz der Wahrheit” as the first human quality benchmark for Meoluna’s generative game studio.

**Architecture:** Keep the existing sandboxed `phaser-v1` runtime and deliver one import-free ES module. `game.js` exports a pure journey model for deterministic state tests and `bootMeolunaGame(context)` for the Phaser scene; the scene consumes only parent-injected blob assets and reports invisible automation affordances through the existing MessagePort bridge.

**Tech Stack:** Phaser 4.2.1, plain JavaScript ES modules, Node.js assertions, Playwright, existing V3 runtime/validator/harness.

---

## File Map

- Create `public/game-studio/games/heart-of-truth/game.js`: pure journey model, Phaser preload, input, animation, audio, completion bridge calls.
- Create `public/game-studio/games/heart-of-truth/assets/papyrus-nauny.jpg`: Public Domain primary scene from The Met Open Access collection.
- Create `public/game-studio/games/heart-of-truth/assets/sources.json`: source URL, object metadata, rights and in-game usage.
- Modify `public/game-studio/games/index.json`: admin-lab registration and blob asset injection.
- Create `scripts/game-studio/heart-of-truth-model-check.mjs`: deterministic transition and one-shot completion checks.
- Create `scripts/game-studio/heart-of-truth-contract-check.mjs`: manifest, source validator, source metadata and asset integrity checks.
- Create `scripts/game-studio/heart-of-truth-visual-check.mjs`: first-input pixel change, guided journey to the echo, viewport and runtime error checks.
- Modify `package.json`: focused Gold Slice check commands.
- Create `docs/superpowers/reports/2026-07-11-heart-of-truth-gold-gate.md`: reproducible verification record and explicit human-gate status.

### Task 1: Deterministic Learning Journey

**Files:**
- Create: `scripts/game-studio/heart-of-truth-model-check.mjs`
- Create: `public/game-studio/games/heart-of-truth/game.js`

- [ ] **Step 1: Write the failing model check**

The check imports `createJourneyModel`, proves the guided order `heart -> feather -> thoth -> gate`, proves wrong echo choices do not advance, and proves completion can be consumed once only:

```js
import assert from "node:assert/strict";
import { createJourneyModel } from "../../public/game-studio/games/heart-of-truth/game.js";

const journey = createJourneyModel();
assert.equal(journey.snapshot().phase, "arrival");
assert.equal(journey.activate("feather").accepted, false);
for (const id of ["heart", "feather", "thoth", "gate"]) {
  assert.equal(journey.activate(id).accepted, true, id);
}
assert.equal(journey.snapshot().phase, "echo");
assert.equal(journey.remember("tablet").accepted, false);
for (const id of ["heart", "feather", "tablet"]) {
  assert.equal(journey.remember(id).accepted, true, id);
}
assert.equal(journey.consumeCompletion(), true);
assert.equal(journey.consumeCompletion(), false);
assert.deepEqual(journey.snapshot().completedGoals, [
  "goal-heart-meaning",
  "goal-maat-truth",
  "goal-anubis-weighs",
  "goal-thoth-records",
  "goal-osiris-afterlife",
]);
console.log("OK");
```

- [ ] **Step 2: Run the check and verify RED**

Run: `node scripts/game-studio/heart-of-truth-model-check.mjs`

Expected: FAIL because `heart-of-truth/game.js` or `createJourneyModel` does not exist.

- [ ] **Step 3: Implement the minimal pure model and runtime-shaped module**

Implement immutable snapshots around private state. Only the current guided station is accepted; echo mistakes preserve `echoIndex`; `consumeCompletion()` flips a one-shot guard. Add a minimal `bootMeolunaGame(context)` with exactly one `new window.Phaser.Game(...)`, one scene, `setAffordances`, all five literal `completeGoal` IDs and one guarded `completeGame` path so the existing source validator can inspect the module.

Core transition table:

```js
const GOAL_IDS = [
  "goal-heart-meaning",
  "goal-maat-truth",
  "goal-anubis-weighs",
  "goal-thoth-records",
  "goal-osiris-afterlife",
];
const GUIDED = ["heart", "feather", "thoth", "gate"];
const ECHO = ["heart", "feather", "tablet"];

export function createJourneyModel() {
  let guidedIndex = 0;
  let echoIndex = 0;
  let phase = "arrival";
  let completionAvailable = false;
  let completionConsumed = false;
  const activate = (id) => {
    if (phase === "arrival" && id === GUIDED[0]) phase = "guided";
    if (phase !== "guided" || id !== GUIDED[guidedIndex]) return { accepted: false };
    guidedIndex += 1;
    if (guidedIndex === GUIDED.length) phase = "echo";
    return { accepted: true, phase };
  };
  const remember = (id) => {
    if (phase !== "echo" || id !== ECHO[echoIndex]) return { accepted: false };
    echoIndex += 1;
    if (echoIndex === ECHO.length) { phase = "complete"; completionAvailable = true; }
    return { accepted: true, phase };
  };
  return {
    activate,
    remember,
    consumeCompletion() {
      if (!completionAvailable || completionConsumed) return false;
      completionConsumed = true;
      return true;
    },
    snapshot() {
      return {
        phase,
        guidedIndex,
        echoIndex,
        completedGoals: phase === "complete" ? GOAL_IDS.slice() : [],
      };
    },
  };
}
```

- [ ] **Step 4: Run the check and verify GREEN**

Run: `node scripts/game-studio/heart-of-truth-model-check.mjs`

Expected: `OK`.

- [ ] **Step 5: Commit the state contract**

```powershell
git add scripts/game-studio/heart-of-truth-model-check.mjs public/game-studio/games/heart-of-truth/game.js
git commit -m "test: define heart of truth journey"
```

### Task 2: Licensed Primary Asset and Manifest Contract

**Files:**
- Create: `scripts/game-studio/heart-of-truth-contract-check.mjs`
- Create: `public/game-studio/games/heart-of-truth/assets/papyrus-nauny.jpg`
- Create: `public/game-studio/games/heart-of-truth/assets/sources.json`
- Modify: `public/game-studio/games/index.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing contract check**

Read the manifest and source files. Assert `heart-of-truth`, `1280x720`, seed `heart-of-truth-v1`, one `papyrus` asset URL, a JPEG larger than 100 KB, Public Domain metadata with Met object `548344`, and `validateGameSource(..., { requiredGoalIds: GOAL_IDS })` returning `ok: true`.

```js
const game = manifest.games.find((entry) => entry.id === "heart-of-truth");
assert.equal(game.width, 1280);
assert.equal(game.height, 720);
assert.deepEqual(game.assets, [{
  id: "papyrus",
  url: "/game-studio/games/heart-of-truth/assets/papyrus-nauny.jpg",
}]);
assert.equal(sources[0].objectId, 548344);
assert.equal(sources[0].rights, "Public Domain");
assert.ok(statSync(assetPath).size > 100_000);
assert.equal(validateGameSource(source, { requiredGoalIds: GOAL_IDS }).ok, true);
```

- [ ] **Step 2: Run the check and verify RED**

Run: `node --import tsx/esm scripts/game-studio/heart-of-truth-contract-check.mjs`

Expected: FAIL because the manifest entry, asset and metadata are missing.

- [ ] **Step 3: Add the source asset and provenance**

Download `https://images.metmuseum.org/CRDImages/eg/original/DT11633.jpg` directly to `assets/papyrus-nauny.jpg`. Record title, artist/culture field, date, accession number, object ID, Public Domain status, collection page, direct image URL, access date `2026-07-11`, and usage `primary scene and cutout texture source` in `sources.json`.

- [ ] **Step 4: Register the game and scripts**

Append the manifest entry without altering the three existing games:

```json
{
  "id": "heart-of-truth",
  "title": "Das Herz der Wahrheit",
  "sourceUrl": "/game-studio/games/heart-of-truth/game.js",
  "width": 1280,
  "height": 720,
  "seed": "heart-of-truth-v1",
  "assets": [
    {
      "id": "papyrus",
      "url": "/game-studio/games/heart-of-truth/assets/papyrus-nauny.jpg"
    }
  ]
}
```

Add `heart-of-truth-model-check`, `heart-of-truth-contract-check`, `heart-of-truth-visual-check`, and an aggregate `heart-of-truth-check` to `package.json`.

- [ ] **Step 5: Run the contract check and verify GREEN**

Run: `npm run heart-of-truth-contract-check`

Expected: `OK`.

- [ ] **Step 6: Commit assets and registration**

```powershell
git add package.json public/game-studio/games/index.json public/game-studio/games/heart-of-truth/assets scripts/game-studio/heart-of-truth-contract-check.mjs
git commit -m "feat: register heart of truth source art"
```

### Task 3: Living Papyrus and Immediate Movement

**Files:**
- Create: `scripts/game-studio/heart-of-truth-visual-check.mjs`
- Modify: `public/game-studio/games/heart-of-truth/game.js`

- [ ] **Step 1: Write the failing visual smoke check**

Use the existing harness at `1440x900`. Load the manifest game, wait for `GAME_READY`, capture the iframe canvas, tap the `move.heart` affordance, wait 450 ms, capture again, and assert a nontrivial pixel difference plus telemetry event `first-input`. Assert no `GAME_ERROR` or console error.

```js
await page.waitForFunction(() => window.__gs.affordances.some((a) => a.id === "move.heart"));
const before = await frame.locator("canvas").screenshot();
await tapAffordance(page, "move.heart");
await page.waitForFunction(() => window.__gs.events.some((e) => e.type === "TELEMETRY" && e.event === "first-input"));
await page.waitForTimeout(450);
const after = await frame.locator("canvas").screenshot();
assert.ok(pixelDifference(before, after) > 0.002);
```

`pixelDifference` decodes both PNG buffers with `PNG.sync.read`, runs `pixelmatch` with threshold `0.1`, and returns `changedPixels / (width * height)`.

- [ ] **Step 2: Run the visual check and verify RED**

Run: `npm run heart-of-truth-visual-check -- --stage movement`

Expected: FAIL because the scene does not yet render `move.heart` or emit `first-input`.

- [ ] **Step 3: Build the living-papyrus scene**

Preload `context.assets.papyrus`; render a full-canvas ochre fiber background, the complete Met image as the central scene, two cropped duplicates with small depth offsets, a dark reveal mask, and a Ba cutout derived from the same texture. Add low-density dust, cyan local light, gold ink paths, restrained camera drift, a top-left sound icon, pointer movement, WASD/arrows and smooth acceleration/deceleration. Register a bridge-only `move.heart` affordance with at least 64 logical pixels in each dimension.

Input must emit `first-input` once and move the Ba on the first click; no intro overlay or start button is permitted.

- [ ] **Step 4: Run the movement check and verify GREEN**

Run: `npm run heart-of-truth-visual-check -- --stage movement`

Expected: `PASS movement 1440x900` and no runtime errors.

- [ ] **Step 5: Commit the first playable scene**

```powershell
git add scripts/game-studio/heart-of-truth-visual-check.mjs public/game-studio/games/heart-of-truth/game.js package.json
git commit -m "feat: animate living papyrus arrival"
```

### Task 4: Guided Cause-and-Effect Sequence

**Files:**
- Modify: `scripts/game-studio/heart-of-truth-visual-check.mjs`
- Modify: `public/game-studio/games/heart-of-truth/game.js`

- [ ] **Step 1: Extend the visual check and verify RED**

For `--stage guided`, walk only the visible guided actions: move to and activate heart, feather, Thoth and gate. After each activation assert a phase-specific telemetry event and the next affordance. Stop at `echo.ready`; take screenshots named `arrival`, `balanced`, `gate-open`, and `echo-ready`. Do not solve the echo.

Expected affordance/event pairs:

```js
[
  ["action.heart", "heart.raised"],
  ["action.feather", "scale.balanced"],
  ["action.thoth", "thoth.recorded"],
  ["action.gate", "echo.ready"],
]
```

Run: `npm run heart-of-truth-visual-check -- --stage guided`

Expected: FAIL at the first missing guided affordance.

- [ ] **Step 2: Implement the four embodied beats**

Heart: lift a cropped heart motif onto the left scale pan, animate Anubis and reveal `Das Herz trug die Taten eines Menschen.` only after motion.

Feather: stream cyan light to the feather, pendulum-tween both pans into balance, spread gold ink and reveal `Ma’at stand für Wahrheit und Ordnung.` only after balance.

Thoth: draw a visible writing stroke, pan the camera no more than 600 ms and reveal the role label only after writing.

Gate: add depth parallax, resonant light and the short in-world mapping `Anubis wog. Thoth schrieb. Osiris empfing.` before transitioning to echo.

At each stage expose only movement plus the single nearby `action.*`; ignore extra clicks while an animation lock is active. Use Phaser clock/tweens only, never wall-clock APIs.

- [ ] **Step 3: Run focused and regression checks**

Run: `npm run heart-of-truth-visual-check -- --stage guided`

Expected: `PASS guided 1440x900`, four screenshots and no complete event.

Run: `npm run game-studio-check`

Expected: all existing V3 checks pass.

- [ ] **Step 4: Commit the guided loop**

```powershell
git add scripts/game-studio/heart-of-truth-visual-check.mjs public/game-studio/games/heart-of-truth/game.js
git commit -m "feat: add heart judgment interaction loop"
```

### Task 5: Unguided Memory Echo and Completion

**Files:**
- Modify: `scripts/game-studio/heart-of-truth-model-check.mjs`
- Modify: `public/game-studio/games/heart-of-truth/game.js`

- [ ] **Step 1: Add the failing completion-reporter check**

Import a new `reportJourneyCompletion(api, journey)` function that does not exist yet. Use an in-memory API recorder, finish the pure model, invoke the reporter twice and assert exactly five distinct goal events plus one completion event. Also retain assertions that every wrong motif leaves `echoIndex` unchanged and repeated taps cannot skip.

```js
const events = [];
const api = {
  completeGoal: (goalId, evidence) => events.push({ type: "goal", goalId, evidence }),
  completeGame: (summary) => events.push({ type: "complete", summary }),
};
assert.equal(reportJourneyCompletion(api, journey), true);
assert.equal(reportJourneyCompletion(api, journey), false);
assert.equal(events.filter((event) => event.type === "goal").length, 5);
assert.equal(new Set(events.filter((event) => event.type === "goal").map((event) => event.goalId)).size, 5);
assert.equal(events.filter((event) => event.type === "complete").length, 1);
```

Run: `npm run heart-of-truth-model-check`

Expected: FAIL because `reportJourneyCompletion` is not exported.

- [ ] **Step 2: Implement the memory echo**

Implement `reportJourneyCompletion(api, journey)` around the model’s one-shot `consumeCompletion()` guard. Darken the scene into a silhouette and place heart, feather and writing tablet as three large world motifs. The correct motif receives only the previously established causal light stream. A wrong motif does not flash red, reset or add progress; its related figure turns toward the current motif. On success restore the unmodified papyrus, sequentially highlight Anubis, Thoth and Osiris, call the reporter so each literal `completeGoal` fires once, then call guarded `completeGame({ finalScore: 0, experience: "heart-of-truth" })` once.

- [ ] **Step 3: Verify the model and source contract**

Run: `npm run heart-of-truth-model-check`

Expected: `OK`.

Run: `npm run heart-of-truth-contract-check`

Expected: `OK` and no forbidden API violations.

- [ ] **Step 4: Commit echo behavior**

```powershell
git add scripts/game-studio/heart-of-truth-model-check.mjs public/game-studio/games/heart-of-truth/game.js
git commit -m "feat: add heart of truth memory echo"
```

### Task 6: Touch, Keyboard and Viewport Hardening

**Files:**
- Modify: `scripts/game-studio/heart-of-truth-visual-check.mjs`
- Modify: `public/game-studio/games/heart-of-truth/game.js`

- [ ] **Step 1: Add failing viewport and keyboard probes**

Run movement and guided probes at resolved landscape sizes `844x390`, `1024x768`, and `1440x900`. Assert every active action affordance is at least 48 CSS pixels. On desktop, press `ArrowRight` and assert Ba pixels move; press `Space` near a station and assert the same action event as pointer input. Assert the sound control remains inside the canvas at all sizes.

- [ ] **Step 2: Run probes and verify RED**

Run: `npm run heart-of-truth-visual-check -- --stage responsive`

Expected: FAIL on unimplemented keyboard or undersized touch behavior.

- [ ] **Step 3: Harden input and scaling**

Unify pointer and keyboard actions through `moveToward(x, y)` and `activateCurrentTarget()`. Scale action radii so FIT produces 48 CSS pixels at `844x390`; keep all required world targets inside safe margins. When the actual browser is portrait, render only a themed papyrus rotate prompt outside game progression; the existing Playwright resolver tests the playable landscape orientation.

- [ ] **Step 4: Verify all target viewports**

Run: `npm run heart-of-truth-visual-check -- --stage responsive`

Expected: PASS at all three resolved viewports with zero console/runtime errors.

- [ ] **Step 5: Commit hardening**

```powershell
git add scripts/game-studio/heart-of-truth-visual-check.mjs public/game-studio/games/heart-of-truth/game.js
git commit -m "fix: harden heart of truth controls"
```

### Task 7: Final Visual Review and Human Gate Handoff

**Files:**
- Create: `docs/superpowers/reports/2026-07-11-heart-of-truth-gold-gate.md`

- [ ] **Step 1: Run the complete automated safety net**

Run: `npm run heart-of-truth-check`

Expected: model, contract and visual checks pass.

Run: `npm run game-slice-check`

Expected: existing tomb/city slice checks pass unchanged.

Run: `npm run build`

Expected: TypeScript and Vite production build pass.

- [ ] **Step 2: Inspect generated screenshots**

Open every `heart-of-truth-*.png` under `scripts/visual-out/game-studio/` and verify nonblank canvas, source-art legibility, Ba visibility, no overlap, no clipped actions, useful next-step lighting, and distinct arrival/balance/gate/echo states. Revise and rerun focused checks for any visual defect.

- [ ] **Step 3: Run a human browser pass without oracle guidance**

Start `npm run dev -- --host 127.0.0.1`, open `/admin/game-studio`, select “Das Herz der Wahrheit”, and play using only what appears in the canvas. Verify pointer, keyboard, sound toggle, one-shot completion and the five Gold-Gate questions. This is a creator smoke pass, not Klaus’s acceptance test.

- [ ] **Step 4: Record status without claiming the Gold Gate passed**

Create the report with the isolated branch, asset source, changed files, exact commands/results, screenshot paths, known limitations, and status `Ready for Klaus human Gold Gate`. Explicitly state that automatic generation remains blocked.

- [ ] **Step 5: Commit final verification notes**

```powershell
git add docs/superpowers/reports/2026-07-11-heart-of-truth-gold-gate.md
git commit -m "docs: record heart of truth gold gate candidate"
```

- [ ] **Step 6: Push the feature branch and hand off the local URL**

Run: `git push -u origin feature/gold-slice`

Keep the dev server running and give Klaus the local admin-lab URL. Do not merge, deploy to production, build another world or begin generator work before the human Gold Gate result.
