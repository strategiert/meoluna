export type ParsedSignedAddition = {
  a: number;
  b: number;
};

export function parseSignedIntegerAddition(text: string): ParsedSignedAddition | null {
  const normalised = text.replace(/\u2212/g, "-").replace(/\s+/g, " ");
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
  const min = Math.floor((Math.min(0, a, b, result) - 20) / 10) * 10;
  const max = Math.ceil((Math.max(0, a, b, result) + 20) / 10) * 10;
  const practiceA = -Math.max(4, Math.round(absA * 0.65));
  const practiceB = -Math.max(3, Math.round(absB * 0.55));
  const prompt = escapeJs(input.prompt);

  return `import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const MIN = ${min};
const MAX = ${max};
const MAIN = { a: ${a}, b: ${b}, result: ${result}, absA: ${absA}, absB: ${absB} };
const ORIGINAL_PROMPT = ${prompt};

function pct(value) {
  return ((value - MIN) / (MAX - MIN)) * 100;
}

function makePractice(seed) {
  const first = ${practiceA} - seed;
  const second = ${practiceB} - seed;
  const result = first + second;
  return { first, second, result, choices: [result, Math.abs(result), first - second, result + 10].sort(() => Math.random() - 0.5) };
}

export default function App() {
  const [position, setPosition] = useState(0);
  const [stage, setStage] = useState(0);
  const [xp, setXp] = useState(0);
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState('Starte bei 0. Westen bedeutet Minus.');
  const [attempts, setAttempts] = useState([]);
  const [challenge, setChallenge] = useState(() => makePractice(0));
  const ticks = useMemo(() => {
    const values = [];
    const step = Math.max(10, Math.ceil((MAX - MIN) / 7 / 10) * 10);
    for (let value = Math.ceil(MIN / step) * step; value <= MAX; value += step) values.push(value);
    if (!values.includes(0)) values.push(0);
    if (!values.includes(MAIN.result)) values.push(MAIN.result);
    return values.sort((x, y) => x - y);
  }, []);

  function award(points, diamond = false) {
    setXp((value) => value + points);
    if (diamond) setGems((value) => value + 1);
    Meoluna.reportScore(points, { action: 'focused-intervention', prompt: ORIGINAL_PROMPT });
  }

  function stepWestOne() {
    if (stage >= 1) return;
    setStage(1);
    setPosition(MAIN.a);
    setFeedback(MAIN.a + ' bedeutet: ' + MAIN.absA + ' Felder nach Westen. Die Figur steht jetzt bei ' + MAIN.a + '.');
    award(5);
  }

  function stepWestTwo() {
    if (stage < 1) stepWestOne();
    if (stage >= 2) return;
    setStage(2);
    setPosition(MAIN.result);
    setFeedback('Noch ' + MAIN.absB + ' Felder weiter nach Westen. Aus der Bewegung wird: ' + MAIN.a + ' + (' + MAIN.b + ') = ' + MAIN.result + '.');
    award(10, true);
    Meoluna.completeModule('demo', 15);
  }

  function resetDemo() {
    setPosition(0);
    setStage(0);
    setFeedback('Starte bei 0. Westen bedeutet Minus.');
  }

  function checkAnswer(choice) {
    const nextAttempts = [...attempts, choice];
    setAttempts(nextAttempts);
    if (choice === challenge.result) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setFeedback('Richtig: ' + challenge.first + ' + (' + challenge.second + ') = ' + challenge.result + '. Zwei West-Wege bleiben Westen.');
      award(10, nextStreak % 3 === 0);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.65 } });
      setChallenge(makePractice(nextStreak));
      if (nextStreak >= 3) {
        Meoluna.completeModule('practice', 30);
        Meoluna.complete(45);
      }
    } else {
      setStreak(0);
      setFeedback('Fast. Du drehst nicht um. Beide Zahlen sind negativ, also gehst du weiter nach Westen. Richtig waere ' + challenge.result + '.');
    }
  }

  const pathOneLeft = Math.min(pct(0), pct(MAIN.a));
  const pathOneWidth = Math.abs(pct(MAIN.a) - pct(0));
  const pathTwoLeft = Math.min(pct(MAIN.a), pct(MAIN.result));
  const pathTwoWidth = Math.abs(pct(MAIN.result) - pct(MAIN.a));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-emerald-950 p-4 text-white sm:p-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <header className="xl:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Minus-Welt: Nach Westen wird es kleiner</h1>
            <p className="mt-3 max-w-3xl text-lg text-white/75">Eine kleine Blockwelt fuer {MAIN.a} + ({MAIN.b}). Start bei 0. Westen bedeutet Minus.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-slate-950/65 p-4 text-lg font-black shadow-2xl">
            <div className="flex justify-between gap-10"><span>XP</span><span>{xp}</span></div>
            <div className="flex justify-between gap-10"><span>Diamanten</span><span>{gems}</span></div>
            <div className="flex justify-between gap-10"><span>Serie</span><span>{streak}</span></div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/15 bg-slate-800/85 p-5 shadow-2xl">
          <button
            type="button"
            onClick={() => (stage === 0 ? stepWestOne() : stage === 1 ? stepWestTwo() : resetDemo())}
            className="relative block h-[430px] w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-sky-900/50 via-slate-800 to-lime-950 text-left focus:outline-none focus:ring-4 focus:ring-yellow-300/50"
            aria-label="Blockwelt anklicken, um den naechsten Rechenschritt auszufuehren"
          >
            <div className="absolute right-10 top-8 h-20 w-20 rotate-12 rounded-xl bg-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.45)]" />
            <div className="absolute left-20 top-16 h-12 w-44 rounded-xl bg-white/65 shadow-[70px_16px_0_rgba(255,255,255,0.55)]" />
            <div className="absolute right-4 top-4 rounded-full bg-slate-950/70 px-4 py-2 text-sm font-black text-yellow-200">
              {stage === 0 ? 'Klick: erster West-Weg' : stage === 1 ? 'Klick: zweiter West-Weg' : 'Klick: nochmal ansehen'}
            </div>
            <div className="absolute inset-x-0 bottom-0 grid h-24" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
              {Array.from({ length: 20 }).map((_, index) => <div key={index} className="border border-black/25 bg-gradient-to-b from-green-400 from-25% to-amber-900" />)}
            </div>
            <div className="absolute inset-x-[7%] bottom-36 h-28">
              <div className="absolute inset-x-0 top-12 h-2 rounded-full bg-white" />
              {ticks.map((tick) => (
                <div key={tick} className="absolute top-7 -translate-x-1/2 text-center text-sm font-black text-white/75" style={{ left: pct(tick) + '%' }}>
                  <div className="mx-auto h-9 w-1 rounded-full bg-white/80" />
                  <span>{tick}</span>
                </div>
              ))}
              {stage >= 1 && <div className="absolute top-6 h-4 rounded-full bg-orange-400" style={{ left: pathOneLeft + '%', width: pathOneWidth + '%' }} />}
              {stage >= 2 && <div className="absolute top-1 h-4 rounded-full bg-orange-500" style={{ left: pathTwoLeft + '%', width: pathTwoWidth + '%' }} />}
              {stage >= 1 && <div className="absolute top-0 -translate-x-1/2 rounded-full bg-slate-950 px-3 py-1 text-sm font-black">{MAIN.absA} Felder nach Westen</div>}
              {stage >= 2 && <div className="absolute -top-8 -translate-x-1/2 rounded-full bg-slate-950 px-3 py-1 text-sm font-black" style={{ left: pct((MAIN.a + MAIN.result) / 2) + '%' }}>noch {MAIN.absB} Felder</div>}
              {stage >= 2 && <div className="absolute -top-14 h-9 w-9 -translate-x-1/2 rotate-45 rounded bg-cyan-300 shadow-[0_0_25px_rgba(103,232,249,0.6)]" style={{ left: pct(MAIN.result) + '%' }} />}
            </div>
            <motion.div className="absolute bottom-[210px] z-20 flex -translate-x-1/2 flex-col items-center drop-shadow-2xl" animate={{ left: pct(position) + '%' }} transition={{ type: 'spring', stiffness: 95, damping: 16 }}>
              <div className="mb-1 rounded-lg bg-slate-950 px-3 py-1 text-base font-black">{position}</div>
              <div className="h-9 w-9 rounded-t-md border-4 border-slate-950 bg-amber-200" />
              <div className="h-9 w-12 border-4 border-slate-950 bg-green-500" />
              <div className="-mt-1 flex gap-1"><div className="h-7 w-4 border-4 border-slate-950 bg-blue-600" /><div className="h-7 w-4 border-4 border-slate-950 bg-blue-600" /></div>
            </motion.div>
          </button>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/50 p-4"><p className="text-sm font-black text-white/60">Start</p><p className="text-4xl font-black">0</p><p>Hier steht die Figur zuerst.</p></div>
            <div className="rounded-2xl bg-slate-950/50 p-4"><p className="text-sm font-black text-white/60">Erster Weg</p><p className="text-4xl font-black">{MAIN.a}</p><p>{MAIN.absA} Felder nach Westen.</p></div>
            <div className="rounded-2xl bg-slate-950/50 p-4"><p className="text-sm font-black text-white/60">Zweiter Weg</p><p className="text-4xl font-black">{MAIN.b}</p><p>Noch einmal weiter nach Westen.</p></div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={stepWestOne} className="rounded-2xl bg-yellow-300 px-5 py-4 font-black text-slate-950 shadow-lg shadow-yellow-900/40">1. {MAIN.absA} nach Westen</button>
            <button onClick={stepWestTwo} className="rounded-2xl bg-yellow-300 px-5 py-4 font-black text-slate-950 shadow-lg shadow-yellow-900/40">2. noch {MAIN.absB} weiter</button>
            <button onClick={() => { resetDemo(); setTimeout(stepWestOne, 150); setTimeout(stepWestTwo, 1100); }} className="rounded-2xl bg-green-300 px-5 py-4 font-black text-slate-950">Animation komplett</button>
            <button onClick={resetDemo} className="rounded-2xl bg-slate-300 px-5 py-4 font-black text-slate-950">Reset</button>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/15 bg-slate-800/85 p-5 shadow-2xl">
          <h2 className="text-3xl font-black">Was passiert?</h2>
          <div className="mt-3 rounded-2xl border-l-8 border-yellow-300 bg-slate-950/55 p-4 text-lg">{feedback}</div>

          <h2 className="mt-6 text-3xl font-black">Rechenbild</h2>
          <div className="mt-3 rounded-2xl bg-slate-950/55 p-4">
            <p className="text-sm font-black text-white/60">Aus der Geschichte wird:</p>
            <p className="mt-2 text-4xl font-black">{stage >= 2 ? MAIN.a + ' + (' + MAIN.b + ') = ' + MAIN.result : stage === 1 ? '0 + (' + MAIN.a + ') = ' + MAIN.a : '0'}</p>
            <p className="mt-2 text-white/75">{stage >= 2 ? 'Du zaehlst beide West-Wege zusammen und setzt das Minus davor.' : 'Noch nicht fertig.'}</p>
          </div>

          <h2 className="mt-6 text-3xl font-black">Mini-Challenge</h2>
          <p className="mt-1 text-white/70">Rechne weiter in der Blockwelt.</p>
          <p className="mt-3 text-3xl font-black">{challenge.first} + ({challenge.second}) = ?</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {challenge.choices.map((choice) => <button key={choice} onClick={() => checkAnswer(choice)} className="rounded-2xl border border-white/15 bg-slate-950/55 px-4 py-4 text-2xl font-black hover:bg-slate-900">{choice}</button>)}
          </div>
          <p className="mt-4 rounded-2xl bg-slate-950/55 p-4 text-white/75">Tipp: Westen + Westen = weiter nach Westen.</p>

          <h2 className="mt-6 text-3xl font-black">Abzeichen</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={'rounded-full border px-3 py-2 font-black ' + (xp >= 10 ? 'border-green-300 bg-green-300/20' : 'border-white/15 bg-slate-950/40')}>West-Versteher</span>
            <span className={'rounded-full border px-3 py-2 font-black ' + (xp >= 35 ? 'border-green-300 bg-green-300/20' : 'border-white/15 bg-slate-950/40')}>Minus-Miner</span>
            <span className={'rounded-full border px-3 py-2 font-black ' + (gems >= 2 ? 'border-green-300 bg-green-300/20' : 'border-white/15 bg-slate-950/40')}>Diamant-Profi</span>
          </div>
        </aside>
      </div>
    </div>
  );
}`;
}
