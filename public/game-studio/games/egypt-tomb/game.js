// Meoluna Game Studio — Spiel A: "Das Siegel des vergessenen Schreibers"
// Top-down Archaeologie-Mystery, Basis 960x960. Ein ES-Modul, Phaser ueber window.Phaser.
// Zufall NUR ueber seeded PRNG (djb2 + mulberry32), Zeit NUR ueber die Phaser-Clock/Tweens.

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
  const Ph = window.Phaser;
  const W = context.width, H = context.height;

  // Sandstein-Palette und Grabatmosphaere.
  const COL = {
    bgTop: 0x241a10,
    bgFloor: 0x3a2c1c,
    stoneLight: 0xc2a878,
    stoneDark: 0x8a6f4d,
    torch: 0xffb24a,
    torchSoft: 0xffd79a,
    gold: 0xf4c430,
    water: 0x3a7ca5,
    waterDeep: 0x27567a,
    papyrus: 0xe8dcc0,
    ink: 0x3a2a18,
    green: 0x6b8f3a,
    good: 0x7bbf6a,
    bad: 0xb05a3a,
  };

  // Zentraler Spielzustand ueber alle Kammern hinweg.
  const G = {
    api: context.api,
    rnd: mulberry32(djb2(context.seed)),
    torch: 3,
    score: 0,
    journal: [],
    journalOpen: false,
    completed: false,
    soundOn: false,
    audio: null,
    game: null,
    chamberAff: [],
    hudRefresh: null,
  };

  function speak(text) { if (text) G.api.speak(String(text).slice(0, 480)); }

  function addScore(n, ctx) { G.score += n; G.api.reportScore(n, ctx || {}); }

  function addJournal(entry) {
    if (!G.journal.some((e) => e.id === entry.id)) G.journal.push(entry);
  }

  // --- Audio: WebAudio-Synthese, startet stumm, erst nach Nutzergeste hoerbar. ---
  function ensureAudio() {
    if (G.audio) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) G.audio = new AC();
  }
  function tone(freq, dur, type, gain, when) {
    if (!G.soundOn || !G.audio) return;
    const ac = G.audio;
    const t = ac.currentTime + (when || 0);
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || "triangle";
    o.frequency.value = freq;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(Math.max(0.0001, gain || 0.08), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  G.click = () => tone(210, 0.06, "square", 0.05);
  G.good = () => { tone(523, 0.12, "triangle", 0.07); tone(659, 0.12, "triangle", 0.07, 0.09); };
  G.win = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.08, i * 0.11)); };
  G.miss = () => { tone(180, 0.18, "sawtooth", 0.05); tone(120, 0.22, "sawtooth", 0.05, 0.05); };

  // --- Affordance-Manager: nach jedem Zustandswechsel den KOMPLETTEN aktuellen Satz senden. ---
  function uiAff(id, cx, cy, w, h) { return { id, x: cx - w / 2, y: cy - h / 2, width: w, height: h }; }
  G.publish = function (chamberAff) {
    if (chamberAff) G.chamberAff = chamberAff;
    let list;
    if (G.journalOpen) {
      list = [uiAff("ui.journal-close", 760, 150, 220, 120)];
    } else {
      list = G.chamberAff.slice();
      list.push(uiAff("ui.journal", 150, 78, 220, 116));
    }
    list.push(uiAff("ui.sound-toggle", 858, 78, 150, 116));
    G.api.setAffordances(list, { width: W, height: H });
  };

  // --- Piktogramme: klare Vektor-Silhouetten (Geometrie-Fallback, kein Asset noetig). ---
  function pic(scene, type, s) {
    const c = scene.add.container(0, 0);
    const add = (o) => { c.add(o); return o; };
    if (type === "sonne") {
      add(scene.add.star(0, 0, 12, s * 0.28, s * 0.5, COL.gold));
      add(scene.add.circle(0, 0, s * 0.3, 0xffe08a));
    } else if (type === "wasser") {
      const g = scene.add.graphics();
      g.lineStyle(Math.max(4, s * 0.07), COL.water, 1);
      for (let r = -1; r <= 1; r += 1) {
        const y = r * s * 0.2;
        g.beginPath();
        for (let i = 0; i <= 24; i += 1) {
          const x = -s * 0.42 + s * 0.84 * (i / 24);
          const yy = y + Math.sin((i / 24) * Math.PI * 3) * s * 0.09;
          if (i === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
        }
        g.strokePath();
      }
      add(g);
    } else if (type === "brot") {
      add(scene.add.ellipse(0, s * 0.06, s * 0.72, s * 0.44, 0xc98a3c));
      add(scene.add.ellipse(0, -s * 0.06, s * 0.6, s * 0.34, 0xe0a860));
    } else if (type === "schreiber") {
      add(scene.add.rectangle(0, 0, s * 0.56, s * 0.7, COL.papyrus).setStrokeStyle(3, COL.stoneDark));
      const g = scene.add.graphics();
      g.lineStyle(3, COL.ink, 1);
      for (let i = -1; i <= 2; i += 1) { g.beginPath(); g.moveTo(-s * 0.2, i * s * 0.14); g.lineTo(s * 0.2, i * s * 0.14); g.strokePath(); }
      add(g);
      add(scene.add.rectangle(s * 0.26, -s * 0.1, s * 0.05, s * 0.5, COL.stoneDark).setRotation(0.5));
    } else if (type === "pharao") {
      add(scene.add.triangle(0, -s * 0.32, 0, s * 0.24, -s * 0.16, -s * 0.28, s * 0.16, -s * 0.28, COL.gold));
      add(scene.add.circle(0, -s * 0.05, s * 0.16, 0xdcb98c));
      add(scene.add.circle(0, -s * 0.44, s * 0.05, COL.bad));
      const sh = scene.add.polygon(0, s * 0.2, [-s * 0.34, s * 0.24, s * 0.34, s * 0.24, s * 0.2, -s * 0.12, -s * 0.2, -s * 0.12], 0x2f6fb0);
      add(sh);
    } else if (type === "kanope") {
      add(scene.add.ellipse(0, s * 0.12, s * 0.5, s * 0.56, 0xbfa76f).setStrokeStyle(3, COL.stoneDark));
      add(scene.add.ellipse(0, -s * 0.24, s * 0.34, s * 0.26, COL.stoneDark));
      add(scene.add.triangle(-s * 0.12, -s * 0.36, 0, 0, -s * 0.08, -s * 0.16, s * 0.04, 0, COL.stoneDark));
      add(scene.add.triangle(s * 0.12, -s * 0.36, 0, 0, s * 0.08, -s * 0.16, -s * 0.04, 0, COL.stoneDark));
    } else if (type === "bauer") {
      for (let i = -2; i <= 2; i += 1) {
        add(scene.add.rectangle(i * s * 0.09, -s * 0.05, s * 0.05, s * 0.6, 0xd9a441).setRotation(i * 0.14));
      }
      add(scene.add.rectangle(0, s * 0.16, s * 0.5, s * 0.09, COL.stoneDark));
    } else if (type === "falle-1") {
      add(scene.add.ellipse(0, s * 0.05, s * 0.5, s * 0.3, COL.stoneDark));
      add(scene.add.circle(-s * 0.22, -s * 0.1, s * 0.12, COL.stoneDark));
      add(scene.add.triangle(-s * 0.38, -s * 0.1, 0, 0, -s * 0.14, -s * 0.06, -s * 0.14, s * 0.06, COL.stoneDark));
      add(scene.add.triangle(s * 0.05, -s * 0.02, 0, 0, s * 0.28, -s * 0.24, s * 0.32, s * 0.02, COL.stoneLight));
    } else if (type === "falle-2") {
      const g = scene.add.graphics();
      g.lineStyle(Math.max(6, s * 0.12), COL.green, 1);
      g.beginPath();
      for (let i = 0; i <= 24; i += 1) {
        const y = -s * 0.34 + s * 0.68 * (i / 24);
        const x = Math.sin((i / 24) * Math.PI * 3) * s * 0.22;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokePath();
      add(g);
      add(scene.add.circle(Math.sin(0) * s * 0.22, -s * 0.34, s * 0.1, COL.green));
    }
    return c;
  }

  // Kleiner Alltags-Szenen-Marker fuer die Torschloesser (Beobachtung, kein Text).
  function sceneMarker(scene, key, s) {
    const c = scene.add.container(0, 0);
    if (key === "brot") { c.add(scene.add.circle(0, s * 0.18, s * 0.1, 0xdcb98c)); c.add(pic(scene, "brot", s * 0.8)); }
    else if (key === "wasser") { c.add(pic(scene, "wasser", s)); }
    else if (key === "sonne") { c.add(pic(scene, "sonne", s * 0.8)); }
    return c;
  }

  // --- Basis-Kammer: Hintergrund, Fackellicht, Staub, Titel. ---
  class BaseChamber extends Ph.Scene {
    buildBackdrop(titleText) {
      this.add.rectangle(W / 2, H / 2, W, H, COL.bgTop);
      this.add.rectangle(W / 2, H * 0.62, W, H * 0.76, COL.bgFloor);
      const bricks = this.add.graphics();
      bricks.lineStyle(2, 0x000000, 0.18);
      for (let y = 160; y < H; y += 120) { bricks.beginPath(); bricks.moveTo(0, y); bricks.lineTo(W, y); bricks.strokePath(); }
      for (let x = 0; x < W; x += 160) { bricks.beginPath(); bricks.moveTo(x, 160); bricks.lineTo(x, H); bricks.strokePath(); }

      // Fackellicht als geschichtete Kreise, Flackern ueber Tween auf den Container.
      const glow = this.add.container(W / 2, H * 0.5);
      glow.add(this.add.circle(0, 0, W * 0.62, COL.torch, 0.05));
      glow.add(this.add.circle(0, 0, W * 0.44, COL.torch, 0.06));
      glow.add(this.add.circle(0, 0, W * 0.26, COL.torchSoft, 0.07));
      glow.setDepth(2);
      this.tweens.add({ targets: glow, alpha: { from: 0.85, to: 1 }, scale: { from: 0.97, to: 1.03 },
        duration: 900 + Math.floor(G.rnd() * 400), yoyo: true, repeat: -1, ease: "Sine.inOut" });

      // Staub: wenige Partikel, langsam driftend (guenstig fuer die Perf-Probe).
      for (let i = 0; i < 6; i += 1) {
        const dx = 120 + G.rnd() * (W - 240);
        const dy = 220 + G.rnd() * (H - 380);
        const d = this.add.circle(dx, dy, 2 + G.rnd() * 2, 0xffe9c4, 0.5).setDepth(3);
        this.tweens.add({ targets: d, y: dy - 40 - G.rnd() * 40, alpha: { from: 0.5, to: 0.1 },
          duration: 4000 + G.rnd() * 3000, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      }

      this.add.text(W / 2, 178, titleText, { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "34px", color: "#f2e2c2", fontStyle: "bold" }).setOrigin(0.5).setDepth(5);
    }

    // Interaktiver, unsichtbarer Treffer-Bereich; Visuals liegen separat darunter (nicht interaktiv).
    hit(cx, cy, w, h, onTap) {
      const r = this.add.rectangle(cx, cy, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(70);
      r.on("pointerdown", () => { G.click(); onTap(); });
      return r;
    }

    // Persistente Treffer-Bereiche: einmal erzeugt, danach nur noch aktiviert/deaktiviert.
    // So bleiben Ziele bei schnellen Tap-Folgen stabil (kein Zerstoeren/Neu-Erzeugen pro Zustand).
    initButtons() { this._btns = {}; }
    btn(id, cx, cy, w, h, onTap) {
      const r = this.add.rectangle(cx, cy, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(70);
      r._geo = { cx, cy, w, h };
      r.input.enabled = false;
      r.on("pointerdown", () => { if (!r.input || !r.input.enabled) return; G.click(); onTap(); });
      this._btns[id] = r;
      return r;
    }
    publishActive(ids) {
      const aff = [];
      Object.keys(this._btns).forEach((id) => {
        const r = this._btns[id];
        const on = ids.indexOf(id) >= 0;
        r.input.enabled = on;
        if (on) aff.push({ id, x: r._geo.cx - r._geo.w / 2, y: r._geo.cy - r._geo.h / 2, width: r._geo.w, height: r._geo.h });
      });
      G.publish(aff);
    }

    // Kammer wechseln, HUD oben halten.
    goto(key) { this.scene.start(key); this.scene.bringToTop("UI"); }
  }

  // ===================== KAMMER 1 — Kammer der Zeichen =====================
  const MURALS = [
    { id: "c1.mural-1", type: "brot", scene: "brot", head: "Der Baecker", text: "Der Baecker formt Brot fuer die Vorratskammern. Sein Zeichen ist der Laib." },
    { id: "c1.mural-2", type: "wasser", scene: "wasser", head: "Der Fluss", text: "Der Nil bringt das Wasser. Sein Zeichen sind drei Wellen." },
    { id: "c1.mural-3", type: "sonne", scene: "sonne", head: "Der Tag", text: "Die Sonne steht ueber dem Tag. Ihr Zeichen ist die Scheibe mit Strahlen." },
    { id: "c1.mural-4", type: "schreiber", scene: "schreiber", head: "Der Schreiber", text: "Der Schreiber fuehrt Listen ueber Vorraete und Arbeiter. Nur wenige konnten das." },
  ];
  const GATE_SLOTS = [
    { id: "c1.gate-slot-1", scene: "brot", answer: "brot", options: ["brot", "falle-1", "sonne"] },
    { id: "c1.gate-slot-2", scene: "wasser", answer: "wasser", options: ["wasser", "falle-2", "schreiber"] },
    { id: "c1.gate-slot-3", scene: "sonne", answer: "sonne", options: ["sonne", "brot", "falle-1"] },
  ];
  const OPT_ID = { brot: "c1.gate-option-brot", wasser: "c1.gate-option-wasser", sonne: "c1.gate-option-sonne", schreiber: "c1.gate-option-schreiber", "falle-1": "c1.gate-option-falle-1", "falle-2": "c1.gate-option-falle-2" };

  class Chamber1 extends BaseChamber {
    constructor() { super("Chamber1"); }
    create() {
      this.solved = [false, false, false];
      this.layer = null;
      this.buildBackdrop("Kammer der Zeichen");
      if (!G.uiStarted) { G.uiStarted = true; this.scene.launch("UI"); }
      this.scene.bringToTop("UI");
      G.api.emit("chamber:entered", { n: 1 });
      speak("Willkommen im Grab des Schreibers. Sieh dir die Wandbilder an und oeffne dann das Tor.");

      const cxs = [150, 370, 590, 810];
      MURALS.forEach((m, i) => {
        this.add.rectangle(cxs[i], 310, 190, 210, COL.stoneDark).setStrokeStyle(4, COL.stoneLight).setDepth(6);
        const p = pic(this, m.type, 150); p.setPosition(cxs[i], 300).setDepth(7);
        this.add.text(cxs[i], 398, "?", { fontSize: "24px", color: "#f4c430" }).setOrigin(0.5).setDepth(7);
      });

      this.gateBase = this.add.rectangle(W / 2, 585, 660, 250, 0x000000, 0.22).setDepth(4);
      this.slotObjs = GATE_SLOTS.map((s, i) => {
        const cx = 300 + i * 180;
        this.add.rectangle(cx, 500, 120, 90, COL.stoneLight, 0.9).setDepth(6);
        sceneMarker(this, s.scene, 90).setPosition(cx, 500).setDepth(7);
        const target = this.add.circle(cx, 620, 62, 0x000000, 0.35).setStrokeStyle(4, COL.gold).setDepth(6);
        const filled = this.add.container(cx, 620).setDepth(7);
        return { cx, target, filled };
      });

      this.explore();
    }

    clearLayer() { if (this.layer) { this.layer.forEach((o) => o.destroy()); } this.layer = []; }

    explore() {
      this.clearLayer();
      const aff = [];
      MURALS.forEach((m, i) => {
        const cx = [150, 370, 590, 810][i];
        this.layer.push(this.hit(cx, 310, 190, 210, () => this.openDetail(m)));
        aff.push(uiAff(m.id, cx, 310, 190, 210));
      });
      GATE_SLOTS.forEach((s, i) => {
        if (this.solved[i]) return;
        const cx = 300 + i * 180;
        this.layer.push(this.hit(cx, 585, 190, 210, () => this.pickSlot(i)));
        aff.push(uiAff(s.id, cx, 585, 190, 210));
      });
      G.publish(aff);
    }

    openDetail(m) {
      this.clearLayer();
      G.api.emit("mural:inspected", { id: m.id });
      addJournal({ id: m.id, text: m.head + ": " + m.text });
      const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x120c06, 0.86).setDepth(80);
      const p = pic(this, m.type, 300).setPosition(W / 2, 380).setDepth(81);
      const head = this.add.text(W / 2, 560, m.head, { fontSize: "40px", color: "#f4c430", fontStyle: "bold" }).setOrigin(0.5).setDepth(81);
      const body = this.add.text(W / 2, 650, m.text, { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "26px", color: "#f2e2c2", align: "center", wordWrap: { width: 720 } }).setOrigin(0.5).setDepth(81);
      const btn = this.add.rectangle(W / 2, 820, 260, 96, COL.stoneDark).setStrokeStyle(4, COL.gold).setDepth(81);
      const lbl = this.add.text(W / 2, 820, "Weiter", { fontSize: "30px", color: "#ffffff" }).setOrigin(0.5).setDepth(82);
      this.layer.push(dim, p, head, body, btn, lbl);
      speak(m.text);
      this.layer.push(this.hit(W / 2, 820, 260, 120, () => this.explore()));
      G.publish([uiAff("c1.detail-close", W / 2, 820, 260, 120)]);
    }

    pickSlot(i) {
      this.clearLayer();
      const slot = GATE_SLOTS[i];
      const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x120c06, 0.8).setDepth(80);
      const q = this.add.text(W / 2, 250, "Welches Zeichen passt zu dieser Szene?", { fontSize: "28px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(81);
      sceneMarker(this, slot.scene, 130).setPosition(W / 2, 380).setDepth(81);
      this.layer.push(dim, q);
      const cxs = [300, 480, 660];
      const opts = slot.options.slice();
      // Reihenfolge deterministisch aus Seed mischen (kein Zufall zur Laufzeit ausserhalb PRNG).
      for (let k = opts.length - 1; k > 0; k -= 1) { const j = Math.floor(G.rnd() * (k + 1)); const t = opts[k]; opts[k] = opts[j]; opts[j] = t; }
      const aff = [];
      opts.forEach((o, k) => {
        const cx = cxs[k];
        const frame = this.add.rectangle(cx, 720, 175, 175, COL.stoneDark).setStrokeStyle(4, COL.stoneLight).setDepth(81);
        const p = pic(this, o, 130).setPosition(cx, 720).setDepth(82);
        this.layer.push(frame, p);
        this.layer.push(this.hit(cx, 720, 175, 175, () => this.answerSlot(i, o)));
        aff.push(uiAff(OPT_ID[o], cx, 720, 175, 175));
      });
      G.publish(aff);
    }

    answerSlot(i, chosen) {
      const slot = GATE_SLOTS[i];
      const correct = chosen === slot.answer;
      G.api.emit("gate:attempt", { slot: i + 1, correct });
      if (!correct) { this.wrong("Dieses Zeichen gehoert nicht zur Szene. Schau die Wandbilder genauer an."); this.explore(); return; }
      this.solved[i] = true;
      addScore(10, { slot: i + 1 });
      G.good();
      pic(this, slot.answer, 90).setPosition(this.slotObjs[i].cx, 620).setDepth(8);
      this.slotObjs[i].target.setStrokeStyle(4, COL.good);
      if (this.solved.every(Boolean)) this.finishGate(); else this.explore();
    }

    finishGate() {
      this.clearLayer();
      addScore(25, { chamber: 1 });
      G.api.completeGoal("goal-hieroglyphen", { placed: 3 });
      speak("Die Zeichen stimmen. Das Tor gibt den Weg frei.");
      const door = this.add.rectangle(W / 2, 610, 300, 300, 0x1c130a).setStrokeStyle(6, COL.gold).setDepth(20);
      const glow = this.add.rectangle(W / 2, 610, 220, 260, COL.torchSoft, 0.35).setDepth(21);
      this.tweens.add({ targets: glow, alpha: { from: 0.2, to: 0.5 }, duration: 700, yoyo: true, repeat: -1 });
      const lbl = this.add.text(W / 2, 610, "Weiter", { fontSize: "34px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(22);
      this.layer.push(door, glow, lbl);
      this.layer.push(this.hit(W / 2, 610, 300, 260, () => this.goto("Chamber2")));
      G.publish([uiAff("c1.door-next", W / 2, 610, 300, 260)]);
    }

    wrong(msg) { loseTorch(this); G.miss(); speak(msg); }
  }

  // ===================== KAMMER 2 — Kammer des Flusses =====================
  const PHASES = [
    { key: "achet", name: "Achet", sub: "Ueberschwemmung", level: 0.9, col: COL.water },
    { key: "peret", name: "Peret", sub: "Aussaat", level: 0.4, col: 0x6ea9c9 },
    { key: "schemu", name: "Schemu", sub: "Ernte", level: 0.12, col: 0xcbb06a },
  ];
  const FIELDS = [
    { id: "c2.field-1", label: "Schlamm verteilt sich", answer: "achet" },
    { id: "c2.field-2", label: "Aussaat", answer: "peret" },
    { id: "c2.field-3", label: "Ernte", answer: "schemu" },
    { id: "c2.field-4", label: "Kanaele pruefen", answer: "achet" },
  ];

  class Chamber2 extends BaseChamber {
    constructor() { super("Chamber2"); }
    create() {
      this.initButtons();
      this.done = [false, false, false, false];
      this.selected = -1;
      this.phase = 0;
      this.buildBackdrop("Kammer des Flusses");
      this.scene.bringToTop("UI");
      G.api.emit("chamber:entered", { n: 2 });
      speak("Der Nil folgt drei Zeiten. Ordne jede Feldarbeit ihrer Zeit zu.");

      // Nil als vertikales Band mit animierbarem Wasserstand.
      this.add.rectangle(490, 550, 120, 700, COL.waterDeep).setDepth(4);
      this.water = this.add.rectangle(490, 900, 116, 20, COL.water).setOrigin(0.5, 1).setDepth(5);

      // Feld-Plaettchen (linke Spalte).
      this.fieldObjs = FIELDS.map((f, i) => {
        const cy = 300 + i * 160;
        const box = this.add.rectangle(230, cy, 320, 140, COL.stoneDark).setStrokeStyle(4, COL.stoneLight).setDepth(6);
        this.add.text(230, cy - 20, f.label, { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "24px", color: "#f2e2c2", align: "center", wordWrap: { width: 290 } }).setOrigin(0.5).setDepth(7);
        const st = this.add.text(230, cy + 40, "antippen", { fontSize: "18px", color: "#c2a878" }).setOrigin(0.5).setDepth(7);
        this.btn(f.id, 230, cy, 320, 140, () => this.selectField(i));
        return { cy, box, st };
      });

      // Drehrad.
      this.add.circle(760, 340, 118, COL.stoneDark).setStrokeStyle(6, COL.gold).setDepth(6);
      this.wheelName = this.add.text(760, 320, "", { fontSize: "34px", color: "#f4c430", fontStyle: "bold" }).setOrigin(0.5).setDepth(7);
      this.wheelSub = this.add.text(760, 362, "", { fontSize: "20px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(7);
      this.add.text(760, 210, "Nil-Zeit drehen", { fontSize: "22px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(7);
      this.btn("c2.wheel", 760, 340, 240, 240, () => { this.setPhase(this.phase + 1); });

      this.add.rectangle(760, 560, 240, 140, COL.stoneLight).setStrokeStyle(4, COL.gold).setDepth(6);
      this.add.text(760, 560, "Bestaetigen", { fontSize: "28px", color: "#2a1c0c", fontStyle: "bold" }).setOrigin(0.5).setDepth(7);
      this.btn("c2.wheel-confirm", 760, 560, 240, 140, () => this.confirm());

      this.door = this.add.rectangle(760, 770, 240, 150, 0x1c130a).setStrokeStyle(6, COL.gold).setDepth(20).setVisible(false);
      this.doorLbl = this.add.text(760, 770, "Weiter", { fontSize: "30px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(21).setVisible(false);
      this.btn("c2.door-next", 760, 770, 240, 150, () => this.goto("Chamber3"));

      this.setPhase(0);
      this.render();
    }

    setPhase(i) {
      this.phase = ((i % 3) + 3) % 3;
      const p = PHASES[this.phase];
      this.wheelName.setText(p.name);
      this.wheelSub.setText(p.sub);
      this.tweens.add({ targets: this.water, height: 40 + p.level * 640, duration: 400, ease: "Sine.inOut" });
      this.water.setFillStyle(p.col);
    }

    render() {
      const ids = ["c2.wheel", "c2.wheel-confirm"];
      this.fieldObjs.forEach((fo, i) => {
        fo.box.setStrokeStyle(4, i === this.selected ? COL.gold : COL.stoneLight);
        if (this.done[i]) { fo.box.setFillStyle(0x33472a); fo.st.setText("erledigt"); }
        else ids.push(FIELDS[i].id);
      });
      const all = this.done.every(Boolean);
      this.door.setVisible(all); this.doorLbl.setVisible(all);
      if (all) ids.push("c2.door-next");
      this.publishActive(ids);
    }

    selectField(i) {
      this.selected = i;
      this.setPhase(0); // Rad auf Achet zuruecksetzen, sobald eine neue Aufgabe gewaehlt wird.
      this.render();
    }

    confirm() {
      if (this.selected < 0) return;
      const i = this.selected;
      const f = FIELDS[i];
      const phaseKey = PHASES[this.phase].key;
      const correct = phaseKey === f.answer;
      G.api.emit("nil:assigned", { field: i + 1, phase: phaseKey, correct });
      if (!correct) {
        const fo = this.fieldObjs[i];
        const warn = this.add.text(230, fo.cy + 40, phaseKey === "schemu" ? "vertrocknet" : "ersaeuft", { fontSize: "20px", color: "#e08a5a" }).setOrigin(0.5).setDepth(8);
        this.tweens.add({ targets: warn, alpha: 0, y: fo.cy + 20, duration: 1200, onComplete: () => warn.destroy() });
        loseTorch(this); G.miss();
        speak("Zu dieser Nil-Zeit gelingt diese Arbeit nicht. Dreh das Rad weiter.");
        return;
      }
      this.done[i] = true;
      this.selected = -1;
      addScore(10, { field: i + 1 });
      G.good();
      if (this.done.every(Boolean)) {
        addScore(25, { chamber: 2 });
        G.api.completeGoal("goal-nil-flut", { fields: 4 });
        speak("Alle Arbeiten sitzen richtig. Der Durchgang oeffnet sich.");
      }
      this.render();
    }
  }

  // ===================== KAMMER 3 — Kammer des Siegels =====================
  const RINGS = [
    { id: "c3.ring-1", q: "Wer steht an der Spitze?", answer: "pharao", order: ["bauer", "pharao", "schreiber", "kanope"] },
    { id: "c3.ring-2", q: "Was bewahrt den Koerper fuer die Reise?", answer: "kanope", order: ["schreiber", "kanope", "pharao", "bauer"] },
    { id: "c3.ring-3", q: "Wer zaehlt und plant?", answer: "schreiber", order: ["kanope", "schreiber", "pharao", "bauer"] },
  ];

  class Chamber3 extends BaseChamber {
    constructor() { super("Chamber3"); }
    create() {
      this.initButtons();
      this.inspected = { kanopen: false, liste: false };
      this.active = false;
      this.ringPos = [0, 0, 0];
      this.ringPics = [null, null, null];
      this.wrongOnce = false;
      this.finished = false;
      this.buildBackdrop("Kammer des Siegels");
      this.scene.bringToTop("UI");
      G.api.emit("chamber:entered", { n: 3 });
      speak("Untersuche die Kanopenkruege und die Arbeiterliste, bevor du das Siegel stellst.");

      this.add.rectangle(250, 330, 280, 260, COL.stoneDark, 0.5).setStrokeStyle(4, COL.stoneLight).setDepth(6);
      pic(this, "kanope", 180).setPosition(250, 320).setDepth(7);
      this.kanopenTag = this.add.text(250, 448, "untersuchen", { fontSize: "20px", color: "#c2a878" }).setOrigin(0.5).setDepth(7);
      this.btn("c3.hotspot-kanopen", 250, 330, 280, 260, () => this.inspect("kanopen"));

      this.add.rectangle(710, 330, 280, 260, COL.stoneDark, 0.5).setStrokeStyle(4, COL.stoneLight).setDepth(6);
      pic(this, "schreiber", 180).setPosition(710, 320).setDepth(7);
      this.listeTag = this.add.text(710, 448, "untersuchen", { fontSize: "20px", color: "#c2a878" }).setOrigin(0.5).setDepth(7);
      this.btn("c3.hotspot-liste", 710, 330, 280, 260, () => this.inspect("liste"));

      this.ringCx = [280, 480, 680];
      RINGS.forEach((r, i) => {
        this.add.text(this.ringCx[i], 528, r.q, { fontSize: "17px", color: "#f2e2c2", align: "center", wordWrap: { width: 190 } }).setOrigin(0.5).setDepth(7);
        this.add.circle(this.ringCx[i], 650, 92, 0x1c130a, 0.6).setStrokeStyle(5, COL.stoneLight).setDepth(6);
        this.btn(r.id, this.ringCx[i], 650, 200, 200, () => this.rotate(i));
      });
      this.sealBtn = this.add.rectangle(W / 2, 850, 320, 140, COL.stoneDark).setStrokeStyle(5, COL.gold, 0.4).setDepth(6);
      this.sealLbl = this.add.text(W / 2, 850, "Siegel stellen", { fontSize: "30px", color: "#8a7a5a" }).setOrigin(0.5).setDepth(7);
      this.btn("c3.seal-confirm", W / 2, 850, 320, 140, () => this.confirm());

      this.restartBox = this.add.rectangle(W / 2, 780, 300, 140, COL.stoneDark).setStrokeStyle(5, COL.gold).setDepth(31).setVisible(false);
      this.restartLbl = this.add.text(W / 2, 780, "Noch einmal", { fontSize: "30px", color: "#ffffff" }).setOrigin(0.5).setDepth(32).setVisible(false);
      this.btn("ui.restart", W / 2, 780, 300, 140, () => restartGame(this));

      this.drawRings();
      this.render();
    }

    drawRings() {
      this.ringPics.forEach((p) => p && p.destroy());
      this.ringPics = RINGS.map((r, i) => {
        const key = r.order[this.ringPos[i]];
        const c = pic(this, key, 130).setPosition(this.ringCx[i], 650).setDepth(8);
        c.setAlpha(this.active ? 1 : 0.35);
        return c;
      });
    }

    render() {
      if (this.finished) { this.publishActive(["ui.restart"]); return; }
      const ids = [];
      if (!this.inspected.kanopen) ids.push("c3.hotspot-kanopen");
      if (!this.inspected.liste) ids.push("c3.hotspot-liste");
      if (this.active) { ids.push("c3.ring-1", "c3.ring-2", "c3.ring-3", "c3.seal-confirm"); }
      this.publishActive(ids);
    }

    inspect(which) {
      G.api.emit("hotspot:inspected", { id: which === "kanopen" ? "c3.hotspot-kanopen" : "c3.hotspot-liste" });
      addScore(10, { hotspot: which });
      G.good();
      if (which === "kanopen") {
        this.inspected.kanopen = true;
        this.kanopenTag.setText("gesehen").setColor("#7bbf6a");
        addJournal({ id: "fact-kanopen", text: "Kanopen bewahren die Organe. Der Koerper soll fuer das Jenseits erhalten bleiben." });
        speak("In den Kanopenkruegen ruhen die Organe. So bleibt der Koerper fuer die Reise ins Jenseits bewahrt.");
      } else {
        this.inspected.liste = true;
        this.listeTag.setText("gesehen").setColor("#7bbf6a");
        addJournal({ id: "fact-gesellschaft", text: "Der Schreiber fuehrt die Arbeiterliste. An der Spitze steht der Pharao, dann Beamte und Schreiber, dann Handwerker und Bauern." });
        speak("Die Liste zaehlt die bezahlten Arbeiter des Pyramidenbaus. Der Schreiber plant, der Pharao steht ganz oben.");
      }
      if (this.inspected.kanopen && this.inspected.liste && !this.active) {
        this.active = true;
        this.sealBtn.setStrokeStyle(5, COL.gold, 1);
        this.sealLbl.setColor("#ffffff");
        this.drawRings();
        speak("Das Siegel ist bereit. Stelle die drei Ringe nach den Fragen im Journal.");
      }
      this.render();
    }

    rotate(i) {
      this.ringPos[i] = (this.ringPos[i] + 1) % 4;
      this.drawRings();
      const c = this.ringPics[i];
      this.tweens.add({ targets: c, angle: { from: -25, to: 0 }, duration: 220, ease: "Back.out" });
      this.render();
    }

    confirm() {
      const correct = RINGS.every((r, i) => r.order[this.ringPos[i]] === r.answer);
      G.api.emit("seal:attempt", { correct });
      if (!correct) {
        loseTorch(this); G.miss();
        // Fehlversuch = Entdeckung: Fackel flackert, ein zusaetzliches Wandbild taucht als Hinweis auf.
        this.cameras.main.shake(180, 0.006);
        if (!this.wrongOnce) {
          this.wrongOnce = true;
          const hint = this.add.container(W / 2, 470).setDepth(9).setAlpha(0);
          hint.add(this.add.rectangle(0, 0, 360, 90, COL.stoneDark, 0.85).setStrokeStyle(3, COL.gold));
          hint.add(pic(this, "pharao", 66).setPosition(-120, 0));
          hint.add(pic(this, "kanope", 66).setPosition(0, 0));
          hint.add(pic(this, "schreiber", 66).setPosition(120, 0));
          this.tweens.add({ targets: hint, alpha: 1, duration: 500 });
        }
        speak("Das Siegel bleibt zu. Ein neues Wandbild zeigt die Reihenfolge: oben der Pharao, dann die Kanope, dann der Schreiber.");
        return;
      }
      this.finale();
    }

    finale() {
      if (this.finished) return;
      this.finished = true;
      addScore(10, { seal: true });
      addScore(25, { chamber: 3 });
      G.api.completeGoal("goal-jenseits", { seal: "korrekt" });
      G.api.completeGoal("goal-gesellschaft", { seal: "korrekt" });
      this.sealBtn.setVisible(false); this.sealLbl.setVisible(false);
      const burst = this.add.circle(W / 2, 640, 40, COL.gold, 0.8).setDepth(30);
      this.tweens.add({ targets: burst, radius: 420, alpha: 0, duration: 900, ease: "Cubic.out" });
      this.cameras.main.flash(400, 255, 220, 150);
      this.add.text(W / 2, 470, "„Wer meine Zeichen liest, haelt mein Leben fest.“\nDer vergessene Schreiber dankt dir.", { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "30px", color: "#f4c430", align: "center", wordWrap: { width: 760 } }).setOrigin(0.5).setDepth(31);
      speak("Das Siegel oeffnet sich. Der vergessene Schreiber dankt dir. Seine Zeichen und seine Welt sind wieder lesbar.");
      this.restartBox.setVisible(true); this.restartLbl.setVisible(true);
      G.completed = true;
      G.win();
      G.api.completeGame({ finalScore: G.score, goals: ["goal-hieroglyphen", "goal-nil-flut", "goal-jenseits", "goal-gesellschaft"] });
      this.render();
    }
  }

  // --- Fackel-/Reset-Logik, kammeruebergreifend. ---
  function loseTorch(scene) {
    G.torch = Math.max(0, G.torch - 1);
    G.api.emit("torch:lost", { remaining: G.torch });
    if (G.hudRefresh) G.hudRefresh();
    if (G.torch === 0) {
      G.torch = 3;
      if (G.hudRefresh) G.hudRefresh();
      speak("Die Fackel ist erloschen. Die Kammer ordnet sich neu, dein Journal bleibt.");
      scene.scene.restart();
      scene.scene.bringToTop("UI");
    }
  }

  function restartGame(scene) {
    G.torch = 3; G.score = 0; G.completed = false; G.journal = []; G.journalOpen = false;
    if (G.hudRefresh) G.hudRefresh();
    scene.scene.start("Chamber1");
    scene.scene.bringToTop("UI");
  }

  // ===================== HUD / Journal =====================
  class UIScene extends Ph.Scene {
    constructor() { super({ key: "UI", active: false }); }
    create() {
      // Journal-Knopf.
      this.add.rectangle(150, 78, 220, 116, COL.stoneDark, 0.9).setStrokeStyle(3, COL.stoneLight).setDepth(200);
      this.add.text(150, 78, "Journal", { fontSize: "26px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(201);
      this.add.rectangle(150, 78, 220, 116, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(202)
        .on("pointerdown", () => { G.click(); this.toggleJournal(); });

      // Fackel-Anzeige (mittig oben).
      this.flames = [0, 1, 2].map((i) => {
        const c = this.add.container(410 + i * 70, 78).setDepth(201);
        c.add(this.add.ellipse(0, 8, 26, 40, COL.torch));
        c.add(this.add.ellipse(0, 2, 14, 26, COL.torchSoft));
        return c;
      });

      // Ton-Toggle (oben rechts).
      this.add.rectangle(858, 78, 150, 116, COL.stoneDark, 0.9).setStrokeStyle(3, COL.stoneLight).setDepth(200);
      this.soundLbl = this.add.text(858, 78, "Ton aus", { fontSize: "22px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(201);
      this.add.rectangle(858, 78, 150, 116, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(202)
        .on("pointerdown", () => { this.toggleSound(); });

      this.journalLayer = null;
      G.hudRefresh = () => this.refreshHUD();
      this.refreshHUD();
    }

    refreshHUD() {
      this.flames.forEach((f, i) => { f.setAlpha(i < G.torch ? 1 : 0.12); });
    }

    toggleSound() {
      G.soundOn = !G.soundOn;
      if (G.soundOn) ensureAudio();
      this.soundLbl.setText(G.soundOn ? "Ton an" : "Ton aus");
      G.click();
    }

    toggleJournal() {
      if (G.journalOpen) { this.closeJournal(); return; }
      G.journalOpen = true;
      const layer = [];
      layer.push(this.add.rectangle(W / 2, H / 2, W, H, 0x0c0804, 0.9).setInteractive().setDepth(300));
      layer.push(this.add.text(W / 2, 240, "Journal", { fontSize: "44px", color: "#f4c430", fontStyle: "bold" }).setOrigin(0.5).setDepth(301));
      const lines = G.journal.length ? G.journal.map((e) => "• " + e.text) : ["Noch nichts entdeckt. Untersuche die Kammer."];
      layer.push(this.add.text(140, 320, lines.join("\n\n"), { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "24px", color: "#f2e2c2", wordWrap: { width: 680 }, lineSpacing: 6 }).setDepth(301));
      layer.push(this.add.rectangle(760, 150, 220, 120, COL.stoneDark).setStrokeStyle(4, COL.gold).setDepth(301));
      layer.push(this.add.text(760, 150, "Schliessen", { fontSize: "26px", color: "#ffffff" }).setOrigin(0.5).setDepth(302));
      layer.push(this.add.rectangle(760, 150, 220, 120, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(303)
        .on("pointerdown", () => { G.click(); this.closeJournal(); }));
      this.journalLayer = layer;
      G.publish();
    }

    closeJournal() {
      G.journalOpen = false;
      if (this.journalLayer) { this.journalLayer.forEach((o) => o.destroy()); this.journalLayer = null; }
      G.publish();
    }
  }

  G.game = new window.Phaser.Game({
    type: Ph.AUTO,
    parent: context.parentId,
    width: W,
    height: H,
    scale: { mode: Ph.Scale.FIT, autoCenter: Ph.Scale.CENTER_BOTH },
    backgroundColor: "#1a120a",
    scene: [Chamber1, Chamber2, Chamber3, UIScene],
  });
}
