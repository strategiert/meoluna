import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Activity, ArrowRight, Database, LayoutTemplate, ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

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
            <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Meoluna Admin
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Backend Übersicht
            </h1>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="border-white/15 bg-white/5 text-neutral-100 hover:bg-white/10">
              Zum Dashboard
            </Button>
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}

export default function AdminHome() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip",
  );

  if (!isLoaded || (user && convexUser === undefined)) {
    return (
      <AdminShell>
        <div className="flex flex-1 items-center justify-center text-neutral-500">
          Admin-Zugriff wird geprüft...
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

  return (
    <AdminShell>
      <main className="grid flex-1 gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {adminTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="group rounded-lg border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`rounded-md bg-white/10 p-3 ${tool.accent}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="mt-2 h-5 w-5 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-neutral-200" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">{tool.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">{tool.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-300/10 p-2 text-emerald-300">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Status</h2>
              <p className="text-sm text-neutral-500">Admin-Rolle aktiv</p>
            </div>
          </div>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-neutral-500">User</dt>
              <dd className="mt-1 font-medium">{user.primaryEmailAddress?.emailAddress ?? user.id}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Rolle</dt>
              <dd className="mt-1 font-medium">{convexUser.role}</dd>
            </div>
          </dl>
        </aside>
      </main>
    </AdminShell>
  );
}
