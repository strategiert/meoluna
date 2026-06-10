export function isLikelyDetectiveTopic(input: {
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
    "detektiv",
    "krimi",
    "textverständnis",
    "textverstaendnis",
    "leseverstehen",
    "leseverständnis",
    "leseverstaendnis",
    "lesekompetenz",
    "beweis",
    "indiz",
    "argument",
    "begründ",
    "begruend",
    "schlussfolger",
    "spurensuche",
    "belegen",
    "textstelle",
  ].some((needle) => text.includes(needle));
}
