# Meoluna Progress API

Die Meoluna API ist automatisch in allen generierten Lernwelten verfügbar. Sie ermöglicht es, Fortschritt, Punkte und Abschlüsse an Meoluna zu melden.

## Schnellstart

```tsx
// Bei richtiger Antwort: 10 Punkte
Meoluna.reportScore(10);

// Am Ende: Welt abschließen
Meoluna.complete();
```

## API Reference

### `Meoluna.reportScore(score, context?)`

Meldet Punkte an Meoluna. Die Punkte werden in XP umgerechnet und dem User-Fortschritt hinzugefügt.

```tsx
// Einfach
Meoluna.reportScore(10);

// Mit Kontext (für Analytics)
Meoluna.reportScore(10, { 
  action: 'quiz_correct',
  moduleIndex: 0 
});

// Verschiedene Punktwerte
Meoluna.reportScore(5);   // Kleine Belohnung
Meoluna.reportScore(25);  // Mittlere Belohnung
Meoluna.reportScore(100); // Große Belohnung
```

**Parameter:**
- `score` (number): Punktzahl > 0
- `context` (optional): 
  - `action`: String beschreibt die Aktion
  - `moduleIndex`: Welches Modul (0-basiert)

---

### `Meoluna.completeModule(moduleIndex)`

Markiert ein Modul als abgeschlossen. Gibt Bonus-XP.

```tsx
// Erstes Modul abgeschlossen
Meoluna.completeModule(0);

// Nach jedem Kapitel
const chapters = ['Einführung', 'Übungen', 'Quiz'];
chapters.forEach((_, index) => {
  // ... wenn Kapitel fertig ...
  Meoluna.completeModule(index);
});
```

**Parameter:**
- `moduleIndex` (number): 0-basierter Index des Moduls

---

### `Meoluna.complete(finalScore?)`

Markiert die gesamte Lernwelt als abgeschlossen. Sollte am Ende aufgerufen werden.

```tsx
// Einfacher Abschluss
Meoluna.complete();

// Mit Endscore
Meoluna.complete(totalPoints);

// Nach Erfolgsbildschirm
function handleGameWon() {
  showConfetti();
  Meoluna.complete(score);
}
```

**Parameter:**
- `finalScore` (optional, number): Endscore für Leaderboards

---

### `Meoluna.emit(eventType, amount, context?)`

Low-Level API für benutzerdefinierte Events.

```tsx
Meoluna.emit('score', 50, { action: 'bonus_collected' });
Meoluna.emit('module', 0, { moduleIndex: 2 });
Meoluna.emit('complete', 1000, {});
```

---

## Best Practices

### 1. Punkte bei jeder Interaktion melden

```tsx
function handleCorrectAnswer() {
  setScore(s => s + 10);
  Meoluna.reportScore(10, { action: 'correct_answer' });
}
```

### 2. Module logisch aufteilen

```tsx
// Quiz mit 3 Runden
function completeRound(roundIndex: number) {
  Meoluna.completeModule(roundIndex);
}
```

### 3. Abschluss nur einmal senden

```tsx
const [hasCompleted, setHasCompleted] = useState(false);

function handleWin() {
  if (!hasCompleted) {
    Meoluna.complete(totalScore);
    setHasCompleted(true);
  }
}
```

### 4. Punkte sinnvoll skalieren

| Aktion | Empfohlene Punkte |
|--------|-------------------|
| Richtige Antwort | 5-10 |
| Schnelle Antwort | +5 Bonus |
| Streak/Combo | 10-25 |
| Modul abgeschlossen | 25-50 |
| Perfektes Ergebnis | 50-100 |

---

## TypeScript Support

Die API ist vollständig typisiert:

```tsx
// In generierten Welten automatisch verfügbar
Meoluna.reportScore(10); // ✓ Typsicher

// Für lokale Entwicklung: Typ importieren
import type { MeolunaAPI } from '@/types/meoluna-api';
declare const Meoluna: MeolunaAPI;
```

---

## Debugging

Die API loggt Fehler in die Console:

```tsx
Meoluna.reportScore(-5);  // Wird ignoriert (score <= 0)
Meoluna.emit('invalid');  // Console warning
```

Version prüfen:
```tsx
console.log(Meoluna._version); // "1.0.0"
```

---

## Beispiel: Vollständiges Quiz

```tsx
function App() {
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questions = [...];

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      const points = 10;
      setScore(s => s + points);
      Meoluna.reportScore(points, { action: 'quiz_correct' });
    }
    
    if (currentQuestion === questions.length - 1) {
      // Letztes Quiz
      Meoluna.completeModule(0);
      Meoluna.complete(score);
    } else {
      setCurrentQuestion(q => q + 1);
    }
  };

  return (
    <div>
      <p>Punkte: {score}</p>
      <QuizQuestion 
        question={questions[currentQuestion]} 
        onAnswer={handleAnswer} 
      />
    </div>
  );
}
```
