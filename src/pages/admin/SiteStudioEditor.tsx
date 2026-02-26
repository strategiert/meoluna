import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAction, useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { ArrowLeft, Sparkles, Save, Palette, RotateCcw, UploadCloud } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { SitePageRenderer } from "@/components/site-studio/SitePageRenderer";
import {
  BlockDSLDocument,
  DEFAULT_THEME_TOKENS,
  SiteMode,
  ThemeTokens,
} from "@/lib/site-studio/types";
import { findBlockById, flattenBlocks, sanitizeDocument } from "@/lib/site-studio/document";

function createFallbackDocument(slug = "draft"): BlockDSLDocument {
  return {
    version: 1,
    pageMeta: {
      title: "Neue Seite",
      slug,
      description: "Noch keine Revision geladen.",
    },
    blocks: [],
  };
}

export default function SiteStudioEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const pageIdValue = pageId as Id<"sitePages"> | undefined;
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const state = useQuery(
    api.siteStudio.getPageEditorState,
    user?.id && pageIdValue && convexUser?.role === "admin"
      ? { userId: user.id, pageId: pageIdValue }
      : "skip",
  );

  const selectBlock = useMutation(api.siteStudio.selectBlock);
  const applyOperations = useMutation(api.siteStudio.applyOperations);
  const updateThemeTokens = useMutation(api.siteStudio.updateThemeTokens);
  const rollbackToRevision = useMutation(api.siteStudio.rollbackToRevision);
  const runPageCommand = useAction(api.siteStudio.runPageCommand);
  const publishRevision = useAction(api.siteStudio.publishRevision);

  const [mode, setMode] = useState<SiteMode>("chat");
  const [prompt, setPrompt] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  const [headingValue, setHeadingValue] = useState("");
  const [contentValue, setContentValue] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [applyThemeToAllPages, setApplyThemeToAllPages] = useState(true);
  const [themeDraft, setThemeDraft] = useState({
    primary: DEFAULT_THEME_TOKENS.colors.primary,
    secondary: DEFAULT_THEME_TOKENS.colors.secondary,
    accent: DEFAULT_THEME_TOKENS.colors.accent,
    text: DEFAULT_THEME_TOKENS.colors.text,
    background: DEFAULT_THEME_TOKENS.colors.background,
  });
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [isSavingInspector, setIsSavingInspector] = useState(false);
  const [isApplyingTheme, setIsApplyingTheme] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRollingBackRevisionId, setIsRollingBackRevisionId] = useState<
    Id<"pageRevisions"> | null
  >(null);

  const document = useMemo(() => {
    const dslDocument = state?.revision?.dslDocument as BlockDSLDocument | undefined;
    if (!dslDocument) return createFallbackDocument(pageId ?? "draft");
    return sanitizeDocument(dslDocument);
  }, [state?.revision, pageId]);

  const theme = useMemo(() => {
    return (state?.theme?.tokens as ThemeTokens | undefined) ?? DEFAULT_THEME_TOKENS;
  }, [state?.theme]);

  const allBlocks = useMemo(() => flattenBlocks(document.blocks), [document.blocks]);
  const selectedBlock = useMemo(
    () => (selectedBlockId ? findBlockById(document.blocks, selectedBlockId) : null),
    [document.blocks, selectedBlockId],
  );

  useEffect(() => {
    if (!state?.editorSession) return;
    if (state.editorSession.selectedBlockId) {
      setSelectedBlockId(state.editorSession.selectedBlockId);
    }
    if (state.editorSession.mode) {
      setMode(state.editorSession.mode as SiteMode);
    }
  }, [state?.editorSession]);

  useEffect(() => {
    const props = selectedBlock?.props as Record<string, unknown> | undefined;
    setHeadingValue(props?.heading ? String(props.heading) : "");
    setContentValue(props?.content ? String(props.content) : "");
  }, [selectedBlock]);

  useEffect(() => {
    setThemeDraft({
      primary: theme.colors.primary ?? DEFAULT_THEME_TOKENS.colors.primary,
      secondary: theme.colors.secondary ?? DEFAULT_THEME_TOKENS.colors.secondary,
      accent: theme.colors.accent ?? DEFAULT_THEME_TOKENS.colors.accent,
      text: theme.colors.text ?? DEFAULT_THEME_TOKENS.colors.text,
      background: theme.colors.background ?? DEFAULT_THEME_TOKENS.colors.background,
    });
  }, [theme]);

  if (!isLoaded) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-center text-slate-300">
        Bitte anmelden, um den Editor zu öffnen.
      </div>
    );
  }

  if (convexUser && convexUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-center text-slate-300">
        Nur Admins dürfen Seiten bearbeiten.
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-center text-slate-300">
        Editor lädt...
      </div>
    );
  }

  const revisionId = state.revision?._id as Id<"pageRevisions"> | undefined;

  const persistSelection = async (blockId: string, nextMode: SiteMode) => {
    if (!user?.id || !pageIdValue) return;
    setSelectedBlockId(blockId);
    try {
      await selectBlock({
        userId: user.id,
        pageId: pageIdValue,
        mode: nextMode,
        selectedBlockId: blockId,
      });
    } catch {
      // ignore selection persistence issues in UI
    }
  };

  const handleRunCommand = async () => {
    if (!user?.id || !pageIdValue || !revisionId || !prompt.trim()) return;
    setIsRunningCommand(true);
    try {
      const result = await runPageCommand({
        userId: user.id,
        pageId: pageIdValue,
        revisionId,
        prompt: prompt.trim(),
        selectedBlockId,
        mode,
      });
      setPrompt("");
      toast({
        title: "Änderung angewendet",
        description: result.changeSummary,
      });
    } catch (error) {
      toast({
        title: "Assistant-Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsRunningCommand(false);
    }
  };

  const handleSaveInspector = async () => {
    if (!user?.id || !pageIdValue || !revisionId || !selectedBlockId) return;
    setIsSavingInspector(true);
    try {
      await applyOperations({
        userId: user.id,
        pageId: pageIdValue,
        baseRevisionId: revisionId,
        operations: [
          {
            op: "updateProps",
            targetBlockId: selectedBlockId,
            payload: {
              heading: headingValue,
              content: contentValue,
            },
            reason: "Inspector edit",
          },
        ],
        changeSummary: "Visual Inspector Update",
        source: "visual",
      });
      toast({
        title: "Block gespeichert",
        description: "Der selektierte Block wurde aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Inspector-Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsSavingInspector(false);
    }
  };

  const handleApplyTheme = async () => {
    if (!user?.id || !state?.project?._id) return;
    setIsApplyingTheme(true);
    try {
      const result = await updateThemeTokens({
        userId: user.id,
        projectId: state.project._id,
        tokenPatch: {
          colors: {
            primary: themeDraft.primary,
            secondary: themeDraft.secondary,
            accent: themeDraft.accent,
            text: themeDraft.text,
            background: themeDraft.background,
          },
        },
        applyToAllPages: applyThemeToAllPages,
      });
      toast({
        title: "Theme aktualisiert",
        description: `${result.affectedPages} Seite(n) synchronisiert.`,
      });
    } catch (error) {
      toast({
        title: "Theme-Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsApplyingTheme(false);
    }
  };

  const handleRollback = async (snapshotRevisionId: Id<"pageRevisions">) => {
    if (!user?.id || !pageIdValue) return;
    setIsRollingBackRevisionId(snapshotRevisionId);
    try {
      await rollbackToRevision({
        userId: user.id,
        pageId: pageIdValue,
        targetRevisionId: snapshotRevisionId,
      });
      toast({
        title: "Rollback erfolgreich",
        description: "Revision wurde wiederhergestellt.",
      });
    } catch (error) {
      toast({
        title: "Rollback-Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsRollingBackRevisionId(null);
    }
  };

  const handlePublish = async () => {
    if (!user?.id || !pageIdValue || !revisionId) return;
    setIsPublishing(true);
    try {
      const result = await publishRevision({
        userId: user.id,
        pageId: pageIdValue,
        revisionId,
        approvalNote: approvalNote.trim() || undefined,
      });
      toast({
        title: "Publish erfolgreich",
        description: result.commitSha
          ? `Commit ${result.commitSha} erstellt.`
          : "Seite veröffentlicht.",
      });
    } catch (error) {
      toast({
        title: "Publish fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link to="/admin/site-studio">
                  <Button variant="ghost" size="sm" className="text-slate-300">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Übersicht
                  </Button>
                </Link>
                <Badge className="bg-slate-800 text-slate-200">{state.page.status}</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-semibold">{state.page.title}</h1>
              <p className="text-sm text-slate-400">
                /{state.project.slug}/{state.page.slug}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={approvalNote}
                onChange={(event) => setApprovalNote(event.target.value)}
                placeholder="Freigabe-Notiz (optional)"
                className="w-full border-slate-700 bg-slate-950 sm:w-64"
              />
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !revisionId}
                className="bg-emerald-400 text-slate-900 hover:bg-emerald-300"
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_430px]">
          <Card className="overflow-hidden border-slate-800 bg-slate-900/80 text-slate-100">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-base">Live Preview Sandbox</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SitePageRenderer
                document={document}
                theme={theme}
                editable={mode === "visual"}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(blockId) => {
                  void persistSelection(blockId, "visual");
                }}
                className="min-h-[70vh]"
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">Modus</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                {(["chat", "visual", "theme"] as SiteMode[]).map((entry) => (
                  <Button
                    key={entry}
                    variant={mode === entry ? "default" : "outline"}
                    className={
                      mode === entry
                        ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                        : "border-slate-700"
                    }
                    onClick={() => {
                      setMode(entry);
                      if (user?.id && pageIdValue) {
                        void selectBlock({
                          userId: user.id,
                          pageId: pageIdValue,
                          mode: entry,
                          selectedBlockId,
                        });
                      }
                    }}
                  >
                    {entry}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">Assistant Chat Command</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="z. B. Erstelle eine neue Presse-Sektion mit Zitat des CEOs."
                  className="min-h-24 border-slate-700 bg-slate-950"
                />
                <Button
                  onClick={handleRunCommand}
                  disabled={isRunningCommand || !prompt.trim() || !revisionId}
                  className="w-full bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isRunningCommand ? "Arbeite..." : "Anwenden"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">Visual Block Inspector</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-28 space-y-1 overflow-y-auto rounded border border-slate-800 bg-slate-950 p-2 text-xs">
                  {allBlocks.map(({ block, depth }) => (
                    <button
                      type="button"
                      key={block.id}
                      onClick={() => {
                        setMode("visual");
                        void persistSelection(block.id, "visual");
                      }}
                      className={`block w-full rounded px-2 py-1 text-left ${
                        selectedBlockId === block.id
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                      style={{ paddingLeft: `${8 + depth * 14}px` }}
                    >
                      {block.type} ({block.id})
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label>Heading</Label>
                  <Input
                    value={headingValue}
                    onChange={(event) => setHeadingValue(event.target.value)}
                    className="border-slate-700 bg-slate-950"
                    disabled={!selectedBlock}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Content</Label>
                  <Textarea
                    value={contentValue}
                    onChange={(event) => setContentValue(event.target.value)}
                    className="min-h-24 border-slate-700 bg-slate-950"
                    disabled={!selectedBlock}
                  />
                </div>
                <Button
                  onClick={handleSaveInspector}
                  disabled={!selectedBlock || !revisionId || isSavingInspector}
                  className="w-full border border-cyan-500/60 bg-transparent text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingInspector ? "Speichere..." : "Block speichern"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">Global Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["primary", "Primary"],
                      ["secondary", "Secondary"],
                      ["accent", "Accent"],
                      ["text", "Text"],
                      ["background", "Background"],
                    ] as Array<[keyof typeof themeDraft, string]>
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="color"
                        value={themeDraft[key]}
                        onChange={(event) =>
                          setThemeDraft((prev) => ({ ...prev, [key]: event.target.value }))
                        }
                        className="h-10 border-slate-700 bg-slate-950 p-1"
                      />
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={applyThemeToAllPages}
                    onChange={(event) => setApplyThemeToAllPages(event.target.checked)}
                  />
                  Auf alle Projektseiten anwenden
                </label>

                <Button
                  onClick={handleApplyTheme}
                  disabled={isApplyingTheme}
                  className="w-full border border-violet-500/60 bg-transparent text-violet-300 hover:bg-violet-500/10"
                >
                  <Palette className="mr-2 h-4 w-4" />
                  {isApplyingTheme ? "Aktualisiere..." : "Theme anwenden"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base">Snapshots & Rollback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {state.snapshots.length === 0 && (
                  <p className="text-sm text-slate-500">Keine Snapshots vorhanden.</p>
                )}
                {state.snapshots.slice(0, 8).map((snapshot) => (
                  <div
                    key={snapshot._id}
                    className="flex items-center justify-between rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                  >
                    <div>
                      <div className="font-medium">{snapshot.snapshotType}</div>
                      <div className="text-slate-500">
                        {new Date(snapshot.createdAt).toLocaleString("de-DE")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600"
                      disabled={isRollingBackRevisionId === snapshot.revisionId}
                      onClick={() => handleRollback(snapshot.revisionId)}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Restore
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

