/**
 * Meoluna Progress API - Verfügbar in allen generierten Lernwelten
 * 
 * Diese API wird automatisch im iframe injiziert und ermöglicht
 * Lernwelten, Fortschritt an Meoluna zu melden.
 * 
 * @example
 * ```tsx
 * // Punkte melden (z.B. bei richtiger Antwort)
 * Meoluna.reportScore(10, { action: 'quiz_correct' });
 * 
 * // Modul abschließen
 * Meoluna.completeModule(0);
 * 
 * // Gesamte Welt abschließen
 * Meoluna.complete(100);
 * ```
 */

interface MeolunaContext {
  /** Was wurde gemacht (z.B. "quiz_correct", "drag_success") */
  action?: string;
  /** Welches Modul (0-basiert) */
  moduleIndex?: number;
  /** Beliebige zusätzliche Daten */
  [key: string]: unknown;
}

interface MeolunaAPI {
  /**
   * Score/Punkte an Meoluna melden
   * @param score - Erreichte Punkte (muss > 0 sein)
   * @param context - Optionaler Kontext für Analytics
   */
  reportScore(score: number, context?: MeolunaContext): void;

  /**
   * Modul als abgeschlossen markieren
   * @param moduleIndex - Index des abgeschlossenen Moduls (0-basiert)
   */
  completeModule(moduleIndex: number): void;

  /**
   * Gesamte Lernwelt als abgeschlossen markieren
   * @param finalScore - Optionaler Endscore
   */
  complete(finalScore?: number): void;

  /**
   * Beliebiges Event senden (für erweiterte Use-Cases)
   * @param eventType - 'score' | 'module' | 'complete'
   * @param amount - Punktzahl
   * @param context - Zusätzlicher Kontext
   */
  emit(eventType: 'score' | 'module' | 'complete', amount: number, context?: MeolunaContext): void;

  /** API Version */
  readonly _version: string;
}

declare global {
  interface Window {
    Meoluna: MeolunaAPI;
    meoluna: MeolunaAPI;
  }
}

// Für direkten Import in generierten Welten
declare const Meoluna: MeolunaAPI;
declare const meoluna: MeolunaAPI;

export { MeolunaAPI, MeolunaContext };
