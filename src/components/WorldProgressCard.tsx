/**
 * WorldProgressCard - Zeigt Welt-spezifischen Fortschritt
 *
 * Visualisiert:
 * - Welt-Punkte (worldScore)
 * - Verdiente XP (xpEarned)
 * - Modul-Fortschritt
 * - Abschluss-Status
 */

import { motion } from 'framer-motion';
import { Star, Zap, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface WorldProgressCardProps {
  worldTitle: string;
  worldScore: number;
  xpEarned: number;
  moduleIndex: number;
  totalModules?: number;
  completedAt?: number | null;
  bestScore?: number;
  attempts?: number;
  scoreLabel?: string;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export function WorldProgressCard({
  worldTitle,
  worldScore,
  xpEarned,
  moduleIndex,
  totalModules = 5, // Default: 5 Module
  completedAt,
  bestScore,
  attempts,
  scoreLabel = 'Punkte',
  variant = 'full',
  className = '',
}: WorldProgressCardProps) {
  const isCompleted = !!completedAt;
  const moduleProgress = totalModules > 0 ? ((moduleIndex + 1) / totalModules) * 100 : 0;

  // Minimal variant: Einzeilige Anzeige
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-between text-sm ${className}`}>
        <span className="truncate font-medium">{worldTitle}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-moon">
            <Star className="w-3.5 h-3.5" />
            {worldScore}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-3.5 h-3.5" />
            +{xpEarned} XP
          </span>
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Clock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }

  // Compact variant: Kleine Karte
  if (variant === 'compact') {
    return (
      <Card className={`bg-card/50 border-border/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{worldTitle}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCompleted ? 'Abgeschlossen' : `Modul ${moduleIndex + 1}/${totalModules}`}
              </p>
            </div>
            {isCompleted ? (
              <div className="p-1.5 rounded-full bg-green-500/10">
                <Trophy className="w-4 h-4 text-green-500" />
              </div>
            ) : (
              <div className="p-1.5 rounded-full bg-moon/10">
                <Clock className="w-4 h-4 text-moon" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-moon font-medium">
              <Star className="w-4 h-4" />
              {worldScore} {scoreLabel}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3.5 h-3.5" />
              +{xpEarned} XP
            </span>
          </div>

          {!isCompleted && (
            <div className="mt-3">
              <Progress value={moduleProgress} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant: Detaillierte Karte
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={`overflow-hidden ${
        isCompleted
          ? 'bg-gradient-to-br from-green-500/5 via-card/50 to-green-500/10 border-green-500/20'
          : 'bg-gradient-to-br from-moon/5 via-card/50 to-aurora/5 border-moon/20'
      }`}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{worldTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isCompleted
                  ? `Abgeschlossen am ${new Date(completedAt!).toLocaleDateString('de-DE')}`
                  : `Modul ${moduleIndex + 1} von ${totalModules}`
                }
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${
              isCompleted ? 'bg-green-500/10' : 'bg-moon/10'
            }`}>
              {isCompleted ? (
                <Trophy className="w-6 h-6 text-green-500" />
              ) : (
                <Clock className="w-6 h-6 text-moon" />
              )}
            </div>
          </div>

          {/* Score und XP */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-background/30 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-moon" />
                <span className="text-xs text-muted-foreground">{scoreLabel}</span>
              </div>
              <p className="text-xl font-bold text-moon">{worldScore}</p>
              {bestScore !== undefined && bestScore > worldScore && (
                <p className="text-xs text-muted-foreground mt-1">
                  Bester: {bestScore}
                </p>
              )}
            </div>
            <div className="p-3 bg-background/30 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-aurora" />
                <span className="text-xs text-muted-foreground">XP verdient</span>
              </div>
              <p className="text-xl font-bold text-aurora">+{xpEarned}</p>
              {attempts !== undefined && attempts > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {attempts} {attempts === 1 ? 'Versuch' : 'Versuche'}
                </p>
              )}
            </div>
          </div>

          {/* Modul-Fortschritt */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Module</span>
              <span className="font-medium">{moduleIndex + 1} / {totalModules}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: totalModules }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i <= moduleIndex
                      ? isCompleted ? 'bg-green-500' : 'bg-moon'
                      : 'bg-background/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton für Loading State
export function WorldProgressCardSkeleton({ variant = 'full' }: { variant?: 'full' | 'compact' | 'minimal' }) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}

export default WorldProgressCard;
