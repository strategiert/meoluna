const GOAL_IDS = [
  "goal-heart-meaning",
  "goal-maat-truth",
  "goal-anubis-weighs",
  "goal-thoth-records",
  "goal-osiris-afterlife",
];

const GUIDED_STATIONS = ["heart", "feather", "thoth", "gate"];
const ECHO_SEQUENCE = ["heart", "feather", "tablet"];

export function createJourneyModel() {
  let guidedIndex = 0;
  let echoIndex = 0;
  let phase = "arrival";
  let completionAvailable = false;
  let completionConsumed = false;

  return {
    activate(id) {
      if (phase === "arrival" && id === GUIDED_STATIONS[0]) phase = "guided";
      if (phase !== "guided" || id !== GUIDED_STATIONS[guidedIndex]) {
        return { accepted: false, phase };
      }

      guidedIndex += 1;
      if (guidedIndex === GUIDED_STATIONS.length) phase = "echo";
      return { accepted: true, phase };
    },

    remember(id) {
      if (phase !== "echo" || id !== ECHO_SEQUENCE[echoIndex]) {
        return { accepted: false, phase };
      }

      echoIndex += 1;
      if (echoIndex === ECHO_SEQUENCE.length) {
        phase = "complete";
        completionAvailable = true;
      }
      return { accepted: true, phase };
    },

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

export function bootMeolunaGame(context) {
  const journey = createJourneyModel();
  const width = context.width;
  const height = context.height;

  class HeartOfTruthScene extends window.Phaser.Scene {
    create() {
      this.add.rectangle(width / 2, height / 2, width, height, 0x17100c);
      context.api.setAffordances(
        [{ id: "move.heart", x: width / 2 - 48, y: height / 2 - 48, width: 96, height: 96 }],
        { width, height },
      );

      if (journey.snapshot().phase === "complete" && journey.consumeCompletion()) {
        context.api.completeGoal("goal-heart-meaning", { source: "memory-echo" });
        context.api.completeGoal("goal-maat-truth", { source: "memory-echo" });
        context.api.completeGoal("goal-anubis-weighs", { source: "memory-echo" });
        context.api.completeGoal("goal-thoth-records", { source: "memory-echo" });
        context.api.completeGoal("goal-osiris-afterlife", { source: "memory-echo" });
        context.api.completeGame({ finalScore: 0, experience: "heart-of-truth" });
      }
    }
  }

  new window.Phaser.Game({
    type: window.Phaser.AUTO,
    parent: context.parentId,
    width,
    height,
    scale: { mode: window.Phaser.Scale.FIT, autoCenter: window.Phaser.Scale.CENTER_BOTH },
    backgroundColor: "#17100c",
    scene: [HeartOfTruthScene],
  });
}
