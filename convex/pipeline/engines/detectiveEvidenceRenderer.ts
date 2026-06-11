import type { DetectiveEngineSpec } from "./detectiveEvidenceTypes";
import { validateDetectiveEngineSpec } from "./detectiveEvidenceValidator";

export function buildDetectiveEvidenceWorldCode(spec: DetectiveEngineSpec): string {
  const validation = validateDetectiveEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid detective-evidence spec: ${validation.violations.join(" | ")}`);
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
  paper: '#fff9ec',
  paperEdge: '#d9b178',
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl" style={{ background: '#fff1c4' }}>🕵️</div>
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

function EvidenceScene({ room, solvedIndices, flashIndex, onPickSentence }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '17rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.sun, borderColor: KID.ink, color: KID.ink }}>📜 {room.caseText.title}</span>
        <div className="flex w-full max-w-2xl flex-col gap-2 rounded-2xl border-4 p-3" style={{ background: KID.paper, borderColor: KID.paperEdge }}>
          {room.caseText.sentences.map((sentence, index) => {
            const solved = solvedIndices.includes(index);
            const flashing = flashIndex === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => pickSentence(onPickSentence, index)}
                className="kid-font flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-base font-bold leading-snug transition-all active:translate-y-0.5 sm:text-lg"
                style={{
                  background: solved ? '#dcf5e1' : flashing ? '#ffe3d6' : KID.card,
                  borderColor: solved ? KID.green : flashing ? KID.coral : '#d8cfb8',
                  color: KID.ink,
                }}
              >
                <span className="shrink-0 rounded-md px-1.5 text-sm font-extrabold" style={{ background: solved ? KID.green : '#eef1f6', color: solved ? '#ffffff' : '#8a93a6' }}>{index + 1}</span>
                <span className="grow">{sentence}</span>
                {solved && <span className="shrink-0 text-xl">🔍</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function pickSentence(handler, index) {
  handler(index);
}

function EvidenceEquation({ room, solvedRounds }) {
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus den Beweisen wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {room.rounds.map((round, index) => (
          <span key={index} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-base font-extrabold sm:text-lg" style={{ background: index < solvedRounds ? '#dcf5e1' : '#eef1f6', borderColor: index < solvedRounds ? KID.ink : '#c6cdd9', color: index < solvedRounds ? KID.ink : '#9aa3b5' }}>
            {index < solvedRounds ? 'Frage ' + (index + 1) + ' ➜ Satz ' + (round.evidenceIndex + 1) + ' 🔍' : 'Frage ' + (index + 1) + ' ➜ ?'}
          </span>
        ))}
      </div>
    </div>
  );
}

function EvidenceRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [solvedIndices, setSolvedIndices] = useState([]);
  const [flashIndex, setFlashIndex] = useState(null);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setSolved(false);
    setMisses(0);
    setBubble('🔍 ' + room.rounds[roundIndex].question + ' Tippe den Satz, der es beweist!');
  }, [roundIndex]);

  function handlePickSentence(index) {
    if (solved || solvedIndices.includes(index)) return;
    if (index === round.evidenceIndex) {
      setSolvedIndices((list) => [...list, index]);
      setSolved(true);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 500);
      onRoundWin();
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setFlashIndex(index);
      setMood('sad');
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : room.feedback.wrongEvidence);
      setTimeout(() => { setMood('happy'); setFlashIndex(null); }, 800);
    }
  }

  return (
    <>
      <div className="kid-font mx-auto w-fit rounded-2xl border-4 px-4 py-2 text-lg font-extrabold sm:text-xl" style={{ background: '#e6f2ff', borderColor: KID.ink, color: KID.ink }}>
        ❓ {round.question}
      </div>
      <EvidenceScene room={room} solvedIndices={solvedIndices} flashIndex={flashIndex} onPickSentence={handlePickSentence} />
      <EvidenceEquation room={room} solvedRounds={solvedIndices.length} />
    </>
  );
}

function SuspectCard({ suspect, eliminated, isCulprit, revealed, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={eliminated ? { scale: 0.92, opacity: 0.45 } : revealed && isCulprit ? { scale: [1, 1.12, 1.05] } : {}}
      className="kid-font relative flex min-w-[8rem] flex-col items-center gap-1 rounded-2xl border-4 px-3 py-3 transition-all active:translate-y-1"
      style={{ background: revealed && isCulprit ? '#fff1c4' : KID.card, borderColor: revealed && isCulprit ? KID.sun : KID.ink, boxShadow: '0 5px 0 ' + KID.paperEdge }}
    >
      <span className="text-4xl">{suspect.emoji}</span>
      <span className="text-base font-extrabold" style={{ color: KID.ink }}>{suspect.name}</span>
      <span className="flex flex-wrap justify-center gap-1">
        {Object.values(suspect.traits).map((value, index) => (
          <span key={index} className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ background: '#eef1f6', borderColor: '#c6cdd9', color: '#5d6b85' }}>{value}</span>
        ))}
      </span>
      {eliminated && <span className="absolute right-1 top-1 text-2xl">❌</span>}
      {revealed && isCulprit && <span className="absolute right-1 top-1 text-2xl">🎯</span>}
    </motion.button>
  );
}

function SuspectsEquation({ round, clueIndex, revealed }) {
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus den Beweisen wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {round.clues.map((clue, index) => (
          <span key={index} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-base font-extrabold sm:text-lg" style={{ background: index < clueIndex ? '#dceeff' : '#eef1f6', borderColor: index < clueIndex ? KID.ink : '#c6cdd9', color: index < clueIndex ? KID.ink : '#9aa3b5' }}>🔎 {clue.value}</span>
        ))}
        <span className="kid-font text-xl font-extrabold" style={{ color: KID.ink }}>=</span>
        <span className="kid-font rounded-2xl border-2 px-3 py-1.5 text-base font-extrabold sm:text-lg" style={{ background: revealed ? '#dcf5e1' : '#eef1f6', borderColor: revealed ? KID.ink : '#c6cdd9', color: revealed ? KID.ink : '#9aa3b5' }}>
          {revealed ? round.suspects.find((suspect) => suspect.id === round.culpritId).emoji + ' ' + round.suspects.find((suspect) => suspect.id === round.culpritId).name : '?'}
        </span>
      </div>
    </div>
  );
}

function SuspectsRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [eliminated, setEliminated] = useState([]);
  const [clueIndex, setClueIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  const currentClue = round.clues[clueIndex];

  useEffect(() => {
    setEliminated([]);
    setClueIndex(0);
    setSolved(false);
    setMisses(0);
    setBubble(room.rounds[roundIndex].intro + ' Wer passt NICHT zum Hinweis? Tippe ihn weg!');
  }, [roundIndex]);

  function eliminateSuspect(suspect) {
    if (solved || eliminated.includes(suspect.id) || !currentClue) return;
    const matchesClue = suspect.traits[currentClue.attribute] === currentClue.value;
    if (!matchesClue) {
      const nextEliminated = [...eliminated, suspect.id];
      setEliminated(nextEliminated);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 500);
      const nextClueIndex = clueIndex + 1;
      if (nextClueIndex >= round.clues.length) {
        setSolved(true);
        onRoundWin();
      } else {
        setClueIndex(nextClueIndex);
        setBubble('Genau, ' + suspect.name + ' scheidet aus! Neuer Hinweis: ' + round.clues[nextClueIndex].text);
      }
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : room.feedback.wrongSuspect);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      {currentClue && !solved && (
        <div className="kid-font mx-auto w-fit rounded-2xl border-4 px-4 py-2 text-lg font-extrabold sm:text-xl" style={{ background: '#fff1c4', borderColor: KID.ink, color: KID.ink }}>
          🔎 Hinweis {clueIndex + 1}: {currentClue.text}
        </div>
      )}
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-wrap items-stretch justify-center gap-3">
          {round.suspects.map((suspect) => (
            <SuspectCard
              key={suspect.id}
              suspect={suspect}
              eliminated={eliminated.includes(suspect.id)}
              isCulprit={suspect.id === round.culpritId}
              revealed={solved}
              onClick={() => eliminateSuspect(suspect)}
            />
          ))}
        </div>
      </div>
      <SuspectsEquation round={round} clueIndex={clueIndex + (solved ? 1 : 0)} revealed={solved} />
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
    Meoluna.reportScore(10, { action: 'detective-round-correct', roomId: room.roomId, roundIndex });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'detective-room-complete', roomId: room.roomId });
      Meoluna.completeModule(room.roomId, 25);
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
    } else {
      setPhase('roundDone');
      setBubble(room.feedback.correct + ' Bereit für den nächsten Fall?');
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
          <button type="button" onClick={onBack} className="rounded-2xl border-2 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-0.5" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.paperEdge }}>← Karte</button>
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

        {phase !== 'done' && (room.mode === 'evidence'
          ? <EvidenceRoom room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />
          : <SuspectsRoom key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} />)}

        {phase === 'roundDone' && (
          <BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Nächster Fall!</BigButton>
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
                style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.paperEdge }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>
                  {done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : room.mode === 'evidence' ? '📜' : '🕵️'}
                </div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Fälle</p>
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
      Meoluna.complete({ engine: 'detective-evidence', world: SPEC.world.worldName });
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
