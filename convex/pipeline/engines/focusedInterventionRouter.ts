export type InterventionContextAnswers = {
  intent?: string;
  audience?: string;
  guidance?: string;
};

export function shouldUseFocusedIntervention(input: {
  prompt: string;
  pdfText?: string;
  imageDescription?: string;
  subject?: string;
  contextAnswers?: InterventionContextAnswers;
}): boolean {
  const text = [
    input.prompt,
    input.pdfText ?? "",
    input.imageDescription ?? "",
    input.subject ?? "",
  ].join("\n").toLowerCase();

  const acuteSignals = [
    "mein kind versteht",
    "kind versteht",
    "ich verstehe",
    "versteht nicht",
    "nicht verstanden",
    "sofort verständlich",
    "sofort verstaendlich",
    "mini app",
    "mini-app",
    "gamification",
    "hausaufgabe",
    "aufgabe",
    "erklär",
    "erklaer",
    "erkläre",
    "erklaere",
    "hilfe bei",
    "wie rechne ich",
    "wie löse ich",
    "wie loese ich",
  ];

  if (acuteSignals.some((signal) => text.includes(signal))) {
    return true;
  }

  if (/[+-]?\d+\s*[+\-*/:]\s*\(?\s*[+-]?\d+/.test(text)) {
    return true;
  }

  if (input.contextAnswers?.intent === "understand-now") {
    return true;
  }

  return false;
}

export function contextAnswersToPrompt(contextAnswers?: InterventionContextAnswers): string {
  if (!contextAnswers) {
    return "Keine Zusatzantworten. Nutze Standard: sofort verstehen, Kind/Schueler, sehr gefuehrt.";
  }

  const intentLabel =
    contextAnswers.intent === "practice"
      ? "Ueben"
      : contextAnswers.intent === "prepare-test"
        ? "Klassenarbeit vorbereiten"
        : "Sofort verstehen";
  const audienceLabel =
    contextAnswers.audience === "parent"
      ? "Elternteil hilft"
      : contextAnswers.audience === "teacher"
        ? "Lehrkraft"
        : "Kind / Schueler";
  const guidanceLabel =
    contextAnswers.guidance === "challenge"
      ? "Mehr Herausforderung"
      : contextAnswers.guidance === "normal"
        ? "Normal"
        : "Sehr gefuehrt";

  return [
    `Ziel: ${intentLabel}`,
    `Nutzerrolle: ${audienceLabel}`,
    `Fuehrung: ${guidanceLabel}`,
  ].join("\n");
}
