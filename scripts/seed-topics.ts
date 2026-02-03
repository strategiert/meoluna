/**
 * Beispiel-Themen für Meoluna seeden
 * Ausführen: npx ts-node scripts/seed-topics.ts
 * Oder: npx convex run curriculum:batchImportTopics --args '{...}'
 */

// Mathematik Grundschule (Klasse 1-4)
export const MATHE_GRUNDSCHULE = [
  // Klasse 1
  { gradeLevel: 1, name: "Zahlen bis 20", slug: "zahlen-bis-20", keywords: ["zählen", "zahlenraum", "mengen"] },
  { gradeLevel: 1, name: "Addition bis 10", slug: "addition-bis-10", keywords: ["plus", "addieren", "zusammenzählen"] },
  { gradeLevel: 1, name: "Subtraktion bis 10", slug: "subtraktion-bis-10", keywords: ["minus", "abziehen", "wegnehmen"] },
  { gradeLevel: 1, name: "Formen erkennen", slug: "formen-erkennen-1", keywords: ["kreis", "dreieck", "viereck", "geometrie"] },
  { gradeLevel: 1, name: "Größer und Kleiner", slug: "groesser-kleiner", keywords: ["vergleichen", "sortieren", "ordnen"] },

  // Klasse 2
  { gradeLevel: 2, name: "Zahlen bis 100", slug: "zahlen-bis-100", keywords: ["zahlenraum", "bündeln", "stellenwert"] },
  { gradeLevel: 2, name: "Addition bis 100", slug: "addition-bis-100", keywords: ["plus", "addieren", "rechnen"] },
  { gradeLevel: 2, name: "Subtraktion bis 100", slug: "subtraktion-bis-100", keywords: ["minus", "abziehen", "rechnen"] },
  { gradeLevel: 2, name: "Einmaleins (1x1 bis 5x10)", slug: "einmaleins-1-5", keywords: ["malrechnen", "multiplizieren", "mal"] },
  { gradeLevel: 2, name: "Uhrzeit lesen", slug: "uhrzeit-lesen", keywords: ["stunden", "minuten", "analog", "digital"] },
  { gradeLevel: 2, name: "Geld rechnen", slug: "geld-rechnen-2", keywords: ["euro", "cent", "bezahlen", "wechselgeld"] },

  // Klasse 3
  { gradeLevel: 3, name: "Zahlen bis 1000", slug: "zahlen-bis-1000", keywords: ["zahlenraum", "stellenwert", "hunderter"] },
  { gradeLevel: 3, name: "Schriftliche Addition", slug: "schriftliche-addition", keywords: ["untereinander", "übertrag", "addieren"] },
  { gradeLevel: 3, name: "Schriftliche Subtraktion", slug: "schriftliche-subtraktion", keywords: ["untereinander", "übertrag", "abziehen"] },
  { gradeLevel: 3, name: "Einmaleins (1x1 bis 10x10)", slug: "einmaleins-1-10", keywords: ["malrechnen", "multiplizieren", "kernaufgaben"] },
  { gradeLevel: 3, name: "Division mit Rest", slug: "division-mit-rest", keywords: ["teilen", "dividieren", "rest"] },
  { gradeLevel: 3, name: "Längen messen (cm, m, km)", slug: "laengen-messen", keywords: ["meter", "zentimeter", "kilometer", "umrechnen"] },
  { gradeLevel: 3, name: "Gewichte (g, kg)", slug: "gewichte", keywords: ["gramm", "kilogramm", "wiegen"] },

  // Klasse 4
  { gradeLevel: 4, name: "Zahlen bis 1.000.000", slug: "zahlen-bis-million", keywords: ["million", "stellenwert", "große zahlen"] },
  { gradeLevel: 4, name: "Schriftliche Multiplikation", slug: "schriftliche-multiplikation", keywords: ["malrechnen", "untereinander", "zwischenergebnis"] },
  { gradeLevel: 4, name: "Schriftliche Division", slug: "schriftliche-division", keywords: ["teilen", "untereinander", "rest"] },
  { gradeLevel: 4, name: "Brüche verstehen", slug: "brueche-verstehen", keywords: ["halb", "viertel", "anteil", "bruchteile"] },
  { gradeLevel: 4, name: "Geometrie: Flächen und Umfang", slug: "flaechen-umfang", keywords: ["rechteck", "quadrat", "berechnen"] },
  { gradeLevel: 4, name: "Sachaufgaben lösen", slug: "sachaufgaben-4", keywords: ["textaufgaben", "verstehen", "rechnen"] },
];

// Deutsch Grundschule (Klasse 1-4)
export const DEUTSCH_GRUNDSCHULE = [
  // Klasse 1
  { gradeLevel: 1, name: "Buchstaben lernen", slug: "buchstaben-lernen", keywords: ["abc", "alphabet", "laute"] },
  { gradeLevel: 1, name: "Erste Wörter lesen", slug: "erste-woerter-lesen", keywords: ["silben", "lesen", "verstehen"] },
  { gradeLevel: 1, name: "Wörter schreiben", slug: "woerter-schreiben-1", keywords: ["abschreiben", "schrift", "buchstaben"] },
  { gradeLevel: 1, name: "Reimwörter", slug: "reimwoerter", keywords: ["reimen", "klang", "gedichte"] },

  // Klasse 2
  { gradeLevel: 2, name: "Sätze lesen und verstehen", slug: "saetze-lesen-2", keywords: ["sinnerfassung", "lesen", "verstehen"] },
  { gradeLevel: 2, name: "Nomen und Artikel", slug: "nomen-artikel", keywords: ["namenwörter", "der die das", "großschreibung"] },
  { gradeLevel: 2, name: "Verben erkennen", slug: "verben-erkennen", keywords: ["tunwörter", "tätigkeiten", "zeitwörter"] },
  { gradeLevel: 2, name: "Geschichten schreiben", slug: "geschichten-schreiben-2", keywords: ["erzählen", "text", "kreativ"] },

  // Klasse 3
  { gradeLevel: 3, name: "Leseverständnis", slug: "leseverstaendnis-3", keywords: ["text", "fragen", "verstehen"] },
  { gradeLevel: 3, name: "Rechtschreibung: Doppelkonsonanten", slug: "doppelkonsonanten", keywords: ["nn", "mm", "ll", "tt", "regeln"] },
  { gradeLevel: 3, name: "Satzarten", slug: "satzarten", keywords: ["aussagesatz", "fragesatz", "ausrufesatz"] },
  { gradeLevel: 3, name: "Wortarten bestimmen", slug: "wortarten-3", keywords: ["nomen", "verb", "adjektiv"] },
  { gradeLevel: 3, name: "Aufsätze schreiben", slug: "aufsaetze-3", keywords: ["text", "struktur", "einleitung"] },

  // Klasse 4
  { gradeLevel: 4, name: "Leseverständnis (Sachtexte)", slug: "sachtexte-lesen", keywords: ["informationen", "verstehen", "zusammenfassen"] },
  { gradeLevel: 4, name: "Rechtschreibung: ie und i", slug: "ie-und-i", keywords: ["langer", "kurzer", "vokal", "regeln"] },
  { gradeLevel: 4, name: "Zeitformen des Verbs", slug: "zeitformen-verb", keywords: ["präsens", "präteritum", "perfekt", "futur"] },
  { gradeLevel: 4, name: "Satzglieder bestimmen", slug: "satzglieder", keywords: ["subjekt", "prädikat", "objekt"] },
  { gradeLevel: 4, name: "Berichte schreiben", slug: "berichte-schreiben", keywords: ["sachlich", "informieren", "w-fragen"] },
];

// Sachunterricht Grundschule (Klasse 1-4)
export const SACHUNTERRICHT_GRUNDSCHULE = [
  // Klasse 1
  { gradeLevel: 1, name: "Mein Körper", slug: "mein-koerper-1", keywords: ["körperteile", "sinne", "gesundheit"] },
  { gradeLevel: 1, name: "Die Jahreszeiten", slug: "jahreszeiten-1", keywords: ["frühling", "sommer", "herbst", "winter"] },
  { gradeLevel: 1, name: "Tiere und Pflanzen", slug: "tiere-pflanzen-1", keywords: ["natur", "lebewesen", "beobachten"] },

  // Klasse 2
  { gradeLevel: 2, name: "Wasser und seine Eigenschaften", slug: "wasser-eigenschaften", keywords: ["flüssig", "fest", "gas", "experiment"] },
  { gradeLevel: 2, name: "Zeit und Kalender", slug: "zeit-kalender", keywords: ["tag", "woche", "monat", "jahr"] },
  { gradeLevel: 2, name: "Mein Schulweg", slug: "schulweg", keywords: ["verkehr", "sicherheit", "regeln"] },

  // Klasse 3
  { gradeLevel: 3, name: "Unser Bundesland", slug: "bundesland", keywords: ["heimat", "region", "städte"] },
  { gradeLevel: 3, name: "Strom und Energie", slug: "strom-energie", keywords: ["elektrizität", "stromkreis", "sparen"] },
  { gradeLevel: 3, name: "Feuer und Verbrennung", slug: "feuer-verbrennung", keywords: ["flamme", "wärme", "sicherheit"] },

  // Klasse 4
  { gradeLevel: 4, name: "Deutschland", slug: "deutschland", keywords: ["bundesländer", "hauptstadt", "landkarte"] },
  { gradeLevel: 4, name: "Der menschliche Körper", slug: "menschlicher-koerper", keywords: ["organe", "verdauung", "kreislauf"] },
  { gradeLevel: 4, name: "Magnetismus", slug: "magnetismus", keywords: ["anziehen", "abstoßen", "kompass"] },
  { gradeLevel: 4, name: "Medien und Internet", slug: "medien-internet", keywords: ["digital", "sicherheit", "recherche"] },
];

// Englisch Grundschule (Klasse 3-4)
export const ENGLISCH_GRUNDSCHULE = [
  // Klasse 3
  { gradeLevel: 3, name: "Colours and Numbers", slug: "colours-numbers", keywords: ["farben", "zahlen", "englisch"] },
  { gradeLevel: 3, name: "Animals", slug: "animals-3", keywords: ["tiere", "pets", "farm animals"] },
  { gradeLevel: 3, name: "My Family", slug: "my-family", keywords: ["familie", "mother", "father", "sister"] },
  { gradeLevel: 3, name: "Food and Drinks", slug: "food-drinks", keywords: ["essen", "trinken", "fruit", "vegetables"] },

  // Klasse 4
  { gradeLevel: 4, name: "My Day / Daily Routine", slug: "my-day", keywords: ["tagesablauf", "morning", "evening"] },
  { gradeLevel: 4, name: "Clothes and Weather", slug: "clothes-weather", keywords: ["kleidung", "wetter", "seasons"] },
  { gradeLevel: 4, name: "At School", slug: "at-school", keywords: ["schule", "classroom", "subjects"] },
  { gradeLevel: 4, name: "Hobbies and Sports", slug: "hobbies-sports", keywords: ["freizeit", "spielen", "activities"] },
];

// Für Convex-Import formatieren
export function formatForConvex(topics: typeof MATHE_GRUNDSCHULE, subjectSlug: string) {
  return topics.map(t => ({
    subjectSlug,
    name: t.name,
    slug: t.slug,
    gradeLevel: t.gradeLevel,
    bundesland: null, // bundesweit
    keywords: t.keywords,
    competencies: [],
    sourceUrl: null,
  }));
}

// Export für direkten Import
export const ALL_TOPICS = [
  ...formatForConvex(MATHE_GRUNDSCHULE, "mathematik"),
  ...formatForConvex(DEUTSCH_GRUNDSCHULE, "deutsch"),
  ...formatForConvex(SACHUNTERRICHT_GRUNDSCHULE, "sachunterricht"),
  ...formatForConvex(ENGLISCH_GRUNDSCHULE, "englisch"),
];

console.log(`Total topics to import: ${ALL_TOPICS.length}`);
console.log(JSON.stringify({ topics: ALL_TOPICS }, null, 2));
