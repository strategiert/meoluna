import type { MovementEngineSpec } from "./movementSpaceTypes";
import { validateMovementEngineSpec } from "./movementSpaceValidator";

export function buildMovementSpaceWorldCode(spec: MovementEngineSpec): string {
  const validation = validateMovementEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid movement-space spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};

// "Bilderbuch-Tag": helle, freundliche Spielwelt für Kinder ab 5.
const KID = {
  skyTop: '#79c7f5',
  skyBottom: '#e9f8ff',
  hillBack: '#a8dd8a',
  hillFront: '#7ec463',
  path: '#fbe3b2',
  pathEdge: '#d9b178',
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

function valueOf(position) {
  return typeof position === 'number' ? position : position.x;
}

function addMoves(start, moves) {
  return moves.reduce((sum, move) => sum + valueOf(move.value), valueOf(start));
}

function stepStartPosition(room, stepIndex) {
  return addMoves(room.startPosition, room.moves.slice(0, stepIndex));
}

function stepTargetPosition(room, stepIndex) {
  return addMoves(room.startPosition, room.moves.slice(0, stepIndex + 1));
}

function axisPercent(value, cs) {
  const pct = ((value - cs.min) / (cs.max - cs.min)) * 100;
  return Math.max(6, Math.min(94, pct));
}

function niceTicks(cs) {
  const span = cs.max - cs.min;
  const step = Math.max(1, Math.ceil(span / 8 / 5) * 5);
  let ticks = [];
  for (let value = Math.ceil(cs.min / step) * step; value <= cs.max; value += step) ticks.push(value);
  if (cs.min <= 0 && cs.max >= 0 && !ticks.includes(0)) {
    ticks = ticks.filter((tick) => Math.abs(axisPercent(tick, cs) - axisPercent(0, cs)) > 4);
    ticks.push(0);
  }
  return ticks.sort((a, b) => a - b);
}

function negativeWord() {
  return SPEC.coordinateSystem.negativeDirectionLabel || 'Nach Westen';
}

function positiveWord() {
  return SPEC.coordinateSystem.positiveDirectionLabel || 'Nach Osten';
}

function equationText(room, uptoStep) {
  const moves = room.moves.slice(0, uptoStep + 1).map((move) => valueOf(move.value));
  const start = valueOf(room.startPosition);
  let left = String(start);
  for (const value of moves) left += value < 0 ? ' + (' + value + ')' : ' + ' + value;
  return left + ' = ' + addMoves(room.startPosition, room.moves.slice(0, uptoStep + 1));
}

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
      <motion.div
        className="absolute right-8 top-6 h-20 w-20 rounded-full sm:h-28 sm:w-28"
        style={{ background: KID.sun, boxShadow: '0 0 60px 18px rgba(255,216,77,0.55)' }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div className="absolute left-[8%] top-10 h-10 w-32 rounded-full bg-white/90" animate={{ x: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity }} />
      <motion.div className="absolute left-[40%] top-20 h-8 w-24 rounded-full bg-white/80" animate={{ x: [0, -24, 0] }} transition={{ duration: 22, repeat: Infinity }} />
      <motion.div className="absolute left-[70%] top-8 h-9 w-28 rounded-full bg-white/85" animate={{ x: [0, 20, 0] }} transition={{ duration: 26, repeat: Infinity }} />
    </div>
  );
}

function Luno({ mood, hopping, dir }) {
  const eyeShift = dir < 0 ? -2.4 : dir > 0 ? 2.4 : 0;
  return (
    <motion.div
      animate={hopping ? { y: [0, -26, 0], scaleY: [1, 1.08, 0.92], scaleX: [1, 0.94, 1.06] } : mood === 'sad' ? { x: [0, -7, 7, -5, 5, 0] } : mood === 'cheer' ? { y: [0, -18, 0] } : { y: [0, -3, 0] }}
      transition={hopping ? { duration: 0.34, repeat: Infinity } : mood === 'cheer' ? { duration: 0.5, repeat: 2 } : mood === 'sad' ? { duration: 0.5 } : { duration: 2.4, repeat: Infinity }}
    >
      <svg width="74" height="78" viewBox="0 0 74 78" aria-hidden="true">
        <ellipse cx="37" cy="74" rx="20" ry="4" fill="rgba(39,50,74,0.18)" />
        <ellipse cx="26" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <ellipse cx="48" cy="68" rx="7" ry="6" fill="#f3b34c" />
        <circle cx="37" cy="38" r="30" fill="#fff6e0" stroke="#27324a" strokeWidth="3.5" />
        <path d="M 18 24 Q 37 12 56 24" fill="none" stroke="#27324a" strokeWidth="3.5" strokeLinecap="round" opacity="0.25" />
        <circle cx={27 + eyeShift} cy="36" r="5.6" fill="#27324a" />
        <circle cx={47 + eyeShift} cy="36" r="5.6" fill="#27324a" />
        <circle cx={29 + eyeShift} cy="34" r="1.8" fill="#ffffff" />
        <circle cx={49 + eyeShift} cy="34" r="1.8" fill="#ffffff" />
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
      className="kid-font min-h-[64px] rounded-3xl px-6 py-3 text-xl font-extrabold text-white transition-all active:translate-y-1 disabled:opacity-40 sm:text-2xl"
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

function PathScene({ room, stepIndex, phase, displayPos, hopping, hopCount, landingOptions, selectedPosition, onPickLanding, mood }) {
  const cs = SPEC.coordinateSystem;
  const horizontal = cs.dimensions !== '1d-vertical';
  const ticks = niceTicks(cs);
  const startValue = valueOf(room.startPosition);
  const stepFrom = stepStartPosition(room, stepIndex);
  const moveValue = room.moves[stepIndex] ? valueOf(room.moves[stepIndex].value) : 0;
  const dir = Math.sign(moveValue);

  function handleTrackClick(event) {
    if (phase !== 'land' || landingOptions.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = horizontal
      ? (event.clientX - rect.left) / rect.width
      : 1 - (event.clientY - rect.top) / rect.height;
    const clicked = cs.min + ratio * (cs.max - cs.min);
    let best = landingOptions[0];
    for (const option of landingOptions) {
      if (Math.abs(option - clicked) < Math.abs(best - clicked)) best = option;
    }
    onPickLanding(best);
  }

  const charStyle = horizontal
    ? { left: axisPercent(displayPos, cs) + '%', bottom: '34%' }
    : { left: '50%', bottom: axisPercent(displayPos, cs) + '%' };

  return (
    <div
      onClick={handleTrackClick}
      className="relative w-full overflow-hidden rounded-[2rem] border-4"
      style={{ height: 'min(46vh, 24rem)', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}
    >
      <Sky />
      <div className="pointer-events-none absolute -left-10 bottom-[16%] h-40 w-[60%] rounded-[50%]" style={{ background: KID.hillBack }} />
      <div className="pointer-events-none absolute -right-16 bottom-[12%] h-44 w-[70%] rounded-[50%]" style={{ background: KID.hillFront }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]" style={{ background: KID.hillFront }} />

      {horizontal && (
        <div className="absolute inset-x-[4%] bottom-[22%] h-12 rounded-full border-4" style={{ background: KID.path, borderColor: KID.pathEdge }}>
          {ticks.map((tick) => (
            <div key={tick} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: axisPercent(tick, cs) + '%' }}>
              <div className={'kid-font rounded-xl border-2 px-2 py-0.5 text-sm font-extrabold sm:text-base ' + (tick === 0 ? 'scale-110' : '')} style={{ background: tick === 0 ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink }}>{tick}</div>
            </div>
          ))}
          {phase !== 'land' && (
            <div className="kid-font absolute -bottom-9 left-2 rounded-full px-3 py-0.5 text-sm font-extrabold text-white" style={{ background: KID.blue }}>← {negativeWord()}</div>
          )}
          {phase !== 'land' && (
            <div className="kid-font absolute -bottom-9 right-2 rounded-full px-3 py-0.5 text-sm font-extrabold text-white" style={{ background: KID.coral }}>{positiveWord()} →</div>
          )}
        </div>
      )}

      {!horizontal && (
        <div className="absolute bottom-[16%] left-1/2 top-[8%] w-12 -translate-x-1/2 rounded-full border-4" style={{ background: KID.path, borderColor: KID.pathEdge }}>
          {ticks.map((tick) => (
            <div key={tick} className="absolute left-1/2 -translate-x-1/2 translate-y-1/2" style={{ bottom: axisPercent(tick, cs) + '%' }}>
              <div className="kid-font rounded-xl border-2 px-2 py-0.5 text-sm font-extrabold" style={{ background: tick === 0 ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink }}>{tick}</div>
            </div>
          ))}
        </div>
      )}

      <div className={'pointer-events-none absolute ' + (horizontal ? 'inset-y-0 left-[4%] right-[4%]' : 'inset-x-0 top-[8%] bottom-[16%]')}>
        {horizontal && (
          <div className="absolute bottom-[22%] h-12" style={{ left: Math.min(axisPercent(startValue, cs), axisPercent(displayPos, cs)) + '%', width: Math.max(0.5, Math.abs(axisPercent(displayPos, cs) - axisPercent(startValue, cs))) + '%' }}>
            <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full" style={{ background: 'rgba(63,155,240,0.5)' }} />
          </div>
        )}

        <AnimatePresence>
          {phase === 'land' && landingOptions.map((option) => (
            <motion.button
              key={option}
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={(event) => { event.stopPropagation(); onPickLanding(option); }}
              className="kid-font pointer-events-auto absolute z-30 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 text-xl font-extrabold transition-transform active:scale-90 sm:h-20 sm:w-20 sm:text-2xl"
              style={horizontal
                ? { left: Math.max(7, Math.min(93, axisPercent(option, cs))) + '%', bottom: '3%', background: selectedPosition === option ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.pathEdge }
                : { left: '68%', bottom: Math.max(6, Math.min(92, axisPercent(option, cs))) + '%', background: selectedPosition === option ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.pathEdge }}
            >{option}</motion.button>
          ))}
        </AnimatePresence>

        <motion.div className="absolute z-20 -translate-x-1/2" animate={charStyle} transition={{ duration: hopping ? Math.min(2.4, 0.8 + Math.abs(moveValue) / 40) : 0.4, ease: 'easeInOut' }}>
          <Luno mood={mood} hopping={hopping} dir={hopping ? dir : 0} />
          <div className="kid-font mx-auto -mt-1 w-fit rounded-full border-2 px-3 py-0.5 text-base font-extrabold" style={{ background: phase === 'land' ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink }}>
            {hopping ? hopCount : phase === 'land' ? '?' : displayPos}
          </div>
        </motion.div>
      </div>

      {hopping && (
        <div className="kid-font absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-2xl border-4 px-5 py-2 text-2xl font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>
          👣 {hopCount} {cs.unitLabel}
        </div>
      )}

      {phase === 'land' && (
        <div className="kid-font pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-2xl border-4 px-5 py-2 text-xl font-extrabold sm:text-2xl" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>
          Wo bist du gelandet?
        </div>
      )}
    </div>
  );
}

function EquationCards({ room, revealedSteps }) {
  const startValue = valueOf(room.startPosition);
  const chips = [{ text: String(startValue), color: KID.card }];
  room.moves.forEach((move, index) => {
    const value = valueOf(move.value);
    chips.push({ text: value < 0 ? '+ (' + value + ')' : '+ ' + value, color: index < revealedSteps ? (value < 0 ? '#dceeff' : '#ffe8df') : '#eef1f6', dim: index >= revealedSteps });
  });
  const done = revealedSteps >= room.moves.length;
  chips.push({ text: done ? '= ' + valueOf(room.targetPosition) : '= ?', color: done ? '#dcf5e1' : '#eef1f6', dim: !done });
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus der Bewegung wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {chips.map((chip, index) => (
          <span key={index} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-xl font-extrabold sm:text-2xl" style={{ background: chip.color, borderColor: chip.dim ? '#c6cdd9' : KID.ink, color: chip.dim ? '#9aa3b5' : KID.ink }}>{chip.text}</span>
        ))}
      </div>
    </div>
  );
}

function buildLandingOptions(room, stepIndex) {
  const cs = SPEC.coordinateSystem;
  const from = stepStartPosition(room, stepIndex);
  const target = stepTargetPosition(room, stepIndex);
  const value = target - from;
  const clamp = (v) => Math.max(cs.min, Math.min(cs.max, v));
  const wrongDirection = clamp(from - value);
  let offset = Math.max(2, Math.round(Math.abs(value) * 0.3));
  let nearMiss = clamp(target + (value < 0 ? -offset : offset));
  const options = [target];
  if (!options.includes(wrongDirection)) options.push(wrongDirection);
  if (!options.includes(nearMiss)) options.push(nearMiss);
  while (options.length < 3) {
    offset += 3;
    const extra = clamp(target + offset);
    if (!options.includes(extra)) options.push(extra);
    else if (!options.includes(clamp(target - offset))) options.push(clamp(target - offset));
  }
  return { options: options.slice(0, 3).sort((a, b) => a - b), wrongDirection };
}

function RoomScene({ room, roomMeta, stars, onBack, onComplete, onStar }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState('direction');
  const [displayPos, setDisplayPos] = useState(valueOf(room.startPosition));
  const [hopping, setHopping] = useState(false);
  const [hopCount, setHopCount] = useState(0);
  const [mood, setMood] = useState('happy');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [bubble, setBubble] = useState('');
  const [landing, setLanding] = useState({ options: [], wrongDirection: null });
  const hopTimer = useRef(null);

  const currentMove = room.moves[stepIndex];
  const moveValue = currentMove ? valueOf(currentMove.value) : 0;
  const cs = SPEC.coordinateSystem;

  useEffect(() => {
    if (currentMove) setBubble('Dein Auftrag: ' + currentMove.label + '! Wohin geht es?');
    return () => { if (hopTimer.current) clearInterval(hopTimer.current); };
  }, [stepIndex]);

  function chooseDirection(dir) {
    if (phase !== 'direction') return;
    if (dir === Math.sign(moveValue)) {
      setMood('happy');
      setPhase('hop');
      setBubble('Super! Drücke auf Hüpfen!');
    } else {
      setMood('sad');
      setBubble(stepIndex > 0 ? room.feedback.signConfusion : room.feedback.wrongDirection);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function startHop() {
    if (phase !== 'hop' || hopping) return;
    const from = stepStartPosition(room, stepIndex);
    const target = stepTargetPosition(room, stepIndex);
    const total = Math.abs(target - from);
    const duration = Math.min(2400, 800 + total * 25);
    setHopping(true);
    setHopCount(0);
    setDisplayPos(target);
    const startedAt = Date.now();
    hopTimer.current = setInterval(() => {
      const ratio = Math.min(1, (Date.now() - startedAt) / duration);
      setHopCount(Math.round(ratio * total));
      if (ratio >= 1) {
        clearInterval(hopTimer.current);
        setHopping(false);
        setPhase('land');
        setLanding(buildLandingOptions(room, stepIndex));
        setBubble('Wo bist du gelandet? Tippe auf die richtige Zahl!');
      }
    }, 40);
  }

  function commitSelectedPosition(option) {
    const target = stepTargetPosition(room, stepIndex);
    setSelectedPosition(option);
    if (option === target) {
      setMood('cheer');
      Meoluna.reportScore(10, { action: 'movement-step-correct', roomId: room.roomId, stepIndex });
      onStar();
      if (stepIndex + 1 >= room.moves.length) {
        setPhase('done');
        setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
        Meoluna.reportScore(25, { action: 'movement-room-complete', roomId: room.roomId });
        Meoluna.completeModule(room.roomId, 25);
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
      } else {
        setPhase('direction');
        setStepIndex(stepIndex + 1);
        setSelectedPosition(null);
      }
    } else {
      setMood('sad');
      setBubble(option === landing.wrongDirection
        ? (stepIndex > 0 ? room.feedback.signConfusion : room.feedback.wrongDirection)
        : room.feedback.wrongDistance);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function handlePickLanding(option) {
    if (phase !== 'land') return;
    commitSelectedPosition(option);
  }

  return (
    <div className="kid-font min-h-screen p-3 sm:p-6" style={{ background: 'linear-gradient(180deg, ' + KID.skyBottom + ', #f8fdf2)' }}>
      <KidStyles />
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-0.5" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.pathEdge }}>← Karte</button>
          <div className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{roomMeta.title || room.roomId}</div>
          <StarRow stars={stars} />
        </div>

        <SpeechBubble text={bubble || room.objective} />

        <PathScene
          room={room}
          stepIndex={stepIndex}
          phase={phase}
          displayPos={displayPos}
          hopping={hopping}
          hopCount={hopCount}
          landingOptions={landing.options}
          selectedPosition={selectedPosition}
          onPickLanding={handlePickLanding}
          mood={mood}
        />

        {phase === 'direction' && currentMove && (
          <div className="grid grid-cols-2 gap-4">
            <BigButton onClick={() => chooseDirection(-1)} color={KID.blue} colorDark={KID.blueDark}>⬅️ {negativeWord()}</BigButton>
            <BigButton onClick={() => chooseDirection(1)} color={KID.coral} colorDark={KID.coralDark}>{positiveWord()} ➡️</BigButton>
          </div>
        )}

        {phase === 'hop' && (
          <BigButton onClick={startHop} color={KID.green} colorDark={KID.greenDark}>🐾 Hüpfen!</BigButton>
        )}

        {phase === 'done' && (
          <BigButton onClick={onComplete} color={KID.green} colorDark={KID.greenDark}>🎉 Weiter!</BigButton>
        )}

        <EquationCards room={room} revealedSteps={phase === 'done' ? room.moves.length : stepIndex} />
      </div>
    </div>
  );
}

function Hub({ completedRooms, stars, onStart }) {
  return (
    <div className="kid-font min-h-screen p-4 sm:p-8" style={{ background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 55%, #f0fbe8)' }}>
      <KidStyles />
      <div className="relative mx-auto max-w-4xl">
        <Sky />
        <div className="relative rounded-[2rem] border-4 p-6 text-center shadow-xl" style={{ background: KID.card, borderColor: KID.ink }}>
          <div className="mx-auto -mt-14 w-fit"><Luno mood="happy" hopping={false} dir={0} /></div>
          <h1 className="text-3xl font-extrabold sm:text-5xl" style={{ color: KID.ink }}>{SPEC.world.worldName}</h1>
          <p className="mx-auto mt-2 max-w-xl text-lg font-bold" style={{ color: '#5d6b85' }}>{SPEC.concept.embodiedMetaphor}</p>
          <div className="mx-auto mt-3 w-fit"><StarRow stars={stars} /></div>
        </div>
        <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
          {SPEC.rooms.map((room, index) => {
            const meta = SPEC.world.rooms.find((entry) => entry.id === room.roomId) || {};
            const done = completedRooms.includes(room.roomId);
            const locked = index > 0 && !completedRooms.includes(SPEC.rooms[index - 1].roomId);
            return (
              <button
                key={room.roomId}
                type="button"
                disabled={locked}
                onClick={() => onStart(index)}
                className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50"
                style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.pathEdge }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {done ? '⭐' : locked ? '🔒' : index + 1}
                </div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
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
      Meoluna.complete({ engine: 'movement-space', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((entry) => entry.id === room.roomId) || {};
    return (
      <RoomScene
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
