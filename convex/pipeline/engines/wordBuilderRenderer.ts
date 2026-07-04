import type { WordEngineSpec } from "./wordBuilderTypes";
import { validateWordEngineSpec } from "./wordBuilderValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildWordBuilderWorldCode(spec: WordEngineSpec): string {
  const validation = validateWordEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid word-builder spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `
// Baupool: chips + optionale Distraktoren, seeded gemischt (deterministisch
// pro Runde/Raum/Welt-Seed - dieselbe Spec ergibt immer dieselbe Welt).
function buildPool(round, seedKey) {
  const pool = round.chips.map((value, index) => ({ poolId: 'c' + index, value }));
  (round.distractors || []).forEach((value, index) => pool.push({ poolId: 'd' + index, value }));
  return seededShuffle(makeRng(seedKey), pool);
}

// letters/syllables: Bausteine der Reihe nach in feste Slots tippen. Ein Tipp
// auf eine Slot-Reihe nimmt immer den ZULETZT gesetzten Baustein zurueck.
function WordRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const seedKey = KID_SEED + ':' + room.roomId + ':' + roundIndex;
  const [slots, setSlots] = useState(() => round.chips.map(() => null));
  const [pool, setPool] = useState(() => buildPool(round, seedKey));
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    const r = room.rounds[roundIndex];
    const sk = KID_SEED + ':' + room.roomId + ':' + roundIndex;
    setSlots(r.chips.map(() => null));
    setPool(buildPool(r, sk));
    setSolved(false);
    setMisses(0);
    setBubble((r.objective || room.objective) + ' Welcher Baustein kommt zuerst?');
  }, [roundIndex]);

  const usedPoolIds = slots.filter(Boolean).map((s) => s.poolId);

  function placeChip(chip) {
    if (solved) return;
    const nextSlot = slots.findIndex((s) => !s);
    if (nextSlot === -1) return;
    // Pruefen: passt dieser Baustein an genau diese Position?
    if (chip.value === round.chips[nextSlot]) {
      Sound.tone(Sound.noteFor(nextSlot), 0.14);
      const nextSlots = slots.map((s, i) => (i === nextSlot ? chip : s));
      setSlots(nextSlots);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 350);
      if (nextSlot + 1 >= round.chips.length) {
        setSolved(true);
        speak(round.word);
        Meoluna.reportScore(10, { action: 'word-round-correct', roomId: room.roomId, roundIndex, mode: room.mode });
        onRoundWin(misses);
      } else {
        setBubble('Richtig! Und der naechste Baustein?');
      }
    } else {
      Sound.miss();
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      // Ist der Baustein zwar im Wort, aber hier falsch -> Reihenfolge; sonst falsch.
      const belongsLater = round.chips.includes(chip.value);
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : (belongsLater ? room.feedback.wrongOrder : room.feedback.wrongChip));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function clearLast() {
    if (solved) return;
    const lastFilled = [...slots].map((s, i) => (s ? i : -1)).filter((i) => i >= 0).pop();
    if (lastFilled === undefined || lastFilled < 0) return;
    Sound.thunk();
    setSlots(slots.map((s, i) => (i === lastFilled ? null : s)));
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '17rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-6xl sm:text-7xl">{round.emoji}</span>
            {solved && <span className="kid-font text-2xl font-extrabold sm:text-3xl" style={{ color: KID.ink }}>{round.word}</span>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {slots.map((slot, i) => (
              <button key={i} type="button" onClick={clearLast} className="kid-font flex h-16 min-w-[3.5rem] items-center justify-center rounded-2xl border-4 px-2 text-2xl font-extrabold sm:h-20 sm:min-w-[4rem] sm:text-3xl" style={{ background: slot ? KID.card : 'rgba(255,255,255,0.4)', borderColor: slot ? KID.ink : KID.bandEdge, borderStyle: slot ? 'solid' : 'dashed', color: KID.ink }}>
                {slot ? slot.value : ''}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pool.map((chip) => (
          <button key={chip.poolId} type="button" disabled={solved || usedPoolIds.includes(chip.poolId)} onClick={() => placeChip(chip)} className="kid-font flex h-16 min-w-[3.5rem] items-center justify-center rounded-2xl border-4 px-3 text-2xl font-extrabold transition-all active:translate-y-1 disabled:opacity-30 sm:text-3xl" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>
            {chip.value}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3">
        <BigButton onClick={clearLast} color={KID.coral} colorDark={KID.coralDark} disabled={solved || slots.every((s) => !s)}>↩️ Eins zurueck</BigButton>
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus den Bausteinen wird</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
          {solved ? round.chips.join(room.mode === 'syllables' ? '-' : '') + ' = ' + round.word : (slots.filter(Boolean).map((s) => s.value).join('') || '?')}
        </span>
      </div>
    </>
  );
}

// scramble: dieselben Zielwort-Buchstaben, aber SEEDED durcheinandergewuerfelt
// (statt in Lese-Reihenfolge angeboten). Unterschied zu WordRoom: ein Tipp auf
// einen bereits gesetzten Baustein nimmt GENAU DIESEN zurueck (nicht nur den
// zuletzt gesetzten), damit das Kind gezielt korrigieren kann.
function ScrambleRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const seedKey = KID_SEED + ':' + room.roomId + ':' + roundIndex;
  const [slots, setSlots] = useState(() => round.chips.map(() => null));
  const [pool, setPool] = useState(() => buildPool(round, seedKey));
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    const r = room.rounds[roundIndex];
    const sk = KID_SEED + ':' + room.roomId + ':' + roundIndex;
    setSlots(r.chips.map(() => null));
    setPool(buildPool(r, sk));
    setSolved(false);
    setMisses(0);
    setBubble((r.objective || room.objective) + ' Die Buchstaben sind durcheinander - baue das Wort!');
  }, [roundIndex]);

  const usedPoolIds = slots.filter(Boolean).map((s) => s.poolId);

  function placeChip(chip) {
    if (solved) return;
    const nextSlot = slots.findIndex((s) => !s);
    if (nextSlot === -1) return;
    if (chip.value === round.chips[nextSlot]) {
      Sound.tone(Sound.noteFor(nextSlot), 0.14);
      const nextSlots = slots.map((s, i) => (i === nextSlot ? chip : s));
      setSlots(nextSlots);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 350);
      if (nextSlot + 1 >= round.chips.length) {
        setSolved(true);
        speak(round.word);
        Meoluna.reportScore(10, { action: 'word-round-correct', roomId: room.roomId, roundIndex, mode: room.mode });
        onRoundWin(misses);
      } else {
        setBubble('Weiter so! Welcher Buchstabe kommt jetzt?');
      }
    } else {
      Sound.miss();
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      const belongsLater = round.chips.includes(chip.value);
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : (belongsLater ? room.feedback.wrongOrder : room.feedback.wrongChip));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function tapSlot(index) {
    if (solved || !slots[index]) return;
    Sound.thunk();
    setSlots(slots.map((s, i) => (i === index ? null : s)));
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '17rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-6xl sm:text-7xl">{round.emoji}</span>
            {solved && <span className="kid-font text-2xl font-extrabold sm:text-3xl" style={{ color: KID.ink }}>{round.word}</span>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {slots.map((slot, i) => (
              <button key={i} type="button" onClick={() => tapSlot(i)} disabled={!slot} className="kid-font flex h-16 min-w-[3.5rem] items-center justify-center rounded-2xl border-4 px-2 text-2xl font-extrabold sm:h-20 sm:min-w-[4rem] sm:text-3xl" style={{ background: slot ? KID.card : 'rgba(255,255,255,0.4)', borderColor: slot ? KID.ink : KID.bandEdge, borderStyle: slot ? 'solid' : 'dashed', color: KID.ink }}>
                {slot ? slot.value : ''}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="kid-font text-center text-base font-bold" style={{ color: '#5d6b85' }}>Tippe die durcheinandergewuerfelten Buchstaben an. Tippe einen gesetzten Buchstaben an, um ihn zurueckzunehmen.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pool.map((chip) => (
          <button key={chip.poolId} type="button" disabled={solved || usedPoolIds.includes(chip.poolId)} onClick={() => placeChip(chip)} className="kid-font flex h-16 min-w-[3.5rem] items-center justify-center rounded-2xl border-4 px-3 text-2xl font-extrabold transition-all active:translate-y-1 disabled:opacity-30 sm:text-3xl" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>
            {chip.value}
          </button>
        ))}
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus den Bausteinen wird</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
          {solved ? round.chips.join('') + ' = ' + round.word : (slots.filter(Boolean).map((s) => s.value).join('') || '?')}
        </span>
      </div>
    </>
  );
}

// listen-and-build: KEIN Wortbild. Das Kind hoert das Wort (Vorlese-Button)
// und baut es rein aus dem Gehoer aus Buchstaben-Bausteinen. Phonics-Feedback:
// jeder korrekt gesetzte Baustein bekommt einen eigenen Ton, am Ende wird das
// vollstaendige Wort noch einmal vorgelesen.
function ListenAndBuildRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const seedKey = KID_SEED + ':' + room.roomId + ':' + roundIndex;
  const [slots, setSlots] = useState(() => round.chips.map(() => null));
  const [pool, setPool] = useState(() => buildPool(round, seedKey));
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    const r = room.rounds[roundIndex];
    const sk = KID_SEED + ':' + room.roomId + ':' + roundIndex;
    setSlots(r.chips.map(() => null));
    setPool(buildPool(r, sk));
    setSolved(false);
    setMisses(0);
    setBubble((r.objective || room.objective) + ' Hoer gut hin und baue das Wort!');
    const t = setTimeout(() => speak(r.word), 400);
    return () => clearTimeout(t);
  }, [roundIndex]);

  const usedPoolIds = slots.filter(Boolean).map((s) => s.poolId);

  function placeChip(chip) {
    if (solved) return;
    const nextSlot = slots.findIndex((s) => !s);
    if (nextSlot === -1) return;
    if (chip.value === round.chips[nextSlot]) {
      Sound.tone(Sound.noteFor(nextSlot), 0.16);
      const nextSlots = slots.map((s, i) => (i === nextSlot ? chip : s));
      setSlots(nextSlots);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 350);
      if (nextSlot + 1 >= round.chips.length) {
        setSolved(true);
        speak(round.word);
        Meoluna.reportScore(10, { action: 'word-round-correct', roomId: room.roomId, roundIndex, mode: room.mode });
        onRoundWin(misses);
      } else {
        setBubble('Gut gehoert! Welcher Buchstabe kommt jetzt?');
      }
    } else {
      Sound.miss();
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      const belongsLater = round.chips.includes(chip.value);
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : (belongsLater ? room.feedback.wrongOrder : room.feedback.wrongChip));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function tapSlot(index) {
    if (solved || !slots[index]) return;
    Sound.thunk();
    setSlots(slots.map((s, i) => (i === index ? null : s)));
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '17rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <button type="button" onClick={() => speak(round.word)} aria-label="Wort anhoeren" className="flex h-20 w-20 items-center justify-center rounded-full border-4 text-4xl transition-transform active:scale-90 sm:h-24 sm:w-24" style={{ background: KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>🔊</button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {slots.map((slot, i) => (
              <button key={i} type="button" onClick={() => tapSlot(i)} disabled={!slot} className="kid-font flex h-16 min-w-[3.5rem] items-center justify-center rounded-2xl border-4 px-2 text-2xl font-extrabold sm:h-20 sm:min-w-[4rem] sm:text-3xl" style={{ background: slot ? KID.card : 'rgba(255,255,255,0.4)', borderColor: slot ? KID.ink : KID.bandEdge, borderStyle: slot ? 'solid' : 'dashed', color: KID.ink }}>
                {slot ? slot.value : ''}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="kid-font text-center text-base font-bold" style={{ color: '#5d6b85' }}>Kein Bild diesmal - hoer genau hin! Tippe einen gesetzten Buchstaben an, um ihn zurueckzunehmen.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pool.map((chip) => (
          <button key={chip.poolId} type="button" disabled={solved || usedPoolIds.includes(chip.poolId)} onClick={() => placeChip(chip)} className="kid-font flex h-16 min-w-[3.5rem] items-center justify-center rounded-2xl border-4 px-3 text-2xl font-extrabold transition-all active:translate-y-1 disabled:opacity-30 sm:text-3xl" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>
            {chip.value}
          </button>
        ))}
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus den Bausteinen wird</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
          {solved ? round.chips.join('') + ' = ' + round.word : (slots.filter(Boolean).map((s) => s.value).join('') || '?')}
        </span>
      </div>
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
    Sound.success();
    const nextStreak = misses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'word-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer das naechste Wort?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function nextRound() {
    setPhase('play');
    setRoundIndex(roundIndex + 1);
  }

  const RoomComponent = room.mode === 'scramble' ? ScrambleRoom : room.mode === 'listen-and-build' ? ListenAndBuildRoom : WordRoom;

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

        {phase !== 'done' && (
          <RoomComponent key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />
        )}

        {phase === 'roundDone' && (
          <BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechstes Wort!</BigButton>
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
            const meta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
            const done = completedRooms.includes(room.roomId);
            const locked = index > 0 && !completedRooms.includes(SPEC.rooms[index - 1].roomId);
            const isLast = index === SPEC.rooms.length - 1;
            const modeIcon = room.mode === 'syllables' ? '🧩' : room.mode === 'scramble' ? '🔀' : room.mode === 'listen-and-build' ? '🎧' : '🔤';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {icon}
                </div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Woerter</p>
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
      Meoluna.complete({ engine: 'word-builder', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (
      <RoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} streak={streak} onStreak={setStreak} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />
    );
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
