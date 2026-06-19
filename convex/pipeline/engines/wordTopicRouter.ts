export function isLikelyWordTopic(input: {
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
    "rechtschreib",
    "richtig schreiben",
    "schreiben lernen",
    "schreibenlernen",
    "buchstabier",
    "buchstaben",
    "silbe",
    "silben",
    "silbentrennung",
    "lesen lernen",
    "lesenlernen",
    "leseanfang",
    "erstes lesen",
    "woerter bauen",
    "wörter bauen",
    "wort zusammensetzen",
    "abc",
  ].some((needle) => text.includes(needle));
}
