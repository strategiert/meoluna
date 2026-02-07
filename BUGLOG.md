# MEOLUNA — Chronologisches Bug-Log (06./07.02.2026)

**Agent:** Claude Code (Opus 4.6)
**Für:** Codex (Code-Review, nächste Fixes)
**Kontext:** Session über ~6 Stunden, Pipeline V2 + Minigame-Shift implementiert und versucht live zu testen.

---

## TIMELINE

### 1. Ausgangslage (Beginn der Session)

Pipeline V2 mit 10-Schritt-Orchestrierung war bereits implementiert (23 neue Dateien). Klaus hatte V1-Welten getestet und festgestellt: **"Das sind Matheaufgaben, keine Minigames."** Ziel der Session: Alle Prompts auf Minigame-Erlebnis umstellen und V2 live testen.

---

### 2. Minigame-Shift implementiert ✅

Alle 6 Pipeline-Prompts umgeschrieben:
- `convex/pipeline/prompts/creativeDirector.ts` — "KERNPHILOSOPHIE: MINIGAMES, NICHT AUFGABEN!"
- `convex/pipeline/prompts/gameDesigner.ts` — Komplett neu, Anti-Pattern-Liste, Minigame-Konzepte
- `convex/pipeline/prompts/contentArchitect.ts` — "challenges" statt "tasks", gameData-Struktur
- `convex/pipeline/prompts/codeGenerator.ts` — Funktionierende Patterns für Slider, DnD, Matching, Sorting
- `convex/pipeline/prompts/qualityGate.ts` — Quiz-Module erkennen und flaggen
- `convex/pipeline/prompts/autoFix.ts` — Interaktive Bug-Patterns

Commit: `26763cf` auf `feature/pipeline-v2`, dann gemergt in main.

---

### 3. BUG: "Identifier 'React' has already been declared" 🔴

**Klaus-Meldung (mit Screenshot der Fehlerkonsole):**
> "Ich habe jetzt meoluna getestet und kriege direkt einen Kompilierungsfehler. 🌋 Kompilierungsfehler..."

**Konsolen-Output von Klaus:**
```
index-B5cm4IAR.js:868 Constant "PI" on line 36 is being redeclared
/app.jsx: Identifier 'React' has already been declared (553:35)
```

**Analyse:** Der generierte Code importiert React (`import React, { useState } from 'react'`). Die Sandbox transformiert das zu `const React = (await import(...)).default`. Aber der Sandbox-Wrapper deklariert AUCH `const React = ...` → doppelte const-Deklaration im selben Scope. Gleich mit `PI` (p5.js Konflikt).

**Fix (Commit `3f065d5`):** Regex-Stripping für React-Imports und PI-Redeclarations in Sandbox.tsx hinzugefügt.

**→ Hat Bug #4 ausgelöst.**

---

### 4. BUG: JSX Closing-Tag Mismatch 🔴

**Klaus-Meldung (mit Fehlerkonsole):**
> "Kompilierungsfehler. Der Code konnte nicht verarbeitet werden."

```
/app.jsx: Expected corresponding JSX closing tag for <div>. (370:8)
```

**Analyse:** Generierter Code für "Amerikanische Unabhängigkeit - Klasse 8" hatte `</div>` statt `</motion.div>` an Zeile 368. Außerdem: Der renderTask switch/case hatte nur 5 von 10 Challenge-Typen implementiert.

**Kein Fix möglich** — Problem liegt im generierten Code selbst (Pipeline Step 8: Code Generator). Der Validator (Step 9) hätte das JSX-Matching prüfen sollen.

**Klaus teilte auch die URL:**
> https://meoluna.com/w/j57bfyafg1939c1my33keg93h980nzjn

---

### 5. BUG: "Aufgabentyp wird geladen..." — Nur Aufgabe 1 funktioniert 🔴

**Klaus-Meldung (mit Screenshot der Welt "Völkerwanderung - Klasse 6"):**
> "Leider auch bei der neuen Welt nur die erste Aufgabe geklappt."

Screenshot zeigte: Aufgabe 2 blieb bei "Aufgabentyp wird geladen..." stehen.

**Analyse:** Der generierte Code hatte einen `switch/case` mit 5 Typen (multipleChoice, trueFalse, shortAnswer, fillBlanks, imageAnalysis), aber die Daten enthielten 10 Typen (sorting, imageMap, matching, mapInteraction, timeline FEHLTEN). Default-Case: "Aufgabentyp wird geladen..."

**Tiefere Erkenntnis:** Diese Welt wurde noch mit **V1** generiert! V2 war zu dem Zeitpunkt nicht auf Convex deployed.

---

### 6. BUG: V2 nicht aktiv — Convex nicht deployed! 🔴🔴🔴

**Klaus-Meldung:**
> "Erklärs mir. Wir haben eine Branch und ich habe V2 gepusht und alles in main gepusht. Wieso nimmt die App dann V1?"

**Und dann:**
> "Haha, wieso hast du das nicht gemacht? Wir drehen uns seit Stunden im Kreis, weil du nicht dran gedacht hast, das wir eine Datenbank haben?"

**Ursache:** `git push` deployed nur das Frontend (Vercel). Convex Backend muss separat deployed werden mit `npx convex deploy --yes`. Das war nie gemacht worden.

**Fix:** `npx convex deploy --yes` ausgeführt. FAL_API_KEY auf Convex Prod gesetzt.

**Lektion:** DER teuerste Bug der Session. Stundenlang Symptome debuggt die alle darauf zurückgingen dass V2 gar nicht auf Production lief.

---

### 7. Klaus testet neue Welt — BUG: "useState is not defined" 🔴

**Klaus-Meldung (mit vollständiger Konsolen-Ausgabe):**
> "Kompilierungsfehler. Der Code konnte nicht verarbeitet werden."

```
/app.jsx: Unexpected reserved word 'await'. (553:35)
ReferenceError: useState is not defined
```

**Ursache:** Mein Fix aus Bug #3 (React-Import Stripping) war zu aggressiv. Er hat diese Zeile gestrippt:
```js
const _mod = await import("https://esm.sh/react@18.2.0");
const React = _mod.default;        // ← gestrippt!
```
Aber die nächste Zeile brauchte `_mod`:
```js
const { useState, useEffect } = _mod;  // ← _mod undefined!
```

**Fix (Commit `e5d530f`):**
1. React/ReactDOM Stripping komplett entfernt
2. Wrapper-Variablen umbenannt (`__rdom`, `__react`, `_React`, `_createRoot`)
3. Nur PI-Stripping beibehalten

**→ Hat Bug #8 ausgelöst.**

---

### 8. Klaus testet erneut — BUG: "React is not defined" 🔴

**Klaus-Meldung (mit Konsolen-Ausgabe):**
> "Wieder ein neuer Fehler."

```
ReferenceError: React is not defined
    at App (<anonymous>:406:5)
react-dom.production.min.js:189 ReferenceError: React is not defined
```

**Ursache:** Fix aus Bug #7 hat den Wrapper zu `_React` umbenannt. Aber:
1. Babel transpiliert JSX zu `React.createElement(...)` — braucht `React` im Scope
2. Wrapper importierte React als `_React` NACH dem User-Code
3. Generierter Code ohne eigenen React-Import → `React` undefined

**Fix (Commit `5fe1b91`):**
```js
// VOR dem User-Code:
const __preload = await import("https://esm.sh/react@18.2.0");
window.React = __preload.default;
window.useState = __preload.useState;
window.useEffect = __preload.useEffect;
// ... alle Hooks als window-Globals
```

**Status:** Committed und deployed. **NICHT im Browser verifiziert!**

---

### 9. Klaus testet letzte Version — BUG: Fehlender "Weiter"-Button 🔴

**Klaus-Meldung (letzter Test der Session):**
> "Wieder ein neuer Fehler. Der Weiter-Button wurde wohl vergessen. Das System scheint inhaltlich keine guten Logikprozess zu folgen."

**Und:**
> "Ich weiß noch nicht mal ob V2 schon läuft. Sieht alles genau so aus wie V1 für mich."

**Analyse:** Kein Sandbox-Bug mehr, sondern ein **Content-Problem**: Der generierte Code hat keine Navigation zwischen Challenges/Modulen. Nutzer bleibt nach der ersten Aufgabe stecken.

**Ursache:** Code-Generator-Prompt hat Anweisungen für Navigation (Hub → Modul → Challenges → Abschluss → Hub), aber der generierte Code implementiert das oft nicht. Der Prompt ist ~250 Zeilen lang — Navigation-Anweisungen gehen vermutlich unter.

**Fix:** Keiner in dieser Session. Architekturelles Problem.

---

### 8b. BONUS-BUG: Duplikat-Welten

**Entdeckt bei Pre-Flight-Check, nicht von Klaus gemeldet.**

Jede V2-generierte Welt wurde doppelt in der DB gespeichert: Pipeline Step 10 speichert + Save-Button in Create.tsx speichert nochmal.

**Fix (Commit `1ba2181`):** Save-Button navigiert jetzt nur noch zur bestehenden Welt statt neue zu erstellen.

---

## FIX-KETTENREAKTION (Visualisiert)

```
Bug 3: React already declared
  └→ Fix: Strip React imports (3f065d5)
      └→ Bug 7: useState undefined (_mod gestrippt)
          └→ Fix: Stop stripping, rename vars (e5d530f)
              └→ Bug 8: React is not defined (_React statt React)
                  └→ Fix: window.React vor User-Code (5fe1b91)
                      └→ Bug 9: Weiter-Button fehlt (Content-Problem, kein Sandbox-Bug)
```

---

## ROOT CAUSE ANALYSE

### Warum die Kettenreaktion?
Die Sandbox nutzt **Regex-basiertes Import-Handling**. Jeder Fix mit neuem Regex erzeugt Seiteneffekte weil:
- Generierter Code hat variable Patterns (mal `import React`, mal `import React, { useState }`, mal gar kein Import)
- Regex kann nicht alle Varianten abdecken
- Ein Workaround für Pattern A bricht Pattern B

### Nachhaltiger Fix (noch nicht implementiert):
1. **Babel `runtime: 'automatic'`** — JSX wird zu `_jsx()` statt `React.createElement()` transpiliert. React muss nicht mehr im Scope sein.
2. **Native Import Maps** (`<script type="importmap">`) — Browser resolved Imports selbst, kein Regex nötig.
3. **Kontrolliertes Template** — Generierter Code füllt nur Logik, Sandbox liefert React-Setup und Navigation.

### Warum V2 nie verifiziert wurde:
- Convex Deploy wurde mehrfach vergessen
- Kein automatischer Smoke-Test nach Deploy
- Keine Logging-Strategie um V1 vs V2 zu unterscheiden
- Kein Monitoring der `generationSessions`-Tabelle

---

## FÜR CODEX: NÄCHSTE SCHRITTE

1. **Browser auf machen, meoluna.com/create, eine Welt generieren** — funktioniert V2 überhaupt?
2. **Convex Dashboard checken** — gibt es `generationSessions` mit `status: completed`?
3. **Sandbox-Fix verifizieren** — `window.React` Ansatz im Browser testen
4. **Navigation-Problem lösen** — warum fehlt der Weiter-Button im generierten Code?
5. **Langfristig: Sandbox-Architektur überdenken** — weg von Regex, hin zu Import Maps oder automatic runtime
