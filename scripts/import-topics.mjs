// Themen-Import für Meoluna
// Ausführen: node scripts/import-topics.mjs

const TOPICS = [
  // === MATHEMATIK KLASSE 1 ===
  { s: "mathematik", g: 1, n: "Zahlen bis 20", k: ["zählen", "zahlenraum", "mengen"] },
  { s: "mathematik", g: 1, n: "Addition bis 10", k: ["plus", "addieren", "zusammenzählen"] },
  { s: "mathematik", g: 1, n: "Subtraktion bis 10", k: ["minus", "abziehen", "wegnehmen"] },
  { s: "mathematik", g: 1, n: "Formen erkennen", k: ["kreis", "dreieck", "viereck", "geometrie"] },
  { s: "mathematik", g: 1, n: "Größer und Kleiner", k: ["vergleichen", "sortieren", "ordnen"] },

  // === MATHEMATIK KLASSE 2 ===
  { s: "mathematik", g: 2, n: "Zahlen bis 100", k: ["zahlenraum", "bündeln", "stellenwert"] },
  { s: "mathematik", g: 2, n: "Addition bis 100", k: ["plus", "addieren", "rechnen"] },
  { s: "mathematik", g: 2, n: "Subtraktion bis 100", k: ["minus", "abziehen", "rechnen"] },
  { s: "mathematik", g: 2, n: "Einmaleins (1x1 bis 5x10)", k: ["malrechnen", "multiplizieren", "mal"] },
  { s: "mathematik", g: 2, n: "Uhrzeit lesen", k: ["stunden", "minuten", "analog", "digital"] },
  { s: "mathematik", g: 2, n: "Geld rechnen", k: ["euro", "cent", "bezahlen", "wechselgeld"] },

  // === MATHEMATIK KLASSE 3 ===
  { s: "mathematik", g: 3, n: "Zahlen bis 1000", k: ["zahlenraum", "stellenwert", "hunderter"] },
  { s: "mathematik", g: 3, n: "Schriftliche Addition", k: ["untereinander", "übertrag", "addieren"] },
  { s: "mathematik", g: 3, n: "Schriftliche Subtraktion", k: ["untereinander", "übertrag", "abziehen"] },
  { s: "mathematik", g: 3, n: "Einmaleins (1x1 bis 10x10)", k: ["malrechnen", "multiplizieren", "kernaufgaben"] },
  { s: "mathematik", g: 3, n: "Division mit Rest", k: ["teilen", "dividieren", "rest"] },
  { s: "mathematik", g: 3, n: "Längen messen (cm, m, km)", k: ["meter", "zentimeter", "kilometer", "umrechnen"] },
  { s: "mathematik", g: 3, n: "Gewichte (g, kg)", k: ["gramm", "kilogramm", "wiegen"] },

  // === MATHEMATIK KLASSE 4 ===
  { s: "mathematik", g: 4, n: "Zahlen bis 1.000.000", k: ["million", "stellenwert", "große zahlen"] },
  { s: "mathematik", g: 4, n: "Schriftliche Multiplikation", k: ["malrechnen", "untereinander", "zwischenergebnis"] },
  { s: "mathematik", g: 4, n: "Schriftliche Division", k: ["teilen", "untereinander", "rest"] },
  { s: "mathematik", g: 4, n: "Brüche verstehen", k: ["halb", "viertel", "anteil", "bruchteile"] },
  { s: "mathematik", g: 4, n: "Geometrie: Flächen und Umfang", k: ["rechteck", "quadrat", "berechnen"] },
  { s: "mathematik", g: 4, n: "Sachaufgaben lösen", k: ["textaufgaben", "verstehen", "rechnen"] },

  // === DEUTSCH KLASSE 1 ===
  { s: "deutsch", g: 1, n: "Buchstaben lernen", k: ["abc", "alphabet", "laute"] },
  { s: "deutsch", g: 1, n: "Erste Wörter lesen", k: ["silben", "lesen", "verstehen"] },
  { s: "deutsch", g: 1, n: "Wörter schreiben", k: ["abschreiben", "schrift", "buchstaben"] },
  { s: "deutsch", g: 1, n: "Reimwörter", k: ["reimen", "klang", "gedichte"] },

  // === DEUTSCH KLASSE 2 ===
  { s: "deutsch", g: 2, n: "Sätze lesen und verstehen", k: ["sinnerfassung", "lesen", "verstehen"] },
  { s: "deutsch", g: 2, n: "Nomen und Artikel", k: ["namenwörter", "der die das", "großschreibung"] },
  { s: "deutsch", g: 2, n: "Verben erkennen", k: ["tunwörter", "tätigkeiten", "zeitwörter"] },
  { s: "deutsch", g: 2, n: "Geschichten schreiben", k: ["erzählen", "text", "kreativ"] },

  // === DEUTSCH KLASSE 3 ===
  { s: "deutsch", g: 3, n: "Leseverständnis", k: ["text", "fragen", "verstehen"] },
  { s: "deutsch", g: 3, n: "Rechtschreibung: Doppelkonsonanten", k: ["nn", "mm", "ll", "tt", "regeln"] },
  { s: "deutsch", g: 3, n: "Satzarten", k: ["aussagesatz", "fragesatz", "ausrufesatz"] },
  { s: "deutsch", g: 3, n: "Wortarten bestimmen", k: ["nomen", "verb", "adjektiv"] },
  { s: "deutsch", g: 3, n: "Aufsätze schreiben", k: ["text", "struktur", "einleitung"] },

  // === DEUTSCH KLASSE 4 ===
  { s: "deutsch", g: 4, n: "Leseverständnis (Sachtexte)", k: ["informationen", "verstehen", "zusammenfassen"] },
  { s: "deutsch", g: 4, n: "Rechtschreibung: ie und i", k: ["langer", "kurzer", "vokal", "regeln"] },
  { s: "deutsch", g: 4, n: "Zeitformen des Verbs", k: ["präsens", "präteritum", "perfekt", "futur"] },
  { s: "deutsch", g: 4, n: "Satzglieder bestimmen", k: ["subjekt", "prädikat", "objekt"] },
  { s: "deutsch", g: 4, n: "Berichte schreiben", k: ["sachlich", "informieren", "w-fragen"] },

  // === SACHUNTERRICHT KLASSE 1 ===
  { s: "sachunterricht", g: 1, n: "Mein Körper", k: ["körperteile", "sinne", "gesundheit"] },
  { s: "sachunterricht", g: 1, n: "Die Jahreszeiten", k: ["frühling", "sommer", "herbst", "winter"] },
  { s: "sachunterricht", g: 1, n: "Tiere und Pflanzen", k: ["natur", "lebewesen", "beobachten"] },

  // === SACHUNTERRICHT KLASSE 2 ===
  { s: "sachunterricht", g: 2, n: "Wasser und seine Eigenschaften", k: ["flüssig", "fest", "gas", "experiment"] },
  { s: "sachunterricht", g: 2, n: "Zeit und Kalender", k: ["tag", "woche", "monat", "jahr"] },
  { s: "sachunterricht", g: 2, n: "Mein Schulweg", k: ["verkehr", "sicherheit", "regeln"] },

  // === SACHUNTERRICHT KLASSE 3 ===
  { s: "sachunterricht", g: 3, n: "Unser Bundesland", k: ["heimat", "region", "städte"] },
  { s: "sachunterricht", g: 3, n: "Strom und Energie", k: ["elektrizität", "stromkreis", "sparen"] },
  { s: "sachunterricht", g: 3, n: "Feuer und Verbrennung", k: ["flamme", "wärme", "sicherheit"] },

  // === SACHUNTERRICHT KLASSE 4 ===
  { s: "sachunterricht", g: 4, n: "Deutschland", k: ["bundesländer", "hauptstadt", "landkarte"] },
  { s: "sachunterricht", g: 4, n: "Der menschliche Körper", k: ["organe", "verdauung", "kreislauf"] },
  { s: "sachunterricht", g: 4, n: "Magnetismus", k: ["anziehen", "abstoßen", "kompass"] },
  { s: "sachunterricht", g: 4, n: "Medien und Internet", k: ["digital", "sicherheit", "recherche"] },

  // === ENGLISCH KLASSE 3 ===
  { s: "englisch", g: 3, n: "Colours and Numbers", k: ["farben", "zahlen", "englisch"] },
  { s: "englisch", g: 3, n: "Animals", k: ["tiere", "pets", "farm animals"] },
  { s: "englisch", g: 3, n: "My Family", k: ["familie", "mother", "father", "sister"] },
  { s: "englisch", g: 3, n: "Food and Drinks", k: ["essen", "trinken", "fruit", "vegetables"] },

  // === ENGLISCH KLASSE 4 ===
  { s: "englisch", g: 4, n: "My Day / Daily Routine", k: ["tagesablauf", "morning", "evening"] },
  { s: "englisch", g: 4, n: "Clothes and Weather", k: ["kleidung", "wetter", "seasons"] },
  { s: "englisch", g: 4, n: "At School", k: ["schule", "classroom", "subjects"] },
  { s: "englisch", g: 4, n: "Hobbies and Sports", k: ["freizeit", "spielen", "activities"] },
];

// Zu Slug konvertieren
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Formatieren für Convex
const formatted = TOPICS.map(t => ({
  subjectSlug: t.s,
  name: t.n,
  slug: slugify(t.n),
  gradeLevel: t.g,
  bundesland: null,
  keywords: t.k,
  competencies: [],
  sourceUrl: null,
}));

console.log(`Importing ${formatted.length} topics...`);
console.log(JSON.stringify({ topics: formatted }));
