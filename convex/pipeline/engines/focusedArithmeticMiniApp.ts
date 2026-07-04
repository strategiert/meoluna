export type ParsedSignedAddition = {
  a: number;
  b: number;
};

export function parseSignedIntegerAddition(text: string): ParsedSignedAddition | null {
  const normalised = text.replace(/−/g, "-").replace(/\s+/g, " ");
  const match = normalised.match(/([+-]?\d+)\s*\+\s*\(?\s*([+-]\d+)\s*\)?/);
  if (!match) return null;
  return { a: Number(match[1]), b: Number(match[2]) };
}

function escapeJs(value: string): string {
  return JSON.stringify(value);
}

export function buildFocusedArithmeticMiniAppCode(input: {
  prompt: string;
  parsed: ParsedSignedAddition;
}): string {
  const { a, b } = input.parsed;
  const result = a + b;
  const absA = Math.abs(a);
  const absB = Math.abs(b);
  const practiceA = -Math.max(4, Math.round(absA * 0.65));
  const practiceB = -Math.max(3, Math.round(absB * 0.55));
  // Bonus-Level rechnet mit verdoppelten Übungswerten — Zahlengerade muss sie fassen.
  const bonusMin = (practiceA - 9) * 2 + (practiceB - 9) * 2;
  const min = Math.floor((Math.min(0, a, b, result, bonusMin) - 20) / 10) * 10;
  const max = Math.ceil((Math.max(0, a, b, result) + 20) / 10) * 10;
  const prompt = escapeJs(input.prompt);

  return `import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const MIN = ${min};
const MAX = ${max};
const MAIN = { a: ${a}, b: ${b}, result: ${result}, absA: ${absA}, absB: ${absB} };
const ORIGINAL_PROMPT = ${prompt};

// "Bilderbuch-Tag": helle, freundliche Spielwelt für Kinder.
const KID = {
  skyTop: '#79c7f5',
  skyBottom: '#e9f8ff',
  hillBack: '#a8dd8a',
  hillFront: '#7ec463',
  path: '#fbe3b2',
  pathEdge: '#d9b178',
  ink: '#27324a',
  coral: '#ff7a59',
  coralDark: '#c95a3f',
  blue: '#3f9bf0',
  blueDark: '#2c79c2',
  green: '#54b865',
  greenDark: '#3c8f4b',
  sun: '#ffd84d',
  card: '#ffffff',
};

function pct(value) {
  return Math.max(5, Math.min(95, ((value - MIN) / (MAX - MIN)) * 100));
}

function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  } catch (error) {}
}

function makePractice(seed, factor) {
  const scale = factor || 1;
  const first = (${practiceA} - seed) * scale;
  const second = (${practiceB} - seed) * scale;
  const result = first + second;
  const turnedAround = first - second;
  const choices = [result, Math.abs(result), turnedAround === result ? result - 10 : turnedAround];
  // Deterministische Rotation statt Zufalls-Shuffle: gleiche Aufgabe ergibt
  // dieselbe Antwort-Reihenfolge (replay-sicher), variiert aber pro Aufgabe.
  const rot = ((Math.abs(first) + Math.abs(second)) % 3 + 3) % 3;
  return { first, second, result, choices: choices.slice(rot).concat(choices.slice(0, rot)) };
}

const PRACTICE_GOAL = 5;
const BONUS_GOAL = 3;

function KidStyles() {
  return (
    <style>{"@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap'); .kid-font{font-family:'Baloo 2','Comic Sans MS','Segoe UI',sans-serif;}"}</style>
  );
}

function Luno({ mood, hopping, dir }) {
  const eyeShift = dir < 0 ? -2.4 : dir > 0 ? 2.4 : 0;
  return (
    <motion.div
      animate={hopping ? { y: [0, -24, 0], scaleY: [1, 1.08, 0.92], scaleX: [1, 0.94, 1.06] } : mood === 'sad' ? { x: [0, -7, 7, -5, 5, 0] } : mood === 'cheer' ? { y: [0, -16, 0] } : { y: [0, -3, 0] }}
      transition={hopping ? { duration: 0.34, repeat: Infinity } : mood === 'cheer' ? { duration: 0.5, repeat: 2 } : mood === 'sad' ? { duration: 0.5 } : { duration: 2.4, repeat: Infinity }}
    >
      <svg width="68" height="72" viewBox="0 0 74 78" aria-hidden="true">
        <ellipse cx="37" cy="74" rx="20" ry="4" fill="rgba(39,50,74,0.18)" />
        <ellipse cx="26" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <ellipse cx="48" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <circle cx="37" cy="38" r="30" fill="#fff6e0" stroke="#27324a" strokeWidth="3.5" />
        <circle cx={27 + eyeShift} cy="36" r="5.6" fill="#27324a" />
        <circle cx={47 + eyeShift} cy="36" r="5.6" fill="#27324a" />
        <circle cx={29 + eyeShift} cy="34" r="1.8" fill="#ffffff" />
        <circle cx={49 + eyeShift} cy="34" r="1.8" fill="#ffffff" />
        <circle cx="19" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" />
        <circle cx="55" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" />
        {mood === 'sad'
          ? <path d="M 30 54 Q 37 49 44 54" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" />
          : <path d="M 29 51 Q 37 59 45 51" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" />}
        <path d="M 52 12 Q 60 6 64 14 Q 58 14 56 20 Z" fill="#ffd84d" stroke="#27324a" strokeWidth="2.5" />
      </svg>
    </motion.div>
  );
}

function SpeechBubble({ text }) {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-3 rounded-3xl border-4 px-4 py-3 shadow-lg sm:px-6 sm:py-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl" style={{ background: '#fff1c4' }}>🌙</div>
        <p className="grow text-lg font-bold leading-snug sm:text-2xl" style={{ color: KID.ink }}>{text}</p>
        <button
          type="button"
          onClick={() => speak(text)}
          aria-label="Vorlesen"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition-transform active:scale-90"
          style={{ background: KID.blue, boxShadow: '0 4px 0 ' + KID.blueDark }}
        >🔊</button>
      </div>
      <div className="absolute -bottom-3 left-10 h-6 w-6 rotate-45 border-b-4 border-r-4" style={{ background: KID.card, borderColor: KID.ink }} />
    </div>
  );
}

function BigButton({ onClick, color, colorDark, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="kid-font min-h-[64px] rounded-3xl px-6 py-3 text-xl font-extrabold text-white transition-all active:translate-y-1 disabled:opacity-40 sm:text-2xl"
      style={{ background: color, boxShadow: '0 6px 0 ' + colorDark, textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
    >{children}</button>
  );
}

function Scene({ position, hopping, hopCount, mood, dir, trailFrom, trailTo, secret }) {
  let ticks = [];
  const step = Math.max(10, Math.ceil((MAX - MIN) / 7 / 10) * 10);
  for (let value = Math.ceil(MIN / step) * step; value <= MAX; value += step) ticks.push(value);
  for (const special of secret ? [0] : [0, MAIN.result]) {
    if (!ticks.includes(special)) {
      ticks = ticks.filter((tick) => Math.abs(pct(tick) - pct(special)) > 4);
      ticks.push(special);
    }
  }
  ticks.sort((x, y) => x - y);

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4" style={{ height: 'min(40vh, 21rem)', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <motion.div className="absolute right-8 top-5 h-16 w-16 rounded-full sm:h-24 sm:w-24" style={{ background: KID.sun, boxShadow: '0 0 50px 14px rgba(255,216,77,0.55)' }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="absolute left-[10%] top-8 h-9 w-28 rounded-full bg-white/90" animate={{ x: [0, 26, 0] }} transition={{ duration: 18, repeat: Infinity }} />
      <motion.div className="absolute left-[55%] top-14 h-7 w-20 rounded-full bg-white/80" animate={{ x: [0, -20, 0] }} transition={{ duration: 24, repeat: Infinity }} />
      <div className="pointer-events-none absolute -left-10 bottom-[14%] h-36 w-[60%] rounded-[50%]" style={{ background: KID.hillBack }} />
      <div className="pointer-events-none absolute -right-16 bottom-[10%] h-40 w-[70%] rounded-[50%]" style={{ background: KID.hillFront }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%]" style={{ background: KID.hillFront }} />

      <div className="absolute inset-x-[4%] bottom-[20%] h-12 rounded-full border-4" style={{ background: KID.path, borderColor: KID.pathEdge }}>
        {ticks.map((tick) => (
          <div key={tick} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(tick) + '%' }}>
            <div className={'kid-font rounded-xl border-2 px-2 py-0.5 text-sm font-extrabold sm:text-base ' + (tick === 0 ? 'scale-110' : '')} style={{ background: tick === 0 ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink }}>{tick}</div>
          </div>
        ))}
        <div className="kid-font absolute -bottom-9 left-2 rounded-full px-3 py-0.5 text-sm font-extrabold text-white" style={{ background: KID.blue }}>← Westen</div>
        <div className="kid-font absolute -bottom-9 right-2 rounded-full px-3 py-0.5 text-sm font-extrabold text-white" style={{ background: KID.coral }}>Osten →</div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-[4%] right-[4%]">
        {trailTo !== null && (
          <div className="absolute bottom-[20%] h-12" style={{ left: Math.min(pct(trailFrom), pct(trailTo)) + '%', width: Math.max(0.5, Math.abs(pct(trailTo) - pct(trailFrom))) + '%' }}>
            <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full" style={{ background: 'rgba(63,155,240,0.5)' }} />
          </div>
        )}

        <motion.div className="absolute z-20 -translate-x-1/2" style={{ bottom: '32%' }} animate={{ left: pct(position) + '%' }} transition={{ duration: hopping ? Math.min(2.2, 0.8 + (MAIN.absA + MAIN.absB) / 60) : 0.4, ease: 'easeInOut' }}>
          <Luno mood={mood} hopping={hopping} dir={dir} />
          <div className="kid-font mx-auto -mt-1 w-fit rounded-full border-2 px-3 py-0.5 text-base font-extrabold" style={{ background: secret ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink }}>
            {hopping ? hopCount : secret ? '?' : position}
          </div>
        </motion.div>
      </div>

      {hopping && (
        <div className="kid-font absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-2xl border-4 px-5 py-2 text-2xl font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>
          👣 {hopCount} Felder
        </div>
      )}
    </div>
  );
}

function EquationCards({ revealed, first, second, result }) {
  const chips = [{ text: '0', dim: false }];
  chips.push({ text: '+ (' + first + ')', dim: revealed < 1 });
  chips.push({ text: '+ (' + second + ')', dim: revealed < 2 });
  chips.push({ text: revealed >= 2 ? '= ' + result : '= ?', dim: revealed < 2 });
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus der Bewegung wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {chips.map((chip, index) => (
          <span key={index} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: chip.dim ? '#eef1f6' : index === chips.length - 1 ? '#dcf5e1' : '#dceeff', borderColor: chip.dim ? '#c6cdd9' : KID.ink, color: chip.dim ? '#9aa3b5' : KID.ink }}>{chip.text}</span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [act, setAct] = useState('watch');
  const [position, setPosition] = useState(0);
  const [hopping, setHopping] = useState(false);
  const [hopCount, setHopCount] = useState(0);
  const [mood, setMood] = useState('happy');
  const [dir, setDir] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [trail, setTrail] = useState({ from: 0, to: null });
  const [bubble, setBubble] = useState('Hallo! Ich bin Luno. Schau zu, wie ich ' + MAIN.a + ' + (' + MAIN.b + ') hüpfe!');
  const [stars, setStars] = useState(0);
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [doPhase, setDoPhase] = useState('direction');
  const [challenge, setChallenge] = useState(() => makePractice(0));
  const [wins, setWins] = useState(0);
  const [bonusLevel, setBonusLevel] = useState(false);
  const [finished, setFinished] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function award(points, diamond) {
    setStars((value) => value + points);
    if (diamond) setGems((value) => value + 1);
    Meoluna.reportScore(points, { action: 'focused-intervention', prompt: ORIGINAL_PROMPT });
  }

  function hop(from, to, after) {
    const total = Math.abs(to - from);
    const duration = Math.min(2200, 700 + total * 18);
    setHopping(true);
    setHopCount(0);
    setDir(Math.sign(to - from));
    setTrail({ from, to });
    setPosition(to);
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const ratio = Math.min(1, (Date.now() - startedAt) / duration);
      setHopCount(Math.round(ratio * total));
      if (ratio >= 1) {
        clearInterval(timer.current);
        setHopping(false);
        setDir(0);
        after();
      }
    }, 40);
  }

  function playDemo() {
    if (hopping) return;
    setPosition(0);
    setRevealed(0);
    setBubble(MAIN.a + ' heißt: ' + MAIN.absA + ' Felder nach Westen!');
    hop(0, MAIN.a, () => {
      setRevealed(1);
      setBubble('Und ' + MAIN.b + ' heißt: noch ' + MAIN.absB + ' Felder weiter nach Westen!');
      setTimeout(() => {
        hop(MAIN.a, MAIN.result, () => {
          setRevealed(2);
          setMood('cheer');
          setBubble('Ich bin bei ' + MAIN.result + ' gelandet! Zwei West-Wege bleiben Westen.');
          award(5, false);
          setTimeout(() => setMood('happy'), 1200);
        });
      }, 900);
    });
  }

  function startDoAct() {
    setAct('do');
    setPosition(0);
    setRevealed(0);
    setTrail({ from: 0, to: null });
    setDoPhase('direction');
    setBubble('Jetzt du! ' + MAIN.a + ' + (' + MAIN.b + '). In welche Richtung gehst du?');
  }

  function chooseDirection(chosen) {
    if (doPhase !== 'direction') return;
    if (chosen < 0) {
      setDoPhase('hop');
      setBubble('Genau, nach Westen! Drücke auf Hüpfen!');
    } else {
      setMood('sad');
      setBubble('Minus bedeutet Westen. Probier es nochmal!');
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function startUserHop() {
    if (doPhase !== 'hop' || hopping) return;
    setBubble('Erst ' + MAIN.absA + ' Felder, dann noch ' + MAIN.absB + '!');
    hop(0, MAIN.a, () => {
      setRevealed(1);
      setTimeout(() => {
        hop(MAIN.a, MAIN.result, () => {
          setDoPhase('land');
          setBubble('Wo bist du gelandet? Tippe auf die richtige Zahl!');
        });
      }, 700);
    });
  }

  function checkLanding(choice) {
    if (doPhase !== 'land') return;
    setAttempts((list) => [...list, choice]);
    if (choice === MAIN.result) {
      setRevealed(2);
      setMood('cheer');
      setBubble('Richtig! ' + MAIN.a + ' + (' + MAIN.b + ') = ' + MAIN.result + '. Du addierst die Felder und behältst das Minus.');
      award(10, true);
      Meoluna.completeModule('verstehen', 15);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setDoPhase('done');
      setTimeout(() => setMood('happy'), 1200);
    } else if (choice === Math.abs(MAIN.result)) {
      setMood('sad');
      setBubble('Fast! Zwei Minuswege werden nicht Plus. Du bleibst im Westen.');
      setTimeout(() => setMood('happy'), 700);
    } else {
      setMood('sad');
      setBubble('Zähle beide West-Wege zusammen: ' + MAIN.absA + ' und ' + MAIN.absB + '.');
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function startPractice() {
    setAct('practice');
    setPosition(0);
    setRevealed(0);
    setTrail({ from: 0, to: null });
    setBubble('Deine Aufgabe: ' + challenge.first + ' + (' + challenge.second + '). Tippe auf das Ergebnis!');
  }

  function checkPractice(choice) {
    if (finished) return;
    setAttempts((list) => [...list, choice]);
    if (choice === challenge.result) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setMood('cheer');
      setBubble('Richtig! ' + challenge.first + ' + (' + challenge.second + ') = ' + challenge.result + '!');
      award(10, nextStreak % 3 === 0);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      hop(0, challenge.result, () => {
        setTimeout(() => setMood('happy'), 600);
      });
      const nextWins = wins + 1;
      if (!bonusLevel && nextWins >= PRACTICE_GOAL) {
        Meoluna.completeModule('uebung', 30);
        setBonusLevel(true);
        setWins(0);
        setTimeout(() => {
          const next = makePractice(nextWins, 2);
          setChallenge(next);
          setPosition(0);
          setTrail({ from: 0, to: null });
          setBubble('💎 Bonus-Level! Jetzt mit großen Zahlen: ' + next.first + ' + (' + next.second + '). Du schaffst das!');
        }, 1800);
      } else if (bonusLevel && nextWins >= BONUS_GOAL) {
        setWins(nextWins);
        setFinished(true);
        Meoluna.completeModule('bonus', 20);
        Meoluna.complete(65);
        setTimeout(() => setBubble('Du hast alles geschafft! Westen + Westen bleibt Westen. 🏆'), 1500);
      } else {
        setWins(nextWins);
        setTimeout(() => {
          const next = makePractice(nextWins + (bonusLevel ? 7 : 0), bonusLevel ? 2 : 1);
          setChallenge(next);
          setPosition(0);
          setTrail({ from: 0, to: null });
          setBubble('Nächste Aufgabe: ' + next.first + ' + (' + next.second + '). Tippe auf das Ergebnis!');
        }, 1800);
      }
    } else {
      setStreak(0);
      setMood('sad');
      setBubble('Du drehst nicht um! Beide Zahlen sind minus, also weiter nach Westen.');
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <div className="kid-font min-h-screen p-3 sm:p-6" style={{ background: 'linear-gradient(180deg, ' + KID.skyBottom + ', #f8fdf2)' }}>
      <KidStyles />
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {['watch', 'do', 'practice'].map((step, index) => (
              <div key={step} className="kid-font flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-extrabold" style={{ background: act === step ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink }}>{index + 1}</div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-lg" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>⭐ <span className="font-extrabold">{stars}</span></div>
            <div className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-lg" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>💎 <span className="font-extrabold">{gems}</span></div>
            <div className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-lg" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>🔥 <span className="font-extrabold">{streak}</span></div>
          </div>
        </div>

        <SpeechBubble text={bubble} />

        <Scene position={position} hopping={hopping} hopCount={hopCount} mood={mood} dir={dir} trailFrom={trail.from} trailTo={trail.to} secret={act === 'do' && doPhase === 'land'} />

        {act === 'watch' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <BigButton onClick={playDemo} color={KID.blue} colorDark={KID.blueDark}>▶️ Zeig mir!</BigButton>
            <BigButton onClick={startDoAct} color={KID.green} colorDark={KID.greenDark} disabled={revealed < 2}>Jetzt du! →</BigButton>
          </div>
        )}

        {act === 'do' && doPhase === 'direction' && (
          <div className="grid grid-cols-2 gap-4">
            <BigButton onClick={() => chooseDirection(-1)} color={KID.blue} colorDark={KID.blueDark}>⬅️ Nach Westen</BigButton>
            <BigButton onClick={() => chooseDirection(1)} color={KID.coral} colorDark={KID.coralDark}>Nach Osten ➡️</BigButton>
          </div>
        )}

        {act === 'do' && doPhase === 'hop' && (
          <BigButton onClick={startUserHop} color={KID.green} colorDark={KID.greenDark}>🐾 hüpfen!</BigButton>
        )}

        {act === 'do' && doPhase === 'land' && (
          <div className="grid grid-cols-3 gap-3">
            {[MAIN.result, Math.abs(MAIN.result), MAIN.a + MAIN.b - 10].map((choice) => (
              <button key={choice} type="button" onClick={() => checkLanding(choice)} className="kid-font min-h-[64px] rounded-3xl border-4 text-2xl font-extrabold transition-all active:translate-y-1" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 6px 0 ' + KID.pathEdge }}>{choice}</button>
            ))}
          </div>
        )}

        {act === 'do' && doPhase === 'done' && (
          <BigButton onClick={startPractice} color={KID.green} colorDark={KID.greenDark}>🎯 Jetzt üben!</BigButton>
        )}

        {act === 'practice' && !finished && (
          <div className="flex flex-col gap-3">
            <div className="kid-font mx-auto rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: bonusLevel ? '#e6f2ff' : KID.card, borderColor: KID.ink, color: KID.ink }}>
              {bonusLevel ? '💎 Bonus' : '🎯 Übung'}: {wins}/{bonusLevel ? BONUS_GOAL : PRACTICE_GOAL}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {challenge.choices.map((choice) => (
                <button key={choice} type="button" onClick={() => checkPractice(choice)} className="kid-font min-h-[64px] rounded-3xl border-4 text-2xl font-extrabold transition-all active:translate-y-1" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 6px 0 ' + KID.pathEdge }}>{choice}</button>
              ))}
            </div>
          </div>
        )}

        {act === 'practice' && finished && (
          <div className="rounded-3xl border-4 p-5 text-center" style={{ background: '#e8f9e4', borderColor: KID.ink }}>
            <p className="text-2xl font-extrabold" style={{ color: KID.ink }}>🏆 Alle Abzeichen geschafft!</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>🧭 West-Versteher</span>
              <span className="rounded-full border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>⛏️ Minus-Miner</span>
              <span className="rounded-full border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>💎 Diamant-Profi</span>
            </div>
          </div>
        )}

        <EquationCards revealed={revealed} first={act === 'practice' ? challenge.first : MAIN.a} second={act === 'practice' ? challenge.second : MAIN.b} result={act === 'practice' ? challenge.result : MAIN.result} />
      </div>
    </div>
  );
}`;
}
