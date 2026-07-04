import type { CountEngineSpec } from "./countingTypes";
import { validateCountEngineSpec } from "./countingValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildCountingWorldCode(spec: CountEngineSpec): string {
  const validation = validateCountEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid counting spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
const COUNT_MAX = 20;
const TEN_FRAME_MAX = 10;
` + KID_KIT_CORE + `
function ObjectField({ emoji, n, highlightUpTo }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border-4 p-3" style={{ background: KID.band, borderColor: KID.bandEdge, minHeight: '6rem' }}>
      {Array.from({ length: n }).map((e, i) => (
        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04 }} className="text-3xl sm:text-4xl" style={{ opacity: highlightUpTo !== undefined && i >= highlightUpTo ? 0.35 : 1 }}>{emoji}</motion.span>
      ))}
    </div>
  );
}

function numberChoices(correct) {
  const set = new Set([correct]);
  let delta = 1;
  while (set.size < 4) {
    if (correct - delta >= 1) set.add(correct - delta);
    if (set.size < 4 && correct + delta <= COUNT_MAX) set.add(correct + delta);
    delta += 1;
    if (delta > COUNT_MAX) break;
  }
  return Array.from(set).sort((a, b) => a - b);
}

function CountRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [choices, setChoices] = useState(() => numberChoices(round.count));

  useEffect(() => {
    const r = room.rounds[roundIndex];
    setSolved(false); setMisses(0); setChoices(numberChoices(r.count));
    setBubble((r.objective || room.objective) + ' Wie viele sind es? Zaehle und tippe die Zahl!');
  }, [roundIndex]);

  function pick(n) {
    if (solved) return;
    if (n === round.count) {
      setSolved(true); setMood('cheer'); speak(String(round.count)); Sound.success();
      onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss();
      setBubble(m >= 2 ? room.feedback.tryAgain : (n > round.count ? room.feedback.tooMany : room.feedback.tooFew));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10"><ObjectField emoji={round.emoji} n={round.count} /></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {choices.map((n) => (
          <button key={n} type="button" disabled={solved} onClick={() => pick(n)} className="kid-font min-h-[64px] rounded-3xl border-4 text-3xl font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>{n}</button>
        ))}
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Zaehlen wird</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? round.emoji + ' = ' + round.count : round.emoji + ' = ?'}</span>
      </div>
    </>
  );
}

function MakeRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [n, setN] = useState(0);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    const r = room.rounds[roundIndex];
    setN(0); setSolved(false); setMisses(0);
    setBubble((r.objective || room.objective) + ' Lege genau ' + r.target + '!');
  }, [roundIndex]);

  function check() {
    if (solved) return;
    if (n === round.target) {
      setSolved(true); setMood('cheer'); speak(String(round.target)); Sound.success(); onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss();
      setBubble(m >= 2 ? room.feedback.tryAgain : (n > round.target ? room.feedback.tooMany : room.feedback.tooFew));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>Ziel: {round.target} {round.emoji}</span>
          <ObjectField emoji={round.emoji} n={n} />
          <span className="kid-font rounded-full border-2 px-4 py-1 text-xl font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>Du hast: {n}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <BigButton onClick={() => { if (!solved && n < COUNT_MAX) { setN(n + 1); Sound.tone(Sound.noteFor(n + 1), 0.12); } }} color={KID.green} colorDark={KID.greenDark} disabled={solved}>{round.emoji} dazu</BigButton>
        <BigButton onClick={() => { if (!solved && n > 0) { setN(n - 1); Sound.thunk(); } }} color={KID.coral} colorDark={KID.coralDark} disabled={solved || n === 0}>↩️ weg</BigButton>
      </div>
      <BigButton onClick={check} color={KID.blue} colorDark={KID.blueDark} disabled={solved || n === 0}>✅ Fertig!</BigButton>
    </>
  );
}

function CompareRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  const answer = round.ask === 'equal' ? 'equal' : round.ask === 'more' ? (round.leftCount > round.rightCount ? 'left' : 'right') : (round.leftCount < round.rightCount ? 'left' : 'right');
  const askText = round.ask === 'equal' ? 'Sind beide gleich viele?' : round.ask === 'more' ? 'Welche Gruppe hat MEHR?' : 'Welche Gruppe hat WENIGER?';

  useEffect(() => {
    setSolved(false); setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' ' + askText);
  }, [roundIndex]);

  function pick(choice) {
    if (solved) return;
    if (choice === answer) {
      setSolved(true); setMood('cheer'); Sound.success(); onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss();
      setBubble(m >= 2 ? room.feedback.tryAgain : 'Zaehle beide Gruppen genau und vergleiche.');
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <button type="button" disabled={solved} onClick={() => pick('left')} className="rounded-2xl border-4 p-2 transition-all active:translate-y-1" style={{ background: solved && answer === 'left' ? '#dcf5e1' : KID.card, borderColor: KID.ink }}>
            <ObjectField emoji={round.leftEmoji} n={round.leftCount} />
          </button>
          <button type="button" disabled={solved} onClick={() => pick('right')} className="rounded-2xl border-4 p-2 transition-all active:translate-y-1" style={{ background: solved && answer === 'right' ? '#dcf5e1' : KID.card, borderColor: KID.ink }}>
            <ObjectField emoji={round.rightEmoji} n={round.rightCount} />
          </button>
        </div>
      </div>
      <BigButton onClick={() => pick('equal')} color={KID.sun} colorDark={KID.bandEdge} disabled={solved}><span style={{ color: KID.ink }}>⚖️ Gleich viele</span></BigButton>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Vergleichen wird</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? round.leftCount + (round.leftCount > round.rightCount ? ' > ' : round.leftCount < round.rightCount ? ' < ' : ' = ') + round.rightCount : '? ? ?'}</span>
      </div>
    </>
  );
}

// ten-frame: Zehnerfeld, zwei Reihen a fuenf Feldern. Tippen fuellt/leert.
function TenFrameRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [filled, setFilled] = useState(() => Array(TEN_FRAME_MAX).fill(false));
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setFilled(Array(TEN_FRAME_MAX).fill(false));
    setSolved(false); setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Fuelle genau ' + room.rounds[roundIndex].target + ' Felder!');
  }, [roundIndex]);

  function toggle(index) {
    if (solved) return;
    setFilled((list) => {
      const next = list.slice();
      next[index] = !next[index];
      Sound.tone(Sound.noteFor(next.filter(Boolean).length), 0.12);
      return next;
    });
  }

  function check() {
    if (solved) return;
    const n = filled.filter(Boolean).length;
    if (n === round.target) {
      setSolved(true); setMood('cheer'); speak(String(round.target)); Sound.success(); onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss();
      setBubble(m >= 2 ? room.feedback.tryAgain : (n > round.target ? room.feedback.tooMany : room.feedback.tooFew));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  const n = filled.filter(Boolean).length;

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>Ziel: {round.target}</span>
          <div className="grid grid-cols-5 gap-2 rounded-2xl border-4 p-3" style={{ background: KID.band, borderColor: KID.bandEdge }}>
            {filled.map((isFilled, i) => (
              <button key={i} type="button" onClick={() => toggle(i)} disabled={solved} className="flex h-12 w-12 items-center justify-center rounded-xl border-4 text-2xl transition-all active:translate-y-1 sm:h-14 sm:w-14" style={{ background: isFilled ? KID.sun : KID.card, borderColor: KID.ink }}>
                {isFilled ? '⭐' : ''}
              </button>
            ))}
          </div>
          <span className="kid-font rounded-full border-2 px-4 py-1 text-xl font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>Du hast: {n}</span>
        </div>
      </div>
      <BigButton onClick={check} color={KID.blue} colorDark={KID.blueDark} disabled={solved || n === 0}>✅ Fertig!</BigButton>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Zaehlen wird</p>
        <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? '⭐ = ' + round.target : '⭐ = ?'}</span>
      </div>
    </>
  );
}

// make-equal: links eine feste Menge, rechts angleichen bis gleich viele.
function MakeEqualRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [right, setRight] = useState(0);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    const r = room.rounds[roundIndex];
    setRight(r.rightStart); setSolved(false); setMisses(0);
    setBubble((r.objective || room.objective) + ' Mach rechts genau so viele wie links!');
  }, [roundIndex]);

  function check() {
    if (solved) return;
    if (right === round.leftCount) {
      setSolved(true); setMood('cheer'); speak(String(round.leftCount)); Sound.success(); onRoundWin(misses);
    } else {
      const m = misses + 1; setMisses(m); setMood('sad'); Sound.miss();
      setBubble(m >= 2 ? room.feedback.tryAgain : (right > round.leftCount ? room.feedback.tooMany : room.feedback.tooFew));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2">
            <span className="kid-font rounded-full border-2 px-3 py-1 text-base font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>Links: {round.leftCount}</span>
            <ObjectField emoji={round.element} n={round.leftCount} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="kid-font rounded-full border-2 px-3 py-1 text-base font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>Rechts: {right}</span>
            <ObjectField emoji={round.element} n={right} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <BigButton onClick={() => { if (!solved && right < COUNT_MAX) { setRight(right + 1); Sound.tone(Sound.noteFor(right + 1), 0.12); } }} color={KID.green} colorDark={KID.greenDark} disabled={solved}>{round.element} dazu</BigButton>
        <BigButton onClick={() => { if (!solved && right > 0) { setRight(right - 1); Sound.thunk(); } }} color={KID.coral} colorDark={KID.coralDark} disabled={solved || right === 0}>↩️ weg</BigButton>
      </div>
      <BigButton onClick={check} color={KID.blue} colorDark={KID.blueDark} disabled={solved}>✅ Fertig!</BigButton>
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
    const nextStreak = misses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'counting-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: misses === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'counting-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer die naechste Aufgabe?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function nextRound() { setPhase('play'); setRoundIndex(roundIndex + 1); }

  const RoomComponent = room.mode === 'count' ? CountRoom : room.mode === 'make' ? MakeRoom : room.mode === 'compare' ? CompareRoom : room.mode === 'ten-frame' ? TenFrameRoom : MakeEqualRoom;

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
        {phase === 'roundDone' && (<BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechste Aufgabe!</BigButton>)}
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
            const modeIcon = room.mode === 'compare' ? '⚖️' : room.mode === 'make' ? '🧺' : room.mode === 'ten-frame' ? '🔟' : room.mode === 'make-equal' ? '➕' : '🔢';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
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
      Meoluna.complete({ engine: 'counting', world: SPEC.world.worldName });
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
