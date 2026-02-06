// ============================================================================
// PIPELINE V2 - Type Definitions
// ============================================================================

// --- Step 1: Interpreter Output ---
export interface InterpreterOutput {
  topic: string;
  subject: string;
  gradeLevel: number;
  gradeLevelRange: string;
  ageRange: string;
  learningGoals: string[];
  keyConcepts: string[];
  difficulty: "leicht" | "mittel" | "schwer";
  prerequisites: string[];
  commonMistakes: string[];
  sourceType: "freetext" | "worksheet" | "textbook" | "exam" | "image";
  extractedContent?: string;
}

// --- Step 2: Creative Director Output ---
export interface CreativeDirectorOutput {
  worldName: string;
  universe: {
    setting: string;
    metaphor: string;
    twist: string;
  };
  story: {
    hook: string;
    mission: string;
    climax: string;
  };
  visualIdentity: {
    stylePrompt: string;
    colorPalette: string[];
    mood: string;
    specialEffects: string;
  };
  navigation: {
    type: string;
    description: string;
    hubLayout: string;
  };
  guide: {
    name: string;
    appearance: string;
    personality: string;
    catchphrases: string[];
  };
  rewards: {
    system: string;
    description: string;
    milestones: string[];
  };
}

// --- Step 3: Game Designer Output ---
export interface GameDesignerModule {
  index: number;
  title: string;
  learningFocus: string;
  gameplayType: string;
  interactionMethod: string;
  visualConcept: string;
  difficulty: number;
  estimatedTasks: number;
  uniqueElement: string;
}

export interface GameDesignerOutput {
  moduleCount: number;
  modules: GameDesignerModule[];
  progressionLogic: string;
  bossModule: {
    title: string;
    concept: string;
    combinesModules: string;
  };
  transitionAnimations: string;
}

// --- Step 4: Asset Planner Output ---
export interface AssetPlanItem {
  id: string;
  category: "background" | "character" | "icon" | "illustration";
  purpose: string;
  prompt: string;
  aspectRatio: "16:9" | "1:1" | "4:3";
  priority: "critical" | "important" | "nice-to-have";
}

export interface AssetPlannerOutput {
  styleBase: string;
  assets: AssetPlanItem[];
}

// --- Step 5: Asset Generation Result ---
export interface AssetManifestEntry {
  url: string | null;
  storageId: string | null;
  category: string;
  purpose: string;
}

export type AssetManifest = Record<string, AssetManifestEntry>;

// --- Step 6: Content Architect Output ---
export interface TaskHints {
  level1: string;
  level2: string;
  level3: string;
}

export interface ContentTask {
  id: string;
  type: string;
  questionText: string;
  visualDescription: string | null;
  options?: string[];
  correctAnswer: string;
  correctIndex?: number;
  feedbackCorrect: string;
  feedbackWrong: string;
  hints: TaskHints;
  xpValue: number;
}

export interface ContentModule {
  index: number;
  title: string;
  introText: string;
  tasks: ContentTask[];
  summaryText: string;
  moduleCompleteMessage: string;
}

export interface ContentArchitectOutput {
  modules: ContentModule[];
  finalTest: {
    title: string;
    introText: string;
    tasks: ContentTask[];
    completionMessage: string;
  };
  guideDialogues: {
    welcome: string;
    encouragement: string[];
    moduleTransitions: string[];
  };
}

// --- Step 7: Quality Gate Output ---
export interface QualityError {
  location: string;
  type: "wrong_answer" | "inconsistency" | "missing_visual" | "impossible_mechanic" | "bad_pedagogy";
  description: string;
  fix: string;
}

export interface QualityWarning {
  location: string;
  description: string;
  suggestion: string;
}

export interface QualityFallback {
  risk: string;
  fallback: string;
}

export interface QualityGateOutput {
  overallScore: number;
  criticalErrors: QualityError[];
  warnings: QualityWarning[];
  correctedContent: Record<string, unknown>;
  fallbacks: QualityFallback[];
}

// --- Step 9: Validation Result ---
export interface ValidationResult {
  code: string;
  success: boolean;
  iterations: number;
  errors?: string[];
}

// --- Pipeline Metadata ---
export interface PipelineMetadata {
  version: "v2";
  totalDurationMs: number;
  steps: Record<string, {
    durationMs: number;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
  }>;
  totalCostEstimate: number;
  fixIterations: number;
  qualityScore: number;
}

// --- Generation Session Status ---
export type GenerationStep =
  | "interpreter"
  | "creative_director"
  | "game_designer"
  | "asset_planner"
  | "asset_generation"
  | "content_architect"
  | "quality_gate"
  | "code_generator"
  | "validation"
  | "complete";

export const STEP_LABELS: Record<GenerationStep, string> = {
  interpreter: "Analysiere deine Aufgabe...",
  creative_director: "Erfinde eine einzigartige Welt...",
  game_designer: "Designe die Spielmechaniken...",
  asset_planner: "Plane die Grafiken...",
  asset_generation: "Generiere einzigartige Grafiken...",
  content_architect: "Erstelle die Lerninhalte...",
  quality_gate: "Prüfe auf Fehler...",
  code_generator: "Baue deine Lernwelt...",
  validation: "Teste und optimiere...",
  complete: "Fertig! Deine Welt ist bereit!",
};

export const STEP_ORDER: GenerationStep[] = [
  "interpreter",
  "creative_director",
  "game_designer",
  "asset_planner",
  "asset_generation",
  "content_architect",
  "quality_gate",
  "code_generator",
  "validation",
  "complete",
];
