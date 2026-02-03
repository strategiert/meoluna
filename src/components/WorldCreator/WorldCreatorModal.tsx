/**
 * WorldCreatorModal - Modulare Welt-Erstellung
 * 3 Schritte: Fach → Klasse → Thema → Generieren
 * So einfach, dass Erstklässler es verstehen
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Moon } from 'lucide-react';
import { SubjectPicker, Subject } from './SubjectPicker';
import { GradePicker } from './GradePicker';
import { TopicPicker, Topic, UploadedFile } from './TopicPicker';
import { useUser } from '@clerk/clerk-react';

type Step = 'subject' | 'grade' | 'topic' | 'generating';

interface WorldCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Progress-Nachrichten während der Generierung
const generatingMessages = [
  '🌙 Deine Lernwelt wird erschaffen...',
  '✨ Die Sterne ordnen sich...',
  '🎨 Farben werden gemischt...',
  '📚 Wissen wird gesammelt...',
  '🚀 Fast fertig...',
];

export function WorldCreatorModal({ open, onOpenChange }: WorldCreatorModalProps) {
  const { user } = useUser();
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<Step>('subject');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Custom input state
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Convex Queries
  const subjects = useQuery(api.curriculum.getSubjects) as Subject[] | undefined;

  const topics = useQuery(
    api.curriculum.getTopics,
    selectedSubject && selectedGrade
      ? {
          subjectId: selectedSubject._id as Id<'subjects'>,
          gradeLevel: selectedGrade,
        }
      : 'skip'
  ) as Topic[] | undefined;

  // Convex Actions
  const generateWorld = useAction(api.generate.generateWorld);
  const saveWorld = useMutation(api.worlds.create);

  // Reset modal state
  const resetState = useCallback(() => {
    setStep('subject');
    setSelectedSubject(null);
    setSelectedGrade(null);
    setSelectedTopic(null);
    setError(null);
    setGeneratingMessage(0);
    setCustomPrompt('');
    setUploadedFiles([]);
  }, []);

  // Handle close
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        // Small delay before resetting to allow animation
        setTimeout(resetState, 300);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetState]
  );

  // Step handlers
  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setStep('grade');
  };

  const handleGradeSelect = (grade: number) => {
    setSelectedGrade(grade);
    setStep('topic');
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleRandomTopic = () => {
    if (topics && topics.length > 0) {
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      setSelectedTopic(randomTopic);
    }
  };

  const handleBack = () => {
    if (step === 'grade') {
      setStep('subject');
      setSelectedGrade(null);
    } else if (step === 'topic') {
      setStep('grade');
      setSelectedTopic(null);
      setCustomPrompt('');
      setUploadedFiles([]);
    }
  };

  // Check if we can generate (either topic selected or custom prompt)
  const canGenerate = selectedSubject && selectedGrade && (selectedTopic || customPrompt.trim().length > 10);

  // Generate World
  const handleGenerate = async () => {
    if (!selectedSubject || !selectedGrade || !user) {
      setError('Bitte wähle Fach und Klasse aus');
      return;
    }

    if (!selectedTopic && !customPrompt.trim()) {
      setError('Bitte wähle ein Thema oder beschreibe dein eigenes');
      return;
    }

    setStep('generating');
    setError(null);

    // Progress animation
    const messageInterval = setInterval(() => {
      setGeneratingMessage((prev) => (prev + 1) % generatingMessages.length);
    }, 2000);

    try {
      // Generate prompt from selection or custom input
      let prompt: string;
      let title: string;

      if (customPrompt.trim()) {
        // Custom prompt mode
        prompt = `Erstelle eine Lernwelt für Klasse ${selectedGrade} im Fach ${selectedSubject.name}. 
        
Der Nutzer wünscht sich: "${customPrompt}"

Die Welt soll kindgerecht, interaktiv und spielerisch sein.`;
        title = customPrompt.slice(0, 50) + (customPrompt.length > 50 ? '...' : '');
      } else if (selectedTopic) {
        // Topic selection mode
        prompt = `Erstelle eine Lernwelt zum Thema "${selectedTopic.name}" für Klasse ${selectedGrade} im Fach ${selectedSubject.name}. Die Welt soll kindgerecht, interaktiv und spielerisch sein.`;
        title = `${selectedTopic.name} - Klasse ${selectedGrade}`;
      } else {
        throw new Error('Kein Thema ausgewählt');
      }

      // TODO: Handle file uploads (convert to base64 and send to API)
      // For now, we just log them
      if (uploadedFiles.length > 0) {
        console.log('Uploaded files:', uploadedFiles.map(f => f.file.name));
        // Future: Add file content to prompt or send separately
      }

      const result = await generateWorld({ prompt });

      // Save the world
      const worldId = await saveWorld({
        title,
        prompt,
        code: result.code,
        userId: user.id,
        gradeLevel: String(selectedGrade),
        subject: selectedSubject.slug,
        isPublic: false,
      });

      clearInterval(messageInterval);
      handleClose(false);

      // Navigate to the new world
      navigate(`/w/${worldId}`);
    } catch (err) {
      clearInterval(messageInterval);
      setError(
        err instanceof Error ? err.message : 'Da ist etwas schiefgelaufen'
      );
      setStep('topic');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] p-0 gap-0 overflow-y-auto">
        <DialogTitle className="sr-only">Neue Lernwelt erstellen</DialogTitle>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 p-4 border-b bg-secondary/30">
          {['subject', 'grade', 'topic'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s || (step === 'generating' && s === 'topic')
                    ? 'bg-primary text-primary-foreground'
                    : ['grade', 'topic', 'generating'].indexOf(step) > i ||
                      (step === 'generating' && i < 3)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-8 h-0.5 ${
                    ['grade', 'topic', 'generating'].indexOf(step) > i
                      ? 'bg-primary'
                      : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-auto text-sm text-muted-foreground">
            {step === 'subject' && 'Fach'}
            {step === 'grade' && 'Klasse'}
            {step === 'topic' && 'Thema'}
            {step === 'generating' && 'Erstellen...'}
          </span>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 'subject' && (
            <motion.div
              key="subject"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SubjectPicker
                subjects={subjects || []}
                selectedSubject={selectedSubject}
                onSelect={handleSubjectSelect}
                isLoading={!subjects}
              />
            </motion.div>
          )}

          {step === 'grade' && (
            <motion.div
              key="grade"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GradePicker
                selectedGrade={selectedGrade}
                onSelect={handleGradeSelect}
                onBack={handleBack}
                subjectName={selectedSubject?.name}
              />
            </motion.div>
          )}

          {step === 'topic' && (
            <motion.div
              key="topic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TopicPicker
                topics={topics || []}
                selectedTopic={selectedTopic}
                onSelect={handleTopicSelect}
                onBack={handleBack}
                onRandom={handleRandomTopic}
                subjectName={selectedSubject?.name}
                gradeLevel={selectedGrade || undefined}
                isLoading={!topics && selectedSubject !== null && selectedGrade !== null}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />

              {/* Generate Button */}
              <div className="p-4 border-t bg-secondary/30">
                {error && (
                  <p className="text-sm text-destructive mb-3 text-center">
                    {error}
                  </p>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Lernwelt erstellen
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-8 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="mb-6"
              >
                <Moon className="w-16 h-16 text-primary" />
              </motion.div>

              <motion.p
                key={generatingMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-medium mb-2"
              >
                {generatingMessages[generatingMessage]}
              </motion.p>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {customPrompt ? customPrompt.slice(0, 30) + '...' : selectedTopic?.name} · Klasse {selectedGrade}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
