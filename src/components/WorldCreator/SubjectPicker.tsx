/**
 * SubjectPicker - Fach auswählen (Schritt 1)
 * Große, bunte Icons für Kinder
 */

import { cn } from '@/lib/utils';
import {
  Calculator,
  BookOpen,
  Globe,
  Languages,
  Palette,
  Music,
  Dumbbell,
  Heart,
  Leaf,
  Atom,
  FlaskConical,
  Clock,
  Map,
  Scale,
  Code,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Calculator,
  BookOpen,
  Globe,
  Languages,
  Palette,
  Music,
  Dumbbell,
  Heart,
  Leaf,
  Atom,
  FlaskConical,
  Clock,
  Map,
  Scale,
  Code,
};

export interface Subject {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
}

interface SubjectPickerProps {
  subjects: Subject[];
  selectedSubject: Subject | null;
  onSelect: (subject: Subject) => void;
  isLoading?: boolean;
}

export function SubjectPicker({
  subjects,
  selectedSubject,
  onSelect,
  isLoading,
}: SubjectPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-4">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-secondary/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Filter nur Grundschul-Fächer für den Anfang (order <= 8)
  const primarySubjects = subjects.filter((s) => s.order <= 8);
  const secondarySubjects = subjects.filter((s) => s.order > 8);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 px-2">🎓 Was möchtest du lernen?</h2>
        <p className="text-muted-foreground">Wähle ein Fach aus</p>
      </div>

      {/* Grundschule */}
      <div>
        <p className="text-sm text-muted-foreground mb-3 px-1">Grundschule</p>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          {primarySubjects.map((subject) => {
            const IconComponent = iconMap[subject.icon] || BookOpen;
            const isSelected = selectedSubject?._id === subject._id;

            return (
              <button
                key={subject._id}
                onClick={() => onSelect(subject)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  'border-2',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-transparent bg-secondary/50 hover:bg-secondary'
                )}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: subject.color + '20' }}
                >
                  <IconComponent
                    className="w-6 h-6 sm:w-7 sm:h-7"
                    style={{ color: subject.color }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">
                  {subject.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sekundarstufe (eingeklappt oder kleiner) */}
      {secondarySubjects.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3 px-1">
            Weiterführende Schule
          </p>
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2">
            {secondarySubjects.map((subject) => {
              const IconComponent = iconMap[subject.icon] || BookOpen;
              const isSelected = selectedSubject?._id === subject._id;

              return (
                <button
                  key={subject._id}
                  onClick={() => onSelect(subject)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200',
                    'hover:scale-105 active:scale-95',
                    'border-2',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent bg-secondary/30 hover:bg-secondary/50'
                  )}
                >
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: subject.color }}
                  />
                  <span className="text-xs text-center leading-tight">
                    {subject.name.split('/')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
