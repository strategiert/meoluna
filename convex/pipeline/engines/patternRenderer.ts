import type { PatternEngineSpec } from "./patternTypes";
import { validatePatternEngineSpec } from "./patternValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildPatternWorldCode(spec: PatternEngineSpec): string {
  const validation = validatePatternEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid pattern spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `
function smallestPeriodJs(sequence) {
  const n = sequence.length;
  for (let p = 1; p <= Math.floor(n / 2); p += 1) {
    let ok = true;
    for (let i = p; i < n; i += 1) { if (sequence[i] !== sequence[i - p]) { ok = false; break; } }
    if (ok) return p;
  }
  return n;
}
function uniqueInventory(sequence) {
  const seen = [];
  sequence.forEach(function (el) { if (!seen.includes(el)) seen.push(el); });
  return seen;
}
function playPatternMelody(sequence) {
  const inv = uniqueInventory(sequence);
  Sound.melody(sequence.map(function (el) { return inv.indexOf(el); }));
}

function Tile({ label, dashed, highlight, onClick, disabled, small }) {
  const size = small ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-3xl sm:h-20 sm:w-20 sm:text-4xl';
  const body = (
    <div className={'kid-font flex items-center justify-center rounded-2xl border-4 font-extrabold ' + size} style={{ background: highlight ? KID.sun : KID.card, borderColor: KID.ink, borderStyle: dashed ? 'dashed' : 'solid', color: KID.ink }}>
      {label}
    </div>
  );
  if (!onClick) return body;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="transition-all active:translate-y-1 disabled:opacity-40" style={{ boxShadow: '0 5px 0 ' + KID.bandEdge, borderRadius: '1rem' }}>{body}</button>
  );
}

function PatternBand({ children }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 rounded-2xl border-4 p-4" style={{ background: KID.band, borderColor: KID.bandEdge }}>
        {children}
      </div>
    </div>
  );
}

// continue/fill: fehlendes Teil antippen.
function PatternRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const inv = uniqueInventory(round.sequence);

  useEffect(() => {
    setSolved(false); setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Welches Teil fehlt im Muster?');
  }, [roundIndex]);

  const answer = round.sequence[round.gapIndex];

  function pick(opt) {
    if (solved) return;
    Sound.tone(Sound.noteFor(inv.indexOf(opt)), 0.14);
    if (opt === answer) {
      setSolved(true); setMood('cheer');
      playPatternMelody(round.sequence);
      onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss();
      setBubble(m >= 2 ? room.feedback.tryAgain : room.feedback.wrongPiece);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <PatternBand>
        {round.sequence.map((el, i) => {
          const isGap = i === round.gapIndex && !solved;
          return <Tile key={i} label={isGap ? '?' : el} dashed={isGap} highlight={isGap} />;
        })}
      </PatternBand>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {round.options.map((opt, i) => (
          <Tile key={i} label={opt} onClick={() => pick(opt)} disabled={solved} />
        ))}
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Das Muster lautet</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-2xl font-extrabold" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? round.sequence.join(' ') : round.sequence.map((el, i) => i === round.gapIndex ? '?' : el).join(' ')}</span>
      </div>
    </>
  );
}

// build: die naechste Wiederholung des Musters selbst bauen (Tippen).
function BuildRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const period = smallestPeriodJs(round.sequence);
  const inv = uniqueInventory(round.sequence);
  const target = [];
  for (let i = 0; i < period; i += 1) target.push(round.sequence[(round.sequence.length + i) % period]);

  const [slots, setSlots] = useState(Array(period).fill(null));
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setSlots(Array(smallestPeriodJs(room.rounds[roundIndex].sequence)).fill(null));
    setSolved(false); setMisses(0); setShake(false);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Baue das Muster weiter!');
  }, [roundIndex]);

  function check(nextSlots) {
    const correct = nextSlots.every(function (el, i) { return el === target[i]; });
    if (correct) {
      setSolved(true); setMood('cheer');
      playPatternMelody(round.sequence.concat(target));
      onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss(); setShake(true);
      setBubble(m >= 2 ? room.feedback.tryAgain : room.feedback.wrongPiece);
      setTimeout(() => { setSlots(Array(period).fill(null)); setShake(false); setMood('happy'); }, 750);
    }
  }

  function tapOption(opt) {
    if (solved || shake) return;
    const firstEmpty = slots.indexOf(null);
    if (firstEmpty === -1) return;
    Sound.tone(Sound.noteFor(inv.indexOf(opt)), 0.14);
    const next = slots.map(function (el, i) { return i === firstEmpty ? opt : el; });
    setSlots(next);
    if (next.indexOf(null) === -1) check(next);
  }

  function tapSlot(index) {
    if (solved || shake) return;
    Sound.thunk();
    setSlots(function (list) { return list.map(function (el, i) { return i === index ? null : el; }); });
  }

  return (
    <>
      <PatternBand>
        {round.sequence.map((el, i) => <Tile key={'s' + i} label={el} />)}
        <div className="kid-font mx-1 text-2xl font-extrabold" style={{ color: KID.ink }}>➕</div>
        <motion.div className="flex flex-wrap items-center justify-center gap-2" animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.5 }}>
          {slots.map((el, i) => (
            el === null
              ? <Tile key={'b' + i} label="?" dashed highlight />
              : <Tile key={'b' + i} label={el} onClick={() => tapSlot(i)} />
          ))}
        </motion.div>
      </PatternBand>
      <p className="kid-font text-center text-base font-bold" style={{ color: '#5d6b85' }}>Tippe die Teile unten an — sie landen im gelben Feld. Tippe ein gebautes Teil an, um es wegzunehmen.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {round.options.map((opt, i) => (
          <Tile key={i} label={opt} onClick={() => tapOption(opt)} disabled={solved || slots.indexOf(null) === -1} />
        ))}
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Das Muster lautet</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-2xl font-extrabold" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? round.sequence.concat(target).join(' ') : round.sequence.join(' ') + ' …'}</span>
      </div>
    </>
  );
}

// grow: wachsende Muster — die naechste Gruppe mit der richtigen Anzahl legen.
function GrowRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const shownSizes = round.growSizes.slice(0, round.growSizes.length - 1);
  const expected = round.growSizes[round.growSizes.length - 1];

  const [count, setCount] = useState(0);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setCount(0); setSolved(false); setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Wie viele kommen ins naechste Feld?');
  }, [roundIndex]);

  function add() {
    if (solved || count >= 9) return;
    Sound.tone(Sound.noteFor(count), 0.12);
    setCount(count + 1);
  }
  function remove() {
    if (solved || count <= 0) return;
    Sound.thunk();
    setCount(count - 1);
  }
  function confirm() {
    if (solved || count === 0) return;
    if (count === expected) {
      setSolved(true); setMood('cheer');
      Sound.melody(round.growSizes.map(function (n, i) { return i; }));
      onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss();
      setBubble(m >= 2 ? room.feedback.tryAgain : room.feedback.wrongPiece);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function GroupColumn({ size, dashed, children }) {
    return (
      <div className="flex min-h-[6rem] flex-col-reverse items-center justify-start gap-1 rounded-2xl border-4 p-2" style={{ background: dashed ? 'rgba(255,255,255,0.6)' : KID.card, borderColor: KID.ink, borderStyle: dashed ? 'dashed' : 'solid', minWidth: '3.5rem' }}>
        {children}
      </div>
    );
  }

  return (
    <>
      <PatternBand>
        {shownSizes.map((size, gi) => (
          <GroupColumn key={'g' + gi} size={size}>
            {Array.from({ length: size }).map((e, i) => <span key={i} className="text-2xl" aria-hidden="true">{round.growElement}</span>)}
          </GroupColumn>
        ))}
        <div className="kid-font mx-1 text-2xl font-extrabold" style={{ color: KID.ink }}>➕</div>
        <GroupColumn dashed>
          {count === 0 ? <span className="kid-font text-2xl font-extrabold" style={{ color: '#9aa3b5' }}>?</span> : Array.from({ length: count }).map((e, i) => (
            <motion.span key={i} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="text-2xl" aria-hidden="true">{round.growElement}</motion.span>
          ))}
        </GroupColumn>
      </PatternBand>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <BigButton onClick={add} color={KID.blue} colorDark={KID.blueDark} disabled={solved || count >= 9}>➕ {round.growElement} dazulegen</BigButton>
        <BigButton onClick={remove} color={KID.coral} colorDark={KID.coralDark} disabled={solved || count === 0}>➖ wegnehmen</BigButton>
        <BigButton onClick={confirm} color={KID.green} colorDark={KID.greenDark} disabled={solved || count === 0}>✅ Fertig!</BigButton>
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Die Reihe waechst</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-2xl font-extrabold" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? round.growSizes.join(' → ') : shownSizes.join(' → ') + ' → ?'}</span>
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
    Meoluna.reportScore(10, { action: 'pattern-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: misses === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'pattern-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer das naechste Muster?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function nextRound() { setPhase('play'); setRoundIndex(roundIndex + 1); }

  const RoomComponent = room.mode === 'build' ? BuildRoom : room.mode === 'grow' ? GrowRoom : PatternRoom;

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
        {phase === 'roundDone' && (<BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechstes Muster!</BigButton>)}
        {phase === 'done' && (<BigButton onClick={onComplete} color={KID.green} colorDark={KID.greenDark}>🎉 Weiter!</BigButton>)}
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
            const modeIcon = room.mode === 'build' ? '🧱' : room.mode === 'grow' ? '🌱' : room.mode === 'fill' ? '🧩' : '🔁';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Muster</p>
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
      Meoluna.complete({ engine: 'pattern', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<RoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} streak={streak} onStreak={setStreak} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
