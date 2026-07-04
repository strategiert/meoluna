import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";

function createdAt(doc: { createdAt?: number; _creationTime: number }): number {
  return doc.createdAt ?? doc._creationTime;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function mapWorld(world: Doc<"worlds">, userById: Map<string, Doc<"users">>) {
  const owner = world.userId ? userById.get(world.userId) : undefined;

  return {
    _id: world._id,
    title: world.title,
    prompt: world.prompt,
    userId: world.userId,
    userEmail: owner?.email,
    userName: owner?.name,
    status: world.status ?? "published",
    qualityScore: world.qualityScore,
    error: world.error,
    validationMetadata: world.validationMetadata,
    subject: world.subject,
    gradeLevel: world.gradeLevel,
    isPublic: world.isPublic,
    views: world.views ?? 0,
    likes: world.likes ?? 0,
    codeLength: world.code.length,
    createdAt: createdAt(world),
  };
}

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const since24h = now - 24 * 60 * 60 * 1000;

    const [
      worlds,
      users,
      userStats,
      progress,
      classrooms,
      siteProjects,
      sitePages,
      recentSessions,
      recentAnalyticsEvents,
    ] = await Promise.all([
      ctx.db.query("worlds").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("userStats").collect(),
      ctx.db.query("progress").collect(),
      ctx.db.query("classrooms").collect(),
      ctx.db.query("siteProjects").collect(),
      ctx.db.query("sitePages").collect(),
      ctx.db.query("generationSessions").order("desc").take(200),
      ctx.db.query("analyticsEvents").order("desc").take(500),
    ]);

    const userById = new Map(users.map((user) => [user.clerkId, user]));
    const worldsLast24h = worlds.filter((world) => createdAt(world) >= since24h).length;
    const failedWorlds = worlds.filter((world) => world.status === "failed").length;
    const quarantinedWorlds = worlds.filter((world) => world.status === "quarantined").length;
    const publishedWorlds = worlds.filter((world) => (world.status ?? "published") === "published").length;
    const lowQualityWorlds = worlds.filter(
      (world) => typeof world.qualityScore === "number" && world.qualityScore < 7,
    ).length;
    const qualityScores = worlds
      .map((world) => world.qualityScore)
      .filter((score): score is number => typeof score === "number");
    const averageQualityScore =
      qualityScores.length > 0
        ? roundOne(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
        : null;

    const activeUsersLast24h = new Set([
      ...userStats.filter((stat) => stat.lastActivityAt >= since24h).map((stat) => stat.userId),
      ...progress.filter((entry) => entry.updatedAt >= since24h).map((entry) => entry.userId),
    ]).size;

    const completedWorlds = progress.filter((entry) => entry.completedAt).length;
    const failedSessionsLast24h = recentSessions.filter(
      (session) => session.status === "failed" && session.startedAt >= since24h,
    ).length;
    const runningSessions = recentSessions.filter((session) => session.status === "running").length;
    const analyticsEventsLast24h = recentAnalyticsEvents.filter(
      (event) => event.timestamp >= since24h,
    ).length;

    const attentionWorlds = worlds
      .filter((world) => {
        const violations = world.validationMetadata?.gateViolations?.length ?? 0;
        return (
          world.status === "failed" ||
          world.status === "quarantined" ||
          !!world.error ||
          violations > 0 ||
          (typeof world.qualityScore === "number" && world.qualityScore < 7)
        );
      })
      .sort((a, b) => createdAt(b) - createdAt(a))
      .slice(0, 8)
      .map((world) => mapWorld(world, userById));

    const recentWorlds = [...worlds]
      .sort((a, b) => createdAt(b) - createdAt(a))
      .slice(0, 8)
      .map((world) => mapWorld(world, userById));

    const violationCounts = new Map<string, number>();
    for (const world of worlds) {
      for (const violation of world.validationMetadata?.gateViolations ?? []) {
        violationCounts.set(violation, (violationCounts.get(violation) ?? 0) + 1);
      }
    }

    const subjectCounts = new Map<string, number>();
    for (const world of worlds) {
      const subject = world.subject?.trim() || "Ohne Fach";
      subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1);
    }

    const serviceStatuses = [
      {
        id: "pipeline",
        label: "Generation Pipeline",
        status: failedSessionsLast24h > 0 || failedWorlds > 0 ? "warning" : "ready",
        detail:
          failedSessionsLast24h > 0
            ? `${failedSessionsLast24h} fehlgeschlagene Sessions in 24h`
            : runningSessions > 0
              ? `${runningSessions} laufende Sessions`
              : "Keine akuten Fehler",
      },
      {
        id: "quality",
        label: "Quality Gate",
        status: lowQualityWorlds > 0 || quarantinedWorlds > 0 ? "warning" : "ready",
        detail:
          lowQualityWorlds > 0 || quarantinedWorlds > 0
            ? `${lowQualityWorlds + quarantinedWorlds} Welten brauchen Prüfung`
            : "Alle aktuellen Welten im grünen Bereich",
      },
      {
        id: "storage",
        label: "Convex Storage / PDF Upload",
        status: "ready",
        detail: "Upload läuft über Convex Storage; OCR separat prüfen",
      },
      {
        id: "analytics",
        label: "Analytics",
        status: analyticsEventsLast24h > 0 ? "ready" : "idle",
        detail:
          analyticsEventsLast24h > 0
            ? `${analyticsEventsLast24h} Events in 24h`
            : "Keine Events in den letzten 24h",
      },
    ];

    return {
      generatedAt: now,
      stats: {
        totalWorlds: worlds.length,
        worldsLast24h,
        publishedWorlds,
        failedWorlds,
        quarantinedWorlds,
        lowQualityWorlds,
        averageQualityScore,
        totalUsers: users.length,
        activeUsersLast24h,
        totalClassrooms: classrooms.length,
        completedWorlds,
        siteProjects: siteProjects.length,
        publishedSitePages: sitePages.filter((page) => page.status === "published").length,
      },
      attentionWorlds,
      recentWorlds,
      serviceStatuses,
      recentSessions: recentSessions.slice(0, 8).map((session) => ({
        sessionId: session.sessionId,
        userId: session.userId,
        status: session.status,
        stepLabel: session.stepLabel,
        error: session.error,
        errorCode: session.errorCode,
        qualityScore: session.qualityScore,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      })),
      topGateViolations: Array.from(violationCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      topSubjects: Array.from(subjectCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    };
  },
});

export const listWorlds = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const userById = new Map(users.map((user) => [user.clerkId, user]));
    const worlds = await ctx.db.query("worlds").order("desc").take(300);

    return worlds.map((world) => mapWorld(world, userById));
  },
});
