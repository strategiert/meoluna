import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  Gauge,
  LayoutTemplate,
  ListChecks,
  Server,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminTools = [
  {
    title: "Welten Admin",
    description: "Generierte Welten, Gate-Status, Quality Score und Fehler ansehen.",
    href: "/admin/worlds",
    icon: Database,
    accent: "text-cyan-300",
  },
  {
    title: "Site Studio",
    description: "Admin-Seiten, Projekte und veröffentlichte Site-Inhalte bearbeiten.",
    href: "/admin/site-studio",
    icon: LayoutTemplate,
    accent: "text-amber-300",
  },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Meoluna Admin
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Backend Übersicht
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/worlds">
              <Button variant="outline" className="border-white/15 bg-white/5 text-neutral-100 hover:bg-white/10">
                Welten prüfen
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="border-white/15 bg-white/5 text-neutral-100 hover:bg-white/10">
                Zum Dashboard
              </Button>
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ready") return <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
  if (status === "warning") return <AlertTriangle className="h-5 w-5 text-amber-300" />;
  if (status === "failed") return <XCircle className="h-5 w-5 text-red-300" />;
  return <Activity className="h-5 w-5 text-neutral-400" />;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  tone?: "neutral" | "good" | "warn" | "info";
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-400">{label}</p>
        <div
          className={cn(
            "rounded-md p-2",
            tone === "good" && "bg-emerald-300/10 text-emerald-300",
            tone === "warn" && "bg-amber-300/10 text-amber-300",
            tone === "info" && "bg-cyan-300/10 text-cyan-300",
            tone === "neutral" && "bg-white/10 text-neutral-300",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-xs text-neutral-500">{detail}</p>
    </div>
  );
}

function formatDate(value?: number) {
  if (!value) return "Unbekannt";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminHome() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const overview = useQuery(
    api.admin.getOverview,
    user?.id && convexUser?.role === "admin" ? { userId: user.id } : "skip",
  );

  if (!isLoaded || (user && convexUser === undefined) || (convexUser?.role === "admin" && overview === undefined)) {
    return (
      <AdminShell>
        <div className="flex flex-1 items-center justify-center text-neutral-500">
          Admin-Zugriff und Systemdaten werden geprüft...
        </div>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell>
        <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Anmeldung erforderlich</h2>
          <p className="mt-2 text-neutral-400">
            Bitte melde dich an, um das Admin Panel zu öffnen.
          </p>
        </div>
      </AdminShell>
    );
  }

  if (!convexUser || convexUser.role !== "admin") {
    return (
      <AdminShell>
        <div className="mt-10 rounded-lg border border-red-400/20 bg-red-950/20 p-6">
          <h2 className="text-xl font-semibold text-red-100">Kein Admin-Zugriff</h2>
          <p className="mt-2 text-red-100/70">
            Dein Konto ist angemeldet, aber nicht als Admin freigeschaltet.
          </p>
        </div>
      </AdminShell>
    );
  }

  if (!overview) return null;

  return (
    <AdminShell>
      <main className="flex-1 py-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Welten gesamt"
            value={overview.stats.totalWorlds}
            detail={`${overview.stats.publishedWorlds} published, ${overview.stats.failedWorlds} failed`}
            icon={Database}
            tone="info"
          />
          <MetricCard
            label="Letzte 24h"
            value={overview.stats.worldsLast24h}
            detail={`${overview.stats.activeUsersLast24h} aktive User`}
            icon={Activity}
            tone="good"
          />
          <MetricCard
            label="Quality Score"
            value={overview.stats.averageQualityScore ?? "n/a"}
            detail={`${overview.stats.lowQualityWorlds} Welten unter 7/10`}
            icon={Gauge}
            tone={overview.stats.lowQualityWorlds > 0 ? "warn" : "good"}
          />
          <MetricCard
            label="User und Klassen"
            value={overview.stats.totalUsers}
            detail={`${overview.stats.totalClassrooms} Klassenräume, ${overview.stats.completedWorlds} Abschlüsse`}
            icon={Users}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Achtung nötig</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Welten mit Fehlern, Gate Violations oder niedrigem Quality Score.
                </p>
              </div>
              <Link to="/admin/worlds">
                <Button size="sm" className="bg-cyan-300 text-neutral-950 hover:bg-cyan-200">
                  Details
                </Button>
              </Link>
            </div>

            <div className="mt-4 divide-y divide-white/10">
              {overview.attentionWorlds.length === 0 ? (
                <div className="py-8 text-sm text-neutral-500">Keine akuten Auffälligkeiten.</div>
              ) : (
                overview.attentionWorlds.map((world) => (
                  <Link
                    key={world._id}
                    to={`/w/${world._id}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{world.title}</p>
                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {world.status} · Score {world.qualityScore ?? "n/a"} · {formatDate(world.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-500" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Systemstatus</h2>
            <div className="mt-4 space-y-3">
              {overview.serviceStatuses.map((service) => (
                <div key={service.id} className="rounded-md border border-white/10 bg-neutral-950/50 p-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={service.status} />
                    <div>
                      <p className="font-medium">{service.label}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{service.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Schnellzugriff</h2>
            <div className="mt-4 grid gap-3">
              {adminTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    to={tool.href}
                    className="group rounded-lg border border-white/10 bg-neutral-950/50 p-4 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-md bg-white/10 p-2 ${tool.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{tool.title}</h3>
                          <p className="mt-1 text-sm text-neutral-500">{tool.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-neutral-200" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-semibold">Pipeline Verlauf</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {overview.recentSessions.length === 0 ? (
                <p className="text-sm text-neutral-500">Noch keine Sessions vorhanden.</p>
              ) : (
                overview.recentSessions.map((session) => (
                  <div key={session.sessionId} className="rounded-md border border-white/10 bg-neutral-950/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{session.stepLabel}</p>
                        <p className="mt-1 text-xs text-neutral-500">{formatDate(session.startedAt)}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          session.status === "completed" && "bg-emerald-300/10 text-emerald-300",
                          session.status === "failed" && "bg-red-300/10 text-red-300",
                          session.status === "running" && "bg-cyan-300/10 text-cyan-300",
                        )}
                      >
                        {session.status}
                      </span>
                    </div>
                    {session.error && <p className="mt-2 line-clamp-2 text-xs text-red-200/80">{session.error}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-amber-300" />
              <h2 className="text-xl font-semibold">Häufige Gate Violations</h2>
            </div>
            <div className="mt-4 space-y-2">
              {overview.topGateViolations.length === 0 ? (
                <p className="text-sm text-neutral-500">Keine Gate Violations in den aktuellen Welten.</p>
              ) : (
                overview.topGateViolations.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-neutral-950/50 px-3 py-2">
                    <code className="truncate text-xs text-neutral-300">{item.label}</code>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-semibold">Fächer-Mix</h2>
            </div>
            <div className="mt-4 space-y-2">
              {overview.topSubjects.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-neutral-950/50 px-3 py-2">
                  <span className="truncate text-sm text-neutral-300">{item.label}</span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}
