import type { MixingEngineSpec } from "./mixingBalanceTypes";
import { validateMixingEngineSpec } from "./mixingBalanceValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildMixingBalanceWorldCode(spec: MixingEngineSpec): string {
  const validation = validateMixingEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid mixing-balance spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `
// Neutrale Gefaess-Farben ohne Theme-Bezug (kidKit kennt keinen Topf-Ton -
// der Kessel soll in jedem Theme gleich neutral wirken, nicht seeded).
const POT = '#5d6b85';
const POT_DARK = '#414d66';

function sumOf(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

function totalParts(round) {
  return Object.values(round.targetParts).reduce((sum, value) => sum + value, 0);
}

function compareOutcome(round) {
  const left = sumOf(round.leftWeights);
  const right = sumOf(round.rightWeights);
  if (left > right) return 'left';
  if (right > left) return 'right';
  return 'equal';
}

function RecipeCard({ ingredients, round }) {
  return (
    <div className="kid-font rounded-2xl border-4 px-4 py-2" style={{ background: '#fff8e6', borderColor: KID.ink }}>
      <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Das Rezept</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {ingredients.filter((ingredient) => round.targetParts[ingredient.id]).map((ingredient) => (
          <span key={ingredient.id} className="text-2xl sm:text-3xl" aria-label={round.targetParts[ingredient.id] + ' mal ' + ingredient.label}>
            {Array.from({ length: round.targetParts[ingredient.id] }).map(() => ingredient.emoji).join('')}
          </span>
        ))}
      </div>
    </div>
  );
}

function Cauldron({ added, bubbling }) {
  return (
    <div className="relative mx-auto flex h-56 w-64 flex-col items-center justify-end sm:h-64 sm:w-80">
      <AnimatePresence>
        {bubbling && [0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ y: 0, opacity: 0.9, scale: 0.6 }}
            animate={{ y: -60 - index * 18, opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.3 }}
            className="absolute top-10 h-6 w-6 rounded-full"
            style={{ left: 40 + index * 22 + '%', background: 'rgba(255,255,255,0.75)' }}
          />
        ))}
      </AnimatePresence>
      <div className="relative z-10 h-6 w-[88%] rounded-full border-4" style={{ background: POT_DARK, borderColor: KID.ink }} />
      <div className="relative -mt-2 flex h-40 w-full items-start justify-center overflow-hidden rounded-b-[4rem] border-4 border-t-0 sm:h-48" style={{ background: POT, borderColor: KID.ink }}>
        <div className="mt-3 grid grid-cols-4 gap-2 px-4">
          <AnimatePresence>
            {added.map((entry, index) => (
              <motion.div
                key={index + '-' + entry.id}
                initial={{ y: -60, scale: 0.4, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-xl sm:h-12 sm:w-12 sm:text-2xl"
                style={{ background: entry.color, borderColor: KID.ink }}
              >{entry.emoji}</motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="absolute bottom-2 left-0 h-8 w-4 rounded-full border-4" style={{ background: POT_DARK, borderColor: KID.ink }} />
      <div className="absolute bottom-2 right-0 h-8 w-4 rounded-full border-4" style={{ background: POT_DARK, borderColor: KID.ink }} />
    </div>
  );
}

function RecipeScene({ ingredients, round, added, bubbling }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4" style={{ minHeight: '20rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-3 p-4">
        <RecipeCard ingredients={ingredients} round={round} />
        <Cauldron added={added} bubbling={bubbling} />
      </div>
    </div>
  );
}

function WeightBlock({ value, color, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={'kid-font flex h-10 w-10 items-center justify-center rounded-xl border-2 text-base font-extrabold sm:h-11 sm:w-11 ' + (onClick ? 'transition-transform active:scale-90' : '')}
      style={{ background: color, borderColor: KID.ink, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
    >{value}</Tag>
  );
}

function BalanceScene({ round, addedWeights, onRemoveAddedWeight }) {
  const left = sumOf(round.leftWeights);
  const right = sumOf(round.rightWeights) + sumOf(addedWeights);
  const angle = Math.max(-12, Math.min(12, (right - left) * 2.2));
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4" style={{ minHeight: '21rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-10 pt-6">
        <motion.div className="relative w-[88%] max-w-2xl" animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} style={{ transformOrigin: '50% 100%' }}>
          <div className="h-4 w-full rounded-full border-4" style={{ background: KID.band, borderColor: KID.ink }} />
          <div className="absolute -top-2 left-0 w-32 -translate-x-1/2 sm:w-36" style={{ transform: 'translateX(-50%) rotate(' + -angle + 'deg)' }}>
            <div className="flex min-h-[3rem] flex-wrap items-end justify-center gap-1 rounded-2xl border-4 p-1.5" style={{ background: '#ffe8df', borderColor: KID.ink }}>
              {round.leftWeights.map((value, index) => <WeightBlock key={'l' + index} value={value} color={KID.coral} />)}
            </div>
          </div>
          <div className="absolute -top-2 right-0 w-32 translate-x-1/2 sm:w-36" style={{ transform: 'translateX(50%) rotate(' + -angle + 'deg)' }}>
            <div className="flex min-h-[3rem] flex-wrap items-end justify-center gap-1 rounded-2xl border-4 p-1.5" style={{ background: '#dceeff', borderColor: KID.ink }}>
              {round.rightWeights.map((value, index) => <WeightBlock key={'r' + index} value={value} color={KID.blue} />)}
              {addedWeights.map((value, index) => <WeightBlock key={'a' + index} value={value} color={KID.green} onClick={() => onRemoveAddedWeight(index)} />)}
            </div>
          </div>
        </motion.div>
        <div className="h-16 w-5 border-4" style={{ background: KID.band, borderColor: KID.ink }} />
        <div className="h-4 w-40 rounded-full border-4" style={{ background: KID.bandEdge, borderColor: KID.ink }} />
        <div className="kid-font absolute left-4 top-4 rounded-2xl border-2 px-3 py-1 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>links: {left}</div>
        <div className="kid-font absolute right-4 top-4 rounded-2xl border-2 px-3 py-1 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>rechts: {right}</div>
      </div>
    </div>
  );
}

// compare (neu): dieselbe Wippe-Optik wie BalanceScene, aber ohne Zusatzsteine
// und ohne Summen-Anzeige - das Kind soll die Steine selbst abschaetzen/zaehlen.
function CompareScene({ round }) {
  const left = sumOf(round.leftWeights);
  const right = sumOf(round.rightWeights);
  const angle = Math.max(-12, Math.min(12, (right - left) * 2.2));
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4" style={{ minHeight: '21rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-10 pt-6">
        <motion.div className="relative w-[88%] max-w-2xl" animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} style={{ transformOrigin: '50% 100%' }}>
          <div className="h-4 w-full rounded-full border-4" style={{ background: KID.band, borderColor: KID.ink }} />
          <div className="absolute -top-2 left-0 w-32 -translate-x-1/2 sm:w-36" style={{ transform: 'translateX(-50%) rotate(' + -angle + 'deg)' }}>
            <div className="flex min-h-[3rem] flex-wrap items-end justify-center gap-1 rounded-2xl border-4 p-1.5" style={{ background: '#ffe8df', borderColor: KID.ink }}>
              {round.leftWeights.map((value, index) => <WeightBlock key={'l' + index} value={value} color={KID.coral} />)}
            </div>
          </div>
          <div className="absolute -top-2 right-0 w-32 translate-x-1/2 sm:w-36" style={{ transform: 'translateX(50%) rotate(' + -angle + 'deg)' }}>
            <div className="flex min-h-[3rem] flex-wrap items-end justify-center gap-1 rounded-2xl border-4 p-1.5" style={{ background: '#dceeff', borderColor: KID.ink }}>
              {round.rightWeights.map((value, index) => <WeightBlock key={'r' + index} value={value} color={KID.blue} />)}
            </div>
          </div>
        </motion.div>
        <div className="h-16 w-5 border-4" style={{ background: KID.band, borderColor: KID.ink }} />
        <div className="h-4 w-40 rounded-full border-4" style={{ background: KID.bandEdge, borderColor: KID.ink }} />
      </div>
    </div>
  );
}

function CompareButtons({ disabled, onPick }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <BigButton onClick={() => onPick('left')} color={KID.coral} colorDark={KID.coralDark} disabled={disabled}>⬅️ Links schwerer</BigButton>
      <BigButton onClick={() => onPick('equal')} color={KID.green} colorDark={KID.greenDark} disabled={disabled}>⚖️ Gleich schwer</BigButton>
      <BigButton onClick={() => onPick('right')} color={KID.blue} colorDark={KID.blueDark} disabled={disabled}>➡️ Rechts schwerer</BigButton>
    </div>
  );
}

function RecipeEquation({ ingredients, round, solved }) {
  const total = totalParts(round);
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Rezept wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {ingredients.filter((ingredient) => round.targetParts[ingredient.id]).map((ingredient) => (
          <span key={ingredient.id} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
            {solved ? round.targetParts[ingredient.id] + '/' + total + ' ' + ingredient.emoji : '?/' + total + ' ' + ingredient.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

function BalanceEquation({ round, addedWeights, solved }) {
  const left = sumOf(round.leftWeights);
  const right = sumOf(round.rightWeights);
  const added = sumOf(addedWeights);
  const rightText = round.rightWeights.length > 0 ? String(right) + ' + ' : '';
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus der Waage wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="kid-font rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: '#ffe8df', borderColor: KID.ink, color: KID.ink }}>{left}</span>
        <span className="kid-font text-2xl font-extrabold" style={{ color: KID.ink }}>=</span>
        <span className="kid-font rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
          {solved ? rightText + added : rightText + '?'}
        </span>
      </div>
    </div>
  );
}

function RecipeRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [added, setAdded] = useState([]);
  const [bubbling, setBubbling] = useState(false);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setAdded([]);
    setSolved(false);
    setMisses(0);
    setBubble(round.objective || room.objective);
  }, [roundIndex]);

  function countsById() {
    const counts = {};
    for (const entry of added) counts[entry.id] = (counts[entry.id] || 0) + 1;
    return counts;
  }

  function addIngredient(ingredient) {
    if (solved) return;
    if (added.length >= 16) return;
    Sound.thunk();
    setAdded((list) => [...list, { id: ingredient.id, emoji: ingredient.emoji, color: ingredient.color }]);
  }

  function removeLastIngredient() {
    if (solved) return;
    Sound.thunk();
    setAdded((list) => list.slice(0, -1));
  }

  function mixPotion() {
    if (solved || added.length === 0) return;
    const counts = countsById();
    const targetTotal = totalParts(round);
    const anyTooMuch = room.ingredients.some((ingredient) => (counts[ingredient.id] || 0) > (round.targetParts[ingredient.id] || 0));
    const exact = room.ingredients.every((ingredient) => (counts[ingredient.id] || 0) === (round.targetParts[ingredient.id] || 0));
    setBubbling(true);
    setTimeout(() => setBubbling(false), 1400);
    if (exact) {
      setSolved(true);
      onRoundWin(misses);
      return;
    }
    const m = misses + 1; setMisses(m);
    setMood('sad'); Sound.miss();
    if (anyTooMuch) {
      setBubble(room.feedback.tooMuch);
    } else if (added.length < targetTotal) {
      setBubble(room.feedback.tooLittle);
    } else {
      setBubble(room.feedback.wrongMix);
    }
    setTimeout(() => setMood('happy'), 700);
  }

  return (
    <>
      <RecipeScene ingredients={room.ingredients} round={round} added={added} bubbling={bubbling} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {room.ingredients.map((ingredient) => (
          <BigButton key={ingredient.id} onClick={() => addIngredient(ingredient)} color={KID.blue} colorDark={KID.blueDark} disabled={solved}>
            {ingredient.emoji} {ingredient.label}
          </BigButton>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <BigButton onClick={removeLastIngredient} color={KID.coral} colorDark={KID.coralDark} disabled={solved || added.length === 0}>↩️ Eins zurück</BigButton>
        <BigButton onClick={mixPotion} color={KID.green} colorDark={KID.greenDark} disabled={solved || added.length === 0}>🥄 Mischen!</BigButton>
      </div>
      <RecipeEquation ingredients={room.ingredients} round={round} solved={solved} />
    </>
  );
}

function BalanceRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [addedWeights, setAddedWeights] = useState([]);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const solveTimer = useRef(null);

  const left = sumOf(round.leftWeights);
  const right = sumOf(round.rightWeights) + sumOf(addedWeights);

  useEffect(() => {
    setAddedWeights([]);
    setSolved(false);
    setMisses(0);
    setBubble(round.objective || room.objective);
  }, [roundIndex]);

  useEffect(() => {
    if (solved) return;
    if (solveTimer.current) clearTimeout(solveTimer.current);
    if (right === left && addedWeights.length > 0) {
      solveTimer.current = setTimeout(() => {
        setSolved(true);
        onRoundWin(misses);
      }, 600);
    } else if (right > left) {
      setMisses((m) => m + 1);
      setMood('sad');
      Sound.miss();
      setBubble(room.feedback.tooMuch);
      solveTimer.current = setTimeout(() => setMood('happy'), 700);
    }
    return () => { if (solveTimer.current) clearTimeout(solveTimer.current); };
  }, [addedWeights]);

  function addChip(value) {
    if (solved) return;
    if (addedWeights.length >= 12) return;
    Sound.thunk();
    setAddedWeights((list) => [...list, value]);
  }

  function removeAddedWeight(index) {
    if (solved) return;
    Sound.thunk();
    setAddedWeights((list) => list.filter((entry, i) => i !== index));
  }

  return (
    <>
      <BalanceScene round={round} addedWeights={addedWeights} onRemoveAddedWeight={removeAddedWeight} />
      <div className="grid grid-cols-3 gap-3">
        {room.chips.map((chip) => (
          <BigButton key={chip} onClick={() => addChip(chip)} color={KID.green} colorDark={KID.greenDark} disabled={solved}>
            +{chip} ⚖️
          </BigButton>
        ))}
      </div>
      <p className="kid-font text-center text-base font-bold" style={{ color: '#5d6b85' }}>Tippe auf einen grünen Stein auf der Waage, um ihn wieder herunterzunehmen.</p>
      <BalanceEquation round={round} addedWeights={addedWeights} solved={solved} />
    </>
  );
}

// compare (neu): einmaliges Urteil statt Ausgleichen - schnelle Waagen-Einschaetzung.
function CompareRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setSolved(false);
    setMisses(0);
    setShake(false);
    setBubble(round.objective || room.objective);
  }, [roundIndex]);

  function pick(guess) {
    if (solved) return;
    const answer = compareOutcome(round);
    if (guess === answer) {
      setSolved(true);
      setMood('cheer');
      Sound.success();
      onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m);
      setMood('sad'); Sound.miss();
      setShake(true);
      setBubble(room.feedback.wrongGuess);
      setTimeout(() => { setMood('happy'); setShake(false); }, 700);
    }
  }

  return (
    <>
      <motion.div animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.5 }}>
        <CompareScene round={round} />
      </motion.div>
      <CompareButtons disabled={solved} onPick={pick} />
    </>
  );
}

function RoomScene({ room, roomMeta, stars, streak, onStreak, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');

  function handleRoundWin(misses) {
    setMood('cheer');
    const nextStreak = (misses || 0) === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'mixing-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: (misses || 0) === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'mixing-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit für die nächste Aufgabe?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function nextRound() {
    setPhase('play');
    setRoundIndex(roundIndex + 1);
  }

  const RoomComponent = room.mode === 'recipe' ? RecipeRoom : room.mode === 'compare' ? CompareRoom : BalanceRoom;

  return (
    <div className="kid-font min-h-screen p-3 sm:p-6" style={{ background: 'linear-gradient(180deg, ' + KID.skyBottom + ', #f8fdf2)' }}>
      <KidStyles />
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-0.5" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.bandEdge }}>← Karte</button>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{roomMeta.title || room.roomId}</div>
            <Luno mood={mood} />
          </div>
          <div className="flex items-center gap-2"><StreakMeter streak={streak} /><RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} /><StarRow stars={stars} /><SoundToggle /></div>
        </div>

        <SpeechBubble text={bubble} />

        {phase !== 'done' && (<RoomComponent key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />)}

        {phase === 'roundDone' && (
          <BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Nächste Aufgabe!</BigButton>
        )}

        {phase === 'done' && (
          <BigButton onClick={onComplete} color={KID.green} colorDark={KID.greenDark}>🎉 Weiter!</BigButton>
        )}
      </div>
    </div>
  );
}

function Hub({ completedRooms, stars, onStart }) {
  return (
    <div className="kid-font min-h-screen p-4 sm:p-8" style={{ background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 55%, #f0fbe8)' }}>
      <KidStyles />
      <div className="relative mx-auto max-w-4xl">
        <div className="relative rounded-[2rem] border-4 p-6 text-center shadow-xl" style={{ background: KID.card, borderColor: KID.ink }}>
          <div className="mx-auto -mt-14 w-fit"><Luno mood="happy" /></div>
          <h1 className="text-3xl font-extrabold sm:text-5xl" style={{ color: KID.ink }}>{SPEC.world.worldName}</h1>
          <p className="mx-auto mt-2 max-w-xl text-lg font-bold" style={{ color: '#5d6b85' }}>{SPEC.concept.embodiedMetaphor}</p>
          <div className="mx-auto mt-3 w-fit"><StarRow stars={stars} /></div>
        </div>
        <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPEC.rooms.map((room, index) => {
            const meta = SPEC.world.rooms.find((entry) => entry.id === room.roomId) || {};
            const done = completedRooms.includes(room.roomId);
            const locked = index > 0 && !completedRooms.includes(SPEC.rooms[index - 1].roomId);
            const isLast = index === SPEC.rooms.length - 1;
            const modeIcon = room.mode === 'recipe' ? '🍲' : room.mode === 'compare' ? '🧐' : '⚖️';
            return (
              <button
                key={room.roomId}
                type="button"
                disabled={locked}
                onClick={() => onStart(index)}
                className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50"
                style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon}
                </div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Aufgaben</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeRoomIndex, setActiveRoomIndex] = useState(null);
  const [completedRooms, setCompletedRooms] = useState([]);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);

  function completeActiveRoom() {
    const room = SPEC.rooms[activeRoomIndex];
    setCompletedRooms((rooms) => rooms.includes(room.roomId) ? rooms : [...rooms, room.roomId]);
    if (completedRooms.length + 1 >= SPEC.rooms.length) {
      Meoluna.complete({ engine: 'mixing-balance', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((entry) => entry.id === room.roomId) || {};
    return (
      <RoomScene
        key={room.roomId}
        room={room}
        roomMeta={roomMeta}
        stars={stars}
        streak={streak}
        onStreak={setStreak}
        onBack={() => setActiveRoomIndex(null)}
        onComplete={completeActiveRoom}
        onStar={() => setStars((value) => value + 1)}
      />
    );
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
