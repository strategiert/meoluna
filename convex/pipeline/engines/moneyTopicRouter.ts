export function isLikelyMoneyTopic(input: {
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
    "geld",
    "euro",
    "cent",
    "muenzen",
    "münzen",
    "bezahlen",
    "rueckgeld",
    "rückgeld",
    "wechselgeld",
    "einkaufen rechnen",
    "mit geld rechnen",
    "geldbetraege",
    "geldbeträge",
    "preise rechnen",
    "scheine und muenzen",
    "umgang mit geld",
  ].some((needle) => text.includes(needle));
}
