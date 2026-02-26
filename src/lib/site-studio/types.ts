export type SiteMode = "chat" | "visual" | "theme";

export type RevisionSource = "chat" | "visual" | "theme" | "rollback" | "publish";

export type BlockType =
  | "Hero"
  | "Section"
  | "Text"
  | "Image"
  | "CardGrid"
  | "CTA"
  | "PressReleaseBody"
  | "Quote"
  | "FAQ"
  | "Footer";

export interface BlockNode {
  id: string;
  type: BlockType | string;
  props?: Record<string, unknown>;
  styleTokens?: Record<string, string>;
  children?: BlockNode[];
  contentBindings?: Record<string, string>;
}

export interface BlockDSLDocument {
  version: number;
  pageMeta: {
    title: string;
    slug: string;
    description?: string;
  };
  blocks: BlockNode[];
  globalBindings?: Record<string, unknown>;
  assets?: string[];
}

export interface ThemeTokens {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
  motion: Record<string, string>;
}

export interface AssistantOperation {
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
  payload?: Record<string, unknown>;
  block?: BlockNode;
  reason?: string;
}

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
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

