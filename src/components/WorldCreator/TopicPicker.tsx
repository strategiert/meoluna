/**
 * TopicPicker - Thema auswählen (Schritt 3)
 * Liste von Themen aus dem Curriculum
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowLeft, Sparkles, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Topic {
  _id: string;
  name: string;
  slug: string;
  gradeLevel: number;
  keywords: string[];
}

interface TopicPickerProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  onSelect: (topic: Topic) => void;
  onBack: () => void;
  onRandom: () => void;
  subjectName?: string;
  gradeLevel?: number;
  isLoading?: boolean;
}

export function TopicPicker({
  topics,
  selectedTopic,
  onSelect,
  onBack,
  onRandom,
  subjectName,
  gradeLevel,
  isLoading,
}: TopicPickerProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-8 w-48 bg-secondary/50 animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-secondary/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">🎯 Welches Thema?</h2>
          {subjectName && gradeLevel && (
            <p className="text-muted-foreground text-sm">
              {subjectName} · Klasse {gradeLevel}
            </p>
          )}
        </div>
      </div>

      {/* Random Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onRandom}
        className={cn(
          'w-full flex items-center justify-center gap-3 p-4 rounded-xl',
          'bg-gradient-to-r from-primary/20 to-purple-500/20',
          'border-2 border-dashed border-primary/30',
          'hover:border-primary hover:from-primary/30 hover:to-purple-500/30',
          'transition-all duration-200'
        )}
      >
        <Shuffle className="w-5 h-5 text-primary" />
        <span className="font-medium">Zufälliges Thema</span>
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </motion.button>

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg mb-2">Noch keine Themen für diese Auswahl</p>
          <p className="text-sm">
            Wähle "Zufälliges Thema" oder eine andere Klasse
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
          {topics.map((topic, index) => {
            const isSelected = selectedTopic?._id === topic._id;

            return (
              <motion.button
                key={topic._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelect(topic)}
                className={cn(
                  'w-full text-left p-4 rounded-xl transition-all duration-200',
                  'border-2',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-transparent bg-secondary/50 hover:bg-secondary hover:border-primary/20'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{topic.name}</span>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-primary"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
                {topic.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {topic.keywords.slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm text-muted-foreground"
      >
        💡 Du kannst später das Thema ändern
      </motion.div>
    </div>
  );
}
