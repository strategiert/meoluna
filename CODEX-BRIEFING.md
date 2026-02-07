# CODEX-BRIEFING: Meoluna Pipeline V2 — Stand 07.02.2026

**Von:** Claude Code (Opus 4.6)
**Für:** Codex + jede andere KI die hier weiterarbeitet
**Kontext:** 6-Stunden-Session, Pipeline V2 + Minigame-Shift. Viele Bugs, wenig Fortschritt. Klaus ist frustriert.

---

## DIE VISION — LIES DAS ZUERST

### Was Meoluna SEIN soll

Meoluna ist **KEIN Quiz-Tool**. Meoluna ist **KEIN Arbeitsblatt-Generator**. Meoluna ist **KEIN E-Learning mit Multiple-Choice**.

Meoluna generiert **süchtig machende Minigames**, in denen Kinder lernen ohne zu merken, dass sie lernen. Denk an:
- Einen **Slider**, mit dem du den Winkel eines Laserstrahls einstellst um ein Ziel zu treffen (und nebenbei Trigonometrie lernst)
- Ein **Drag & Drop Spiel**, wo du Moleküle zusammenbaust (und nebenbei Chemie lernst)
- Eine **Sortier-Challenge**, wo du historische Ereignisse in die richtige Reihenfolge klickst (und nebenbei Geschichte lernst)
- Ein **Matching-Spiel**, wo du Vokabeln an Bilder pairst (und nebenbei Englisch lernst)

**NICHT:**
- "Frage 1: Was ist 3+4? A) 6 B) 7 C) 8" ← DAS IST VERBOTEN
- "Ordne die folgenden Begriffe zu:" mit starrem Dropdown ← LANGWEILIG
- "Berechne den Umfang eines Kreises:" ← SCHULE, NICHT SPIEL

### Klaus' eigene Worte:
> "Meoluna erstellt Minigames, keine Matheaufgaben. Man soll gar nicht erst das Gefühl bekommen für die Schule zu pauken."

> "Jedes Modul muss sich anfühlen wie ein eigenständiges Minigame. Sofortige Befriedigung, Dopamin-Hit bei richtiger Antwort."

### Warum das wichtig ist für Code-Entscheidungen

Wenn du an der Sandbox arbeitest, am Code-Generator, an der Pipeline — frag dich immer:
**"Würde ein 10-Jähriger das freiwillig spielen?"**

Wenn die Antwort nein ist, ist der Ansatz falsch. Keine Templates. Keine starren Strukturen. Keine "Aufgabe 1 von 5" Counter. Die Welten sollen sich lebendig anfühlen.

Das heißt NICHT, dass der Code chaotisch sein soll. Es heißt, dass die **generierte Erfahrung** kreativ und spielerisch sein muss. Der Code dahinter kann sauber und strukturiert sein.

---

## CHRONOLOGISCHES BUG-LOG

### Was passiert ist, Schritt für Schritt:

---

### Phase 1: Minigame-Shift (erfolgreich)

Alle 6 Pipeline-Prompts wurden umgeschrieben:
- `convex/pipeline/prompts/creativeDirector.ts` — "KERNPHILOSOPHIE: MINIGAMES, NICHT AUFGABEN!"
- `convex/pipeline/prompts/gameDesigner.ts` — Komplett neu mit Anti-Pattern-Liste
- `convex/pipeline/prompts/contentArchitect.ts` — "challenges" statt "tasks"
- `convex/pipeline/prompts/codeGenerator.ts` — Funktionierende Patterns für Slider, DnD, Matching, Sorting
- `convex/pipeline/prompts/qualityGate.ts` — Quiz-Module erkennen und flaggen
- `convex/pipeline/prompts/autoFix.ts` — Interaktive Bug-Patterns

**Commit:** `26763cf`

---

### Phase 2: Erster Test — Bug #1 🔴

**Klaus schickt Screenshot der Fehlerkonsole:**
> "Ich habe jetzt meoluna getestet und kriege direkt einen Kompilierungsfehler. 🌋"

```
index-B5cm4IAR.js:868 Constant "PI" on line 36 is being redeclared
/app.jsx: Identifier 'React' has already been declared (553:35)
```

**Was passiert war:** Generierter Code hat `import React from 'react'`. Sandbox transformiert das zu `const React = ...`. Aber der Sandbox-Wrapper hatte AUCH `const React = ...` → doppelte `const`-Deklaration. Gleich mit `PI` (p5.js Konstante).

**Fix:** Regex-Stripping für React-Imports und PI in `Sandbox.tsx`
**Commit:** `3f065d5`
**Ergebnis:** Fix hat den nächsten Bug erzeugt ↓

---

### Phase 3: JSX-Fehler — Bug #2 🔴

**Klaus schickt Fehlerkonsole:**
> "Kompilierungsfehler. Der Code konnte nicht verarbeitet werden."

```
/app.jsx: Expected corresponding JSX closing tag for <div>. (370:8)
```

**Was passiert war:** Generierter Code (Welt "Amerikanische Unabhängigkeit") hatte `</div>` statt `</motion.div>`. Außerdem: switch/case für renderTask hatte nur 5 von 10 Challenge-Typen.

**Klaus teilte die URL:** https://meoluna.com/w/j57bfyafg1939c1my33keg93h980nzjn

**Kein Fix** — Problem liegt im generierten Code. Der Validator (Pipeline Step 9) hätte das fangen sollen.

---

### Phase 4: Nur erste Aufgabe funktioniert — Bug #3 🔴

**Klaus schickt Screenshot der Welt "Völkerwanderung - Klasse 6":**
> "Leider auch bei der neuen Welt nur die erste Aufgabe geklappt."

Screenshot zeigte: Aufgabe 2 blieb bei **"Aufgabentyp wird geladen..."** stehen.

**Was passiert war:** Der generierte Code hatte 5 Typen im switch (multipleChoice, trueFalse, shortAnswer, fillBlanks, imageAnalysis), aber die Daten enthielten 10 Typen (sorting, imageMap, matching, mapInteraction, timeline FEHLTEN). Default-Case: "Aufgabentyp wird geladen..."

**Tiefere Erkenntnis:** Diese Welt wurde noch mit **V1 generiert** — V2 war zu diesem Zeitpunkt nicht auf Convex deployed!

---

### Phase 5: DER TEUERSTE BUG — Convex nicht deployed 🔴🔴🔴

**Klaus fragt:**
> "Erklärs mir. Wir haben eine Branch und ich habe V2 gepusht und alles in main gepusht. Wieso nimmt die App dann V1?"

**Und dann (frustriert):**
> "Haha, wieso hast du das nicht gemacht? Wir drehen uns seit Stunden im Kreis, weil du nicht dran gedacht hast, das wir eine Datenbank haben?"

**Was passiert war:** `git push` deployed nur das Frontend (Vercel). Convex Backend braucht ein SEPARATES `npx convex deploy --yes`. Das wurde nie gemacht. ALLE vorherigen Tests waren gegen V1.

**Fix:** `npx convex deploy --yes` + `npx convex env set FAL_API_KEY "..."`

**Lektion:** Stundenlang Symptome debuggt die alle darauf zurückgingen, dass V2 nicht auf Production lief.

---

### Phase 6: useState undefined — Bug #4 🔴

**Klaus schickt vollständige Konsolen-Ausgabe:**
> "Kompilierungsfehler. Der Code konnte nicht verarbeitet werden."

```
/app.jsx: Unexpected reserved word 'await'. (553:35)
ReferenceError: useState is not defined
```

**Was passiert war:** Der Fix aus Phase 2 (React-Import Stripping) hatte diese Zeile gestrippt:
```js
const _mod = await import("https://esm.sh/react@18.2.0");
const React = _mod.default;        // ← gestrippt!
```
Aber die nächste Zeile brauchte `_mod`:
```js
const { useState, useEffect } = _mod;  // ← _mod jetzt undefined!
```

**Fix:** Stripping komplett entfernt, Wrapper-Variablen umbenannt zu `__rdom`, `__react`, `_React`
**Commit:** `e5d530f`
**Ergebnis:** Fix hat den nächsten Bug erzeugt ↓

---

### Phase 7: React is not defined — Bug #5 🔴

**Klaus schickt Konsolen-Ausgabe:**
> "Wieder ein neuer Fehler."

```
ReferenceError: React is not defined
    at App (<anonymous>:406:5)
react-dom.production.min.js:189 ReferenceError: React is not defined
```

**Was passiert war:** Fix aus Phase 6 hat den Wrapper zu `_React` umbenannt. Aber Babel transpiliert JSX zu `React.createElement(...)` — und `React` war nicht im Scope weil:
1. Wrapper importierte als `_React` (nicht `React`)
2. Import kam NACH dem User-Code
3. Generierter Code hatte keinen eigenen React-Import

**Fix:** React und alle Hooks als `window.*` Globals laden VOR dem User-Code:
```js
const __preload = await import("https://esm.sh/react@18.2.0");
window.React = __preload.default;
window.useState = __preload.useState;
// ... etc
```
**Commit:** `5fe1b91`
**Status:** Deployed, aber **NICHT im Browser verifiziert!**

---

### Phase 8: Fehlender Weiter-Button — Bug #6 🔴

**Klaus' letzte Meldung der Session:**
> "Wieder ein neuer Fehler. Der Weiter-Button wurde wohl vergessen. Das System scheint inhaltlich keine guten Logikprozess zu folgen."

> "Ich weiß noch nicht mal ob V2 schon läuft. Sieht alles genau so aus wie V1 für mich."

**Was passiert war:** Diesmal kein Sandbox-Bug, sondern ein **Content-Problem**. Der generierte Code hatte keine Navigation zwischen Challenges/Modulen. Nutzer bleibt nach der ersten Aufgabe stecken.

Der Code-Generator-Prompt hat Anweisungen für Navigation (Hub → Modul → Challenges → Abschluss), aber der generierte Code implementiert das oft nicht.

**Kein Fix in dieser Session.**

---

### Bonus-Bug: Duplikat-Welten (entdeckt bei Pre-Flight-Check)

Jede V2-Welt wurde doppelt in der DB gespeichert: Pipeline Step 10 speichert + Save-Button speichert nochmal.

**Fix:** Save-Button navigiert jetzt nur noch zur bestehenden Welt.
**Commit:** `1ba2181`

---

## FIX-KETTENREAKTION

```
Bug #1: React already declared
  └→ Fix: Strip React imports (3f065d5)
      └→ Bug #4: useState undefined (_mod gestrippt)
          └→ Fix: Stop stripping, rename vars (e5d530f)
              └→ Bug #5: React is not defined (_React statt React)
                  └→ Fix: window.React vor User-Code (5fe1b91)
                      └→ Bug #6: Weiter-Button fehlt (Content-Problem)
```

**Root Cause:** Sandbox nutzt Regex-basiertes Import-Handling. Jeder Regex-Fix erzeugt Seiteneffekte.

---

## WAS OFFEN IST (Prioritätsreihenfolge)

### 1. V2 verifizieren — läuft es überhaupt?
- Convex Dashboard → `generationSessions` Tabelle prüfen
- Gibt es Sessions mit `status: "completed"`?
- Falls nein: Was geht schief?

### 2. Sandbox stabilisieren
- `window.React` Fix im Browser testen
- Langfristig: Weg von Regex → Import Maps oder Babel automatic runtime

### 3. Navigation im generierten Code
- Warum fehlt der Weiter-Button?
- Validator erweitern um Navigation-Check
- Oder: Navigation-Skeleton als Template

### 4. Generierte Welten inhaltlich prüfen
- Sind es Minigames oder Multiple-Choice?
- Kommen interaktive Elemente vor?

---

## TECHNISCHE REFERENZ

### Repo
`C:\Users\karent\Documents\Software\meoluna`
GitHub: `https://github.com/strategiert/meoluna`

### Deployments
- **Frontend:** Vercel (auto bei push auf main)
- **Backend:** Convex `helpful-blackbird-68.convex.cloud` (MANUELL: `npx convex deploy --yes`)

### Env Vars auf Convex Prod
- `ANTHROPIC_API_KEY` ✅
- `FAL_API_KEY` ✅

### Commits dieser Session (chronologisch)
| Commit | Was |
|---|---|
| `26763cf` | Minigame-Shift — Prompts umgestellt |
| `3f065d5` | Sandbox: React-Import + PI Stripping (hat Bug #4 erzeugt) |
| `e5d530f` | Sandbox: Stripping entfernt, sichere Vars (hat Bug #5 erzeugt) |
| `af17d2a` | Animierter Mond-Tab-Titel |
| `1ba2181` | Duplikat-Welten Fix |
| `5fe1b91` | Sandbox: window.React vor User-Code (aktueller Stand) |
| `29da269` | HANDOFF.md Übergabe-Dokument |

### Weitere Docs im Repo
- `HANDOFF.md` — Komplettes technisches Übergabe-Dokument
- `CLAUDE.md` — Projekt-Briefing, Agent-Koordination, Activity Log

---

## EMPFEHLUNG

Bevor du IRGENDETWAS am Code änderst:
1. **Öffne meoluna.com/create im Browser**
2. **Generiere eine Welt** (z.B. "Bruchrechnen Klasse 5")
3. **Schau was passiert** — läuft V2? Kommen Minigames? Funktioniert Navigation?
4. **Dann** entscheide was zu fixen ist

Jede Generierung kostet ~€4. Teste gründlich, bevor Klaus testen muss.
