// Statischer Validator für generierten/handgebauten Phaser-Spiel-Source.
// Frühwarnsystem — die Sicherheitsgrenze ist die iframe-Sandbox + CSP (Spec 5.5).
export type SourceValidation = { ok: boolean; violations: string[] };

export const FORBIDDEN_PATTERNS: Array<{ id: string; pattern: RegExp; message: string }> = [
  { id: "eval", pattern: /\beval\s*\(/, message: "eval ist verboten" },
  { id: "function-ctor", pattern: /\bnew\s+Function\b|\bFunction\s*\(/, message: "Function-Konstruktor ist verboten" },
  { id: "fetch", pattern: /\bfetch\s*\(/, message: "Netzwerkzugriff (fetch) ist verboten" },
  { id: "xhr", pattern: /\bXMLHttpRequest\b/, message: "XMLHttpRequest ist verboten" },
  { id: "websocket", pattern: /\bWebSocket\b|\bEventSource\b|\bRTCPeerConnection\b/, message: "Netzwerk-Sockets sind verboten" },
  { id: "beacon", pattern: /\bsendBeacon\b/, message: "sendBeacon ist verboten" },
  { id: "storage", pattern: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/, message: "Storage/Cookies sind verboten" },
  { id: "parent", pattern: /window\s*\.\s*(parent|top|opener)\b/, message: "Zugriff auf window.parent/top/opener ist verboten" },
  { id: "postmessage", pattern: /\bpostMessage\s*\(/, message: "postMessage ist verboten (nur die Bridge kommuniziert)" },
  { id: "worker", pattern: /\bnew\s+(Worker|SharedWorker)\b|\bserviceWorker\b|\bimportScripts\b/, message: "Worker sind verboten" },
  { id: "import-static", pattern: /^\s*import[\s{]/m, message: "Imports sind verboten (Phaser über window.Phaser)" },
  { id: "import-dynamic", pattern: /\bimport\s*\(/, message: "Dynamischer Import ist verboten" },
  { id: "require", pattern: /\brequire\s*\(/, message: "require ist verboten" },
  { id: "dom-escape", pattern: /document\.(write|body|documentElement)\b/, message: "DOM-Zugriff außerhalb des Containers ist verboten" },
  { id: "script-inject", pattern: /createElement\s*\(\s*["'`]script["'`]\s*\)/, message: "Script-Injection ist verboten" },
  { id: "media-devices", pattern: /\bgeolocation\b|\bmediaDevices\b|navigator\s*\.\s*clipboard\b|\bNotification\b/, message: "Geräte-APIs sind verboten" },
  { id: "math-random", pattern: /\bMath\s*\.\s*random\s*\(/, message: "Math.random ist verboten — seeded PRNG aus context.seed verwenden" },
  { id: "wall-clock", pattern: /\bDate\s*\.\s*now\s*\(|\bperformance\s*\.\s*now\s*\(|\bnew\s+Date\s*\(/, message: "Wanduhr-Zeit ist verboten — Phaser-Clock verwenden" },
];

export const MAX_SOURCE_BYTES = 250 * 1024;

export function validateGameSource(source: string, opts: { requiredGoalIds: string[] }): SourceValidation {
  const violations: string[] = [];
  const bytes = new TextEncoder().encode(source).length;
  if (bytes > MAX_SOURCE_BYTES) violations.push(`Source-Budget überschritten: ${bytes} > ${MAX_SOURCE_BYTES} Bytes`);

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(source)) violations.push(`FORBIDDEN(${rule.id}): ${rule.message}`);
  }

  if (!/export\s+(async\s+)?function\s+bootMeolunaGame\b|export\s*\{[^}]*\bbootMeolunaGame\b/.test(source)) {
    violations.push("Pflicht-Export bootMeolunaGame fehlt");
  }
  const gameCount = (source.match(/new\s+(window\s*\.\s*)?Phaser\s*\.\s*Game\s*\(/g) || []).length;
  if (gameCount !== 1) violations.push(`Phaser.Game muss genau 1x erzeugt werden (gefunden: ${gameCount})`);
  if (!/\bcompleteGame\s*\(/.test(source)) violations.push("completeGame-Aufruf fehlt");
  if (!/\bsetAffordances\s*\(/.test(source)) violations.push("setAffordances-Aufruf fehlt (Playthrough-Pflicht)");

  for (const goalId of opts.requiredGoalIds) {
    if (!source.includes(goalId)) violations.push(`Pflichtlernziel ${goalId} kommt im Source nicht vor (completeGoal-Bindung fehlt)`);
  }

  return { ok: violations.length === 0, violations };
}
