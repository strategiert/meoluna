export function isLikelySortTopic(input: {
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
    "vokabel",
    "englisch",
    "französisch",
    "franzoesisch",
    "spanisch",
    "wortart",
    "wortarten",
    "artikel",
    "der die das",
    "einzahl",
    "mehrzahl",
    "singular",
    "plural",
    "sortier",
    "zuordnen",
    "ordne zu",
    "zuordnung",
    "kategorie",
    "kategorien",
    "paare",
    "gerade und ungerade",
    "säugetier",
    "saeugetier",
  ].some((needle) => text.includes(needle));
}
