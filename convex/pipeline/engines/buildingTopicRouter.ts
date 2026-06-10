export function isLikelyBuildingTopic(input: {
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
    "geometrie",
    "fläche",
    "flaeche",
    "flächeninhalt",
    "flaecheninhalt",
    "umfang",
    "rechteck",
    "quadrat",
    "dreieck",
    "formen",
    "körper",
    "koerper",
    "symmetrie",
    "tangram",
    "zusammensetzen",
    "zerlegen",
  ].some((needle) => text.includes(needle));
}
