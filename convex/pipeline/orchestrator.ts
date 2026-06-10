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
import { runFocusedInterventionGenerator } from "./steps/focusedInterventionGenerator";
import { runLearningDiagnosis } from "./steps/learningDiagnosis";
import { runMovementSpaceGenerator } from "./steps/movementSpaceGenerator";
import { runMixingBalanceGenerator } from "./steps/mixingBalanceGenerator";
import { runBuildingConstructGenerator } from "./steps/buildingConstructGenerator";
import { runTimeSequenceGenerator } from "./steps/timeSequenceGenerator";
import { runDetectiveEvidenceGenerator } from "./steps/detectiveEvidenceGenerator";
import { runFocusedInterventionGate } from "./engines/focusedInterventionGate";
import { shouldUseFocusedIntervention } from "./engines/focusedInterventionRouter";
import { isLikelyMovementTopic } from "./engines/movementTopicRouter";
import { isLikelyMixingTopic } from "./engines/mixingTopicRouter";
import { isLikelyBuildingTopic } from "./engines/buildingTopicRouter";
import { isLikelyTimeTopic } from "./engines/timeTopicRouter";
import { isLikelyDetectiveTopic } from "./engines/detectiveTopicRouter";

import { STEP_LABELS, STEP_ORDER } from "./types";
import type { AssetManifest } from "./types";

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
    contextAnswers: v.optional(v.object({
      intent: v.optional(v.string()),
      audience: v.optional(v.string()),
      guidance: v.optional(v.string()),
    })),
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

      // ── FOCUSED INTERVENTION ────────────────────────────────────
      // Acute help requests should become compact, complete mini-apps.
      // This route runs before movement-space and the broad world pipeline.
      if (shouldUseFocusedIntervention(args)) {
        try {
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

          const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
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
        } catch (error) {
          console.warn("focused intervention generation failed, falling back to other routes:", error);
        }
      }

      // ── MOVEMENT-SPACE VERTICAL SLICE ───────────────────────────
      // Conservative early route for spatial/number-line topics.
      // If this branch fails validation or rendering, the existing pipeline remains the fallback.
      if (isLikelyMovementTopic(args)) {
        try {
          await setStatus(0);
          const diagnosisStart = Date.now();
          const diagnosis = await runLearningDiagnosis({
            prompt: args.prompt,
            pdfText: args.pdfText,
            gradeLevel: args.gradeLevel,
            subject: args.subject,
          });
          stepTimings.movement_diagnosis = {
            durationMs: Date.now() - diagnosisStart,
            model: "sonnet",
            inputTokens: diagnosis.inputTokens,
            outputTokens: diagnosis.outputTokens,
          };

          await setStatus(1);
          const movementStart = Date.now();
          const movement = await runMovementSpaceGenerator({ brief: diagnosis.result });
          stepTimings.movement_generator = {
            durationMs: Date.now() - movementStart,
            model: "opus",
            inputTokens: movement.inputTokens,
            outputTokens: movement.outputTokens,
          };

          const gateResult = runStructuralGate(movement.code);
          if (!gateResult.passed) {
            throw new Error(`Movement Structural Gate Failed: ${gateResult.violations.join(" | ")}`);
          }

          const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
            title: movement.spec.world.worldName,
            code: movement.code,
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
            code: movement.code,
            worldName: movement.spec.world.worldName,
            duration: Date.now() - startTime,
            qualityScore: 8,
          };
        } catch (error) {
          console.warn("movement-space generation failed, falling back to existing pipeline:", error);
        }
      }

      // ── MIXING-BALANCE ENGINE ───────────────────────────────────
      // Early route for fractions, ratios, mixtures, and balance equations.
      // Runs after movement-space; the broad pipeline remains the fallback.
      if (isLikelyMixingTopic(args)) {
        try {
          await setStatus(0);
          const diagnosisStart = Date.now();
          const diagnosis = await runLearningDiagnosis({
            prompt: args.prompt,
            pdfText: args.pdfText,
            gradeLevel: args.gradeLevel,
            subject: args.subject,
          });
          stepTimings.mixing_diagnosis = {
            durationMs: Date.now() - diagnosisStart,
            model: "sonnet",
            inputTokens: diagnosis.inputTokens,
            outputTokens: diagnosis.outputTokens,
          };

          await setStatus(1);
          const mixingStart = Date.now();
          const mixing = await runMixingBalanceGenerator({ brief: diagnosis.result });
          stepTimings.mixing_generator = {
            durationMs: Date.now() - mixingStart,
            model: "opus",
            inputTokens: mixing.inputTokens,
            outputTokens: mixing.outputTokens,
          };

          const gateResult = runStructuralGate(mixing.code);
          if (!gateResult.passed) {
            throw new Error(`Mixing Structural Gate Failed: ${gateResult.violations.join(" | ")}`);
          }

          const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
            title: mixing.spec.world.worldName,
            code: mixing.code,
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
            code: mixing.code,
            worldName: mixing.spec.world.worldName,
            duration: Date.now() - startTime,
            qualityScore: 8,
          };
        } catch (error) {
          console.warn("mixing-balance generation failed, falling back to existing pipeline:", error);
        }
      }

      // ── BUILDING-CONSTRUCT ENGINE ───────────────────────────────
      // Early route for geometry: areas, perimeters, shape composition.
      // Runs after mixing-balance; the broad pipeline remains the fallback.
      if (isLikelyBuildingTopic(args)) {
        try {
          await setStatus(0);
          const diagnosisStart = Date.now();
          const diagnosis = await runLearningDiagnosis({
            prompt: args.prompt,
            pdfText: args.pdfText,
            gradeLevel: args.gradeLevel,
            subject: args.subject,
          });
          stepTimings.building_diagnosis = {
            durationMs: Date.now() - diagnosisStart,
            model: "sonnet",
            inputTokens: diagnosis.inputTokens,
            outputTokens: diagnosis.outputTokens,
          };

          await setStatus(1);
          const buildingStart = Date.now();
          const building = await runBuildingConstructGenerator({ brief: diagnosis.result });
          stepTimings.building_generator = {
            durationMs: Date.now() - buildingStart,
            model: "opus",
            inputTokens: building.inputTokens,
            outputTokens: building.outputTokens,
          };

          const gateResult = runStructuralGate(building.code);
          if (!gateResult.passed) {
            throw new Error(`Building Structural Gate Failed: ${gateResult.violations.join(" | ")}`);
          }

          const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
            title: building.spec.world.worldName,
            code: building.code,
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
            code: building.code,
            worldName: building.spec.world.worldName,
            duration: Date.now() - startTime,
            qualityScore: 8,
          };
        } catch (error) {
          console.warn("building-construct generation failed, falling back to existing pipeline:", error);
        }
      }

      // ── TIME-SEQUENCE ENGINE ────────────────────────────────────
      // Early route for timelines, processes, and cause-effect chains.
      // Runs after building-construct; the broad pipeline remains the fallback.
      if (isLikelyTimeTopic(args)) {
        try {
          await setStatus(0);
          const diagnosisStart = Date.now();
          const diagnosis = await runLearningDiagnosis({
            prompt: args.prompt,
            pdfText: args.pdfText,
            gradeLevel: args.gradeLevel,
            subject: args.subject,
          });
          stepTimings.time_diagnosis = {
            durationMs: Date.now() - diagnosisStart,
            model: "sonnet",
            inputTokens: diagnosis.inputTokens,
            outputTokens: diagnosis.outputTokens,
          };

          await setStatus(1);
          const timeStart = Date.now();
          const time = await runTimeSequenceGenerator({ brief: diagnosis.result });
          stepTimings.time_generator = {
            durationMs: Date.now() - timeStart,
            model: "opus",
            inputTokens: time.inputTokens,
            outputTokens: time.outputTokens,
          };

          const gateResult = runStructuralGate(time.code);
          if (!gateResult.passed) {
            throw new Error(`Time Structural Gate Failed: ${gateResult.violations.join(" | ")}`);
          }

          const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
            title: time.spec.world.worldName,
            code: time.code,
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
            code: time.code,
            worldName: time.spec.world.worldName,
            duration: Date.now() - startTime,
            qualityScore: 8,
          };
        } catch (error) {
          console.warn("time-sequence generation failed, falling back to existing pipeline:", error);
        }
      }

      // ── DETECTIVE-EVIDENCE ENGINE ───────────────────────────────
      // Early route for reading comprehension, reasoning, and evidence work.
      // Runs after time-sequence; the broad pipeline remains the fallback.
      if (isLikelyDetectiveTopic(args)) {
        try {
          await setStatus(0);
          const diagnosisStart = Date.now();
          const diagnosis = await runLearningDiagnosis({
            prompt: args.prompt,
            pdfText: args.pdfText,
            gradeLevel: args.gradeLevel,
            subject: args.subject,
          });
          stepTimings.detective_diagnosis = {
            durationMs: Date.now() - diagnosisStart,
            model: "sonnet",
            inputTokens: diagnosis.inputTokens,
            outputTokens: diagnosis.outputTokens,
          };

          await setStatus(1);
          const detectiveStart = Date.now();
          const detective = await runDetectiveEvidenceGenerator({ brief: diagnosis.result });
          stepTimings.detective_generator = {
            durationMs: Date.now() - detectiveStart,
            model: "opus",
            inputTokens: detective.inputTokens,
            outputTokens: detective.outputTokens,
          };

          const gateResult = runStructuralGate(detective.code);
          if (!gateResult.passed) {
            throw new Error(`Detective Structural Gate Failed: ${gateResult.violations.join(" | ")}`);
          }

          const worldId: Id<"worlds"> = await ctx.runMutation(api.worlds.create, {
            title: detective.spec.world.worldName,
            code: detective.code,
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
            code: detective.code,
            worldName: detective.spec.world.worldName,
            duration: Date.now() - startTime,
            qualityScore: 8,
          };
        } catch (error) {
          console.warn("detective-evidence generation failed, falling back to existing pipeline:", error);
        }
      }

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
        model: "opus",
        inputTokens: creative.inputTokens,
        outputTokens: creative.outputTokens,
      };

      // ── STEP 3: GAME DESIGNER ────────────────────────────────────
      await setStatus(2);
      const step3Start = Date.now();
      const gameDesign = await runGameDesigner(interpreter.result, creative.result);
      stepTimings.game_designer = {
        durationMs: Date.now() - step3Start,
        model: "opus",
        inputTokens: gameDesign.inputTokens,
        outputTokens: gameDesign.outputTokens,
      };

      // ── STEP 4: ASSET PLANNER ────────────────────────────────────
      await setStatus(3);
      const step4Start = Date.now();
      const assetPlan = await runAssetPlanner(creative.result, gameDesign.result);
      stepTimings.asset_planner = {
        durationMs: Date.now() - step4Start,
        model: "sonnet",
        inputTokens: assetPlan.inputTokens,
        outputTokens: assetPlan.outputTokens,
      };

      // ── STEP 5: ASSET GENERATION (parallel, fal.ai) ─────────────
      await setStatus(4);
      const step5Start = Date.now();
      let assetManifest: AssetManifest = {};
      try {
        assetManifest = await runAssetGenerator(assetPlan.result, ctx.storage);
      } catch (e) {
        console.error("Asset generation failed, continuing with SVG fallbacks:", e);
      }
      stepTimings.asset_generation = {
        durationMs: Date.now() - step5Start,
      };

      // ── STEP 6: CONTENT ARCHITECT ────────────────────────────────
      await setStatus(5);
      const step6Start = Date.now();
      const content = await runContentArchitect(
        interpreter.result,
        creative.result,
        gameDesign.result
      );
      stepTimings.content_architect = {
        durationMs: Date.now() - step6Start,
        model: "opus",
        inputTokens: content.inputTokens,
        outputTokens: content.outputTokens,
      };

      // ── STEP 7: QUALITY GATE ─────────────────────────────────────
      await setStatus(6);
      const step7Start = Date.now();
      const quality = await runQualityGate(
        interpreter.result,
        creative.result,
        gameDesign.result,
        content.result
      );
      stepTimings.quality_gate = {
        durationMs: Date.now() - step7Start,
        model: "sonnet",
        inputTokens: quality.inputTokens,
        outputTokens: quality.outputTokens,
      };

      // Apply corrections or retry content if score too low
      let finalContent = content.result;
      if (quality.result.overallScore < 5) {
        console.log("Quality score too low, retrying Content Architect...");
        const retry = await runContentArchitect(
          interpreter.result,
          creative.result,
          gameDesign.result,
          quality.result
        );
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
      const codeGen = await runCodeGenerator(
        creative.result,
        gameDesign.result,
        finalContent,
        assetManifest,
        quality.result
      );
      stepTimings.code_generator = {
        durationMs: Date.now() - step8Start,
        model: "opus",
        inputTokens: codeGen.inputTokens,
        outputTokens: codeGen.outputTokens,
      };

      // ── STEP 9: VALIDATION & FIX LOOP ────────────────────────────
      await setStatus(8);
      const step9Start = Date.now();
      const validated = await runValidator(codeGen.code);
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

      // Mark session as complete
      await ctx.runMutation(internal.pipeline.status.completeSession, {
        sessionId: args.sessionId,
        worldId,
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
  },
});
