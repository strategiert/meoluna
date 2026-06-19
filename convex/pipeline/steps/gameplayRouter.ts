import { callAnthropicJson } from "../utils/anthropicClient";
import type { LearningBrief } from "../engines/movementSpaceTypes";
import type { EngineName } from "../engines/engineRegistry";
import { ENGINE_NAMES } from "../engines/engineRegistry";

// LLM-Gameplay-Router (Spec-Schritt 3): wählt die passende Engine,
// wenn die Keyword-Router nichts Eindeutiges liefern. Billiger Sonnet-Call,
// Output ist ein validiertes Enum — bei Unsinn fällt er auf 'none' zurück.
const GAMEPLAY_ROUTER_SYSTEM_PROMPT = `Du bist der Gameplay-Router für Meoluna, eine Lern-App für Kinder.

Du bekommst eine Lern-Diagnose (LearningBrief) und wählst die passende Gameplay-Engine. Jede Engine ist ein stabiles, getestetes Spielprinzip:

- "movement-space": Bewegung auf Zahlenstrahl/Koordinaten. Für negative Zahlen, Addition/Subtraktion, Temperatur, Kontostand, Höhe/Tiefe, Richtungen, Distanzen.
- "mixing-balance": Mischen im Topf und Ausbalancieren einer Wippe. Für Brüche, Anteile, Verhältnisse, Mischungen, Gleichungen mit Lücke, Mengen ausgleichen.
- "building-construct": Bauen im Raster und Figuren aus Formen zusammensetzen. Für Geometrie, Fläche, Umfang, Maße, Formen erkennen, Einmaleins als Fläche.
- "time-sequence": Ereignis-Karten ordnen (Zeitband) und Ursache-Wirkungs-Ketten bauen. Für Lebenszyklen, Jahreszeiten, Epochen, Abläufe, Prozesse, Ursache und Wirkung, Geschichte.
- "detective-evidence": Beweis-Sätze im Text finden und Verdächtige per Indizien ausschließen. Für Leseverstehen, Textverständnis, Argumentieren, Schlussfolgern, Quellenarbeit.
- "sort-match": Karten in Körbe sortieren und Paare verbinden. Für Vokabeln (Fremdsprachen), Artikel der/die/das, Wortarten, Einzahl/Mehrzahl, Klassifikation (Tiere, Stoffe, Feste), gerade/ungerade.
- "word-builder": Wörter aus Buchstaben- oder Silben-Bausteinen zusammensetzen. Für Rechtschreibung, Silbentrennung, Lesenlernen, erstes Schreiben.
- "counting": Objekte zählen, Anzahl legen, Mengen vergleichen (mehr/weniger/gleich). Für Vorschule/Klasse 1, Zahlen bis 20, Mengenverständnis.
- "pattern": Muster erkennen und fortsetzen, fehlendes Teil in einer periodischen Reihe finden (ABAB, ABC, AABB). Für Vorschule/Klasse 1-2, Muster, Reihenfolgen, logisches Vorbereiten.
- "clock": Analoge Uhr lesen und Zeiger stellen (volle/halbe/Viertelstunden). Für Klasse 1-3, Uhrzeit, Zeit ablesen, Tagesablauf.
- "none": Kein Spielprinzip passt klar (z.B. freies Schreiben langer Texte, Musik mit Ton, offene Diskussionen, komplexe Experimente).

Wähle die Engine, deren Kern-Handlung das Lernproblem am direktesten ERLEBBAR macht. Im Zweifel zwischen zwei Engines: nimm die konkretere Handlung. Nur "none", wenn wirklich nichts passt.

Antworte ausschließlich als JSON:
{ "engine": "movement-space" | "mixing-balance" | "building-construct" | "time-sequence" | "detective-evidence" | "sort-match" | "word-builder" | "counting" | "pattern" | "clock" | "none", "reason": "ein kurzer Satz" }`;

export async function runGameplayRouter(input: {
  brief: LearningBrief;
}): Promise<{
  engine: EngineName | "none";
  reason: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await callAnthropicJson<{ engine: string; reason?: string }>({
    model: "claude-sonnet-4-6",
    systemPrompt: GAMEPLAY_ROUTER_SYSTEM_PROMPT,
    userMessage: JSON.stringify(input.brief),
    maxTokens: 300,
    temperature: 0,
  });

  const engine = (ENGINE_NAMES as string[]).includes(response.result.engine)
    ? (response.result.engine as EngineName)
    : "none";

  return {
    engine,
    reason: response.result.reason ?? "",
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  };
}
