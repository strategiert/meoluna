import type { MapEngineSpec } from "./mapTypes";
import { validateMapEngineSpec } from "./mapValidator";
import { KID_KIT_CORE } from "./kidKit";

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
` + KID_KIT_CORE + `
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

function MapGrid({ room, target, startCell, solved, picked, onPick, routeVisited }) {
  const lmAt = {};
  room.landmarks.forEach((lm) => { lmAt[lm.row + ',' + lm.col] = lm; });
  const visited = routeVisited || [];
  return (
    <div className="relative mx-auto" style={{ maxWidth: room.cols * 84 + 40 }}>
      <div className="grid gap-1.5 rounded-[2rem] border-4 p-3" style={{ borderColor: KID.ink, background: '#eaf6df', gridTemplateColumns: 'repeat(' + room.cols + ', minmax(0,1fr))' }}>
        {Array.from({ length: room.rows }).map((er, r) => (
          Array.from({ length: room.cols }).map((ec, c) => {
            const key = r + ',' + c;
            const lm = lmAt[key];
            const isStart = startCell && startCell.row === r && startCell.col === c;
            const isTarget = solved && target && target.row === r && target.col === c;
            const isPicked = picked && picked.row === r && picked.col === c;
            const isVisited = visited.some((v) => v.row === r && v.col === c);
            return (
              <button key={key} type="button" disabled={solved} onClick={() => onPick({ row: r, col: c })} className="kid-font flex aspect-square items-center justify-center rounded-xl border-2 text-2xl font-extrabold transition-all active:translate-y-0.5 disabled:cursor-default sm:text-3xl" style={{ background: isTarget || isVisited ? KID.green : isStart ? '#ffe7a3' : isPicked ? '#ffd4c8' : KID.card, borderColor: KID.ink }}>
                {lm ? lm.emoji : isStart ? '🧭' : ''}
              </button>
            );
          })
        ))}
      </div>
      {visited.length > 1 && (
        <svg className="pointer-events-none absolute inset-3" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: 'calc(100% - 1.5rem)', height: 'calc(100% - 1.5rem)' }}>
          <polyline points={visited.map((v) => ((v.col + 0.5) / room.cols * 100) + ',' + ((v.row + 0.5) / room.rows * 100)).join(' ')} fill="none" stroke={KID.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function routeStationText(room, routeIds) {
  const stations = routeIds.map((idx) => room.landmarks[idx].emoji + ' ' + room.landmarks[idx].label);
  if (stations.length === 1) return 'Tippe ' + stations[0] + ' an';
  return 'Erst zu ' + stations.slice(0, -1).join(', dann zu ') + ', dann zu ' + stations[stations.length - 1];
}

function MapRoomScene({ room, roomMeta, stars, streak, onStreak, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [routeVisited, setRouteVisited] = useState([]);

  const round = room.rounds[roundIndex];
  const isPath = room.mode === 'path';
  const isRoute = room.mode === 'route';
  const startLm = isPath ? room.landmarks[round.startIndex] : null;
  const startCell = startLm ? { row: startLm.row, col: startLm.col } : null;
  const routeCells = isRoute ? round.routeIds.map((idx) => ({ row: room.landmarks[idx].row, col: room.landmarks[idx].col })) : null;
  const target = isRoute ? null : isPath
    ? resolvePath(startCell, round.steps, room.rows, room.cols)
    : { row: room.landmarks[round.targetIndex].row, col: room.landmarks[round.targetIndex].col };

  useEffect(() => {
    setSolved(false); setMisses(0); setPicked(null); setRouteProgress(0); setRouteVisited([]);
    const r = room.rounds[roundIndex];
    if (isRoute) {
      setBubble((r.objective || room.objective) + ' ' + routeStationText(room, r.routeIds) + '. Tippe die Orte in dieser Reihenfolge an!');
    } else if (isPath) {
      const sl = room.landmarks[r.startIndex];
      const stepsText = r.steps.map((s) => s.count + ' nach ' + DIR_DE[s.dir]).join(', ');
      setBubble((r.objective || room.objective) + ' Start bei ' + sl.emoji + ' ' + sl.label + ': ' + stepsText + '. Wo kommst du an?');
    } else {
      const lm = room.landmarks[r.targetIndex];
      setBubble((r.objective || room.objective) + ' Finde ' + lm.emoji + ' ' + lm.label + ' auf der Karte!');
    }
  }, [roundIndex]);

  function finishRound(finalMisses) {
    setSolved(true); setMood('cheer'); Sound.success();
    const nextStreak = finalMisses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'map-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: finalMisses === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'map-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer das naechste Ziel?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function pickCell(cell) {
    if (solved) return;
    if (isRoute) {
      const expected = routeCells[routeProgress];
      if (expected && cell.row === expected.row && cell.col === expected.col) {
        const nextVisited = routeVisited.concat([cell]);
        setRouteVisited(nextVisited);
        Sound.tone(Sound.noteFor(routeProgress), 0.14);
        setMood('cheer');
        setTimeout(() => setMood('happy'), 400);
        const nextProgress = routeProgress + 1;
        setRouteProgress(nextProgress);
        if (nextProgress >= routeCells.length) {
          finishRound(misses);
        } else {
          setBubble('Richtig! Weiter zur naechsten Station.');
        }
      } else {
        const mm = misses + 1; setMisses(mm); setMood('sad'); Sound.miss();
        setBubble(mm >= 2 ? room.feedback.tryAgain : room.feedback.wrongCell);
        setTimeout(() => setMood('happy'), 700);
      }
      return;
    }
    setPicked(cell);
    if (target && cell.row === target.row && cell.col === target.col) {
      finishRound(misses);
    } else {
      const mm = misses + 1; setMisses(mm); setMood('sad'); Sound.miss();
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
          <button type="button" onClick={() => { Sound.thunk(); onBack(); }} className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-0.5" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.bandEdge }}>← Karte</button>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{roomMeta.title || room.roomId}</div>
            <Luno mood={mood} />
          </div>
          <div className="flex items-center gap-2"><StreakMeter streak={streak} /><RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} /><StarRow stars={stars} /><SoundToggle /></div>
        </div>
        <SpeechBubble text={bubble} />
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center">
          <MapGrid room={room} target={target} startCell={startCell} solved={solved} picked={picked} onPick={pickCell} routeVisited={isRoute ? routeVisited : undefined} />
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
        {isRoute && phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {round.routeIds.map((idx, i) => (
              <span key={i} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-lg font-extrabold" style={{ background: i < routeProgress ? '#dcf5e1' : KID.card, borderColor: KID.ink, color: KID.ink }}>{i + 1}. {room.landmarks[idx].emoji} {room.landmarks[idx].label}</span>
            ))}
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
            const modeIcon = room.mode === 'path' ? '🧭' : room.mode === 'route' ? '🚩' : '🗺️';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            const modeLabel = room.mode === 'path' ? 'Weg finden' : room.mode === 'route' ? 'Route planen' : 'suchen';
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Ziele · {modeLabel}</p>
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
      Meoluna.complete({ engine: 'map', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<MapRoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} streak={streak} onStreak={setStreak} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
