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

export function reportJourneyCompletion(api, journey) {
  if (!journey.consumeCompletion()) return false;
  api.completeGoal("goal-heart-meaning", { source: "memory-echo" });
  api.completeGoal("goal-maat-truth", { source: "memory-echo" });
  api.completeGoal("goal-anubis-weighs", { source: "memory-echo" });
  api.completeGoal("goal-thoth-records", { source: "memory-echo" });
  api.completeGoal("goal-osiris-afterlife", { source: "memory-echo" });
  api.completeGame({ finalScore: 0, experience: "heart-of-truth" });
  return true;
}

export function bootMeolunaGame(context) {
  const journey = createJourneyModel();
  const width = context.width;
  const height = context.height;
  const random = mulberry32(djb2(context.seed));
  const station = {
    heart: { x: 558, y: 526 },
    feather: { x: 880, y: 526 },
    thoth: { x: 620, y: 411 },
    gate: { x: 1105, y: 510 },
  };

  class HeartOfTruthScene extends window.Phaser.Scene {
    constructor() {
      super("heart-of-truth");
      this.ba = null;
      this.firstInputSent = false;
      this.moving = false;
      this.animationLock = false;
      this.actionReady = false;
      this.currentStation = "heart";
      this.actionPulse = null;
      this.lightPath = null;
      this.caption = null;
      this.audioContext = null;
      this.soundEnabled = false;
      this.echoMotifs = null;
      this.echoGuide = null;
    }

    preload() {
      if (!context.assets.papyrus) throw new Error("Papyrus-Asset fehlt im Runtime-Kontext.");
      this.load.image("papyrus", context.assets.papyrus);
    }

    create() {
      this.cameras.main.setBackgroundColor("#120d09");
      if (window.innerHeight > window.innerWidth) {
        this.buildPortraitPrompt();
        context.api.setAffordances([], { width, height });
        context.api.emit("orientation.rotate", { requested: "landscape" });
        return;
      }
      this.buildPapyrusWorld();
      this.buildAtmosphere();
      this.buildInteractiveProps();
      this.buildSoundControl();
      this.ba = this.buildBa(170, 548);
      this.buildArrivalCue();
      this.publishMoveAffordance("heart");

      this.input.on("pointerdown", (pointer) => {
        if (this.isSoundHit(pointer.worldX, pointer.worldY)) {
          this.toggleSound();
          return;
        }
        if (this.moving || this.animationLock) return;
        this.emitFirstInput();
        if (journey.snapshot().phase === "echo") {
          this.handleEchoPointer(pointer.worldX, pointer.worldY);
          return;
        }
        const target = station[this.currentStation];
        const nearAction = window.Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, target.x, target.y) <= 76;
        if (this.actionReady && nearAction) {
          this.activateStation(this.currentStation);
          return;
        }
        this.moveToward(pointer.worldX, pointer.worldY, this.currentStation);
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
      this.input.keyboard.on("keydown-SPACE", () => {
        if (this.moving || this.animationLock || !this.actionReady) return;
        this.emitFirstInput();
        this.activateStation(this.currentStation);
      });
    }

    buildPortraitPrompt() {
      this.add.image(width / 2, height / 2, "papyrus")
        .setDisplaySize(width, 880)
        .setTint(0x8f774f)
        .setAlpha(0.9);
      this.add.rectangle(width / 2, height / 2, width, height, 0x0e0b08, 0.62);

      const phoneInk = this.add.graphics();
      phoneInk.lineStyle(8, 0xe1c46e, 0.96).strokeRoundedRect(-78, -126, 156, 252, 20);
      phoneInk.fillStyle(0xe1c46e, 0.9).fillCircle(0, 100, 7);
      phoneInk.lineStyle(7, 0x63e4dc, 0.9);
      phoneInk.beginPath().arc(0, 0, 158, -0.72, 0.72).strokePath();
      phoneInk.fillStyle(0x63e4dc, 0.95).fillTriangle(116, 106, 178, 91, 151, 145);
      this.add.container(width / 2, 315, [phoneInk]).setAngle(-90);

      this.add.text(width / 2, 534, "Drehe dein Gerät", {
        fontFamily: "Georgia, serif",
        fontSize: "54px",
        color: "#f0dd9e",
        align: "center",
        shadow: { offsetX: 0, offsetY: 3, color: "#080604", blur: 8, fill: true },
      }).setOrigin(0.5);
      this.add.text(width / 2, 597, "Diese Papyruswelt öffnet sich im Querformat.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "27px",
        color: "#b7d9cf",
        align: "center",
      }).setOrigin(0.5);
    }

    buildSoundControl() {
      const back = this.add.circle(0, 0, 33, 0x17120e, 0.62).setStrokeStyle(2, 0xd8b96d, 0.55);
      this.soundGlyph = this.add.graphics();
      this.soundControl = this.add.container(width - 62, 60, [back, this.soundGlyph]).setDepth(50);
      this.redrawSoundIcon();
    }

    redrawSoundIcon() {
      const glyph = this.soundGlyph;
      glyph.clear();
      glyph.fillStyle(0xe4ce8b, 0.95);
      glyph.fillRect(-17, -8, 8, 16);
      glyph.fillPoints([
        { x: -9, y: -8 },
        { x: 3, y: -17 },
        { x: 3, y: 17 },
        { x: -9, y: 8 },
      ], true);
      glyph.lineStyle(3, 0xe4ce8b, 0.92);
      if (this.soundEnabled) {
        glyph.beginPath().arc(4, 0, 13, -0.85, 0.85).strokePath();
        glyph.beginPath().arc(4, 0, 22, -0.78, 0.78).strokePath();
      } else {
        glyph.lineStyle(4, 0xc9a75e, 0.95).lineBetween(8, -13, 24, 13);
      }
    }

    isSoundHit(x, y) {
      return window.Phaser.Math.Distance.Between(x, y, this.soundControl.x, this.soundControl.y) <= 50;
    }

    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      if (this.soundEnabled) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !this.audioContext) this.audioContext = new AudioContextClass();
        if (this.audioContext && this.audioContext.state === "suspended") this.audioContext.resume();
      }
      this.redrawSoundIcon();
      context.api.emit("sound.changed", { enabled: this.soundEnabled });
      if (this.soundEnabled) this.playTone(392, 0.1);
    }

    soundAffordance() {
      return { id: "ui.sound", x: width - 112, y: 10, width: 100, height: 100, state: this.soundEnabled ? "on" : "muted" };
    }

    withSoundAffordance(list) {
      return [...list, this.soundAffordance()];
    }

    buildInteractiveProps() {
      this.anubisGlow = this.add.ellipse(705, 530, 176, 230, 0xd9b75f, 0)
        .setStrokeStyle(3, 0xe5c36d, 0)
        .setDepth(8);

      const heartInk = this.add.graphics();
      heartInk.fillStyle(0x6e1f25, 1);
      heartInk.fillCircle(-9, -5, 13);
      heartInk.fillCircle(9, -5, 13);
      heartInk.fillTriangle(-22, 1, 22, 1, 0, 30);
      heartInk.lineStyle(3, 0xd9b75f, 0.9);
      heartInk.strokeCircle(-9, -5, 13);
      heartInk.strokeCircle(9, -5, 13);
      heartInk.lineBetween(-21, 1, 0, 30);
      heartInk.lineBetween(21, 1, 0, 30);
      this.heartProp = this.add.container(558, 526, [heartInk]).setAlpha(0.12).setScale(0.58).setDepth(18);

      const featherInk = this.add.graphics();
      featherInk.lineStyle(4, 0xeadba5, 0.95).lineBetween(0, 29, 0, -34);
      featherInk.lineStyle(2, 0xd9b75f, 0.9);
      for (let y = -28; y <= 20; y += 8) {
        const reach = 17 - Math.abs(y + 4) * 0.18;
        featherInk.lineBetween(0, y, -reach, y + 7);
        featherInk.lineBetween(0, y, reach, y + 7);
      }
      this.featherProp = this.add.container(880, 526, [featherInk]).setAlpha(0.1).setScale(0.62).setDepth(18);

      const scaleInk = this.add.graphics();
      scaleInk.lineStyle(3, 0xd8b45f, 0.5).lineBetween(-180, 0, 180, 0);
      scaleInk.lineStyle(2, 0xd8b45f, 0.48);
      scaleInk.lineBetween(-160, 1, -160, 66);
      scaleInk.lineBetween(160, 1, 160, 66);
      scaleInk.strokeEllipse(-160, 69, 92, 18);
      scaleInk.strokeEllipse(160, 69, 92, 18);
      this.scaleRig = this.add.container(720, 456, [scaleInk]).setAlpha(0.26).setDepth(12);

      this.thothGlow = this.add.ellipse(620, 411, 112, 104, 0x4bdcd3, 0)
        .setStrokeStyle(3, 0x72e8df, 0)
        .setDepth(8);
      this.writingLine = this.add.graphics().setDepth(17);

      this.portalGlow = this.add.ellipse(1105, 505, 188, 310, 0xe5c66d, 0).setDepth(10);
      this.portalLeft = this.add.rectangle(1062, 505, 7, 238, 0xe0bd63, 0)
        .setDepth(13);
      this.portalRight = this.add.rectangle(1148, 505, 7, 238, 0xe0bd63, 0)
        .setDepth(13);
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
        .setTint(0xc0aa7d)
        .setAlpha(0.96);

      const glaze = this.add.graphics();
      glaze.fillStyle(0x061317, 0.2).fillRect(0, 0, width, height);
      glaze.fillStyle(0x07100e, 0.12).fillRoundedRect(62, 48, width - 124, height - 96, 10);

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
      ink.lineStyle(1, 0xd4b966, 0.7);
      ink.lineBetween(-25, 7, -5, 10);
      ink.lineBetween(25, 7, 5, 10);
      ink.lineBetween(-31, 0, -12, 8);
      ink.lineBetween(31, -2, 12, 8);
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
      this.tweens.add({ targets: this.lightPath, alpha: 0.42, duration: 800, yoyo: true, repeat: -1 });

      this.actionPulse = this.add.circle(target.x, target.y, 15, 0x66eee3, 0.14)
        .setStrokeStyle(2, 0x84fff2, 0.7)
        .setDepth(15);
      this.tweens.add({ targets: this.actionPulse, scale: 1.75, alpha: 0.03, duration: 850, yoyo: true, repeat: -1 });
      this.setGuide("heart");
    }

    setGuide(id) {
      const target = station[id];
      this.lightPath.clear();
      this.lightPath.lineStyle(3, 0x55e0da, 0.25);
      this.lightPath.beginPath();
      this.lightPath.moveTo(this.ba.x + 30, this.ba.y - 4);
      this.lightPath.lineTo((this.ba.x + target.x) / 2, this.ba.y - 20);
      this.lightPath.lineTo(target.x, target.y);
      this.lightPath.strokePath();
      this.actionPulse.setPosition(target.x, target.y).setFillStyle(0x66eee3, 0.14).setStrokeStyle(2, 0x84fff2, 0.7);
    }

    showActionSymbol(id) {
      const target = station[id];
      this.actionPulse.setPosition(target.x, target.y).setFillStyle(0xd8b45f, 0.22).setStrokeStyle(3, 0xf5dc88, 0.95);
      this.playTone(420, 0.07);
    }

    showCaption(text, x, y, options = {}) {
      if (this.caption) this.caption.destroy();
      this.caption = this.add.text(x, y, text, {
        fontFamily: "Georgia, serif",
        fontSize: options.size || "24px",
        color: options.color || "#f1dfac",
        align: options.align || "center",
        wordWrap: { width: options.width || 540 },
        lineSpacing: 7,
        shadow: { offsetX: 0, offsetY: 2, color: "#080604", blur: 7, fill: true },
      }).setOrigin(0.5).setDepth(30).setAlpha(0);
      this.tweens.add({ targets: this.caption, alpha: 1, y: y - 8, duration: 360, ease: "Sine.Out" });
    }

    playTone(frequency, duration) {
      if (!this.soundEnabled) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioContext) this.audioContext = new AudioContextClass();
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.065, this.audioContext.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration + 0.02);
    }

    emitFirstInput() {
      if (this.firstInputSent) return;
      this.firstInputSent = true;
      context.api.emit("first-input", { phase: journey.snapshot().phase });
    }

    publishMoveAffordance(id) {
      const target = station[id];
      context.api.setAffordances(
        this.withSoundAffordance([
          { id: `move.${id}`, x: target.x - 50, y: target.y - 50, width: 100, height: 100 },
        ]),
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
            this.actionReady = true;
            this.showActionSymbol(id);
            context.api.setAffordances(
              this.withSoundAffordance([
                { id: `action.${id}`, x: target.x - 48, y: target.y - 48, width: 96, height: 96 },
              ]),
              { width, height },
            );
          } else {
            this.publishMoveAffordance(id);
          }
        },
      });
    }

    activateStation(id) {
      const result = journey.activate(id);
      if (!result.accepted) return;
      this.actionReady = false;
      this.animationLock = true;
      context.api.setAffordances(this.withSoundAffordance([]), { width, height });
      if (id === "heart") this.animateHeart();
      if (id === "feather") this.animateFeather();
      if (id === "thoth") this.animateThoth();
      if (id === "gate") this.animateGate();
    }

    unlockNext(id) {
      const next = { heart: "feather", feather: "thoth", thoth: "gate" }[id];
      this.animationLock = false;
      if (!next) return;
      this.currentStation = next;
      this.setGuide(next);
      this.publishMoveAffordance(next);
    }

    animateHeart() {
      this.anubisGlow.setFillStyle(0xd9b75f, 0.08).setStrokeStyle(3, 0xe5c36d, 0.56);
      this.tweens.add({ targets: this.anubisGlow, alpha: 1, duration: 280 });
      this.tweens.add({
        targets: this.heartProp,
        x: 560,
        y: 518,
        scale: 0.82,
        alpha: 1,
        angle: -5,
        duration: 900,
        ease: "Back.Out",
        onComplete: () => {
          this.scaleRig.setAngle(-7);
          this.showCaption("Das Herz trug die Taten eines Menschen.", 650, 633);
          this.playTone(188, 0.24);
          context.api.emit("heart.raised", { role: "Anubis", meaning: "deeds" });
          this.unlockNext("heart");
        },
      });
    }

    animateFeather() {
      this.tweens.add({
        targets: this.featherProp,
        x: 880,
        y: 512,
        scale: 0.9,
        alpha: 1,
        angle: 6,
        duration: 820,
        ease: "Sine.InOut",
        onComplete: () => {
          this.tweens.add({
            targets: this.scaleRig,
            angle: 7,
            duration: 280,
            yoyo: true,
            repeat: 2,
            ease: "Sine.InOut",
            onComplete: () => {
              this.scaleRig.setAngle(0).setAlpha(0.9);
              this.showCaption("Ma’at stand für Wahrheit und Ordnung.", 650, 633);
              this.playTone(294, 0.3);
              context.api.emit("scale.balanced", { symbol: "Maat", value: "truth-order" });
              this.unlockNext("feather");
            },
          });
        },
      });
    }

    animateThoth() {
      this.thothGlow.setFillStyle(0x4bdcd3, 0.08).setStrokeStyle(3, 0x72e8df, 0.7);
      this.tweens.add({ targets: this.thothGlow, alpha: 1, duration: 320 });
      const nib = this.add.circle(583, 404, 4, 0xf1cf70, 1).setDepth(20);
      this.writingLine.clear().lineStyle(3, 0xe3c269, 0.88).beginPath().moveTo(583, 404);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 920,
        ease: "Sine.InOut",
        onUpdate: (tween) => {
          const progress = tween.getValue();
          const x = 583 + progress * 86;
          const y = 404 + Math.sin(progress * Math.PI * 4) * 7;
          nib.setPosition(x, y);
          this.writingLine.lineTo(x, y).strokePath().beginPath().moveTo(x, y);
        },
        onComplete: () => {
          nib.destroy();
          this.showCaption("Thoth hielt das Urteil fest.", 650, 633);
          this.playTone(520, 0.16);
          context.api.emit("thoth.recorded", { role: "Thoth", action: "recorded" });
          this.unlockNext("thoth");
        },
      });
    }

    animateGate() {
      this.portalGlow.setFillStyle(0xe5c66d, 0.22);
      this.portalLeft.setFillStyle(0xe4c46e, 0.9);
      this.portalRight.setFillStyle(0xe4c46e, 0.9);
      this.tweens.add({ targets: this.portalGlow, alpha: 0.7, scaleX: 1.3, duration: 720, ease: "Sine.Out" });
      this.tweens.add({
        targets: this.portalLeft,
        x: 1028,
        duration: 900,
        ease: "Cubic.InOut",
      });
      this.tweens.add({
        targets: this.portalRight,
        x: 1182,
        duration: 900,
        ease: "Cubic.InOut",
        onComplete: () => {
          this.showCaption("Anubis wog.  Thoth schrieb.  Osiris empfing.", 650, 633, { size: "22px", width: 680 });
          this.playTone(146, 0.42);
          this.animationLock = false;
          this.lightPath.clear();
          this.actionPulse.setVisible(false);
          this.beginEcho();
          context.api.emit("echo.ready", { sequenceLength: 3 });
        },
      });
    }

    beginEcho() {
      if (this.caption) this.caption.destroy();
      this.guidedDecor = [
        this.heartProp,
        this.featherProp,
        this.scaleRig,
        this.anubisGlow,
        this.thothGlow,
        this.portalGlow,
        this.portalLeft,
        this.portalRight,
        this.writingLine,
      ];
      this.tweens.add({ targets: this.guidedDecor, alpha: 0, duration: 420, ease: "Sine.In" });
      const veil = this.add.rectangle(width / 2, height / 2, width, height, 0x090907, 0)
        .setDepth(23);
      this.tweens.add({ targets: veil, alpha: 0.72, duration: 650, ease: "Sine.Out" });

      const title = this.add.text(width / 2, 172, "", {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#dbc47e",
      }).setOrigin(0.5).setDepth(29);
      title.setText("Erinnere dich an den Weg der Wahrheit").setAlpha(0);
      this.tweens.add({ targets: title, alpha: 0.9, y: 162, duration: 650, ease: "Sine.Out" });

      const motifHeart = this.makeEchoHeart(330, 410);
      const motifFeather = this.makeEchoFeather(640, 410);
      const motifTablet = this.makeEchoTablet(950, 410);
      this.echoMotifs = {
        heart: motifHeart,
        feather: motifFeather,
        tablet: motifTablet,
      };
      this.echoVeil = veil;
      this.echoTitle = title;
      this.ba.setDepth(34);
      this.echoGuide = this.add.graphics().setDepth(31);
      this.setEchoGuide();
      this.publishEchoAffordances();
    }

    makeEchoHeart(x, y) {
      const glow = this.add.circle(0, 0, 86, 0x49dcd3, 0.08).setStrokeStyle(2, 0x6de9df, 0.35);
      const ink = this.add.graphics();
      ink.fillStyle(0x7b252d, 1).fillCircle(-20, -12, 29).fillCircle(20, -12, 29);
      ink.fillTriangle(-48, 2, 48, 2, 0, 69);
      ink.lineStyle(5, 0xe1c36c, 0.92).strokeCircle(-20, -12, 29).strokeCircle(20, -12, 29);
      ink.lineBetween(-47, 2, 0, 69).lineBetween(47, 2, 0, 69);
      const motif = this.add.container(x, y, [glow, ink]).setDepth(32).setAlpha(0);
      this.tweens.add({ targets: motif, alpha: 1, y: y - 8, duration: 720, ease: "Back.Out" });
      this.tweens.add({ targets: glow, scale: 1.08, alpha: 0.03, duration: 1050, yoyo: true, repeat: -1 });
      return motif;
    }

    makeEchoFeather(x, y) {
      const glow = this.add.circle(0, 0, 86, 0x49dcd3, 0.08).setStrokeStyle(2, 0x6de9df, 0.35);
      const ink = this.add.graphics();
      ink.lineStyle(8, 0xeadba5, 0.96).lineBetween(0, 71, 0, -72);
      ink.lineStyle(4, 0xdfbd62, 0.95);
      for (let py = -62; py <= 50; py += 15) {
        const reach = 42 - Math.abs(py + 4) * 0.23;
        ink.lineBetween(0, py, -reach, py + 16).lineBetween(0, py, reach, py + 16);
      }
      const motif = this.add.container(x, y, [glow, ink]).setDepth(32).setAlpha(0);
      this.tweens.add({ targets: motif, alpha: 1, y: y - 8, duration: 720, delay: 110, ease: "Back.Out" });
      this.tweens.add({ targets: glow, scale: 1.08, alpha: 0.03, duration: 1050, delay: 170, yoyo: true, repeat: -1 });
      return motif;
    }

    makeEchoTablet(x, y) {
      const glow = this.add.circle(0, 0, 86, 0x49dcd3, 0.08).setStrokeStyle(2, 0x6de9df, 0.35);
      const ink = this.add.graphics();
      ink.fillStyle(0xaa864d, 0.96).fillPoints([
        { x: -54, y: -67 },
        { x: 50, y: -61 },
        { x: 57, y: 56 },
        { x: -48, y: 69 },
      ], true);
      ink.lineStyle(4, 0xe0c169, 0.92).strokePoints([
        { x: -54, y: -67 },
        { x: 50, y: -61 },
        { x: 57, y: 56 },
        { x: -48, y: 69 },
      ], true);
      ink.lineStyle(5, 0x2d2419, 0.78);
      ink.lineBetween(-31, -36, 30, -31).lineBetween(-29, -6, 21, -2).lineBetween(-27, 24, 35, 31);
      const motif = this.add.container(x, y, [glow, ink]).setDepth(32).setAlpha(0);
      this.tweens.add({ targets: motif, alpha: 1, y: y - 8, duration: 720, delay: 220, ease: "Back.Out" });
      this.tweens.add({ targets: glow, scale: 1.08, alpha: 0.03, duration: 1050, delay: 340, yoyo: true, repeat: -1 });
      return motif;
    }

    publishEchoAffordances() {
      const activeIndex = journey.snapshot().echoIndex;
      const activeId = ECHO_SEQUENCE[activeIndex];
      context.api.setAffordances(
        this.withSoundAffordance(
          Object.entries(this.echoMotifs).map(([id, motif]) => ({
            id: `echo.${id}`,
            x: motif.x - 70,
            y: motif.y - 78,
            width: 140,
            height: 156,
            state: id === activeId ? "active" : "waiting",
          })),
        ),
        { width, height },
      );
    }

    setEchoGuide() {
      const activeId = ECHO_SEQUENCE[journey.snapshot().echoIndex];
      const target = this.echoMotifs[activeId];
      this.echoGuide.clear().lineStyle(4, 0x62e7de, 0.4).beginPath();
      this.echoGuide.moveTo(this.ba.x, this.ba.y).lineTo((this.ba.x + target.x) / 2, target.y + 78).lineTo(target.x, target.y);
      this.echoGuide.strokePath();
    }

    handleEchoPointer(x, y) {
      const chosen = Object.entries(this.echoMotifs).find(([, motif]) =>
        window.Phaser.Math.Distance.Between(x, y, motif.x, motif.y) <= 96,
      );
      if (!chosen) return;
      this.chooseEcho(chosen[0]);
    }

    chooseEcho(id) {
      const motif = this.echoMotifs[id];
      this.animationLock = true;
      this.echoGuide.clear();
      this.tweens.add({
        targets: this.ba,
        x: motif.x,
        y: motif.y + 112,
        duration: 620,
        ease: "Sine.InOut",
        onComplete: () => {
          const result = journey.remember(id);
          if (!result.accepted) {
            this.tweens.add({
              targets: motif,
              x: "+=9",
              duration: 90,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                this.animationLock = false;
                this.setEchoGuide();
                this.publishEchoAffordances();
                context.api.emit("echo.miss", { chosen: id, progress: journey.snapshot().echoIndex });
              },
            });
            return;
          }

          this.playTone(340 + journey.snapshot().echoIndex * 80, 0.18);
          this.tweens.add({ targets: motif, scale: 1.12, alpha: 0.48, duration: 260, yoyo: true });
          context.api.emit("echo.accepted", { chosen: id, progress: journey.snapshot().echoIndex });
          if (result.phase === "complete") {
            this.finishEcho();
            return;
          }
          this.animationLock = false;
          this.setEchoGuide();
          this.publishEchoAffordances();
        },
      });
    }

    finishEcho() {
      context.api.setAffordances(this.withSoundAffordance([]), { width, height });
      this.echoGuide.clear();
      const motifs = Object.values(this.echoMotifs);
      this.tweens.add({ targets: motifs, alpha: 0, y: "-=18", duration: 560, ease: "Sine.In" });
      this.tweens.add({ targets: [this.echoVeil, this.echoTitle], alpha: 0, duration: 760, ease: "Sine.In" });
      this.tweens.add({
        targets: this.papyrus,
        alpha: 1,
        duration: 900,
        onComplete: () => {
          this.showCaption("Das Herz sprach wahr. Der Weg zu Osiris ist offen.", width / 2, 635, { width: 760 });
          this.completeJourney();
          context.api.emit("echo.complete", { goals: GOAL_IDS.slice() });
          this.animationLock = false;
        },
      });
    }

    completeJourney() {
      return reportJourneyCompletion(context.api, journey);
    }

    update(_time, delta) {
      if (!this.ba || this.moving || this.animationLock) return;
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
