import type { MoneyEngineSpec } from "./moneyTypes";
import { validateMoneyEngineSpec } from "./moneyValidator";
import { KID_KIT_CORE } from "./kidKit";

export function buildMoneyWorldCode(spec: MoneyEngineSpec): string {
  const validation = validateMoneyEngineSpec(spec);
  if (!validation.passed) {
    throw new Error(`Invalid money spec: ${validation.violations.join(" | ")}`);
  }

  const dataJson = JSON.stringify(spec, null, 2);

  return `import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEC = ${dataJson};
` + KID_KIT_CORE + `
function pad2(n) { return String(n).padStart(2, '0'); }
function fmtMoney(cents) {
  if (cents < 100) return cents + ' ct';
  const e = Math.floor(cents / 100); const r = cents % 100;
  return r === 0 ? e + ' €' : e + ',' + pad2(r) + ' €';
}
function coinLabel(cents) {
  if (cents < 100) return cents + 'ct';
  const e = Math.floor(cents / 100); const r = cents % 100;
  return r === 0 ? e + '€' : e + ',' + pad2(r);
}
function isNote(cents) { return cents >= 500; }

// Summe der gekauften Artikel (shopping-Modus): Preise der Items, deren Name
// in namesInCart steht.
function shoppingTotal(round, namesInCart) {
  return round.items.filter((it) => namesInCart.includes(it.name)).reduce((sum, it) => sum + it.priceCents, 0);
}

function Coin({ cents, onClick, disabled, small }) {
  const note = isNote(cents);
  const sz = small ? 'h-12 w-12' : 'h-16 w-16';
  if (note) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={"kid-font flex " + (small ? 'h-10 w-16' : 'h-12 w-20') + " items-center justify-center rounded-md border-2 text-base font-extrabold transition-all active:translate-y-1 disabled:opacity-40"} style={{ background: '#cdeccf', borderColor: KID.greenDark, color: KID.ink, boxShadow: small ? 'none' : '0 4px 0 ' + KID.greenDark }}>{coinLabel(cents)}</button>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={"kid-font flex " + sz + " items-center justify-center rounded-full border-4 text-sm font-extrabold transition-all active:translate-y-1 disabled:opacity-40"} style={{ background: cents >= 100 ? '#ffe7a3' : '#e7ecf2', borderColor: cents >= 100 ? '#caa23a' : '#9aa3b5', color: KID.ink, boxShadow: small ? 'none' : '0 4px 0 ' + (cents >= 100 ? '#caa23a' : '#9aa3b5') }}>{coinLabel(cents)}</button>
  );
}

// shopping: Artikel-Karte im Regal. Bereits im Korb -> Tipp nimmt sie zurueck.
function ShelfItem({ item, inCart, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled && !inCart} className="kid-font flex min-w-[6rem] flex-col items-center gap-1 rounded-2xl border-4 px-3 py-2 transition-all active:translate-y-1 disabled:opacity-40" style={{ background: inCart ? '#dcf5e1' : KID.card, borderColor: KID.ink, boxShadow: '0 5px 0 ' + (inCart ? KID.greenDark : KID.bandEdge) }}>
      <span className="text-4xl">{item.emoji}</span>
      <span className="text-sm font-extrabold" style={{ color: KID.ink }}>{item.name}</span>
      <span className="text-xs font-extrabold" style={{ color: '#8a93a6' }}>{fmtMoney(item.priceCents)}</span>
    </button>
  );
}

function MoneyRoomScene({ room, roomMeta, stars, streak, onStreak, onBack, onComplete, onStar }) {
  const [bubble, setBubble] = useState(room.objective);
  const [mood, setMood] = useState('happy');
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState('play');
  const [tray, setTray] = useState([]);
  const [cart, setCart] = useState([]);
  // shopping: erst Artikel picken ("pick"), dann bezahlen ("pay"). Bei
  // pay/change bleibt subPhase immer 'pay' - deren Ablauf ist UNVERAENDERT.
  const [subPhase, setSubPhase] = useState(room.mode === 'shopping' ? 'pick' : 'pay');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);

  const round = room.rounds[roundIndex];
  const target = room.mode === 'change' ? (round.paidCents - round.priceCents) : room.mode === 'shopping' ? shoppingTotal(round, cart) : round.targetCents;
  const sum = tray.reduce((a, b) => a + b, 0);

  useEffect(() => {
    const r = room.rounds[roundIndex];
    setTray([]); setSolved(false); setMisses(0); setCart([]);
    setSubPhase(room.mode === 'shopping' ? 'pick' : 'pay');
    const intro = r.objective || room.objective;
    if (room.mode === 'change') {
      setBubble(intro + ' Preis ' + fmtMoney(r.priceCents) + ', bezahlt ' + fmtMoney(r.paidCents) + '. Lege das Rueckgeld!');
    } else if (room.mode === 'shopping') {
      setBubble(intro + ' Kaufe: ' + r.buyNames.join(', ') + '!');
    } else {
      setBubble(intro + ' Lege genau ' + fmtMoney(r.targetCents) + '!');
    }
  }, [roundIndex]);

  function tapItem(item) {
    if (subPhase !== 'pick' || solved) return;
    if (cart.includes(item.name)) {
      // Tipp auf einen bereits im Korb liegenden Artikel nimmt ihn zurueck.
      Sound.thunk();
      setCart(cart.filter((n) => n !== item.name));
      return;
    }
    if (round.buyNames.includes(item.name)) {
      Sound.tone(Sound.noteFor(cart.length), 0.14);
      const nextCart = [...cart, item.name];
      setCart(nextCart);
      setMood('cheer');
      setTimeout(() => setMood('happy'), 350);
      if (nextCart.length >= round.buyNames.length) {
        setTimeout(() => {
          setSubPhase('pay');
          setBubble('Toller Einkauf! Jetzt bezahle ' + fmtMoney(shoppingTotal(round, nextCart)) + '.');
        }, 500);
      } else {
        setBubble('Gut! Noch ' + (round.buyNames.length - nextCart.length) + ' Artikel fuer den Einkaufszettel.');
      }
    } else {
      Sound.miss();
      const mm = misses + 1; setMisses(mm); setMood('sad');
      setBubble(mm >= 2 ? room.feedback.tryAgain : (room.feedback.wrongItem || room.feedback.wrongAmount));
      setTimeout(() => setMood('happy'), 700);
    }
  }

  function addCoin(cents) { if (solved) return; Sound.thunk(); setTray((t) => [...t, cents]); }
  function removeLast() { if (solved) return; Sound.thunk(); setTray((t) => t.slice(0, -1)); }
  function resetTray() { if (solved) return; setTray([]); }

  function check() {
    if (solved) return;
    if (sum === target) {
      setSolved(true); setMood('cheer'); Sound.success();
      const nextStreak = misses === 0 ? streak + 1 : 0;
      onStreak(nextStreak);
      Meoluna.reportScore(10, { action: 'money-round-correct', roomId: room.roomId, roundIndex, mode: room.mode });
      onStar();
      if (roundIndex + 1 >= room.rounds.length) {
        setPhase('done');
        setBubble(room.feedback.correct + ' ' + room.explanationAfterSuccess);
        Meoluna.reportScore(25, { action: 'money-room-complete', roomId: room.roomId, mode: room.mode });
        Meoluna.completeModule(room.roomId, 25);
        confetti({ particleCount: nextStreak >= 3 ? 160 : 100, spread: 75, origin: { y: 0.6 } });
      } else {
        setPhase('roundDone');
        setBubble(room.feedback.correct + ' Bereit fuer den naechsten Einkauf?');
        confetti({ particleCount: nextStreak >= 3 ? 90 : 50, spread: 60, origin: { y: 0.65 } });
      }
      setTimeout(() => setMood('happy'), 1200);
    } else {
      Sound.miss();
      const mm = misses + 1; setMisses(mm); setMood('sad');
      setBubble(mm >= 2 ? room.feedback.tryAgain : (sum > target ? 'Zu viel. ' : 'Noch zu wenig. ') + room.feedback.wrongAmount);
      setTimeout(() => setMood('happy'), 700);
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
          <div className="flex items-center gap-2"><StreakMeter streak={streak} /><RoundDots total={room.rounds.length} current={phase === 'done' ? room.rounds.length : roundIndex} /><StarRow stars={stars} /><SoundToggle /></div>
        </div>
        <SpeechBubble text={bubble} />

        {phase !== 'done' && room.mode === 'shopping' && subPhase === 'pick' && (
          <div className="rounded-[2rem] border-4 p-4" style={{ borderColor: KID.ink, background: 'linear-gradient(180deg,#fffdf6,#fff)' }}>
            <p className="kid-font mb-3 text-center text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>Dein Einkaufszettel: {round.buyNames.join(', ')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {round.items.map((item, i) => (
                <ShelfItem key={i} item={item} inCart={cart.includes(item.name)} disabled={solved} onClick={() => tapItem(item)} />
              ))}
            </div>
          </div>
        )}

        {phase !== 'done' && subPhase === 'pay' && (
          <>
            <div className="rounded-[2rem] border-4 p-4 text-center" style={{ borderColor: KID.ink, background: 'linear-gradient(180deg,#fffdf6,#fff)' }}>
              <p className="kid-font text-sm font-extrabold uppercase tracking-wide" style={{ color: '#8a93a6' }}>{room.mode === 'change' ? 'Rueckgeld geben' : 'Zu bezahlen'}</p>
              <p className="kid-font text-4xl font-extrabold" style={{ color: KID.ink }}>{fmtMoney(target)}</p>
            </div>

            <div className="rounded-[2rem] border-4 p-4" style={{ borderColor: KID.ink, background: KID.band }}>
              <div className="flex min-h-[5rem] flex-wrap items-center justify-center gap-2">
                {tray.length === 0 ? <span className="kid-font text-lg font-bold" style={{ color: '#a48a52' }}>Tippe Muenzen, um sie hierher zu legen.</span>
                  : tray.map((c, i) => <Coin key={i} cents={c} small disabled onClick={() => {}} />)}
              </div>
              <p className="kid-font mt-2 text-center text-xl font-extrabold" style={{ color: KID.ink }}>Das macht zusammen: <span style={{ color: sum === target ? KID.greenDark : sum > target ? KID.coralDark : KID.blueDark }}>{fmtMoney(sum)}</span></p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {round.denoms.slice().sort((a, b) => a - b).map((d, i) => (<Coin key={i} cents={d} disabled={solved} onClick={() => addCoin(d)} />))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={removeLast} disabled={solved} className="kid-font min-h-[52px] rounded-2xl border-4 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.bandEdge }}>↶ Letzte weg</button>
              <button type="button" onClick={resetTray} disabled={solved} className="kid-font min-h-[52px] rounded-2xl border-4 px-4 py-2 text-lg font-extrabold transition-all active:translate-y-1 disabled:opacity-40" style={{ background: KID.card, borderColor: KID.ink, color: KID.ink, boxShadow: '0 4px 0 ' + KID.bandEdge }}>🗑️ Leeren</button>
              <BigButton onClick={check} color={KID.green} colorDark={KID.greenDark} disabled={solved}>✓ Bezahlen</BigButton>
            </div>
          </>
        )}

        {phase === 'roundDone' && (<BigButton onClick={nextRound} color={KID.blue} colorDark={KID.blueDark}>➡️ Naechster Einkauf!</BigButton>)}
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
            const modeIcon = room.mode === 'change' ? '💶' : room.mode === 'shopping' ? '🛒' : '🪙';
            const icon = done ? '⭐' : locked ? '🔒' : isLast ? '🏆' : modeIcon;
            return (
              <button key={room.roomId} type="button" disabled={locked} onClick={() => onStart(index)} className="rounded-[1.8rem] border-4 p-5 text-center transition-all active:translate-y-1 disabled:opacity-50" style={{ background: done ? '#e8f9e4' : KID.card, borderColor: KID.ink, boxShadow: '0 6px 0 ' + KID.bandEdge }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: done ? KID.green : locked ? '#dde3ec' : KID.sun }}>{icon}</div>
                <p className="mt-3 text-xl font-extrabold" style={{ color: KID.ink }}>{meta.title || 'Welt ' + (index + 1)}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: '#5d6b85' }}>{meta.purpose || room.objective}</p>
                <p className="mt-2 text-sm font-extrabold" style={{ color: '#8a93a6' }}>{room.rounds.length} Einkaeufe · {room.mode === 'change' ? 'Rueckgeld' : room.mode === 'shopping' ? 'einkaufen' : 'bezahlen'}</p>
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
      Meoluna.complete({ engine: 'money', world: SPEC.world.worldName });
    }
    setActiveRoomIndex(null);
  }

  if (activeRoomIndex !== null) {
    const room = SPEC.rooms[activeRoomIndex];
    const roomMeta = SPEC.world.rooms.find((e) => e.id === room.roomId) || {};
    return (<MoneyRoomScene key={room.roomId} room={room} roomMeta={roomMeta} stars={stars} streak={streak} onStreak={setStreak} onBack={() => setActiveRoomIndex(null)} onComplete={completeActiveRoom} onStar={() => setStars((v) => v + 1)} />);
  }
  return <Hub completedRooms={completedRooms} stars={stars} onStart={setActiveRoomIndex} />;
}
`;
}
