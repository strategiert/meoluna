"use node";

// ============================================================================
// PIPELINE V2 ORCHESTRATOR
// Koordiniert alle 10 Steps der Lernwelt-Generierung
// ============================================================================

import { v } from "convex/values";
import { action } from "../_generated/server";
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

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function withStepError(error: unknown, defaultCode: string, jsonCode: string): Error {
  const message = toErrorMessage(error);
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

// ============================================================================
// MAIN ACTION: generateWorldV2
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
  handler: async (ctx, args): Promise<{
    worldId: Id<"worlds">;
    code: string;
    worldName: string;
    duration: number;
    qualityScore: number;
  }> => {
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

      // ── STEP 1: INTERPRETER ──────────────────────────────────────
      await setStatus(0);
      const step1Start = Date.now();
      const interpreter = await runInterpreter({
        prompt: args.prompt,
        pdfText: args.pdfText,
        imageDescription: args.imageDescription,
        gradeLevel: args.gradeLevel,
        subject: args.subject,
      });
      stepTimings.interpreter = {
        durationMs: Date.now() - step1Start,
        model: "sonnet",
        inputTokens: interpreter.inputTokens,
        outputTokens: interpreter.outputTokens,
      };

      // ── STEP 2: CREATIVE DIRECTOR ────────────────────────────────
      await setStatus(1);
      const step2Start = Date.now();
      const creative = await runCreativeDirector(interpreter.result);
      stepTimings.creative_director = {
        durationMs: Date.now() - step2Start,
        model: "sonnet",
        inputTokens: creative.inputTokens,
        outputTokens: creative.outputTokens,
      };

      // ── STEP 3: GAME DESIGNER ────────────────────────────────────
      await setStatus(2);
      const step3Start = Date.now();
      const gameDesign = await runGameDesigner(interpreter.result, creative.result);
      stepTimings.game_designer = {
        durationMs: Date.now() - step3Start,
        model: "sonnet",
        inputTokens: gameDesign.inputTokens,
        outputTokens: gameDesign.outputTokens,
      };

      // ── STEPS 4-7: PARALLEL BRANCHES ─────────────────────────────
      // Branch A: Asset Pipeline (Steps 4→5)
      // Branch B: Content Pipeline (Steps 6→7)
      // Diese sind unabhängig und laufen parallel für ~45-100s Zeitersparnis
      const [assetResult, contentResult] = await Promise.all([
        // Branch A: Asset-Pipeline
        (async () => {
          await setStatus(3); // "Plane die Grafiken..."
          const step4Start = Date.now();
          const assetPlan = await runAssetPlanner(creative.result, gameDesign.result);
          stepTimings.asset_planner = {
            durationMs: Date.now() - step4Start,
            model: "sonnet",
            inputTokens: assetPlan.inputTokens,
            outputTokens: assetPlan.outputTokens,
          };

          await setStatus(4); // "Generiere einzigartige Grafiken..."
          const step5Start = Date.now();
          const assetManifest: AssetManifest = await (async () => {
            try {
              return await runAssetGenerator(assetPlan.result, ctx.storage);
            } catch (error) {
              throw withStepError(error, "E_ASSET_GENERATION", "E_ASSET_GENERATION");
            }
          })();
          stepTimings.asset_generation = {
            durationMs: Date.now() - step5Start,
          };

          return { assetPlan, assetManifest };
        })(),
        // Branch B: Content-Pipeline
        (async () => {
          await setStatus(5); // "Erstelle die Spiel-Challenges..."
          const step6Start = Date.now();
          const content = await (async () => {
            try {
              return await runContentArchitect(
                interpreter.result,
                creative.result,
                gameDesign.result
              );
            } catch (error) {
              throw withStepError(error, "E_CONTENT_ARCHITECT", "E_CONTENT_JSON_PARSE");
            }
          })();
          stepTimings.content_architect = {
            durationMs: Date.now() - step6Start,
            model: "sonnet",
            inputTokens: content.inputTokens,
            outputTokens: content.outputTokens,
          };

          await setStatus(6); // "Qualitätsprüfung..."
          const step7Start = Date.now();
          const quality = await (async () => {
            try {
              return await runQualityGate(
                interpreter.result,
                creative.result,
                gameDesign.result,
                content.result
              );
            } catch (error) {
              throw withStepError(error, "E_QUALITY_GATE", "E_QUALITY_JSON_PARSE");
            }
          })();
          stepTimings.quality_gate = {
            durationMs: Date.now() - step7Start,
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
              interpreter.result,
              creative.result,
              gameDesign.result,
              quality.result
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

      // ── STEP 8: CODE GENERATION ──────────────────────────────────
      await setStatus(7);
      const step8Start = Date.now();
      const codeGen = await (async () => {
        try {
          return await runCodeGenerator(
            creative.result,
            gameDesign.result,
            finalContent,
            assetManifest,
            quality.result
          );
        } catch (error) {
          throw withStepError(error, "E_CODE_GENERATOR", "E_CODEGEN_JSON_PARSE");
        }
      })();
      stepTimings.code_generator = {
        durationMs: Date.now() - step8Start,
        model: "opus",
        inputTokens: codeGen.inputTokens,
        outputTokens: codeGen.outputTokens,
      };

      // ── STEP 9: VALIDATION & FIX LOOP ────────────────────────────
      await setStatus(8);
      const step9Start = Date.now();
      const validated = await runValidator(codeGen.code, 2);
      stepTimings.validation = {
        durationMs: Date.now() - step9Start,
      };

      if (!validated.success) {
        console.warn("Validation failed after retries. Errors:", validated.errors);
      }

      // ── STEP 9.5: STRUCTURAL GATE ────────────────────────────────
      const gateResult = runStructuralGate(validated.code);
      if (!gateResult.passed) {
        const errorCode = gateResult.violations[0]?.split(":")[0] || "E_GATE";
        console.error("Structural Gate FAILED:", gateResult.violations);

        // Session als failed markieren mit Telemetrie-Daten (überschreibt failSession im catch)
        try {
          await ctx.runMutation(internal.pipeline.status.failSession, {
            sessionId: args.sessionId,
            error: `Structural Gate Failed: ${gateResult.violations.join(" | ")}`,
            errorCode,
            gateViolations: gateResult.violations,
            qualityScore: quality.result.overallScore,
          });
        } catch {
          // Ignorieren — catch-Block macht ggf. nochmal failSession
        }

        // Kein worlds-Insert — direkt Exception
        throw new Error(`${errorCode}: ${gateResult.violations.join(" | ")}`);
      }

      // ── STEP 10: OUTPUT & STORAGE ────────────────────────────────
      const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
        title: creative.result.worldName,
        code: validated.code,
        userId: args.userId,
        isPublic: false,
        prompt: args.prompt,
        gradeLevel: args.gradeLevel || String(interpreter.result.gradeLevel),
        subject: args.subject || interpreter.result.subject,
        status: "published",
        qualityScore: quality.result.overallScore,
        validationMetadata: {
          validatorSuccess: validated.success,
          validatorIterations: validated.iterations ?? 0,
          gateScore: gateResult.score,
          gatePassed: true,
          gateViolations: [],
        },
      });

      // Mark session as complete (with step timings for debug)
      await ctx.runMutation(internal.pipeline.status.completeSession, {
        sessionId: args.sessionId,
        worldId,
        stepTimings,
      });

      return {
        worldId,
        code: validated.code,
        worldName: creative.result.worldName,
        duration: Date.now() - startTime,
        qualityScore: quality.result.overallScore,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown pipeline error";
      const errorCode = errorMsg.match(/^(E_[A-Z0-9_]+):/)?.[1];
      console.error("Pipeline V2 failed:", errorMsg);

      try {
        await ctx.runMutation(internal.pipeline.status.failSession, {
          sessionId: args.sessionId,
          error: errorMsg,
          errorCode,
          stepTimings,
        });
      } catch {
        // Ignore session update failure
      }

      throw new Error(`Pipeline V2 Error: ${errorMsg}`);
    }
  },
});
