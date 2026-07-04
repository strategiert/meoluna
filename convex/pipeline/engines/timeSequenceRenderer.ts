import type { TimeEngineSpec } from "./timeSequenceTypes";
import { validateTimeEngineSpec } from "./timeSequenceValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildTimeSequenceWorldCode(spec: TimeEngineSpec): string {
  const validation = validateTimeEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid time-sequence spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `

// "Bilderbuch-Tag": helle, freundliche Spielwelt für Kinder ab 5.
// Session-Format v2: Räume enthalten mehrere Runden mit steigender Schwierigkeit.

// Deterministisch gemischter Karten-Pool: eigener Rng pro Raum+Runde, damit
// die Reihenfolge des Pools unabhaengig vom bisherigen Spielverlauf immer
// gleich ist (replay-sicher), aber zwischen Runden/Welten streut.
function buildEventPool(room, roundIndex, round, startFilled) {
  const rng = makeRng(KID_SEED + ':' + room.roomId + ':' + roundIndex + ':pool');
  const remaining = round.events.slice(startFilled);
  return seededShuffle(rng, remaining).map(function (event) { return { poolId: event.id, event: event }; });
}

function EventCard({ event, dim }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1">
      <span className="text-3xl sm:text-4xl">{event.emoji}</span>
      <span className="kid-font max-w-[7rem] text-center text-xs font-extrabold leading-tight sm:text-sm" style={{ color: dim ? '#9aa3b5' : KID.ink }}>{event.label}</span>
    </div>
  );
}

function TimeScene({ room, round, filledCount }) {
  const isChain = room.mode === 'chain';
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '17rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>{round.title}</span>
        <div className="w-full rounded-2xl border-4 p-3" style={{ background: KID.band, borderColor: KID.bandEdge }}>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {round.events.map((event, index) => (
              <div key={event.id} className="flex items-center gap-1">
                {index > 0 && (
                  <span className="kid-font text-lg font-extrabold sm:text-xl" style={{ color: index <= filledCount - 1 || (index === filledCount && index > 0) ? KID.ink : '#c4ad85' }}>
                    {isChain ? '➜' : '→'}
                  </span>
                )}
                <motion.div
                  animate={index === filledCount - 1 ? { scale: [0.6, 1.1, 1] } : {}}
                  className="flex min-h-[5.5rem] min-w-[5.5rem] items-center justify-center rounded-2xl border-4 px-1 py-2"
                  style={{
                    background: index < filledCount ? KID.card : 'rgba(255,255,255,0.45)',
                    borderColor: index < filledCount ? KID.ink : '#c4ad85',
                    borderStyle: index < filledCount ? 'solid' : 'dashed',
                  }}
                >
                  {index < filledCount
                    ? <EventCard event={event} dim={false} />
                    : <span className="kid-font text-2xl font-extrabold" style={{ color: '#b09a72' }}>{index + 1}.</span>}
                </motion.div>
              </div>
            ))}
          </div>
          {isChain && filledCount < round.events.length && filledCount > 0 && (
            <p className="kid-font mt-2 text-center text-base font-extrabold" style={{ color: '#8a6f45' }}>Was passiert dadurch?</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SequenceEquation({ round, solved }) {
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus der Reihenfolge wird</p>
      <span className="kid-font mt-2 inline-block rounded-2xl border-2 px-3 py-1.5 text-lg font-extrabold sm:text-xl" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
        {solved ? round.events.map((event) => event.emoji + ' ' + event.label).join(' ➜ ') : round.title + ' = ?'}
      </span>
    </div>
  );
}

// timeline/chain: Karten aus dem Pool antippen, bis die Kette komplett ist.
function SequenceRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const isChain = room.mode === 'chain';
  const startFilled = isChain ? 1 : 0;
  const [filledCount, setFilledCount] = useState(startFilled);
  const [pool, setPool] = useState(() => buildEventPool(room, roundIndex, round, startFilled));
  const [misses, setMisses] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    const nextRound = room.rounds[roundIndex];
    setFilledCount(startFilled);
    setPool(buildEventPool(room, roundIndex, nextRound, startFilled));
    setMisses(0);
    setSolved(false);
    setBubble((nextRound.objective || room.objective) + (isChain ? ' Was passiert dadurch?' : ' Was kommt zuerst?'));
  }, [roundIndex]);

  function placeEvent(chip) {
    if (solved) return;
    const expected = round.events[filledCount];
    if (!expected) return;
    if (chip.event.id === expected.id) {
      const nextCount = filledCount + 1;
      setFilledCount(nextCount);
      setPool((list) => list.filter((entry) => entry.poolId !== chip.poolId));
      setMood('cheer');
      Sound.thunk();
      setTimeout(() => setMood('happy'), 500);
      if (nextCount >= round.events.length) {
        setSolved(true);
        onRoundWin(misses);
      } else {
        setBubble(isChain ? 'Genau! Und was passiert dadurch?' : 'Richtig! Was kommt danach?');
      }
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      Sound.miss();
      if (nextMisses >= 2) {
        setBubble(room.feedback.tryAgain);
      } else {
        setBubble(isChain ? room.feedback.wrongLink : room.feedback.wrongOrder);
      }
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <TimeScene room={room} round={round} filledCount={filledCount} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pool.map((chip) => (
          <button
            key={chip.poolId}
            type="button"
            disabled={solved}
            onClick={() => placeEvent(chip)}
            className="kid-font flex min-h-[80px] min-w-[7rem] flex-col items-center justify-center rounded-2xl border-4 px-3 py-2 transition-all active:translate-y-1 disabled:opacity-30"
            style={{ background: KID.card, borderColor: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}
          >
            <EventCard event={chip.event} dim={false} />
          </button>
        ))}
      </div>
      <SequenceEquation round={round} solved={solved} />
    </>
  );
}

// missing-event: die komplette Kette wird gezeigt, ein mittleres Ereignis
// fehlt (gestrichelter Platzhalter). Aus 3-4 Karten die richtige antippen.
function MissingEventScene({ round, revealed }) {
  const gapIndex = round.gapIndex;
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '17rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>{round.title}</span>
        <div className="w-full rounded-2xl border-4 p-3" style={{ background: KID.band, borderColor: KID.bandEdge }}>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {round.events.map((event, index) => {
              const isGap = index === gapIndex && !revealed;
              return (
                <div key={event.id} className="flex items-center gap-1">
                  {index > 0 && (<span className="kid-font text-lg font-extrabold sm:text-xl" style={{ color: KID.ink }}>→</span>)}
                  <motion.div
                    animate={isGap ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1.6, repeat: isGap ? Infinity : 0 }}
                    className="flex min-h-[5.5rem] min-w-[5.5rem] items-center justify-center rounded-2xl border-4 px-1 py-2"
                    style={{
                      background: isGap ? 'rgba(255,255,255,0.45)' : KID.card,
                      borderColor: isGap ? '#c4ad85' : KID.ink,
                      borderStyle: isGap ? 'dashed' : 'solid',
                    }}
                  >
                    {isGap
                      ? <span className="kid-font text-2xl font-extrabold" style={{ color: '#b09a72' }}>?</span>
                      : <EventCard event={event} dim={false} />}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissingEventRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [options, setOptions] = useState(() => seededShuffle(makeRng(KID_SEED + ':' + room.roomId + ':' + roundIndex + ':gap'), round.options));
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    const nextRound = room.rounds[roundIndex];
    setOptions(seededShuffle(makeRng(KID_SEED + ':' + room.roomId + ':' + roundIndex + ':gap'), nextRound.options));
    setSolved(false);
    setMisses(0);
    setBubble((nextRound.objective || room.objective) + ' Welches Ereignis fehlt in der Kette?');
  }, [roundIndex]);

  const expected = round.events[round.gapIndex];

  function pick(option) {
    if (solved) return;
    if (option.id === expected.id) {
      setSolved(true);
      setMood('cheer');
      onRoundWin(misses);
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      Sound.miss();
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : room.feedback.wrongGap);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <MissingEventScene round={round} revealed={solved} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={solved}
            onClick={() => pick(option)}
            className="kid-font flex min-h-[80px] min-w-[7rem] flex-col items-center justify-center rounded-2xl border-4 px-3 py-2 transition-all active:translate-y-1 disabled:opacity-30"
            style={{ background: KID.card, borderColor: KID.ink, boxShadow: '0 5px 0 ' + KID.bandEdge }}
          >
            <EventCard event={option} dim={false} />
          </button>
        ))}
      </div>
      <SequenceEquation round={round} solved={solved} />
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
    Meoluna.reportScore(10, { action: 'time-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: misses === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'time-room-complete', roomId: room.roomId, mode: room.mode });
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

  const RoomComponent = room.mode === 'missing-event' ? MissingEventRoom : SequenceRoom;

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

        {phase !== 'done' && (
          <RoomComponent key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />
        )}

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
            const modeIcon = room.mode === 'timeline' ? '🕰️' : room.mode === 'chain' ? '🔗' : '❓';
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
      Meoluna.complete({ engine: 'time-sequence', world: SPEC.world.worldName });
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
