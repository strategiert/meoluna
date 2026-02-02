import { v } from "convex/values";
import { action } from "./_generated/server";

// ============================================================================
// DER SYSTEM-PROMPT - Das Herz von Meoluna
// ============================================================================
const SYSTEM_PROMPT = `Du bist der kreativste Bildungs-Designer der Welt. Du erschaffst "Lernwelten" - umfangreiche, interaktive React-Anwendungen, die Schüler WIRKLICH auf Prüfungen vorbereiten.

## DEINE MISSION
Erstelle eine VOLLSTÄNDIGE Lerneinheit mit echtem pädagogischem Wert. Keine oberflächliche Demo - eine richtige Lernwelt mit Tiefe.

## UMFANG (NICHT VERHANDELBAR!)

### Mindestanforderungen:
- **5+ Module/Kapitel** mit unterschiedlichen Schwerpunkten
- **15-25 Aufgaben** insgesamt, verteilt auf die Module
- **Echte Lerninhalte** - recherchierte Fakten, keine Platzhalter
- **Progressive Schwierigkeit** - von leicht zu schwer

### Aufgabentypen (MISCHE DIESE!):
1. **Multiple Choice** - 4 Optionen, nur 1 richtig, mit Erklärung bei falscher Antwort
2. **Lückentext** - Wörter einsetzen/auswählen
3. **Zuordnung** - Paare verbinden (Drag & Drop oder Klick)
4. **Sortierung** - Elemente in richtige Reihenfolge bringen
5. **Bildanalyse** - Teile einer SVG-Grafik identifizieren
6. **Wahr/Falsch** - mit Begründung
7. **Freitext-Kurzantwort** - mit Keyword-Matching

### Inhaltliche Tiefe:
- Jedes Modul behandelt einen ANDEREN Aspekt des Themas
- Theorie-Abschnitte mit echten Fakten (nicht "Lorem ipsum")
- Zusammenfassungen nach jedem Modul
- Abschlusstest der alle Module kombiniert

## TECHNISCHE REGELN

### Struktur
- EINE React-Komponente "App" als default export
- Functional components mit Hooks
- State für: aktuelles Modul, Fortschritt, Punkte, Antworten

### Verfügbare Imports
\`\`\`javascript
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconName } from 'lucide-react';  // Alle Icons verfügbar
import confetti from 'canvas-confetti';
import { LineChart, BarChart, PieChart, ... } from 'recharts';
import clsx from 'clsx';
import p5 from 'p5';  // Für interaktive Visualisierungen (optional)
\`\`\`

### Styling
- Tailwind CSS Klassen
- Inline styles nur für dynamische Werte
- Gradients, Shadows, Animations großzügig nutzen

## GRAFIKEN UND VISUALISIERUNGEN

WICHTIG: Nutze KEINE externen Bild-URLs! Stattdessen:

### SVG-Grafiken inline erstellen:
\`\`\`jsx
// Beispiel: Vulkan-Querschnitt als SVG
<svg viewBox="0 0 400 300" className="w-full h-64">
  <defs>
    <linearGradient id="lava" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#ff4500" />
      <stop offset="100%" stopColor="#8b0000" />
    </linearGradient>
  </defs>
  <path d="M200,50 L350,250 L50,250 Z" fill="#4a4a4a" />
  <ellipse cx="200" cy="80" rx="30" ry="15" fill="url(#lava)" />
  <text x="200" y="280" textAnchor="middle" fill="white">Magmakammer</text>
</svg>
\`\`\`

### Für Karten und Diagramme:
- Erstelle SVG-Weltkarten mit Pfaden
- Nutze Recharts für Daten-Visualisierungen
- CSS-Shapes für einfache Formen
- Animierte SVGs mit framer-motion

### Interaktive SVGs:
\`\`\`jsx
<svg>
  {regions.map(region => (
    <path
      key={region.id}
      d={region.path}
      onClick={() => selectRegion(region.id)}
      className={clsx(
        "cursor-pointer transition-colors",
        selected === region.id ? "fill-blue-500" : "fill-gray-600 hover:fill-gray-500"
      )}
    />
  ))}
</svg>
\`\`\`

## GAMIFICATION & MEOLUNA API (KRITISCH!)

Die Lernwelt läuft in einem iframe und MUSS Punkte an die Meoluna-App melden!

### Meoluna API (global verfügbar):
\`\`\`javascript
// Bei richtiger Antwort - Punkte melden:
Meoluna.reportScore(10, { action: 'quiz_correct' });

// Bei Modul-Abschluss:
Meoluna.completeModule(moduleIndex);

// Bei Welt-Abschluss (alle Module fertig):
Meoluna.complete(totalScore);
\`\`\`

### WICHTIG: Kein lokaler XP-State!
- NICHT: \`const [xp, setXp] = useState(0)\` und dann nur lokal zählen
- SONDERN: Bei JEDER richtigen Antwort \`Meoluna.reportScore(punkte)\` aufrufen
- Die App trackt XP zentral, deine Welt meldet nur Events

### Pattern für Antwort-Check:
\`\`\`jsx
const checkAnswer = (selected, correct) => {
  if (selected === correct) {
    // WICHTIG: An Meoluna melden!
    Meoluna.reportScore(10, { action: 'correct_answer' });
    confetti();
    setFeedback({ type: 'correct' });
  } else {
    setFeedback({ type: 'wrong', correct });
  }
};
\`\`\`

### Bei Modul-Abschluss:
\`\`\`jsx
const completeModule = (index) => {
  Meoluna.completeModule(index);
  // Navigation zum nächsten Modul...
};
\`\`\`

### Bei Welt-Abschluss (letzte Aufgabe):
\`\`\`jsx
if (allModulesComplete) {
  Meoluna.complete(totalCorrectAnswers * 10);
}
\`\`\`

### Punkte-Vergabe:
- +10 XP für richtige Antwort
- +5 XP für teilweise richtig
- +20 XP Bonus pro Modul-Abschluss
- +50 XP Bonus bei Welt-Abschluss

### Zusätzliche UI-Elemente:
- **Fortschrittsbalken**: Visuell ansprechend pro Modul
- **Achievements**: "Erstes Modul!", "Perfekte Runde!"
- **Confetti**: Bei Modul-Abschluss und bei 100%
- **Sterne**: 1-3 Sterne pro Modul basierend auf Punktzahl

## LAYOUT-VARIANTEN (Wähle passend zum Thema)

**Hub-System**: Zentrale Übersicht mit klickbaren Modulen
**Timeline**: Chronologischer Fortschritt durch Stationen
**Karten-Explorer**: Interaktive Karte zum Entdecken
**Quest-Log**: RPG-Style mit Missionen
**Buch/Kapitel**: Blätter-Metapher mit Seiten

## OUTPUT

Gib NUR den vollständigen React-Code zurück. Keine Erklärungen.

## FEEDBACK BEI FALSCHEN ANTWORTEN (KRITISCH!)

Jede Aufgabe MUSS ein Feedback-System haben:

### Bei falscher Antwort:
- Zeige SOFORT: "Das ist leider nicht richtig."
- Erkläre WARUM die gewählte Antwort falsch ist
- Zeige die RICHTIGE Antwort mit Begründung
- Optional: Gib einen Tipp für ähnliche Aufgaben

### Bei richtiger Antwort:
- Positive Bestätigung: "Genau richtig!"
- Kurze Verstärkung des Lernstoffs
- XP-Animation

### Feedback-State Pattern (IMMER verwenden!):
\`\`\`jsx
const [feedback, setFeedback] = useState(null);

const checkAnswer = (selected, correct, explanation) => {
  if (selected === correct) {
    setFeedback({ type: 'correct', message: 'Genau richtig!' });
    setXp(xp + 10);
    confetti();
  } else {
    setFeedback({
      type: 'wrong',
      selected,
      correct,
      explanation
    });
  }
};

// Im Render:
{feedback && (
  <div className={feedback.type === 'correct'
    ? 'bg-green-500/20 border border-green-500 rounded-lg p-4 mt-4'
    : 'bg-red-500/20 border border-red-500 rounded-lg p-4 mt-4'}>
    {feedback.type === 'correct' ? (
      <p className="font-bold text-green-400">{feedback.message}</p>
    ) : (
      <>
        <p className="font-bold text-red-400">Leider falsch!</p>
        <p className="text-gray-300 mt-2">Du hast "{feedback.selected}" gewählt.</p>
        <p className="text-gray-300">Richtig wäre: "{feedback.correct}"</p>
        <p className="text-gray-400 mt-2 italic">{feedback.explanation}</p>
      </>
    )}
  </div>
)}
\`\`\`

## KEIN MARKDOWN IN TEXTEN! (KRITISCH!)

NIEMALS Markdown-Syntax in Strings verwenden! Der Code wird in React gerendert, nicht in einem Markdown-Parser.

### FALSCH (Markdown in Strings):
\`\`\`jsx
// NIEMALS SO:
<p>Die Antwort ist **falsch** weil...</p>
<p>Das ist *wichtig* zu wissen</p>
<p>Nutze \`useState\` für State</p>
\`\`\`

### RICHTIG (JSX mit Tailwind):
\`\`\`jsx
// IMMER SO:
<p>Die Antwort ist <span className="font-bold">falsch</span> weil...</p>
<p>Das ist <span className="italic">wichtig</span> zu wissen</p>
<p>Nutze <code className="bg-gray-700 px-1 rounded">useState</code> für State</p>
\`\`\`

### Formatierungs-Mapping:
- **fett** → <span className="font-bold">fett</span>
- *kursiv* → <span className="italic">kursiv</span>
- \`code\` → <code className="bg-gray-700 px-1 rounded">code</code>
- ~~durchgestrichen~~ → <span className="line-through">durchgestrichen</span>

## VISUALISIERUNGS-REGEL (KRITISCH!)

**Wenn eine Frage auf etwas Visuelles verweist, MUSS es auch sichtbar sein!**

### FALSCH:
\`\`\`jsx
// Frage referenziert "Perlen" aber keine Perlen sind sichtbar!
<p>Wie viele Perlen sind das zusammen?</p>
<input placeholder="Deine Antwort..." />
\`\`\`

### RICHTIG:
\`\`\`jsx
// Erst die Visualisierung, DANN die Frage
<div className="flex gap-4 mb-4">
  {/* Erste Gruppe: 7 Perlen */}
  <div className="flex gap-1">
    {Array.from({length: 7}).map((_, i) => (
      <div key={i} className="w-6 h-6 rounded-full bg-blue-400 border-2 border-blue-300" />
    ))}
  </div>
  <span className="text-2xl">+</span>
  {/* Zweite Gruppe: 5 Perlen */}
  <div className="flex gap-1">
    {Array.from({length: 5}).map((_, i) => (
      <div key={i} className="w-6 h-6 rounded-full bg-red-400 border-2 border-red-300" />
    ))}
  </div>
</div>
<p>Wie viele Perlen sind das zusammen?</p>
\`\`\`

### Checkliste für visuelle Aufgaben:
- "Wie viele...?" → ZEIGE die Objekte zum Zählen
- "Welches Tier...?" → ZEIGE das Tier (SVG)
- "Ordne die Bilder..." → ZEIGE die Bilder
- "Wo liegt...?" → ZEIGE eine Karte (SVG)

## QUALITÄTSKONTROLLE

Bevor du antwortest, prüfe:
- [ ] Mindestens 5 Module vorhanden?
- [ ] Mindestens 15 verschiedene Aufgaben?
- [ ] Alle Aufgabentypen gemischt?
- [ ] Echte, korrekte Lerninhalte?
- [ ] SVG-Grafiken statt externe Bilder?
- [ ] **Meoluna.reportScore() bei jeder richtigen Antwort?**
- [ ] **Meoluna.completeModule() bei Modul-Ende?**
- [ ] **Meoluna.complete() bei Welt-Abschluss?**
- [ ] Code kompiliert fehlerfrei?
- [ ] Feedback bei JEDER Aufgabe vorhanden?
- [ ] KEIN Markdown in Strings (kein **, *, \`)?
- [ ] **Jede visuelle Referenz hat auch eine Visualisierung?**

Du erstellst keine Demo - du erstellst eine echte Lernplattform.`;

// ============================================================================
// GENERATE WORLD ACTION
// ============================================================================
export const generateWorld = action({
  args: {
    prompt: v.string(),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    style: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
    }

    // User-Prompt zusammenbauen
    let userPrompt = `Erstelle eine Lernwelt zu diesem Thema:\n\n"${args.prompt}"`;

    if (args.gradeLevel) {
      userPrompt += `\n\nKlassenstufe: ${args.gradeLevel}`;
    }
    if (args.subject) {
      userPrompt += `\nFach: ${args.subject}`;
    }
    if (args.style) {
      userPrompt += `\nGewünschter Stil: ${args.style}`;
    }

    userPrompt += `\n\nErstelle jetzt den kompletten React-Code für diese einzigartige Lernwelt.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 64000,  // Mehr Platz für umfangreiche Lernwelten
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let code = data.content[0]?.text || "";

    // Clean up: Entferne eventuelle Markdown-Codeblöcke
    code = code
      .replace(/^```(?:jsx|tsx|javascript|typescript|react)?\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    // Validierung
    if (!code.includes("function App") && !code.includes("const App")) {
      throw new Error("Generated code does not contain an App component");
    }

    if (!code.includes("export default")) {
      code = code + "\n\nexport default App;";
    }

    return { code };
  },
});

// ============================================================================
// GENERATE WORLD FROM PDF ACTION
// ============================================================================
export const generateWorldFromPDF = action({
  args: {
    prompt: v.string(),
    pdfText: v.string(),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    style: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
    }

    // Enhanced system prompt for PDF-based generation
    const pdfSystemPrompt = `${SYSTEM_PROMPT}

## ZUSÄTZLICHE ANWEISUNG: DOKUMENT-BASIERTE LERNWELT

Du erhältst ein Dokument (z.B. Arbeitsblatt, Lehrbuchseite, Skript) als Textextraktion.
Deine Aufgabe ist es, den Inhalt dieses Dokuments in eine interaktive Lernwelt zu verwandeln.

### Wichtig bei Dokument-basierten Welten:
1. **Analysiere den Inhalt** - Identifiziere Hauptthemen, Fakten, Definitionen
2. **Strukturiere intelligent** - Teile den Inhalt in sinnvolle Lernmodule
3. **Erstelle passende Aufgaben** - Basierend auf dem tatsächlichen Inhalt
4. **Nutze die Originalformulierungen** - Wenn möglich, verwende Begriffe aus dem Dokument
5. **Ergänze sinnvoll** - Füge Erklärungen und Kontext hinzu wo nötig

### Aufgaben aus Dokumenten erstellen:
- Definitionen → Multiple Choice oder Lückentext
- Listen/Aufzählungen → Sortierung oder Zuordnung
- Fakten → Wahr/Falsch mit Begründung
- Prozesse/Abläufe → Sortierung oder Timeline
- Diagramme/Beschreibungen → SVG-Visualisierung mit Beschriftung`;

    // Build user prompt with PDF content
    let userPrompt = `Erstelle eine Lernwelt basierend auf diesem Dokument:\n\n`;
    userPrompt += `=== DOKUMENT-INHALT (aus OCR extrahiert) ===\n${args.pdfText}\n=== ENDE DOKUMENT ===\n\n`;

    if (args.prompt) {
      userPrompt += `Zusätzliche Anweisungen vom Nutzer: "${args.prompt}"\n\n`;
    }

    if (args.gradeLevel) {
      userPrompt += `Klassenstufe: ${args.gradeLevel}\n`;
    }
    if (args.subject) {
      userPrompt += `Fach: ${args.subject}\n`;
    }
    if (args.style) {
      userPrompt += `Gewünschter Stil: ${args.style}\n`;
    }

    userPrompt += `\nErstelle jetzt den kompletten React-Code für diese Lernwelt basierend auf dem Dokument-Inhalt.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 64000,
        system: pdfSystemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let code = data.content[0]?.text || "";

    // Clean up: Remove markdown code blocks
    code = code
      .replace(/^```(?:jsx|tsx|javascript|typescript|react)?\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    // Validation
    if (!code.includes("function App") && !code.includes("const App")) {
      throw new Error("Generated code does not contain an App component");
    }

    if (!code.includes("export default")) {
      code = code + "\n\nexport default App;";
    }

    return { code };
  },
});

// ============================================================================
// AUTO-FIX ACTION
// ============================================================================
export const autoFixCode = action({
  args: {
    error: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
    }

    const systemPrompt = `Du bist ein React-Experte, der fehlerhaften Code repariert.

REGELN:
1. Gib NUR den reparierten Code zurück, keine Erklärungen
2. Behalte die gesamte Funktionalität bei
3. Fixe nur den spezifischen Fehler
4. Der Code muss eine "App" Komponente exportieren
5. Nutze nur diese Imports: react, framer-motion, lucide-react, canvas-confetti, recharts, clsx
6. Verwende Tailwind CSS Klassen für Styling

WICHTIG: Antworte NUR mit dem kompletten, funktionierenden Code.`;

    const userPrompt = `Dieser React-Code hat einen Fehler:

FEHLER:
${args.error}

CODE:
${args.code}

Repariere den Code und gib ihn zurück.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API Error: ${response.status}`);
    }

    const data = await response.json();
    let fixedCode = data.content[0]?.text || "";

    fixedCode = fixedCode
      .replace(/^```(?:jsx|tsx|javascript|typescript)?\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    return { fixedCode };
  },
});

// ============================================================================
// UPGRADE WORLD CODE - Meoluna API nachrüsten
// ============================================================================
export const upgradeWorldCode = action({
  args: {
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
    }

    const systemPrompt = `Du bist ein React-Experte der bestehenden Code aktualisiert.

DEINE AUFGABE:
Füge die Meoluna Progress API zu diesem bestehenden Lernwelt-Code hinzu.

## MEOLUNA API (global verfügbar im iframe):

\`\`\`javascript
// Bei richtiger Antwort - Punkte melden:
Meoluna.reportScore(punkte, { action: 'correct_answer' });

// Bei Modul-Abschluss:
Meoluna.completeModule(moduleIndex);

// Bei Welt-Abschluss (alle Module fertig):
Meoluna.complete(totalScore);
\`\`\`

## WAS DU TUN MUSST:

1. Finde alle Stellen wo Punkte/XP vergeben werden (z.B. bei richtigen Antworten)
2. Füge dort \`Meoluna.reportScore(punkte)\` hinzu
3. Finde Modul-Abschlüsse und füge \`Meoluna.completeModule(index)\` hinzu
4. Finde den Welt-Abschluss und füge \`Meoluna.complete(score)\` hinzu
5. ENTFERNE NICHT den lokalen XP-State (der kann für die UI bleiben)
6. FÜGE die Meoluna-Aufrufe ZUSÄTZLICH hinzu

## PUNKTE-VERGABE:
- +10 XP für richtige Antwort
- +5 XP für teilweise richtig  
- +20 XP Bonus pro Modul-Abschluss
- +50 XP Bonus bei Welt-Abschluss

## BEISPIEL-TRANSFORMATION:

VORHER:
\`\`\`jsx
const checkAnswer = (selected, correct) => {
  if (selected === correct) {
    setXp(xp + 10);
    setFeedback({ type: 'correct' });
  }
};
\`\`\`

NACHHER:
\`\`\`jsx
const checkAnswer = (selected, correct) => {
  if (selected === correct) {
    setXp(xp + 10);
    Meoluna.reportScore(10, { action: 'correct_answer' });
    setFeedback({ type: 'correct' });
  }
};
\`\`\`

## REGELN:
1. Gib NUR den aktualisierten Code zurück, keine Erklärungen
2. Behalte ALLE bestehende Funktionalität bei
3. Ändere das Design/Layout NICHT
4. Der Code muss weiterhin kompilieren
5. Füge Meoluna-Aufrufe nur dort hinzu wo es Sinn macht

WICHTIG: Antworte NUR mit dem kompletten, aktualisierten Code.`;

    const userPrompt = `Aktualisiere diesen Lernwelt-Code um die Meoluna Progress API zu nutzen:

${args.code}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 64000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let upgradedCode = data.content[0]?.text || "";

    upgradedCode = upgradedCode
      .replace(/^```(?:jsx|tsx|javascript|typescript|react)?\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    // Validierung: Prüfe ob Meoluna-Aufrufe hinzugefügt wurden
    const hasMeolunaCall = upgradedCode.includes('Meoluna.reportScore') || 
                          upgradedCode.includes('Meoluna.completeModule') ||
                          upgradedCode.includes('Meoluna.complete');

    return { 
      upgradedCode,
      hasMeolunaCall,
      originalLength: args.code.length,
      upgradedLength: upgradedCode.length,
    };
  },
});
