import type { ChartEngineSpec } from "./chartTypes";
import { validateChartEngineSpec } from "./chartValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildChartWorldCode(spec: ChartEngineSpec): string {
  const validation = validateChartEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid chart spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `
const BAR_COLORS = ['#3f9bf0', '#ff7a59', '#54b865', '#ffd84d', '#a78bfa', '#f472b6'];
const BUILD_CAP = 30; // weiche Obergrenze pro +/- -Saeule, verhindert endloses Hochklicken

function ChartStage({ room, mode, activeIndex, solved, picked, onPickBar }) {
  const maxVal = Math.max(...room.categories.map((c) => c.value));
  const clickable = mode === 'find' && !solved;
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[2rem] border-4 p-4" style={{ borderColor: KID.ink, background: 'linear-gradient(180deg,#ffffff,#f3fbff)' }}>
      <div className="flex items-end justify-center gap-3 sm:gap-5" style={{ height: '15rem' }}>
        {room.categories.map((c, i) => {
          const isActive = mode === 'read' && i === activeIndex;
          const isPicked = picked === i;
          const color = isActive ? KID.sun : BAR_COLORS[i % BAR_COLORS.length];
          const hPct = Math.max(8, Math.round((c.value / maxVal) * 100));
          return (
            <button key={i} type="button" disabled={!clickable} onClick={() => clickable && onPickBar(i)} className="kid-font flex h-full flex-1 flex-col items-center justify-end" style={{ cursor: clickable ? 'pointer' : 'default', maxWidth: '5rem' }}>
              <span className="mb-1 text-lg font-extrabold" style={{ color: KID.ink }}>{(mode === 'read' && !isActive && !solved) ? '' : c.value}</span>
              {room.chartType === 'picto' ? (
                <div className="flex flex-col-reverse items-center justify-start gap-0.5 rounded-xl border-2 px-1 py-1" style={{ borderColor: isPicked ? KID.coral : KID.ink, background: isActive ? '#fff7d6' : '#ffffff' }}>
                  {Array.from({ length: c.value }).map((e, k) => (<span key={k} className="text-base leading-none">{c.emoji || '🟦'}</span>))}
                </div>
              ) : (
                <div className="w-full rounded-t-xl border-2 transition-all" style={{ height: hPct + '%', background: color, borderColor: isPicked ? KID.coral : KID.ink, boxShadow: isActive ? '0 0 0 4px rgba(255,216,77,0.5)' : 'none' }} />
              )}
              <span className="kid-font mt-2 max-w-[5rem] truncate text-sm font-extrabold" style={{ color: KID.ink }} title={c.label}>{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// build: das Kind zeichnet die Daten selbst ein - pro Kategorie mit +/-
// auf die Ziel-Hoehe/-Anzahl bringen. mismatchIndex markiert (kurzzeitig)
// die Saeule, die beim letzten Fertig-Tipp nicht gestimmt hat.
function BuildStage({ room, built, onInc, onDec, mismatchIndex, disabled }) {
  const maxVal = Math.max(1, ...room.categories.map((c) => c.value), ...built);
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[2rem] border-4 p-4" style={{ borderColor: KID.ink, background: 'linear-gradient(180deg,#ffffff,#f3fbff)' }}>
      <div className="flex items-end justify-center gap-3 sm:gap-5" style={{ height: '15rem' }}>
        {room.categories.map((c, i) => {
          const isMismatch = mismatchIndex === i;
          const hPct = Math.max(8, Math.round((built[i] / maxVal) * 100));
          return (
            <div key={i} className="kid-font flex h-full flex-1 flex-col items-center justify-end" style={{ maxWidth: '5rem' }}>
              <span className="mb-1 text-lg font-extrabold" style={{ color: KID.ink }}>{built[i]}</span>
              {room.chartType === 'picto' ? (
                <div className="flex min-h-[2rem] flex-col-reverse items-center justify-start gap-0.5 rounded-xl border-2 px-1 py-1" style={{ borderColor: isMismatch ? KID.coral : KID.ink, background: '#ffffff' }}>
                  {Array.from({ length: built[i] }).map((e, k) => (<span key={k} className="text-base leading-none">{c.emoji || '🟦'}</span>))}
                </div>
              ) : (
                <div className="w-full rounded-t-xl border-2 transition-all" style={{ height: hPct + '%', background: BAR_COLORS[i % BAR_COLORS.length], borderColor: isMismatch ? KID.coral : KID.ink }} />
              )}
              <span className="kid-font mt-2 max-w-[5rem] truncate text-sm font-extrabold" style={{ color: KID.ink }} title={c.label}>{c.label}</span>
              <div className="mt-2 flex items-center gap-1">
                <button type="button" onClick={() => onDec(i)} disabled={disabled} className="kid-font flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg font-extrabold transition-all active:translate-y-0.5 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>−</button>
                <button type="button" onClick={() => onInc(i)} disabled={disabled} className="kid-font flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg font-extrabold transition-all active:translate-y-0.5 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartRoomScene({ room, roomMeta, stars, streak, onStreak, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState(null);
  const [built, setBuilt] = useState(() => room.categories.map(() => 0));
  const [mismatchIndex, setMismatchIndex] = useState(null);

  const round = room.rounds[roundIndex];
  const isRead = room.mode === 'read';
  const isFind = room.mode === 'find';
  const isBuild = room.mode === 'build';

  function extremumIndex(ask) {
    const vals = room.categories.map((c) => c.value);
    const t = ask === 'most' ? Math.max(...vals) : Math.min(...vals);
    return vals.indexOf(t);
  }
  const activeIndex = isRead ? round.categoryIndex : null;
  const targetIndex = isRead ? round.categoryIndex : isFind ? extremumIndex(round.ask) : null;
  const resultText = isRead
    ? String(room.categories[targetIndex].value)
    : isFind
      ? (room.categories[targetIndex].label + ' (' + room.categories[targetIndex].value + ')')
      : round.targets.map((t, i) => room.categories[i].label + ': ' + t).join(', ');

  useEffect(() => {
    setSolved(false); setMisses(0); setPicked(null); setMismatchIndex(null);
    setBuilt(room.categories.map(() => 0));
    const r = room.rounds[roundIndex];
    if (isRead) {
      setBubble((r.objective || room.objective) + ' Wie viel zeigt der Balken von ' + room.categories[r.categoryIndex].label + '?');
    } else if (isFind) {
      setBubble((r.objective || room.objective) + ' Tippe den Balken mit dem ' + (r.ask === 'most' ? 'GROESSTEN' : 'KLEINSTEN') + ' Wert an.');
    } else {
      setBubble((r.objective || room.objective) + ' Zeichne die Daten ein: baue jeden Balken mit +/- auf die richtige Hoehe!');
    }
  }, [roundIndex]);

  function win() {
    setSolved(true); setMood('cheer'); Sound.success();
    const nextStreak = misses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'chart-round-correct', roomId: room.roomId, roundIndex, mode: room.mode });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'chart-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer die naechste Frage?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }
  function fail(hintLabel) {
    Sound.miss();
    const mm = misses + 1; setMisses(mm); setMood('sad');
    const base = mm >= 2 ? room.feedback.tryAgain : room.feedback.wrongValue;
    setBubble(hintLabel ? ('Der Balken bei "' + hintLabel + '" stimmt noch nicht. ' + base) : base);
    setTimeout(() => { setMood('happy'); setPicked(null); }, 700);
  }

  function pickValue(opt) {
    if (solved) return;
    if (opt === room.categories[round.categoryIndex].value) win(); else fail();
  }
  function pickBar(i) {
    if (solved) return;
    setPicked(i);
    if (i === targetIndex) win(); else fail();
  }
  function incCat(i) {
    if (solved) return;
    setBuilt((b) => {
      if (b[i] >= BUILD_CAP) return b;
      const next = b.map((v, idx) => (idx === i ? v + 1 : v));
      Sound.tone(Sound.noteFor(next[i]), 0.1);
      return next;
    });
  }
  function decCat(i) {
    if (solved) return;
    setBuilt((b) => {
      if (b[i] <= 0) return b;
      const next = b.map((v, idx) => (idx === i ? v - 1 : v));
      Sound.tone(Sound.noteFor(next[i]), 0.1);
      return next;
    });
  }
  function confirmBuild() {
    if (solved) return;
    const mismatch = built.findIndex((v, i) => v !== round.targets[i]);
    if (mismatch === -1) {
      win();
    } else {
      setMismatchIndex(mismatch);
      fail(room.categories[mismatch].label);
      setTimeout(() => setMismatchIndex(null), 900);
    }
  }
  function nextRound() { setPhase('play'); setRoundIndex(roundIndex + 1); }

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
        {!isBuild && (<ChartStage room={room} mode={room.mode} activeIndex={activeIndex} solved={solved} picked={picked} onPickBar={pickBar} />)}
        {isBuild && (<BuildStage room={room} built={built} onInc={incCat} onDec={decCat} mismatchIndex={mismatchIndex} disabled={solved} />)}
        {isRead && phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {round.options.map((opt, i) => (
              <button key={i} type="button" disabled={solved} onClick={() => pickValue(opt)} className="kid-font flex h-16 min-w-[4rem] items-center justify-center rounded-2xl border-4 px-5 text-2xl font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>{opt}</button>
            ))}
          </div>
        )}
        {isBuild && phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <BigButton onClick={confirmBuild} color={KID.green} colorDark={KID.greenDark} disabled={solved}>✅ Fertig!</BigButton>
          </div>
        )}
        <div className="rounded-3xl border-4 p-4 text-center" style={{ background: KID.card, borderColor: KID.ink }}>
          <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Diagramm wird</p>
          <span className="kid-font mt-1 inline-block rounded-2xl border-2 px-3 py-1.5 text-2xl font-extrabold" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{solved ? resultText : '?'}</span>
        </div>
        {phase === 'roundDone' && (<BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechste Frage!</BigButton>)}
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
            const modeIcon = room.mode === 'find' ? '🔎' : room.mode === 'build' ? '✏️' : '📊';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            const modeLabel = room.mode === 'find' ? 'vergleichen' : room.mode === 'build' ? 'einzeichnen' : 'ablesen';
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Fragen · {modeLabel}</p>
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
      Meoluna.complete({ engine: 'chart', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<ChartRoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} streak={streak} onStreak={setStreak} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
