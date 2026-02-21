/**
 * SandboxLab - local harness to test Sandbox/WorldPreview without generating a new world.
 */

import { useMemo, useState } from "react";
import { WorldPreview } from "@/components/WorldPreview";
import { Button } from "@/components/ui/button";

const EXAMPLES: Record<string, { title: string; code: string }> = {
  minimal: {
    title: "Minimal",
    code: `import React from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-3xl font-bold">Sandbox OK</div>
        <div className="text-white/70">JSX + Tailwind</div>
      </div>
    </div>
  );
}
`,
  },
  no_react_import: {
    title: "No React Import (should still work)",
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-3xl font-bold">No React import</div>
        <button
          className="px-4 py-2 rounded-lg bg-amber-300 text-slate-950 hover:bg-amber-200"
          onClick={() => window.Meoluna?.reportScore?.(10, { action: "click_test", moduleIndex: 0 })}
        >
          Click = +10 XP event
        </button>
      </div>
    </div>
  );
}
`,
  },
  // ── SMOKE TEST 1: CSS-Check ───────────────────────────────────────────────
  css_check: {
    title: "🎨 CSS-Check (Tailwind muss blau sein)",
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-blue-500 text-white flex items-center justify-center">
      <div className="text-4xl font-bold p-8 rounded-xl bg-white text-blue-500 shadow-xl">
        CSS OK ✓
      </div>
    </div>
  );
}
`,
  },
  // ── SMOKE TEST 2: Motion-Check ────────────────────────────────────────────
  motion_check: {
    title: "🎬 Motion-Check (Animation muss laufen)",
    code: `import { motion } from "framer-motion";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <motion.div
        className="w-24 h-24 rounded-2xl bg-purple-500 flex items-center justify-center text-white text-2xl font-bold"
        animate={{ x: [0, 120, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        ▶
      </motion.div>
    </div>
  );
}
`,
  },
  // ── SMOKE TEST 3: Interaction-Check ──────────────────────────────────────
  interaction_check: {
    title: "🕹️ Interaction-Check (State + Meoluna API)",
    code: `import { useState } from "react";

export default function App() {
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  function handleClick() {
    const newScore = score + 10;
    setScore(newScore);
    window.Meoluna?.reportScore(10, { moduleIndex: 0 });
    if (newScore >= 30) {
      setDone(true);
      window.Meoluna?.completeModule(0);
      window.Meoluna?.complete(newScore);
    }
  }

  return (
    <div className="min-h-screen bg-green-950 text-white flex flex-col items-center justify-center gap-6">
      <div className="text-5xl font-bold">{score} Pkt</div>
      {done ? (
        <div className="text-2xl text-green-400 font-bold">✅ Interaction OK — Meoluna API OK</div>
      ) : (
        <button
          className="px-8 py-4 bg-green-500 hover:bg-green-400 rounded-xl text-xl font-bold transition-colors"
          onClick={handleClick}
        >
          +10 Punkte (3x klicken)
        </button>
      )}
    </div>
  );
}
`,
  },
};

export default function SandboxLab() {
  const [code, setCode] = useState(EXAMPLES.no_react_import.code);
  const [selected, setSelected] = useState<keyof typeof EXAMPLES>("no_react_import");
  const [runKey, setRunKey] = useState(0);

  const title = useMemo(() => EXAMPLES[selected]?.title ?? "SandboxLab", [selected]);

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">SandboxLab</h1>
            <p className="text-sm text-muted-foreground">
              Lokales Test-Harness fuer die Sandbox. Kein Convex/Generierung noetig.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={selected}
              onChange={(e) => {
                const k = e.target.value as keyof typeof EXAMPLES;
                setSelected(k);
                setCode(EXAMPLES[k].code);
              }}
            >
              {Object.entries(EXAMPLES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.title}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setRunKey((k) => k + 1)}>
              Run
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">{title} - Code</div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-[520px] w-full rounded-lg border border-input bg-background p-3 font-mono text-xs"
              spellCheck={false}
            />
            <div className="text-xs text-muted-foreground">
              Tip: fuer harte Reloads den "Run" Button nutzen (iframe wird neu erstellt).
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Preview</div>
            <div className="h-[520px]">
              {/* force re-mount on Run */}
              <WorldPreview key={runKey} code={code} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

