/**
 * Meoluna Sandbox - Führt beliebigen React-Code im iframe aus
 *
 * Features:
 * - Babel Transpilation (JSX → JS)
 * - esm.sh für npm-Pakete on-the-fly
 * - Tailwind CDN Support
 * - Error Boundary mit "Oops"-Screen
 * - Auto-Fix Trigger bei Fehlern
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SandboxProps {
  /** Der von Claude generierte React-Code */
  code: string;
  /** Wird aufgerufen wenn ein Fehler auftritt (für Auto-Fix) */
  onError?: (error: string, code: string) => void;
  /** Wird aufgerufen wenn erfolgreich gerendert */
  onSuccess?: () => void;
  /** Optionales Theme (CSS-Variablen) */
  theme?: Record<string, string>;
}

export const Sandbox: React.FC<SandboxProps> = ({
  code,
  onError,
  onSuccess,
  theme = {}
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [key, setKey] = useState(0);

  // CSS-Variablen aus Theme generieren
  const themeCSS = Object.entries(theme)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n    ');

  const generateHTML = useCallback(() => {
    // Escape den Code für sicheres Einbetten
    const escapedCode = code
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          animation: {
            'float': 'float 3s ease-in-out infinite',
            'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
            'shake': 'shake 0.5s ease-in-out',
          },
          keyframes: {
            float: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-10px)' },
            },
            'pulse-glow': {
              '0%, 100%': { boxShadow: '0 0 20px rgba(255,255,255,0.3)' },
              '50%': { boxShadow: '0 0 40px rgba(255,255,255,0.6)' },
            },
            shake: {
              '0%, 100%': { transform: 'translateX(0)' },
              '25%': { transform: 'translateX(-5px)' },
              '75%': { transform: 'translateX(5px)' },
            }
          }
        }
      }
    }
  </script>

  <!-- Custom Theme Variables -->
  <style>
    :root {
      ${themeCSS}
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    #root {
      min-height: 100vh;
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }

    /* Error Screen Styles */
    .error-screen {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .error-message {
      color: #94a3b8;
      max-width: 400px;
      margin-bottom: 1.5rem;
    }

    .error-details {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 1rem;
      font-family: monospace;
      font-size: 0.75rem;
      max-width: 500px;
      max-height: 150px;
      overflow: auto;
      text-align: left;
      color: #fca5a5;
    }

    .loading-screen {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>

  <!-- Babel Standalone für JSX Transpilation -->
  <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
</head>
<body>
  <div id="root">
    <div class="loading-screen">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: #94a3b8;">Lernwelt wird geladen...</p>
    </div>
  </div>

  <script type="module">
    // =========================================================================
    // IMPORT MAP - Alle verfügbaren npm-Pakete via esm.sh
    // =========================================================================
    const importMap = {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom": "https://esm.sh/react-dom@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "framer-motion": "https://esm.sh/framer-motion@10.18.0?deps=react@18.2.0",
      "lucide-react": "https://esm.sh/lucide-react@0.330.0?deps=react@18.2.0",
      "canvas-confetti": "https://esm.sh/canvas-confetti@1.9.2",
      "recharts": "https://esm.sh/recharts@2.12.0?deps=react@18.2.0,react-dom@18.2.0",
      "clsx": "https://esm.sh/clsx@2.1.0",
      "lodash": "https://esm.sh/lodash@4.17.21",
      "date-fns": "https://esm.sh/date-fns@3.3.1",
      "zustand": "https://esm.sh/zustand@4.5.0?deps=react@18.2.0",
      "@dnd-kit/core": "https://esm.sh/@dnd-kit/core@6.1.0?deps=react@18.2.0",
      "react-confetti": "https://esm.sh/react-confetti@6.1.0?deps=react@18.2.0",
      "howler": "https://esm.sh/howler@2.2.4",
    };

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================
    function showError(title, message, details = '') {
      document.getElementById('root').innerHTML = \`
        <div class="error-screen">
          <div class="error-icon">🌋</div>
          <div class="error-title">\${title}</div>
          <div class="error-message">\${message}</div>
          \${details ? \`<div class="error-details">\${details}</div>\` : ''}
        </div>
      \`;

      // Fehler an Parent-Window senden
      window.parent.postMessage({
        type: 'SANDBOX_ERROR',
        error: details || message
      }, '*');
    }

    // Globaler Error Handler
    window.onerror = function(msg, url, line, col, error) {
      showError(
        'Hoppla! Da ist etwas schiefgelaufen',
        'Die Lernwelt konnte nicht geladen werden. Wir versuchen, das zu reparieren...',
        \`\${msg} (Zeile \${line})\`
      );
      return true;
    };

    window.onunhandledrejection = function(event) {
      showError(
        'Hoppla! Ein Fehler ist aufgetreten',
        'Etwas hat nicht funktioniert. Wir kümmern uns darum...',
        event.reason?.message || String(event.reason)
      );
    };

    // =========================================================================
    // CODE TRANSPILATION & EXECUTION
    // =========================================================================
    async function loadAndRun() {
      try {
        // 1. User Code
        const userCode = \`${escapedCode}\`;

        if (!userCode.trim()) {
          showError(
            'Keine Lernwelt gefunden',
            'Es wurde noch kein Code generiert.',
            ''
          );
          return;
        }

        // 2. Imports ersetzen mit esm.sh URLs
        let processedCode = userCode;

        // Standard ES6 imports umwandeln
        for (const [pkg, url] of Object.entries(importMap)) {
          // import X from 'pkg'
          const defaultImportRegex = new RegExp(
            \`import\\\\s+(\\\\w+)\\\\s+from\\\\s+['\"]\${pkg.replace('/', '\\\\/')}['\"]\\\\s*;?\`,
            'g'
          );
          processedCode = processedCode.replace(defaultImportRegex, \`const \$1 = (await import("\${url}")).default;\`);

          // import { X, Y } from 'pkg'
          const namedImportRegex = new RegExp(
            \`import\\\\s+\\\\{([^}]+)\\\\}\\\\s+from\\\\s+['\"]\${pkg.replace('/', '\\\\/')}['\"]\\\\s*;?\`,
            'g'
          );
          processedCode = processedCode.replace(namedImportRegex, (match, names) => {
            const namedImports = names.split(',').map(n => n.trim()).filter(Boolean);
            return \`const { \${namedImports.join(', ')} } = await import("\${url}");\`;
          });

          // import X, { Y, Z } from 'pkg'
          const mixedImportRegex = new RegExp(
            \`import\\\\s+(\\\\w+)\\\\s*,\\\\s*\\\\{([^}]+)\\\\}\\\\s+from\\\\s+['\"]\${pkg.replace('/', '\\\\/')}['\"]\\\\s*;?\`,
            'g'
          );
          processedCode = processedCode.replace(mixedImportRegex, (match, defaultName, names) => {
            const namedImports = names.split(',').map(n => n.trim()).filter(Boolean);
            return \`const _mod = await import("\${url}"); const \${defaultName} = _mod.default; const { \${namedImports.join(', ')} } = _mod;\`;
          });
        }

        // 3. Wrap in async function für top-level await
        const wrappedCode = \`
          (async () => {
            \${processedCode}

            // Render the App
            const { createRoot } = await import("https://esm.sh/react-dom@18.2.0/client");
            const React = (await import("https://esm.sh/react@18.2.0")).default;

            // Error Boundary Component
            class ErrorBoundary extends React.Component {
              constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
              }

              static getDerivedStateFromError(error) {
                return { hasError: true, error };
              }

              componentDidCatch(error, errorInfo) {
                console.error('React Error:', error, errorInfo);
                window.parent.postMessage({
                  type: 'SANDBOX_ERROR',
                  error: error.message
                }, '*');
              }

              render() {
                if (this.state.hasError) {
                  return React.createElement('div', { className: 'error-screen' },
                    React.createElement('div', { className: 'error-icon' }, '🌋'),
                    React.createElement('div', { className: 'error-title' }, 'Hoppla! Die Lernwelt hat sich verschluckt'),
                    React.createElement('div', { className: 'error-message' }, 'Keine Sorge, wir reparieren das gerade...'),
                    React.createElement('div', { className: 'error-details' }, this.state.error?.message || 'Unbekannter Fehler')
                  );
                }
                return this.props.children;
              }
            }

            // Find the default export (App component)
            const AppComponent = typeof App !== 'undefined' ? App :
                                typeof default_1 !== 'undefined' ? default_1 : null;

            if (!AppComponent) {
              throw new Error('Keine App-Komponente gefunden. Bitte exportiere eine "App" oder "export default" Komponente.');
            }

            const root = createRoot(document.getElementById('root'));
            root.render(
              React.createElement(ErrorBoundary, null,
                React.createElement(AppComponent)
              )
            );

            // Erfolg melden
            window.parent.postMessage({ type: 'SANDBOX_SUCCESS' }, '*');
          })().catch(err => {
            showError(
              'Fehler beim Starten',
              'Die Lernwelt konnte nicht initialisiert werden.',
              err.message
            );
          });
        \`;

        // 4. Transpile mit Babel
        const transpiledCode = Babel.transform(wrappedCode, {
          presets: ['react'],
          filename: 'app.jsx'
        }).code;

        // 5. Execute
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = transpiledCode;
        document.body.appendChild(script);

      } catch (err) {
        showError(
          'Kompilierungsfehler',
          'Der Code konnte nicht verarbeitet werden.',
          err.message
        );
      }
    }

    // Start
    loadAndRun();
  </script>
</body>
</html>
    `;
  }, [code, themeCSS]);

  // Auf Nachrichten vom iframe hören
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SANDBOX_ERROR') {
        setStatus('error');
        onError?.(event.data.error, code);
      } else if (event.data?.type === 'SANDBOX_SUCCESS') {
        setStatus('success');
        onSuccess?.();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code, onError, onSuccess]);

  // Code-Änderungen debounced anwenden
  useEffect(() => {
    setStatus('loading');
    const timer = setTimeout(() => {
      setKey(k => k + 1);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      {/* Status Indicator */}
      <div className="absolute top-2 right-2 z-10">
        {status === 'loading' && (
          <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Lädt...
          </div>
        )}
        {status === 'success' && (
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Bereit
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Fehler
          </div>
        )}
      </div>

      {/* Reload Button */}
      <button
        onClick={() => setKey(k => k + 1)}
        className="absolute top-2 left-2 z-10 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors"
        title="Neu laden"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* The Sandbox iframe */}
      <iframe
        key={key}
        ref={iframeRef}
        srcDoc={generateHTML()}
        className="w-full h-full border-none"
        title="Meoluna Lernwelt"
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
      />
    </div>
  );
};

export default Sandbox;
