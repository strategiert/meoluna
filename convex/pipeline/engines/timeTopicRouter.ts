export function isLikelyTimeTopic(input: {
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
    "zeitleiste",
    "zeitstrahl",
    "reihenfolge",
    "ablauf",
    "abläufe",
    "ablaeufe",
    "kreislauf",
    "lebenszyklus",
    "entwicklungsstufen",
    "ursache",
    "wirkung",
    "zuerst",
    "danach",
    "epochen",
    "mittelalter",
    "steinzeit",
    "jahreszeiten",
    "wasserkreislauf",
    "metamorphose",
    "vom ei zum",
    "historisch",
  ].some((needle) => text.includes(needle));
}
