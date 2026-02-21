/**
 * Meoluna Sandbox v3 — Powered by Sandpack
 *
 * Ersetzt die fragile Babel+esm.sh Lösung aus v2.
 * Läuft stabil auf Desktop, iPad und Mobile ohne Client-seitige Transpilation.
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
// HTML-TEMPLATE — Tailwind CDN + Basis-Styles
// ============================================================================
const INDEX_HTML = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
              float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
              'pulse-glow': { '0%, 100%': { boxShadow: '0 0 20px rgba(255,255,255,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(255,255,255,0.6)' } },
              shake: { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
            }
          }
        }
      }
    </script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; overflow-x: hidden; }
      #root { min-height: 100vh; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

// ============================================================================
// ENTRY POINT — Meoluna API + React Mount
// ============================================================================
const INDEX_JS = `import { createRoot } from "react-dom/client";
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
  _version: '3.0.0',
};
window.meoluna = window.Meoluna;

const root = createRoot(document.getElementById("root"));
root.render(<App />);
`;

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
      onError?.(sandpack.error.message || 'Sandbox-Fehler', code);
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
  return (
    <SandpackProvider
      key={code}
      template="react"
      theme="dark"
      files={{
        '/App.js': { code, active: true },
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
      }}
    >
      <SandpackBridge onError={onError} onSuccess={onSuccess} code={code} />
      <div style={{ height: '100%', width: '100%' }}>
        <SandpackPreview
          style={{ height: '100%', width: '100%' }}
          showOpenInCodeSandbox={false}
          showNavigator={false}
          showRefreshButton={true}
        />
      </div>
    </SandpackProvider>
  );
};

export default Sandbox;
