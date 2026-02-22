/**
 * WorldCreatorModal - Modulare Welt-Erstellung
 * 3 Schritte: Fach → Klasse → Thema → Generieren
 * So einfach, dass Erstklässler es verstehen
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Moon } from 'lucide-react';
import { SubjectPicker, Subject } from './SubjectPicker';
import { GradePicker } from './GradePicker';
import { TopicPicker, Topic, UploadedFile } from './TopicPicker';
import { useUser } from '@clerk/clerk-react';
import { P5Background } from '@/components/landing/P5Background';

type Step = 'subject' | 'grade' | 'topic' | 'generating';

function getUserFriendlyError(error: string): string {
  if (error.includes("timeout") || error.includes("Timeout"))
    return "Die Generierung hat zu lange gedauert. Bitte versuche es erneut.";
  if (error.includes("Asset") || error.includes("SVG") || error.includes("Gemini"))
    return "Die Bildgenerierung ist fehlgeschlagen. Bitte versuche es erneut.";
  if (error.includes("JSON parse") || error.includes("parse failed"))
    return "Ein technischer Fehler ist aufgetreten. Bitte versuche es erneut.";
  if (error.includes("Structural Gate"))
    return "Der generierte Code erfüllt die Qualitätsanforderungen nicht. Bitte versuche es mit einem anderen Prompt.";
  return "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.";
}

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
  // Async pipeline session tracking
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convex Queries
  const subjects = useQuery(api.curriculum.getSubjects) as Subject[] | undefined;
  const pipelineSession = useQuery(
    api.pipeline.status.getSession,
    activeSessionId ? { sessionId: activeSessionId } : "skip"
  );

  const topics = useQuery(
    api.curriculum.getTopics,
    selectedSubject && selectedGrade
      ? {
          subjectId: selectedSubject._id as Id<'subjects'>,
          gradeLevel: selectedGrade,
        }
      : 'skip'
  ) as Topic[] | undefined;

  // Convex Actions & Mutations
  const generateWorldV2 = useAction(api.pipeline.orchestrator.generateWorldV2);
  const extractTextFromPDF = useAction(api.documents.extractTextFromPDF);

  // Watch pipeline session for completion/failure
  useEffect(() => {
    if (!pipelineSession) return;
    if (pipelineSession.status === "completed" && pipelineSession.worldId) {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
      setActiveSessionId(null);
      handleClose(false);
      navigate(`/w/${pipelineSession.worldId}`);
    } else if (pipelineSession.status === "failed") {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
      setActiveSessionId(null);
      setError(pipelineSession.error || "Unbekannter Fehler bei der Generierung");
      setStep('topic');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineSession?.status, pipelineSession?.worldId]);

  // Reset modal state
  const resetState = useCallback(() => {
    if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    messageIntervalRef.current = null;
    setStep('subject');
    setSelectedSubject(null);
    setSelectedGrade(null);
    setSelectedTopic(null);
    setError(null);
    setGeneratingMessage(0);
    setCustomPrompt('');
    setUploadedFiles([]);
    setActiveSessionId(null);
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

  // Helper: File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

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
    messageIntervalRef.current = setInterval(() => {
      setGeneratingMessage((prev) => (prev + 1) % generatingMessages.length);
    }, 2000);

    try {
      // Generate prompt from selection or custom input
      let prompt: string;

      if (customPrompt.trim()) {
        // Custom prompt mode
        prompt = `Erstelle eine Lernwelt für Klasse ${selectedGrade} im Fach ${selectedSubject.name}.

Der Nutzer wünscht sich: "${customPrompt}"

Die Welt soll kindgerecht, interaktiv und spielerisch sein.`;
      } else if (selectedTopic) {
        // Topic selection mode
        prompt = `Erstelle eine Lernwelt zum Thema "${selectedTopic.name}" für Klasse ${selectedGrade} im Fach ${selectedSubject.name}. Die Welt soll kindgerecht, interaktiv und spielerisch sein.`;
      } else {
        throw new Error('Kein Thema ausgewählt');
      }

      // Handle file uploads
      let pdfText: string | null = null;

      if (uploadedFiles.length > 0) {
        for (const uploadedFile of uploadedFiles) {
          if (uploadedFile.type === 'pdf') {
            // Extract text from PDF using OCR
            const base64 = await fileToBase64(uploadedFile.file);
            const extractResult = await extractTextFromPDF({
              pdfBase64: base64,
              fileName: uploadedFile.file.name,
            });
            pdfText = extractResult.text;
            prompt += `\n\nDer Nutzer hat ein Dokument hochgeladen: "${uploadedFile.file.name}"`;
          } else if (uploadedFile.type === 'image') {
            // For images, we mention them in the prompt
            // The actual image could be uploaded to storage for future Vision API use
            prompt += `\n\nDer Nutzer hat ein Bild hochgeladen: "${uploadedFile.file.name}" - Bitte beziehe dich thematisch darauf.`;
          }
        }
      }

      const imageFiles = uploadedFiles
        .filter((f) => f.type === 'image')
        .map((f) => f.file.name);
      const imageDescription = imageFiles.length > 0
        ? `Hochgeladene Bilder: ${imageFiles.join(', ')}`
        : undefined;

      const sessionId = `creator_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setActiveSessionId(sessionId);

      // Startet Pipeline asynchron — gibt sofort zurück
      await generateWorldV2({
        prompt,
        pdfText: pdfText || undefined,
        imageDescription,
        gradeLevel: String(selectedGrade),
        subject: selectedSubject.slug,
        userId: user.id,
        sessionId,
      });

      // Pipeline läuft im Hintergrund weiter.
      // Navigation passiert im useEffect wenn session.status === "completed"
    } catch (err) {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
      setActiveSessionId(null);
      setError(
        err instanceof Error ? err.message : 'Da ist etwas schiefgelaufen'
      );
      setStep('topic');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="left-0 top-0 translate-x-0 translate-y-0 w-full h-[100dvh] max-w-none rounded-none sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-[500px] sm:h-auto sm:max-h-[90vh] sm:rounded-lg p-0 gap-0 overflow-y-auto">
        <DialogTitle className="sr-only">Neue Lernwelt erstellen</DialogTitle>
        <DialogDescription className="sr-only">Erstelle eine neue interaktive Lernwelt in wenigen Schritten.</DialogDescription>

        {/* Progress Indicator */}
        <div className="relative flex items-center justify-center gap-2 p-4 border-b bg-secondary/30">
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
          <span className="absolute right-4 text-sm text-muted-foreground">
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
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-3 text-center">
                    <p className="text-sm text-destructive mb-3">{getUserFriendlyError(error)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setError(null); handleGenerate(); }}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      Erneut versuchen
                    </Button>
                  </div>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative min-h-[400px] overflow-hidden rounded-lg bg-gradient-to-b from-[#0a0a1a] to-[#1a1a2e]"
            >
              {/* Animated p5.js Background */}
              <P5Background />

              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

              {/* Content overlay */}
              <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] px-8 text-center">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  className="mb-8"
                >
                  <Moon className="w-20 h-20 text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
                </motion.div>

                <motion.p
                  key={generatingMessage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-xl font-medium mb-4 text-white drop-shadow-lg"
                >
                  {generatingMessages[generatingMessage]}
                </motion.p>

                <div className="flex items-center gap-3 text-white/70 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {customPrompt ? customPrompt.slice(0, 30) + '...' : selectedTopic?.name} · Klasse {selectedGrade}
                  </span>
                </div>

                {/* Floating particles hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="mt-8 text-xs text-white/40"
                >
                  Beobachte die Magie im Hintergrund...
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
