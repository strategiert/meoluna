import type { LearningBrief, MovementEngineSpec } from "./movementSpaceTypes";

type ParsedAddition = {
  a: number;
  b: number;
};

function sourceText(brief: LearningBrief): string {
  return [
    brief.rawTopic,
    ...(brief.extractedTasks ?? []),
    ...brief.learningGoals,
    ...brief.likelyMisconceptions,
  ].join("\n");
}

function parseSignedIntegerAddition(text: string): ParsedAddition | null {
  const normalised = text
    .replace(/\u2212/g, "-")
    .replace(/\s+/g, " ");
  const match = normalised.match(/([+-]?\d+)\s*\+\s*\(?\s*([+-]\d+)\s*\)?/);
  if (!match) {
    return null;
  }

  return {
    a: Number(match[1]),
    b: Number(match[2]),
  };
}

function practicePair(a: number, b: number, offset: number): ParsedAddition {
  const signA = Math.sign(a) || -1;
  const signB = Math.sign(b) || signA;
  return {
    a: signA * Math.max(4, Math.round(Math.abs(a) * 0.65) + offset),
    b: signB * Math.max(3, Math.round(Math.abs(b) * 0.55) + offset),
  };
}

function boundsFor(values: number[]): { min: number; max: number } {
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const padding = Math.max(10, Math.ceil((maxValue - minValue) * 0.15));
  const rawMin = minValue - padding;
  const rawMax = maxValue + padding;
  const min = Math.floor(rawMin / 10) * 10;
  const max = Math.ceil(rawMax / 10) * 10;
  return { min, max };
}

export function tryBuildArithmeticMovementSpec(brief: LearningBrief): MovementEngineSpec | null {
  const parsed = parseSignedIntegerAddition(sourceText(brief));
  if (!parsed) {
    return null;
  }

  const firstTarget = parsed.a + parsed.b;
  const firstPractice = practicePair(parsed.a, parsed.b, 1);
  const secondPractice = practicePair(parsed.a, parsed.b, 6);
  const practiceTarget = firstPractice.a + firstPractice.b;
  const challengeTarget = secondPractice.a + secondPractice.b;
  const bounds = boundsFor([
    parsed.a,
    parsed.b,
    firstTarget,
    firstPractice.a,
    firstPractice.b,
    practiceTarget,
    secondPractice.a,
    secondPractice.b,
    challengeTarget,
  ]);

  return {
    engine: "movement-space",
    learningBrief: brief,
    world: {
      worldName: "Minus-Welt: Nach Westen wird es kleiner",
      coreMetaphor: "Eine Blockwelt-Zahlengerade: Westen ist Minus, Osten ist Plus.",
      setting:
        "Eine kleine Blockwelt mit einer Figur auf einer Ost-West-Achse. Das Kind verschiebt die Figur selbst und sieht, wie aus Wegen eine Rechnung wird.",
      visualStyle: {
        palette: ["#111827", "#1d4ed8", "#facc15", "#86efac", "#38bdf8"],
        mood: "klar, spielerisch, blockig",
        shapes: "Blockwelt-Tiles, Diamanten, Figur, Ost-West-Achse",
        effects: "sanfte Wegspur, Zielmarker, kleine Belohnungs-Animation",
      },
      guide: {
        name: "Kaya",
        role: "Blockwelt-Guide",
        personality: "kurz, handlungsorientiert und ermutigend",
      },
      rooms: [
        {
          id: "westweg",
          title: "Westweg",
          purpose: "Das genaue Beispiel als Bewegung erleben.",
          scene: `${parsed.a} und ${parsed.b} werden zu zwei Wegen nach Westen.`,
          reward: "West-Versteher",
        },
        {
          id: "selber-schieben",
          title: "Selber schieben",
          purpose: "Das Muster mit neuen Zahlen wiederholen.",
          scene: `${firstPractice.a} und ${firstPractice.b} selbst auf der Achse setzen.`,
          reward: "Minus-Miner",
        },
        {
          id: "diamantentest",
          title: "Diamantentest",
          purpose: "Sicher erkennen, wohin zwei negative Bewegungen führen.",
          scene: `${secondPractice.a} und ${secondPractice.b} ohne Hilfsmarkierungen lösen.`,
          reward: "Diamant-Profi",
        },
      ],
    },
    concept: {
      learningProblem: `Das Kind versteht ${parsed.a} + (${parsed.b}) nicht sicher.`,
      embodiedMetaphor:
        "Negative Zahlen sind Wege nach Westen. Zwei negative Wege werden nicht positiv, sondern gehen weiter nach Westen.",
      successInsight:
        "Wenn ich zwei negative Bewegungen addiere, gehe ich zweimal nach Westen - das Ergebnis wird noch kleiner.",
    },
    coordinateSystem: {
      dimensions: "1d-horizontal",
      min: bounds.min,
      max: bounds.max,
      unitLabel: "Blöcke",
      negativeDirectionLabel: "Westen",
      positiveDirectionLabel: "Osten",
    },
    rooms: [
      {
        roomId: "westweg",
        objective: `Ziehe die Figur zuerst ${Math.abs(parsed.a)} Blöcke nach Westen und dann noch ${Math.abs(parsed.b)} weiter.`,
        startPosition: 0,
        moves: [
          {
            value: parsed.a,
            label: `${Math.abs(parsed.a)} nach Westen`,
            meaning: `${parsed.a} heißt: ${Math.abs(parsed.a)} Blöcke nach Westen.`,
          },
          {
            value: parsed.b,
            label: `noch ${Math.abs(parsed.b)} weiter`,
            meaning: `${parsed.b} heißt: nochmal ${Math.abs(parsed.b)} Blöcke nach Westen.`,
          },
        ],
        targetPosition: firstTarget,
        interaction: "drag-marker",
        feedback: {
          correct: `Genau: ${parsed.a} + (${parsed.b}) = ${firstTarget}.`,
          wrongDirection: "Das ist die falsche Richtung. Minus bewegt dich nach Westen.",
          wrongDistance: "Die Richtung stimmt, aber die Strecke passt noch nicht.",
          signConfusion: "Zwei Minuswege werden nicht Osten. Du gehst einfach weiter nach Westen.",
        },
        explanationAfterSuccess:
          `Aus der Bewegung wird: ${parsed.a} + (${parsed.b}) = ${firstTarget}. Du addierst die Beträge und behältst das Minus.`,
      },
      {
        roomId: "selber-schieben",
        objective: `Starte bei 0 und baue ${firstPractice.a} + (${firstPractice.b}) selbst.`,
        startPosition: 0,
        moves: [
          {
            value: firstPractice.a,
            label: `${Math.abs(firstPractice.a)} nach Westen`,
            meaning: `${firstPractice.a} ist der erste Westweg.`,
          },
          {
            value: firstPractice.b,
            label: `noch ${Math.abs(firstPractice.b)} weiter`,
            meaning: `${firstPractice.b} ist der zweite Westweg.`,
          },
        ],
        targetPosition: practiceTarget,
        interaction: "drag-marker",
        feedback: {
          correct: `Richtig: ${firstPractice.a} + (${firstPractice.b}) = ${practiceTarget}.`,
          wrongDirection: "Minus bleibt Westen. Ziehe weiter nach links.",
          wrongDistance: "Fast. Zähle beide Westwege zusammen.",
          signConfusion: "Auch beim zweiten Minus wechselst du nicht die Richtung.",
        },
        explanationAfterSuccess:
          `${Math.abs(firstPractice.a)} und ${Math.abs(firstPractice.b)} West-Blöcke ergeben ${Math.abs(practiceTarget)} West-Blöcke: ${practiceTarget}.`,
      },
      {
        roomId: "diamantentest",
        objective: `Finde den Diamanten bei ${secondPractice.a} + (${secondPractice.b}).`,
        startPosition: 0,
        moves: [
          {
            value: secondPractice.a,
            label: `${Math.abs(secondPractice.a)} nach Westen`,
            meaning: "Der erste negative Summand bewegt die Figur nach Westen.",
          },
          {
            value: secondPractice.b,
            label: `noch ${Math.abs(secondPractice.b)} weiter`,
            meaning: "Der zweite negative Summand bewegt die Figur noch weiter nach Westen.",
          },
        ],
        targetPosition: challengeTarget,
        interaction: "drag-marker",
        feedback: {
          correct: `Sauber: ${secondPractice.a} + (${secondPractice.b}) = ${challengeTarget}.`,
          wrongDirection: "Der Diamant liegt westlich von 0.",
          wrongDistance: "Du bist auf der richtigen Seite. Prüfe die Summe der Beträge.",
          signConfusion: "Minus plus Minus heißt: beide Wege zeigen nach Westen.",
        },
        explanationAfterSuccess:
          `Du hast das Muster: Westweg plus Westweg bleibt Westweg. Ergebnis: ${challengeTarget}.`,
      },
    ],
  };
}
