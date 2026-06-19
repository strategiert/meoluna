export function isLikelyClockTopic(input: {
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
    "uhr lesen",
    "uhrzeit",
    "uhrzeiten",
    "die uhr",
    "analoge uhr",
    "analoguhr",
    "zeiger",
    "wie spaet",
    "wie spät",
    "viertel nach",
    "viertel vor",
    "halb ",
    "volle stunde",
    "tageszeit lernen",
    "uhr stellen",
    "zeit ablesen",
  ].some((needle) => text.includes(needle));
}
