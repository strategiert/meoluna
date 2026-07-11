import assert from "node:assert/strict";
import { createJourneyModel } from "../../public/game-studio/games/heart-of-truth/game.js";

const journey = createJourneyModel();

assert.equal(journey.snapshot().phase, "arrival");
assert.equal(journey.activate("feather").accepted, false);
assert.equal(journey.snapshot().phase, "arrival");

for (const id of ["heart", "feather", "thoth", "gate"]) {
  assert.equal(journey.activate(id).accepted, true, id);
}

assert.equal(journey.snapshot().phase, "echo");
assert.equal(journey.remember("tablet").accepted, false);
assert.equal(journey.snapshot().echoIndex, 0);

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
