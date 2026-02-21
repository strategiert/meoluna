/**
 * Admin Debug-View — /admin/worlds
 * Zeigt alle generierten Welten mit Status, Quality Score, Fehlercode und Gate Violations.
 */

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-green-500/20 text-green-300 border border-green-500/40",
  quarantined: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  failed: "bg-red-500/20 text-red-300 border border-red-500/40",
};

function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-gray-600">—</span>;
  const color = score >= 7 ? "text-green-400" : score >= 5 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-mono font-bold ${color}`}>{score}/10</span>;
}

export default function WorldsAdmin() {
  const worlds = useQuery(api.worlds.listForAdmin);

  if (!worlds) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white/50">
        Lade…
      </div>
    );
  }

  const published = worlds.filter(w => (w.status ?? "published") === "published").length;
  const failed = worlds.filter(w => w.status === "failed").length;
  const quarantined = worlds.filter(w => w.status === "quarantined").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Welten Admin</h1>
        <div className="flex gap-4 text-sm text-gray-400">
          <span>Gesamt: <strong className="text-white">{worlds.length}</strong></span>
          <span>✅ Published: <strong className="text-green-400">{published}</strong></span>
          {quarantined > 0 && <span>⚠️ Quarantined: <strong className="text-yellow-400">{quarantined}</strong></span>}
          {failed > 0 && <span>❌ Failed: <strong className="text-red-400">{failed}</strong></span>}
        </div>
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left p-3">Titel / Prompt</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Fach · Klasse</th>
              <th className="text-left p-3">Fehler</th>
              <th className="text-left p-3">Gate Violations</th>
              <th className="text-left p-3">Erstellt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {worlds.map(w => (
              <tr key={w._id} className="hover:bg-white/[0.03] transition-colors">
                {/* Titel */}
                <td className="p-3 max-w-56">
                  <div className="font-medium text-white truncate" title={w.title}>{w.title}</div>
                  {w.prompt && (
                    <div className="text-gray-500 text-xs truncate mt-0.5" title={w.prompt}>{w.prompt}</div>
                  )}
                </td>

                {/* Status */}
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLE[w.status] ?? STATUS_STYLE.published}`}>
                    {w.status ?? "published"}
                  </span>
                </td>

                {/* Quality Score */}
                <td className="p-3">
                  <ScoreBadge score={w.qualityScore} />
                </td>

                {/* Fach · Klasse */}
                <td className="p-3 text-gray-300 whitespace-nowrap">
                  {w.subject && <span>{w.subject}</span>}
                  {w.gradeLevel && <span className="text-gray-500"> · Kl.{w.gradeLevel}</span>}
                  {!w.subject && !w.gradeLevel && <span className="text-gray-600">—</span>}
                </td>

                {/* Fehlercode */}
                <td className="p-3 max-w-48">
                  {w.error ? (
                    <code className="text-red-400 text-xs break-all" title={w.error}>
                      {w.error.slice(0, 80)}{w.error.length > 80 ? "…" : ""}
                    </code>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>

                {/* Gate Violations */}
                <td className="p-3">
                  {w.validationMetadata?.gateViolations?.length ? (
                    <ul className="text-xs text-red-300 space-y-0.5">
                      {w.validationMetadata.gateViolations.slice(0, 3).map((v, i) => (
                        <li key={i} className="font-mono">{v}</li>
                      ))}
                      {w.validationMetadata.gateViolations.length > 3 && (
                        <li className="text-gray-500">+{w.validationMetadata.gateViolations.length - 3} weitere</li>
                      )}
                    </ul>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>

                {/* Datum */}
                <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                  {w.createdAt ? new Date(w.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {worlds.length === 0 && (
          <div className="p-12 text-center text-gray-500">Noch keine Welten vorhanden.</div>
        )}
      </div>
    </div>
  );
}
