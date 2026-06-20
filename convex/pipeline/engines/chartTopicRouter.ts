export function isLikelyChartTopic(input: {
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
    "diagramm ablesen",
    "diagramm lesen",
    "balkendiagramm",
    "saeulendiagramm",
    "säulendiagramm",
    "piktogramm",
    "schaubild mit zahlen",
    "daten ablesen",
    "daten und haeufigkeit",
    "daten und häufigkeit",
    "haeufigkeiten",
    "häufigkeiten",
    "strichliste",
    "tabelle ablesen",
    "werte vergleichen diagramm",
    "wie viele zeigt das diagramm",
  ].some((needle) => text.includes(needle));
}
