const GOAL_IDS = [
  "goal-heart-meaning",
  "goal-maat-truth",
  "goal-anubis-weighs",
  "goal-thoth-records",
  "goal-osiris-afterlife",
];

const GUIDED_STATIONS = ["heart", "feather", "thoth", "gate"];
const ECHO_SEQUENCE = ["heart", "feather", "tablet"];

function djb2(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

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
  const random = mulberry32(djb2(context.seed));
  const station = {
    heart: { x: 687, y: 455 },
    feather: { x: 780, y: 446 },
    thoth: { x: 592, y: 500 },
    gate: { x: 1060, y: 463 },
  };

  class HeartOfTruthScene extends window.Phaser.Scene {
    constructor() {
      super("heart-of-truth");
      this.ba = null;
      this.firstInputSent = false;
      this.moving = false;
      this.actionPulse = null;
      this.lightPath = null;
    }

    preload() {
      if (!context.assets.papyrus) throw new Error("Papyrus-Asset fehlt im Runtime-Kontext.");
      this.load.image("papyrus", context.assets.papyrus);
    }

    create() {
      this.cameras.main.setBackgroundColor("#120d09");
      this.buildPapyrusWorld();
      this.buildAtmosphere();
      this.ba = this.buildBa(170, 548);
      this.buildArrivalCue();
      this.publishMoveAffordance("heart");

      this.input.on("pointerdown", (pointer) => {
        if (this.moving) return;
        this.emitFirstInput();
        this.moveToward(pointer.worldX, pointer.worldY, "heart");
      });

      this.keys = this.input.keyboard.addKeys({
        up: "UP",
        down: "DOWN",
        left: "LEFT",
        right: "RIGHT",
        w: "W",
        a: "A",
        s: "S",
        d: "D",
        action: "SPACE",
      });
    }

    buildPapyrusWorld() {
      const underlay = this.add.graphics();
      underlay.fillStyle(0x21150d, 1).fillRect(0, 0, width, height);
      underlay.fillStyle(0x52341b, 0.55).fillRoundedRect(34, 24, width - 68, height - 48, 16);
      underlay.lineStyle(2, 0xb98b45, 0.28).strokeRoundedRect(43, 33, width - 86, height - 66, 12);

      this.papyrusShadow = this.add.image(width / 2 + 9, height / 2 + 12, "papyrus")
        .setDisplaySize(1190, 818)
        .setTint(0x2b170c)
        .setAlpha(0.66);
      this.papyrus = this.add.image(width / 2, height / 2, "papyrus")
        .setDisplaySize(1180, 808)
        .setTint(0x8d7756)
        .setAlpha(0.9);

      const glaze = this.add.graphics();
      glaze.fillStyle(0x061317, 0.38).fillRect(0, 0, width, height);
      glaze.fillStyle(0x07100e, 0.28).fillRoundedRect(62, 48, width - 124, height - 96, 10);

      this.tweens.add({
        targets: [this.papyrus, this.papyrusShadow],
        y: "+=5",
        duration: 4600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });

      this.add.text(72, 62, "DAS HERZ DER WAHRHEIT", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#d8b76d",
      }).setAlpha(0.8);
      this.add.text(72, 87, "Ein Papyrus der Nauny · um 1050 v. Chr.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#a99677",
      }).setAlpha(0.78);
    }

    buildAtmosphere() {
      const vignette = this.add.graphics();
      vignette.fillStyle(0x080604, 0.62).fillRect(0, 0, 46, height);
      vignette.fillStyle(0x080604, 0.62).fillRect(width - 46, 0, 46, height);
      vignette.fillStyle(0x080604, 0.4).fillRect(0, 0, width, 28);
      vignette.fillStyle(0x080604, 0.48).fillRect(0, height - 34, width, 34);

      for (let index = 0; index < 26; index += 1) {
        const mote = this.add.circle(
          70 + random() * (width - 140),
          45 + random() * (height - 90),
          0.8 + random() * 1.8,
          index % 3 === 0 ? 0x72d8d0 : 0xd9b86b,
          0.1 + random() * 0.22,
        );
        this.tweens.add({
          targets: mote,
          y: `-=${8 + random() * 18}`,
          x: `+=${-6 + random() * 12}`,
          alpha: { from: mote.alpha, to: 0.03 },
          duration: 2400 + random() * 2800,
          delay: random() * 1700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });
      }
    }

    buildBa(x, y) {
      const glowOuter = this.add.circle(0, 0, 48, 0x3ed9d0, 0.08).setBlendMode("ADD");
      const glow = this.add.circle(0, 0, 27, 0x6ff7e9, 0.18).setBlendMode("ADD");
      const ink = this.add.graphics();
      ink.fillStyle(0x13292a, 0.96);
      ink.fillEllipse(0, 8, 50, 25);
      ink.fillTriangle(-8, 7, -47, -10, -31, 20);
      ink.fillTriangle(8, 7, 45, -18, 30, 19);
      ink.lineStyle(3, 0x74e4d9, 0.9);
      ink.strokeEllipse(0, 8, 50, 25);
      ink.lineBetween(-6, 16, -13, 37);
      ink.lineBetween(7, 16, 13, 37);
      ink.fillStyle(0xc89f66, 1).fillCircle(0, -13, 11);
      ink.lineStyle(2, 0x2d1d14, 0.9).strokeCircle(0, -13, 11);
      ink.lineBetween(-6, -6, -12, 1);
      ink.lineBetween(6, -6, 12, 1);
      ink.fillStyle(0x142224, 1).fillTriangle(-10, -20, 0, -37, 10, -20);
      const eye = this.add.circle(3, -15, 1.5, 0xf2d68b, 1);

      const ba = this.add.container(x, y, [glowOuter, glow, ink, eye]).setDepth(20);
      this.tweens.add({ targets: ba, y: "-=7", duration: 900, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      this.tweens.add({ targets: glowOuter, scale: 1.18, alpha: 0.03, duration: 1150, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      return ba;
    }

    buildArrivalCue() {
      const target = station.heart;
      this.lightPath = this.add.graphics().setDepth(14);
      this.lightPath.lineStyle(3, 0x55e0da, 0.24);
      this.lightPath.beginPath();
      this.lightPath.moveTo(this.ba.x + 34, this.ba.y - 4);
      this.lightPath.lineTo(350, 505);
      this.lightPath.lineTo(515, 472);
      this.lightPath.lineTo(target.x, target.y);
      this.lightPath.strokePath();
      this.tweens.add({ targets: this.lightPath, alpha: 0.42, duration: 800, yoyo: true, repeat: -1 });

      this.actionPulse = this.add.circle(target.x, target.y, 15, 0x66eee3, 0.14)
        .setStrokeStyle(2, 0x84fff2, 0.7)
        .setDepth(15);
      this.tweens.add({ targets: this.actionPulse, scale: 1.75, alpha: 0.03, duration: 850, yoyo: true, repeat: -1 });
    }

    emitFirstInput() {
      if (this.firstInputSent) return;
      this.firstInputSent = true;
      context.api.emit("first-input", { phase: journey.snapshot().phase });
    }

    publishMoveAffordance(id) {
      const target = station[id];
      context.api.setAffordances(
        [{ id: `move.${id}`, x: target.x - 50, y: target.y - 50, width: 100, height: 100 }],
        { width, height },
      );
    }

    moveToward(x, y, id) {
      const target = station[id];
      const destinationX = Math.max(92, Math.min(width - 92, x));
      const destinationY = Math.max(112, Math.min(height - 80, y));
      const distance = window.Phaser.Math.Distance.Between(this.ba.x, this.ba.y, destinationX, destinationY);
      this.moving = true;
      this.ba.setScale(destinationX < this.ba.x ? -1 : 1, 1);
      this.tweens.add({
        targets: this.ba,
        x: destinationX,
        y: destinationY,
        duration: Math.max(420, Math.min(1250, distance * 1.7)),
        ease: "Sine.InOut",
        onComplete: () => {
          this.moving = false;
          this.ba.setScale(1);
          if (window.Phaser.Math.Distance.Between(this.ba.x, this.ba.y, target.x, target.y) <= 78) {
            context.api.setAffordances(
              [{ id: `action.${id}`, x: target.x - 48, y: target.y - 48, width: 96, height: 96 }],
              { width, height },
            );
          } else {
            this.publishMoveAffordance(id);
          }
        },
      });
    }

    completeJourney() {
      if (!journey.consumeCompletion()) return false;
      context.api.completeGoal("goal-heart-meaning", { source: "memory-echo" });
      context.api.completeGoal("goal-maat-truth", { source: "memory-echo" });
      context.api.completeGoal("goal-anubis-weighs", { source: "memory-echo" });
      context.api.completeGoal("goal-thoth-records", { source: "memory-echo" });
      context.api.completeGoal("goal-osiris-afterlife", { source: "memory-echo" });
      context.api.completeGame({ finalScore: 0, experience: "heart-of-truth" });
      return true;
    }

    update(_time, delta) {
      if (!this.ba || this.moving) return;
      const horizontal = Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown);
      const vertical = Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown);
      if (!horizontal && !vertical) return;
      this.emitFirstInput();
      const speed = 0.28 * delta;
      this.ba.x = window.Phaser.Math.Clamp(this.ba.x + horizontal * speed, 70, width - 70);
      this.ba.y = window.Phaser.Math.Clamp(this.ba.y + vertical * speed, 90, height - 65);
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
