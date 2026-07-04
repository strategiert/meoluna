import type { BuildingEngineSpec } from "./buildingConstructTypes";
import { validateBuildingEngineSpec } from "./buildingConstructValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildBuildingConstructWorldCode(spec: BuildingEngineSpec): string {
  const validation = validateBuildingEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid building-construct spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `

// "Bilderbuch-Tag": helle, freundliche Spielwelt für Kinder ab 5.
// Session-Format v2: Räume enthalten mehrere Runden mit steigender Schwierigkeit.

const SHAPE_NAMES = {
  square: 'Quadrat',
  rectangle: 'Rechteck',
  triangle: 'Dreieck',
  circle: 'Kreis',
  semicircle: 'Halbkreis',
};

const ALL_SHAPES = ['square', 'rectangle', 'triangle', 'circle', 'semicircle'];

function goalChipText(goal) {
  if (goal.type === 'exact') return 'Ziel: ' + goal.width + ' breit × ' + goal.height + ' hoch';
  if (goal.type === 'area') return 'Ziel: ' + goal.area + ' Felder';
  return 'Ziel: ' + goal.perimeter + ' Zaunteile';
}

function AreaScene({ room, round, width, height }) {
  const cols = room.grid.cols;
  const rows = room.grid.rows;
  const isFence = round.goal.type === 'perimeter';
  const emoji = room.tileEmoji || '🌱';
  const cells = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const inside = x < width && y < height;
      const onEdge = inside && (x === 0 || y === 0 || x === width - 1 || y === height - 1);
      cells.push({ key: x + '-' + y, inside, onEdge });
    }
  }
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '19rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>{goalChipText(round.goal)}</span>
          <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>
            {isFence ? 'Zaunteile: ' + (2 * (width + height)) : width + ' breit × ' + height + ' hoch = ' + (width * height)}
          </span>
        </div>
        <div className="grid gap-1 rounded-2xl border-4 p-2" style={{ gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', background: '#f7efdc', borderColor: KID.ink, width: 'min(100%, ' + cols * 3 + 'rem)' }}>
          {cells.map((cell) => (
            <div
              key={cell.key}
              className="flex aspect-square items-center justify-center rounded-md border text-base sm:text-lg"
              style={{
                background: cell.inside ? (isFence && cell.onEdge ? '#c98d4f' : '#8fd16c') : '#fdfaf2',
                borderColor: cell.inside ? KID.ink : '#d8cfb8',
                borderWidth: cell.inside ? 2 : 1,
              }}
            >{cell.inside ? (isFence && cell.onEdge ? '🪵' : emoji) : ''}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function shapeSvg(slot, filled, keyName, onSelect, flashStroke) {
  const stroke = flashStroke || '#27324a';
  const fill = filled ? slot.color : 'rgba(255,255,255,0.45)';
  const dash = filled ? 'none' : '4 3';
  const common = { fill, stroke, strokeWidth: flashStroke ? 3.2 : 1.6, strokeDasharray: dash };
  const interactive = onSelect ? { onClick: onSelect, style: { cursor: 'pointer' }, role: 'button', tabIndex: 0 } : {};
  if (slot.shape === 'triangle') {
    const points = slot.x + ',' + (slot.y + slot.h) + ' ' + (slot.x + slot.w) + ',' + (slot.y + slot.h) + ' ' + (slot.x + slot.w / 2) + ',' + slot.y;
    return <polygon key={keyName} points={points} {...common} {...interactive} />;
  }
  if (slot.shape === 'circle') {
    return <ellipse key={keyName} cx={slot.x + slot.w / 2} cy={slot.y + slot.h / 2} rx={slot.w / 2} ry={slot.h / 2} {...common} {...interactive} />;
  }
  if (slot.shape === 'semicircle') {
    const d = 'M ' + slot.x + ' ' + (slot.y + slot.h) + ' A ' + slot.w / 2 + ' ' + slot.h + ' 0 0 1 ' + (slot.x + slot.w) + ' ' + (slot.y + slot.h) + ' Z';
    return <path key={keyName} d={d} {...common} {...interactive} />;
  }
  return <rect key={keyName} x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx={slot.shape === 'square' ? 1.5 : 1.5} {...common} {...interactive} />;
}

function ShapeChipIcon({ shape }) {
  const slot = { shape, x: 5, y: 5, w: 30, h: 30, color: '#9ecbff' };
  return (
    <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
      {shapeSvg(slot, true, 'icon')}
    </svg>
  );
}

function ComposeScene({ round, filledCount }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '19rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>Baue: {round.figureName}</span>
        <div className="rounded-2xl border-4 p-2" style={{ background: '#ffffff', borderColor: KID.ink }}>
          <svg width="260" height="260" viewBox="0 0 100 100" className="sm:h-[300px] sm:w-[300px]">
            {round.slots.map((slot, index) => shapeSvg(slot, index < filledCount, 'slot' + index))}
          </svg>
        </div>
      </div>
    </div>
  );
}

// find-error: dieselbe Figur-Szene, aber vollständig gebaut und jeder Stein
// antippbar - genau einer weicht laut Spec vom Bauplan ab.
function FindErrorScene({ round, onTapSlot, wrongIndex, solvedIndex }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '19rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>Finde den falschen Stein: {round.figureName}</span>
        <div className="rounded-2xl border-4 p-2" style={{ background: '#ffffff', borderColor: KID.ink }}>
          <svg width="260" height="260" viewBox="0 0 100 100" className="sm:h-[300px] sm:w-[300px]">
            {round.slots.map((slot, index) => shapeSvg(
              slot,
              true,
              'fe' + index,
              () => onTapSlot(index),
              index === wrongIndex ? '#e5484d' : index === solvedIndex ? '#3c8f4b' : null
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function AreaEquation({ round, width, height, solved }) {
  const isFence = round.goal.type === 'perimeter';
  const text = solved
    ? (isFence ? '2 × (' + width + ' + ' + height + ') = ' + (2 * (width + height)) + ' Zaunteile' : width + ' × ' + height + ' = ' + (width * height) + ' Felder')
    : (isFence ? '2 × (? + ?) = ?' : '? × ? = ?');
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Bauen wird</p>
      <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>{text}</span>
    </div>
  );
}

function ComposeEquation({ round, solved }) {
  const counts = {};
  for (const slot of round.slots) counts[slot.shape] = (counts[slot.shape] || 0) + 1;
  const parts = Object.entries(counts).map(([shape, count]) => count + ' × ' + SHAPE_NAMES[shape]);
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Bauen wird</p>
      <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
      {solved ? round.figureName + ' = ' + parts.join(' + ') : round.figureName + ' = ?'}
      </span>
    </div>
  );
}

function AreaRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setWidth(2);
    setHeight(2);
    setSolved(false);
    setMisses(0);
    setBubble(round.objective || room.objective);
  }, [roundIndex]);

  function adjustWidth(delta) {
    if (solved) return;
    Sound.thunk();
    setWidth((value) => Math.max(1, Math.min(room.grid.cols, value + delta)));
  }

  function adjustHeight(delta) {
    if (solved) return;
    Sound.thunk();
    setHeight((value) => Math.max(1, Math.min(room.grid.rows, value + delta)));
  }

  function checkBuild() {
    if (solved) return;
    const goal = round.goal;
    let win = false;
    let feedbackText = null;
    if (goal.type === 'exact') {
      win = width === goal.width && height === goal.height;
      if (!win) {
        feedbackText = width * height === goal.width * goal.height ? room.feedback.wrongShape
          : width * height < goal.width * goal.height ? room.feedback.tooSmall : room.feedback.tooBig;
      }
    } else if (goal.type === 'area') {
      win = width * height === goal.area;
      if (!win) feedbackText = width * height < goal.area ? room.feedback.tooSmall : room.feedback.tooBig;
    } else {
      const perimeter = 2 * (width + height);
      win = perimeter === goal.perimeter;
      if (!win) feedbackText = perimeter < goal.perimeter ? room.feedback.tooSmall : room.feedback.tooBig;
    }
    if (win) {
      setSolved(true);
      onRoundWin(misses);
      return;
    }
    const m = misses + 1;
    setMisses(m);
    setMood('sad');
    Sound.miss();
    setBubble(feedbackText);
    setTimeout(() => setMood('happy'), 700);
  }

  return (
    <>
      <AreaScene room={room} round={round} width={width} height={height} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigButton onClick={() => adjustWidth(-1)} color={KID.blue} colorDark={KID.blueDark} disabled={solved}>⬅️ Schmaler</BigButton>
        <BigButton onClick={() => adjustWidth(1)} color={KID.blue} colorDark={KID.blueDark} disabled={solved}>Breiter ➡️</BigButton>
        <BigButton onClick={() => adjustHeight(-1)} color={KID.coral} colorDark={KID.coralDark} disabled={solved}>⬇️ Niedriger</BigButton>
        <BigButton onClick={() => adjustHeight(1)} color={KID.coral} colorDark={KID.coralDark} disabled={solved}>Höher ⬆️</BigButton>
      </div>
      <BigButton onClick={checkBuild} color={KID.green} colorDark={KID.greenDark} disabled={solved}>🔨 Bauen!</BigButton>
      <AreaEquation round={round} width={width} height={height} solved={solved} />
    </>
  );
}

// Deterministischer Bau-Pool: seeded statt Math.random, replay-sicher pro Runde.
function buildShapePool(round, seedKey) {
  const pool = round.slots.map((slot, index) => ({ poolId: 's' + index, shape: slot.shape }));
  const unusedShapes = ALL_SHAPES.filter((shape) => !round.slots.some((slot) => slot.shape === shape));
  unusedShapes.slice(0, 2).forEach((shape, index) => pool.push({ poolId: 'd' + index, shape }));
  return seededShuffle(makeRng(KID_SEED + ':compose:' + seedKey), pool);
}

function ComposeRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const seedKey = room.roomId + ':' + roundIndex;
  const [filledCount, setFilledCount] = useState(0);
  const [usedPoolIds, setUsedPoolIds] = useState([]);
  const [pool, setPool] = useState(() => buildShapePool(round, seedKey));
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setFilledCount(0);
    setUsedPoolIds([]);
    setPool(buildShapePool(room.rounds[roundIndex], room.roomId + ':' + roundIndex));
    setSolved(false);
    setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Welches Teil kommt als Nächstes?');
  }, [roundIndex]);

  function placeShape(chip) {
    if (solved) return;
    Sound.thunk();
    const nextSlot = round.slots[filledCount];
    if (!nextSlot) return;
    if (chip.shape === nextSlot.shape) {
      const nextCount = filledCount + 1;
      setFilledCount(nextCount);
      setUsedPoolIds((list) => [...list, chip.poolId]);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 500);
      if (nextCount >= round.slots.length) {
        setSolved(true);
        onRoundWin(misses);
      } else {
        setBubble('Super! Welches Teil kommt jetzt?');
      }
    } else {
      const m = misses + 1;
      setMisses(m);
      setMood('sad');
      Sound.miss();
      setBubble(room.feedback.wrongShape);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <ComposeScene round={round} filledCount={filledCount} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pool.map((chip) => (
          <button
            key={chip.poolId}
            type="button"
            disabled={usedPoolIds.includes(chip.poolId) || solved}
            onClick={() => placeShape(chip)}
            className="kid-font flex min-h-[72px] flex-col items-center justify-center rounded-2xl border-4 px-4 py-2 text-base font-extrabold transition-all active:translate-y-1 disabled:opacity-30"
            style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}
          >
            <ShapeChipIcon shape={chip.shape} />
            {SHAPE_NAMES[chip.shape]}
          </button>
        ))}
      </div>
      <ComposeEquation round={round} solved={solved} />
    </>
  );
}

// find-error: Spec liefert die fertige (fehlerhafte) Figur explizit -
// nichts wird geraten, das Kind tippt den Stein an, der nicht zum Bauplan passt.
function FindErrorRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [wrongIndex, setWrongIndex] = useState(null);
  const [misses, setMisses] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setWrongIndex(null);
    setMisses(0);
    setSolved(false);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Welcher Stein passt nicht zum Bauplan?');
  }, [roundIndex]);

  function tapSlot(index) {
    if (solved) return;
    if (index === round.errorIndex) {
      setSolved(true);
      setMood('cheer');
      onRoundWin(misses);
    } else {
      const m = misses + 1;
      setMisses(m);
      setWrongIndex(index);
      setMood('sad');
      Sound.miss();
      setBubble(room.feedback.wrongShape);
      setTimeout(() => { setMood('happy'); setWrongIndex(null); }, 700);
    }
  }

  return (
    <>
      <FindErrorScene round={round} onTapSlot={tapSlot} wrongIndex={wrongIndex} solvedIndex={solved ? round.errorIndex : null} />
      <p className="kid-font text-center text-base font-bold" style={{ color: '#5d6b85' }}>Tippe auf den Stein, der nicht zum Bauplan passt.</p>
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
    Meoluna.reportScore(10, { action: 'building-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: misses === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'building-room-complete', roomId: room.roomId, mode: room.mode });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit für die nächste Aufgabe?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function nextRound() {
    setPhase('play');
    setRoundIndex(roundIndex + 1);
  }

  const RoomComponent = room.mode === 'area' ? AreaRoom : room.mode === 'compose' ? ComposeRoom : FindErrorRoom;

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

        {phase !== 'done' && (<RoomComponent key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />)}

        {phase === 'roundDone' && (
          <BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Nächste Aufgabe!</BigButton>
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
            const meta = SPEC.world.rooms.find((entry) => entry.id === room.roomId) || {};
            const done = completedRooms.includes(room.roomId);
            const locked = index > 0 && !completedRooms.includes(SPEC.rooms[index - 1].roomId);
            const isLast = index === SPEC.rooms.length - 1;
            const modeIcon = room.mode === 'area' ? '🧱' : room.mode === 'compose' ? '🧩' : '🔍';
            return (
              <button
                key={room.roomId}
                type="button"
                disabled={locked}
                onClick={() => onStart(index)}
                className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50"
                style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon}
                </div>
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
      Meoluna.complete({ engine: 'building-construct', world: SPEC.world.worldName });
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
        streak={streak}
        onStreak={setStreak}
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
