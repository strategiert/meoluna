export function isLikelyPatternTopic(input: {
  prompt: string;
  pdfText?: string;
  imageDescription?: string;
  subject?: string;
}): boolean {
  const text = [
    input.prompt,
    input.pdfText ?? "",
    input.imageDescription ?? "",
    input.subject ?? "",
  ].join("\n").toLowerCase();

  return [
    "muster",
    "musterfolge",
    "muster fortsetzen",
    "reihe fortsetzen",
    "reihenfolge fortsetzen",
    "was kommt als naechstes",
    "was kommt als nächstes",
    "abab",
    "abc-muster",
    "abc muster",
    "wiederholung erkennen",
    "regelmaessigkeit",
    "regelmäßigkeit",
    "fortsetzen der reihe",
    "logisches muster",
    "muster erkennen",
  ].some((needle) => text.includes(needle));
}
