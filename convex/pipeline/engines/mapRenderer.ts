import type { MapEngineSpec } from "./mapTypes";
import { validateMapEngineSpec } from "./mapValidator";

export function buildMapWorldCode(spec: MapEngineSpec): string {
  const validation = validateMapEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid map spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
const DIR_DE = { north: 'Norden', south: 'Sueden', east: 'Osten', west: 'Westen' };
const DIR_ARROW = { north: '⬆️', south: '⬇️', east: '➡️', west: '⬅️' };

const KID = {
  skyTop: '#79c7f5', skyBottom: '#e9f8ff', hillBack: '#a8dd8a', hillFront: '#7ec463',
  band: '#fbe3b2', bandEdge: '#d9b178', ink: '#27324a',
  coral: '#ff7a59', coralDark: '#c95a3f', blue: '#3f9bf0', blueDark: '#2c79c2',
  green: '#54b865', greenDark: '#3c8f4b', sun: '#ffd84d', card: '#ffffff',
};

function resolvePath(start, steps, rows, cols) {
  let row = start.row; let col = start.col;
  for (const s of steps) {
    for (let i = 0; i < s.count; i += 1) {
      if (s.dir === 'north') row -= 1; else if (s.dir === 'south') row += 1;
      else if (s.dir === 'east') col += 1; else if (s.dir === 'west') col -= 1;
      if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    }
  }
  return { row, col };
}

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

function Compass() {
  return (
    <svg width="84" height="84" viewBox="0 0 100 100" aria-label="Kompass" className="Kompass">
      <circle cx="50" cy="50" r="46" fill={KID.card} stroke={KID.ink} strokeWidth="3" />
      <polygon points="50,8 57,50 43,50" fill={KID.coral} stroke={KID.ink} strokeWidth="1.5" />
      <polygon points="50,92 57,50 43,50" fill="#cdd6e2" stroke={KID.ink} strokeWidth="1.5" />
      <text x="50" y="22" textAnchor="middle" className="kid-font" fontSize="13" fontWeight="800" fill={KID.ink}>N</text>
      <text x="50" y="93" textAnchor="middle" className="kid-font" fontSize="13" fontWeight="800" fill={KID.ink}>S</text>
      <text x="88" y="55" textAnchor="middle" className="kid-font" fontSize="13" fontWeight="800" fill={KID.ink}>O</text>
      <text x="12" y="55" textAnchor="middle" className="kid-font" fontSize="13" fontWeight="800" fill={KID.ink}>W</text>
    </svg>
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

function MapGrid({ room, target, startCell, solved, picked, onPick }) {
  const lmAt = {};
  room.landmarks.forEach((lm) => { lmAt[lm.row + ',' + lm.col] = lm; });
  return (
    <div className="mx-auto grid gap-1.5 rounded-[2rem] border-4 p-3" style={{ borderColor: KID.ink, background: '#eaf6df', gridTemplateColumns: 'repeat(' + room.cols + ', minmax(0,1fr))', maxWidth: room.cols * 84 + 40 }}>
      {Array.from({ length: room.rows }).map((er, r) => (
        Array.from({ length: room.cols }).map((ec, c) => {
          const key = r + ',' + c;
          const lm = lmAt[key];
          const isStart = startCell && startCell.row === r && startCell.col === c;
          const isTarget = solved && target && target.row === r && target.col === c;
          const isPicked = picked && picked.row === r && picked.col === c;
          return (
            <button key={key} type="button" disabled={solved} onClick={() => onPick({ row: r, col: c })} className="kid-font flex aspect-square items-center justify-center rounded-xl border-2 text-2xl font-extrabold transition-all active:translate-y-0.5 disabled:cursor-default sm:text-3xl" style={{ background: isTarget ? KID.green : isStart ? '#ffe7a3' : isPicked ? '#ffd4c8' : KID.card, borderColor: KID.ink }}>
              {lm ? lm.emoji : isStart ? '🧭' : ''}
            </button>
          );
        })
      ))}
    </div>
  );
}

function MapRoomScene({ room, roomMeta, stars, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState(null);

  const round = room.rounds[roundIndex];
  const isPath = room.mode === 'path';
  const startLm = isPath ? room.landmarks[round.startIndex] : null;
  const startCell = startLm ? { row: startLm.row, col: startLm.col } : null;
  const target = isPath
    ? resolvePath(startCell, round.steps, room.rows, room.cols)
    : { row: room.landmarks[round.targetIndex].row, col: room.landmarks[round.targetIndex].col };

  useEffect(() => {
    setSolved(false); setMisses(0); setPicked(null);
    const r = room.rounds[roundIndex];
    if (isPath) {
      const sl = room.landmarks[r.startIndex];
      const stepsText = r.steps.map((s) => s.count + ' nach ' + DIR_DE[s.dir]).join(', ');
      setBubble((r.objective || room.objective) + ' Start bei ' + sl.emoji + ' ' + sl.label + ': ' + stepsText + '. Wo kommst du an?');
    } else {
      const lm = room.landmarks[r.targetIndex];
      setBubble((r.objective || room.objective) + ' Finde ' + lm.emoji + ' ' + lm.label + ' auf der Karte!');
    }
  }, [roundIndex]);

  function pickCell(cell) {
    if (solved) return;
    setPicked(cell);
    if (target && cell.row === target.row && cell.col === target.col) {
      setSolved(true); setMood('cheer');
      Meoluna.reportScore(10, { action: 'map-round-correct', roomId: room.roomId, roundIndex });
      onStar();
      if (roundIndex + 1 >= room.rounds.length) {
        setPhase('done');
        setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
        Meoluna.reportScore(25, { action: 'map-room-complete', roomId: room.roomId });
        Meoluna.completeModule(room.roomId, 25);
        confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
      } else {
        setPhase('roundDone');
        setBubble(room.feedback.correct + ' Bereit fuer das naechste Ziel?');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
      }
      setTimeout(() => setMood('happy'), 1200);
    } else {
      const mm = misses + 1; setMisses(mm); setMood('sad');
      setBubble(mm >= 2 ? room.feedback.tryAgain : room.feedback.wrongCell);
      setTimeout(() => { setMood('happy'); setPicked(null); }, 700);
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
          <div className="flex items-center gap-2"><RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} /><StarRow stars={stars} /></div>
        </div>
        <SpeechBubble text={bubble} />
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center">
          <MapGrid room={room} target={target} startCell={startCell} solved={solved} picked={picked} onPick={pickCell} />
          <div className="flex shrink-0 flex-col items-center gap-1 rounded-2xl border-4 p-2" style={{ background: KID.card, borderColor: KID.ink }}>
            <Compass />
            <span className="kid-font text-sm font-extrabold" style={{ color: '#8a93a6' }}>Himmelsrichtungen</span>
          </div>
        </div>
        {isPath && phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {round.steps.map((s, i) => (<span key={i} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{DIR_ARROW[s.dir]} {s.count} {DIR_DE[s.dir]}</span>))}
          </div>
        )}
        {phase === 'roundDone' && (<BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechstes Ziel!</BigButton>)}
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
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : room.mode === 'path' ? '🧭' : '🗺️';
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Ziele · {room.mode === 'path' ? 'Weg finden' : 'suchen'}</p>
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
      Meoluna.complete({ engine: 'map', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<MapRoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
