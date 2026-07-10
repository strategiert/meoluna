import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import PhaserPreview from "@/components/game-runtime/PhaserPreview";
import type { GameManifest, ShellToParent } from "@/components/game-runtime/types";

function LabShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Meoluna Admin
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Game Studio V3 (Testumgebung)
          </h1>
          <p className="text-sm text-neutral-500">
            Reine Sichtprüfung. Keine Convex-Writes, keine XP-Verbuchung — Spiel-Events sind
            unvalidierte, selbst gemeldete Daten.
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}

type LogEntry = { at: number; msg: ShellToParent };

export default function GameStudioLab() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getUser, user?.id ? {} : "skip");

  const [games, setGames] = useState<GameManifest[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/game-studio/games/index.json")
      .then((r) => r.json())
      .then((data: { games: GameManifest[] }) => {
        if (cancelled) return;
        setGames(data.games);
        setSelectedId((current) => current ?? data.games[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setGames([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoaded || (user && convexUser === undefined)) {
    return (
      <LabShell>
        <div className="flex flex-1 items-center justify-center text-neutral-500">
          Admin-Zugriff wird geprüft...
        </div>
      </LabShell>
    );
  }

  if (!user) {
    return (
      <LabShell>
        <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Anmeldung erforderlich</h2>
          <p className="mt-2 text-neutral-400">
            Bitte melde dich an, um das Game Studio Lab zu öffnen.
          </p>
        </div>
      </LabShell>
    );
  }

  if (!convexUser || convexUser.role !== "admin") {
    return (
      <LabShell>
        <div className="mt-10 rounded-lg border border-red-400/20 bg-red-950/20 p-6">
          <h2 className="text-xl font-semibold text-red-100">Kein Admin-Zugriff</h2>
          <p className="mt-2 text-red-100/70">
            Dein Konto ist angemeldet, aber nicht als Admin freigeschaltet.
          </p>
        </div>
      </LabShell>
    );
  }

  const selected = games?.find((g) => g.id === selectedId) ?? null;

  const handleEvent = (msg: ShellToParent) => {
    setLog((prev) => [{ at: Date.now(), msg }, ...prev].slice(0, 50));
  };

  return (
    <LabShell>
      <main className="flex-1 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Spiele
            </h2>
            <div className="mt-3 space-y-2">
              {games === null && (
                <p className="text-sm text-neutral-500">Lade Spielliste...</p>
              )}
              {games?.length === 0 && (
                <p className="text-sm text-neutral-500">Keine Spiele registriert.</p>
              )}
              {games?.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(g.id);
                    setLog([]);
                  }}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    g.id === selectedId
                      ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 bg-neutral-950/50 text-neutral-300 hover:border-white/25",
                  )}
                >
                  {g.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              {selected ? (
                <PhaserPreview key={selected.id} manifest={selected} onEvent={handleEvent} />
              ) : (
                <p className="text-sm text-neutral-500">Kein Spiel ausgewählt.</p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Event-Log (letzte {log.length} von max. 50)
              </h2>
              <div className="mt-3 max-h-96 space-y-1 overflow-y-auto font-mono text-xs">
                {log.length === 0 && (
                  <p className="text-neutral-500">Noch keine Events empfangen.</p>
                )}
                {log.map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded px-2 py-1",
                      entry.msg.type === "GAME_ERROR" && "bg-red-950/40 text-red-200",
                      entry.msg.type === "PROGRESS" && "bg-emerald-950/30 text-emerald-200",
                      entry.msg.type !== "GAME_ERROR" && entry.msg.type !== "PROGRESS" && "text-neutral-400",
                    )}
                  >
                    {new Date(entry.at).toLocaleTimeString("de-DE")} — {JSON.stringify(entry.msg)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </LabShell>
  );
}
