import type { SortEngineSpec } from "./sortMatchTypes";
import { validateSortEngineSpec } from "./sortMatchValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildSortMatchWorldCode(spec: SortEngineSpec): string {
  const validation = validateSortEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid sort-match spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `
function BasketsScene({ round, cardIndex, sortedByCategory, mood }) {
  const currentCard = round.cards[cardIndex];
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
      <Sky />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="kid-font rounded-full border-2 px-4 py-1 text-lg font-extrabold" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink }}>
          Karte {Math.min(cardIndex + 1, round.cards.length)} von {round.cards.length}
        </span>
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={{ y: -40, scale: 0.6, opacity: 0 }}
              animate={mood === 'sad' ? { y: 0, scale: 1, opacity: 1, x: [0, -8, 8, -5, 5, 0] } : { y: 0, scale: 1, opacity: 1, x: 0 }}
              exit={{ y: 60, scale: 0.5, opacity: 0 }}
              className="kid-font flex flex-col items-center gap-1 rounded-3xl border-4 px-8 py-4 shadow-xl"
              style={{ background: KID.card, borderColor: KID.ink }}
            >
              <span className="text-5xl">{currentCard.emoji}</span>
              <span className="text-xl font-extrabold sm:text-2xl" style={{ color: KID.ink }}>{currentCard.label}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex w-full flex-wrap items-stretch justify-center gap-3">
          {round.categories.map((category) => (
            <div key={category.id} className="flex min-w-[7rem] flex-col items-center gap-1 rounded-2xl border-4 px-3 py-2" style={{ background: KID.band, borderColor: KID.bandEdge }}>
              <span className="text-2xl">{category.emoji}</span>
              <span className="kid-font text-sm font-extrabold" style={{ color: KID.ink }}>{category.label}</span>
              <div className="flex flex-wrap justify-center gap-1">
                {(sortedByCategory[category.id] || []).map((card) => (
                  <motion.span key={card.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-lg" title={card.label}>{card.emoji}</motion.span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BasketsEquation({ round, solved }) {
  return (
    <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
      <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Sortieren wird</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {round.categories.map((category) => {
          const cards = round.cards.filter((card) => card.categoryId === category.id);
          return (
            <span key={category.id} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-base font-extrabold sm:text-lg" style={{ background: solved ? '#dcf5e1' : '#eef1f6', borderColor: solved ? KID.ink : '#c6cdd9', color: solved ? KID.ink : '#9aa3b5' }}>
              {category.emoji} {category.label}: {solved ? cards.map((card) => card.emoji).join(' ') : cards.length + ' Karten'}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function BasketsRoom({ room, roundIndex, onRoundWin, setBubble, setMood, mood }) {
  const round = room.rounds[roundIndex];
  const [cardIndex, setCardIndex] = useState(0);
  const [sortedByCategory, setSortedByCategory] = useState({});
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setCardIndex(0);
    setSortedByCategory({});
    setSolved(false);
    setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' In welchen Korb gehört die Karte?');
  }, [roundIndex]);

  function sortCard(category) {
    if (solved) return;
    const card = round.cards[cardIndex];
    if (!card) return;
    if (card.categoryId === category.id) {
      setSortedByCategory((map) => ({ ...map, [category.id]: [...(map[category.id] || []), card] }));
      setMood('cheer');
      Sound.tone(Sound.noteFor(cardIndex), 0.14);
      setTimeout(() => setMood('happy'), 400);
      const nextIndex = cardIndex + 1;
      setCardIndex(nextIndex);
      if (nextIndex >= round.cards.length) {
        setSolved(true);
        Sound.success();
        onRoundWin(misses);
      } else {
        setBubble('Richtig einsortiert! Und die nächste Karte?');
      }
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      Sound.miss();
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : room.feedback.wrongBasket);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <BasketsScene round={round} cardIndex={cardIndex} sortedByCategory={sortedByCategory} mood={mood} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        {round.categories.map((category) => (
          <BigButton key={category.id} onClick={() => sortCard(category)} color={KID.blue} colorDark={KID.blueDark} disabled={solved}>
            {category.emoji} {category.label}
          </BigButton>
        ))}
      </div>
      <BasketsEquation round={round} solved={solved} />
    </>
  );
}

function buildRightOrder(round) {
  const ids = round.pairs.map((pair) => pair.id);
  return seededShuffle(makeRng(KID_SEED + ':pairs:' + ids.join(',')), ids);
}

function PairsRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [rightOrder, setRightOrder] = useState(() => buildRightOrder(round));
  const [matched, setMatched] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setRightOrder(buildRightOrder(room.rounds[roundIndex]));
    setMatched([]);
    setSelectedLeft(null);
    setSolved(false);
    setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Tippe links eine Karte und dann ihren Partner rechts!');
  }, [roundIndex]);

  function pickPair(side, pairId) {
    if (solved || matched.includes(pairId)) return;
    if (side === 'left') {
      Sound.thunk();
      setSelectedLeft(pairId);
      return;
    }
    if (!selectedLeft) {
      setBubble('Tippe zuerst links eine Karte an!');
      return;
    }
    if (pairId === selectedLeft) {
      const nextMatched = [...matched, pairId];
      setMatched(nextMatched);
      setSelectedLeft(null);
      setMood('cheer');
      Sound.tone(Sound.noteFor(nextMatched.length), 0.14);
      setTimeout(() => setMood('happy'), 400);
      if (nextMatched.length >= round.pairs.length) {
        setSolved(true);
        Sound.success();
        onRoundWin(misses);
      } else {
        setBubble('Paar gefunden! Welches Paar findest du als Nächstes?');
      }
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      Sound.miss();
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : room.feedback.wrongPair);
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function pairCard(pair, side, content) {
    const isMatched = matched.includes(pair.id);
    const isSelected = side === 'left' && selectedLeft === pair.id;
    return (
      <button
        key={side + pair.id}
        type="button"
        disabled={solved || isMatched}
        onClick={() => pickPair(side, pair.id)}
        className="kid-font flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl border-4 px-3 py-2 text-lg font-extrabold transition-all active:translate-y-1 sm:text-xl"
        style={{
          background: isMatched ? '#dcf5e1' : isSelected ? KID.sun : KID.card,
          borderColor: isMatched ? KID.green : KID.ink,
          color: KID.ink,
          opacity: isMatched ? 0.7 : 1,
          boxShadow: isMatched ? 'none' : '0 5px 0 ' + KID.bandEdge,
        }}
      >
        {content.emoji && <span className="text-2xl">{content.emoji}</span>}
        <span>{content.label}</span>
        {isMatched && <span>✅</span>}
      </button>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-6">
          <div className="flex flex-col gap-2">
            {round.pairs.map((pair) => pairCard(pair, 'left', pair.left))}
          </div>
          <div className="flex flex-col gap-2">
            {rightOrder.map((pairId) => {
              const pair = round.pairs.find((entry) => entry.id === pairId);
              if (!pair) return null;
              return pairCard(pair, 'right', pair.right);
            })}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Sortieren wird</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {round.pairs.map((pair) => (
            <span key={pair.id} className="kid-font rounded-2xl border-2 px-3 py-1.5 text-base font-extrabold sm:text-lg" style={{ background: matched.includes(pair.id) ? '#dcf5e1' : '#eef1f6', borderColor: matched.includes(pair.id) ? KID.ink : '#c6cdd9', color: matched.includes(pair.id) ? KID.ink : '#9aa3b5' }}>
              {matched.includes(pair.id) ? pair.left.label + ' = ' + pair.right.label : '? = ?'}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

// odd-one-out: mehrere Karten teilen eine Eigenschaft, genau eine nicht.
function OddOneOutRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setSolved(false);
    setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Welche Karte passt nicht zur Gruppe?');
  }, [roundIndex]);

  function pickCard(index) {
    if (solved) return;
    if (index === round.oddIndex) {
      setSolved(true);
      setMood('cheer');
      Sound.success();
      onRoundWin(misses);
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      Sound.miss();
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : (room.feedback.wrongOdd || room.feedback.tryAgain));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '15rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          {round.cards.map((card, index) => {
            const isOdd = index === round.oddIndex;
            return (
              <motion.button
                key={card.id}
                type="button"
                onClick={() => pickCard(index)}
                disabled={solved}
                animate={solved && isOdd ? { scale: [1, 1.12, 1] } : {}}
                className="kid-font flex flex-col items-center gap-1 rounded-3xl border-4 px-5 py-3 transition-all active:translate-y-1 disabled:opacity-70"
                style={{
                  background: solved && isOdd ? '#dcf5e1' : KID.card,
                  borderColor: solved && isOdd ? KID.green : KID.ink,
                  boxShadow: solved ? 'none' : '0 5px 0 ' + KID.bandEdge,
                }}
              >
                <span className="text-4xl">{card.emoji}</span>
                <span className="text-lg font-extrabold" style={{ color: KID.ink }}>{card.label}</span>
                {solved && isOdd && <span>✅</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Sortieren wird</p>
        <p className="mt-2 text-base font-bold" style={{ color: solved ? KID.ink : '#9aa3b5' }}>{solved ? round.reason : 'Welche Karte gehört nicht zur Gruppe?'}</p>
      </div>
    </>
  );
}

// two-axis: 2x2-Raster. Erst eine Karte antippen, dann das passende Feld.
function TwoAxisRoom({ room, roundIndex, onRoundWin, setBubble, setMood }) {
  const round = room.rounds[roundIndex];
  const [placed, setPlaced] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setPlaced({});
    setSelectedCard(null);
    setSolved(false);
    setMisses(0);
    setBubble((room.rounds[roundIndex].objective || room.objective) + ' Tippe eine Karte an, dann das richtige Feld!');
  }, [roundIndex]);

  function selectCard(card) {
    if (solved || placed[card.id]) return;
    Sound.thunk();
    setSelectedCard(card);
  }

  function pickQuadrant(x, y) {
    if (solved) return;
    if (!selectedCard) {
      setBubble('Tippe zuerst eine Karte an!');
      return;
    }
    if (selectedCard.x === x && selectedCard.y === y) {
      const nextPlaced = { ...placed, [selectedCard.id]: true };
      setPlaced(nextPlaced);
      setSelectedCard(null);
      setMood('cheer');
      Sound.tone(Sound.noteFor(Object.keys(nextPlaced).length), 0.14);
      setTimeout(() => setMood('happy'), 400);
      const remaining = round.cards.filter((card) => !nextPlaced[card.id]);
      if (remaining.length === 0) {
        setSolved(true);
        Sound.success();
        onRoundWin(misses);
      } else {
        setBubble('Richtig einsortiert! Und die nächste Karte?');
      }
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMood('sad');
      Sound.miss();
      setBubble(nextMisses >= 2 ? room.feedback.tryAgain : (room.feedback.wrongQuadrant || room.feedback.tryAgain));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function Quadrant({ x, y }) {
    const cardsHere = round.cards.filter((card) => placed[card.id] && card.x === x && card.y === y);
    const xLabel = x === 'negative' ? round.xAxis.negative : round.xAxis.positive;
    const yLabel = y === 'negative' ? round.yAxis.negative : round.yAxis.positive;
    return (
      <button
        type="button"
        onClick={() => pickQuadrant(x, y)}
        disabled={solved}
        className="kid-font flex min-h-[5.5rem] flex-col items-center justify-start gap-1 rounded-2xl border-4 p-2 text-center transition-all active:translate-y-1"
        style={{ background: KID.band, borderColor: KID.bandEdge }}
      >
        <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: KID.ink }}>{yLabel} · {xLabel}</span>
        <div className="flex flex-wrap justify-center gap-1">
          {cardsHere.map((card) => (
            <motion.span key={card.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xl" title={card.label}>{card.emoji}</motion.span>
          ))}
        </div>
      </button>
    );
  }

  const remainingCards = round.cards.filter((card) => !placed[card.id]);

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[2rem] border-4 p-4" style={{ minHeight: '18rem', borderColor: KID.ink, background: 'linear-gradient(180deg, ' + KID.skyTop + ', ' + KID.skyBottom + ' 70%)' }}>
        <Sky />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Quadrant x="negative" y="positive" />
            <Quadrant x="positive" y="positive" />
            <Quadrant x="negative" y="negative" />
            <Quadrant x="positive" y="negative" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {remainingCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => selectCard(card)}
                disabled={solved}
                className="kid-font flex flex-col items-center gap-1 rounded-2xl border-4 px-4 py-2 transition-all active:translate-y-1"
                style={{
                  background: selectedCard && selectedCard.id === card.id ? KID.sun : KID.card,
                  borderColor: KID.ink,
                  boxShadow: '0 5px 0 ' + KID.bandEdge,
                }}
              >
                <span className="text-3xl">{card.emoji}</span>
                <span className="text-sm font-extrabold" style={{ color: KID.ink }}>{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border-4 p-4" style={{ background: KID.card, borderColor: KID.ink }}>
        <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Aus dem Sortieren wird</p>
        <p className="mt-2 text-base font-bold" style={{ color: solved ? KID.ink : '#9aa3b5' }}>{solved ? round.cards.length + ' Karten richtig einsortiert!' : remainingCards.length + ' Karte(n) übrig'}</p>
      </div>
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
    const nextStreak = misses === 0 ? streak + 1 : 0;
    onStreak(nextStreak);
    Meoluna.reportScore(10, { action: 'sort-round-correct', roomId: room.roomId, roundIndex, mode: room.mode, firstTry: misses === 0 });
    onStar();
    if (roundIndex + 1 >= room.rounds.length) {
      setPhase('done');
      setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
      Meoluna.reportScore(25, { action: 'sort-room-complete', roomId: room.roomId, mode: room.mode });
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

  const RoomComponent = room.mode === 'baskets' ? BasketsRoom : room.mode === 'pairs' ? PairsRoom : room.mode === 'odd-one-out' ? OddOneOutRoom : TwoAxisRoom;

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
          <div className="flex items-center gap-2"><StreakMeter streak={streak} /><RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} /><StarRow stars={stars} /><SoundToggle /></div>
        </div>

        <SpeechBubble text={bubble} />

        {phase !== 'done' && (<RoomComponent key={roundIndex} room={room} roundIndex={roundIndex} onRoundWin={handleRoundWin} setBubble={setBubble} setMood={setMood} mood={mood} />)}

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
            const modeIcon = room.mode === 'baskets' ? '🧺' : room.mode === 'pairs' ? '🃏' : room.mode === 'odd-one-out' ? '🔎' : '🧭';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
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
                  {icon}
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
      Meoluna.complete({ engine: 'sort-match', world: SPEC.world.worldName });
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
