import assert from "node:assert/strict";
import {
  createJourneyModel,
  reportJourneyCompletion,
} from "../../public/game-studio/games/heart-of-truth/game.js";

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

const reportingJourney = createJourneyModel();
for (const id of ["heart", "feather", "thoth", "gate"]) reportingJourney.activate(id);
assert.equal(reportingJourney.remember("feather").accepted, false);
assert.equal(reportingJourney.remember("heart").accepted, true);
assert.equal(reportingJourney.remember("heart").accepted, false);
assert.equal(reportingJourney.snapshot().echoIndex, 1);
assert.equal(reportingJourney.remember("feather").accepted, true);
assert.equal(reportingJourney.remember("tablet").accepted, true);

const events = [];
const api = {
  completeGoal: (goalId, evidence) => events.push({ type: "goal", goalId, evidence }),
  completeGame: (summary) => events.push({ type: "complete", summary }),
};

assert.equal(reportJourneyCompletion(api, reportingJourney), true);
assert.equal(reportJourneyCompletion(api, reportingJourney), false);
assert.equal(events.filter((event) => event.type === "goal").length, 5);
assert.equal(
  new Set(events.filter((event) => event.type === "goal").map((event) => event.goalId)).size,
  5,
);
assert.equal(events.filter((event) => event.type === "complete").length, 1);

console.log("OK");
