"use node";

// ============================================================================
// PIPELINE V2 ORCHESTRATOR
// Koordiniert alle 10 Steps der Lernwelt-Generierung
// ============================================================================

import { v } from "convex/values";
import { action, internalAction, ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { requireIdentity } from "../lib/auth";

import { runValidator } from "./steps/validator";
import { runStructuralGate } from "./steps/structuralGate";
import { runFocusedInterventionGenerator } from "./steps/focusedInterventionGenerator";
import { runLearningDiagnosis } from "./steps/learningDiagnosis";
import { runGameplayRouter } from "./steps/gameplayRouter";
import { runFocusedInterventionGate } from "./engines/focusedInterventionGate";
import { shouldUseFocusedIntervention } from "./engines/focusedInterventionRouter";
import { pickEngineByKeywords, ENGINE_GENERATORS } from "./engines/engineRegistry";
import type { EngineName } from "./engines/engineRegistry";

import { STEP_LABELS, STEP_ORDER } from "./types";

const generateWorldV2Args = {
  prompt: v.string(),
  pdfText: v.optional(v.string()),
  imageDescription: v.optional(v.string()),
  gradeLevel: v.optional(v.string()),
  subject: v.optional(v.string()),
  contextAnswers: v.optional(v.object({
    intent: v.optional(v.string()),
    audience: v.optional(v.string()),
    guidance: v.optional(v.string()),
  })),
  sessionId: v.string(),
};

type GenerateWorldV2Args = {
  prompt: string;
  pdfText?: string;
  imageDescription?: string;
  gradeLevel?: string;
  subject?: string;
  contextAnswers?: {
    intent?: string;
    audience?: string;
    guidance?: string;
  };
  sessionId: string;
  // Vertrauenswuerdige userId — wird NIE vom Client entgegengenommen, sondern
  // von jedem Aufrufer serverseitig aus dem Auth-Kontext abgeleitet, bevor
  // diese Kernfunktion aufgerufen wird (siehe generateWorldV2 unten und
  // pipeline/status.ts::startGeneration).
  userId: string;
};

// ============================================================================
// KERN-IMPLEMENTIERUNG: von zwei vertrauenswuerdigen Entry-Points aufgerufen
// ============================================================================
async function runGenerateWorldV2(ctx: ActionCtx, args: GenerateWorldV2Args): Promise<{
    worldId: Id<"worlds">;
    code: string;
    worldName: string;
    duration: number;
    qualityScore: number;
  }> {
    const startTime = Date.now();
    const stepTimings: Record<string, {
      durationMs: number;
      model?: string;
      inputTokens?: number;
      outputTokens?: number;
    }> = {};

    // Helper: update progress status
    const setStatus = async (stepIndex: number) => {
      const step = STEP_ORDER[stepIndex];
      const label = STEP_LABELS[step];
      await ctx.runMutation(internal.pipeline.status.updateSession, {
        sessionId: args.sessionId,
        currentStep: stepIndex,
        stepLabel: label,
      });
    };

    try {
      // Create session for progress tracking
      await ctx.runMutation(internal.pipeline.status.createSession, {
        sessionId: args.sessionId,
        userId: args.userId,
      });

      // Baut eine fokussierte Mini-App (Kid-Design, vollstaendig) und speichert
      // sie. Dient zweimal: (1) als bevorzugte Route fuer akute "versteh X"-
      // Anfragen, (2) als universeller Fallback, wenn keine Engine passt -
      // ersetzt die alte Quiz-Skeleton-Broad-Pipeline.
      const runFocusedWorld = async () => {
        await setStatus(0);
        const focusStart = Date.now();
        const focused = await runFocusedInterventionGenerator({
          prompt: args.prompt,
          pdfText: args.pdfText,
          imageDescription: args.imageDescription,
          gradeLevel: args.gradeLevel,
          subject: args.subject,
          contextAnswers: args.contextAnswers,
        });
        stepTimings.focused_intervention = {
          durationMs: Date.now() - focusStart,
          model: focused.inputTokens > 0 ? "opus" : "deterministic",
          inputTokens: focused.inputTokens,
          outputTokens: focused.outputTokens,
        };

        await setStatus(8);
        const validated = await runValidator(focused.code);
        const structuralGate = runStructuralGate(validated.code);
        if (!structuralGate.passed) {
          throw new Error(`Focused Structural Gate Failed: ${structuralGate.violations.join(" | ")}`);
        }
        const focusedGate = runFocusedInterventionGate(validated.code);
        if (!focusedGate.passed) {
          throw new Error(`Focused Intervention Gate Failed: ${focusedGate.violations.join(" | ")}`);
        }

        const worldId: Id<"worlds"> = await ctx.runMutation(internal.worlds.internalCreate, {
          title: focused.worldName,
          code: validated.code,
          userId: args.userId,
          isPublic: false,
          prompt: args.prompt,
          gradeLevel: args.gradeLevel,
          subject: args.subject,
          status: "published",
          qualityScore: Math.max(8, focusedGate.score),
          validationMetadata: {
            validatorSuccess: validated.success,
            validatorIterations: validated.iterations ?? 0,
            gateScore: Math.min(structuralGate.score, focusedGate.score),
            gatePassed: true,
            gateViolations: [],
          },
        });

        await ctx.runMutation(internal.pipeline.status.completeSession, {
          sessionId: args.sessionId,
          worldId,
        });

        return {
          worldId,
          code: validated.code,
          worldName: focused.worldName,
          duration: Date.now() - startTime,
          qualityScore: Math.max(8, focusedGate.score),
        };
      };

      // ── FOCUSED INTERVENTION (bevorzugt bei akuten "versteh X"-Anfragen) ──
      if (shouldUseFocusedIntervention(args)) {
        try {
          return await runFocusedWorld();
        } catch (error) {
          console.warn("focused intervention generation failed, falling back to other routes:", error);
        }
      }

      // ── GAMEPLAY ENGINES (deterministic renderers) ──────────────
      // Unified route for all engine playbooks. Keyword routers are the
      // free fast path; if none fires, the LLM gameplay router decides.
      // If no engine fits or generation fails, the broad pipeline below
      // remains the fallback.
      {
        const keywordEngine = pickEngineByKeywords(args);
        try {
          await setStatus(0);
          const diagnosisStart = Date.now();
          const diagnosis = await runLearningDiagnosis({
            prompt: args.prompt,
            pdfText: args.pdfText,
            gradeLevel: args.gradeLevel,
            subject: args.subject,
          });
          stepTimings.engine_diagnosis = {
            durationMs: Date.now() - diagnosisStart,
            model: "sonnet",
            inputTokens: diagnosis.inputTokens,
            outputTokens: diagnosis.outputTokens,
          };

          let engineName: EngineName | null = keywordEngine;
          if (!engineName) {
            const routerStart = Date.now();
            const routed = await runGameplayRouter({ brief: diagnosis.result });
            stepTimings.gameplay_router = {
              durationMs: Date.now() - routerStart,
              model: "sonnet",
              inputTokens: routed.inputTokens,
              outputTokens: routed.outputTokens,
            };
            engineName = routed.engine === "none" ? null : routed.engine;
          }

          if (engineName) {
            await setStatus(1);
            const generationStart = Date.now();
            const generation = await ENGINE_GENERATORS[engineName]({ brief: diagnosis.result });
            stepTimings.engine_generator = {
              durationMs: Date.now() - generationStart,
              model: "opus",
              inputTokens: generation.inputTokens,
              outputTokens: generation.outputTokens,
            };

            const gateResult = runStructuralGate(generation.code);
            if (!gateResult.passed) {
              throw new Error(`Engine Structural Gate Failed (${engineName}): ${gateResult.violations.join(" | ")}`);
            }

            const worldId: Id<"worlds"> = await ctx.runMutation(internal.worlds.internalCreate, {
              title: generation.worldName,
              code: generation.code,
              userId: args.userId,
              isPublic: false,
              prompt: args.prompt,
              gradeLevel: args.gradeLevel ?? diagnosis.result.gradeLevel,
              subject: args.subject ?? diagnosis.result.subject,
              status: "published",
              qualityScore: 8,
              validationMetadata: {
                validatorSuccess: true,
                validatorIterations: 0,
                gateScore: gateResult.score,
                gatePassed: true,
                gateViolations: [],
              },
            });

            await ctx.runMutation(internal.pipeline.status.completeSession, {
              sessionId: args.sessionId,
              worldId,
            });

            return {
              worldId,
              code: generation.code,
              worldName: generation.worldName,
              duration: Date.now() - startTime,
              qualityScore: 8,
            };
          }
        } catch (error) {
          console.warn("gameplay engine generation failed, falling back to existing pipeline:", error);
        }
      }

      // ── UNIVERSELLER FALLBACK ────────────────────────────────────
      // Keine Engine hat gepasst. Statt der alten Quiz-Skeleton-Pipeline
      // bauen wir eine fokussierte Mini-App (Kid-Design, vollstaendig).
      return await runFocusedWorld();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown pipeline error";
      console.error("Pipeline V2 failed:", errorMsg);

      try {
        await ctx.runMutation(internal.pipeline.status.failSession, {
          sessionId: args.sessionId,
          error: errorMsg,
        });
      } catch {
        // Ignore session update failure
      }

      throw new Error(`Pipeline V2 Error: ${errorMsg}`);
    }
}

// ============================================================================
// OEFFENTLICHER ENTRY-POINT: direkter Client-Aufruf (z.B. WorldCreatorModal)
// Identitaet wird ausschliesslich aus dem verifizierten Clerk-JWT abgeleitet,
// niemals aus einem Client-Argument.
// ============================================================================
export const generateWorldV2 = action({
  args: generateWorldV2Args,
  handler: async (ctx, args): Promise<{
    worldId: Id<"worlds">;
    code: string;
    worldName: string;
    duration: number;
    qualityScore: number;
  }> => {
    const identity = await requireIdentity(ctx);
    return runGenerateWorldV2(ctx, { ...args, userId: identity.subject });
  },
});

// ============================================================================
// INTERNER ENTRY-POINT: nur fuer serverseitige Aufrufer (z.B.
// pipeline/status.ts::startGeneration via ctx.scheduler.runAfter).
// Scheduler-Aufrufe behalten den Auth-Kontext des urspruenglichen Aufrufers
// NICHT bei (ctx.auth waere dort leer) — deshalb reicht der Aufrufer die
// bereits verifizierte userId hier explizit und vertrauenswuerdig durch.
// Nicht oeffentlich erreichbar, also von aussen nicht faelschbar.
// ============================================================================
export const generateWorldV2Internal = internalAction({
  args: { ...generateWorldV2Args, userId: v.string() },
  handler: async (ctx, args): Promise<{
    worldId: Id<"worlds">;
    code: string;
    worldName: string;
    duration: number;
    qualityScore: number;
  }> => {
    return runGenerateWorldV2(ctx, args);
  },
});
