import { useEffect, useState } from 'react';

// Zweistufiger Analytics-Consent (§25 TDDDG): Banner nur solange keine Entscheidung
// in localStorage ('ml_consent') liegt. Beide Buttons optisch gleichwertig (kein Dark
// Pattern). Feuert 'ml-consent'-CustomEvent für den Beacon in index.html.
const KEY = 'ml_consent';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== 'granted' && v !== 'denied') setVisible(true);
    } catch {
      /* Storage gesperrt */
    }
  }, []);

  if (!visible) return null;

  const choose = (choice: 'granted' | 'denied') => {
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      /* egal */
    }
    setVisible(false);
    window.dispatchEvent(new CustomEvent('ml-consent', { detail: choice }));
  };

  const btn: React.CSSProperties = {
    flex: 1,
    padding: '9px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    border: '1px solid #6366f1',
    background: '#6366f1',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
  };

  return (
    <div
      role="region"
      aria-label="Hinweis zur Reichweitenmessung"
      style={{
        position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 9999,
        maxWidth: 560, margin: '0 auto', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,.12)', padding: '14px 16px',
        fontSize: '0.875rem', color: '#111827',
      }}
    >
      <p style={{ margin: '0 0 10px', lineHeight: 1.5 }}>
        Wir messen Besuche anonym und ohne Cookies. Mit Ihrer Zustimmung speichern wir
        zusätzlich eine zufällige ID auf Ihrem Gerät, um Sie beim nächsten Besuch
        wiederzuerkennen und Meoluna zu verbessern.{' '}
        <a href="/privacy" style={{ color: '#6366f1' }}>Mehr in der Datenschutzerklärung</a>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Beide Buttons identisch — bewusst kein hervorgehobener "Akzeptieren"-Button */}
        <button type="button" style={btn} onClick={() => choose('denied')}>Ablehnen</button>
        <button type="button" style={btn} onClick={() => choose('granted')}>Akzeptieren</button>
      </div>
    </div>
  );
}
