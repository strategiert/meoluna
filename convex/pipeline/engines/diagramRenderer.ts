import type { DiagramEngineSpec } from "./diagramTypes";
import { validateDiagramEngineSpec } from "./diagramValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildDiagramWorldCode(spec: DiagramEngineSpec): string {
  const validation = validateDiagramEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid diagram spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `

function DiagramStage({ room, mode, activeIndex, target, solved, picked, onPickMarker, place }) {
  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border-4" style={{ aspectRatio: '4 / 3', borderColor: KID.ink, background: 'linear-gradient(180deg,#f3fbff,#eaf6df)' }}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25" style={{ fontSize: '11rem' }}>{room.backdrop}</div>
      {room.markers.map((m, i) => {
        if (mode === 'place') {
          if (!place.markerIds.includes(i)) return null;
          const isPlaced = place.placedIndices.includes(i);
          const isWrong = place.wrongIndex === i;
          const clickable = !isPlaced && place.selectedLabel !== null;
          return (
            <button key={i} type="button" disabled={!clickable} onClick={() => clickable && place.onTapMarker(i)} className="kid-font absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] text-lg font-extrabold transition-transform sm:h-12 sm:w-12" style={{ left: m.x + '%', top: m.y + '%', background: isPlaced ? KID.green : isWrong ? '#ffb3a0' : clickable ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink, cursor: clickable ? 'pointer' : 'default', boxShadow: clickable ? '0 0 0 6px rgba(255,216,77,0.45)' : '0 3px 0 ' + KID.bandEdge }}>
              {isPlaced ? '✓' : '?'}
              {isPlaced ? <span className="kid-font absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-xs font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{m.label}</span> : null}
            </button>
          );
        }
        const isActive = mode === 'label' && i === activeIndex;
        const isTarget = solved && target != null && target === i;
        const isPicked = picked === i;
        const clickable = mode === 'find' && !solved;
        return (
          <button key={i} type="button" disabled={!clickable} onClick={() => clickable && onPickMarker(i)} className="kid-font absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] text-lg font-extrabold transition-transform sm:h-12 sm:w-12" style={{ left: m.x + '%', top: m.y + '%', background: isTarget ? KID.green : isActive ? KID.sun : isPicked ? '#ffd4c8' : KID.card, borderColor: KID.ink, color: KID.ink, cursor: clickable ? 'pointer' : 'default', boxShadow: isActive ? '0 0 0 6px rgba(255,216,77,0.45)' : '0 3px 0 ' + KID.bandEdge }}>
            {mode === 'label' || solved || isPicked ? (i + 1) : '?'}
            {(solved && (isTarget || mode === 'label')) ? <span className="kid-font absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-xs font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{m.label}</span> : null}
          </button>
        );
      })}
      {room.caption ? <div className="kid-font absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 px-3 py-1 text-sm font-bold" style={{ background: 'rgba(255,255,255,0.85)', borderColor: KID.ink, color: KID.ink }}>{room.caption}</div> : null}
    </div>
  );
}

// place: deterministische Wort-Leisten-Reihenfolge - seeded statt Math.random.
function shufflePlaceLabels(room, roundIndex, placeMarkerIds) {
  return seededShuffle(makeRng(KID_SEED + ':diagram-place:' + room.roomId + ':' + roundIndex), placeMarkerIds);
}

function DiagramRoomScene({ room, roomMeta, stars, streak, onStreak, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState(null);
  const [placedIndices, setPlacedIndices] = useState([]);
  const [labelPool, setLabelPool] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [wrongMarker, setWrongMarker] = useState(null);

  const round = room.rounds[roundIndex];
  const isLabel = room.mode === 'label';
  const isPlace = room.mode === 'place';
  const activeIndex = isLabel ? round.markerIndex : null;
  const targetIndex = isLabel ? round.markerIndex : isPlace ? null : round.targetIndex;
  const placeMarkerIds = isPlace ? round.placeMarkerIds : [];

  useEffect(() => {
    setSolved(false); setMisses(0); setPicked(null);
    setPlacedIndices([]); setSelectedLabel(null); setWrongMarker(null);
    const r = room.rounds[roundIndex];
    if (isLabel) {
      setBubble((r.objective || room.objective) + ' Welcher Begriff gehoert zur markierten Stelle ' + (r.markerIndex + 1) + '?');
    } else if (isPlace) {
      setLabelPool(shufflePlaceLabels(room, roundIndex, r.placeMarkerIds));
      setBubble((r.objective || room.objective) + ' Tippe erst ein Wort, dann die passende Stelle!');
    } else {
      setLabelPool([]);
      setBubble((r.objective || room.objective) + ' Finde auf dem Schaubild: ' + room.markers[r.targetIndex].label + '.');
    }
  }, [roundIndex]);

  function win() {
    setSolved(true); setMood('cheer'); Sound.success();
    const nextStreak = misses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'diagram-round-correct', roomId: room.roomId, roundIndex, mode: room.mode });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'diagram-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit fuer die naechste Stelle?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }
  function fail() {
    Sound.miss();
    const mm = misses + 1; setMisses(mm); setMood('sad');
    setBubble(mm >= 2 ? room.feedback.tryAgain : room.feedback.wrongSpot);
    setTimeout(() => { setMood('happy'); setPicked(null); }, 700);
  }

  function pickLabel(opt) {
    if (solved) return;
    Sound.thunk();
    if (opt === room.markers[round.markerIndex].label) win(); else fail();
  }
  function pickMarker(i) {
    if (solved) return;
    setPicked(i);
    Sound.thunk();
    if (i === round.targetIndex) win(); else fail();
  }
  function selectLabelChip(idx) {
    if (solved) return;
    Sound.thunk();
    setSelectedLabel((current) => (current === idx ? null : idx));
  }
  function tapPlaceMarker(i) {
    if (solved || selectedLabel === null || placedIndices.includes(i)) return;
    if (selectedLabel === i) {
      Sound.tone(Sound.noteFor(placedIndices.length), 0.14);
      const next = [...placedIndices, i];
      setPlacedIndices(next);
      setSelectedLabel(null);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 400);
      if (next.length >= placeMarkerIds.length) {
        win();
      } else {
        setBubble('Stark! Welches Wort kommt jetzt?');
      }
    } else {
      setWrongMarker(i);
      setSelectedLabel(null);
      fail();
      setTimeout(() => setWrongMarker(null), 700);
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
          <div className="flex items-center gap-2">
            <StreakMeter streak={streak} />
            <RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} />
            <StarRow stars={stars} />
            <SoundToggle />
          </div>
        </div>
        <SpeechBubble text={bubble} />
        <DiagramStage room={room} mode={room.mode} activeIndex={activeIndex} target={targetIndex} solved={solved} picked={picked} onPickMarker={pickMarker} place={{ markerIds: placeMarkerIds, placedIndices, selectedLabel, wrongIndex: wrongMarker, onTapMarker: tapPlaceMarker }} />
        {isLabel && phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {round.options.map((opt, i) => (
              <button key={i} type="button" disabled={solved} onClick={() => pickLabel(opt)} className="kid-font min-h-[60px] rounded-2xl border-4 px-5 py-3 text-xl font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>{opt}</button>
            ))}
          </div>
        )}
        {isPlace && phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {labelPool.filter((idx) => !placedIndices.includes(idx)).map((idx) => (
              <button key={idx} type="button" disabled={solved} onClick={() => selectLabelChip(idx)} className="kid-font min-h-[60px] rounded-2xl border-4 px-5 py-3 text-xl font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: selectedLabel === idx ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}>{room.markers[idx].label}</button>
            ))}
          </div>
        )}
        <div className="rounded-3xl border-4 p-4 text-center" style={{ background: KID.card, borderColor: KID.ink }}>
          <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Schaubild wird</p>
          <span className="kid-font mt-1 inline-block rounded-2xl border-2 px-3 py-1.5 text-2xl font-extrabold" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{isPlace ? (solved ? 'Alles am richtigen Platz!' : placedIndices.length + ' von ' + placeMarkerIds.length + ' gesetzt') : (solved ? room.markers[targetIndex].label : '?')}</span>
        </div>
        {phase === 'roundDone' && (<BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechste Stelle!</BigButton>)}
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
            const modeIcon = room.mode === 'find' ? '🔍' : room.mode === 'place' ? '📌' : '🏷️';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            const modeText = room.mode === 'find' ? 'suchen' : room.mode === 'place' ? 'platzieren' : 'benennen';
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Stellen · {modeText}</p>
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
      Meoluna.complete({ engine: 'diagram', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<DiagramRoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} streak={streak} onStreak={setStreak} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
