import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

type SiteMode = "chat" | "visual" | "theme";
type RevisionSource = "chat" | "visual" | "theme" | "rollback" | "publish";

type JsonRecord = Record<string, unknown>;

type BlockNode = {
  id: string;
  type: string;
  props?: JsonRecord;
  styleTokens?: Record<string, string>;
  children?: BlockNode[];
  contentBindings?: Record<string, string>;
};

type BlockDSLDocument = {
  version: number;
  pageMeta: {
    title: string;
    slug: string;
    description?: string;
  };
  blocks: BlockNode[];
  globalBindings?: JsonRecord;
  assets?: string[];
};

type AssistantOperation = {
  op:
    | "add"
    | "remove"
    | "move"
    | "updateProps"
    | "updateContent"
    | "updateStyle"
    | "replaceBlock";
  targetBlockId?: string;
  parentBlockId?: string | null;
  index?: number;
  toParentBlockId?: string | null;
  toIndex?: number;
  payload?: JsonRecord;
  block?: BlockNode;
  reason?: string;
};

type ThemeTokens = {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
  motion: Record<string, string>;
};

type LlmResult = {
  operations: AssistantOperation[];
  changeSummary: string;
  tokenUsage?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  provider: string;
  model: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

function deepMerge(base: JsonRecord, patch: JsonRecord): JsonRecord {
  const output: JsonRecord = { ...base };
  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = output[key];
    if (
      patchValue &&
      typeof patchValue === "object" &&
      !Array.isArray(patchValue) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      output[key] = deepMerge(baseValue as JsonRecord, patchValue as JsonRecord);
      continue;
    }
    output[key] = patchValue;
  }
  return output;
}

function buildDefaultThemeTokens(): ThemeTokens {
  return {
    colors: {
      background: "#070b14",
      surface: "#0f172a",
      card: "#111827",
      text: "#e5e7eb",
      textMuted: "#94a3b8",
      primary: "#22d3ee",
      secondary: "#38bdf8",
      accent: "#f59e0b",
      border: "rgba(148, 163, 184, 0.24)",
    },
    typography: {
      headingFont: "'DM Serif Display', Georgia, serif",
      bodyFont: "'Manrope', 'Segoe UI', sans-serif",
      headingWeight: "700",
      bodyWeight: "500",
      headingTracking: "-0.02em",
      bodyLineHeight: "1.7",
    },
    spacing: {
      sectionY: "5.5rem",
      sectionX: "1.25rem",
      contentMax: "74rem",
      gap: "1.25rem",
    },
    radius: {
      card: "1.25rem",
      button: "0.9rem",
      pill: "999px",
    },
    shadow: {
      card: "0 20px 50px rgba(2, 6, 23, 0.45)",
      glow: "0 0 0 1px rgba(34, 211, 238, 0.35), 0 18px 40px rgba(34, 211, 238, 0.16)",
    },
    motion: {
      fast: "160ms",
      normal: "240ms",
      slow: "420ms",
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    },
  };
}

function buildDefaultDocument(
  title: string,
  slug: string,
  initialPrompt?: string,
): BlockDSLDocument {
  const promptHint = (initialPrompt ?? "").toLowerCase();
  const isPressRelease =
    promptHint.includes("press") || promptHint.includes("presse");

  const heroId = uniqueId("hero");
  const bodyId = uniqueId("section");
  const ctaId = uniqueId("cta");

  const introContent = isPressRelease
    ? "Pressemitteilung: Diese Seite kann per Chat und Visual Edit präzise überarbeitet werden."
    : "Diese Seite wurde im Site Studio erstellt und kann blockweise visuell oder per Chat angepasst werden.";

  return {
    version: 1,
    pageMeta: {
      title,
      slug,
      description: introContent,
    },
    blocks: [
      {
        id: heroId,
        type: "Hero",
        props: {
          kicker: "Neu im Site Studio",
          title,
          subtitle: introContent,
        },
        styleTokens: {
          align: "left",
          background: "gradient-primary",
        },
      },
      {
        id: bodyId,
        type: isPressRelease ? "PressReleaseBody" : "Section",
        props: {
          heading: isPressRelease ? "Offizielle Mitteilung" : "Inhalt",
          content:
            "Ersetze diesen Text über den Chat oder klicke den Block im Visual Edit-Modus an.",
        },
      },
      {
        id: ctaId,
        type: "CTA",
        props: {
          label: "Mehr erfahren",
          href: "/contact",
          note: "Call-to-Action kann ebenfalls visuell bearbeitet werden.",
        },
      },
    ],
    globalBindings: {},
    assets: [],
  };
}

type LocatedBlock = {
  node: BlockNode;
  index: number;
  parentChildren: BlockNode[];
};

function findBlockWithParent(blocks: BlockNode[], id: string): LocatedBlock | null {
  const stack: BlockNode[] = [...blocks];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const children = current.children ?? [];
    for (let i = 0; i < children.length; i += 1) {
      if (children[i]?.id === id) {
        return { node: children[i], index: i, parentChildren: children };
      }
      stack.push(children[i]);
    }
  }

  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i]?.id === id) {
      return { node: blocks[i], index: i, parentChildren: blocks };
    }
  }
  return null;
}

function insertIntoChildren(
  root: BlockNode[],
  parentBlockId: string | null | undefined,
  index: number | undefined,
  block: BlockNode,
): BlockNode[] {
  if (!parentBlockId) {
    const nextIndex = Math.max(0, Math.min(index ?? root.length, root.length));
    root.splice(nextIndex, 0, block);
    return root;
  }
  const parent = findBlockWithParent(root, parentBlockId);
  if (!parent) {
    root.push(block);
    return root;
  }
  const targetChildren = parent.node.children ?? [];
  parent.node.children = targetChildren;
  const nextIndex = Math.max(
    0,
    Math.min(index ?? targetChildren.length, targetChildren.length),
  );
  targetChildren.splice(nextIndex, 0, block);
  return root;
}

function sanitizeBlockNode(raw: BlockNode): BlockNode {
  return {
    id: raw.id || uniqueId("block"),
    type: raw.type || "Section",
    props: asRecord(raw.props),
    styleTokens: Object.fromEntries(
      Object.entries(asRecord(raw.styleTokens)).map(([k, v]) => [k, String(v)]),
    ),
    children: Array.isArray(raw.children)
      ? raw.children.map((child) => sanitizeBlockNode(child))
      : [],
    contentBindings: Object.fromEntries(
      Object.entries(asRecord(raw.contentBindings)).map(([k, v]) => [k, String(v)]),
    ),
  };
}

function sanitizeDocument(doc: BlockDSLDocument): BlockDSLDocument {
  return {
    version: Number.isFinite(doc.version) ? doc.version : 1,
    pageMeta: {
      title: String(doc.pageMeta?.title ?? "Untitled page"),
      slug: String(doc.pageMeta?.slug ?? "untitled-page"),
      description:
        doc.pageMeta?.description != null
          ? String(doc.pageMeta.description)
          : undefined,
    },
    blocks: Array.isArray(doc.blocks)
      ? doc.blocks.map((block) => sanitizeBlockNode(block))
      : [],
    globalBindings: asRecord(doc.globalBindings),
    assets: Array.isArray(doc.assets) ? doc.assets.map((asset) => String(asset)) : [],
  };
}

function normalizeOperations(raw: unknown): AssistantOperation[] {
  if (!Array.isArray(raw)) return [];
  const normalized: AssistantOperation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as JsonRecord;
    const op = record.op;
    if (
      op !== "add" &&
      op !== "remove" &&
      op !== "move" &&
      op !== "updateProps" &&
      op !== "updateContent" &&
      op !== "updateStyle" &&
      op !== "replaceBlock"
    ) {
      continue;
    }
    const block = record.block as BlockNode | undefined;
    normalized.push({
      op,
      targetBlockId:
        typeof record.targetBlockId === "string" ? record.targetBlockId : undefined,
      parentBlockId:
        typeof record.parentBlockId === "string" || record.parentBlockId === null
          ? (record.parentBlockId as string | null)
          : undefined,
      index: typeof record.index === "number" ? record.index : undefined,
      toParentBlockId:
        typeof record.toParentBlockId === "string" || record.toParentBlockId === null
          ? (record.toParentBlockId as string | null)
          : undefined,
      toIndex: typeof record.toIndex === "number" ? record.toIndex : undefined,
      payload: asRecord(record.payload),
      block: block ? sanitizeBlockNode(block) : undefined,
      reason: typeof record.reason === "string" ? record.reason : undefined,
    });
  }
  return normalized;
}

function applyOperationsToDocument(
  document: BlockDSLDocument,
  operations: AssistantOperation[],
): BlockDSLDocument {
  const next = sanitizeDocument(cloneValue(document));
  const root = next.blocks;

  for (const operation of operations) {
    switch (operation.op) {
      case "add": {
        const block = operation.block ?? {
          id: uniqueId("section"),
          type: "Section",
          props: { heading: "Neuer Abschnitt", content: "Inhalt folgt." },
        };
        insertIntoChildren(root, operation.parentBlockId, operation.index, sanitizeBlockNode(block));
        break;
      }
      case "remove": {
        if (!operation.targetBlockId) break;
        const located = findBlockWithParent(root, operation.targetBlockId);
        if (!located) break;
        located.parentChildren.splice(located.index, 1);
        break;
      }
      case "updateProps":
      case "updateContent": {
        if (!operation.targetBlockId) break;
        const located = findBlockWithParent(root, operation.targetBlockId);
        if (!located) break;
        const currentProps = asRecord(located.node.props);
        located.node.props = deepMerge(currentProps, operation.payload ?? {});
        break;
      }
      case "updateStyle": {
        if (!operation.targetBlockId) break;
        const located = findBlockWithParent(root, operation.targetBlockId);
        if (!located) break;
        const current = asRecord(located.node.styleTokens);
        located.node.styleTokens = Object.fromEntries(
          Object.entries(deepMerge(current, operation.payload ?? {})).map(([k, v]) => [
            k,
            String(v),
          ]),
        );
        break;
      }
      case "replaceBlock": {
        if (!operation.targetBlockId || !operation.block) break;
        const located = findBlockWithParent(root, operation.targetBlockId);
        if (!located) break;
        located.parentChildren[located.index] = sanitizeBlockNode(operation.block);
        break;
      }
      case "move": {
        if (!operation.targetBlockId) break;
        const located = findBlockWithParent(root, operation.targetBlockId);
        if (!located) break;
        const [block] = located.parentChildren.splice(located.index, 1);
        if (!block) break;
        insertIntoChildren(root, operation.toParentBlockId, operation.toIndex, block);
        break;
      }
      default:
        break;
    }
  }

  return sanitizeDocument(next);
}

function makeFallbackOperations(
  prompt: string,
  selectedBlockId: string | undefined,
  currentDocument: BlockDSLDocument,
): { operations: AssistantOperation[]; changeSummary: string } {
  const lower = prompt.toLowerCase();
  if (selectedBlockId && (lower.includes("farbe") || lower.includes("color"))) {
    return {
      operations: [
        {
          op: "updateStyle",
          targetBlockId: selectedBlockId,
          payload: { background: "gradient-secondary" },
          reason: "Fallback: color style update.",
        },
      ],
      changeSummary: "Block-Farbe im selektierten Element aktualisiert.",
    };
  }

  if (selectedBlockId) {
    return {
      operations: [
        {
          op: "updateContent",
          targetBlockId: selectedBlockId,
          payload: { content: prompt, subtitle: prompt },
          reason: "Fallback: content update for selected block.",
        },
      ],
      changeSummary: "Selektierter Block wurde anhand des Prompts aktualisiert.",
    };
  }

  return {
    operations: [
      {
        op: "add",
        parentBlockId: null,
        index: currentDocument.blocks.length,
        block: {
          id: uniqueId("section"),
          type: "Section",
          props: {
            heading: "Neuer Abschnitt",
            content: prompt,
          },
        },
        reason: "Fallback: append section.",
      },
    ],
    changeSummary: "Neuer Abschnitt an das Seitenende hinzugefügt.",
  };
}

function extractJsonFromText(text: string): string | null {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

async function requestAssistantOperations(
  prompt: string,
  document: BlockDSLDocument,
  selectedBlockId: string | undefined,
  mode: SiteMode,
): Promise<LlmResult | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;

  const provider = "lovable-gateway";
  const model = process.env.SITE_STUDIO_MODEL ?? "google/gemini-2.5-flash";
  const systemPrompt = `Du bist ein präziser Website-Editor-Agent.
Erzeuge NUR JSON im Format:
{
  "changeSummary": "kurze deutsche Zusammenfassung",
  "operations": [
    {
      "op": "add|remove|move|updateProps|updateContent|updateStyle|replaceBlock",
      "targetBlockId": "optional",
      "parentBlockId": "optional|null",
      "index": 0,
      "toParentBlockId": "optional|null",
      "toIndex": 0,
      "payload": {},
      "block": { "id": "string", "type": "Section", "props": {}, "styleTokens": {}, "children": [] },
      "reason": "kurze Begründung"
    }
  ]
}
Regeln:
- Arbeite block-basiert, keine freien Codeblöcke.
- Behalte bestehendes Designkonsistenz bei.
- Bei Mode "visual": nur selektierten Block oder dessen direkte Kinder anpassen.
- Bei Mode "theme": nur updateStyle/updateProps mit design-relevanten Payloads.
- Gib keine Erklärung außerhalb des JSON zurück.`;

  const userPrompt = JSON.stringify(
    {
      mode,
      prompt,
      selectedBlockId: selectedBlockId ?? null,
      document,
    },
    null,
    2,
  );

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  const extracted = extractJsonFromText(content);
  if (!extracted) return null;

  let parsed: { changeSummary?: string; operations?: unknown };
  try {
    parsed = JSON.parse(extracted) as { changeSummary?: string; operations?: unknown };
  } catch {
    return null;
  }

  return {
    operations: normalizeOperations(parsed.operations),
    changeSummary:
      parsed.changeSummary?.trim() || "Änderung durch Assistant übernommen.",
    tokenUsage: {
      prompt: json.usage?.prompt_tokens,
      completion: json.usage?.completion_tokens,
      total: json.usage?.total_tokens,
    },
    provider,
    model,
  };
}

async function assertAdminByClerkId(ctx: { db: any }, clerkId: string): Promise<Doc<"users">> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();

  if (!user || user.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return user;
}

async function resolveProjectTheme(
  ctx: { db: any },
  project: Doc<"siteProjects">,
): Promise<Doc<"themeTokens"> | null> {
  if (project.defaultThemeId) {
    const theme = await ctx.db.get(project.defaultThemeId);
    if (theme) return theme as Doc<"themeTokens">;
  }
  return await ctx.db
    .query("themeTokens")
    .withIndex("by_project_default", (q: any) =>
      q.eq("projectId", project._id).eq("isDefault", true),
    )
    .first();
}

async function getNextRevisionNumber(
  ctx: { db: any },
  pageId: Id<"sitePages">,
): Promise<number> {
  const latest = await ctx.db
    .query("pageRevisions")
    .withIndex("by_page_revision", (q: any) => q.eq("pageId", pageId))
    .order("desc")
    .first();

  if (!latest) return 1;
  return Number(latest.revisionNumber) + 1;
}

export const listProjects = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const projects = await ctx.db.query("siteProjects").order("desc").take(100);

    const withStats = await Promise.all(
      projects.map(async (project) => {
        const pages = await ctx.db
          .query("sitePages")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        return {
          ...project,
          pageCount: pages.length,
          publishedCount: pages.filter((page) => page.status === "published").length,
        };
      }),
    );

    return withStats;
  },
});

export const getPublishedPageBySlug = query({
  args: {
    projectSlug: v.string(),
    pageSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("siteProjects")
      .withIndex("by_slug", (q) => q.eq("slug", slugify(args.projectSlug)))
      .first();
    if (!project) return null;

    const page = await ctx.db
      .query("sitePages")
      .withIndex("by_project_slug", (q) =>
        q.eq("projectId", project._id).eq("slug", slugify(args.pageSlug)),
      )
      .first();
    if (!page || page.status !== "published" || !page.currentRevisionId) {
      return null;
    }

    const revision = await ctx.db.get(page.currentRevisionId);
    if (!revision) return null;
    const theme = await resolveProjectTheme(ctx, project as Doc<"siteProjects">);

    return {
      project,
      page,
      revision,
      theme,
    };
  },
});

export const createProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const normalizedSlug = slugify(args.slug ?? args.name);
    if (!normalizedSlug) {
      throw new Error("Invalid project slug.");
    }

    const duplicate = await ctx.db
      .query("siteProjects")
      .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
      .first();
    if (duplicate) {
      throw new Error("Project slug already exists.");
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("siteProjects", {
      name: args.name.trim(),
      slug: normalizedSlug,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    const themeId = await ctx.db.insert("themeTokens", {
      projectId,
      name: "Default Theme",
      tokens: buildDefaultThemeTokens(),
      isDefault: true,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(projectId, {
      defaultThemeId: themeId,
      updatedAt: now,
    });

    return { projectId, themeId };
  },
});

export const listPagesByProject = query({
  args: {
    userId: v.string(),
    projectId: v.id("siteProjects"),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const pages = await ctx.db
      .query("sitePages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return pages.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createPage = mutation({
  args: {
    userId: v.string(),
    projectId: v.id("siteProjects"),
    slug: v.string(),
    title: v.string(),
    initialPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    const normalizedSlug = slugify(args.slug);
    if (!normalizedSlug) {
      throw new Error("Invalid page slug.");
    }

    const duplicate = await ctx.db
      .query("sitePages")
      .withIndex("by_project_slug", (q) =>
        q.eq("projectId", args.projectId).eq("slug", normalizedSlug),
      )
      .first();
    if (duplicate) {
      throw new Error("Page slug already exists in this project.");
    }

    const now = Date.now();
    const pageId = await ctx.db.insert("sitePages", {
      projectId: args.projectId,
      slug: normalizedSlug,
      title: args.title.trim(),
      status: "draft",
      createdBy: args.userId,
      updatedBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    const initialDocument = buildDefaultDocument(
      args.title.trim(),
      normalizedSlug,
      args.initialPrompt,
    );

    const revisionId = await ctx.db.insert("pageRevisions", {
      pageId,
      revisionNumber: 1,
      dslDocument: initialDocument,
      themeOverrides: {},
      changeSummary: "Initial draft created.",
      createdBy: args.userId,
      source: "chat",
      createdAt: now,
    });

    await ctx.db.patch(pageId, {
      currentRevisionId: revisionId,
      updatedAt: now,
      updatedBy: args.userId,
    });

    const theme = await resolveProjectTheme(ctx, project as Doc<"siteProjects">);
    await ctx.db.insert("revisionSnapshots", {
      pageId,
      revisionId,
      snapshotType: "auto",
      dslDocument: initialDocument,
      themeTokens: theme?.tokens ?? buildDefaultThemeTokens(),
      createdBy: args.userId,
      createdAt: now,
    });

    return { pageId, revisionId };
  },
});

export const getRevision = query({
  args: {
    userId: v.string(),
    revisionId: v.id("pageRevisions"),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const revision = await ctx.db.get(args.revisionId);
    if (!revision) return null;
    const page = await ctx.db.get(revision.pageId);
    return { revision, page };
  },
});

export const getPageEditorState = query({
  args: {
    userId: v.string(),
    pageId: v.id("sitePages"),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const page = await ctx.db.get(args.pageId);
    if (!page) return null;
    const project = await ctx.db.get(page.projectId);
    if (!project) return null;

    const revision = page.currentRevisionId
      ? await ctx.db.get(page.currentRevisionId)
      : null;

    const theme = await resolveProjectTheme(ctx, project as Doc<"siteProjects">);

    const editorSession = await ctx.db
      .query("editorSessions")
      .withIndex("by_page_user", (q) =>
        q.eq("pageId", args.pageId).eq("userId", args.userId),
      )
      .first();

    const recentRuns = await ctx.db
      .query("assistantRuns")
      .withIndex("by_page_created", (q) => q.eq("pageId", args.pageId))
      .order("desc")
      .take(15);

    const snapshots = await ctx.db
      .query("revisionSnapshots")
      .withIndex("by_page_created", (q) => q.eq("pageId", args.pageId))
      .order("desc")
      .take(30);

    const publishLogs = await ctx.db
      .query("publishLogs")
      .withIndex("by_page_published", (q) => q.eq("pageId", args.pageId))
      .order("desc")
      .take(20);

    return {
      project,
      page,
      revision,
      theme,
      editorSession,
      recentRuns,
      snapshots,
      publishLogs,
    };
  },
});

export const selectBlock = mutation({
  args: {
    userId: v.string(),
    pageId: v.id("sitePages"),
    mode: v.union(v.literal("chat"), v.literal("visual"), v.literal("theme")),
    selectedBlockId: v.optional(v.string()),
    lastPrompt: v.optional(v.string()),
    contextWindowRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const now = Date.now();
    const existing = await ctx.db
      .query("editorSessions")
      .withIndex("by_page_user", (q) =>
        q.eq("pageId", args.pageId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        mode: args.mode,
        selectedBlockId: args.selectedBlockId,
        lastPrompt: args.lastPrompt,
        contextWindowRef: args.contextWindowRef,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("editorSessions", {
      pageId: args.pageId,
      userId: args.userId,
      mode: args.mode,
      selectedBlockId: args.selectedBlockId,
      lastPrompt: args.lastPrompt,
      contextWindowRef: args.contextWindowRef,
      updatedAt: now,
    });
  },
});

export const applyOperations = mutation({
  args: {
    userId: v.string(),
    pageId: v.id("sitePages"),
    baseRevisionId: v.id("pageRevisions"),
    operations: v.any(),
    changeSummary: v.optional(v.string()),
    source: v.optional(
      v.union(
        v.literal("chat"),
        v.literal("visual"),
        v.literal("theme"),
        v.literal("rollback"),
        v.literal("publish"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);

    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found.");
    }
    const baseRevision = await ctx.db.get(args.baseRevisionId);
    if (!baseRevision || baseRevision.pageId !== args.pageId) {
      throw new Error("Base revision not found for this page.");
    }

    const currentDocument = sanitizeDocument(
      baseRevision.dslDocument as BlockDSLDocument,
    );
    const operations = normalizeOperations(args.operations);
    const nextDocument = applyOperationsToDocument(currentDocument, operations);
    const revisionNumber = await getNextRevisionNumber(ctx, args.pageId);
    const now = Date.now();

    const newRevisionId = await ctx.db.insert("pageRevisions", {
      pageId: args.pageId,
      revisionNumber,
      dslDocument: nextDocument,
      themeOverrides: baseRevision.themeOverrides ?? {},
      changeSummary: args.changeSummary ?? "Block changes applied.",
      createdBy: args.userId,
      source: (args.source ?? "chat") as RevisionSource,
      baseRevisionId: args.baseRevisionId,
      createdAt: now,
    });

    await ctx.db.patch(args.pageId, {
      currentRevisionId: newRevisionId,
      updatedBy: args.userId,
      updatedAt: now,
      status: page.status === "published" ? "review" : page.status,
    });

    const project = await ctx.db.get(page.projectId);
    if (project) {
      const theme = await resolveProjectTheme(ctx, project as Doc<"siteProjects">);
      await ctx.db.insert("revisionSnapshots", {
        pageId: args.pageId,
        revisionId: newRevisionId,
        snapshotType: "auto",
        dslDocument: nextDocument,
        themeTokens: theme?.tokens ?? buildDefaultThemeTokens(),
        createdBy: args.userId,
        createdAt: now,
      });
    }

    return {
      newRevisionId,
      revisionNumber,
      dslDocument: nextDocument,
    };
  },
});

export const updateThemeTokens = mutation({
  args: {
    userId: v.string(),
    projectId: v.id("siteProjects"),
    tokenPatch: v.any(),
    themeId: v.optional(v.id("themeTokens")),
    name: v.optional(v.string()),
    applyToAllPages: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found.");

    const now = Date.now();
    let theme: Doc<"themeTokens"> | null = null;
    if (args.themeId) {
      const existing = await ctx.db.get(args.themeId);
      if (!existing) throw new Error("Theme not found.");
      theme = existing as Doc<"themeTokens">;
    } else {
      theme = await resolveProjectTheme(ctx, project as Doc<"siteProjects">);
    }

    if (!theme) {
      const themeId = await ctx.db.insert("themeTokens", {
        projectId: args.projectId,
        name: args.name?.trim() || "Default Theme",
        tokens: deepMerge(buildDefaultThemeTokens() as unknown as JsonRecord, asRecord(args.tokenPatch)),
        isDefault: true,
        createdBy: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(args.projectId, {
        defaultThemeId: themeId,
        updatedAt: now,
      });
      return { themeId, affectedPages: 0 };
    }

    const mergedTokens = deepMerge(
      asRecord(theme.tokens),
      asRecord(args.tokenPatch),
    );
    await ctx.db.patch(theme._id, {
      name: args.name?.trim() || theme.name,
      tokens: mergedTokens,
      updatedAt: now,
    });

    let affectedPages = 0;
    if (args.applyToAllPages) {
      const pages = await ctx.db
        .query("sitePages")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      for (const page of pages) {
        if (!page.currentRevisionId) continue;
        const currentRevision = await ctx.db.get(page.currentRevisionId);
        if (!currentRevision) continue;

        const revisionNumber = await getNextRevisionNumber(ctx, page._id);
        const revisionId = await ctx.db.insert("pageRevisions", {
          pageId: page._id,
          revisionNumber,
          dslDocument: currentRevision.dslDocument,
          themeOverrides: {
            ...(asRecord(currentRevision.themeOverrides)),
            globalThemeUpdatedAt: now,
          },
          changeSummary: "Global theme update applied.",
          createdBy: args.userId,
          source: "theme",
          baseRevisionId: currentRevision._id,
          createdAt: now,
        });

        await ctx.db.patch(page._id, {
          currentRevisionId: revisionId,
          updatedBy: args.userId,
          updatedAt: now,
          status: page.status === "published" ? "review" : page.status,
        });

        await ctx.db.insert("revisionSnapshots", {
          pageId: page._id,
          revisionId,
          snapshotType: "auto",
          dslDocument: currentRevision.dslDocument,
          themeTokens: mergedTokens,
          createdBy: args.userId,
          createdAt: now,
        });
        affectedPages += 1;
      }
    }

    return { themeId: theme._id, affectedPages };
  },
});

export const rollbackToRevision = mutation({
  args: {
    userId: v.string(),
    pageId: v.id("sitePages"),
    targetRevisionId: v.id("pageRevisions"),
  },
  handler: async (ctx, args) => {
    await assertAdminByClerkId(ctx, args.userId);

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found.");
    const targetRevision = await ctx.db.get(args.targetRevisionId);
    if (!targetRevision || targetRevision.pageId !== args.pageId) {
      throw new Error("Target revision not found for this page.");
    }

    const now = Date.now();
    const revisionNumber = await getNextRevisionNumber(ctx, args.pageId);
    const newRevisionId = await ctx.db.insert("pageRevisions", {
      pageId: args.pageId,
      revisionNumber,
      dslDocument: targetRevision.dslDocument,
      themeOverrides: targetRevision.themeOverrides ?? {},
      changeSummary: `Rollback to revision #${targetRevision.revisionNumber}.`,
      createdBy: args.userId,
      source: "rollback",
      baseRevisionId: page.currentRevisionId,
      createdAt: now,
    });

    await ctx.db.patch(args.pageId, {
      currentRevisionId: newRevisionId,
      updatedBy: args.userId,
      updatedAt: now,
      status: page.status === "published" ? "review" : page.status,
    });

    const project = await ctx.db.get(page.projectId);
    if (project) {
      const theme = await resolveProjectTheme(ctx, project as Doc<"siteProjects">);
      await ctx.db.insert("revisionSnapshots", {
        pageId: args.pageId,
        revisionId: newRevisionId,
        snapshotType: "manual",
        dslDocument: targetRevision.dslDocument,
        themeTokens: theme?.tokens ?? buildDefaultThemeTokens(),
        createdBy: args.userId,
        createdAt: now,
      });
    }

    return { newRevisionId };
  },
});

export const runPageCommand = action({
  args: {
    userId: v.string(),
    pageId: v.id("sitePages"),
    revisionId: v.id("pageRevisions"),
    prompt: v.string(),
    selectedBlockId: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("chat"), v.literal("visual"), v.literal("theme"))),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    runId: Id<"assistantRuns">;
    proposedOperations: AssistantOperation[];
    changeSummary: string;
    previewRevisionId: Id<"pageRevisions">;
  }> => {
    const user = await ctx.runQuery(api.users.getUser, { clerkId: args.userId });
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required.");
    }

    const mode: SiteMode = args.mode ?? "chat";
    const runId = (await ctx.runMutation(
      internal.siteStudio.createAssistantRunInternal,
      {
        pageId: args.pageId,
        revisionId: args.revisionId,
        userId: args.userId,
        prompt: args.prompt,
        mode,
      },
    )) as Id<"assistantRuns">;

    try {
      const revisionResult = await ctx.runQuery(api.siteStudio.getRevision, {
        userId: args.userId,
        revisionId: args.revisionId,
      });
      if (!revisionResult?.revision || !revisionResult.page) {
        throw new Error("Revision context not found.");
      }

      const document = sanitizeDocument(
        revisionResult.revision.dslDocument as BlockDSLDocument,
      );
      const llmResult = await requestAssistantOperations(
        args.prompt,
        document,
        args.selectedBlockId,
        mode,
      );

      const fallback = makeFallbackOperations(
        args.prompt,
        args.selectedBlockId,
        document,
      );

      const operations =
        llmResult && llmResult.operations.length > 0
          ? llmResult.operations
          : fallback.operations;
      const changeSummary = llmResult?.changeSummary ?? fallback.changeSummary;

      const applyResult = (await ctx.runMutation(api.siteStudio.applyOperations, {
        userId: args.userId,
        pageId: args.pageId,
        baseRevisionId: args.revisionId,
        operations,
        changeSummary,
        source: mode,
      })) as { newRevisionId: Id<"pageRevisions"> };

      await ctx.runMutation(internal.siteStudio.completeAssistantRunInternal, {
        runId,
        resultStatus: "completed",
        operationsJson: operations,
        planJson: { changeSummary },
        previewRevisionId: applyResult.newRevisionId,
        provider: llmResult?.provider,
        model: llmResult?.model,
        tokenUsage: llmResult?.tokenUsage,
      });

      await ctx.runMutation(api.siteStudio.selectBlock, {
        userId: args.userId,
        pageId: args.pageId,
        mode,
        selectedBlockId: args.selectedBlockId,
        lastPrompt: args.prompt,
      });

      return {
        runId,
        proposedOperations: operations,
        changeSummary,
        previewRevisionId: applyResult.newRevisionId,
      };
    } catch (error) {
      await ctx.runMutation(internal.siteStudio.completeAssistantRunInternal, {
        runId,
        resultStatus: "failed",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
      throw error;
    }
  },
});

function generatePageComponentSource(
  dslDocument: BlockDSLDocument,
  themeTokens: ThemeTokens,
): string {
  const documentLiteral = JSON.stringify(dslDocument, null, 2);
  const themeLiteral = JSON.stringify(themeTokens, null, 2);
  return `import { SitePageRenderer } from "@/components/site-studio/SitePageRenderer";
import type { BlockDSLDocument, ThemeTokens } from "@/lib/site-studio/types";

const documentData: BlockDSLDocument = ${documentLiteral};
const themeData: ThemeTokens = ${themeLiteral};

export default function GeneratedSitePage() {
  return <SitePageRenderer document={documentData} theme={themeData} />;
}
`;
}

export const publishRevision = action({
  args: {
    userId: v.string(),
    pageId: v.id("sitePages"),
    revisionId: v.id("pageRevisions"),
    approvalNote: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ publishLogId: Id<"publishLogs">; commitSha?: string; paths: string[] }> => {
    const user = await ctx.runQuery(api.users.getUser, { clerkId: args.userId });
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required.");
    }

    const state = await ctx.runQuery(api.siteStudio.getPageEditorState, {
      userId: args.userId,
      pageId: args.pageId,
    });
    if (!state?.page || !state.project) {
      throw new Error("Page state not found.");
    }

    const revisionResult = await ctx.runQuery(api.siteStudio.getRevision, {
      userId: args.userId,
      revisionId: args.revisionId,
    });
    if (!revisionResult?.revision) {
      throw new Error("Revision not found.");
    }
    const revision = revisionResult.revision;
    const dslDocument = sanitizeDocument(revision.dslDocument as BlockDSLDocument);
    const themeTokens = (state.theme?.tokens as ThemeTokens | undefined) ?? buildDefaultThemeTokens();

    const filePath = `src/pages/generated/${state.page.slug}.tsx`;
    const fileContent = generatePageComponentSource(dslDocument, themeTokens);

    await ctx.runMutation(internal.siteStudio.createSnapshotInternal, {
      pageId: args.pageId,
      revisionId: args.revisionId,
      snapshotType: "pre_publish",
      dslDocument,
      themeTokens,
      createdBy: args.userId,
    });

    const webhookUrl = process.env.SITE_PUBLISH_WEBHOOK_URL;
    let status: "success" | "failed" = "failed";
    let commitSha: string | undefined;
    let publishError: string | undefined;
    let paths: string[] = [filePath];

    if (!webhookUrl) {
      publishError =
        "SITE_PUBLISH_WEBHOOK_URL is not configured. Publish endpoint is required for git commits.";
    } else {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.SITE_PUBLISH_WEBHOOK_TOKEN
              ? { Authorization: `Bearer ${process.env.SITE_PUBLISH_WEBHOOK_TOKEN}` }
              : {}),
          },
          body: JSON.stringify({
            projectSlug: state.project.slug,
            pageSlug: state.page.slug,
            pageTitle: state.page.title,
            revisionId: args.revisionId,
            approvalNote: args.approvalNote,
            filePath,
            fileContent,
          }),
        });

        if (!response.ok) {
          publishError = `Publish webhook failed with status ${response.status}.`;
        } else {
          const payload = (await response.json()) as {
            commitSha?: string;
            paths?: string[];
          };
          status = "success";
          commitSha = payload.commitSha;
          paths = payload.paths?.length ? payload.paths : [filePath];
        }
      } catch (error) {
        publishError =
          error instanceof Error ? error.message : "Publish webhook request failed.";
      }
    }

    const publishLogId = (await ctx.runMutation(
      internal.siteStudio.finalizePublishInternal,
      {
        pageId: args.pageId,
        revisionId: args.revisionId,
        publishedBy: args.userId,
        commitSha,
        paths,
        status,
        error: publishError,
      },
    )) as Id<"publishLogs">;

    if (status === "success") {
      return { publishLogId, commitSha, paths };
    }

    throw new Error(publishError ?? "Publish failed.");
  },
});

export const createAssistantRunInternal = internalMutation({
  args: {
    pageId: v.id("sitePages"),
    revisionId: v.optional(v.id("pageRevisions")),
    userId: v.string(),
    prompt: v.string(),
    mode: v.union(v.literal("chat"), v.literal("visual"), v.literal("theme")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assistantRuns", {
      pageId: args.pageId,
      revisionId: args.revisionId,
      userId: args.userId,
      prompt: args.prompt,
      mode: args.mode,
      resultStatus: "running",
      createdAt: Date.now(),
    });
  },
});

export const completeAssistantRunInternal = internalMutation({
  args: {
    runId: v.id("assistantRuns"),
    resultStatus: v.union(v.literal("completed"), v.literal("failed")),
    operationsJson: v.optional(v.any()),
    planJson: v.optional(v.any()),
    errors: v.optional(v.array(v.string())),
    previewRevisionId: v.optional(v.id("pageRevisions")),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    tokenUsage: v.optional(
      v.object({
        prompt: v.optional(v.number()),
        completion: v.optional(v.number()),
        total: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      resultStatus: args.resultStatus,
      operationsJson: args.operationsJson,
      planJson: args.planJson,
      errors: args.errors,
      previewRevisionId: args.previewRevisionId,
      provider: args.provider,
      model: args.model,
      tokenUsage: args.tokenUsage,
      completedAt: Date.now(),
    });
  },
});

export const createSnapshotInternal = internalMutation({
  args: {
    pageId: v.id("sitePages"),
    revisionId: v.id("pageRevisions"),
    snapshotType: v.union(
      v.literal("auto"),
      v.literal("manual"),
      v.literal("pre_publish"),
    ),
    dslDocument: v.any(),
    themeTokens: v.any(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("revisionSnapshots", {
      pageId: args.pageId,
      revisionId: args.revisionId,
      snapshotType: args.snapshotType,
      dslDocument: args.dslDocument,
      themeTokens: args.themeTokens,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

export const finalizePublishInternal = internalMutation({
  args: {
    pageId: v.id("sitePages"),
    revisionId: v.id("pageRevisions"),
    publishedBy: v.string(),
    commitSha: v.optional(v.string()),
    paths: v.array(v.string()),
    status: v.union(v.literal("success"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const logId = await ctx.db.insert("publishLogs", {
      pageId: args.pageId,
      revisionId: args.revisionId,
      publishedBy: args.publishedBy,
      commitSha: args.commitSha,
      paths: args.paths,
      status: args.status,
      error: args.error,
      publishedAt: now,
    });

    if (args.status === "success") {
      await ctx.db.patch(args.pageId, {
        status: "published",
        currentRevisionId: args.revisionId,
        publishedAt: now,
        updatedAt: now,
        updatedBy: args.publishedBy,
      });
    } else {
      const page = await ctx.db.get(args.pageId);
      if (page) {
        await ctx.db.patch(args.pageId, {
          status: page.status === "published" ? "published" : "review",
          updatedAt: now,
          updatedBy: args.publishedBy,
        });
      }
    }

    return logId;
  },
});
