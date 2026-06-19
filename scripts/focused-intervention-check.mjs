import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const routerPath = resolve(root, "convex/pipeline/engines/focusedInterventionRouter.ts");
const gatePath = resolve(root, "convex/pipeline/engines/focusedInterventionGate.ts");
const orchestratorPath = resolve(root, "convex/pipeline/orchestrator.ts");

const { shouldUseFocusedIntervention } = await import(pathToFileURL(routerPath).href);
const { runFocusedInterventionGate } = await import(pathToFileURL(gatePath).href);

const failures = [];

const acutePrompt = {
  prompt: "Mein Kind versteht -66 + -33 nicht. Kannst du eine Mini App mit Gamification bauen?",
  subject: "mathematik",
  gradeLevel: "7",
};
const broadPrompt = {
  prompt: "Erstelle eine Lernwelt zum Thema Photosynthese für Klasse 7.",
  subject: "biologie",
  gradeLevel: "7",
};

if (!shouldUseFocusedIntervention(acutePrompt)) {
  failures.push("Acute child-understanding prompt must route to focused intervention.");
}
if (shouldUseFocusedIntervention(broadPrompt)) {
  failures.push("Broad curriculum topic must not route to focused intervention.");
}

const goodMiniApp = `
import { useState } from 'react';
export default function App() {
  const [attempts, setAttempts] = useState([]);
  const [feedback, setFeedback] = useState(null);
  function checkAnswer(value) {
    setAttempts([...attempts, value]);
    if (value === -99) {
      Meoluna.reportScore(10, { action: 'practice-correct' });
      Meoluna.completeModule('practice', 10);
      Meoluna.complete(40);
      setFeedback({ type: 'correct', message: 'Aus der Bewegung wird -66 + (-33) = -99.' });
    } else {
      setFeedback({ type: 'wrong', message: 'Beide Minuswege gehen nach Westen.' });
    }
  }
  return <div><button onClick={() => checkAnswer(-99)}>Marker setzen</button><div>XP Übung Feedback Marker Welt</div>{feedback?.message}</div>;
}`;

const badMiniApp = `
export default function App() {
  return <div><h1>Negative Zahlen</h1><p>-66 + -33 = -99</p></div>;
}`;

const goodGate = runFocusedInterventionGate(goodMiniApp);
const badGate = runFocusedInterventionGate(badMiniApp);

if (!goodGate.passed) {
  failures.push(`Expected good focused mini-app to pass, got: ${goodGate.violations.join(" | ")}`);
}
if (badGate.passed) {
  failures.push("Expected passive explanation app to fail focused gate.");
}

const orchestrator = readFileSync(orchestratorPath, "utf8");
const focusedIndex = orchestrator.indexOf("if (shouldUseFocusedIntervention(args))");
const engineIndex = orchestrator.indexOf("pickEngineByKeywords(args)");
const llmRouterIndex = orchestrator.indexOf("runGameplayRouter({ brief:");
// Universeller Fallback ist jetzt die Focused-Mini-App (kein altes
// Quiz-Skeleton mehr). Der letzte runFocusedWorld()-Aufruf ist der Fallback.
const fallbackIndex = orchestrator.lastIndexOf("return await runFocusedWorld()");
const helperIndex = orchestrator.indexOf("const runFocusedWorld = async");

if (focusedIndex === -1) {
  failures.push("generateWorldV2 must call shouldUseFocusedIntervention.");
}
if (helperIndex === -1) {
  failures.push("generateWorldV2 must define the runFocusedWorld helper.");
}
if (!(focusedIndex !== -1 && engineIndex !== -1 && focusedIndex < engineIndex)) {
  failures.push("Focused intervention route must run before the unified gameplay engine route.");
}
if (llmRouterIndex === -1) {
  failures.push("generateWorldV2 must fall back to the LLM gameplay router when keywords are silent.");
}
// Der Focused-Fallback muss NACH der Engine-Route stehen (universeller Fallback).
if (!(engineIndex !== -1 && fallbackIndex !== -1 && engineIndex < fallbackIndex)) {
  failures.push("Focused fallback must run after the gameplay engine route.");
}
// Sicherstellen, dass die alte Broad-Pipeline wirklich entfernt ist.
if (orchestrator.includes("runCodeGenerator") || orchestrator.includes("runCreativeDirector")) {
  failures.push("Old broad pipeline (codeGenerator/creativeDirector) must be removed.");
}

if (failures.length > 0) {
  console.error("Focused intervention check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Focused intervention check passed.");
