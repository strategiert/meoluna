export function isLikelyMovementTopic(input: {
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

  if (/[+-]?\d+\s*[+-]\s*-?\d+/.test(text)) {
    return true;
  }

  return [
    "negative zahl",
    "negative zahlen",
    "zahlenstrahl",
    "koordinaten",
    "temperatur",
    "höhe",
    "hoehe",
    "tiefe",
    "kontostand",
    "schulden",
    "guthaben",
    "richtung",
    "distanz",
    "meter",
    "schritte",
    "ost",
    "west",
    "steigen",
    "sinken",
  ].some((needle) => text.includes(needle));
}
