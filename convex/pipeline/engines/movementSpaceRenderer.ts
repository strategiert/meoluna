import type { MovementEngineSpec } from "./movementSpaceTypes";
import { validateMovementEngineSpec } from "./movementSpaceValidator";
import { KID_KIT_CORE } from "./kidKit";

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
` + KID_KIT_CORE + `
function valueOf(position) {
  return typeof position === 'number' ? position : position.x;
}

function addMoves(start, moves) {
  return moves.reduce((sum, move) => sum + valueOf(move.value), valueOf(start));
}

function stepStartPosition(round, stepIndex) {
  return addMoves(round.startPosition, round.moves.slice(0, stepIndex));
}

function stepTargetPosition(round, stepIndex) {
  return addMoves(round.startPosition, round.moves.slice(0, stepIndex + 1));
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

// Eigener Name (nicht "Sky"), damit dieses Modul-scope-lokale Fragment nicht
// mit dem gleichnamigen Fragment aus KID_KIT_CORE kollidiert - ES-Module
// erlauben keine doppelte Top-Level-Deklaration desselben Bezeichners.
function MovementSky() {
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

// Eigener Name (nicht "Luno"): braucht hopping/dir-Props fuer die Huepf-
// Animation, die KID_KIT_CORE's Luno (nur mood) nicht kennt.
function MovementLuno({ mood, hopping, dir }) {
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

// Antwort-Steine dürfen sich nie überlappen, auch wenn die Werte nah beieinander liegen.
function landingStonePositions(options, cs) {
  const sorted = [...options].sort((a, b) => a - b);
  const lefts = sorted.map((option) => Math.max(7, Math.min(93, axisPercent(option, cs))));
  for (let i = 1; i < lefts.length; i += 1) {
    if (lefts[i] - lefts[i - 1] < 10) lefts[i] = lefts[i - 1] + 10;
  }
  for (let i = lefts.length - 1; i >= 0; i -= 1) {
    if (lefts[i] > 93) lefts[i] = 93;
    if (i > 0 && lefts[i] - lefts[i - 1] < 10) lefts[i - 1] = lefts[i] - 10;
  }
  const map = {};
  sorted.forEach((option, index) => { map[option] = lefts[index]; });
  return map;
}

function PathScene({ round, stepIndex, phase, displayPos, hopping, hopCount, landingOptions, selectedPosition, onPickLanding, mood }) {
  const cs = SPEC.coordinateSystem;
  const horizontal = cs.dimensions !== '1d-vertical';
  const stonePositions = landingStonePositions(landingOptions, cs);
  const ticks = niceTicks(cs);
  const startValue = valueOf(round.startPosition);
  const currentMove = round.moves[stepIndex];
  const moveValue = currentMove ? valueOf(currentMove.value) : 0;
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
      <MovementSky />
      <div className="pointer-events-none absolute -left-10 bottom-[16%] h-40 w-[60%] rounded-[50%]" style={{ background: KID.hillBack }} />
      <div className="pointer-events-none absolute -right-16 bottom-[12%] h-44 w-[70%] rounded-[50%]" style={{ background: KID.hillFront }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]" style={{ background: KID.hillFront }} />

      {horizontal && (
        <div className="absolute inset-x-[4%] bottom-[22%] h-12 rounded-full border-4" style={{ background: KID.band, borderColor: KID.bandEdge }}>
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
        <div className="absolute bottom-[16%] left-1/2 top-[8%] w-12 -translate-x-1/2 rounded-full border-4" style={{ background: KID.band, borderColor: KID.bandEdge }}>
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
                ? { left: stonePositions[option] + '%', bottom: '3%', background: selectedPosition === option ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }
                : { left: '68%', bottom: Math.max(6, Math.min(80, stonePositions[option])) + '%', background: selectedPosition === option ? KID.sun : KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}
            >{option}</motion.button>
          ))}
        </AnimatePresence>

        <motion.div className="absolute z-20 -translate-x-1/2" animate={charStyle} transition={{ duration: hopping ? Math.min(2.4, 0.8 + Math.abs(moveValue || 10) / 40) : 0.4, ease: 'easeInOut' }}>
          <MovementLuno mood={mood} hopping={hopping} dir={hopping ? dir : 0} />
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

function EquationCards({ round, revealedSteps }) {
  const startValue = valueOf(round.startPosition);
  const chips = [{ text: String(startValue), color: KID.card }];
  round.moves.forEach((move, index) => {
    const value = valueOf(move.value);
    chips.push({ text: value < 0 ? '+ (' + value + ')' : '+ ' + value, color: index < revealedSteps ? (value < 0 ? '#dceeff' : '#ffe8df') : '#eef1f6', dim: index >= revealedSteps });
  });
  const done = revealedSteps >= round.moves.length;
  chips.push({ text: done ? '= ' + valueOf(round.targetPosition) : '= ?', color: done ? '#dcf5e1' : '#eef1f6', dim: !done });
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

function buildLandingOptions(round, stepIndex) {
  const cs = SPEC.coordinateSystem;
  const from = stepStartPosition(round, stepIndex);
  const target = stepTargetPosition(round, stepIndex);
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

function chipText(value) {
  const abs = Math.abs(value);
  return value < 0 ? '⬅️ ' + abs : abs + ' ➡️';
}

function buildSequencerPool(round, seedKey) {
  const pool = round.moves.map((move, index) => ({ poolId: 'm' + index, value: valueOf(move.value) }));
  round.moves.forEach((move, index) => {
    const mirrored = -valueOf(move.value);
    if (mirrored !== 0 && !pool.some((chip) => chip.value === mirrored)) {
      pool.push({ poolId: 'd' + index, value: mirrored });
    }
  });
  return seededShuffle(makeRng(seedKey), pool);
}

// Mechanik "Weg bauen": Bewegungs-Chips in der richtigen Reihenfolge in
// die Lücken legen, dann läuft die Figur die Kette ab.
function SequencerPanel({ round, slots, onPickChip, onClearSlot, onRun, running, pool }) {
  const usedPoolIds = slots.filter(Boolean).map((entry) => entry.poolId);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {slots.map((slot, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onClearSlot(index)}
            className="kid-font flex h-16 min-w-[6rem] items-center justify-center rounded-2xl border-4 border-dashed px-3 text-xl font-extrabold transition-transform active:scale-95"
            style={{ background: slot ? '#dceeff' : '#f2f5fa', borderColor: slot ? KID.ink : '#b9c3d4', color: KID.ink, borderStyle: slot ? 'solid' : 'dashed' }}
          >{slot ? chipText(slot.value) : index + 1 + '.'}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pool.map((chip) => (
          <button
            key={chip.poolId}
            type="button"
            disabled={usedPoolIds.includes(chip.poolId) || running}
            onClick={() => onPickChip(chip)}
            className="kid-font flex h-16 min-w-[6rem] items-center justify-center rounded-2xl border-4 px-3 text-xl font-extrabold transition-all active:translate-y-1 disabled:opacity-30"
            style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}
          >{chipText(chip.value)}</button>
        ))}
      </div>
      <BigButton onClick={onRun} color={KID.green} colorDark={KID.greenDark} disabled={running || slots.some((slot) => !slot)}>🐾 Los, lauf den Weg!</BigButton>
    </div>
  );
}

function RoomScene({ room, roomMeta, stars, streak, onStreak, onBack, onComplete, onStar }) {
  const isSequencer = room.interaction === 'step-sequencer';
  const [roundIndex, setRoundIndex] = useState(0);
  const round = room.rounds[roundIndex];
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState(isSequencer ? 'build' : 'direction');
  const [displayPos, setDisplayPos] = useState(valueOf(round.startPosition));
  const [hopping, setHopping] = useState(false);
  const [hopCount, setHopCount] = useState(0);
  const [mood, setMood] = useState('happy');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [bubble, setBubble] = useState('');
  const [landing, setLanding] = useState({ options: [], wrongDirection: null });
  const [pool, setPool] = useState(() => isSequencer ? buildSequencerPool(round, KID_SEED + ':' + room.roomId + ':' + roundIndex) : []);
  const [slots, setSlots] = useState(() => round.moves.map(() => null));
  const [revealed, setRevealed] = useState(0);
  const [misses, setMisses] = useState(0);
  const hopTimer = useRef(null);

  const currentMove = round.moves[stepIndex];
  const moveValue = currentMove ? valueOf(currentMove.value) : 0;

  useEffect(() => {
    if (isSequencer) {
      setBubble(room.objective + ' Lege die Wege in die richtige Reihenfolge!');
    } else if (currentMove) {
      setBubble('Dein Auftrag: ' + currentMove.label + '! Wohin geht es?');
    }
    return () => { if (hopTimer.current) clearInterval(hopTimer.current); };
  }, [roundIndex, stepIndex]);

  function resetForRound(nextIndex) {
    const nextRound = room.rounds[nextIndex];
    setRoundIndex(nextIndex);
    setStepIndex(0);
    setPhase(isSequencer ? 'build' : 'direction');
    setDisplayPos(valueOf(nextRound.startPosition));
    setSelectedPosition(null);
    setRevealed(0);
    setMisses(0);
    setLanding({ options: [], wrongDirection: null });
    if (isSequencer) {
      setPool(buildSequencerPool(nextRound, KID_SEED + ':' + room.roomId + ':' + nextIndex));
      setSlots(nextRound.moves.map(() => null));
    }
  }

  function finishRound() {
    setRevealed(round.moves.length);
    setMood('cheer');
    Sound.success();
    const nextStreak = misses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'movement-round-correct', roomId: room.roomId, roundIndex });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'movement-room-complete', roomId: room.roomId });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: nextStreak >= 3 ? 160 : 110, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit für die nächste Aufgabe?');
      confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
    }
    setTimeout(() => setMood('happy'), 1200);
  }

  function chooseDirection(dir) {
    if (phase !== 'direction') return;
    if (dir === Math.sign(moveValue)) {
      Sound.thunk();
      setMood('happy');
      setPhase('hop');
      setBubble('Super! Drücke auf Hüpfen!');
    } else {
      Sound.miss();
      setMisses((value) => value + 1);
      setMood('sad');
      setBubble(stepIndex > 0 ? room.feedback.signConfusion : room.feedback.wrongDirection);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function animateHop(from, target, after) {
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
        after();
      }
    }, 40);
  }

  function startHop() {
    if (phase !== 'hop' || hopping) return;
    const from = stepStartPosition(round, stepIndex);
    const target = stepTargetPosition(round, stepIndex);
    animateHop(from, target, () => {
      setPhase('land');
      setLanding(buildLandingOptions(round, stepIndex));
      setBubble('Wo bist du gelandet? Tippe auf die richtige Zahl!');
    });
  }

  function commitSelectedPosition(option) {
    const target = stepTargetPosition(round, stepIndex);
    setSelectedPosition(option);
    if (option === target) {
      Sound.tone(Sound.noteFor(stepIndex), 0.16);
      Meoluna.reportScore(5, { action: 'movement-step-correct', roomId: room.roomId, roundIndex, stepIndex });
      if (stepIndex + 1 >= round.moves.length) {
        finishRound();
      } else {
        setMood('cheer');
        setRevealed(stepIndex + 1);
        setPhase('direction');
        setStepIndex(stepIndex + 1);
        setSelectedPosition(null);
        setTimeout(() => setMood('happy'), 700);
      }
    } else {
      Sound.miss();
      setMisses((value) => value + 1);
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

  function pickChip(chip) {
    const firstEmpty = slots.findIndex((slot) => !slot);
    if (firstEmpty === -1) return;
    Sound.thunk();
    setSlots((list) => list.map((slot, index) => index === firstEmpty ? chip : slot));
  }

  function clearSlot(index) {
    Sound.thunk();
    setSlots((list) => list.map((slot, i) => i === index ? null : slot));
  }

  function runSequence() {
    if (slots.some((slot) => !slot) || hopping) return;
    const expected = round.moves.map((move) => valueOf(move.value));
    const chosen = slots.map((slot) => slot.value);
    const wrongIndex = expected.findIndex((value, index) => chosen[index] !== value);
    if (wrongIndex !== -1) {
      Sound.miss();
      setMisses((value) => value + 1);
      setMood('sad');
      setBubble(chosen[wrongIndex] === -expected[wrongIndex] ? room.feedback.signConfusion : room.feedback.wrongDistance);
      setTimeout(() => setMood('happy'), 700);
      return;
    }
    setPhase('run');
    function runStep(index) {
      if (index >= round.moves.length) {
        finishRound();
        return;
      }
      setRevealed(index);
      animateHop(stepStartPosition(round, index), stepTargetPosition(round, index), () => runStep(index + 1));
    }
    runStep(0);
  }

  return (
    <div className="kid-font min-h-screen p-3 sm:p-6" style={{ background: 'linear-gradient(180deg, ' + KID.skyBottom + ', #f8fdf2)' }}>
      <KidStyles />
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-0.5" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.bandEdge }}>← Karte</button>
          <div className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>{roomMeta.title || room.roomId}</div>
          <div className="flex items-center gap-2">
            <StreakMeter streak={streak} />
            <RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} />
            <StarRow stars={stars} />
            <SoundToggle />
          </div>
        </div>

        <SpeechBubble text={bubble || room.objective} />

        <PathScene
          round={round}
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

        {phase === 'build' && (
          <SequencerPanel round={round} slots={slots} onPickChip={pickChip} onClearSlot={clearSlot} onRun={runSequence} running={hopping} pool={pool} />
        )}

        {phase === 'roundDone' && (
          <BigButton onClick={() => resetForRound(roundIndex + 1)} color={KID.blue} colorDark={KID.blueDark}>➡️ Nächste Aufgabe!</BigButton>
        )}

        {phase === 'done' && (
          <BigButton onClick={onComplete} color={KID.green} colorDark={KID.greenDark}>🎉 Weiter!</BigButton>
        )}

        <EquationCards round={round} revealedSteps={phase === 'done' || phase === 'roundDone' ? round.moves.length : isSequencer ? revealed : stepIndex} />
      </div>
    </div>
  );
}

function Hub({ completedRooms, stars, onStart }) {
  return (
    <div className="kid-font min-h-screen p-4 sm:p-8" style={{ background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 55%, #f0fbe8)' }}>
      <KidStyles />
      <div className="relative mx-auto max-w-4xl">
        <MovementSky />
        <div className="relative rounded-[2rem] border-4 p-6 text-center shadow-xl" style={{ background: KID.card, borderColor: KID.ink }}>
          <div className="mx-auto -mt-14 w-fit"><MovementLuno mood="happy" hopping={false} dir={0} /></div>
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
                style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : index + 1}
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
      Meoluna.complete({ engine: 'movement-space', world: SPEC.world.worldName });
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
