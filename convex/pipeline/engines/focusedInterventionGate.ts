export type FocusedInterventionGateResult = {
  passed: boolean;
  violations: string[];
  score: number;
};

function hasAny(code: string, needles: string[]): boolean {
  const lower = code.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

export function runFocusedInterventionGate(code: string): FocusedInterventionGateResult {
  const violations: string[] = [];

  if (!code.includes("export default")) {
    violations.push("E_FOCUS_STRUCT_001: export default fehlt");
  }
  if (!code.includes("Meoluna.reportScore(") && !code.includes("window.Meoluna.reportScore(")) {
    violations.push("E_FOCUS_XP_001: Meoluna.reportScore fehlt");
  }
  if (!code.includes("Meoluna.completeModule(") && !code.includes("window.Meoluna.completeModule(")) {
    violations.push("E_FOCUS_XP_002: Meoluna.completeModule fehlt");
  }
  if (!/Meoluna\.complete(?!Module)\s*\(/.test(code)) {
    violations.push("E_FOCUS_XP_003: Meoluna.complete fehlt");
  }
  if (!hasAny(code, ["feedback", "setFeedback", "falsch", "wrong", "tip", "tipp"])) {
    violations.push("E_FOCUS_FEEDBACK_001: Feedback-Loop fehlt");
  }
  if (!hasAny(code, ["attempt", "versuch", "streak", "serie", "challenge", "übung", "uebung", "practice"])) {
    violations.push("E_FOCUS_PRACTICE_001: Uebungsloop fehlt");
  }
  if (!hasAny(code, ["onClick", "onPointer", "onMouse", "onChange", "draggable", "drag", "slider", "range", "marker", "setPosition"])) {
    violations.push("E_FOCUS_INTERACTION_001: sichtbare Interaktion fehlt");
  }
  if (!hasAny(code, ["xp", "diamant", "diamond", "abzeichen", "badge", "streak", "serie", "level"])) {
    violations.push("E_FOCUS_GAME_001: Gamification fehlt");
  }
  if (/<!DOCTYPE|<html[\s>]|<body[\s>]|<script\s+src=/i.test(code)) {
    violations.push("E_FOCUS_CODE_001: HTML-Dokument-Struktur ist im React-Code verboten");
  }

  return {
    passed: violations.length === 0,
    violations,
    score: Math.max(0, 10 - violations.length),
  };
}
