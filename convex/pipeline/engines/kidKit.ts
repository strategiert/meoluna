// kidKit: Build-Time-Shared-Fragmente fuer Engine-Renderer.
//
// Jedes Fragment ist ein reiner JS/JSX-String, den ein Renderer in seinen
// emittierten /App.tsx-Code inline einbettet (String-Konkatenation zur
// Build-Zeit). Es gibt KEINEN Runtime-Import in der Sandbox: Sandpack mountet
// nur /App.tsx, gespeicherte Produktions-Welten bleiben unveraendert lauffaehig.
//
// Regeln fuer Fragmente:
// - Pures JS/JSX, kein TypeScript, keine Template-Literals im emittierten Code
//   (String-Konkatenation mit '+', wie im bestehenden Renderer-Stil).
// - Fragmente duerfen nur auf react/framer-motion-Imports und aufeinander
//   verweisen (Reihenfolge: PRNG -> THEMES -> Rest, siehe KID_KIT_CORE).
// - Aenderungen hier betreffen ALLE angeschlossenen Engines: Golden-Checks
//   aller angeschlossenen Engines laufen lassen.
// - Namenskollisionen: Der emittierte Code ist ein ES-Modul — doppelte
//   Top-Level-Deklarationen (z.B. eine eigene Sky/Luno-Funktion neben dem
//   Kit-Fragment) sind ein Syntaxfehler, kein "letzter gewinnt". Engines mit
//   eigener Variante benennen ihre um (z.B. MovementSky), statt zu ueberschreiben.

// Deterministischer PRNG (mulberry32) + String-Hash (djb2).
// Seed-Quelle: SPEC.seed (optional) sonst worldName -> gleiche Spec ergibt
// immer dieselbe Welt (replay-sicher), verschiedene Welten streuen.
export const KIT_PRNG = `
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seedText) { return mulberry32(hashString(String(seedText || 'meoluna'))); }
function seededPick(rng, list) { return list[Math.floor(rng() * list.length) % list.length]; }
function seededShuffle(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
  }
  return copy;
}
`;

// Backdrop-Themes: seeded Kosmetik-Varianz ohne Extra-Token.
// Jedes Theme liefert die komplette KID-Palette (alle Keys, die Renderer
// referenzieren) + Deko-Typ + Mascot-Accessoire.
export const KIT_THEMES = `
const KID_THEMES = [
  { id: 'wiese', deco: 'sun', prop: '', colors: {
    skyTop: '#79c7f5', skyBottom: '#e9f8ff', hillBack: '#a8dd8a', hillFront: '#7ec463',
    band: '#fbe3b2', bandEdge: '#d9b178', ink: '#27324a',
    coral: '#ff7a59', coralDark: '#c95a3f', blue: '#3f9bf0', blueDark: '#2c79c2',
    green: '#54b865', greenDark: '#3c8f4b', sun: '#ffd84d', card: '#ffffff' } },
  { id: 'daemmerung', deco: 'moon', prop: '🧣', colors: {
    skyTop: '#8a7bd8', skyBottom: '#ffd9c0', hillBack: '#7a6fb5', hillFront: '#5d548f',
    band: '#ffe8cf', bandEdge: '#d9a878', ink: '#2c2a4a',
    coral: '#ff8a6b', coralDark: '#c9644a', blue: '#5e8fe0', blueDark: '#4270b8',
    green: '#5bb87a', greenDark: '#3f8f5a', sun: '#ffe08a', card: '#ffffff' } },
  { id: 'weltraum', deco: 'stars', prop: '🚀', colors: {
    skyTop: '#232a5c', skyBottom: '#4a3f8f', hillBack: '#5a4fa8', hillFront: '#403a78',
    band: '#e8e4ff', bandEdge: '#a89ad9', ink: '#1f2340',
    coral: '#ff7a9c', coralDark: '#c9557a', blue: '#5aa7f0', blueDark: '#3d82c8',
    green: '#4fc98a', greenDark: '#379e68', sun: '#ffe27a', card: '#ffffff' } },
  { id: 'unterwasser', deco: 'bubbles', prop: '🤿', colors: {
    skyTop: '#2e9fd4', skyBottom: '#a7e6f5', hillBack: '#3fb8a0', hillFront: '#2d9482',
    band: '#d9f5ef', bandEdge: '#8fcfc0', ink: '#1e3a4a',
    coral: '#ff8a70', coralDark: '#c96450', blue: '#3f86e0', blueDark: '#2c64b5',
    green: '#48b880', greenDark: '#348f61', sun: '#ffdf70', card: '#ffffff' } },
  { id: 'wald', deco: 'leaves', prop: '🍃', colors: {
    skyTop: '#9ed4a8', skyBottom: '#eaf8e0', hillBack: '#6fae62', hillFront: '#4f8f47',
    band: '#f2e6c4', bandEdge: '#c4a86f', ink: '#27402a',
    coral: '#ff8a5c', coralDark: '#c96442', blue: '#4a95d4', blueDark: '#3573a8',
    green: '#4fa858', greenDark: '#398042', sun: '#ffd84d', card: '#ffffff' } },
];
const KID_SEED = (SPEC.seed || (SPEC.world && SPEC.world.worldName) || 'meoluna');
const KID_RNG = makeRng(KID_SEED);
const THEME = seededPick(KID_RNG, KID_THEMES);
const KID = THEME.colors;
`;

export const KIT_SPEAK = `
function speak(text) {
  try { if (!window.speechSynthesis) return; window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.9; window.speechSynthesis.speak(u);
  } catch (e) {}
}
`;

export const KIT_KIDSTYLES = `
function KidStyles() {
  return (<style>{"@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap'); .kid-font{font-family:'Baloo 2','Comic Sans MS','Segoe UI',sans-serif;} @media (prefers-reduced-motion: reduce){ *,*::before,*::after{ animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition-duration:0.01ms !important; } }"}</style>);
}
`;

// WebAudio-Sound: standardmaessig STUMM (Klassenraum!), Toggle-Button.
// Synthetisierte Toene (kein Netzwerk, keine Assets). AudioContext wird erst
// nach einer Nutzergeste erzeugt (Autoplay-Policy).
export const KIT_SOUND = `
const Sound = (function () {
  let ctx = null; let muted = true;
  function ensure() {
    if (!ctx) { try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); } catch (e) {} }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function tone(freq, dur, type, gain, delay) {
    const c = ensure(); if (!c || muted) return;
    try {
      const t0 = c.currentTime + (delay || 0);
      const osc = c.createOscillator(); const g = c.createGain();
      osc.type = type || 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.08, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.15));
      osc.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + (dur || 0.15) + 0.05);
    } catch (e) {}
  }
  return {
    setMuted: function (m) { muted = m; if (!m) ensure(); },
    isMuted: function () { return muted; },
    tone: tone,
    success: function () { tone(523.25, 0.14); tone(659.25, 0.14, 'sine', 0.08, 0.13); tone(783.99, 0.22, 'sine', 0.08, 0.26); },
    miss: function () { tone(196, 0.22, 'triangle', 0.06); },
    thunk: function () { tone(140, 0.09, 'square', 0.04); },
    noteFor: function (index) { const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; return scale[((index % scale.length) + scale.length) % scale.length]; },
    melody: function (indices, stepSeconds) {
      const step = stepSeconds || 0.18;
      indices.forEach(function (idx, i) { tone(Sound.noteFor(idx), 0.16, 'sine', 0.07, i * step); });
    },
  };
})();
function SoundToggle() {
  const [muted, setMuted] = useState(true);
  return (
    <button type="button" aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
      onClick={() => { const next = !muted; Sound.setMuted(next ? true : false); setMuted(next); if (!next) Sound.thunk(); }}
      className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl transition-transform active:scale-90"
      style={{ background: KID.card, borderColor: KID.ink }}>{muted ? '🔇' : '🔊'}</button>
  );
}
`;

export const KIT_LUNO = `
function Luno({ mood }) {
  return (
    <motion.div className="relative" animate={mood === 'sad' ? { x: [0, -7, 7, -5, 5, 0] } : mood === 'cheer' ? { y: [0, -16, 0] } : { y: [0, -3, 0] }} transition={mood === 'cheer' ? { duration: 0.5, repeat: 2 } : mood === 'sad' ? { duration: 0.5 } : { duration: 2.4, repeat: Infinity }}>
      <svg width="68" height="72" viewBox="0 0 74 78" aria-hidden="true">
        <ellipse cx="37" cy="74" rx="20" ry="4" fill="rgba(39,50,74,0.18)" />
        <ellipse cx="26" cy="68" rx="7" ry="6" fill="#f3b34c" /><ellipse cx="48" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <circle cx="37" cy="38" r="30" fill="#fff6e0" stroke="#27324a" strokeWidth="3.5" />
        <circle cx="27" cy="36" r="5.6" fill="#27324a" /><circle cx="47" cy="36" r="5.6" fill="#27324a" />
        <circle cx="29" cy="34" r="1.8" fill="#ffffff" /><circle cx="49" cy="34" r="1.8" fill="#ffffff" />
        <circle cx="19" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" /><circle cx="55" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" />
        {mood === 'sad' ? <path d="M 30 54 Q 37 49 44 54" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" /> : <path d="M 29 51 Q 37 59 45 51" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" />}
        <path d="M 52 12 Q 60 6 64 14 Q 58 14 56 20 Z" fill="#ffd84d" stroke="#27324a" strokeWidth="2.5" />
      </svg>
      {THEME.prop ? <span className="absolute -right-2 -top-2 text-xl" aria-hidden="true">{THEME.prop}</span> : null}
    </motion.div>
  );
}
`;

// Theme-abhaengiger Hintergrund: Sonne/Mond/Sterne/Blasen/Blaetter + Huegel.
export const KIT_SKY = `
function Sky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {THEME.deco === 'sun' && (<motion.div className="absolute right-8 top-5 h-16 w-16 rounded-full sm:h-24 sm:w-24" style={{ background: KID.sun, boxShadow: '0 0 50px 14px rgba(255,216,77,0.55)' }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity }} />)}
      {THEME.deco === 'moon' && (<motion.div className="absolute right-10 top-5 h-14 w-14 rounded-full sm:h-20 sm:w-20" style={{ background: '#fff3c9', boxShadow: '0 0 40px 10px rgba(255,243,201,0.5)' }} animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 5, repeat: Infinity }} />)}
      {THEME.deco === 'stars' && ([0, 1, 2, 3, 4, 5].map(function (i) {
        return (<motion.div key={i} className="absolute h-2 w-2 rounded-full bg-white" style={{ left: (8 + i * 15) + '%', top: (6 + ((i * 37) % 22)) + '%' }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2 + (i % 3), repeat: Infinity }} />);
      }))}
      {THEME.deco === 'bubbles' && ([0, 1, 2, 3].map(function (i) {
        return (<motion.div key={i} className="absolute h-4 w-4 rounded-full border-2 border-white/70" style={{ left: (12 + i * 22) + '%', bottom: '10%' }} animate={{ y: [0, -90], opacity: [0.8, 0] }} transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.9 }} />);
      }))}
      {THEME.deco === 'leaves' && ([0, 1, 2].map(function (i) {
        return (<motion.div key={i} className="absolute text-xl" style={{ left: (15 + i * 28) + '%', top: '8%' }} animate={{ y: [0, 60], x: [0, 14, -8, 0], rotate: [0, 80] }} transition={{ duration: 7 + i * 2, repeat: Infinity, delay: i * 1.4 }} aria-hidden="true">🍃</motion.div>);
      }))}
      {(THEME.deco === 'sun' || THEME.deco === 'moon' || THEME.deco === 'leaves') && (<motion.div className="absolute left-[10%] top-8 h-9 w-28 rounded-full bg-white/90" animate={{ x: [0, 26, 0] }} transition={{ duration: 18, repeat: Infinity }} />)}
      {(THEME.deco === 'sun' || THEME.deco === 'moon') && (<motion.div className="absolute left-[55%] top-14 h-7 w-20 rounded-full bg-white/80" animate={{ x: [0, -20, 0] }} transition={{ duration: 24, repeat: Infinity }} />)}
      <div className="absolute -left-10 bottom-[6%] h-32 w-[60%] rounded-[50%]" style={{ background: KID.hillBack }} />
      <div className="absolute -right-16 bottom-[2%] h-36 w-[70%] rounded-[50%]" style={{ background: KID.hillFront }} />
      <div className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: KID.hillFront }} />
    </div>
  );
}
`;

export const KIT_BUBBLE = `
function SpeechBubble({ text }) {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-3 rounded-3xl border-4 px-4 py-3 shadow-lg sm:px-6 sm:py-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl" style={{ background: '#fff1c4' }}>🌙</div>
        <p className="grow text-lg font-bold leading-snug sm:text-2xl" style={{ color: KID.ink }}>{text}</p>
        <button type="button" onClick={() => speak(text)} aria-label="Vorlesen" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition-transform active:scale-90" style={{ background: KID.blue, boxShadow: '0 4px 0 ' + KID.blueDark }}>🔊</button>
      </div>
      <div className="absolute -bottom-3 left-10 h-6 w-6 rotate-45 border-b-4 border-r-4" style={{ background: KID.card, borderColor: KID.ink }} />
    </div>
  );
}
`;

export const KIT_BIGBUTTON = `
function BigButton({ onClick, color, colorDark, children, disabled }) {
  return (<button type="button" onClick={onClick} disabled={disabled} className="kid-font min-h-[64px] rounded-3xl px-5 py-3 text-xl font-extrabold text-white transition-all active:translate-y-1 disabled:opacity-40 sm:text-2xl" style={{ background: color, boxShadow: '0 6px 0 ' + colorDark, textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>{children}</button>);
}
`;

export const KIT_STARROW = `
function StarRow({ stars }) {
  return (<div className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xl" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}><span>⭐</span><span className="kid-font font-extrabold">{stars}</span></div>);
}
`;

export const KIT_ROUNDDOTS = `
function RoundDots({ total, current }) {
  return (<div className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5" style={{ background: KID.card, borderColor: KID.ink }}>{Array.from({ length: total }).map((e, i) => (<div key={i} className="h-3.5 w-3.5 rounded-full border-2" style={{ background: i < current ? KID.green : i === current ? KID.sun : '#e3e8f0', borderColor: KID.ink }} />))}</div>);
}
`;

// Streak-Anzeige: erscheint ab 2 Treffern in Folge.
export const KIT_STREAK = `
function StreakMeter({ streak }) {
  if (streak < 2) return null;
  return (
    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-lg" style={{ background: '#fff1c4', borderColor: KID.ink, color: KID.ink }}>
      <span aria-hidden="true">🔥</span><span className="kid-font font-extrabold">{streak}er-Serie!</span>
    </motion.div>
  );
}
`;

// Kern-Kit in fester Reihenfolge (Abhaengigkeiten: PRNG -> THEMES -> Rest).
export const KID_KIT_CORE = [
  KIT_PRNG,
  KIT_THEMES,
  KIT_SPEAK,
  KIT_KIDSTYLES,
  KIT_SOUND,
  KIT_LUNO,
  KIT_SKY,
  KIT_BUBBLE,
  KIT_BIGBUTTON,
  KIT_STARROW,
  KIT_ROUNDDOTS,
  KIT_STREAK,
].join("\n");
