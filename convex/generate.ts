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

## GAMIFICATION

- **XP-System**: +10 für richtig, +5 für teilweise richtig
- **Fortschrittsbalken**: Visuell ansprechend pro Modul
- **Achievements**: "Erstes Modul!", "Perfekte Runde!", "Alles richtig!"
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

## QUALITÄTSKONTROLLE

Bevor du antwortest, prüfe:
- [ ] Mindestens 5 Module vorhanden?
- [ ] Mindestens 15 verschiedene Aufgaben?
- [ ] Alle Aufgabentypen gemischt?
- [ ] Echte, korrekte Lerninhalte?
- [ ] SVG-Grafiken statt externe Bilder?
- [ ] XP und Fortschritt funktional?
- [ ] Code kompiliert fehlerfrei?
- [ ] Feedback bei JEDER Aufgabe vorhanden?
- [ ] KEIN Markdown in Strings (kein **, *, \`)?

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
