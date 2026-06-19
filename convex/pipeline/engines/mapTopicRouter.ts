export function isLikelyMapTopic(input: {
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
    "himmelsrichtung",
    "himmelsrichtungen",
    "norden sueden osten westen",
    "norden süden osten westen",
    "karte lesen",
    "kartenlesen",
    "landkarte",
    "schatzkarte",
    "kompass",
    "orientierung im raum",
    "wegbeschreibung",
    "gitter karte",
    "koordinaten karte",
    "plan lesen",
    "orientierung karte",
  ].some((needle) => text.includes(needle));
}
