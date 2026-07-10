// Pure TS — keine Convex-Imports, keine Node-Imports. Importierbar via tsx aus .mjs-Scripts.

// Spec 4.1 — Learning Model
export type LearningModel = {
  sourceMode: "material" | "curriculum" | "creator";
  subject: string;
  gradeLevel: string;
  ageRange: { min: number; max: number };
  sourceSummary: string;
  requiredGoals: Array<{
    id: string;
    statement: string;
    evidenceOfMastery: string;
    commonMisconceptions: string[];
    importance: "core" | "supporting";
  }>;
  facts: Array<{
    id: string;
    statement: string;
    sourceEvidence: string;
  }>;
  constraints: {
    sessionMinutes: number;
    readingLevel: string;
    devices: Array<"touch" | "mouse" | "keyboard">;
  };
};

// Spec 4.2 — Creative Pitch Set
export type GamePitch = {
  id: string;
  title: string;
  oneSentenceFantasy: string;
  playerRole: string;
  coreVerbs: string[];
  camera: "top-down" | "side" | "isometric" | "fixed-scene" | "abstract";
  worldTopology: "linear" | "branching" | "open-zone" | "round-based" | "systemic";
  coreLoop: string[];
  progression: string;
  failureAndRecovery: string;
  learningBindings: Array<{
    goalId: string;
    playerAction: string;
    observedState: string;
  }>;
  estimatedMinutes: number;
};

// Spec 4.3 — Originality Gate
export type ExperienceSignature = {
  coreVerbs: string[];
  camera: string;
  worldTopology: string;
  progressionModel: string;
  controlModel: string;
  failureModel: string;
  narrativeStructure: string;
  systemicModel: string | null;
};

// Zentrales Protokoll — Playthrough-Plan-Format
export type PlanStep =
  | { op: "waitFor"; affordance: string; timeoutMs?: number }
  | { op: "tap"; affordance: string }
  | { op: "waitTelemetry"; event: string; timeoutMs?: number }
  | { op: "assertGoal"; goalId: string }
  | { op: "assertComplete" }
  | { op: "wait"; ms: number }
  | { op: "screenshot"; name: string };

export type PlaythroughPlan = { game: string; seed: string; steps: PlanStep[] };

// Spec 4.4 — Game Design Document
export type GameDesignDocument = {
  fantasy: string;
  baseResolution: { width: number; height: number };
  sceneGraph: {
    scenes: Array<{ id: string; kind: "start" | "play" | "success" | "retry"; description: string }>;
    transitions: Array<{ from: string; to: string; trigger: string }>;
  };
  coreLoop: { primary: string[]; secondary: string[] };
  controls: { touch: string[]; mouseKeyboard: string[] };
  rules: string[];
  progression: { difficultyCurve: string; helpSystem: string };
  failureRecovery: { failureConditions: string[]; quickResume: string };
  learningBindings: Array<{ goalId: string; mechanic: string; observedState: string }>;
  avFeedback: string[];
  assetManifest: Array<{ id: string; kind: "bitmap" | "audio"; description: string }>;
  telemetryEvents: string[];
  affordances: Array<{ id: string; description: string }>;
  playthroughPlan: PlaythroughPlan;
};
