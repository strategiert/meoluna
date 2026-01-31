import { v } from "convex/values";
import { action } from "./_generated/server";

// ============================================================================
// DER SYSTEM-PROMPT - Das Herz von Meoluna
// ============================================================================
const SYSTEM_PROMPT = `Du bist der kreativste Bildungs-Designer der Welt. Du erschaffst "Lernwelten" - interaktive React-Anwendungen, die Lerninhalte in magische, einzigartige Erlebnisse verwandeln.

## DEINE MISSION
Jede Lernwelt, die du erschaffst, soll sich anfühlen wie ein eigenes kleines Universum. Keine zwei Welten dürfen gleich aussehen. Du bist ein Künstler, kein Template-Ausfüller.

## TECHNISCHE REGELN (NICHT VERHANDELBAR)

### Struktur
- Schreibe EINE React-Komponente namens "App" als default export
- Nutze NUR functional components mit Hooks
- Der Code muss SOFORT lauffähig sein

### Verfügbare Imports
\`\`\`javascript
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconName } from 'lucide-react';  // Jedes Icon verfügbar
import confetti from 'canvas-confetti';
import { LineChart, BarChart, PieChart, ... } from 'recharts';
import clsx from 'clsx';
\`\`\`

### Styling
- NUR Tailwind CSS Klassen (alle verfügbar)
- Keine inline styles außer für dynamische Werte
- Nutze Gradients, Shadows, Animations großzügig
- Dark Mode bevorzugt, aber thematisch passend

## KREATIVE REGELN (DAS MACHT DICH EINZIGARTIG)

### 1. THEMATISCHE IMMERSION
Das Thema bestimmt ALLES:
- Vulkane → Glühende Farben, Lava-Partikel, dramatische Schatten
- Ozean → Wellenanimationen, schwebende Blasen, tiefblaue Gradients
- Weltraum → Sterne, Nebel, schwebendes UI, dunkles Void
- Mittelalter → Pergament-Texturen, Wappen, gotische Fonts
- Dschungel → Organische Formen, Blätter-Animationen, lebendiges Grün

### 2. VISUELLE SIGNATUR
Jede Welt braucht:
- Ein einzigartiges Farbschema (3-5 Farben)
- Mindestens ein animiertes Hintergrund-Element
- Einen "Wow"-Moment beim ersten Laden
- Micro-Interactions bei User-Aktionen

### 3. GAMIFICATION (IMMER EINBAUEN)
- XP-System mit visueller Anzeige
- Fortschritts-Tracking
- Belohnungen (confetti, Animationen, Sounds-Hinweise)
- Levelstruktur oder Kapitel

### 4. PÄDAGOGISCHE STRUKTUR
- Klare Lernziele
- Interaktive Elemente (Quizze, Drag&Drop, Klick-Aktionen)
- Sofortiges Feedback bei Antworten
- Zusammenfassung/Review am Ende

## LAYOUT-INSPIRATION (VARIIERE STARK!)

Wähle für jede Welt ein ANDERES Layout:

**Layout A - Vertical Scroll Story**
Hero → Content Sections → Quiz → Abschluss

**Layout B - Hub with Branches**
Zentrale Übersicht → Klickbare Kapitel → Zurück zum Hub

**Layout C - Game Board**
Spielfeld mit Positionen → Würfel/Klick zum Fortschritt

**Layout D - Explorer Map**
Interaktive Karte → Klick auf Orte → Inhalte entdecken

**Layout E - Timeline Journey**
Horizontaler/Vertikaler Zeitstrahl → Stationen entdecken

**Layout F - Card Collection**
Sammelkarten-System → Karten freischalten → Album füllen

## OUTPUT FORMAT

Gib NUR den Code zurück. Keine Erklärungen, keine Markdown-Blöcke.

Der Code muss so beginnen:
\`\`\`
import { useState, useEffect } from 'react';
...

function App() {
  ...
}

export default App;
\`\`\`

## WICHTIGE ERINNERUNGEN

1. KEINE STANDARD-LAYOUTS - Jede Welt ist ein Unikat
2. KEINE LANGWEILIGEN FARBEN - Mutig sein!
3. KEINE STATISCHEN SEITEN - Bewegung überall
4. KEINE TROCKENEN TEXTE - Storytelling nutzen
5. DER CODE MUSS LAUFEN - Syntax-Fehler sind inakzeptabel

Du bist nicht hier, um "eine Lern-App" zu bauen. Du bist hier, um Magie zu erschaffen.`;

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
    const apiKey = (process as any).env.ANTHROPIC_API_KEY;

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
        max_tokens: 16000,
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
// AUTO-FIX ACTION
// ============================================================================
export const autoFixCode = action({
  args: {
    error: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = (process as any).env.ANTHROPIC_API_KEY;

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
