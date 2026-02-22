/**
 * WorldView Page - Eine Lernwelt anzeigen
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Moon, ArrowLeft, Share2, Heart, Star, Check, Volume2, VolumeX } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorldPreview } from '@/components/WorldPreview';
import { useAction } from 'convex/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { XPPopup } from '@/components/XPPopup';
import { ProgressStats } from '@/components/ProgressStats';

// ============================================================================
// TYPES
// ============================================================================

interface MeolunaProgressPayload {
  event: 'score' | 'module' | 'complete';
  amount: number;
  context?: {
    action?: string;
    moduleIndex?: number;
  };
}

export default function WorldView() {
  const { worldId } = useParams<{ worldId: string }>();
  const { user } = useUser();
  const world = useQuery(api.worlds.get, worldId ? { id: worldId as Id<"worlds"> } : 'skip');
  const progress = useQuery(
    api.progress.getByWorld,
    user?.id && worldId ? { userId: user.id, worldId: worldId as Id<"worlds"> } : 'skip'
  );
  // userStats für Level-Up Detection
  const userStats = useQuery(api.progress.getUserStats, user?.id ? { userId: user.id } : 'skip');

  const autoFixCode = useAction(api.generate.autoFixCode);
  const reportScore = useMutation(api.progress.reportScore);
  const addXP = useMutation(api.progress.addXP);
  const completeWorldMutation = useMutation(api.progress.completeWorld);
  const toggleLike = useMutation(api.worlds.toggleLike);
  
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const isFixingRef = useRef(false);

  // Voice Mode
  const [voiceEnabled, setVoiceEnabled] = useState(() =>
    localStorage.getItem('meoluna:voice') !== 'false'
  );
  const toggleVoice = () => {
    setVoiceEnabled(v => {
      const next = !v;
      localStorage.setItem('meoluna:voice', String(next));
      return next;
    });
  };

  // Like handler
  const handleLike = async () => {
    if (!worldId || liked) return;
    setLiked(true);
    await toggleLike({ id: worldId as Id<"worlds"> });
  };

  // Share handler
  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showXPPopup, setShowXPPopup] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const speakSeqRef = useRef(0);
  const lastSpokenRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });

  // Track previous level for level-up detection
  const prevLevelRef = useRef<number | null>(null);

  // Level-Up Detection
  useEffect(() => {
    if (userStats?.level !== undefined) {
      if (prevLevelRef.current !== null && userStats.level > prevLevelRef.current) {
        setLevelUp(true);
        setNewLevel(userStats.level);
      }
      prevLevelRef.current = userStats.level;
    }
  }, [userStats?.level]);

  // Helper für XP-Anzeige mit Level-Up Check
  const showXPWithLevelCheck = (amount: number, didLevelUp?: boolean, level?: number) => {
    setEarnedXP(amount);
    if (didLevelUp && level) {
      setLevelUp(true);
      setNewLevel(level);
    }
    setShowXPPopup(true);
  };

  const speakWithBrowser = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find((v) => v.lang.toLowerCase().startsWith('de'));
    if (germanVoice) utterance.voice = germanVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeech = useCallback(() => {
    speakSeqRef.current += 1;

    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current.src = '';
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }

    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current);
      activeAudioUrlRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Voice: TTS via /api/speak — Fallback auf browser-native SpeechSynthesis
  const handleSpeak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text) return;
    const safeText = text.trim().slice(0, 500);
    if (!safeText) return;
    const now = Date.now();
    if (
      lastSpokenRef.current.text === safeText &&
      now - lastSpokenRef.current.ts < 1200
    ) {
      return;
    }
    lastSpokenRef.current = { text: safeText, ts: now };

    stopSpeech();
    const seq = speakSeqRef.current;
    const abortController = new AbortController();
    ttsAbortRef.current = abortController;

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: safeText }),
        signal: abortController.signal,
      });

      if (res.ok && seq === speakSeqRef.current && voiceEnabled) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        activeAudioUrlRef.current = url;
        activeAudioRef.current = audio;
        audio.onended = () => {
          if (activeAudioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            activeAudioUrlRef.current = null;
          } else {
            URL.revokeObjectURL(url);
          }
          if (activeAudioRef.current === audio) activeAudioRef.current = null;
        };
        audio.onerror = () => {
          if (activeAudioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            activeAudioUrlRef.current = null;
          } else {
            URL.revokeObjectURL(url);
          }
          if (activeAudioRef.current === audio) activeAudioRef.current = null;
        };
        await audio.play();
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return;
      }
      console.warn('[Meoluna Voice] Server TTS error:', e);
    } finally {
      if (ttsAbortRef.current === abortController) {
        ttsAbortRef.current = null;
      }
    }

    if (seq !== speakSeqRef.current || !voiceEnabled) return;
    speakWithBrowser(safeText);
  }, [voiceEnabled, speakWithBrowser, stopSpeech]);

  // Handler für neue meoluna:progress Events
  const handleProgressEvent = useCallback(async (payload: MeolunaProgressPayload) => {
    if (!user?.id || !worldId) return;

    const { event, amount, context } = payload;

    try {
      const result = await reportScore({
        userId: user.id,
        worldId: worldId as Id<"worlds">,
        worldScore: amount,
        eventType: event,
        moduleIndex: context?.moduleIndex,
      });

      showXPWithLevelCheck(result.xpAwarded, result.leveledUp, result.newLevel);
    } catch (error) {
      console.error('Progress tracking error:', error);
    }
  }, [user?.id, worldId, reportScore]);

  // Queue for messages that arrive before user is loaded
  const messageQueueRef = useRef<MessageEvent[]>([]);

  // Handler für XP Events aus der Lernwelt
  const handleWorldMessage = useCallback(async (event: MessageEvent) => {
    const data = event.data;
    if (typeof data !== 'object' || !data.type) return;

    if (data.type === 'meoluna:speak' && typeof data.text === 'string') {
      handleSpeak(data.text);
      return;
    }

    // Queue progress messages if user not loaded yet
    if (!user?.id || !worldId) {
      if (data.type === 'meoluna:progress' || data.type === 'xp' || data.type === 'module' || data.type === 'complete') {
        console.log('[Meoluna] Queuing message - user not ready:', data.type);
        messageQueueRef.current.push(event);
      }
      return;
    }

    try {
      // ========================================
      // NEUES PROTOKOLL: meoluna:progress
      // ========================================
      if (data.type === 'meoluna:progress' && data.payload) {
        const payload = data.payload as MeolunaProgressPayload;
        if (payload.event && typeof payload.amount === 'number') {
          await handleProgressEvent(payload);
        }
        return;
      }

      // ========================================
      // LEGACY PROTOKOLL (für Abwärtskompatibilität)
      // ========================================
      switch (data.type) {
        case 'xp':
          // XP verdient (Legacy: amount wird als worldScore behandelt)
          if (typeof data.amount === 'number' && data.amount > 0) {
            const result = await addXP({
              userId: user.id,
              worldId: worldId as Id<"worlds">,
              xpEarned: data.amount,
              moduleIndex: data.moduleIndex,
            });
            showXPWithLevelCheck(data.amount, result.leveledUp, result.newLevel);
          }
          break;

        case 'module':
          // Modul abgeschlossen
          if (typeof data.index === 'number') {
            const result = await reportScore({
              userId: user.id,
              worldId: worldId as Id<"worlds">,
              worldScore: 0, // Kein Score, nur Modul-Event
              eventType: 'module',
              moduleIndex: data.index,
            });
            showXPWithLevelCheck(result.xpAwarded, result.leveledUp, result.newLevel);
          }
          break;

        case 'complete':
          // Welt abgeschlossen
          const result = await completeWorldMutation({
            userId: user.id,
            worldId: worldId as Id<"worlds">,
          });
          if (!result.alreadyCompleted) {
            showXPWithLevelCheck(result.xpAwarded, result.leveledUp, result.newLevel);
          }
          break;
      }
    } catch (error) {
      console.error('XP tracking error:', error);
    }
  }, [user?.id, worldId, addXP, reportScore, completeWorldMutation, handleProgressEvent, handleSpeak]);

  // Event Listener für postMessage
  useEffect(() => {
    window.addEventListener('message', handleWorldMessage);
    return () => window.removeEventListener('message', handleWorldMessage);
  }, [handleWorldMessage]);

  useEffect(() => {
    if (!voiceEnabled) stopSpeech();
  }, [voiceEnabled, stopSpeech]);

  useEffect(() => {
    return () => stopSpeech();
  }, [stopSpeech]);

  // Process queued messages when user becomes available
  useEffect(() => {
    if (user?.id && worldId && messageQueueRef.current.length > 0) {
      console.log('[Meoluna] Processing queued messages:', messageQueueRef.current.length);
      const queue = [...messageQueueRef.current];
      messageQueueRef.current = [];
      queue.forEach(event => handleWorldMessage(event));
    }
  }, [user?.id, worldId, handleWorldMessage]);

  const handleAutoFix = useCallback(async (error: string, failedCode: string) => {
    if (isFixingRef.current) return;

    isFixingRef.current = true;
    try {
      const result = await autoFixCode({ error, code: failedCode });
      if (result.fixedCode) {
        setCurrentCode(result.fixedCode);
      }
    } catch (err) {
      console.error('Auto-fix failed:', err);
    } finally {
      isFixingRef.current = false;
    }
  }, [autoFixCode]);

  // Code to render (either fixed code or original)
  const codeToRender = currentCode || world?.code;

  if (world === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (world === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-24 pb-16">
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
            {/* Welt-spezifische XP */}
            {progress && (progress.xpEarned ?? progress.xp) > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2 border-l border-border pl-2">
                <Star className="w-4 h-4 text-moon" />
                <span>{progress.xpEarned ?? progress.xp} XP in dieser Welt</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              title={voiceEnabled ? 'Stimme ausschalten' : 'Stimme einschalten'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={liked ? "text-red-500" : ""}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleShare}
              className={copied ? "text-green-500" : ""}
            >
              {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
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
        onComplete={() => {
          setShowXPPopup(false);
          setLevelUp(false);
        }}
        levelUp={levelUp}
        newLevel={newLevel}
      />
    </div>
  );
}
