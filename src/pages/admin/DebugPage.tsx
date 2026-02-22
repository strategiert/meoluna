/**
 * Debug Page - Pipeline Session Monitor
 * URL: /admin/debug
 * Zeigt alle letzten Generierungs-Sessions mit Timing + Fehler-Details
 */

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

type StepTiming = {
  durationMs: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
};

type Session = {
  sessionId: string;
  userId: string;
  status: string;
  currentStep: number;
  stepLabel: string;
  error?: string;
  errorCode?: string;
  startedAt: number;
  completedAt?: number;
  durationMs: number;
  stepTimings?: Record<string, StepTiming>;
};

const STEP_NAMES: Record<string, string> = {
  interpreter: '1:Interpreter',
  creative_director: '2:Creative',
  game_designer: '3:GameDesign',
  asset_planner: '4:AssetPlan',
  asset_generation: '5:Assets',
  content_architect: '6:Content',
  quality_gate: '7:QualGate',
  code_generator: '8:CodeGen',
  validation: '9:Validator',
};

function fmtMs(ms: number) {
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-900 text-green-300',
    failed: 'bg-red-900 text-red-300',
    running: 'bg-blue-900 text-blue-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${colors[status] ?? 'bg-gray-800 text-gray-300'}`}>
      {status}
    </span>
  );
}

function TimingBar({ timings }: { timings: Record<string, StepTiming> }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(STEP_NAMES).map(([key, label]) => {
        const t = timings[key];
        if (!t) return null;
        const sec = t.durationMs / 1000;
        const color = sec > 60 ? 'bg-red-700' : sec > 30 ? 'bg-yellow-700' : 'bg-green-800';
        return (
          <span key={key} className={`${color} text-white text-xs px-1.5 py-0.5 rounded font-mono`} title={`${label}: ${fmtMs(t.durationMs)}${t.model ? ` (${t.model})` : ''}${t.inputTokens ? ` in:${t.inputTokens}` : ''}${t.outputTokens ? ` out:${t.outputTokens}` : ''}`}>
            {label.split(':')[0]}: {fmtMs(t.durationMs)}
          </span>
        );
      })}
    </div>
  );
}

export default function DebugPage() {
  const sessions = useQuery(api.pipeline.status.listAllRecent) as Session[] | undefined;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 font-mono text-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">🔍 Pipeline Debug</h1>
            <p className="text-gray-500 text-xs mt-1">
              Letzte 30 Generierungs-Sessions · <span className="text-green-400">grün</span> &lt;30s · <span className="text-yellow-400">gelb</span> 30-60s · <span className="text-red-400">rot</span> &gt;60s
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs"
          >
            ↻ Refresh
          </button>
        </div>

        {!sessions && (
          <div className="text-gray-500 text-center py-12">Lade Sessions...</div>
        )}

        {sessions && sessions.length === 0 && (
          <div className="text-gray-500 text-center py-12">Keine Sessions gefunden</div>
        )}

        <div className="space-y-2">
          {sessions?.map((s) => (
            <div
              key={s.sessionId}
              className={`rounded-lg border p-3 ${
                s.status === 'failed'
                  ? 'border-red-800 bg-red-950/30'
                  : s.status === 'running'
                  ? 'border-blue-800 bg-blue-950/30'
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={s.status} />
                  <span className="text-gray-400 text-xs">{fmtTime(s.startedAt)}</span>
                  <span className="text-yellow-400 font-bold">{fmtMs(s.durationMs)}</span>
                  <span className="text-gray-500 text-xs truncate" title={s.sessionId}>
                    {s.sessionId.slice(0, 24)}…
                  </span>
                </div>
                <span className="text-gray-400 text-xs shrink-0">{s.stepLabel}</span>
              </div>

              {/* Step timings */}
              {s.stepTimings && Object.keys(s.stepTimings).length > 0 && (
                <TimingBar timings={s.stepTimings} />
              )}

              {/* Error */}
              {s.error && (
                <div className="mt-2 bg-red-900/40 border border-red-700 rounded p-2 text-xs">
                  {s.errorCode && (
                    <span className="text-red-300 font-bold mr-2">[{s.errorCode}]</span>
                  )}
                  <span className="text-red-200">{s.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-gray-600 text-xs text-center">
          CLI: <code className="text-gray-400">npx convex run pipeline/status:listRecentFailed</code>
        </div>
      </div>
    </div>
  );
}
