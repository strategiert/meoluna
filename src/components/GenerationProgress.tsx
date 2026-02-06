/**
 * GenerationProgress - Live-Progress für Pipeline V2
 * Zeigt entweder echte Convex-Status oder Auto-Progression (V1 Fallback)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, FileText, Brain, Sparkles, Loader2, Palette, Gamepad2, Image, ShieldCheck, Code, Wrench } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MoonLogo } from "@/components/icons/MoonLogo";

// V2 Pipeline Stages (echte Steps)
const V2_STAGES = [
  { step: 0, label: "Analysiere dein Thema...", icon: Brain, message: "Thema, Lernziele und Schwierigkeit werden erkannt..." },
  { step: 1, label: "Erfinde einzigartiges Universum...", icon: Sparkles, message: "Ein kreatives Spielwelt-Konzept wird erschaffen..." },
  { step: 2, label: "Designe die Minigames...", icon: Gamepad2, message: "Einzigartige Spielmechaniken für jedes Level..." },
  { step: 3, label: "Plane Grafiken...", icon: Palette, message: "Bild-Prompts und visuelle Identität werden erstellt..." },
  { step: 4, label: "Generiere Bilder...", icon: Image, message: "KI-Bilder werden parallel generiert..." },
  { step: 5, label: "Erstelle Spiel-Challenges...", icon: Brain, message: "Challenges, Lösungen und Feedback werden designt..." },
  { step: 6, label: "Qualitätsprüfung...", icon: ShieldCheck, message: "Alle Inhalte werden auf Korrektheit geprüft..." },
  { step: 7, label: "Baue deine Spielwelt...", icon: Code, message: "React-Code wird aus dem Plan generiert..." },
  { step: 8, label: "Teste und optimiere...", icon: Wrench, message: "Code wird validiert und Fehler automatisch gefixt..." },
];

// V1 Legacy Stages (Auto-Progression)
type LegacyStage = "uploading" | "extracting" | "analyzing" | "designing" | "generating" | "images" | "finalizing" | "complete";

const LEGACY_STAGES = [
  { id: "uploading", label: "Hochladen...", icon: FileText, duration: 2 },
  { id: "extracting", label: "Text wird extrahiert...", icon: FileText, duration: 5 },
  { id: "analyzing", label: "Analysiere Lerninhalt...", icon: Brain, duration: 15 },
  { id: "designing", label: "Entwickle einzigartiges Design...", icon: Sparkles, duration: 30 },
  { id: "generating", label: "Erstelle interaktive Module...", icon: Sparkles, duration: 90 },
  { id: "images", label: "Generiere Visualisierungen...", icon: Sparkles, duration: 60 },
  { id: "finalizing", label: "Füge Quiz-Fragen hinzu...", icon: Sparkles, duration: 45 },
  { id: "complete", label: "Fertig!", icon: Check, duration: 0 },
];

const LEGACY_STAGES_NO_PDF = LEGACY_STAGES.filter(s => s.id !== "uploading" && s.id !== "extracting");

interface GenerationProgressProps {
  // V2 mode: subscribe to real Convex session
  sessionId?: string;
  // V1 fallback: manual stage/progress
  stage?: LegacyStage;
  progress?: number;
  isGenerating?: boolean;
  isPdfBased?: boolean;
}

export function GenerationProgress({
  sessionId,
  stage: externalStage,
  progress: externalProgress,
  isGenerating = true,
  isPdfBased = false,
}: GenerationProgressProps) {
  // V2: Subscribe to real-time session status
  const session = useQuery(
    api.pipeline.status.getSession,
    sessionId ? { sessionId } : "skip"
  );

  const isV2 = !!sessionId && !!session;

  // V2 rendering
  if (isV2) {
    const currentStep = session.currentStep ?? 0;
    const isComplete = session.status === "completed";
    const isFailed = session.status === "failed";
    const progress = isComplete ? 100 : Math.floor((currentStep / V2_STAGES.length) * 95);

    return (
      <div className="space-y-6">
        {/* Animated moon logo */}
        <div className="flex justify-center">
          <motion.div
            animate={{
              scale: isComplete ? [1, 1.2, 1] : 1,
              rotate: isComplete ? 0 : 360,
            }}
            transition={{
              rotate: { repeat: Infinity, duration: 8, ease: "linear" },
              scale: { duration: 0.5 },
            }}
            className="relative"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isFailed
                ? "bg-gradient-to-br from-red-500 via-red-400 to-red-600"
                : "bg-gradient-to-br from-moon via-moon/80 to-aurora"
            }`}>
              {isComplete ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                  <Check className="w-10 h-10 text-background" />
                </motion.div>
              ) : (
                <MoonLogo size="lg" />
              )}
            </div>

            {/* Orbiting particles */}
            {!isComplete && !isFailed && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-moon rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2 + i * 0.5, ease: "linear", delay: i * 0.3 }}
                    style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4, transformOrigin: `${40 + i * 10}px 0` }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </div>

        {/* V2 Pipeline stages */}
        <div className="space-y-2">
          {V2_STAGES.map((s, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep && !isComplete;
            const Icon = s.icon;

            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isCurrent
                    ? "bg-moon/10 border border-moon/30"
                    : isCompleted
                    ? "bg-muted/30"
                    : "opacity-30"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-green-500/20 text-green-500"
                    : isCurrent
                    ? "bg-moon/20 text-moon"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className={`text-sm ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isFailed ? "bg-red-500" : "bg-gradient-to-r from-moon to-aurora"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">{progress}%</p>
        </div>

        {/* Current message */}
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground"
        >
          {isFailed
            ? `Fehler: ${session.error || "Unbekannter Fehler"}`
            : isComplete
            ? "Deine Lernwelt ist bereit! ✨"
            : V2_STAGES[currentStep]?.message || "Wird verarbeitet..."}
        </motion.p>
      </div>
    );
  }

  // ── V1 LEGACY FALLBACK ──────────────────────────────────────────
  const [internalStage, setInternalStage] = useState<LegacyStage>(isPdfBased ? "uploading" : "analyzing");
  const [internalProgress, setInternalProgress] = useState(0);

  const activeStages = isPdfBased ? LEGACY_STAGES : LEGACY_STAGES_NO_PDF;
  const stage = externalStage ?? internalStage;
  const legacyProgress = externalProgress ?? internalProgress;
  const currentIndex = activeStages.findIndex((s) => s.id === stage);

  useEffect(() => {
    if (externalStage || !isGenerating) return;

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      let cumulativeTime = 0;
      let newStageIndex = 0;

      for (let i = 0; i < activeStages.length - 1; i++) {
        cumulativeTime += activeStages[i].duration;
        if (elapsed < cumulativeTime) { newStageIndex = i; break; }
        newStageIndex = i + 1;
      }

      newStageIndex = Math.min(newStageIndex, activeStages.length - 2);
      setInternalStage(activeStages[newStageIndex].id as LegacyStage);
      const totalDuration = activeStages.slice(0, -1).reduce((sum, s) => sum + s.duration, 0);
      setInternalProgress(Math.min(Math.floor((elapsed / totalDuration) * 100), 95));
    }, 1000);

    return () => clearInterval(interval);
  }, [externalStage, isGenerating, activeStages]);

  useEffect(() => {
    if (isGenerating) {
      setInternalStage(isPdfBased ? "uploading" : "analyzing");
      setInternalProgress(0);
    }
  }, [isGenerating, isPdfBased]);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <motion.div
          animate={{ scale: stage === "complete" ? [1, 1.2, 1] : 1, rotate: stage !== "complete" ? 360 : 0 }}
          transition={{ rotate: { repeat: Infinity, duration: 8, ease: "linear" }, scale: { duration: 0.5 } }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-moon via-moon/80 to-aurora flex items-center justify-center">
            {stage === "complete" ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <Check className="w-10 h-10 text-background" />
              </motion.div>
            ) : (
              <MoonLogo size="lg" />
            )}
          </div>
          {stage !== "complete" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-moon rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2 + i * 0.5, ease: "linear", delay: i * 0.3 }}
                  style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4, transformOrigin: `${40 + i * 10}px 0` }}
                />
              ))}
            </>
          )}
        </motion.div>
      </div>

      <div className="space-y-3">
        {activeStages.slice(0, -1).map((s, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = s.icon;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isCurrent ? "bg-moon/10 border border-moon/30" : isCompleted ? "bg-muted/30" : "opacity-40"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? "bg-green-500/20 text-green-500" : isCurrent ? "bg-moon/20 text-moon" : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            </motion.div>
          );
        })}
      </div>

      {legacyProgress !== undefined && (
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-moon to-aurora" initial={{ width: 0 }} animate={{ width: `${legacyProgress}%` }} transition={{ duration: 0.3 }} />
          </div>
          <p className="text-xs text-center text-muted-foreground">{legacyProgress}%</p>
        </div>
      )}

      <motion.p key={stage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-muted-foreground">
        {stage === "uploading" && "Datei wird hochgeladen..."}
        {stage === "extracting" && "KI liest und analysiert das Dokument..."}
        {stage === "analyzing" && "Thema, Stimmung und Konzepte werden erkannt..."}
        {stage === "designing" && "Ein einzigartiges visuelles Konzept wird entwickelt..."}
        {stage === "generating" && "Interaktive Lernmodule werden erstellt..."}
        {stage === "images" && "Illustrationen werden generiert..."}
        {stage === "finalizing" && "Quizfragen und Übungen werden generiert..."}
        {stage === "complete" && "Deine Lernwelt ist bereit! ✨"}
      </motion.p>
    </div>
  );
}

export default GenerationProgress;
