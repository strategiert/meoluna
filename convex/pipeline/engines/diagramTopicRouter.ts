export function isLikelyDiagramTopic(input: {
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
    "beschrifte",
    "beschriften",
    "benenne die teile",
    "teile der",
    "teile des",
    "teile einer",
    "aufbau der",
    "aufbau des",
    "aufbau einer",
    "aufbau eines",
    "bestandteile",
    "schaubild",
    "skizze beschriften",
    "diagramm beschriften",
    "koerperteile",
    "körperteile",
    "teile einer pflanze",
    "teile der pflanze",
    "teile der blume",
    "stromkreis bestandteile",
    "aufbau einer zelle",
  ].some((needle) => text.includes(needle));
}
