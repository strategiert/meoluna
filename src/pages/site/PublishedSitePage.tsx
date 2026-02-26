import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SitePageRenderer } from "@/components/site-studio/SitePageRenderer";
import {
  BlockDSLDocument,
  DEFAULT_THEME_TOKENS,
  ThemeTokens,
} from "@/lib/site-studio/types";
import { sanitizeDocument } from "@/lib/site-studio/document";

export default function PublishedSitePage() {
  const { projectSlug, pageSlug } = useParams<{
    projectSlug: string;
    pageSlug: string;
  }>();

  const pageData = useQuery(
    api.siteStudio.getPublishedPageBySlug,
    projectSlug && pageSlug ? { projectSlug, pageSlug } : "skip",
  );

  const document = useMemo(() => {
    const dsl = pageData?.revision?.dslDocument as BlockDSLDocument | undefined;
    if (!dsl) {
      return {
        version: 1,
        pageMeta: {
          title: "Seite nicht gefunden",
          slug: pageSlug ?? "not-found",
          description: "Kein veröffentlichter Inhalt vorhanden.",
        },
        blocks: [],
      };
    }
    return sanitizeDocument(dsl);
  }, [pageData?.revision, pageSlug]);

  const theme = useMemo(() => {
    return (pageData?.theme?.tokens as ThemeTokens | undefined) ?? DEFAULT_THEME_TOKENS;
  }, [pageData?.theme]);

  if (pageData === null) {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-center text-slate-300">
        Seite nicht gefunden oder nicht veröffentlicht.
      </div>
    );
  }

  if (pageData === undefined) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <SitePageRenderer document={document} theme={theme} className="min-h-screen" />
  );
}

