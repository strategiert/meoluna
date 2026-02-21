// ============================================================================
// WORLD SKELETON — Deterministischer App-Assembler
//
// Das LLM generiert KEINE freie React-App mehr, sondern ein JSON-Spec.
// Diese Funktion baut daraus deterministischen, zuverlässigen React-Code.
//
// Garantiert durch die Skeleton-Architektur:
// ✓ App-Komponente + export default
// ✓ Meoluna.completeModule() bei jedem Modul-Abschluss
// ✓ Meoluna.complete() beim Welt-Abschluss
// ✓ Hub → Modul → Abschluss Navigation
// ✓ "Zurück zum Hub"-Button immer vorhanden
// ✓ Kein HTML-Dokument, kein script src
// ============================================================================

// ── Typen ──────────────────────────────────────────────────────────────────

export interface WorldConfig {
  name: string;
  tagline: string;
  emoji: string;
  primaryColor: string;        // hex, z.B. "#0ea5e9"
  bgGradient: string;          // Tailwind classes, z.B. "from-blue-950 via-blue-900 to-cyan-950"
  cardBg: string;              // Tailwind class, z.B. "bg-blue-900/60"
  accentClass: string;         // Tailwind class für Buttons, z.B. "bg-sky-500 hover:bg-sky-400"
}

export interface MultipleChoiceChallenge {
  type: 'multiple-choice';
  question: string;
  options: string[];
  correct: number;             // Index in options[]
  xp: number;
  feedbackCorrect: string;
  feedbackWrong: string;
}

export interface TrueFalseChallenge {
  type: 'true-false';
  question: string;
  correct: boolean;
  xp: number;
  feedbackCorrect: string;
  feedbackWrong: string;
}

export interface FillBlankChallenge {
  type: 'fill-blank';
  questionBefore: string;      // Text vor der Lücke
  questionAfter: string;       // Text nach der Lücke
  answer: string;              // Korrekte Antwort (case-insensitive)
  xp: number;
  feedbackCorrect: string;
  feedbackWrong: string;
}

export interface NumberChallenge {
  type: 'number';
  question: string;
  answer: number;
  tolerance: number;
  unit: string;
  xp: number;
  feedbackCorrect: string;
  feedbackWrong: string;
}

export interface SortingChallenge {
  type: 'sorting';
  instruction: string;
  items: string[];             // Shuffled display order
  correct: string[];           // Correct order
  xp: number;
  feedbackCorrect: string;
  feedbackWrong: string;
}

export interface MatchingChallenge {
  type: 'matching';
  instruction: string;
  pairs: Array<{ left: string; right: string }>;
  xp: number;
  feedbackCorrect: string;
  feedbackWrong: string;
}

export type Challenge =
  | MultipleChoiceChallenge
  | TrueFalseChallenge
  | FillBlankChallenge
  | NumberChallenge
  | SortingChallenge
  | MatchingChallenge;

export interface WorldModule {
  id: number;
  title: string;
  emoji: string;
  description: string;
  challenges: Challenge[];
}

export interface WorldData {
  config: WorldConfig;
  modules: WorldModule[];
}

// ── Assembler ───────────────────────────────────────────────────────────────

/**
 * Baut aus einem WorldData-JSON den vollständigen React-Appcode.
 * Keine LLM-Freiheiten — nur deterministischer Skeleton + injizierte Daten.
 */
export function buildWorldCode(worldData: WorldData): string {
  const dataJson = JSON.stringify(worldData, null, 2);

  return [
    `import { useState, useCallback } from 'react';`,
    `import { motion, AnimatePresence } from 'framer-motion';`,
    `import confetti from 'canvas-confetti';`,
    ``,
    `// ── Welt-Daten (generiert vom LLM, Skeleton bleibt fest) ──`,
    `const WORLD_DATA = ${dataJson};`,
    ``,
    `// ── Hilfsfunktionen ──`,
    `function normalize(s) { return String(s).trim().toLowerCase(); }`,
    ``,
    `// ── Feedback-Overlay ──`,
    `function FeedbackOverlay({ correct, message, onNext }) {`,
    `  return (`,
    `    <motion.div`,
    `      initial={{ opacity: 0, scale: 0.8 }}`,
    `      animate={{ opacity: 1, scale: 1 }}`,
    `      exit={{ opacity: 0, scale: 0.8 }}`,
    `      className={'fixed inset-0 flex items-center justify-center z-50 p-6'}`,
    `    >`,
    `      <div className={'rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center ' + (correct ? 'bg-green-500' : 'bg-red-500')}>`,
    `        <div className="text-6xl mb-4">{correct ? '✅' : '❌'}</div>`,
    `        <p className="text-white text-xl font-bold mb-6">{message}</p>`,
    `        <button`,
    `          onClick={onNext}`,
    `          className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-lg transition-colors"`,
    `        >`,
    `          Weiter →`,
    `        </button>`,
    `      </div>`,
    `    </motion.div>`,
    `  );`,
    `}`,
    ``,
    `// ── Multiple-Choice Challenge ──`,
    `function MultipleChoice({ challenge, onResult }) {`,
    `  const [selected, setSelected] = useState(null);`,
    `  const [feedback, setFeedback] = useState(null);`,
    `  function choose(i) {`,
    `    if (feedback) return;`,
    `    setSelected(i);`,
    `    const ok = i === challenge.correct;`,
    `    setFeedback({ correct: ok, message: ok ? challenge.feedbackCorrect : challenge.feedbackWrong });`,
    `    if (ok) { Meoluna.reportScore(challenge.xp, { action: 'correct', type: 'multiple-choice' }); confetti({ particleCount: 60, spread: 70 }); }`,
    `  }`,
    `  return (`,
    `    <div className="space-y-4">`,
    `      <p className="text-white text-xl font-semibold text-center mb-6">{challenge.question}</p>`,
    `      <div className="grid gap-3">`,
    `        {challenge.options.map((opt, i) => (`,
    `          <motion.button`,
    `            key={i} whileTap={{ scale: 0.97 }}`,
    `            onClick={() => choose(i)}`,
    `            className={'w-full p-4 rounded-xl text-left font-medium transition-all ' +`,
    `              (feedback === null ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' :`,
    `               i === challenge.correct ? 'bg-green-500 text-white' :`,
    `               i === selected ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40')}`,
    `          >`,
    `            <span className="font-bold mr-2">{['A','B','C','D'][i]}.</span>{opt}`,
    `          </motion.button>`,
    `        ))}`,
    `      </div>`,
    `      <AnimatePresence>`,
    `        {feedback && <FeedbackOverlay correct={feedback.correct} message={feedback.message} onNext={() => onResult(feedback.correct)} />}`,
    `      </AnimatePresence>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── True/False Challenge ──`,
    `function TrueFalse({ challenge, onResult }) {`,
    `  const [feedback, setFeedback] = useState(null);`,
    `  function choose(val) {`,
    `    if (feedback) return;`,
    `    const ok = val === challenge.correct;`,
    `    setFeedback({ correct: ok, message: ok ? challenge.feedbackCorrect : challenge.feedbackWrong });`,
    `    if (ok) { Meoluna.reportScore(challenge.xp, { action: 'correct', type: 'true-false' }); confetti({ particleCount: 60, spread: 70 }); }`,
    `  }`,
    `  return (`,
    `    <div className="space-y-6">`,
    `      <p className="text-white text-xl font-semibold text-center mb-8">{challenge.question}</p>`,
    `      <div className="grid grid-cols-2 gap-4">`,
    `        <motion.button whileTap={{ scale: 0.95 }} onClick={() => choose(true)}`,
    `          className="p-6 rounded-2xl bg-green-600/40 hover:bg-green-600/60 text-white font-bold text-2xl border-2 border-green-500/50 transition-all"`,
    `        >✓ Richtig</motion.button>`,
    `        <motion.button whileTap={{ scale: 0.95 }} onClick={() => choose(false)}`,
    `          className="p-6 rounded-2xl bg-red-600/40 hover:bg-red-600/60 text-white font-bold text-2xl border-2 border-red-500/50 transition-all"`,
    `        >✗ Falsch</motion.button>`,
    `      </div>`,
    `      <AnimatePresence>`,
    `        {feedback && <FeedbackOverlay correct={feedback.correct} message={feedback.message} onNext={() => onResult(feedback.correct)} />}`,
    `      </AnimatePresence>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── Fill-Blank Challenge ──`,
    `function FillBlank({ challenge, onResult }) {`,
    `  const [input, setInput] = useState('');`,
    `  const [feedback, setFeedback] = useState(null);`,
    `  function check() {`,
    `    if (feedback || !input.trim()) return;`,
    `    const ok = normalize(input) === normalize(challenge.answer);`,
    `    setFeedback({ correct: ok, message: ok ? challenge.feedbackCorrect : challenge.feedbackWrong + ' (Richtig wäre: ' + challenge.answer + ')' });`,
    `    if (ok) { Meoluna.reportScore(challenge.xp, { action: 'correct', type: 'fill-blank' }); confetti({ particleCount: 60, spread: 70 }); }`,
    `  }`,
    `  return (`,
    `    <div className="space-y-6">`,
    `      <p className="text-white text-xl font-semibold text-center">`,
    `        {challenge.questionBefore}`,
    `        <span className="inline-block mx-2 border-b-2 border-white/60 min-w-24 text-center">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`,
    `        {challenge.questionAfter}`,
    `      </p>`,
    `      <div className="flex gap-3">`,
    `        <input`,
    `          type="text" value={input} onChange={e => setInput(e.target.value)}`,
    `          onKeyDown={e => e.key === 'Enter' && check()}`,
    `          placeholder="Deine Antwort..."`,
    `          className="flex-1 p-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/40 text-lg focus:outline-none focus:border-white/60"`,
    `        />`,
    `        <motion.button whileTap={{ scale: 0.95 }} onClick={check}`,
    `          className="px-6 py-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"`,
    `        >Prüfen</motion.button>`,
    `      </div>`,
    `      <AnimatePresence>`,
    `        {feedback && <FeedbackOverlay correct={feedback.correct} message={feedback.message} onNext={() => onResult(feedback.correct)} />}`,
    `      </AnimatePresence>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── Number Challenge ──`,
    `function NumberChallenge({ challenge, onResult }) {`,
    `  const [input, setInput] = useState('');`,
    `  const [feedback, setFeedback] = useState(null);`,
    `  function check() {`,
    `    if (feedback || !input.trim()) return;`,
    `    const val = parseFloat(input.replace(',', '.'));`,
    `    const ok = !isNaN(val) && Math.abs(val - challenge.answer) <= challenge.tolerance;`,
    `    setFeedback({ correct: ok, message: ok ? challenge.feedbackCorrect : challenge.feedbackWrong + ' (Richtig: ' + challenge.answer + ' ' + challenge.unit + ')' });`,
    `    if (ok) { Meoluna.reportScore(challenge.xp, { action: 'correct', type: 'number' }); confetti({ particleCount: 60, spread: 70 }); }`,
    `  }`,
    `  return (`,
    `    <div className="space-y-6">`,
    `      <p className="text-white text-xl font-semibold text-center">{challenge.question}</p>`,
    `      <div className="flex gap-3 items-center justify-center">`,
    `        <input`,
    `          type="number" value={input} onChange={e => setInput(e.target.value)}`,
    `          onKeyDown={e => e.key === 'Enter' && check()}`,
    `          placeholder="0"`,
    `          className="w-40 p-4 rounded-xl bg-white/10 border border-white/30 text-white text-xl text-center focus:outline-none focus:border-white/60"`,
    `        />`,
    `        <span className="text-white/70 text-lg">{challenge.unit}</span>`,
    `        <motion.button whileTap={{ scale: 0.95 }} onClick={check}`,
    `          className="px-6 py-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"`,
    `        >Prüfen</motion.button>`,
    `      </div>`,
    `      <AnimatePresence>`,
    `        {feedback && <FeedbackOverlay correct={feedback.correct} message={feedback.message} onNext={() => onResult(feedback.correct)} />}`,
    `      </AnimatePresence>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── Sorting Challenge ──`,
    `function SortingChallenge({ challenge, onResult }) {`,
    `  const [items, setItems] = useState(() => [...challenge.items]);`,
    `  const [selectedIdx, setSelectedIdx] = useState(null);`,
    `  const [feedback, setFeedback] = useState(null);`,
    `  function clickItem(i) {`,
    `    if (feedback) return;`,
    `    if (selectedIdx === null) { setSelectedIdx(i); return; }`,
    `    const next = [...items];`,
    `    [next[selectedIdx], next[i]] = [next[i], next[selectedIdx]];`,
    `    setItems(next); setSelectedIdx(null);`,
    `  }`,
    `  function check() {`,
    `    const ok = items.every((item, i) => item === challenge.correct[i]);`,
    `    setFeedback({ correct: ok, message: ok ? challenge.feedbackCorrect : challenge.feedbackWrong });`,
    `    if (ok) { Meoluna.reportScore(challenge.xp, { action: 'correct', type: 'sorting' }); confetti({ particleCount: 80, spread: 80 }); }`,
    `  }`,
    `  return (`,
    `    <div className="space-y-4">`,
    `      <p className="text-white text-lg font-semibold text-center mb-4">{challenge.instruction}</p>`,
    `      <p className="text-white/60 text-sm text-center">Klicke zwei Elemente zum Tauschen</p>`,
    `      <div className="space-y-2">`,
    `        {items.map((item, i) => (`,
    `          <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => clickItem(i)}`,
    `            className={'w-full p-3 rounded-xl text-white font-medium text-left flex items-center gap-3 transition-all ' +`,
    `              (selectedIdx === i ? 'bg-yellow-500/60 border-2 border-yellow-400' : 'bg-white/10 hover:bg-white/20 border border-white/20')}`,
    `          >`,
    `            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{i + 1}</span>`,
    `            {item}`,
    `          </motion.button>`,
    `        ))}`,
    `      </div>`,
    `      <motion.button whileTap={{ scale: 0.97 }} onClick={check}`,
    `        className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"`,
    `      >Reihenfolge prüfen ✓</motion.button>`,
    `      <AnimatePresence>`,
    `        {feedback && <FeedbackOverlay correct={feedback.correct} message={feedback.message} onNext={() => onResult(feedback.correct)} />}`,
    `      </AnimatePresence>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── Matching Challenge ──`,
    `function MatchingChallenge({ challenge, onResult }) {`,
    `  const [selectedLeft, setSelectedLeft] = useState(null);`,
    `  const [matches, setMatches] = useState({});`,
    `  const [feedback, setFeedback] = useState(null);`,
    `  const rights = challenge.pairs.map(p => p.right);`,
    `  function clickLeft(i) { if (feedback) return; setSelectedLeft(i); }`,
    `  function clickRight(i) {`,
    `    if (feedback || selectedLeft === null) return;`,
    `    setMatches(m => ({ ...m, [selectedLeft]: i }));`,
    `    setSelectedLeft(null);`,
    `  }`,
    `  function check() {`,
    `    const ok = challenge.pairs.every((_, i) => matches[i] === i);`,
    `    setFeedback({ correct: ok, message: ok ? challenge.feedbackCorrect : challenge.feedbackWrong });`,
    `    if (ok) { Meoluna.reportScore(challenge.xp, { action: 'correct', type: 'matching' }); confetti({ particleCount: 80, spread: 80 }); }`,
    `  }`,
    `  function reset() { setMatches({}); setSelectedLeft(null); }`,
    `  const allMatched = Object.keys(matches).length === challenge.pairs.length;`,
    `  return (`,
    `    <div className="space-y-4">`,
    `      <p className="text-white text-lg font-semibold text-center mb-2">{challenge.instruction}</p>`,
    `      <div className="grid grid-cols-2 gap-3">`,
    `        <div className="space-y-2">`,
    `          {challenge.pairs.map((p, i) => (`,
    `            <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => clickLeft(i)}`,
    `              className={'w-full p-3 rounded-xl text-white text-sm font-medium transition-all ' +`,
    `                (selectedLeft === i ? 'bg-yellow-500/70 border-2 border-yellow-300' :`,
    `                 matches[i] !== undefined ? 'bg-green-500/40 border border-green-400/50' :`,
    `                 'bg-white/10 hover:bg-white/20 border border-white/20')}`,
    `            >{p.left}</motion.button>`,
    `          ))}`,
    `        </div>`,
    `        <div className="space-y-2">`,
    `          {rights.map((r, i) => (`,
    `            <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => clickRight(i)}`,
    `              className={'w-full p-3 rounded-xl text-white text-sm font-medium transition-all ' +`,
    `                (Object.values(matches).includes(i) ? 'bg-blue-500/40 border border-blue-400/50' :`,
    `                 'bg-white/10 hover:bg-white/20 border border-white/20')}`,
    `            >{r}</motion.button>`,
    `          ))}`,
    `        </div>`,
    `      </div>`,
    `      <div className="flex gap-2">`,
    `        {allMatched && <motion.button whileTap={{ scale: 0.97 }} onClick={check}`,
    `          className="flex-1 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"`,
    `        >Zuordnung prüfen ✓</motion.button>}`,
    `        <motion.button whileTap={{ scale: 0.97 }} onClick={reset}`,
    `          className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"`,
    `        >Zurücksetzen</motion.button>`,
    `      </div>`,
    `      <AnimatePresence>`,
    `        {feedback && <FeedbackOverlay correct={feedback.correct} message={feedback.message} onNext={() => onResult(feedback.correct)} />}`,
    `      </AnimatePresence>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── Challenge Router ──`,
    `function ChallengeView({ challenge, onResult }) {`,
    `  const t = challenge.type;`,
    `  if (t === 'multiple-choice') return <MultipleChoice challenge={challenge} onResult={onResult} />;`,
    `  if (t === 'true-false') return <TrueFalse challenge={challenge} onResult={onResult} />;`,
    `  if (t === 'fill-blank') return <FillBlank challenge={challenge} onResult={onResult} />;`,
    `  if (t === 'number') return <NumberChallenge challenge={challenge} onResult={onResult} />;`,
    `  if (t === 'sorting') return <SortingChallenge challenge={challenge} onResult={onResult} />;`,
    `  if (t === 'matching') return <MatchingChallenge challenge={challenge} onResult={onResult} />;`,
    `  return <p className="text-red-400">Unbekannter Challenge-Typ: {challenge.type}</p>;`,
    `}`,
    ``,
    `// ── Modul-Screen ──`,
    `function ModuleScreen({ mod, moduleIndex, onComplete, onBack }) {`,
    `  const [challengeIndex, setChallengeIndex] = useState(0);`,
    `  const [score, setScore] = useState(0);`,
    `  const [done, setDone] = useState(false);`,
    `  const cfg = WORLD_DATA.config;`,
    ``,
    `  function handleResult(correct) {`,
    `    if (correct) setScore(s => s + (mod.challenges[challengeIndex]?.xp || 10));`,
    `    const next = challengeIndex + 1;`,
    `    if (next >= mod.challenges.length) setDone(true);`,
    `    else setChallengeIndex(next);`,
    `  }`,
    ``,
    `  if (done) return (`,
    `    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">`,
    `      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="space-y-6">`,
    `        <div className="text-8xl">{mod.emoji}</div>`,
    `        <h2 className="text-white text-3xl font-bold">{mod.title} abgeschlossen!</h2>`,
    `        <p className="text-white/70 text-xl">+{score} Punkte</p>`,
    `        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onComplete(score)}`,
    `          className={'px-10 py-4 rounded-2xl text-white font-bold text-xl ' + cfg.accentClass}`,
    `        >Weiter zum Hub →</motion.button>`,
    `      </motion.div>`,
    `    </div>`,
    `  );`,
    ``,
    `  const challenge = mod.challenges[challengeIndex];`,
    `  const progress = (challengeIndex / mod.challenges.length) * 100;`,
    ``,
    `  return (`,
    `    <div className="min-h-screen flex flex-col p-4">`,
    `      <div className="flex items-center gap-3 mb-6">`,
    `        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20">`,
    `          ← Hub`,
    `        </button>`,
    `        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">`,
    `          <motion.div animate={{ width: progress + '%' }} className="h-full bg-white rounded-full" />`,
    `        </div>`,
    `        <span className="text-white/70 text-sm">{challengeIndex + 1}/{mod.challenges.length}</span>`,
    `      </div>`,
    `      <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto">`,
    `        <div className="mb-6 text-center">`,
    `          <span className="text-4xl">{mod.emoji}</span>`,
    `          <h2 className="text-white font-bold text-xl mt-1">{mod.title}</h2>`,
    `        </div>`,
    `        <div className={'rounded-2xl p-6 ' + cfg.cardBg}>`,
    `          <AnimatePresence mode="wait">`,
    `            <motion.div key={challengeIndex}`,
    `              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}`,
    `            >`,
    `              <ChallengeView challenge={challenge} onResult={handleResult} />`,
    `            </motion.div>`,
    `          </AnimatePresence>`,
    `        </div>`,
    `      </div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── Hub-Screen ──`,
    `function HubScreen({ completedModules, totalScore, onSelectModule }) {`,
    `  const cfg = WORLD_DATA.config;`,
    `  const allDone = completedModules.length >= WORLD_DATA.modules.length;`,
    `  return (`,
    `    <div className="min-h-screen flex flex-col items-center p-6">`,
    `      <div className="max-w-2xl w-full space-y-8 pt-8">`,
    `        <div className="text-center space-y-2">`,
    `          <div className="text-6xl">{cfg.emoji}</div>`,
    `          <h1 className="text-white text-3xl font-bold">{cfg.name}</h1>`,
    `          <p className="text-white/70">{cfg.tagline}</p>`,
    `          {totalScore > 0 && <p className="text-white/50 text-sm">{totalScore} Punkte gesammelt</p>}`,
    `        </div>`,
    `        {allDone && (`,
    `          <div className="text-center p-6 rounded-2xl bg-yellow-500/20 border border-yellow-500/40">`,
    `            <div className="text-4xl mb-2">🏆</div>`,
    `            <p className="text-yellow-300 font-bold text-xl">Alle Module abgeschlossen!</p>`,
    `          </div>`,
    `        )}`,
    `        <div className="grid gap-4">`,
    `          {WORLD_DATA.modules.map((mod, i) => {`,
    `            const done = completedModules.includes(i);`,
    `            return (`,
    `              <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => onSelectModule(i)}`,
    `                className={'w-full p-5 rounded-2xl text-left flex items-center gap-4 transition-all ' + cfg.cardBg + ' border ' + (done ? 'border-green-500/50' : 'border-white/10 hover:border-white/30')}`,
    `              >`,
    `                <div className="text-4xl">{mod.emoji}</div>`,
    `                <div className="flex-1">`,
    `                  <div className="text-white font-bold text-lg">{mod.title}</div>`,
    `                  <div className="text-white/60 text-sm mt-0.5">{mod.description}</div>`,
    `                  <div className="text-white/40 text-xs mt-1">{mod.challenges.length} Aufgaben</div>`,
    `                </div>`,
    `                <div className="text-2xl">{done ? '✅' : '▶'}</div>`,
    `              </motion.button>`,
    `            );`,
    `          })}`,
    `        </div>`,
    `      </div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── Completion-Screen ──`,
    `function CompletionScreen({ totalScore }) {`,
    `  const cfg = WORLD_DATA.config;`,
    `  return (`,
    `    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">`,
    `      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-md">`,
    `        <div className="text-8xl">🎉</div>`,
    `        <h1 className="text-white text-4xl font-bold">{cfg.name}</h1>`,
    `        <p className="text-white/70 text-xl">Abgeschlossen!</p>`,
    `        <div className="text-5xl font-bold" style={{ color: cfg.primaryColor }}>{totalScore}</div>`,
    `        <p className="text-white/50">Punkte gesammelt</p>`,
    `        <p className="text-white/40 text-sm">Alle Module erfolgreich beendet</p>`,
    `      </motion.div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
    `// ── App (Haupt-Komponente) ──`,
    `export default function App() {`,
    `  const cfg = WORLD_DATA.config;`,
    `  const [view, setView] = useState('hub');`,
    `  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);`,
    `  const [completedModules, setCompletedModules] = useState([]);`,
    `  const [totalScore, setTotalScore] = useState(0);`,
    ``,
    `  function selectModule(i) {`,
    `    setCurrentModuleIndex(i);`,
    `    setView('module');`,
    `  }`,
    ``,
    `  function handleModuleComplete(score) {`,
    `    Meoluna.completeModule(currentModuleIndex);`,
    `    const newCompleted = completedModules.includes(currentModuleIndex)`,
    `      ? completedModules`,
    `      : [...completedModules, currentModuleIndex];`,
    `    const newScore = totalScore + score;`,
    `    setCompletedModules(newCompleted);`,
    `    setTotalScore(newScore);`,
    `    if (newCompleted.length >= WORLD_DATA.modules.length) {`,
    `      Meoluna.complete(newScore);`,
    `      setView('completion');`,
    `    } else {`,
    `      setView('hub');`,
    `    }`,
    `  }`,
    ``,
    `  return (`,
    `    <div className={'min-h-screen bg-gradient-to-br ' + cfg.bgGradient}>`,
    `      <AnimatePresence mode="wait">`,
    `        {view === 'hub' && (`,
    `          <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`,
    `            <HubScreen completedModules={completedModules} totalScore={totalScore} onSelectModule={selectModule} />`,
    `          </motion.div>`,
    `        )}`,
    `        {view === 'module' && (`,
    `          <motion.div key="module" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`,
    `            <ModuleScreen`,
    `              mod={WORLD_DATA.modules[currentModuleIndex]}`,
    `              moduleIndex={currentModuleIndex}`,
    `              onComplete={handleModuleComplete}`,
    `              onBack={() => setView('hub')}`,
    `            />`,
    `          </motion.div>`,
    `        )}`,
    `        {view === 'completion' && (`,
    `          <motion.div key="completion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`,
    `            <CompletionScreen totalScore={totalScore} />`,
    `          </motion.div>`,
    `        )}`,
    `      </AnimatePresence>`,
    `    </div>`,
    `  );`,
    `}`,
  ].join('\n');
}
