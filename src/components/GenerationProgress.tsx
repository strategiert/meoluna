/**
 * GenerationProgress - Live-Progress für Pipeline V2
 * Zeigt entweder echte Convex-Status oder Auto-Progression (V1 Fallback)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, FileText, Brain, Sparkles, Loader2, Wrench } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MoonLogo } from "@/components/icons/MoonLogo";

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

  // Verstrichene Zeit fuer eine zeitbasierte, "lebendige" Fortschrittsanzeige.
  // Hook MUSS vor dem fruehen return stehen (Hook-Reihenfolge konstant).
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isGenerating || !isV2) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [isGenerating, isV2]);

  // V2 rendering
  if (isV2) {
    const currentStep = session.currentStep ?? 0;
    const isComplete = session.status === "completed";
    const isFailed = session.status === "failed";

    // Reale Pipeline kennt nur 3 sichtbare Phasen: verstehen (Step 0),
    // Welt erschaffen (die lange Generierung), Feinschliff (Validierung).
    // Die alten 9 Stufen beschrieben die geloeschte Broad-Pipeline.
    const PHASES = [
      { label: "Thema verstehen", icon: Brain, floor: 6 },
      { label: "Deine Welt entsteht", icon: Sparkles, floor: 22 },
      { label: "Letzter Feinschliff", icon: Wrench, floor: 88 },
    ];
    const phaseIndex = currentStep <= 0 ? 0 : currentStep >= 8 ? 2 : 1;

    // Glatter, asymptotischer Balken (~92 % nach ~90s) - klebt nie, springt
    // bei Abschluss auf 100 %. Geht nie zurueck (max gegen Phasen-Untergrenze).
    const ease = Math.round((1 - Math.exp(-elapsed / 42)) * 92);
    const progress = isComplete ? 100 : Math.min(97, Math.max(ease, PHASES[phaseIndex].floor));

    const MESSAGES = [
      "Luno entwirft gerade deine Spielwelt...",
      "Lernziele werden in ein Abenteuer verwandelt...",
      "Aufgaben mit Schwierigkeitsrampe entstehen...",
      "Jede Runde wird auf Loesbarkeit geprueft...",
      "Maskottchen, Farben und Sterne kommen dazu...",
      "Fast fertig - der Feinschliff laeuft...",
    ];
    const rotating = MESSAGES[Math.floor(elapsed / 4) % MESSAGES.length];

    return (
      <div className="space-y-6">
        {/* Animated moon logo */}
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: isComplete ? [1, 1.2, 1] : 1, rotate: isComplete ? 0 : 360 }}
            transition={{ rotate: { repeat: Infinity, duration: 8, ease: "linear" }, scale: { duration: 0.5 } }}
            className="relative"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isFailed ? "bg-gradient-to-br from-red-500 via-red-400 to-red-600" : "bg-gradient-to-br from-moon via-moon/80 to-aurora"
            }`}>
              {isComplete ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                  <Check className="w-10 h-10 text-background" />
                </motion.div>
              ) : (
                <MoonLogo size="lg" />
              )}
            </div>
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

        {/* Drei reale Phasen */}
        <div className="flex items-stretch justify-center gap-2">
          {PHASES.map((p, index) => {
            const isCompleted = isComplete || index < phaseIndex;
            const isCurrent = !isComplete && index === phaseIndex;
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all ${
                  isCurrent ? "bg-moon/10 border border-moon/30" : isCompleted ? "bg-muted/30" : "opacity-40"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? "bg-green-500/20 text-green-500" : isCurrent ? "bg-moon/20 text-moon" : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs leading-tight ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>{p.label}</span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isFailed ? "bg-red-500" : "bg-gradient-to-r from-moon to-aurora"}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">{progress}%</p>
        </div>

        {/* Rotierende Botschaft */}
        <motion.p
          key={isComplete || isFailed ? "final" : rotating}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground min-h-[2.5rem]"
        >
          {isFailed
            ? `Da ist etwas schiefgelaufen: ${session.error || "Unbekannter Fehler"}. Versuch es noch einmal.`
            : isComplete
            ? "Deine Lernwelt ist bereit! ✨"
            : rotating}
        </motion.p>

        {/* Du-kannst-gehen-Hinweis */}
        {!isComplete && !isFailed && (
          <p className="text-center text-xs text-moon/80">
            Das dauert ein bis zwei Minuten. Du kannst die Seite ruhig verlassen — wir bauen im Hintergrund weiter.
          </p>
        )}
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
