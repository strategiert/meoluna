// Meoluna Game Studio — Spiel B: "Stadt am großen Fluss"
// Systemisches, rundenbasiertes Aufbauspiel. Basis 1280x720 (Landscape), ein ES-Modul,
// Phaser über window.Phaser. Zufall NUR über seeded PRNG (djb2 + mulberry32), Zeit NUR
// über die Phaser-Clock/Tweens. Struktur: 3 Jahre × 3 Nilphasen (Achet/Peret/Schemu) = 9 Züge.

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

  // Nil-Blau, Schilf-Grün, Sand — Palette aus der Task-Vorgabe.
  const COL = {
    sky: 0xe9dcc0,
    sand: 0xd9c08a,
    sandDark: 0xb99a5e,
    nil: 0x2e6f95,
    nilDeep: 0x1f4f6c,
    reed: 0x6a8f3c,
    reedDark: 0x4f6d2a,
    stone: 0xc9b48a,
    stoneDark: 0x7c6a48,
    gold: 0xf4c430,
    ink: 0x3a2a18,
    panel: 0x2c2114,
    panelSoft: 0x40301c,
    good: 0x7bbf6a,
    bad: 0xc46a44,
    dry: 0xb08a4a,
    text: 0xf2e2c2,
  };

  // --- Spielkonstanten (bewusst als ganze Zahlen, damit die Auswertung integer-sauber bleibt). ---
  const WORKERS = 12;
  const CONSUME = 6;                         // Nahrungsbedarf der Siedlung je Phase
  const PY = { achet: 1, peret: 2, schemu: 3 }; // Feld-Ertrag je Arbeiter nach Phase
  const BUILD_RATE = 3;                      // Baufortschritt je Pyramiden-Arbeiter (bei Nahrung ≥ 0)
  const BUILD_TARGET = 60;                   // Siegschwelle Baufortschritt
  const STOCK_DRAW_CAP = 4;                  // je Phase max. aus Speicher deckbar (< CONSUME: Totalausfall bleibt Hunger)
  const STOCK_CAP = 14;
  const TRUST_START = 50, TRUST_WIN = 40;
  const PHASES = [
    { key: "achet", name: "Achet", sub: "Überschwemmung" },
    { key: "peret", name: "Peret", sub: "Aussaat" },
    { key: "schemu", name: "Schemu", sub: "Ernte" },
  ];
  const FLOOD_NAME = ["niedrige Flut", "mittlere Flut", "hohe Flut"];
  const AREAS = [
    { key: "fields", label: "Felder", hint: "Nahrung" },
    { key: "scribes", label: "Schreiber", hint: "Listen" },
    { key: "granary", label: "Speicher", hint: "Vorrat" },
    { key: "pyramid", label: "Pyramide", hint: "Bau" },
  ];

  const rnd = mulberry32(djb2(context.seed));
  // Fluthöhen ZUERST ziehen, damit sie unabhängig vom späteren Streu-Zufall stabil bleiben.
  const FLOOD = [0, 1, 2].map(() => Math.floor(rnd() * 3)); // je Jahr 0=niedrig,1=mittel,2=hoch
  // Ideales Kanalmuster je Fluthöhe: niedrig→alle offen, mittel→2 offen, hoch→1 offen.
  function idealOpenCount(year) { return 3 - FLOOD[year]; }

  function freshState() {
    return {
      year: 0, phaseIdx: 0,        // 0..2 Jahr, 0..2 Phase
      food: 0,                     // Ernte-Bilanz der letzten Phase
      stock: 6, build: 0, trust: TRUST_START,
      canals: [false, false, false],
      alloc: { fields: 4, scribes: 0, granary: 2, pyramid: 3 },
      pyramidStreak: 0,
      areaTurns: { fields: 0, scribes: 0, granary: 0, pyramid: 0 },
      graveResolved: false, graveAccepted: false,
      scribesUnlocked: false,
      goals: {},
      score: 0,
      lossFreePhases: 0,
    };
  }

  const G = {
    api: context.api,
    soundOn: false,
    audio: null,
    game: null,
    gameCompleted: false, // Session-Guard: completeGame + Finale-Ziele feuern nur einmal.
    s: freshState(),
  };

  function speak(text) { if (text) G.api.speak(String(text).slice(0, 480)); }
  function assigned() { const a = G.s.alloc; return a.fields + a.scribes + a.granary + a.pyramid; }
  function pool() { return WORKERS - assigned(); }
  function hasScribes() { return G.s.alloc.scribes >= 2; }

  // --- Audio: WebAudio-Synthese, startet stumm, erst nach Nutzergeste hörbar. ---
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
  G.click = () => tone(230, 0.05, "square", 0.045);
  G.good = () => { tone(523, 0.11, "triangle", 0.06); tone(659, 0.11, "triangle", 0.06, 0.08); };
  G.grow = () => { tone(392, 0.10, "triangle", 0.05); tone(523, 0.10, "triangle", 0.05, 0.09); };
  G.win = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.08, i * 0.11)); };
  G.bad = () => { tone(170, 0.20, "sawtooth", 0.05); tone(110, 0.24, "sawtooth", 0.05, 0.06); };

  // Textur-Bake für wiederkehrende Formen (Ursprung mittig). Live-Vektor-Shapes je Frame sind der
  // Frame-Killer auf Geräten ohne GPU — gebacken sind es Images (ein Draw-Call, gebatcht).
  function bakeTexture(scene, key, w, h, drawFn) {
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.save(); g.translateCanvas(w / 2, h / 2); drawFn(g); g.restore();
      g.generateTexture(key, w, h);
      g.destroy();
    }
    return key;
  }

  // Pyramiden-Baustufen: 0..5 Ebenen, jeweils EINMAL in eine Textur gebacken und dann getauscht.
  function pyramidKey(scene, level) {
    const key = `pyr:${level}`;
    if (scene.textures.exists(key)) return key;
    const w = 300, h = 210;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Bauplatz/Sockel.
    g.fillStyle(COL.sandDark, 1); g.fillRect(0, h - 22, w, 22);
    const steps = 5;
    for (let i = 0; i < level; i += 1) {
      const t = i / steps;
      const bw = w * (0.9 - t * 0.72);
      const bx = (w - bw) / 2;
      const by = h - 22 - (i + 1) * ((h - 30) / steps);
      const bh = (h - 30) / steps + 1;
      g.fillStyle(i % 2 ? COL.stone : COL.stoneDark, 1);
      g.fillRect(bx, by, bw, bh);
      g.lineStyle(2, 0x000000, 0.15); g.strokeRect(bx, by, bw, bh);
    }
    if (level >= steps) { // Deckstein
      g.fillStyle(COL.gold, 1);
      g.fillTriangle(w / 2, h - 22 - steps * ((h - 30) / steps) - 16, w / 2 - 20, h - 22 - steps * ((h - 30) / steps), w / 2 + 20, h - 22 - steps * ((h - 30) / steps));
    }
    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  }

  // Feld-Kachel: fruchtbar (grün) oder trocken (sandbraun).
  function fieldKey(scene, kind) {
    const key = `field:${kind}`;
    if (scene.textures.exists(key)) return key;
    const w = 120, h = 84;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const base = kind === "green" ? COL.reed : COL.dry;
    const dark = kind === "green" ? COL.reedDark : COL.sandDark;
    g.fillStyle(base, 1); g.fillRoundedRect(0, 0, w, h, 10);
    g.lineStyle(3, dark, 1);
    for (let i = 1; i < 5; i += 1) g.lineBetween(i * (w / 5), 6, i * (w / 5), h - 6);
    if (kind === "green") { for (let i = 0; i < 5; i += 1) { g.fillStyle(0x8fb84f, 1); g.fillCircle(i * (w / 5) + w / 10, h - 16, 5); } }
    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  }

  class City extends Ph.Scene {
    constructor() { super("City"); }

    create() {
      this.mode = "idle";          // idle | plan | resolve | grave | finale | retry
      this.hitRects = {};
      this.advisorPage = 0;
      this.advisorLines = [];

      this.buildBackdrop();
      this.buildScene();
      this.buildCanals();
      this.buildAllocPanel();
      this.buildHud();
      this.buildAdvisor();
      this.buildOverlays();
      this.buildRotateHint();

      // Kein Reset des Session-Guards bei Neustart: completeGame bleibt einmalig.
      this.beginPhase(true);

      // Orientierung prüfen (Dreh-Hinweis auf Hochkant) — auf create, bei resize und als leichter Poll.
      this.checkOrientation();
      this.scale.on("resize", this.checkOrientation, this);
      this.time.addEvent({ delay: 600, loop: true, callback: this.checkOrientation, callbackScope: this });
    }

    // ---------- Aufbau der statischen Szene ----------
    buildBackdrop() {
      const key = "city-bg";
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COL.sky, 1); g.fillRect(0, 0, W, H);
        g.fillStyle(COL.sand, 1); g.fillRect(0, 110, W, H - 110);
        // Nil als breites, leicht schräges Band durch die Mittelszene.
        g.fillStyle(COL.nilDeep, 1);
        g.fillPoints([{ x: 360, y: 560 }, { x: 900, y: 520 }, { x: 900, y: 600 }, { x: 360, y: 610 }], true);
        g.fillStyle(COL.nil, 1);
        g.fillPoints([{ x: 360, y: 566 }, { x: 900, y: 528 }, { x: 900, y: 588 }, { x: 360, y: 598 }], true);
        // Schilf-Tupfen am Ufer.
        g.fillStyle(COL.reedDark, 1);
        for (let x = 380; x < 900; x += 46) g.fillRect(x, 548 - ((x % 92) ? 4 : 0), 5, 22);
        g.generateTexture(key, W, H);
        g.destroy();
      }
      this.add.image(W / 2, H / 2, key).setDepth(0);
    }

    buildScene() {
      // Felder (drei Reihen, links der Mittelszene).
      this.fieldImgs = [0, 1, 2].map((i) => {
        const x = 430, y = 210 + i * 96;
        return this.add.image(x, y, fieldKey(this, "dry")).setDepth(4);
      });
      this.add.text(430, 150, "Felder", { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "20px", color: "#3a2a18" }).setOrigin(0.5).setDepth(4);

      // Speicher (Kornspeicher) mit Füllstand.
      this.add.rectangle(600, 470, 92, 130, COL.stoneDark).setStrokeStyle(3, COL.ink).setDepth(4);
      this.granaryFill = this.add.rectangle(600, 533, 84, 4, COL.gold).setOrigin(0.5, 1).setDepth(5);
      this.add.text(600, 392, "Speicher", { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "18px", color: "#3a2a18" }).setOrigin(0.5).setDepth(5);

      // Pyramide (wächst Ebene um Ebene).
      this.pyrLevel = 0;
      this.pyrImg = this.add.image(770, 470, pyramidKey(this, 0)).setDepth(4);
      this.add.text(770, 356, "Pyramide", { fontFamily: '"Trebuchet MS", sans-serif', fontSize: "18px", color: "#3a2a18" }).setOrigin(0.5).setDepth(5);
    }

    buildCanals() {
      this.canalObjs = [0, 1, 2].map((i) => {
        const cy = 210 + i * 150, cx = 175;
        const box = this.add.rectangle(cx, cy, 300, 120, COL.sandDark).setStrokeStyle(4, COL.stoneDark).setDepth(5);
        const water = this.add.rectangle(cx, cy, 280, 40, COL.nil, 0).setDepth(6);
        const name = this.add.text(cx, cy - 34, "Kanal " + (i + 1), { fontSize: "22px", color: "#f2e2c2", fontStyle: "bold" }).setOrigin(0.5).setDepth(7);
        const state = this.add.text(cx, cy + 30, "geschlossen", { fontSize: "20px", color: "#e9dcc0" }).setOrigin(0.5).setDepth(7);
        this.btn("canal-" + (i + 1) + ".toggle", cx, cy, 300, 120, () => this.toggleCanal(i));
        return { box, water, name, state };
      });
      this.add.text(175, 118, "Kanäle zur Flut", { fontSize: "22px", color: "#3a2a18", fontStyle: "bold" }).setOrigin(0.5).setDepth(6);
    }

    buildAllocPanel() {
      this.add.rectangle(1095, 360, 330, 470, COL.panel, 0.92).setStrokeStyle(3, COL.stoneDark).setDepth(4);
      this.poolText = this.add.text(1095, 150, "", { fontSize: "22px", color: "#f4c430", fontStyle: "bold" }).setOrigin(0.5).setDepth(6);
      this.allocRows = {};
      AREAS.forEach((area, i) => {
        const y = 226 + i * 96;
        this.add.text(945, y - 24, area.label, { fontSize: "22px", color: "#f2e2c2", fontStyle: "bold" }).setOrigin(0, 0.5).setDepth(6);
        this.add.text(945, y + 4, area.hint, { fontSize: "15px", color: "#c9b48a" }).setOrigin(0, 0.5).setDepth(6);
        const count = this.add.text(1155, y - 8, "0", { fontSize: "30px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(6);
        // Minus/Plus als gebackene runde Knöpfe.
        this.add.circle(1092, y, 30, COL.panelSoft).setStrokeStyle(3, COL.stone).setDepth(6);
        this.add.text(1092, y - 2, "–", { fontSize: "34px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(7);
        this.add.circle(1210, y, 30, COL.panelSoft).setStrokeStyle(3, COL.stone).setDepth(6);
        this.add.text(1210, y - 2, "+", { fontSize: "30px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(7);
        this.btn("alloc." + area.key + ".minus", 1092, y, 118, 94, () => this.changeAlloc(area.key, -1));
        this.btn("alloc." + area.key + ".plus", 1210, y, 118, 94, () => this.changeAlloc(area.key, +1));
        this.allocRows[area.key] = { count };
      });
    }

    buildHud() {
      this.add.rectangle(W / 2, 52, W, 104, COL.panel, 0.9).setDepth(20);
      this.yearText = this.add.text(20, 26, "", { fontSize: "26px", color: "#f4c430", fontStyle: "bold" }).setDepth(21);
      this.floodText = this.add.text(20, 64, "", { fontSize: "18px", color: "#f2e2c2" }).setDepth(21);

      // Vier Werte-Anzeigen.
      this.meters = {};
      const specs = [
        { key: "food", label: "Nahrung", x: 470 },
        { key: "stock", label: "Speicher", x: 660 },
        { key: "build", label: "Bau", x: 850 },
        { key: "trust", label: "Vertrauen", x: 1030 },
      ];
      specs.forEach((sp) => {
        this.add.text(sp.x, 26, sp.label, { fontSize: "16px", color: "#c9b48a" }).setOrigin(0.5, 0).setDepth(21);
        const val = this.add.text(sp.x, 50, "0", { fontSize: "26px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(21);
        this.meters[sp.key] = val;
      });

      // Ton-Toggle (oben rechts).
      this.add.rectangle(1200, 52, 150, 92, COL.panelSoft).setStrokeStyle(3, COL.stone).setDepth(21);
      this.soundLbl = this.add.text(1200, 52, "Ton aus", { fontSize: "22px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(22);
      this.btn("ui.sound-toggle", 1200, 52, 150, 92, () => this.toggleSound());
    }

    buildAdvisor() {
      this.add.rectangle(400, 668, 760, 96, COL.panel, 0.92).setStrokeStyle(3, COL.stoneDark).setDepth(20);
      this.add.text(34, 630, "Berater", { fontSize: "16px", color: "#c9b48a" }).setDepth(21);
      this.advisorText = this.add.text(34, 652, "", { fontSize: "21px", color: "#f2e2c2", wordWrap: { width: 700 }, lineSpacing: 3 }).setDepth(21);

      this.add.circle(855, 665, 46, COL.panelSoft).setStrokeStyle(3, COL.stone).setDepth(20);
      this.add.text(855, 665, "Rat", { fontSize: "22px", color: "#f2e2c2" }).setOrigin(0.5).setDepth(21);
      this.btn("advisor.next", 855, 665, 130, 100, () => this.nextAdvice());

      // Vorschau- und Phasen-Knopf.
      this.previewText = this.add.text(1100, 606, "", { fontSize: "16px", color: "#c9b48a", align: "center" }).setOrigin(0.5).setDepth(21);
      this.add.rectangle(1100, 668, 260, 96, COL.stoneDark).setStrokeStyle(4, COL.gold).setDepth(20);
      this.phaseLbl = this.add.text(1100, 668, "Phase auswerten", { fontSize: "24px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(21);
      this.btn("hud.phase-next", 1100, 668, 260, 96, () => this.resolvePhase());
    }

    buildOverlays() {
      // Grab-Ereignis (Jenseits) — verdeckt planbar, eigener Affordance-Satz.
      this.graveGroup = this.add.container(0, 0).setDepth(200).setVisible(false);
      const gdim = this.add.rectangle(W / 2, H / 2, W, H, 0x0c0804, 0.82);
      const gcard = this.add.rectangle(W / 2, H / 2, 780, 420, COL.panel).setStrokeStyle(4, COL.gold);
      const ghead = this.add.text(W / 2, 210, "Die Werkstatt bittet um Arbeiter", { fontSize: "30px", color: "#f4c430", fontStyle: "bold" }).setOrigin(0.5);
      const gbody = this.add.text(W / 2, 320, "Für die Grabausstattung und die Kanopenkrüge fehlen Hände. Sagst du Arbeiter zu, kostet das Baufortschritt, bringt aber Vertrauen im Volk.", { fontSize: "22px", color: "#f2e2c2", align: "center", wordWrap: { width: 680 }, lineSpacing: 4 }).setOrigin(0.5);
      const gAcc = this.add.rectangle(W / 2 - 180, 460, 300, 100, COL.stoneDark).setStrokeStyle(4, COL.good);
      const gAccL = this.add.text(W / 2 - 180, 460, "Arbeiter zusagen", { fontSize: "22px", color: "#ffffff" }).setOrigin(0.5);
      const gLat = this.add.rectangle(W / 2 + 180, 460, 300, 100, COL.stoneDark).setStrokeStyle(4, COL.stone);
      const gLatL = this.add.text(W / 2 + 180, 460, "Später entscheiden", { fontSize: "22px", color: "#f2e2c2" }).setOrigin(0.5);
      this.graveGroup.add([gdim, gcard, ghead, gbody, gAcc, gAccL, gLat, gLatL]);
      this.btn("event.grave-accept", W / 2 - 180, 460, 300, 100, () => this.resolveGrave(true));
      this.btn("event.grave-later", W / 2 + 180, 460, 300, 100, () => this.resolveGrave(false));

      // Finale / Verfehlt-Screen.
      this.endGroup = this.add.container(0, 0).setDepth(210).setVisible(false);
      this.endDim = this.add.rectangle(W / 2, H / 2, W, H, 0x0c0804, 0.9);
      this.endHead = this.add.text(W / 2, 250, "", { fontSize: "40px", color: "#f4c430", fontStyle: "bold" }).setOrigin(0.5);
      this.endBody = this.add.text(W / 2, 360, "", { fontSize: "24px", color: "#f2e2c2", align: "center", wordWrap: { width: 820 }, lineSpacing: 5 }).setOrigin(0.5);
      const rBox = this.add.rectangle(W / 2, 500, 320, 108, COL.stoneDark).setStrokeStyle(4, COL.gold);
      const rLbl = this.add.text(W / 2, 500, "Neu beginnen", { fontSize: "26px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
      this.endGroup.add([this.endDim, this.endHead, this.endBody, rBox, rLbl]);
      this.btn("ui.restart", W / 2, 500, 320, 108, () => this.restart());
    }

    buildRotateHint() {
      this.rotateHint = this.add.container(0, 0).setDepth(300).setVisible(false);
      const d = this.add.rectangle(W / 2, H / 2, W, H, 0x1a120a, 0.98);
      const icon = this.add.text(W / 2, H / 2 - 60, "☞", { fontSize: "90px", color: "#f4c430" }).setOrigin(0.5);
      const t = this.add.text(W / 2, H / 2 + 60, "Dreh dein Gerät quer,\ndamit die Stadt am Fluss Platz hat.", { fontSize: "34px", color: "#f2e2c2", align: "center", lineSpacing: 8 }).setOrigin(0.5);
      this.rotateHint.add([d, icon, t]);
    }

    checkOrientation() {
      const portrait = window.innerHeight > window.innerWidth;
      if (this.rotateHint) this.rotateHint.setVisible(portrait);
    }

    // ---------- Treffer-Bereiche (persistent, nur aktiviert/deaktiviert) ----------
    btn(id, cx, cy, w, h, onTap) {
      const r = this.add.rectangle(cx, cy, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(120);
      r._geo = { cx, cy, w, h };
      r.input.enabled = false;
      r.setVisible(false);
      r.on("pointerdown", () => { if (!r.input || !r.input.enabled) return; G.click(); onTap(); });
      this.hitRects[id] = r;
      return r;
    }
    publishActive(ids) {
      const aff = [];
      Object.keys(this.hitRects).forEach((id) => {
        const r = this.hitRects[id];
        const on = ids.indexOf(id) >= 0;
        r.input.enabled = on;
        // Phaser hit-testet nur sichtbare Objekte; aktive Treffer-Flächen müssen sichtbar sein
        // (alpha 0.001 → unsichtbar für den Nutzer, aber willRender=true fürs Input-System).
        r.setVisible(on);
        if (on) aff.push({ id, x: r._geo.cx - r._geo.w / 2, y: r._geo.cy - r._geo.h / 2, width: r._geo.w, height: r._geo.h });
      });
      G.api.setAffordances(aff, { width: W, height: H });
    }

    planAffordances() {
      const ids = ["ui.sound-toggle", "advisor.next", "hud.phase-next", "canal-1.toggle", "canal-2.toggle", "canal-3.toggle"];
      AREAS.forEach((a) => {
        if (G.s.alloc[a.key] > 0) ids.push("alloc." + a.key + ".minus");
        if (pool() > 0) ids.push("alloc." + a.key + ".plus");
      });
      this.publishActive(ids);
    }

    // ---------- Phasenablauf ----------
    beginPhase(first) {
      this.mode = "plan";
      // Snapshot für Rollback: Zustand zu Phasenbeginn (vor den Zuteilungs-Edits dieser Phase).
      this.snapshot = JSON.parse(JSON.stringify(G.s));

      const ph = PHASES[G.s.phaseIdx];
      G.api.emit("phase:begin", { year: G.s.year + 1, phase: ph.key });

      // Jenseits-Ereignis: Schemu in Jahr 2 (year index 1, phase index 2), einmalig.
      if (G.s.year === 1 && G.s.phaseIdx === 2 && !G.s.graveResolved) {
        this.showGrave();
        return;
      }

      this.refreshAll();
      this.setAdviceForPhase(first);
      this.planAffordances();
    }

    setAdviceForPhase(first) {
      const ph = PHASES[G.s.phaseIdx];
      const flood = FLOOD[G.s.year];
      const lines = [];
      if (first) lines.push("Willkommen, Verwalter. Führe die Siedlung durch drei Jahre am großen Fluss.");
      if (ph.key === "achet") {
        lines.push("Die Priester sagen " + FLOOD_NAME[flood] + " voraus. Stelle die Kanäle danach.");
        lines.push(flood === 2 ? "Bei hoher Flut nur wenige Kanäle öffnen, sonst wird die Siedlung nass." : "Öffne genug Kanäle, damit fruchtbarer Schlamm auf die Felder kommt.");
      } else if (ph.key === "peret") {
        lines.push("Peret ist Aussaat. Ohne Feld-Arbeiter bleiben die Felder leer.");
      } else {
        lines.push("Schemu ist Ernte. Jetzt zahlt sich aus, wer gesät und bewässert hat.");
      }
      if (!hasScribes()) lines.push("Ohne Listen weiß niemand, was im Speicher liegt. Setze zwei Schreiber ein für klare Zahlen.");
      this.advisorLines = lines;
      this.advisorPage = 0;
      this.showAdvice();
      speak(lines[0]);
    }

    showAdvice() {
      const line = this.advisorLines[this.advisorPage] || "";
      this.advisorText.setText(line);
    }
    nextAdvice() {
      if (!this.advisorLines.length) return;
      this.advisorPage = (this.advisorPage + 1) % this.advisorLines.length;
      this.showAdvice();
      speak(this.advisorLines[this.advisorPage]);
    }

    toggleCanal(i) {
      if (this.mode !== "plan") return;
      G.s.canals[i] = !G.s.canals[i];
      G.api.emit("canal:toggled", { canal: i + 1, open: G.s.canals[i] });
      this.refreshCanals();
      this.refreshPreview();
    }

    changeAlloc(key, delta) {
      if (this.mode !== "plan") return;
      const a = G.s.alloc;
      if (delta > 0 && pool() <= 0) return;
      if (delta < 0 && a[key] <= 0) return;
      a[key] += delta;
      G.api.emit("alloc:changed", { area: key, count: a[key] });
      // Schreiber-Freischaltung: von < 2 auf ≥ 2 — einmalig, schaltet Präzision + Vorschau frei.
      if (key === "scribes" && a.scribes >= 2 && !G.s.scribesUnlocked) {
        G.s.scribesUnlocked = true;
        G.api.emit("scribes:unlocked", { scribes: a.scribes });
        if (!G.s.goals["goal-hieroglyphen"]) {
          G.s.goals["goal-hieroglyphen"] = true;
          G.api.completeGoal("goal-hieroglyphen", { scribes: a.scribes });
        }
        G.good();
        speak("Jetzt führen die Schreiber Listen. Du siehst genaue Zahlen und eine Vorschau des Zuges.");
        this.flashAdvice("Schreiber übernehmen die Listen: exakte Zahlen und Vorschau.");
      }
      this.refreshAlloc();
      this.refreshHud();
      this.refreshPreview();
      this.planAffordances();
    }

    flashAdvice(text) {
      this.advisorLines = [text].concat(this.advisorLines);
      this.advisorPage = 0;
      this.showAdvice();
    }

    // Deterministische Streuung ohne Schreiber: aus PRNG, sichtbar spürbare Unsicherheit.
    scatterMult() { return 0.75 + Math.round(rnd() * 4) * 0.125; } // 0.75..1.25 in 0.125-Schritten

    // Kernrechnung einer Phase. preview=true ändert keinen Zustand (nur Vorschau bei Schreibern).
    computeResolution(preview) {
      const s = G.s;
      const ph = PHASES[s.phaseIdx];
      const year = s.year;
      // Kanäle nur in Achet wirksam; Fertilität aus Trefferzahl gegen das ideale Muster.
      let fertility = s.yearFertility != null ? s.yearFertility : 0.6;
      let wet = 0, correctCanals = 0;
      if (ph.key === "achet") {
        const ideal = idealOpenCount(year); // erste k Kanäle sollen offen sein
        correctCanals = 0;
        for (let i = 0; i < 3; i += 1) { const shouldOpen = i < ideal; if (s.canals[i] === shouldOpen) correctCanals += 1; }
        fertility = 0.4 + 0.2 * correctCanals; // 0.4 .. 1.0
        // Zu viele offene Kanäle bei hoher Flut → nasse Siedlung.
        if (FLOOD[year] === 2) { const openBeyond = s.canals.reduce((n, o, i) => n + (o && i >= ideal ? 1 : 0), 0); wet = openBeyond; }
      }
      let gross = s.alloc.fields * PY[ph.key] * fertility;
      let scattered = false;
      if (!hasScribes()) { gross *= this.scatterMult(); scattered = true; }
      gross = Math.round(gross);

      let net = gross - CONSUME;
      let draw = 0;
      let stock = s.stock;
      if (net < 0) { draw = Math.min(stock, STOCK_DRAW_CAP, -net); net += draw; stock -= draw; }
      const hunger = net < 0;
      let buildAdd = 0;
      if (!hunger) {
        stock = Math.min(STOCK_CAP, stock + s.alloc.granary);
        if (s.alloc.pyramid > 0 && net >= 0) buildAdd = s.alloc.pyramid * BUILD_RATE;
      }
      let trustDelta = -wet * 6;
      return { ph, gross, net, draw, stock, hunger, buildAdd, wet, correctCanals, fertility, trustDelta, scattered };
    }

    resolvePhase() {
      if (this.mode !== "plan") return;
      this.mode = "resolve";
      this.publishActive([]); // während der Auswertung ist nichts tappbar

      const s = G.s;
      const ph = PHASES[s.phaseIdx];
      // In Achet die Jahres-Fertilität festschreiben (gilt für Peret/Schemu des Jahres).
      const r = this.computeResolution(false);
      if (ph.key === "achet") s.yearFertility = r.fertility;

      if (r.hunger) { this.animateHunger(r); return; }

      // Zustand anwenden.
      s.food = r.net;
      s.stock = r.stock;
      const grewFrom = s.build;
      if (r.buildAdd > 0) s.build = Math.min(100, s.build + r.buildAdd);
      if (r.trustDelta) s.trust = Math.max(0, Math.min(100, s.trust + r.trustDelta));

      // Ziel-Buchhaltung.
      AREAS.forEach((a) => { if (s.alloc[a.key] >= 1) s.areaTurns[a.key] += 1; });
      const buildGrew = s.build > grewFrom;
      if (s.alloc.pyramid >= 1 && s.food >= 0 && buildGrew) s.pyramidStreak += 1; else s.pyramidStreak = 0;

      s.lossFreePhases += 1;
      s.score += 15; G.api.reportScore(15, { year: s.year + 1, phase: ph.key });

      this.checkMidGoals();

      this.animateResolution(r, () => {
        G.api.emit("phase:resolved", { year: s.year + 1, phase: ph.key, food: s.food, trust: s.trust, build: s.build });
        this.advancePhase();
      });
    }

    checkMidGoals() {
      const s = G.s;
      // goal-nil-flut: erstes Peret nach korrekt bewässertem Achet + Aussaat-Arbeitern.
      if (!s.goals["goal-nil-flut"] && PHASES[s.phaseIdx].key === "peret" && s.achetIrrigatedOk && s.alloc.fields >= 1) {
        s.goals["goal-nil-flut"] = true;
        G.api.completeGoal("goal-nil-flut", { fertility: s.yearFertility });
      }
      // goal-pyramidenbau: 3 versorgte Bau-Züge in Folge.
      if (!s.goals["goal-pyramidenbau"] && s.pyramidStreak >= 3) {
        s.goals["goal-pyramidenbau"] = true;
        G.api.completeGoal("goal-pyramidenbau", { streak: s.pyramidStreak });
      }
      // goal-gesellschaft: alle vier Bereiche über ≥ 2 Züge besetzt.
      if (!s.goals["goal-gesellschaft"] && AREAS.every((a) => s.areaTurns[a.key] >= 2)) {
        s.goals["goal-gesellschaft"] = true;
        G.api.completeGoal("goal-gesellschaft", { areas: 4 });
      }
    }

    // ---------- Animationen (lesbare Auswertungs-Sequenz) ----------
    animateResolution(r, done) {
      const s = G.s;
      const ph = PHASES[s.phaseIdx];
      // Felder wachsen (grün) oder bleiben trocken je nach Ertrag.
      const green = r.gross >= CONSUME * 0.6;
      this.fieldImgs.forEach((img, i) => {
        img.setTexture(fieldKey(this, green ? "green" : "dry"));
        this.tweens.add({ targets: img, scaleX: { from: 0.7, to: 1 }, scaleY: { from: 0.7, to: 1 }, duration: 360, delay: i * 90, ease: "Back.out" });
      });
      if (green) G.grow();
      // Speicher füllt sich.
      this.refreshGranary();
      // Pyramide wächst Ebene um Ebene.
      const newLevel = Math.min(5, Math.floor(s.build / 20));
      if (newLevel > this.pyrLevel) {
        this.pyrLevel = newLevel;
        this.pyrImg.setTexture(pyramidKey(this, newLevel));
        this.tweens.add({ targets: this.pyrImg, y: { from: 456, to: 470 }, alpha: { from: 0.4, to: 1 }, duration: 420, ease: "Back.out" });
        G.grow();
      }
      this.refreshHud();
      if (r.wet > 0) { this.cameras.main.shake(160, 0.004); this.flashAdvice("Zu viele Kanäle offen — die Siedlung stand unter Wasser. Vertrauen sinkt."); G.bad(); speak("Zu viele Kanäle bei hoher Flut. Die Siedlung wurde nass, das Vertrauen sinkt."); }
      else { this.setResolveAdvice(r); }
      this.time.delayedCall(720, done);
    }

    setResolveAdvice(r) {
      const s = G.s;
      let msg;
      if (!hasScribes()) msg = "Ohne Schreiber bleibt die Bilanz unklar — das Ergebnis schwankt.";
      else if (PHASES[s.phaseIdx].key === "schemu") msg = "Gute Ernte. Der Speicher trägt durch die nächste Flut.";
      else msg = "Die Felder tragen. Nahrung und Bau bleiben im Gleichgewicht.";
      this.flashAdvice(msg);
      speak(msg);
    }

    animateHunger(r) {
      G.bad();
      this.cameras.main.shake(220, 0.006);
      this.fieldImgs.forEach((img, i) => {
        img.setTexture(fieldKey(this, "dry"));
        this.tweens.add({ targets: img, alpha: { from: 1, to: 0.4 }, scaleY: { from: 1, to: 0.7 }, duration: 300, delay: i * 80, yoyo: true });
      });
      const s = G.s;
      const ph = PHASES[s.phaseIdx];
      let reason;
      if (s.alloc.fields === 0 && ph.key === "peret") reason = "Peret ohne Aussaat-Arbeiter — die Felder blieben leer";
      else if (s.alloc.fields === 0) reason = ph.key === "schemu" ? "Schemu ohne Feld-Arbeiter — es gab nichts zu ernten" : "Achet ohne Feld-Arbeiter — nichts wuchs heran";
      else reason = "Zu wenig Ertrag und kein Vorrat — die Siedlung hungerte";

      // Rollback: Zustand auf Phasenbeginn zurück, Zuteilung bleibt für die Korrektur stehen.
      const keepAlloc = JSON.parse(JSON.stringify(s.alloc));
      const keepCanals = s.canals.slice();
      G.s = JSON.parse(JSON.stringify(this.snapshot));
      G.s.alloc = keepAlloc;
      G.s.canals = keepCanals;

      G.api.emit("rollback", { reason, year: G.s.year + 1, phase: ph.key });
      this.flashAdvice("Hunger! " + reason + ". Der Zug wird zurückgesetzt — teile neu zu und werte erneut aus.");
      speak("Hunger in der Siedlung. " + reason + ". Der Zug beginnt neu. Teile die Arbeiter anders zu.");

      this.time.delayedCall(760, () => {
        this.mode = "plan";
        this.refreshAll();
        this.refreshPreview();
        this.planAffordances();
      });
    }

    advancePhase() {
      const s = G.s;
      // Achet-Bewässerungsmerker für goal-nil-flut (erste korrekte Achet-Bewässerung).
      if (PHASES[s.phaseIdx].key === "achet") s.achetIrrigatedOk = s.yearFertility >= 0.6;

      s.phaseIdx += 1;
      if (s.phaseIdx > 2) { s.phaseIdx = 0; s.year += 1; s.yearFertility = null; }

      if (s.year > 2) { this.endGame(); return; }
      this.beginPhase(false);
    }

    // ---------- Jenseits-Ereignis ----------
    showGrave() {
      this.mode = "grave";
      this.refreshAll();
      this.graveGroup.setVisible(true);
      speak("Die Werkstatt bittet um Arbeiter für die Grabausstattung und die Kanopenkrüge.");
      this.publishActive(["ui.sound-toggle", "event.grave-accept", "event.grave-later"]);
    }

    resolveGrave(accept) {
      const s = G.s;
      s.graveResolved = true;
      s.graveAccepted = accept;
      this.graveGroup.setVisible(false);
      if (accept) {
        s.build = Math.max(0, s.build - 10);
        s.trust = Math.min(100, s.trust + 12);
        G.api.emit("event:grave", { accepted: true });
        if (!G.s.goals["goal-jenseits"]) { G.s.goals["goal-jenseits"] = true; G.api.completeGoal("goal-jenseits", { kanopen: true }); }
        G.good();
        this.pyrLevel = Math.min(this.pyrLevel, Math.floor(s.build / 20));
        this.pyrImg.setTexture(pyramidKey(this, this.pyrLevel));
        speak("In den Kanopenkrügen ruhen die Organe. So bleibt der Körper für die Reise ins Jenseits bewahrt. Das Volk fasst Vertrauen.");
      } else {
        s.trust = Math.max(0, s.trust - 10);
        G.api.emit("event:grave", { accepted: false });
        speak("Die Werkstatt geht leer aus. Das Volk ist enttäuscht, das Vertrauen sinkt.");
      }
      // Danach normale Planung dieser Phase (Schemu Jahr 2).
      this.refreshAll();
      this.setAdviceForPhase(false);
      this.mode = "plan";
      this.refreshPreview();
      this.planAffordances();
    }

    // ---------- Spielende ----------
    endGame() {
      const s = G.s;
      const win = s.build >= BUILD_TARGET && s.food >= 0 && s.trust >= TRUST_WIN;
      this.mode = win ? "finale" : "retry";
      this.endGroup.setVisible(true);
      if (win) {
        G.win();
        this.cameras.main.flash(420, 255, 220, 150);
        this.endHead.setText("Die Pyramide wird eingeweiht");
        this.endBody.setText("Drei Jahre am großen Fluss: die Felder trugen, der Speicher hielt die Flut aus, die Schreiber führten die Listen und die Pyramide steht. Der Pharao dankt dir.\n\nBau " + s.build + " % · Vertrauen " + s.trust);
        speak("Die Pyramide wird eingeweiht. Deine Verwaltung hat die Siedlung durch drei Jahre getragen. Der Pharao dankt dir.");
        if (!G.gameCompleted) {
          G.gameCompleted = true;
          s.score += 40; G.api.reportScore(40, { victory: true });
          G.api.completeGame({ finalScore: s.score, goals: ["goal-nil-flut", "goal-pyramidenbau", "goal-gesellschaft", "goal-hieroglyphen"] });
        }
      } else {
        this.endHead.setText("Noch ein Versuch");
        const missing = [];
        if (s.build < BUILD_TARGET) missing.push("die Pyramide blieb bei " + s.build + " % (Ziel 60 %)");
        if (s.food < 0) missing.push("die Nahrung reichte am Ende nicht");
        if (s.trust < TRUST_WIN) missing.push("das Vertrauen fiel auf " + s.trust);
        this.endBody.setText("Am Ende von Jahr 3 fehlte: " + missing.join("; ") + ".\nVersuch es erneut — plane Kanäle, Schreiber und Bau von Anfang an zusammen.");
        speak("Das Ziel ist noch nicht erreicht. Versuch es erneut.");
      }
      this.publishActive(["ui.sound-toggle", "ui.restart"]);
    }

    restart() {
      // Session-Guard G.gameCompleted bleibt gesetzt: completeGame feuert nur einmal pro Session.
      G.s = freshState();
      this.pyrLevel = 0;
      this.pyrImg.setTexture(pyramidKey(this, 0));
      this.fieldImgs.forEach((img) => img.setTexture(fieldKey(this, "dry")).setAlpha(1).setScale(1));
      this.endGroup.setVisible(false);
      this.graveGroup.setVisible(false);
      this.beginPhase(true);
    }

    // ---------- Anzeige aktualisieren ----------
    refreshAll() { this.refreshHud(); this.refreshCanals(); this.refreshAlloc(); this.refreshGranary(); this.refreshPreview(); }

    refreshHud() {
      const s = G.s;
      const ph = PHASES[s.phaseIdx];
      this.yearText.setText("Jahr " + (s.year + 1) + " · " + ph.name + " (" + ph.sub + ")");
      this.floodText.setText("Nilstand-Vorhersage der Priester: " + FLOOD_NAME[FLOOD[s.year]]);
      const q = hasScribes();
      this.meters.food.setText(q ? (s.food >= 0 ? "+" + s.food : "" + s.food) : "?").setColor(!q ? "#c9b48a" : (s.food >= 0 ? "#7bbf6a" : "#c46a44"));
      this.meters.stock.setText(q ? s.stock + "" : "?").setColor(q ? "#ffffff" : "#c9b48a");
      this.meters.build.setText(s.build + " %").setColor(s.build >= BUILD_TARGET ? "#7bbf6a" : "#ffffff");
      this.meters.trust.setText(s.trust + "").setColor(s.trust >= TRUST_WIN ? "#ffffff" : "#c46a44");
    }

    refreshCanals() {
      const s = G.s;
      this.canalObjs.forEach((c, i) => {
        const open = s.canals[i];
        c.box.setFillStyle(open ? COL.nilDeep : COL.sandDark);
        c.water.setFillStyle(COL.nil, open ? 0.9 : 0);
        c.state.setText(open ? "offen" : "geschlossen").setColor(open ? "#bfe3f2" : "#e9dcc0");
      });
    }

    refreshAlloc() {
      const s = G.s;
      AREAS.forEach((a) => { this.allocRows[a.key].count.setText(s.alloc[a.key] + ""); });
      this.poolText.setText("Freie Arbeiter: " + pool() + " / " + WORKERS);
    }

    refreshGranary() {
      const s = G.s;
      const maxH = 122;
      const h = Math.max(4, Math.round(maxH * (s.stock / STOCK_CAP)));
      this.tweens.add({ targets: this.granaryFill, height: h, duration: 320, ease: "Sine.inOut" });
    }

    refreshPreview() {
      if (this.mode !== "plan") { this.previewText.setText(""); return; }
      const s = G.s;
      if (!hasScribes()) { this.previewText.setText("Vorschau: ???\n(ohne Schreiber unklar)"); return; }
      const r = this.computeResolution(true);
      const foodStr = (r.net >= 0 ? "+" + r.net : "" + r.net);
      this.previewText.setText("Vorschau  Ernte " + foodStr + " · Bau +" + r.buildAdd + (r.wet > 0 ? "\nWarnung: Siedlung wird nass" : ""));
    }

    toggleSound() {
      G.soundOn = !G.soundOn;
      if (G.soundOn) {
        ensureAudio();
        if (G.audio && G.audio.state === "suspended") G.audio.resume();
        G.click();
      } else if (G.audio && G.audio.state === "running") {
        G.audio.suspend();
      }
      this.soundLbl.setText(G.soundOn ? "Ton an" : "Ton aus");
    }
  }

  G.game = new window.Phaser.Game({
    type: Ph.AUTO,
    parent: context.parentId,
    width: W,
    height: H,
    scale: { mode: Ph.Scale.FIT, autoCenter: Ph.Scale.CENTER_BOTH },
    backgroundColor: "#e9dcc0",
    scene: [City],
  });
}
