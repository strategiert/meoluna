export function isLikelyCountingTopic(input: {
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
    "zählen",
    "zaehlen",
    "anzahl",
    "menge",
    "mengen",
    "wie viele",
    "mehr oder weniger",
    "mehr und weniger",
    "vergleichen von mengen",
    "zahlen bis 10",
    "zahlen bis 20",
    "zahlenraum bis 10",
    "zahlenraum bis 20",
    "mengenverständnis",
    "mengenverstaendnis",
    "vorschule mathe",
  ].some((needle) => text.includes(needle));
}
