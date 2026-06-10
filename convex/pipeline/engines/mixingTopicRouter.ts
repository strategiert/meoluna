export function isLikelyMixingTopic(input: {
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

  // Bruchschreibweise wie 3/4 oder 1/2 im Aufgabentext.
  if (/\b\d\s*\/\s*\d{1,2}\b/.test(text) && /(bruch|anteil|teil|pizza|kuchen|glas)/.test(text)) {
    return true;
  }

  return [
    "bruch",
    "brüche",
    "brueche",
    "bruchteil",
    "anteil",
    "anteile",
    "verhältnis",
    "verhaeltnis",
    "proportion",
    "mischung",
    "mischen",
    "mischverhältnis",
    "rezept",
    "gleichung",
    "gleichungen",
    "waage",
    "gleichgewicht",
    "ausgleichen",
    "ausbalancieren",
  ].some((needle) => text.includes(needle));
}
