import React from "react";
import { cn } from "@/lib/utils";
import {
  BlockDSLDocument,
  BlockNode,
  DEFAULT_THEME_TOKENS,
  ThemeTokens,
} from "@/lib/site-studio/types";

interface SitePageRendererProps {
  document: BlockDSLDocument;
  theme?: ThemeTokens;
  className?: string;
  editable?: boolean;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string) => void;
}

function toStringSafe(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toItems(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as Array<
    Record<string, unknown>
  >;
}

function blockStyleFromTokens(tokens: Record<string, string> | undefined): React.CSSProperties {
  if (!tokens) return {};
  const style: React.CSSProperties = {};
  const bg = tokens.background;
  if (bg === "gradient-primary") {
    style.background =
      "linear-gradient(135deg, color-mix(in srgb, var(--ss-primary) 75%, #001018 25%), color-mix(in srgb, var(--ss-secondary) 68%, #020617 32%))";
  } else if (bg === "gradient-secondary") {
    style.background =
      "linear-gradient(130deg, color-mix(in srgb, var(--ss-secondary) 65%, #111827 35%), color-mix(in srgb, var(--ss-accent) 54%, #111827 46%))";
  } else if (bg) {
    style.background = bg;
  }
  if (tokens.align) {
    style.textAlign = tokens.align as React.CSSProperties["textAlign"];
  }
  return style;
}

function TextContent({ content }: { content: string }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return null;
  return (
    <div className="space-y-3 text-[color:var(--ss-text)]/90">
      {lines.map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
  );
}

function BlockShell({
  block,
  editable,
  selected,
  onSelect,
  children,
}: {
  block: BlockNode;
  editable: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      data-site-block-id={block.id}
      onClick={
        editable
          ? (event) => {
              event.stopPropagation();
              onSelect?.(block.id);
            }
          : undefined
      }
      className={cn(
        "relative transition-all duration-200",
        editable && "cursor-pointer hover:ring-1 hover:ring-cyan-300/60",
        selected && "ring-2 ring-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.55)]",
      )}
    >
      {editable && (
        <div className="pointer-events-none absolute -top-3 left-2 rounded bg-slate-900/90 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
          {block.type}
        </div>
      )}
      {children}
    </div>
  );
}

export function SitePageRenderer({
  document,
  theme = DEFAULT_THEME_TOKENS,
  className,
  editable = false,
  selectedBlockId,
  onSelectBlock,
}: SitePageRendererProps) {
  const cssVars = {
    "--ss-bg": theme.colors.background,
    "--ss-surface": theme.colors.surface,
    "--ss-card": theme.colors.card,
    "--ss-text": theme.colors.text,
    "--ss-text-muted": theme.colors.textMuted,
    "--ss-primary": theme.colors.primary,
    "--ss-secondary": theme.colors.secondary,
    "--ss-accent": theme.colors.accent,
    "--ss-border": theme.colors.border,
    "--ss-heading-font": theme.typography.headingFont,
    "--ss-body-font": theme.typography.bodyFont,
    "--ss-heading-weight": theme.typography.headingWeight,
    "--ss-body-weight": theme.typography.bodyWeight,
    "--ss-heading-tracking": theme.typography.headingTracking,
    "--ss-body-line-height": theme.typography.bodyLineHeight,
    "--ss-section-y": theme.spacing.sectionY,
    "--ss-section-x": theme.spacing.sectionX,
    "--ss-content-max": theme.spacing.contentMax,
    "--ss-gap": theme.spacing.gap,
    "--ss-radius-card": theme.radius.card,
    "--ss-radius-button": theme.radius.button,
    "--ss-radius-pill": theme.radius.pill,
    "--ss-shadow-card": theme.shadow.card,
    "--ss-shadow-glow": theme.shadow.glow,
    "--ss-motion-fast": theme.motion.fast,
    "--ss-motion-normal": theme.motion.normal,
    "--ss-motion-slow": theme.motion.slow,
    "--ss-motion-ease": theme.motion.easing,
  } as React.CSSProperties;

  const renderBlock = (block: BlockNode): React.ReactNode => {
    const props = toRecord(block.props);
    const styleTokens = block.styleTokens;
    const children = Array.isArray(block.children) ? block.children : [];
    const selected = selectedBlockId === block.id;

    let inner: React.ReactNode;
    switch (block.type) {
      case "Hero": {
        inner = (
          <section
            style={blockStyleFromTokens(styleTokens)}
            className="rounded-[calc(var(--ss-radius-card)_+_6px)] border border-[color:var(--ss-border)] px-6 py-14 shadow-[var(--ss-shadow-glow)] md:px-10"
          >
            <div className="mx-auto max-w-[var(--ss-content-max)] space-y-4">
              <p className="inline-flex rounded-[var(--ss-radius-pill)] bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-100">
                {toStringSafe(props.kicker, "Site Studio")}
              </p>
              <h1
                className="text-3xl leading-tight text-[color:var(--ss-text)] md:text-5xl"
                style={{
                  fontFamily: "var(--ss-heading-font)",
                  fontWeight: "var(--ss-heading-weight)",
                  letterSpacing: "var(--ss-heading-tracking)",
                }}
              >
                {toStringSafe(props.title, document.pageMeta.title)}
              </h1>
              <p
                className="max-w-3xl text-base text-[color:var(--ss-text-muted)] md:text-lg"
                style={{
                  fontFamily: "var(--ss-body-font)",
                  lineHeight: "var(--ss-body-line-height)",
                }}
              >
                {toStringSafe(props.subtitle, document.pageMeta.description ?? "")}
              </p>
            </div>
          </section>
        );
        break;
      }
      case "PressReleaseBody":
      case "Section": {
        inner = (
          <section
            className="rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-[color:var(--ss-card)] p-6 shadow-[var(--ss-shadow-card)] md:p-8"
            style={blockStyleFromTokens(styleTokens)}
          >
            <h2
              className="mb-4 text-2xl text-[color:var(--ss-text)]"
              style={{
                fontFamily: "var(--ss-heading-font)",
                fontWeight: "var(--ss-heading-weight)",
                letterSpacing: "var(--ss-heading-tracking)",
              }}
            >
              {toStringSafe(props.heading, "Abschnitt")}
            </h2>
            <TextContent content={toStringSafe(props.content)} />
          </section>
        );
        break;
      }
      case "Text": {
        inner = (
          <section className="rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-black/20 p-5">
            <TextContent content={toStringSafe(props.content)} />
          </section>
        );
        break;
      }
      case "Image": {
        inner = (
          <figure className="overflow-hidden rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-[color:var(--ss-card)]">
            <img
              src={toStringSafe(props.src, "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80")}
              alt={toStringSafe(props.alt, "Visual")}
              className="h-72 w-full object-cover"
            />
            {toStringSafe(props.caption) && (
              <figcaption className="px-4 py-3 text-sm text-[color:var(--ss-text-muted)]">
                {toStringSafe(props.caption)}
              </figcaption>
            )}
          </figure>
        );
        break;
      }
      case "CardGrid": {
        const items = toItems(props.items);
        inner = (
          <section className="space-y-4">
            <h2
              className="text-2xl text-[color:var(--ss-text)]"
              style={{
                fontFamily: "var(--ss-heading-font)",
                fontWeight: "var(--ss-heading-weight)",
              }}
            >
              {toStringSafe(props.heading, "Highlights")}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(items.length > 0 ? items : [{ title: "Karte", content: "Inhalt" }]).map(
                (item, idx) => (
                  <article
                    key={idx}
                    className="rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-[color:var(--ss-card)] p-5"
                  >
                    <h3
                      className="mb-2 text-lg text-[color:var(--ss-text)]"
                      style={{ fontFamily: "var(--ss-heading-font)" }}
                    >
                      {toStringSafe(item.title, "Karte")}
                    </h3>
                    <p className="text-sm text-[color:var(--ss-text-muted)]">
                      {toStringSafe(item.content, "")}
                    </p>
                  </article>
                ),
              )}
            </div>
          </section>
        );
        break;
      }
      case "Quote": {
        inner = (
          <blockquote className="rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-black/20 p-6">
            <p className="text-xl italic text-[color:var(--ss-text)]">
              “{toStringSafe(props.quote, "Zitattext")}”
            </p>
            <footer className="mt-3 text-sm text-[color:var(--ss-text-muted)]">
              {toStringSafe(props.author)}
            </footer>
          </blockquote>
        );
        break;
      }
      case "FAQ": {
        const items = toItems(props.items);
        inner = (
          <section className="rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-[color:var(--ss-card)] p-6">
            <h2 className="mb-4 text-2xl text-[color:var(--ss-text)]">FAQ</h2>
            <div className="space-y-3">
              {(items.length > 0
                ? items
                : [{ question: "Frage", answer: "Antwort" }]
              ).map((item, idx) => (
                <div key={idx} className="rounded-lg bg-black/20 p-4">
                  <h3 className="font-semibold text-[color:var(--ss-text)]">
                    {toStringSafe(item.question, "Frage")}
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--ss-text-muted)]">
                    {toStringSafe(item.answer, "Antwort")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
        break;
      }
      case "CTA": {
        inner = (
          <section className="rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-[color:var(--ss-surface)] p-6 text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[color:var(--ss-text-muted)]">
              {toStringSafe(props.note, "Nächster Schritt")}
            </p>
            <a
              href={toStringSafe(props.href, "#")}
              className="inline-flex rounded-[var(--ss-radius-button)] bg-[color:var(--ss-primary)] px-6 py-3 font-semibold text-slate-950 transition-opacity hover:opacity-90"
            >
              {toStringSafe(props.label, "Weiter")}
            </a>
          </section>
        );
        break;
      }
      case "Footer": {
        inner = (
          <footer className="rounded-[var(--ss-radius-card)] border border-[color:var(--ss-border)] bg-black/20 px-6 py-5 text-sm text-[color:var(--ss-text-muted)]">
            {toStringSafe(props.content, "Footer")}
          </footer>
        );
        break;
      }
      default: {
        inner = (
          <section className="rounded-[var(--ss-radius-card)] border border-dashed border-[color:var(--ss-border)] bg-black/20 p-5">
            <p className="text-sm uppercase tracking-wide text-[color:var(--ss-text-muted)]">
              Unbekannter Blocktyp: {block.type}
            </p>
            <TextContent content={toStringSafe(props.content)} />
          </section>
        );
      }
    }

    return (
      <BlockShell
        key={block.id}
        block={block}
        editable={editable}
        selected={selected}
        onSelect={onSelectBlock}
      >
        <div className="space-y-4">
          {inner}
          {children.length > 0 && (
            <div className="ml-4 space-y-4 border-l border-[color:var(--ss-border)] pl-4">
              {children.map((child) => renderBlock(child))}
            </div>
          )}
        </div>
      </BlockShell>
    );
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-[color:var(--ss-bg)] px-[var(--ss-section-x)] py-[var(--ss-section-y)] text-[color:var(--ss-text)]",
        className,
      )}
      style={cssVars}
    >
      <div
        className="mx-auto flex max-w-[var(--ss-content-max)] flex-col gap-[var(--ss-gap)]"
        style={{
          fontFamily: "var(--ss-body-font)",
          fontWeight: "var(--ss-body-weight)",
          lineHeight: "var(--ss-body-line-height)",
        }}
      >
        {document.blocks.map((block) => renderBlock(block))}
      </div>
    </div>
  );
}

export default SitePageRenderer;

