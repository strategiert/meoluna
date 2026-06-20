import type { ChartEngineSpec } from "./chartTypes";
import { validateChartEngineSpec } from "./chartValidator";

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

const KID = {
  skyTop: '#79c7f5', skyBottom: '#e9f8ff', hillBack: '#a8dd8a', hillFront: '#7ec463',
  band: '#fbe3b2', bandEdge: '#d9b178', ink: '#27324a',
  coral: '#ff7a59', coralDark: '#c95a3f', blue: '#3f9bf0', blueDark: '#2c79c2',
  green: '#54b865', greenDark: '#3c8f4b', sun: '#ffd84d', card: '#ffffff',
};
const BAR_COLORS = ['#3f9bf0', '#ff7a59', '#54b865', '#ffd84d', '#a78bfa', '#f472b6'];

function speak(text) {
  try { if (!window.speechSynthesis) return; window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.9; window.speechSynthesis.speak(u);
  } catch (e) {}
}

function KidStyles() {
  return (<style>{"@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap'); .kid-font{font-family:'Baloo 2','Comic Sans MS','Segoe UI',sans-serif;}"}</style>);
}

function Luno({ mood }) {
  return (
    <motion.div animate={mood === 'sad' ? { x: [0, -7, 7, -5, 5, 0] } : mood === 'cheer' ? { y: [0, -16, 0] } : { y: [0, -3, 0] }} transition={mood === 'cheer' ? { duration: 0.5, repeat: 2 } : mood === 'sad' ? { duration: 0.5 } : { duration: 2.4, repeat: Infinity }}>
      <svg width="68" height="72" viewBox="0 0 74 78" aria-hidden="true">
        <ellipse cx="37" cy="74" rx="20" ry="4" fill="rgba(39,50,74,0.18)" />
        <ellipse cx="26" cy="68" rx="7" ry="6" fill="#f3b34c" /><ellipse cx="48" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <circle cx="37" cy="38" r="30" fill="#fff6e0" stroke="#27324a" strokeWidth="3.5" />
        <circle cx="27" cy="36" r="5.6" fill="#27324a" /><circle cx="47" cy="36" r="5.6" fill="#27324a" />
        <circle cx="29" cy="34" r="1.8" fill="#ffffff" /><circle cx="49" cy="34" r="1.8" fill="#ffffff" />
        <circle cx="19" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" /><circle cx="55" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" />
        {mood === 'sad' ? <path d="M 30 54 Q 37 49 44 54" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" /> : <path d="M 29 51 Q 37 59 45 51" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" />}
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
        <button type="button" onClick={() => speak(text)} aria-label="Vorlesen" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition-transform active:scale-90" style={{ background: KID.blue, boxShadow: '0 4px 0 ' + KID.blueDark }}>🔊</button>
      </div>
      <div className="absolute -bottom-3 left-10 h-6 w-6 rotate-45 border-b-4 border-r-4" style={{ background: KID.card, borderColor: KID.ink }} />
    </div>
  );
}

function BigButton({ onClick, color, colorDark, children, disabled }) {
  return (<button type="button" onClick={onClick} disabled={disabled} className="kid-font min-h-[64px] rounded-3xl px-5 py-3 text-xl font-extrabold text-white transition-all active:translate-y-1 disabled:opacity-40 sm:text-2xl" style={{ background: color, boxShadow: '0 6px 0 ' + colorDark, textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>{children}</button>);
}

function StarRow({ stars }) {
  return (<div className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xl" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}><span>⭐</span><span className="kid-font font-extrabold">{stars}</span></div>);
}

function RoundDots({ total, current }) {
  return (<div className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5" style={{ background: KID.card, borderColor: KID.ink }}>{Array.from({ length: total }).map((e, i) => (<div key={i} className="h-3.5 w-3.5 rounded-full border-2" style={{ background: i < current ? KID.green : i === current ? KID.sun : '#e3e8f0', borderColor: KID.ink }} />))}</div>);
}

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

function ChartRoomScene({ room, roomMeta, stars, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState(null);

  const round = room.rounds[roundIndex];
  const isRead = room.mode === 'read';

  function extremumIndex(ask) {
    const vals = room.categories.map((c) => c.value);
    const t = ask === 'most' ? Math.max(...vals) : Math.min(...vals);
    return vals.indexOf(t);
  }
  const activeIndex = isRead ? round.categoryIndex : null;
  const targetIndex = isRead ? round.categoryIndex : extremumIndex(round.ask);
  const resultText = isRead
    ? String(room.categories[targetIndex].value)
    : (room.categories[targetIndex].label + ' (' + room.categories[targetIndex].value + ')');

  useEffect(() => {
    setSolved(false); setMisses(0); setPicked(null);
    const r = room.rounds[roundIndex];
    if (isRead) {
      setBubble((r.objective || room.objective) + ' Wie viel zeigt der Balken von ' + room.categories[r.categoryIndex].label + '?');
    } else {
      setBubble((r.objective || room.objective) + ' Tippe den Balken mit dem ' + (r.ask === 'most' ? 'GROESSTEN' : 'KLEINSTEN') + ' Wert an.');
    }
  }, [roundIndex]);

  function win() {
    setSolved(true); setMood('cheer');
    Meoluna.reportScore(10, { action: 'chart-round-correct', roomId: room.roomId, roundIndex });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'chart-room-complete', roomId: room.roomId });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer die naechste Frage?');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }
  function fail() {
    const mm = misses + 1; setMisses(mm); setMood('sad');
    setBubble(mm >= 2 ? room.feedback.tryAgain : room.feedback.wrongValue);
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
          <div className="flex items-center gap-2"><RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} /><StarRow stars={stars} /></div>
        </div>
        <SpeechBubble text={bubble} />
        <ChartStage room={room} mode={room.mode} activeIndex={activeIndex} solved={solved} picked={picked} onPickBar={pickBar} />
        {isRead && phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {round.options.map((opt, i) => (
              <button key={i} type="button" disabled={solved} onClick={() => pickValue(opt)} className="kid-font flex h-16 min-w-[4rem] items-center justify-center rounded-2xl border-4 px-5 text-2xl font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>{opt}</button>
            ))}
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
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : room.mode === 'find' ? '🔎' : '📊';
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Fragen · {room.mode === 'find' ? 'vergleichen' : 'ablesen'}</p>
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
      Meoluna.complete({ engine: 'chart', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<ChartRoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
