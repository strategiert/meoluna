/**
 * Admin Debug-View — /admin/worlds
 * Zeigt generierte Welten mit Status, Quality Score, Fehlercode und Gate Violations.
 */

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Copy, ExternalLink, Filter, Search, SlidersHorizontal } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AdminWorld = {
  _id: string;
  title: string;
  prompt?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  status: string;
  qualityScore?: number;
  error?: string;
  validationMetadata?: {
    gateViolations: string[];
    gateScore: number;
    gatePassed: boolean;
    validatorIterations: number;
    validatorSuccess: boolean;
  };
  subject?: string;
  gradeLevel?: string;
  isPublic: boolean;
  views: number;
  likes: number;
  codeLength: number;
  createdAt: number;
};

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25",
  quarantined: "bg-amber-400/10 text-amber-300 border border-amber-400/25",
  failed: "bg-red-400/10 text-red-300 border border-red-400/25",
};

function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-neutral-600">n/a</span>;
  const color = score >= 7 ? "text-emerald-300" : score >= 5 ? "text-amber-300" : "text-red-300";
  return <span className={`font-mono font-semibold ${color}`}>{score}/10</span>;
}

function formatDate(value?: number) {
  if (!value) return "n/a";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matchesQuality(world: AdminWorld, qualityFilter: string) {
  if (qualityFilter === "all") return true;
  if (qualityFilter === "missing") return world.qualityScore == null;
  if (qualityFilter === "low") return typeof world.qualityScore === "number" && world.qualityScore < 7;
  if (qualityFilter === "good") return typeof world.qualityScore === "number" && world.qualityScore >= 7;
  return true;
}

export default function WorldsAdmin() {
  const { user, isLoaded } = useUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [selectedWorld, setSelectedWorld] = useState<AdminWorld | null>(null);

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const worlds = useQuery(
    api.admin.listWorlds,
    user?.id && convexUser?.role === "admin" ? { userId: user.id } : "skip",
  );

  const adminWorlds = (worlds ?? []) as AdminWorld[];
  const subjects = useMemo(
    () => Array.from(new Set(adminWorlds.map((world) => world.subject).filter(Boolean))).sort() as string[],
    [adminWorlds],
  );
  const grades = useMemo(
    () => Array.from(new Set(adminWorlds.map((world) => world.gradeLevel).filter(Boolean))).sort() as string[],
    [adminWorlds],
  );

  const filteredWorlds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return adminWorlds.filter((world) => {
      const text = [world.title, world.prompt, world.userEmail, world.userName, world.userId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const matchesStatus = statusFilter === "all" || world.status === statusFilter;
      const matchesSubject = subjectFilter === "all" || world.subject === subjectFilter;
      const matchesGrade = gradeFilter === "all" || world.gradeLevel === gradeFilter;

      return matchesSearch && matchesStatus && matchesSubject && matchesGrade && matchesQuality(world, qualityFilter);
    });
  }, [adminWorlds, gradeFilter, qualityFilter, search, statusFilter, subjectFilter]);

  if (!isLoaded || (user && convexUser === undefined) || (convexUser?.role === "admin" && worlds === undefined)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white/50">
        Lade Admin-Daten...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 p-10 text-center text-neutral-300">
        Bitte anmelden, um den Welten Admin zu öffnen.
      </div>
    );
  }

  if (!convexUser || convexUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-neutral-950 p-10 text-center text-neutral-300">
        Nur Admins dürfen diese Ansicht nutzen.
      </div>
    );
  }

  const published = filteredWorlds.filter((world) => world.status === "published").length;
  const failed = filteredWorlds.filter((world) => world.status === "failed").length;
  const quarantined = filteredWorlds.filter((world) => world.status === "quarantined").length;

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-neutral-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link to="/admin" className="mb-4 inline-flex text-sm text-neutral-500 hover:text-white">
            Zurück zur Admin Übersicht
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Welten Admin</h1>
              <p className="mt-2 text-sm text-neutral-500">
                Generierungen prüfen, Probleme filtern und einzelne Welten im Detail ansehen.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="text-lg font-semibold">{filteredWorlds.length}</div>
                <div className="text-neutral-500">Gefiltert</div>
              </div>
              <div className="rounded-md border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
                <div className="text-lg font-semibold text-emerald-300">{published}</div>
                <div className="text-neutral-500">Published</div>
              </div>
              <div className="rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2">
                <div className="text-lg font-semibold text-amber-300">{quarantined}</div>
                <div className="text-neutral-500">Quarantine</div>
              </div>
              <div className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2">
                <div className="text-lg font-semibold text-red-300">{failed}</div>
                <div className="text-neutral-500">Failed</div>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(4,1fr)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Titel, Prompt oder User suchen..."
                className="border-white/10 bg-neutral-950 pl-9 text-neutral-100"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-white/10 bg-neutral-950 text-neutral-100">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status filtern: alle</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="quarantined">Quarantined</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="border-white/10 bg-neutral-950 text-neutral-100">
                <SelectValue placeholder="Fach filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Fach filtern: alle</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="border-white/10 bg-neutral-950 text-neutral-100">
                <SelectValue placeholder="Klasse filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Klasse filtern: alle</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>Klasse {grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger className="border-white/10 bg-neutral-950 text-neutral-100">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Quality: alle</SelectItem>
                <SelectItem value="good">Quality: ab 7</SelectItem>
                <SelectItem value="low">Quality: unter 7</SelectItem>
                <SelectItem value="missing">Quality: fehlt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="p-3 text-left">Titel / Prompt</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Quality</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Fach · Klasse</th>
                <th className="p-3 text-left">Fehler</th>
                <th className="p-3 text-left">Gate Violations</th>
                <th className="p-3 text-left">Erstellt</th>
                <th className="p-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredWorlds.map((world) => (
                <tr key={world._id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="max-w-72 p-3">
                    <div className="truncate font-medium text-white" title={world.title}>{world.title}</div>
                    {world.prompt && (
                      <div className="mt-0.5 line-clamp-1 text-xs text-neutral-500" title={world.prompt}>{world.prompt}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[world.status] ?? STATUS_STYLE.published}`}>
                      {world.status}
                    </span>
                  </td>
                  <td className="p-3"><ScoreBadge score={world.qualityScore} /></td>
                  <td className="max-w-48 p-3 text-neutral-300">
                    <div className="truncate">{world.userName ?? world.userEmail ?? world.userId ?? "n/a"}</div>
                    {world.userEmail && <div className="truncate text-xs text-neutral-600">{world.userEmail}</div>}
                  </td>
                  <td className="p-3 whitespace-nowrap text-neutral-300">
                    {world.subject || "n/a"}
                    {world.gradeLevel && <span className="text-neutral-500"> · Kl. {world.gradeLevel}</span>}
                  </td>
                  <td className="max-w-52 p-3">
                    {world.error ? (
                      <code className="line-clamp-2 text-xs text-red-300" title={world.error}>
                        {world.error}
                      </code>
                    ) : (
                      <span className="text-neutral-700">n/a</span>
                    )}
                  </td>
                  <td className="p-3">
                    {world.validationMetadata?.gateViolations?.length ? (
                      <div className="text-xs text-amber-200">
                        {world.validationMetadata.gateViolations.length} Einträge
                      </div>
                    ) : (
                      <span className="text-neutral-700">n/a</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap p-3 text-xs text-neutral-500">{formatDate(world.createdAt)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedWorld(world)}
                        className="border-white/10 bg-white/[0.03] text-neutral-100 hover:bg-white/10"
                      >
                        <Filter className="mr-2 h-3.5 w-3.5" />
                        Details
                      </Button>
                      <Link to={`/w/${world._id}`}>
                        <Button size="sm" className="bg-cyan-300 text-neutral-950 hover:bg-cyan-200">
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Welt öffnen
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredWorlds.length === 0 && (
            <div className="p-12 text-center text-neutral-500">Keine Welten für diese Filter.</div>
          )}
        </div>
      </div>

      <Sheet open={!!selectedWorld} onOpenChange={(open) => !open && setSelectedWorld(null)}>
        <SheetContent className="w-full overflow-y-auto border-white/10 bg-neutral-950 text-neutral-100 sm:max-w-2xl">
          {selectedWorld && (
            <>
              <SheetHeader>
                <SheetTitle className="text-neutral-100">{selectedWorld.title}</SheetTitle>
                <SheetDescription className="text-neutral-500">
                  Details zur generierten Welt, Prompt, Gate-Ergebnis und Laufzeitdaten.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs text-neutral-500">Status</p>
                    <p className={cn("mt-2 text-sm font-semibold", selectedWorld.status === "failed" ? "text-red-300" : selectedWorld.status === "quarantined" ? "text-amber-300" : "text-emerald-300")}>
                      {selectedWorld.status}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs text-neutral-500">Quality</p>
                    <div className="mt-2"><ScoreBadge score={selectedWorld.qualityScore} /></div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs text-neutral-500">Code</p>
                    <p className="mt-2 text-sm font-semibold">{selectedWorld.codeLength.toLocaleString("de-DE")} Zeichen</p>
                  </div>
                </div>

                <section>
                  <h3 className="font-semibold">Prompt</h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-neutral-300">
                    {selectedWorld.prompt || "Kein Prompt gespeichert."}
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold">Metadaten</h3>
                  <dl className="mt-2 grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-500">User</dt>
                      <dd className="mt-1">{selectedWorld.userName ?? selectedWorld.userEmail ?? selectedWorld.userId ?? "n/a"}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Sichtbarkeit</dt>
                      <dd className="mt-1">{selectedWorld.isPublic ? "Öffentlich" : "Privat"}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Fach</dt>
                      <dd className="mt-1">{selectedWorld.subject ?? "n/a"}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Klasse</dt>
                      <dd className="mt-1">{selectedWorld.gradeLevel ?? "n/a"}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Views</dt>
                      <dd className="mt-1">{selectedWorld.views}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Likes</dt>
                      <dd className="mt-1">{selectedWorld.likes}</dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <h3 className="font-semibold">Gate Violations</h3>
                  <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                    {selectedWorld.validationMetadata?.gateViolations?.length ? (
                      <ul className="space-y-2">
                        {selectedWorld.validationMetadata.gateViolations.map((violation) => (
                          <li key={violation} className="rounded-md bg-amber-300/10 px-3 py-2 font-mono text-xs text-amber-100">
                            {violation}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-500">Keine Gate Violations gespeichert.</p>
                    )}
                  </div>
                </section>

                {selectedWorld.error && (
                  <section>
                    <h3 className="font-semibold text-red-200">Fehler</h3>
                    <pre className="mt-2 overflow-x-auto rounded-lg border border-red-400/20 bg-red-950/20 p-3 text-xs text-red-100">
                      {selectedWorld.error}
                    </pre>
                  </section>
                )}

                <Separator className="bg-white/10" />

                <div className="flex flex-wrap gap-2">
                  <Link to={`/w/${selectedWorld._id}`}>
                    <Button className="bg-cyan-300 text-neutral-950 hover:bg-cyan-200">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Welt öffnen
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.03] text-neutral-100 hover:bg-white/10"
                    onClick={() => navigator.clipboard?.writeText(selectedWorld.prompt ?? "")}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Prompt kopieren
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
