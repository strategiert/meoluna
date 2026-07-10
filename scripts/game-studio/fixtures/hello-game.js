// Testspiel für Runtime- und Playthrough-Checks. KEIN Produktionsspiel.
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootMeolunaGame(context) {
  const rnd = mulberry32(djb2(context.seed));
  const W = context.width, H = context.height;
  let stars = [];
  let found = 0;
  let started = false;

  class MainScene extends window.Phaser.Scene {
    create() {
      const g = this.add.graphics();
      g.fillStyle(0x1a1a2e, 1).fillRect(0, 0, W, H);
      const startBtn = this.add.rectangle(W / 2, H / 2, 300, 120, 0x4a7c59).setInteractive();
      const label = this.add.text(W / 2, H / 2, "Start", { fontSize: "48px", color: "#ffffff" }).setOrigin(0.5);
      context.api.setAffordances([{ id: "hello.start", x: W / 2 - 150, y: H / 2 - 60, width: 300, height: 120 }], { width: W, height: H });
      startBtn.on("pointerdown", () => {
        if (started) return;
        started = true;
        startBtn.destroy(); label.destroy();
        context.api.emit("game:started", {});
        for (let i = 0; i < 3; i += 1) {
          const x = 160 + Math.floor(rnd() * (W - 320));
          const y = 160 + Math.floor(rnd() * (H - 320));
          const star = this.add.star(x, y, 5, 24, 56, 0xffd166).setInteractive();
          stars.push({ id: `hello.star-${i + 1}`, x: x - 56, y: y - 56, width: 112, height: 112, obj: star });
          star.on("pointerdown", () => {
            star.destroy();
            found += 1;
            context.api.reportScore(10, { star: i + 1 });
            stars = stars.filter((s) => s.obj !== star);
            context.api.setAffordances(stars.map(({ id, x: ax, y: ay, width, height }) => ({ id, x: ax, y: ay, width, height })), { width: W, height: H });
            if (found === 3) {
              context.api.completeGoal("goal-demo", { found });
              context.api.completeGame({ finalScore: 30 });
            }
          });
        }
        context.api.setAffordances(stars.map(({ id, x: ax, y: ay, width, height }) => ({ id, x: ax, y: ay, width, height })), { width: W, height: H });
      });
    }
  }

  new window.Phaser.Game({
    type: window.Phaser.AUTO,
    parent: context.parentId,
    width: W,
    height: H,
    scale: { mode: window.Phaser.Scale.FIT, autoCenter: window.Phaser.Scale.CENTER_BOTH },
    backgroundColor: "#0a0a14",
    scene: [MainScene],
  });
}
