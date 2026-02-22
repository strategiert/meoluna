"use node";

// ============================================================================
// PIPELINE V2 ORCHESTRATOR — Phasen-basiert (kein Timeout-Limit)
//
// generateWorldV2: Erstellt Session + startet Phase 1 (gibt sofort zurück)
// runPhase1:       Steps 1-7 + Quality Corrections (eigene 10-Min-Action)
// runPhase2:       Steps 8-9.5 + Welt speichern   (eigene 10-Min-Action)
//
// Gesamtbudget: 20 Minuten statt 10. Pipeline kann so lange laufen wie nötig.
// ============================================================================

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

import { runInterpreter } from "./steps/interpreter";
import { runCreativeDirector } from "./steps/creativeDirector";
import { runGameDesigner } from "./steps/gameDesigner";
import { runAssetPlanner } from "./steps/assetPlanner";
import { runAssetGenerator } from "./steps/assetGenerator";
import { runContentArchitect } from "./steps/contentArchitect";
import { runQualityGate, applyCorrections } from "./steps/qualityGate";
import { runCodeGenerator } from "./steps/codeGenerator";
import { runValidator } from "./steps/validator";
import { runStructuralGate } from "./steps/structuralGate";

import { STEP_LABELS, STEP_ORDER } from "./types";
import type { AssetManifest } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionCtx = { runMutation: (ref: any, args: any) => Promise<any> };

function withStepError(error: unknown, defaultCode: string, jsonCode: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/^E_[A-Z0-9_]+:/.test(message)) {
    return new Error(message);
  }
  const isJsonError =
    /JSON parse failed/i.test(message) ||
    /Unexpected token/i.test(message) ||
    /Unexpected end of JSON input/i.test(message) ||
    /Kein JSON-Objekt/i.test(message);
  const errorCode = isJsonError ? jsonCode : defaultCode;
  return new Error(`${errorCode}: ${message}`);
}

async function setStatus(ctx: ActionCtx, sessionId: string, stepIndex: number) {
  const step = STEP_ORDER[stepIndex];
  const label = STEP_LABELS[step];
  await ctx.runMutation(internal.pipeline.status.updateSession, {
    sessionId,
    currentStep: stepIndex,
    stepLabel: label,
  });
}

// ============================================================================
// ENTRY POINT — Erstellt Session, startet Phase 1, gibt sofort zurück
// ============================================================================
export const generateWorldV2 = action({
  args: {
    prompt: v.string(),
    pdfText: v.optional(v.string()),
    imageDescription: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    userId: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Session für Progress-Tracking erstellen
    await ctx.runMutation(internal.pipeline.status.createSession, {
      sessionId: args.sessionId,
      userId: args.userId,
    });

    // Phase 1 sofort starten (eigenes 10-Min-Budget)
    await ctx.scheduler.runAfter(0, internal.pipeline.orchestrator.runPhase1, {
      sessionId: args.sessionId,
      prompt: args.prompt,
      pdfText: args.pdfText,
      imageDescription: args.imageDescription,
      gradeLevel: args.gradeLevel,
      subject: args.subject,
      userId: args.userId,
    });

    return { sessionId: args.sessionId };
  },
});

// ============================================================================
// PHASE 1: Steps 1-7 + Quality Corrections
// Interpreter → Creative → GameDesigner → [Assets || Content+Quality]
// ============================================================================
export const runPhase1 = internalAction({
  args: {
    sessionId: v.string(),
    prompt: v.string(),
    pdfText: v.optional(v.string()),
    imageDescription: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const stepTimings: Record<string, {
      durationMs: number;
      model?: string;
      inputTokens?: number;
      outputTokens?: number;
    }> = {};

    try {
      // ── STEP 1: INTERPRETER ──────────────────────────────────────
      await setStatus(ctx, args.sessionId, 0);
      const s1 = Date.now();
      const interpreter = await runInterpreter({
        prompt: args.prompt,
        pdfText: args.pdfText,
        imageDescription: args.imageDescription,
        gradeLevel: args.gradeLevel,
        subject: args.subject,
      });
      stepTimings.interpreter = {
        durationMs: Date.now() - s1,
        model: "sonnet",
        inputTokens: interpreter.inputTokens,
        outputTokens: interpreter.outputTokens,
      };

      // ── STEP 2: CREATIVE DIRECTOR ────────────────────────────────
      await setStatus(ctx, args.sessionId, 1);
      const s2 = Date.now();
      const creative = await runCreativeDirector(interpreter.result);
      stepTimings.creative_director = {
        durationMs: Date.now() - s2,
        model: "sonnet",
        inputTokens: creative.inputTokens,
        outputTokens: creative.outputTokens,
      };

      // ── STEP 3: GAME DESIGNER ────────────────────────────────────
      await setStatus(ctx, args.sessionId, 2);
      const s3 = Date.now();
      const gameDesign = await runGameDesigner(interpreter.result, creative.result);
      stepTimings.game_designer = {
        durationMs: Date.now() - s3,
        model: "sonnet",
        inputTokens: gameDesign.inputTokens,
        outputTokens: gameDesign.outputTokens,
      };

      // ── STEPS 4-7: PARALLEL BRANCHES ─────────────────────────────
      const [assetResult, contentResult] = await Promise.all([
        // Branch A: Asset-Pipeline
        (async () => {
          await setStatus(ctx, args.sessionId, 3);
          const s4 = Date.now();
          const assetPlan = await runAssetPlanner(creative.result, gameDesign.result);
          stepTimings.asset_planner = {
            durationMs: Date.now() - s4,
            model: "sonnet",
            inputTokens: assetPlan.inputTokens,
            outputTokens: assetPlan.outputTokens,
          };

          await setStatus(ctx, args.sessionId, 4);
          const s5 = Date.now();
          const assetManifest: AssetManifest = await (async () => {
            try {
              return await runAssetGenerator(assetPlan.result, ctx.storage);
            } catch (error) {
              throw withStepError(error, "E_ASSET_GENERATION", "E_ASSET_GENERATION");
            }
          })();
          stepTimings.asset_generation = { durationMs: Date.now() - s5 };

          return { assetPlan, assetManifest };
        })(),
        // Branch B: Content-Pipeline
        (async () => {
          await setStatus(ctx, args.sessionId, 5);
          const s6 = Date.now();
          const content = await (async () => {
            try {
              return await runContentArchitect(
                interpreter.result, creative.result, gameDesign.result
              );
            } catch (error) {
              throw withStepError(error, "E_CONTENT_ARCHITECT", "E_CONTENT_JSON_PARSE");
            }
          })();
          stepTimings.content_architect = {
            durationMs: Date.now() - s6,
            model: "sonnet",
            inputTokens: content.inputTokens,
            outputTokens: content.outputTokens,
          };

          await setStatus(ctx, args.sessionId, 6);
          const s7 = Date.now();
          const quality = await (async () => {
            try {
              return await runQualityGate(
                interpreter.result, creative.result,
                gameDesign.result, content.result
              );
            } catch (error) {
              throw withStepError(error, "E_QUALITY_GATE", "E_QUALITY_JSON_PARSE");
            }
          })();
          stepTimings.quality_gate = {
            durationMs: Date.now() - s7,
            model: "sonnet",
            inputTokens: quality.inputTokens,
            outputTokens: quality.outputTokens,
          };

          return { content, quality };
        })(),
      ]);

      const { assetManifest } = assetResult;
      const { content, quality } = contentResult;

      // Apply corrections or retry content if score too low
      let finalContent = content.result;
      if (quality.result.overallScore < 5) {
        console.log("Quality score too low, retrying Content Architect...");
        const retry = await (async () => {
          try {
            return await runContentArchitect(
              interpreter.result, creative.result,
              gameDesign.result, quality.result
            );
          } catch (error) {
            throw withStepError(error, "E_CONTENT_RETRY", "E_CONTENT_JSON_PARSE");
          }
        })();
        finalContent = retry.result;
      } else if (
        quality.result.correctedContent &&
        Object.keys(quality.result.correctedContent).length > 0
      ) {
        finalContent = applyCorrections(content.result, quality.result.correctedContent);
      }

      // Pipeline-State für Phase 2 speichern
      await ctx.runMutation(internal.pipeline.status.savePipelineState, {
        sessionId: args.sessionId,
        pipelineState: {
          interpreter: interpreter.result,
          creative: creative.result,
          gameDesign: gameDesign.result,
          assetManifest,
          finalContent,
          quality: quality.result,
          stepTimings,
        },
      });

      // Phase 2 starten (eigenes 10-Min-Budget)
      await ctx.scheduler.runAfter(0, internal.pipeline.orchestrator.runPhase2, {
        sessionId: args.sessionId,
        userId: args.userId,
        prompt: args.prompt,
        gradeLevel: args.gradeLevel,
        subject: args.subject,
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown pipeline error";
      const errorCode = errorMsg.match(/^(E_[A-Z0-9_]+):/)?.[1];
      console.error("Pipeline Phase 1 failed:", errorMsg);
      try {
        await ctx.runMutation(internal.pipeline.status.failSession, {
          sessionId: args.sessionId,
          error: errorMsg,
          errorCode,
          stepTimings,
        });
      } catch { /* ignore */ }
    }
  },
});

// ============================================================================
// PHASE 2: Steps 8-9.5 + Welt speichern
// CodeGenerator → Validator → StructuralGate → Save World
// ============================================================================
export const runPhase2 = internalAction({
  args: {
    sessionId: v.string(),
    userId: v.string(),
    prompt: v.string(),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Pipeline-State von Phase 1 laden
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: any = await ctx.runQuery(
        internal.pipeline.status.loadPipelineState,
        { sessionId: args.sessionId }
      );

      if (!state) {
        throw new Error("Pipeline state not found for session " + args.sessionId);
      }

      const { creative, gameDesign, assetManifest, finalContent, quality, stepTimings } = state;

      // ── STEP 8: CODE GENERATION ──────────────────────────────────
      await setStatus(ctx, args.sessionId, 7);
      const s8 = Date.now();
      const codeGen = await (async () => {
        try {
          return await runCodeGenerator(
            creative, gameDesign, finalContent, assetManifest, quality
          );
        } catch (error) {
          throw withStepError(error, "E_CODE_GENERATOR", "E_CODEGEN_JSON_PARSE");
        }
      })();
      stepTimings.code_generator = {
        durationMs: Date.now() - s8,
        model: "opus",
        inputTokens: codeGen.inputTokens,
        outputTokens: codeGen.outputTokens,
      };

      // ── STEP 9: VALIDATION & FIX LOOP ────────────────────────────
      await setStatus(ctx, args.sessionId, 8);
      const s9 = Date.now();
      const validated = await runValidator(codeGen.code, 2);
      stepTimings.validation = { durationMs: Date.now() - s9 };

      if (!validated.success) {
        console.warn("Validation failed after retries. Errors:", validated.errors);
      }

      // ── STEP 9.5: STRUCTURAL GATE ────────────────────────────────
      const gateResult = runStructuralGate(validated.code);
      if (!gateResult.passed) {
        const errorCode = gateResult.violations[0]?.split(":")[0] || "E_GATE";
        console.error("Structural Gate FAILED:", gateResult.violations);
        try {
          await ctx.runMutation(internal.pipeline.status.failSession, {
            sessionId: args.sessionId,
            error: `Structural Gate Failed: ${gateResult.violations.join(" | ")}`,
            errorCode,
            gateViolations: gateResult.violations,
            qualityScore: quality.overallScore,
          });
        } catch { /* ignore */ }
        return;
      }

      // ── STEP 10: OUTPUT & STORAGE ────────────────────────────────
      const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
        title: creative.worldName,
        code: validated.code,
        userId: args.userId,
        isPublic: false,
        prompt: args.prompt,
        gradeLevel: args.gradeLevel || String(state.interpreter.gradeLevel),
        subject: args.subject || state.interpreter.subject,
        status: "published",
        qualityScore: quality.overallScore,
        validationMetadata: {
          validatorSuccess: validated.success,
          validatorIterations: validated.iterations ?? 0,
          gateScore: gateResult.score,
          gatePassed: true,
          gateViolations: [],
        },
      });

      // Session als fertig markieren
      await ctx.runMutation(internal.pipeline.status.completeSession, {
        sessionId: args.sessionId,
        worldId,
        stepTimings,
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown pipeline error";
      const errorCode = errorMsg.match(/^(E_[A-Z0-9_]+):/)?.[1];
      console.error("Pipeline Phase 2 failed:", errorMsg);
      try {
        await ctx.runMutation(internal.pipeline.status.failSession, {
          sessionId: args.sessionId,
          error: errorMsg,
          errorCode,
        });
      } catch { /* ignore */ }
    }
  },
});
