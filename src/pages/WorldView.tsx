/**
 * WorldView Page - Eine Lernwelt anzeigen
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Moon, ArrowLeft, Share2, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorldPreview } from '@/components/WorldPreview';
import { useAction } from 'convex/react';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { XPPopup } from '@/components/XPPopup';
import { ProgressStats } from '@/components/ProgressStats';

export default function WorldView() {
  const { worldId } = useParams<{ worldId: string }>();
  const { user } = useUser();
  const world = useQuery(api.worlds.get, worldId ? { id: worldId as Id<"worlds"> } : 'skip');
  const progress = useQuery(
    api.progress.getByWorld,
    user?.id && worldId ? { userId: user.id, worldId: worldId as Id<"worlds"> } : 'skip'
  );
  // userStats für zukünftige Level-Up Detection
  const _userStats = useQuery(api.progress.getStats, user?.id ? { userId: user.id } : 'skip');
  void _userStats; // Suppress unused warning

  const autoFixCode = useAction(api.generate.autoFixCode);
  const addXP = useMutation(api.progress.addXP);
  const completeWorld = useMutation(api.progress.completeWorld);

  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [levelUp] = useState(false);
  const [newLevel] = useState(1);

  // Handler für XP Events aus der Lernwelt
  const handleWorldMessage = useCallback(async (event: MessageEvent) => {
    if (!user?.id || !worldId) return;

    const data = event.data;
    if (typeof data !== 'object' || !data.type) return;

    const showXP = (amount: number) => {
      setEarnedXP(amount);
      setShowXPPopup(true);
    };

    try {
      switch (data.type) {
        case 'xp':
          // XP verdient
          if (typeof data.amount === 'number' && data.amount > 0) {
            await addXP({
              userId: user.id,
              worldId: worldId as Id<"worlds">,
              xpEarned: data.amount,
              moduleIndex: data.moduleIndex,
            });
            showXP(data.amount);
          }
          break;

        case 'module':
          // Modul abgeschlossen (gibt 20 XP)
          if (typeof data.index === 'number') {
            await addXP({
              userId: user.id,
              worldId: worldId as Id<"worlds">,
              xpEarned: 20,
              moduleIndex: data.index,
            });
            showXP(20);
          }
          break;

        case 'complete':
          // Welt abgeschlossen (gibt 50 Bonus XP)
          const result = await completeWorld({
            userId: user.id,
            worldId: worldId as Id<"worlds">,
            bonusXP: 50,
          });
          if (!result.alreadyCompleted) {
            showXP(50);
          }
          break;
      }
    } catch (error) {
      console.error('XP tracking error:', error);
    }
  }, [user?.id, worldId, addXP, completeWorld]);

  // Event Listener für postMessage
  useEffect(() => {
    window.addEventListener('message', handleWorldMessage);
    return () => window.removeEventListener('message', handleWorldMessage);
  }, [handleWorldMessage]);

  const handleAutoFix = async (error: string, failedCode: string) => {
    if (isFixing) return;
    setIsFixing(true);
    try {
      const result = await autoFixCode({ error, code: failedCode });
      if (result.fixedCode) {
        setCurrentCode(result.fixedCode);
      }
    } catch (err) {
      console.error('Auto-fix failed:', err);
    } finally {
      setIsFixing(false);
    }
  };

  // Code to render (either fixed code or original)
  const codeToRender = currentCode || world?.code;

  if (world === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Skeleton className="h-8 w-48" />
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (world === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Moon className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Welt nicht gefunden</h1>
          <p className="text-muted-foreground mb-6">
            Diese Lernwelt existiert nicht oder wurde gelöscht.
          </p>
          <Link to="/explore">
            <Button>Andere Welten entdecken</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <nav className="shrink-0 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Moon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold line-clamp-1">{world.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* XP Progress Anzeige */}
            {user?.id && (
              <ProgressStats userId={user.id} variant="minimal" className="mr-2" />
            )}
            {progress?.xp !== undefined && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
                <Star className="w-4 h-4 text-moon" />
                <span>{progress.xp} XP</span>
              </div>
            )}
            <Button variant="ghost" size="icon">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* World Content */}
      <div className="flex-1 overflow-hidden">
        {codeToRender ? (
          <WorldPreview
            code={codeToRender}
            onCodeUpdate={setCurrentCode}
            onError={handleAutoFix}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Kein Code vorhanden</p>
          </div>
        )}
      </div>

      {/* XP Popup */}
      <XPPopup
        xp={earnedXP}
        show={showXPPopup}
        onComplete={() => setShowXPPopup(false)}
        levelUp={levelUp}
        newLevel={newLevel}
      />
    </div>
  );
}
