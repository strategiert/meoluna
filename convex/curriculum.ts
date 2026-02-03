import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

// Alle aktiven Fächer für die UI
export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects
      .filter(s => s.isActive)
      .sort((a, b) => a.order - b.order);
  },
});

// Debug: Alle Subjects ohne Filter
export const getAllSubjectsDebug = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

// Themen für ein Fach + Klassenstufe
export const getTopics = query({
  args: {
    subjectId: v.id("subjects"),
    gradeLevel: v.number(),
    bundesland: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let topics = await ctx.db
      .query("topics")
      .withIndex("by_subject_grade", (q) =>
        q.eq("subjectId", args.subjectId).eq("gradeLevel", args.gradeLevel)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter nach Bundesland (bundesweit oder spezifisch)
    if (args.bundesland) {
      topics = topics.filter(
        (t) => t.bundesland === null || t.bundesland === args.bundesland
      );
    }

    return topics;
  },
});

// Alle Themen eines Fachs (für Admin)
export const getTopicsBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
  },
});

// Curriculum-Quellen Status
export const getCurriculumStatus = query({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query("curriculumSources").collect();

    const byBundesland: Record<string, { total: number; parsed: number }> = {};

    for (const source of sources) {
      if (!byBundesland[source.bundesland]) {
        byBundesland[source.bundesland] = { total: 0, parsed: 0 };
      }
      byBundesland[source.bundesland].total++;
      if (source.isParsed) {
        byBundesland[source.bundesland].parsed++;
      }
    }

    return {
      totalSources: sources.length,
      parsedSources: sources.filter((s) => s.isParsed).length,
      byBundesland,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Fach erstellen/aktualisieren
export const upsertSubject = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    order: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        icon: args.icon,
        color: args.color,
        order: args.order,
        isActive: args.isActive ?? existing.isActive,
      });
      return existing._id;
    }

    return await ctx.db.insert("subjects", {
      ...args,
      isActive: args.isActive ?? true,
    });
  },
});

// Thema erstellen
export const createTopic = mutation({
  args: {
    subjectId: v.id("subjects"),
    name: v.string(),
    slug: v.string(),
    gradeLevel: v.number(),
    bundesland: v.optional(v.string()),
    keywords: v.array(v.string()),
    competencies: v.optional(v.array(v.string())),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("topics", {
      ...args,
      isActive: true,
    });
  },
});

// Curriculum-Quelle registrieren
export const registerCurriculumSource = mutation({
  args: {
    bundesland: v.string(),
    schulart: v.optional(v.string()),
    fach: v.optional(v.string()),
    filename: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("curriculumSources", {
      ...args,
      isParsed: false,
      createdAt: Date.now(),
    });
  },
});

// Quelle als geparst markieren
export const markSourceParsed = mutation({
  args: {
    sourceId: v.id("curriculumSources"),
    topicsExtracted: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sourceId, {
      isParsed: true,
      parsedAt: Date.now(),
      topicsExtracted: args.topicsExtracted,
    });
  },
});

// ============================================================================
// INTERNAL MUTATIONS (für Batch-Operationen)
// ============================================================================

// Batch-Import von Themen (öffentlich für Seeding-Scripts)
export const batchImportTopics = mutation({
  args: {
    topics: v.array(
      v.object({
        subjectSlug: v.string(),
        name: v.string(),
        slug: v.string(),
        gradeLevel: v.number(),
        bundesland: v.optional(v.string()),
        keywords: v.array(v.string()),
        competencies: v.optional(v.array(v.string())),
        sourceUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const topic of args.topics) {
      // Fach-ID finden
      const subject = await ctx.db
        .query("subjects")
        .withIndex("by_slug", (q) => q.eq("slug", topic.subjectSlug))
        .first();

      if (!subject) {
        console.warn(`Subject not found: ${topic.subjectSlug}`);
        continue;
      }

      // Duplikat-Check
      const existing = await ctx.db
        .query("topics")
        .withIndex("by_subject_grade", (q) =>
          q.eq("subjectId", subject._id).eq("gradeLevel", topic.gradeLevel)
        )
        .filter((q) => q.eq(q.field("slug"), topic.slug))
        .first();

      if (existing) {
        continue; // Skip duplicates
      }

      await ctx.db.insert("topics", {
        subjectId: subject._id,
        name: topic.name,
        slug: topic.slug,
        gradeLevel: topic.gradeLevel,
        bundesland: topic.bundesland,
        keywords: topic.keywords,
        competencies: topic.competencies,
        sourceUrl: topic.sourceUrl,
        isActive: true,
      });

      imported++;
    }

    return { imported };
  },
});

// Seed-Funktion für Grundfächer
export const seedSubjects = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subjects = [
      {
        slug: "mathematik",
        name: "Mathematik",
        icon: "Calculator",
        color: "#3B82F6",
        order: 1,
      },
      {
        slug: "deutsch",
        name: "Deutsch",
        icon: "BookOpen",
        color: "#10B981",
        order: 2,
      },
      {
        slug: "sachunterricht",
        name: "Sachunterricht",
        icon: "Globe",
        color: "#8B5CF6",
        order: 3,
      },
      {
        slug: "englisch",
        name: "Englisch",
        icon: "Languages",
        color: "#F59E0B",
        order: 4,
      },
      {
        slug: "kunst",
        name: "Kunst",
        icon: "Palette",
        color: "#EC4899",
        order: 5,
      },
      {
        slug: "musik",
        name: "Musik",
        icon: "Music",
        color: "#6366F1",
        order: 6,
      },
      {
        slug: "sport",
        name: "Sport",
        icon: "Dumbbell",
        color: "#EF4444",
        order: 7,
      },
      {
        slug: "religion-ethik",
        name: "Religion/Ethik",
        icon: "Heart",
        color: "#14B8A6",
        order: 8,
      },
      // Sekundarstufe
      {
        slug: "biologie",
        name: "Biologie",
        icon: "Leaf",
        color: "#22C55E",
        order: 10,
      },
      {
        slug: "physik",
        name: "Physik",
        icon: "Atom",
        color: "#0EA5E9",
        order: 11,
      },
      {
        slug: "chemie",
        name: "Chemie",
        icon: "FlaskConical",
        color: "#A855F7",
        order: 12,
      },
      {
        slug: "geschichte",
        name: "Geschichte",
        icon: "Clock",
        color: "#D97706",
        order: 13,
      },
      {
        slug: "geografie",
        name: "Geografie",
        icon: "Map",
        color: "#059669",
        order: 14,
      },
      {
        slug: "politik",
        name: "Politik/Sozialkunde",
        icon: "Scale",
        color: "#7C3AED",
        order: 15,
      },
      {
        slug: "informatik",
        name: "Informatik",
        icon: "Code",
        color: "#475569",
        order: 16,
      },
    ];

    let seeded = 0;

    for (const subject of subjects) {
      const existing = await ctx.db
        .query("subjects")
        .withIndex("by_slug", (q) => q.eq("slug", subject.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("subjects", {
          ...subject,
          isActive: true,
        });
        seeded++;
      }
    }

    return { seeded };
  },
});
