/**
 * WorldView Page - Eine Lernwelt anzeigen
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Moon, ArrowLeft, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorldPreview } from '@/components/WorldPreview';
import { useAction } from 'convex/react';
import { useState } from 'react';

export default function WorldView() {
  const { worldId } = useParams<{ worldId: string }>();
  const world = useQuery(api.worlds.get, worldId ? { id: worldId as Id<"worlds"> } : 'skip');
  const autoFixCode = useAction(api.generate.autoFixCode);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);

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
    </div>
  );
}
