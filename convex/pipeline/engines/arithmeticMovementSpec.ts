import type { LearningBrief, MovementEngineSpec, MovementRound } from "./movementSpaceTypes";

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
    .replace(/−/g, "-")
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

function westPair(a: number, b: number, scale: number, minA: number, minB: number): ParsedAddition {
  const signA = Math.sign(a) || -1;
  const signB = Math.sign(b) || signA;
  return {
    a: signA * Math.max(minA, Math.round(Math.abs(a) * scale)),
    b: signB * Math.max(minB, Math.round(Math.abs(b) * scale)),
  };
}

function westRound(pair: ParsedAddition): MovementRound {
  return {
    startPosition: 0,
    moves: [
      {
        value: pair.a,
        label: `${Math.abs(pair.a)} nach Westen`,
        meaning: `${pair.a} heißt: ${Math.abs(pair.a)} Felder nach Westen.`,
      },
      {
        value: pair.b,
        label: `noch ${Math.abs(pair.b)} weiter`,
        meaning: `${pair.b} heißt: nochmal ${Math.abs(pair.b)} Felder nach Westen.`,
      },
    ],
    targetPosition: pair.a + pair.b,
  };
}

function mixedRound(east: number, west: number): MovementRound {
  return {
    startPosition: 0,
    moves: [
      {
        value: east,
        label: `${east} nach Osten`,
        meaning: `+${east} heißt: ${east} Felder nach Osten.`,
      },
      {
        value: -west,
        label: `${west} nach Westen`,
        meaning: `${-west} heißt: ${west} Felder zurück nach Westen.`,
      },
    ],
    targetPosition: east - west,
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

function roundValues(round: MovementRound): number[] {
  const values: number[] = [typeof round.startPosition === "number" ? round.startPosition : round.startPosition.x];
  let position = values[0];
  for (const move of round.moves) {
    position += typeof move.value === "number" ? move.value : move.value.x;
    values.push(position);
  }
  return values;
}

export function tryBuildArithmeticMovementSpec(brief: LearningBrief): MovementEngineSpec | null {
  const parsed = parseSignedIntegerAddition(sourceText(brief));
  if (!parsed) {
    return null;
  }

  // Session-Format v2: 4 Räume, 9 Runden, vom Aufwärmen bis zur Meisterprüfung.
  const warmupRounds = [
    westRound(westPair(parsed.a, parsed.b, 0.1, 2, 1)),
    westRound(westPair(parsed.a, parsed.b, 0.2, 4, 3)),
  ];
  const mainRound = westRound(parsed);
  const builderRounds = [
    westRound(westPair(parsed.a, parsed.b, 0.35, 5, 4)),
    westRound(westPair(parsed.a, parsed.b, 0.55, 7, 5)),
    westRound(westPair(parsed.a, parsed.b, 0.75, 9, 6)),
  ];
  const east = Math.max(4, Math.round(Math.abs(parsed.b) * 0.4));
  const west = east + Math.max(5, Math.round(Math.abs(parsed.a) * 0.3));
  const masterRounds = [
    westRound(westPair(parsed.a, parsed.b, 0.85, 10, 7)),
    mixedRound(east, west),
    westRound(westPair(parsed.a, parsed.b, 1.15, 12, 8)),
  ];

  const allRounds = [...warmupRounds, mainRound, ...builderRounds, ...masterRounds];
  const bounds = boundsFor(allRounds.flatMap(roundValues));

  return {
    engine: "movement-space",
    learningBrief: brief,
    world: {
      worldName: "Minus-Welt: Nach Westen wird es kleiner",
      coreMetaphor: "Eine Blockwelt-Zahlengerade: Westen ist Minus, Osten ist Plus.",
      setting:
        "Eine kleine Blockwelt mit einer Figur auf einer Ost-West-Achse. Das Kind bewegt die Figur selbst und sieht, wie aus Wegen eine Rechnung wird.",
      visualStyle: {
        palette: ["#79c7f5", "#3f9bf0", "#ffd84d", "#54b865", "#ff7a59"],
        mood: "hell, spielerisch, freundlich",
        shapes: "Hüpfweg, Zahlsteine, Figur, Ost-West-Achse",
        effects: "sanfte Wegspur, Hüpf-Animation, Konfetti",
      },
      guide: {
        name: "Luno",
        role: "Blockwelt-Guide",
        personality: "kurz, handlungsorientiert und ermutigend",
      },
      rooms: [
        {
          id: "aufwaermen",
          title: "Aufwärmen",
          purpose: "Mit kleinen Zahlen warm werden.",
          scene: "Zwei kurze Westwege zum Eingewöhnen.",
          reward: "Warmgehüpft",
        },
        {
          id: "westweg",
          title: "Westweg",
          purpose: "Das genaue Beispiel als Bewegung erleben.",
          scene: `${parsed.a} und ${parsed.b} werden zu zwei Wegen nach Westen.`,
          reward: "West-Versteher",
        },
        {
          id: "wegbauer",
          title: "Wegbauer",
          purpose: "Bewegungsketten selbst zusammenbauen.",
          scene: "Lege die Weg-Chips in die richtige Reihenfolge.",
          reward: "Wegbau-Meister",
        },
        {
          id: "meisterpruefung",
          title: "Meisterprüfung",
          purpose: "Alles gemischt, auch mit einem Ostweg dazwischen.",
          scene: "Drei Prüfungs-Wege, einer führt erst nach Osten.",
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
      unitLabel: "Felder",
      negativeDirectionLabel: "Westen",
      positiveDirectionLabel: "Osten",
    },
    rooms: [
      {
        roomId: "aufwaermen",
        objective: "Zwei kurze Westwege zum Warmwerden.",
        rounds: warmupRounds,
        interaction: "choose-direction",
        feedback: {
          correct: "Genau richtig!",
          wrongDirection: "Das ist die falsche Richtung. Minus bewegt dich nach Westen.",
          wrongDistance: "Die Richtung stimmt, aber zähle die Felder nochmal.",
          signConfusion: "Zwei Minuswege werden nicht Osten. Du gehst einfach weiter nach Westen.",
        },
        explanationAfterSuccess: "Minus heißt: nach Westen. Das Ergebnis wird kleiner.",
      },
      {
        roomId: "westweg",
        objective: `Gehe zuerst ${Math.abs(parsed.a)} Felder nach Westen und dann noch ${Math.abs(parsed.b)} weiter.`,
        rounds: [mainRound],
        interaction: "choose-direction",
        feedback: {
          correct: `Genau: ${parsed.a} + (${parsed.b}) = ${parsed.a + parsed.b}.`,
          wrongDirection: "Das ist die falsche Richtung. Minus bewegt dich nach Westen.",
          wrongDistance: "Die Richtung stimmt, aber die Strecke passt noch nicht.",
          signConfusion: "Zwei Minuswege werden nicht Osten. Du gehst einfach weiter nach Westen.",
        },
        explanationAfterSuccess:
          `Aus der Bewegung wird: ${parsed.a} + (${parsed.b}) = ${parsed.a + parsed.b}. Du addierst die Beträge und behältst das Minus.`,
      },
      {
        roomId: "wegbauer",
        objective: "Baue den Weg aus den Chips.",
        rounds: builderRounds,
        interaction: "step-sequencer",
        feedback: {
          correct: "Dein Weg stimmt!",
          wrongDirection: "Ein Chip zeigt in die falsche Richtung. Minus heißt Westen.",
          wrongDistance: "Die Chips sind noch nicht in der richtigen Reihenfolge.",
          signConfusion: "Achtung: ein Chip zeigt nach Osten, aber beide Zahlen sind Minus.",
        },
        explanationAfterSuccess: "Westweg plus Westweg bleibt Westweg: die Felder addieren sich.",
      },
      {
        roomId: "meisterpruefung",
        objective: "Drei Prüfungs-Wege. Einer führt zwischendurch nach Osten!",
        rounds: masterRounds,
        interaction: "choose-direction",
        feedback: {
          correct: "Meisterhaft!",
          wrongDirection: "Schau auf das Vorzeichen: Minus heißt Westen, Plus heißt Osten.",
          wrongDistance: "Die Richtung stimmt. Zähle die Felder noch einmal genau.",
          signConfusion: "Nicht umdrehen! Nur ein Plus-Zeichen schickt dich nach Osten.",
        },
        explanationAfterSuccess: "Du liest jetzt Vorzeichen wie Wegweiser: Minus nach Westen, Plus nach Osten.",
      },
    ],
  };
}
