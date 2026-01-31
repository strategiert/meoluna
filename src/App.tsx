/**
 * Meoluna - Magische Lernwelten
 *
 * Hauptanwendung mit Chat-Interface und Live-Preview
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Moon,
  Code,
  Eye,
  Loader2,
  Copy,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { WorldPreview } from './components/WorldPreview';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convex Actions
  const generateWorld = useAction(api.generate.generateWorld);
  const autoFixCode = useAction(api.generate.autoFixCode);

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
    // Verhindere mehrfache Auto-Fix Versuche gleichzeitig
    if (isFixing) return;

    setIsFixing(true);
    try {
      const result = await autoFixCode({ error, code: failedCode });
      if (result.fixedCode) {
        setCurrentCode(result.fixedCode);
      }
    } catch (err) {
      // Bei Rate Limit oder anderen Fehlern: Still fail
      console.error('Auto-fix failed:', err);
    } finally {
      setIsFixing(false);
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
    <div className="h-screen flex bg-slate-950 overflow-hidden">
      {/* Sidebar / Chat */}
      <motion.div
        className={`flex flex-col border-r border-slate-800 bg-slate-900/50 ${
          isFullscreen ? 'hidden' : 'w-[420px]'
        }`}
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Meoluna</h1>
              <p className="text-slate-400 text-sm">Magische Lernwelten</p>
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
              <h2 className="text-xl font-semibold text-white mb-2">
                Willkommen bei Meoluna
              </h2>
              <p className="text-slate-400 mb-6">
                Beschreibe deine Lernwelt und ich erschaffe sie für dich.
              </p>
              <div className="space-y-2 text-sm text-slate-500">
                <p>Beispiele:</p>
                <button
                  onClick={() => setInput('Eine Vulkanwelt für Klasse 7 Geografie')}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-300"
                >
                  "Eine Vulkanwelt für Klasse 7 Geografie"
                </button>
                <button
                  onClick={() => setInput('Bruchrechnung als Piraten-Abenteuer für Klasse 5')}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-300"
                >
                  "Bruchrechnung als Piraten-Abenteuer"
                </button>
                <button
                  onClick={() => setInput('Das Sonnensystem zum Erkunden - interaktiv und spielerisch')}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-300"
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
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <p>{message.content}</p>
                  {message.code && (
                    <button
                      onClick={() => setCurrentCode(message.code!)}
                      className="mt-2 text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
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
              className="flex items-center gap-3 text-slate-400"
            >
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>Erschaffe deine Lernwelt...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Beschreibe deine Lernwelt..."
              rows={1}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !input.trim()}
              className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              Code
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'code' && currentCode && (
              <button
                onClick={copyCode}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Code kopieren"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title={isFullscreen ? 'Verkleinern' : 'Vollbild'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
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
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                <p>Noch keine Lernwelt erstellt</p>
                <p className="text-sm text-slate-600 mt-1">
                  Beschreibe links deine Idee
                </p>
              </div>
            )
          ) : (
            <div className="h-full overflow-auto bg-slate-950 p-4">
              {currentCode ? (
                <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                  <code>{currentCode}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
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
