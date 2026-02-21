/**
 * Meoluna Sandbox v3 — Powered by Sandpack
 *
 * Ersetzt die fragile Babel+esm.sh Lösung aus v2.
 * Läuft stabil auf Desktop, iPad und Mobile ohne Client-seitige Transpilation.
 *
 * Tailwind via CDN (externalResources) — PostCSS braucht node:fs, nicht verfügbar im Browser-Sandbox.
 * Fix: Sandpack's `externalResources` Option lädt das Script in den iframe (kein CSP-Problem).
 */

import React, { useEffect, useRef } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react';

// ============================================================================
// INTERFACE (kompatibel mit v2)
// ============================================================================
interface SandboxProps {
  /** Der von Claude generierte React-Code */
  code: string;
  /** Wird aufgerufen wenn ein Fehler auftritt (für Auto-Fix) */
  onError?: (error: string, code: string) => void;
  /** Wird aufgerufen wenn erfolgreich gerendert */
  onSuccess?: () => void;
  /** API-Kompatibilität mit v2 — aktuell nicht genutzt */
  theme?: Record<string, string>;
}

// ============================================================================
// HTML-TEMPLATE — Basis-Styles + Inline Tailwind-Config (kein CDN src-Tag hier,
// das CDN-Script wird via externalResources von Sandpack in den iframe injiziert)
// ============================================================================
const INDEX_HTML = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; overflow-x: hidden; }
      #root { min-height: 100vh; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
    </style>
    <script>
      /* Tailwind CDN Play config — wird von cdn.tailwindcss.com nach dem Laden gelesen */
      window.tailwind = window.tailwind || {};
      window.tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            animation: {
              'float': 'float 3s ease-in-out infinite',
              'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
              'shake': 'shake 0.5s ease-in-out',
              'bounce-in': 'bounce-in 0.5s ease-out',
              'fade-in': 'fade-in 0.3s ease-out',
              'slide-up': 'slide-up 0.4s ease-out',
            },
            keyframes: {
              float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
              'pulse-glow': { '0%, 100%': { boxShadow: '0 0 20px rgba(255,255,255,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(255,255,255,0.6)' } },
              shake: { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
              'bounce-in': { '0%': { transform: 'scale(0.8)', opacity: '0' }, '70%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
              'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
              'slide-up': { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
            }
          }
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

// ============================================================================
// ENTRY POINT — Meoluna API + Error Handler + React Mount
// (kein CSS-Import nötig — Tailwind kommt via externalResources CDN)
// ============================================================================
const INDEX_JS = `import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";

// Meoluna API — global für alle generierten Welten
window.Meoluna = {
  reportScore(score, ctx) {
    if (typeof score !== 'number' || score <= 0) return;
    window.parent.postMessage({
      type: 'meoluna:progress',
      payload: { event: 'score', amount: score, context: ctx || {} }
    }, '*');
  },
  completeModule(moduleIndex) {
    window.parent.postMessage({
      type: 'meoluna:progress',
      payload: { event: 'module', amount: 0, context: { moduleIndex } }
    }, '*');
  },
  complete(finalScore) {
    window.parent.postMessage({
      type: 'meoluna:progress',
      payload: { event: 'complete', amount: finalScore || 0, context: {} }
    }, '*');
  },
  emit(eventType, amount, ctx) {
    window.parent.postMessage({
      type: 'meoluna:progress',
      payload: { event: eventType, amount: amount || 0, context: ctx || {} }
    }, '*');
  },
  speak(text) {
    if (!text || typeof text !== 'string') return;
    window.parent.postMessage({
      type: 'meoluna:speak',
      text: String(text).slice(0, 500)
    }, '*');
  },
  _version: '3.1.0',
};
window.meoluna = window.Meoluna;

// Runtime-Fehler an Parent melden (für AutoFix)
window.onerror = function(msg, _url, line) {
  window.parent.postMessage({
    type: 'SANDBOX_ERROR',
    error: msg + (line ? ' (Zeile ' + line + ')' : '')
  }, '*');
  return false;
};
window.onunhandledrejection = function(event) {
  window.parent.postMessage({
    type: 'SANDBOX_ERROR',
    error: event.reason?.message || String(event.reason)
  }, '*');
};

// Error Boundary — fängt React Render-Fehler und meldet sie via postMessage
class SandboxErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    window.parent.postMessage({
      type: 'SANDBOX_ERROR',
      error: error.message || 'Render-Fehler in der Lernwelt'
    }, '*');
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(
  <SandboxErrorBoundary>
    <App />
  </SandboxErrorBoundary>
);
`;

// ============================================================================
// CODE SANITIZER — Bekannte LLM-Fehler vor dem Rendern fixen
// ============================================================================
function sanitizeCode(code: string): string {
  return code
    // PI/TWO_PI/HALF_PI redeclarations — Konflikt mit p5.js globals
    .replace(/\bconst\s+(PI|TWO_PI|HALF_PI)\s*=\s*[^;]+;?/g, '/* p5 constant, nicht neu deklarieren */')
    // ReactDOM render calls — Rendering übernimmt index.js
    .replace(/\bconst\s+root\s*=\s*createRoot\([^)]*\);?/g, '/* handled by sandbox */')
    .replace(/\broot\.render\([^)]*\);?/g, '/* handled by sandbox */');
}

// ============================================================================
// SANDPACK BRIDGE — Error/Success Callbacks aus Sandpack-State
// ============================================================================
const SandpackBridge: React.FC<{
  onError?: (error: string, code: string) => void;
  onSuccess?: () => void;
  code: string;
}> = ({ onError, onSuccess, code }) => {
  const { sandpack } = useSandpack();
  const hasFiredSuccess = useRef(false);

  // Reset bei neuem Code
  useEffect(() => {
    hasFiredSuccess.current = false;
  }, [code]);

  useEffect(() => {
    if (sandpack.error) {
      const msg = (() => {
        try { return sandpack.error!.message || sandpack.error!.toString() || 'Babel-Fehler'; }
        catch { return 'Babel-Fehler beim Transpilieren'; }
      })();
      onError?.(msg, code);
    }
  }, [sandpack.error]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sandpack.status === 'idle' && !sandpack.error && !hasFiredSuccess.current) {
      hasFiredSuccess.current = true;
      onSuccess?.();
    }
  }, [sandpack.status, sandpack.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

// ============================================================================
// SANDBOX — Hauptkomponente
// ============================================================================
export const Sandbox: React.FC<SandboxProps> = ({
  code,
  onError,
  onSuccess,
}) => {
  const sanitized = sanitizeCode(code);

  // Runtime-Fehler aus iframe abfangen (window.onerror aus INDEX_JS)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SANDBOX_ERROR') {
        onError?.(event.data.error, code);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code, onError]);

  return (
    <SandpackProvider
      key={sanitized}
      template="react"
      theme="dark"
      // SandpackThemeProvider wrapper-div hat all:initial; display:block ohne height.
      // style-prop wird via Prop-Spreading auf den Wrapper-div angewendet.
      style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
      files={{
        '/App.js': { code: sanitized, active: true },
        '/index.js': { code: INDEX_JS, hidden: true },
        '/public/index.html': { code: INDEX_HTML, hidden: true },
      }}
      customSetup={{
        dependencies: {
          'framer-motion': '10.18.0',
          'lucide-react': '0.330.0',
          'canvas-confetti': '1.9.2',
          'recharts': '2.12.0',
          'clsx': '2.1.0',
          'p5': '1.9.0',
          '@dnd-kit/core': '6.1.0',
          '@dnd-kit/sortable': '8.0.0',
          '@dnd-kit/utilities': '3.2.2',
          'react-confetti': '6.1.0',
          'howler': '2.2.4',
          'zustand': '4.5.0',
          'lodash': '4.17.21',
          'date-fns': '3.3.1',
        },
      }}
      options={{
        recompileMode: 'delayed',
        recompileDelay: 500,
        externalResources: ['https://cdn.tailwindcss.com'],
      }}
    >
      <SandpackBridge onError={onError} onSuccess={onSuccess} code={code} />
      <SandpackPreview
        style={{ flex: 1, minHeight: 0 }}
        showOpenInCodeSandbox={false}
        showNavigator={false}
        showRefreshButton={true}
      />
    </SandpackProvider>
  );
};

export default Sandbox;
