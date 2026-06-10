import type { MixingEngineSpec } from "./mixingBalanceTypes";
import { validateMixingEngineSpec } from "./mixingBalanceValidator";

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

// "Bilderbuch-Tag": helle, freundliche Spielwelt für Kinder ab 5.
const KID = {
  skyTop: '#79c7f5',
  skyBottom: '#e9f8ff',
  hillBack: '#a8dd8a',
  hillFront: '#7ec463',
  wood: '#d9a05e',
  woodDark: '#a8743c',
  ink: '#27324a',
  coral: '#ff7a59',
  coralDark: '#c95a3f',
  blue: '#3f9bf0',
  blueDark: '#2c79c2',
  green: '#54b865',
  greenDark: '#3c8f4b',
  sun: '#ffd84d',
  card: '#ffffff',
  pot: '#5d6b85',
  potDark: '#414d66',
};

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

function sumOf(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

function totalParts(room) {
  return Object.values(room.targetParts).reduce((sum, value) => sum + value, 0);
}

function KidStyles() {
  return (
    <style>{"@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap'); .kid-font{font-family:'Baloo 2','Comic Sans MS','Segoe UI',sans-serif;}"}</style>
  );
}

function Sky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute right-8 top-5 h-16 w-16 rounded-full sm:h-24 sm:w-24" style={{ background: KID.sun, boxShadow: '0 0 50px 14px rgba(255,216,77,0.55)' }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="absolute left-[10%] top-8 h-9 w-28 rounded-full bg-white/90" animate={{ x: [0, 26, 0] }} transition={{ duration: 18, repeat: Infinity }} />
      <motion.div className="absolute left-[55%] top-14 h-7 w-20 rounded-full bg-white/80" animate={{ x: [0, -20, 0] }} transition={{ duration: 24, repeat: Infinity }} />
      <div className="absolute -left-10 bottom-[6%] h-32 w-[60%] rounded-[50%]" style={{ background: KID.hillBack }} />
      <div className="absolute -right-16 bottom-[2%] h-36 w-[70%] rounded-[50%]" style={{ background: KID.hillFront }} />
      <div className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: KID.hillFront }} />
    </div>
  );
}

function Luno({ mood }) {
  return (
    <motion.div
      animate={mood === 'sad' ? { x: [0, -7, 7, -5, 5, 0] } : mood === 'cheer' ? { y: [0, -16, 0] } : { y: [0, -3, 0] }}
      transition={mood === 'cheer' ? { duration: 0.5, repeat: 2 } : mood === 'sad' ? { duration: 0.5 } : { duration: 2.4, repeat: Infinity }}
    >
      <svg width="68" height="72" viewBox="0 0 74 78" aria-hidden="true">
        <ellipse cx="37" cy="74" rx="20" ry="4" fill="rgba(39,50,74,0.18)" />
        <ellipse cx="26" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <ellipse cx="48" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <circle cx="37" cy="38" r="30" fill="#fff6e0" stroke="#27324a" strokeWidth="3.5" />
        <circle cx="27" cy="36" r="5.6" fill="#27324a" />
        <circle cx="47" cy="36" r="5.6" fill="#27324a" />
        <circle cx="29" cy="34" r="1.8" fill="#ffffff" />
        <circle cx="49" cy="34" r="1.8" fill="#ffffff" />
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

function StarRow({ stars }) {
  return (
    <div className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xl" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>
      <span>⭐</span>
      <span className="kid-font font-extrabold">{stars}</span>
    </div>
  );
}

function RecipeCard({ room }) {
  return (
    <div className="kid-font rounded-2xl border-4 px-4 py-2" style={{ background: '#fff8e6', borderColor: KID.ink }}>
      <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Das Rezept</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {room.ingredients.filter((ingredient) => room.targetParts[ingredient.id]).map((ingredient) => (
          <span key={ingredient.id} className="text-2xl sm:text-3xl" aria-label={room.targetParts[ingredient.id] + ' mal ' + ingredient.label}>
            {Array.from({ length: room.targetParts[ingredient.id] }).map(() => ingredient.emoji).join('')}
          </span>
        ))}
      </div>
    </div>
  );
}

function Cauldron({ room, added, bubbling }) {
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
            style={{ left: 40 + index * 26 + '%', background: 'rgba(255,255,255,0.75)' }}
          />
        ))}
      </AnimatePresence>
      <div className="relative z-10 h-6 w-[88%] rounded-full border-4" style={{ background: KID.potDark, borderColor: KID.ink }} />
      <div className="relative -mt-2 flex h-40 w-full items-start justify-center overflow-hidden rounded-b-[4rem] border-4 border-t-0 sm:h-48" style={{ background: KID.pot, borderColor: KID.ink }}>
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
      <div className="absolute bottom-2 left-0 h-8 w-4 rounded-full border-4" style={{ background: KID.potDark, borderColor: KID.ink }} />
      <div className="absolute bottom-2 right-0 h-8 w-4 rounded-full border-4" style={{ background: KID.potDark, borderColor: KID.ink }} />
    </div>
  );
}

function RecipeScene({ room, added, bubbling }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4" style={{ minHeight: '20rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-3 p-4">
        <RecipeCard room={room} />
        <Cauldron room={room} added={added} bubbling={bubbling} />
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

function BalanceScene({ room, addedWeights, onRemoveAddedWeight }) {
  const left = sumOf(room.leftWeights);
  const right = sumOf(room.rightWeights) + sumOf(addedWeights);
  const angle = Math.max(-12, Math.min(12, (right - left) * 2.2));
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4" style={{ minHeight: '21rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-10 pt-6">
        <motion.div className="relative w-[88%] max-w-2xl" animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} style={{ transformOrigin: '50% 100%' }}>
          <div className="h-4 w-full rounded-full border-4" style={{ background: KID.wood, borderColor: KID.ink }} />
          <div className="absolute -top-2 left-0 w-32 -translate-x-1/2 sm:w-36" style={{ transform: 'translateX(-50%) rotate(' + -angle + 'deg)' }}>
            <div className="flex min-h-[3rem] flex-wrap items-end justify-center gap-1 rounded-2xl border-4 p-1.5" style={{ background: '#ffe8df', borderColor: KID.ink }}>
              {room.leftWeights.map((value, index) => <WeightBlock key={'l' + index} value={value} color={KID.coral} />)}
            </div>
          </div>
          <div className="absolute -top-2 right-0 w-32 translate-x-1/2 sm:w-36" style={{ transform: 'translateX(50%) rotate(' + -angle + 'deg)' }}>
            <div className="flex min-h-[3rem] flex-wrap items-end justify-center gap-1 rounded-2xl border-4 p-1.5" style={{ background: '#dceeff', borderColor: KID.ink }}>
              {room.rightWeights.map((value, index) => <WeightBlock key={'r' + index} value={value} color={KID.blue} />)}
              {addedWeights.map((value, index) => <WeightBlock key={'a' + index} value={value} color={KID.green} onClick={() => onRemoveAddedWeight(index)} />)}
            </div>
          </div>
        </motion.div>
        <div className="h-16 w-5 border-4" style={{ background: KID.wood, borderColor: KID.ink }} />
        <div className="h-4 w-40 rounded-full border-4" style={{ background: KID.woodDark, borderColor: KID.ink }} />
        <div className="kid-font absolute left-4 top-4 rounded-2xl border-2 px-3 py-1 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>links: {left}</div>
        <div className="kid-font absolute right-4 top-4 rounded-2xl border-2 px-3 py-1 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>rechts: {right}</div>
      </div>
    </div>
  );
}

function RecipeEquation({ room, solved }) {
  const total = totalParts(room);
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Rezept wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {room.ingredients.filter((ingredient) => room.targetParts[ingredient.id]).map((ingredient) => (
          <span key={ingredient.id} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
            {solved ? room.targetParts[ingredient.id] + '/' + total + ' ' + ingredient.emoji : '?/' + total + ' ' + ingredient.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

function BalanceEquation({ room, addedWeights, solved }) {
  const left = sumOf(room.leftWeights);
  const right = sumOf(room.rightWeights);
  const added = sumOf(addedWeights);
  const rightText = room.rightWeights.length > 0 ? String(right) + ' + ' : '';
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

function RecipeRoom({ room, onSolved, setBubble, setMood }) {
  const [added, setAdded] = useState([]);
  const [bubbling, setBubbling] = useState(false);
  const [solved, setSolved] = useState(false);

  function countsById() {
    const counts = {};
    for (const entry of added) counts[entry.id] = (counts[entry.id] || 0) + 1;
    return counts;
  }

  function addIngredient(ingredient) {
    if (solved) return;
    if (added.length >= 16) return;
    setAdded((list) => [...list, { id: ingredient.id, emoji: ingredient.emoji, color: ingredient.color }]);
  }

  function removeLastIngredient() {
    if (solved) return;
    setAdded((list) => list.slice(0, -1));
  }

  function mixPotion() {
    if (solved || added.length === 0) return;
    const counts = countsById();
    const targetTotal = totalParts(room);
    const anyTooMuch = room.ingredients.some((ingredient) => (counts[ingredient.id] || 0) > (room.targetParts[ingredient.id] || 0));
    const exact = room.ingredients.every((ingredient) => (counts[ingredient.id] || 0) === (room.targetParts[ingredient.id] || 0));
    setBubbling(true);
    setTimeout(() => setBubbling(false), 1400);
    if (exact) {
      setSolved(true);
      setMood('cheer');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
      setTimeout(() => setMood('happy'), 1200);
      onSolved();
      return;
    }
    setMood('sad');
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
      <RecipeScene room={room} added={added} bubbling={bubbling} />
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
      <RecipeEquation room={room} solved={solved} />
    </>
  );
}

function BalanceRoom({ room, onSolved, setBubble, setMood }) {
  const [addedWeights, setAddedWeights] = useState([]);
  const [solved, setSolved] = useState(false);
  const solveTimer = useRef(null);

  const left = sumOf(room.leftWeights);
  const right = sumOf(room.rightWeights) + sumOf(addedWeights);

  useEffect(() => {
    if (solved) return;
    if (solveTimer.current) clearTimeout(solveTimer.current);
    if (right === left && addedWeights.length > 0) {
      solveTimer.current = setTimeout(() => {
        setSolved(true);
        setMood('cheer');
        setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
        confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
        setTimeout(() => setMood('happy'), 1200);
        onSolved();
      }, 600);
    } else if (right > left) {
      setMood('sad');
      setBubble(room.feedback.tooMuch);
      solveTimer.current = setTimeout(() => setMood('happy'), 700);
    }
    return () => { if (solveTimer.current) clearTimeout(solveTimer.current); };
  }, [addedWeights]);

  function addChip(value) {
    if (solved) return;
    if (addedWeights.length >= 12) return;
    setAddedWeights((list) => [...list, value]);
  }

  function removeAddedWeight(index) {
    if (solved) return;
    setAddedWeights((list) => list.filter((entry, i) => i !== index));
  }

  return (
    <>
      <BalanceScene room={room} addedWeights={addedWeights} onRemoveAddedWeight={removeAddedWeight} />
      <div className="grid grid-cols-3 gap-3">
        {room.chips.map((chip) => (
          <BigButton key={chip} onClick={() => addChip(chip)} color={KID.green} colorDark={KID.greenDark} disabled={solved}>
            +{chip} ⚖️
          </BigButton>
        ))}
      </div>
      <p className="kid-font text-center text-base font-bold" style={{ color: '#5d6b85' }}>Tippe auf einen grünen Stein auf der Waage, um ihn wieder herunterzunehmen.</p>
      <BalanceEquation room={room} addedWeights={addedWeights} solved={solved} />
    </>
  );
}

function RoomScene({ room, roomMeta, stars, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [done, setDone] = useState(false);

  function handleSolved() {
    if (done) return;
    setDone(true);
    Meoluna.reportScore(25, { action: 'mixing-room-complete', roomId: room.roomId });
    Meoluna.completeModule(room.roomId, 25);
    onStar();
  }

  return (
    <div className="kid-font min-h-screen p-3 sm:p-6" style={{ background: 'linear-gradient(180deg, ' + KID.skyBottom + ', #f8fdf2)' }}>
      <KidStyles />
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-0.5" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.woodDark }}>← Karte</button>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{roomMeta.title || room.roomId}</div>
            <Luno mood={mood} />
          </div>
          <StarRow stars={stars} />
        </div>

        <SpeechBubble text={bubble} />

        {room.mode === 'recipe'
          ? <RecipeRoom room={room} onSolved={handleSolved} setBubble={setBubble} setMood={setMood} />
          : <BalanceRoom room={room} onSolved={handleSolved} setBubble={setBubble} setMood={setMood} />}

        {done && (
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
        <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
          {SPEC.rooms.map((room, index) => {
            const meta = SPEC.world.rooms.find((entry) => entry.id === room.roomId) || {};
            const done = completedRooms.includes(room.roomId);
            const locked = index > 0 && !completedRooms.includes(SPEC.rooms[index - 1].roomId);
            return (
              <button
                key={room.roomId}
                type="button"
                disabled={locked}
                onClick={() => onStart(index)}
                className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50"
                style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.woodDark }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {done ? '⭐' : locked ? '🔒' : room.mode === 'recipe' ? '🍲' : '⚖️'}
                </div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
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
