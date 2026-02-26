import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Plus, ArrowRight, FolderKanban, FileText } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SiteStudio() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const projects = useQuery(
    api.siteStudio.listProjects,
    user?.id && convexUser?.role === "admin" ? { userId: user.id } : "skip",
  );

  const createProject = useMutation(api.siteStudio.createProject);
  const createPage = useMutation(api.siteStudio.createPage);

  const [selectedProjectId, setSelectedProjectId] =
    useState<Id<"siteProjects"> | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  const pages = useQuery(
    api.siteStudio.listPagesByProject,
    user?.id && selectedProjectId
      ? {
          userId: user.id,
          projectId: selectedProjectId,
        }
      : "skip",
  );

  const selectedProject = useMemo(
    () => projects?.find((project) => project._id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  if (!isLoaded) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-center text-slate-300">
        Bitte anmelden, um das Site Studio zu öffnen.
      </div>
    );
  }

  if (convexUser && convexUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-center text-slate-200">
        Nur Admins dürfen das Site Studio nutzen.
      </div>
    );
  }

  const handleCreateProject = async () => {
    if (!user?.id) return;
    if (!projectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const slug = slugify(projectSlug || projectName);
      const result = await createProject({
        userId: user.id,
        name: projectName.trim(),
        slug,
      });
      setProjectName("");
      setProjectSlug("");
      setSelectedProjectId(result.projectId);
      toast({
        title: "Projekt erstellt",
        description: "Das Site-Studio-Projekt wurde angelegt.",
      });
    } catch (error) {
      toast({
        title: "Fehler beim Projekt",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleCreatePage = async () => {
    if (!user?.id || !selectedProjectId) return;
    if (!pageTitle.trim()) return;
    const normalizedSlug = slugify(pageSlug || pageTitle);
    if (!normalizedSlug) return;

    setIsCreatingPage(true);
    try {
      const result = await createPage({
        userId: user.id,
        projectId: selectedProjectId,
        title: pageTitle.trim(),
        slug: normalizedSlug,
        initialPrompt: initialPrompt.trim() || undefined,
      });

      setPageTitle("");
      setPageSlug("");
      setInitialPrompt("");
      toast({
        title: "Seite erstellt",
        description: "Die neue Seite ist als Draft bereit.",
      });

      setTimeout(() => {
        window.location.assign(`/admin/site-studio/${result.pageId}`);
      }, 250);
    } catch (error) {
      toast({
        title: "Fehler bei Seite",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPage(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h1 className="text-3xl font-semibold tracking-tight">Site Studio</h1>
          <p className="mt-2 text-sm text-slate-400">
            Admin-Workspace für Chat-Generation, Visual Edits, globale Themes und
            revisionssichere Publikation.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Projekt erstellen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className="border-slate-700 bg-slate-950"
                  placeholder="Corporate Website"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-slug">Slug</Label>
                <Input
                  id="project-slug"
                  value={projectSlug}
                  onChange={(event) => setProjectSlug(event.target.value)}
                  className="border-slate-700 bg-slate-950"
                  placeholder="corporate-website"
                />
              </div>
              <Button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || isCreatingProject}
                className="w-full bg-cyan-400 text-slate-900 hover:bg-cyan-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingProject ? "Erstelle..." : "Projekt anlegen"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Projekte</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {projects === undefined && (
                <p className="text-sm text-slate-500">Lade Projekte...</p>
              )}
              {projects?.length === 0 && (
                <p className="text-sm text-slate-500">
                  Noch kein Site-Projekt vorhanden.
                </p>
              )}
              {projects?.map((project) => (
                <button
                  type="button"
                  key={project._id}
                  onClick={() => setSelectedProjectId(project._id)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    selectedProjectId === project._id
                      ? "border-cyan-400/70 bg-cyan-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{project.name}</div>
                    <FolderKanban className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">/{project.slug}</p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <Badge className="bg-slate-800 text-slate-200">
                      {project.pageCount} Seiten
                    </Badge>
                    <Badge className="bg-emerald-900/40 text-emerald-200">
                      {project.publishedCount} published
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Neue Seite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="page-title">Titel</Label>
                <Input
                  id="page-title"
                  value={pageTitle}
                  onChange={(event) => setPageTitle(event.target.value)}
                  className="border-slate-700 bg-slate-950"
                  placeholder="Pressemitteilung Q2"
                  disabled={!selectedProjectId}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="page-slug">Slug</Label>
                <Input
                  id="page-slug"
                  value={pageSlug}
                  onChange={(event) => setPageSlug(event.target.value)}
                  className="border-slate-700 bg-slate-950"
                  placeholder="pressemitteilung-q2"
                  disabled={!selectedProjectId}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="page-prompt">Start-Prompt</Label>
                <Textarea
                  id="page-prompt"
                  value={initialPrompt}
                  onChange={(event) => setInitialPrompt(event.target.value)}
                  className="min-h-28 border-slate-700 bg-slate-950"
                  placeholder="Erstelle eine Presseseite im bestehenden Corporate-Stil."
                  disabled={!selectedProjectId}
                />
              </div>
              <Button
                onClick={handleCreatePage}
                disabled={!selectedProjectId || !pageTitle.trim() || isCreatingPage}
                className="w-full bg-cyan-400 text-slate-900 hover:bg-cyan-300"
              >
                <FileText className="mr-2 h-4 w-4" />
                {isCreatingPage ? "Erstelle..." : "Seite erstellen"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <CardTitle className="text-base">
                Seiten in {selectedProject?.name ?? "Projekt"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!selectedProjectId && (
                <p className="text-sm text-slate-500">Projekt auswählen.</p>
              )}
              {selectedProjectId && pages === undefined && (
                <p className="text-sm text-slate-500">Lade Seiten...</p>
              )}
              {selectedProjectId && pages?.length === 0 && (
                <p className="text-sm text-slate-500">
                  Noch keine Seiten im ausgewählten Projekt.
                </p>
              )}
              {pages?.map((page) => (
                <div
                  key={page._id}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                >
                  <div>
                    <div className="font-medium">{page.title}</div>
                    <div className="text-xs text-slate-500">/{page.slug}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        page.status === "published"
                          ? "bg-emerald-900/40 text-emerald-200"
                          : "bg-amber-900/40 text-amber-200"
                      }
                    >
                      {page.status}
                    </Badge>
                    <Link to={`/admin/site-studio/${page._id}`}>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        Editor
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

