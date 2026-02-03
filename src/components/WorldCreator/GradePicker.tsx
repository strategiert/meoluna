/**
 * GradePicker - Klassenstufe auswählen (Schritt 2)
 * Große Buttons mit Zahlen, gruppiert nach Schulart
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GradePickerProps {
  selectedGrade: number | null;
  onSelect: (grade: number) => void;
  onBack: () => void;
  subjectName?: string;
}

const gradeGroups = [
  {
    label: 'Grundschule',
    emoji: '🏫',
    grades: [1, 2, 3, 4],
    color: 'from-green-500 to-emerald-500',
  },
  {
    label: 'Mittelstufe',
    emoji: '📚',
    grades: [5, 6, 7, 8],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Oberstufe',
    emoji: '🎓',
    grades: [9, 10, 11, 12, 13],
    color: 'from-purple-500 to-pink-500',
  },
];

export function GradePicker({
  selectedGrade,
  onSelect,
  onBack,
  subjectName,
}: GradePickerProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">📚 Für welche Klasse?</h2>
          {subjectName && (
            <p className="text-muted-foreground text-sm">Fach: {subjectName}</p>
          )}
        </div>
      </div>

      {/* Grade Groups */}
      <div className="space-y-6">
        {gradeGroups.map((group, groupIndex) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-xl">{group.emoji}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {group.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {group.grades.map((grade, index) => {
                const isSelected = selectedGrade === grade;

                return (
                  <motion.button
                    key={grade}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                    onClick={() => onSelect(grade)}
                    className={cn(
                      'w-16 h-16 rounded-2xl font-bold text-2xl transition-all duration-200',
                      'hover:scale-110 active:scale-95',
                      'border-2 shadow-sm',
                      isSelected
                        ? `bg-gradient-to-br ${group.color} text-white border-transparent shadow-lg`
                        : 'bg-secondary/50 border-transparent hover:border-primary/30'
                    )}
                  >
                    {grade}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground mt-4"
      >
        💡 Wähle die Klasse, für die du lernen möchtest
      </motion.div>
    </div>
  );
}
