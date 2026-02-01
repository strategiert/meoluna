/**
 * Create Page - Weltgenerierung mit Chat
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Moon,
  Code,
  Eye,
  Loader2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorldPreview } from '@/components/WorldPreview';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: Date;
}

export default function Create() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [worldTitle, setWorldTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convex Actions
  const generateWorld = useAction(api.generate.generateWorld);
  const autoFixCode = useAction(api.generate.autoFixCode);
  const saveWorld = useMutation(api.worlds.create);

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setWorldTitle(input.trim());
    setInput('');
    setIsGenerating(true);

    try {
      const result = await generateWorld({ prompt: userMessage.content });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hier ist deine Lernwelt! 🌙✨',
        code: result.code,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentCode(result.code);

    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Hoppla, da ist etwas schiefgelaufen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleSaveWorld = async () => {
    if (!currentCode || !user) return;

    try {
      const worldId = await saveWorld({
        title: worldTitle || 'Neue Lernwelt',
        code: currentCode,
        userId: user.id,
        isPublic: false
      });
      navigate(`/w/${worldId}`);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar / Chat */}
      <motion.div
        className={`flex flex-col border-r border-border bg-card/50 ${
          isFullscreen ? 'hidden' : 'w-[420px]'
        }`}
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Neue Welt</h1>
                <p className="text-muted-foreground text-sm">Beschreibe deine Idee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🌙
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">
                Was möchtest du lernen?
              </h2>
              <p className="text-muted-foreground mb-6">
                Beschreibe deine Lernwelt und ich erschaffe sie für dich.
              </p>
              <div className="space-y-2 text-sm w-full">
                <button
                  onClick={() => setInput('Eine Vulkanwelt für Klasse 7 Geografie')}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  "Eine Vulkanwelt für Klasse 7 Geografie"
                </button>
                <button
                  onClick={() => setInput('Bruchrechnung als Piraten-Abenteuer für Klasse 5')}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  "Bruchrechnung als Piraten-Abenteuer"
                </button>
                <button
                  onClick={() => setInput('Das Sonnensystem zum Erkunden - interaktiv und spielerisch')}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  "Das Sonnensystem zum Erkunden"
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  <p>{message.content}</p>
                  {message.code && (
                    <button
                      onClick={() => setCurrentCode(message.code!)}
                      className="mt-2 text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Welt anzeigen
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>Erschaffe deine Lernwelt...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full">Anmelden um Welten zu erstellen</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Beschreibe deine Lernwelt..."
                rows={1}
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !input.trim()}
                size="icon"
                className="h-auto aspect-square"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </SignedIn>
        </div>
      </motion.div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/30">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('preview')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button
              variant={activeTab === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('code')}
              className="gap-2"
            >
              <Code className="w-4 h-4" />
              Code
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {currentCode && user && (
              <Button variant="outline" size="sm" onClick={handleSaveWorld} className="gap-2">
                <Save className="w-4 h-4" />
                Speichern
              </Button>
            )}
            {activeTab === 'code' && currentCode && (
              <Button variant="ghost" size="icon" onClick={copyCode}>
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'preview' ? (
            currentCode ? (
              <WorldPreview
                code={currentCode}
                onCodeUpdate={setCurrentCode}
                onError={handleAutoFix}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Moon className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">Noch keine Lernwelt erstellt</p>
                <p className="text-sm mt-1">
                  Beschreibe links deine Idee
                </p>
              </div>
            )
          ) : (
            <div className="h-full overflow-auto bg-background p-4">
              {currentCode ? (
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{currentCode}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Kein Code vorhanden</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
