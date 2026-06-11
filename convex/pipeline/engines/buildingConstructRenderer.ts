import type { BuildingEngineSpec } from "./buildingConstructTypes";
import { validateBuildingEngineSpec } from "./buildingConstructValidator";

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

// "Bilderbuch-Tag": helle, freundliche Spielwelt für Kinder ab 5.
// Session-Format v2: Räume enthalten mehrere Runden mit steigender Schwierigkeit.
const KID = {
  skyTop: '#79c7f5',
  skyBottom: '#e9f8ff',
  hillBack: '#a8dd8a',
  hillFront: '#7ec463',
  wood: '#d9a05e',
  woodDark: '#a8743c',
  ink: '#27324a',
  coral: '#ff7a59',
  coralDark: '#c95a3f',
  blue: '#3f9bf0',
  blueDark: '#2c79c2',
  green: '#54b865',
  greenDark: '#3c8f4b',
  sun: '#ffd84d',
  card: '#ffffff',
};

const SHAPE_NAMES = {
  square: 'Quadrat',
  rectangle: 'Rechteck',
  triangle: 'Dreieck',
  circle: 'Kreis',
  semicircle: 'Halbkreis',
};

const ALL_SHAPES = ['square', 'rectangle', 'triangle', 'circle', 'semicircle'];

function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  } catch (error) {}
}

function KidStyles() {
  return (
    <style>{"@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap'); .kid-font{font-family:'Baloo 2','Comic Sans MS','Segoe UI',sans-serif;}"}</style>
  );
}

function Sky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute right-8 top-5 h-16 w-16 rounded-full sm:h-24 sm:w-24" style={{ background: KID.sun, boxShadow: '0 0 50px 14px rgba(255,216,77,0.55)' }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="absolute left-[10%] top-8 h-9 w-28 rounded-full bg-white/90" animate={{ x: [0, 26, 0] }} transition={{ duration: 18, repeat: Infinity }} />
      <motion.div className="absolute left-[55%] top-14 h-7 w-20 rounded-full bg-white/80" animate={{ x: [0, -20, 0] }} transition={{ duration: 24, repeat: Infinity }} />
      <div className="absolute -left-10 bottom-[6%] h-32 w-[60%] rounded-[50%]" style={{ background: KID.hillBack }} />
      <div className="absolute -right-16 bottom-[2%] h-36 w-[70%] rounded-[50%]" style={{ background: KID.hillFront }} />
      <div className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: KID.hillFront }} />
    </div>
  );
}

function Luno({ mood }) {
  return (
    <motion.div
      animate={mood === 'sad' ? { x: [0, -7, 7, -5, 5, 0] } : mood === 'cheer' ? { y: [0, -16, 0] } : { y: [0, -3, 0] }}
      transition={mood === 'cheer' ? { duration: 0.5, repeat: 2 } : mood === 'sad' ? { duration: 0.5 } : { duration: 2.4, repeat: Infinity }}
    >
      <svg width="68" height="72" viewBox="0 0 74 78" aria-hidden="true">
        <ellipse cx="37" cy="74" rx="20" ry="4" fill="rgba(39,50,74,0.18)" />
        <ellipse cx="26" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <ellipse cx="48" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <circle cx="37" cy="38" r="30" fill="#fff6e0" stroke="#27324a" strokeWidth="3.5" />
        <circle cx="27" cy="36" r="5.6" fill="#27324a" />
        <circle cx="47" cy="36" r="5.6" fill="#27324a" />
        <circle cx="29" cy="34" r="1.8" fill="#ffffff" />
        <circle cx="49" cy="34" r="1.8" fill="#ffffff" />
        <circle cx="19" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" />
        <circle cx="55" cy="46" r="4.6" fill="#ffb3a0" opacity="0.85" />
        {mood === 'sad'
          ? <path d="M 30 54 Q 37 49 44 54" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" />
          : <path d="M 29 51 Q 37 59 45 51" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" />}
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
        <button
          type="button"
          onClick={() => speak(text)}
          aria-label="Vorlesen"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition-transform active:scale-90"
          style={{ background: KID.blue, boxShadow: '0 4px 0 ' + KID.blueDark }}
        >🔊</button>
      </div>
      <div className="absolute -bottom-3 left-10 h-6 w-6 rotate-45 border-b-4 border-r-4" style={{ background: KID.card, borderColor: KID.ink }} />
    </div>
  );
}

function BigButton({ onClick, color, colorDark, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="kid-font min-h-[64px] rounded-3xl px-5 py-3 text-xl font-extrabold text-white transition-all active:translate-y-1 disabled:opacity-40 sm:text-2xl"
      style={{ background: color, boxShadow: '0 6px 0 ' + colorDark, textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
    >{children}</button>
  );
}

function StarRow({ stars }) {
  return (
    <div className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xl" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>
      <span>⭐</span>
      <span className="kid-font font-extrabold">{stars}</span>
    </div>
  );
}

function RoundDots({ total, current }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5" style={{ background: KID.card, borderColor: KID.ink }}>
      {Array.from({ length: total }).map((entry, index) => (
        <div key={index} className="h-3.5 w-3.5 rounded-full border-2" style={{ background: index < current ? KID.green : index === current ? KID.sun : '#e3e8f0', borderColor: KID.ink }} />
      ))}
    </div>
  );
}

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

function shapeSvg(slot, filled, keyName) {
  const stroke = '#27324a';
  const fill = filled ? slot.color : 'rgba(255,255,255,0.45)';
  const dash = filled ? 'none' : '4 3';
  const common = { fill, stroke, strokeWidth: 1.6, strokeDasharray: dash };
  if (slot.shape === 'triangle') {
    const points = slot.x + ',' + (slot.y + slot.h) + ' ' + (slot.x + slot.w) + ',' + (slot.y + slot.h) + ' ' + (slot.x + slot.w / 2) + ',' + slot.y;
    return <polygon key={keyName} points={points} {...common} />;
  }
  if (slot.shape === 'circle') {
    return <ellipse key={keyName} cx={slot.x + slot.w / 2} cy={slot.y + slot.h / 2} rx={slot.w / 2} ry={slot.h / 2} {...common} />;
  }
  if (slot.shape === 'semicircle') {
    const d = 'M ' + slot.x + ' ' + (slot.y + slot.h) + ' A ' + slot.w / 2 + ' ' + slot.h + ' 0 0 1 ' + (slot.x + slot.w) + ' ' + (slot.y + slot.h) + ' Z';
    return <path key={keyName} d={d} {...common} />;
  }
  return <rect key={keyName} x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx={slot.shape === 'square' ? 1.5 : 1.5} {...common} />;
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

  useEffect(() => {
    setWidth(2);
    setHeight(2);
    setSolved(false);
    setBubble(round.objective || room.objective);
  }, [roundIndex]);

  function adjustWidth(delta) {
    if (solved) return;
    setWidth((value) => Math.max(1, Math.min(room.grid.cols, value + delta)));
  }

  function adjustHeight(delta) {
    if (solved) return;
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
      onRoundWin();
      return;
    }
    setMood('sad');
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

function buildShapePool(round) {
  const pool = round.slots.map((slot, index) => ({ poolId: 's' + index, shape: slot.shape }));
  const unusedShapes = ALL_SHAPES.filter((shape) => !round.slots.some((slot) => slot.shape === shape));
  unusedShapes.slice(0, 2).forEach((shape, index) => pool.push({ poolId: 'd' + index, shape }));
  return pool.sort(() => Math.random() - 0.5);
}

function ComposeRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [filledCount, setFilledCount] = useState(0);
  const [usedPoolIds, setUsedPoolIds] = useState([]);
  const [pool, setPool] = useState(() => buildShapePool(round));
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setFilledCount(0);
    setUsedPoolIds([]);
    setPool(buildShapePool(room.rounds[roundIndex]));
    setSolved(false);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Welches Teil kommt als Nächstes?');
  }, [roundIndex]);

  function placeShape(chip) {
    if (solved) return;
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
        onRoundWin();
      } else {
        setBubble('Super! Welches Teil kommt jetzt?');
      }
    } else {
      setMood('sad');
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
            style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.woodDark }}
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

function RoomScene({ room, roomMeta, stars, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');

  function handleRoundWin() {
    setMood('cheer');
    Meoluna.reportScore(10, { action: 'building-round-correct', roomId: room.roomId, roundIndex });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'building-room-complete', roomId: room.roomId });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit für die nächste Aufgabe?');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function nextRound() {
    setPhase('play');
    setRoundIndex(roundIndex + 1);
  }

  return (
    <div className="kid-font min-h-screen p-3 sm:p-6" style={{ background: 'linear-gradient(180deg, ' + KID.skyBottom + ', #f8fdf2)' }}>
      <KidStyles />
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-0.5" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.woodDark }}>← Karte</button>
        <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{roomMeta.title || room.roomId}</div>
            <Luno mood={mood} />
          </div>
          <div className="flex items-center gap-2">
            <RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} />
            <StarRow stars={stars} />
          </div>
        </div>

        <SpeechBubble text={bubble} />

        {phase !== 'done' && (room.mode === 'area'
          ? <AreaRoom key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />
          : <ComposeRoom key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />)}

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
            return (
              <button
                key={room.roomId}
                type="button"
                disabled={locked}
                onClick={() => onStart(index)}
                className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50"
                style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.woodDark }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : room.mode === 'area' ? '🧱' : '🧩'}
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
