/**
 * ProgressStats - XP, Level und Fortschrittsanzeige
 */

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Star, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressStatsProps {
  userId: string;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

// Level-Titel basierend auf Level
function getLevelTitle(level: number): string {
  const titles = [
    'Mondkind',      // 1
    'Sterngucker',   // 2
    'Nachtwanderer', // 3
    'Mondschein',    // 4
    'Sterndeuter',   // 5
    'Nachtweise',    // 6
    'Mondmeister',   // 7
    'Sternenweber',  // 8
    'Nachthimmel',   // 9
    'Mondlegende',   // 10+
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

// Level-Farbe basierend auf Level
function getLevelColor(level: number): string {
  if (level <= 2) return 'text-moon';
  if (level <= 4) return 'text-aurora';
  if (level <= 6) return 'text-stars';
  if (level <= 8) return 'text-nebula';
  return 'text-yellow-400';
}

export function ProgressStats({ userId, variant = 'full', className = '' }: ProgressStatsProps) {
  // Nutze getUserStats für schnellere, denormalisierte Daten
  const stats = useQuery(api.progress.getUserStats, { userId });

  if (stats === undefined) {
    return <ProgressStatsSkeleton variant={variant} />;
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 text-sm">
          <Star className={`w-4 h-4 ${getLevelColor(stats.level)}`} />
          <span className="font-medium">Lv. {stats.level}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>{stats.totalXP} XP</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`bg-card/50 border-border/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-moon/10`}>
                <Star className={`w-5 h-5 ${getLevelColor(stats.level)}`} />
              </div>
              <div>
                <p className="font-semibold">Level {stats.level}</p>
                <p className="text-xs text-muted-foreground">{getLevelTitle(stats.level)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-moon">{stats.totalXP} XP</p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={stats.levelProgress.progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {stats.levelProgress.current} / {stats.levelProgress.needed} XP zum nächsten Level
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="bg-gradient-to-br from-moon/10 via-card/50 to-aurora/10 border-moon/20 overflow-hidden">
        <CardContent className="p-6">
          {/* Header mit Level */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-moon/30 rounded-2xl blur-xl" />
                <div className="relative p-4 bg-gradient-to-br from-moon/20 to-aurora/20 rounded-2xl border border-moon/30">
                  <Star className={`w-8 h-8 ${getLevelColor(stats.level)}`} />
                </div>
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold">Level {stats.level}</h3>
                <p className={`text-lg ${getLevelColor(stats.level)}`}>{getLevelTitle(stats.level)}</p>
              </div>
            </div>
            <div className="text-right">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-moon to-aurora bg-clip-text text-transparent"
              >
                {stats.totalXP}
              </motion.p>
              <p className="text-sm text-muted-foreground">Gesamt XP</p>
            </div>
          </div>

          {/* Progress zum nächsten Level */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fortschritt zu Level {stats.level + 1}</span>
              <span className="font-medium">
                {stats.levelProgress.current} / {stats.levelProgress.needed} XP
              </span>
            </div>
            <div className="relative">
              <Progress value={stats.levelProgress.progress} className="h-3 bg-background/50" />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.levelProgress.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-moon to-aurora rounded-full"
                style={{ height: '100%' }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-aurora" />
                <span className="text-sm text-muted-foreground">Abgeschlossen</span>
              </div>
              <p className="text-xl font-bold">{stats.completedWorlds}</p>
            </div>
            <div className="p-3 bg-background/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-moon" />
                <span className="text-sm text-muted-foreground">Erkundet</span>
              </div>
              <p className="text-xl font-bold">{stats.totalWorlds}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProgressStatsSkeleton({ variant }: { variant: string }) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-2 w-full mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div>
              <Skeleton className="h-7 w-24 mb-2" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-3 w-full mb-6" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgressStats;
