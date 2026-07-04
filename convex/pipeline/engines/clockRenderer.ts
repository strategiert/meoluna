import type { ClockEngineSpec } from "./clockTypes";
import { validateClockEngineSpec } from "./clockValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildClockWorldCode(spec: ClockEngineSpec): string {
  const validation = validateClockEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid clock spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `
function fmt(h, m) { return h + ':' + String(m).padStart(2, '0') + ' Uhr'; }

// set: ohne minuteStep exakt das alte Raster (0/15/30/45).
function buildMinuteSteps(step) {
  const s = step || 15;
  const arr = [];
  for (let m = 0; m < 60; m += s) arr.push(m);
  return arr;
}

// duration: Endzeit auf dem 12h-Zifferblatt (kein AM/PM-Tracking).
function computeDurationEnd(startHour, startMinute, durationMinutes) {
  const half = 12 * 60;
  const base = (startHour % 12) * 60 + startMinute + durationMinutes;
  const norm = ((base % half) + half) % half;
  let hour = Math.floor(norm / 60);
  if (hour === 0) hour = 12;
  const minute = norm % 60;
  return { hour: hour, minute: minute };
}

function targetTimeFor(room, round) {
  if (room.mode === 'duration') return computeDurationEnd(round.startHour, round.startMinute, round.durationMinutes);
  return { hour: round.hour, minute: round.minute };
}

function AnalogClock({ hour, minute, big }) {
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;
  const size = big ? 220 : 150;
  const ticks = [];
  for (let i = 1; i <= 12; i += 1) {
    const a = (i * 30 - 90) * (Math.PI / 180);
    ticks.push({ n: i, x: 50 + Math.cos(a) * 37, y: 50 + Math.sin(a) * 37 });
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={'Uhr zeigt ' + fmt(hour, minute)}>
      <circle cx="50" cy="50" r="47" fill={KID.card} stroke={KID.ink} strokeWidth="3.5" />
      <circle cx="50" cy="50" r="47" fill="none" stroke={KID.sun} strokeWidth="2" opacity="0.6" />
      {ticks.map((t) => (<text key={t.n} x={t.x} y={t.y + 3.5} textAnchor="middle" className="kid-font" fontSize="8" fontWeight="800" fill={KID.ink}>{t.n}</text>))}
      <g transform={'rotate(' + hourAngle + ' 50 50)'}><line className="hourHand" x1="50" y1="50" x2="50" y2="28" stroke={KID.ink} strokeWidth="4.5" strokeLinecap="round" /></g>
      <g transform={'rotate(' + minuteAngle + ' 50 50)'}><line className="minuteHand" x1="50" y1="50" x2="50" y2="16" stroke={KID.coral} strokeWidth="3" strokeLinecap="round" /></g>
      <circle cx="50" cy="50" r="3.5" fill={KID.ink} />
    </svg>
  );
}

// read: Uhr zeigt eine Zeit, das Kind waehlt sie aus Buttons (Bestand, Text/Klick unveraendert).
function ReadBody({ round, solved, onPick }) {
  return (
    <>
      <div className="flex justify-center">
        <div className="rounded-[2rem] border-4 p-3" style={{ borderColor: KID.ink, background: KID.skyBottom }}><AnalogClock hour={round.hour} minute={round.minute} big /></div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {round.options.map((o, i) => (
          <button key={i} type="button" disabled={solved} onClick={() => onPick(o)} className="kid-font min-h-[60px] rounded-2xl border-4 px-5 py-3 text-2xl font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>{fmt(o.hour, o.minute)}</button>
        ))}
      </div>
    </>
  );
}

// duration (neu): Startzeit als Uhr, Endzeit im selben Buttons-Format wie ReadBody.
function DurationBody({ round, solved, onPick }) {
  return (
    <>
      <div className="flex justify-center">
        <div className="rounded-[2rem] border-4 p-3" style={{ borderColor: KID.ink, background: KID.skyBottom }}><AnalogClock hour={round.startHour} minute={round.startMinute} big /></div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {round.options.map((o, i) => (
          <button key={i} type="button" disabled={solved} onClick={() => onPick(o)} className="kid-font min-h-[60px] rounded-2xl border-4 px-5 py-3 text-2xl font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>{fmt(o.hour, o.minute)}</button>
        ))}
      </div>
    </>
  );
}

// set: Zeiger stellen. Ohne round.minuteStep identisch zum Bestand (Raster 0/15/30/45).
function SetBody({ round, solved, onCheck }) {
  const steps = buildMinuteSteps(round.minuteStep || 15);
  const [h, setH] = useState(round.hour === 12 ? 11 : round.hour + 1 > 12 ? 1 : round.hour);
  const [mIdx, setMIdx] = useState(0);
  const m = steps[mIdx];
  useEffect(() => {
    const nextSteps = buildMinuteSteps(round.minuteStep || 15);
    const targetIdx = nextSteps.indexOf(round.minute);
    setH(round.hour === 12 ? 11 : 1);
    setMIdx(targetIdx === 0 ? 1 : 0);
  }, [round]);

  function bumpH(d) { if (solved) return; Sound.thunk(); setH((v) => { const n = v + d; return n < 1 ? 12 : n > 12 ? 1 : n; }); }
  function bumpM(d) { if (solved) return; Sound.thunk(); setMIdx((v) => (v + d + steps.length) % steps.length); }

  return (
    <>
      <div className="flex justify-center">
        <div className="rounded-[2rem] border-4 p-3" style={{ borderColor: KID.ink, background: KID.skyBottom }}><AnalogClock hour={h} minute={m} big /></div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border-4 px-3 py-2" style={{ background: KID.card, borderColor: KID.ink }}>
          <button type="button" onClick={() => bumpH(-1)} disabled={solved} className="kid-font h-12 w-12 rounded-xl text-2xl font-extrabold text-white" style={{ background: KID.blue, boxShadow: '0 4px 0 ' + KID.blueDark }}>−</button>
          <span className="kid-font w-20 text-center text-lg font-extrabold" style={{ color: KID.ink }}>Stunde<br/>{h}</span>
          <button type="button" onClick={() => bumpH(1)} disabled={solved} className="kid-font h-12 w-12 rounded-xl text-2xl font-extrabold text-white" style={{ background: KID.blue, boxShadow: '0 4px 0 ' + KID.blueDark }}>+</button>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border-4 px-3 py-2" style={{ background: KID.card, borderColor: KID.ink }}>
          <button type="button" onClick={() => bumpM(-1)} disabled={solved} className="kid-font h-12 w-12 rounded-xl text-2xl font-extrabold text-white" style={{ background: KID.coral, boxShadow: '0 4px 0 ' + KID.coralDark }}>−</button>
          <span className="kid-font w-20 text-center text-lg font-extrabold" style={{ color: KID.ink }}>Minute<br/>{String(m).padStart(2, '0')}</span>
          <button type="button" onClick={() => bumpM(1)} disabled={solved} className="kid-font h-12 w-12 rounded-xl text-2xl font-extrabold text-white" style={{ background: KID.coral, boxShadow: '0 4px 0 ' + KID.coralDark }}>+</button>
        </div>
      </div>
      <div className="flex justify-center"><BigButton onClick={() => onCheck(h, m)} color={KID.green} colorDark={KID.greenDark} disabled={solved}>✓ Fertig</BigButton></div>
    </>
  );
}

function ClockRoomScene({ room, roomMeta, stars, streak, onStreak, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  const round = room.rounds[roundIndex];

  useEffect(() => {
    setSolved(false); setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective));
  }, [roundIndex]);

  function win() {
    setSolved(true); setMood('cheer');
    Sound.success();
    const nextStreak = misses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'clock-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: misses === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'clock-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer die naechste Uhr?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function fail() {
    const mm = misses + 1; setMisses(mm); setMood('sad'); Sound.miss();
    setBubble(mm >= 2 ? room.feedback.tryAgain : room.feedback.wrongTime);
    setTimeout(() => setMood('happy'), 700);
  }

  function pickOption(opt) {
    if (solved) return;
    const target = targetTimeFor(room, round);
    if (opt.hour === target.hour && opt.minute === target.minute) win(); else fail();
  }
  function checkSet(h, m) {
    if (solved) return;
    if (h === round.hour && m === round.minute) win(); else fail();
  }
  function nextRound() { setPhase('play'); setRoundIndex(roundIndex + 1); }

  const displayTarget = targetTimeFor(room, round);

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
        {phase !== 'done' && (room.mode === 'set'
          ? <SetBody key={roundIndex} round={round} solved={solved} onCheck={checkSet} />
          : room.mode === 'duration'
            ? <DurationBody key={roundIndex} round={round} solved={solved} onPick={pickOption} />
            : <ReadBody key={roundIndex} round={round} solved={solved} onPick={pickOption} />)}
        <div className="rounded-3xl border-4 p-4 text-center" style={{ background: KID.card, borderColor: KID.ink }}>
          <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Die Uhr zeigt</p>
          <span className="kid-font mt-1 inline-block rounded-2xl border-2 px-3 py-1.5 text-2xl font-extrabold" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? fmt(displayTarget.hour, displayTarget.minute) : '?'}</span>
        </div>
        {phase === 'roundDone' && (<BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechste Uhr!</BigButton>)}
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
            const modeIcon = room.mode === 'set' ? '🖐️' : room.mode === 'duration' ? '⏱️' : '🕐';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            const modeLabel = room.mode === 'set' ? 'stellen' : room.mode === 'duration' ? 'rechnen' : 'lesen';
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Uhren · {modeLabel}</p>
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
      Meoluna.complete({ engine: 'clock', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<ClockRoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} streak={streak} onStreak={setStreak} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
