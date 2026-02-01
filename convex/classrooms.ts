import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generiere 6-stelligen Invite-Code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Keine verwechselbaren Zeichen (0/O, 1/I/L)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// CLASSROOM QUERIES
// ============================================================================

// Alle Klassen eines Teachers
export const listByTeacher = query({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    // Füge Mitgliederzahl hinzu
    const classroomsWithCounts = await Promise.all(
      classrooms.map(async (classroom) => {
        const members = await ctx.db
          .query("classroomMembers")
          .withIndex("by_classroom", (q) => q.eq("classroomId", classroom._id))
          .collect();
        return {
          ...classroom,
          memberCount: members.length,
        };
      })
    );

    return classroomsWithCounts;
  },
});

// Alle Klassen, in denen ein User Mitglied ist
export const listByStudent = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("classroomMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const classrooms = await Promise.all(
      memberships.map(async (m) => {
        const classroom = await ctx.db.get(m.classroomId);
        return classroom ? { ...classroom, memberRole: m.role } : null;
      })
    );

    return classrooms.filter(Boolean);
  },
});

// Einzelne Klasse mit Details
export const getById = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) return null;

    // Mitglieder laden
    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Assignments laden
    const assignments = await ctx.db
      .query("classroomAssignments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Welten für Assignments laden
    const assignmentsWithWorlds = await Promise.all(
      assignments.map(async (a) => {
        const world = await ctx.db.get(a.worldId);
        return { ...a, world };
      })
    );

    return {
      ...classroom,
      members,
      assignments: assignmentsWithWorlds,
    };
  },
});

// Klasse per Invite-Code finden (für Beitritts-Preview)
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const classroom = await ctx.db
      .query("classrooms")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .first();

    if (!classroom) return null;

    // Nur öffentliche Infos zurückgeben
    return {
      _id: classroom._id,
      name: classroom.name,
      description: classroom.description,
      gradeLevel: classroom.gradeLevel,
      subject: classroom.subject,
    };
  },
});

// Mitglieder einer Klasse mit Fortschritt
export const getMembers = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Assignments für diese Klasse
    const assignments = await ctx.db
      .query("classroomAssignments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Für jeden Schüler: Fortschritt bei allen Assignments
    const membersWithProgress = await Promise.all(
      members.map(async (member) => {
        // Fortschritt für alle zugewiesenen Welten
        const progressByWorld: Record<string, { xp: number; completed: boolean }> = {};

        for (const assignment of assignments) {
          const progress = await ctx.db
            .query("progress")
            .withIndex("by_user_world", (q) =>
              q.eq("userId", member.userId).eq("worldId", assignment.worldId)
            )
            .first();

          progressByWorld[assignment.worldId] = {
            xp: progress?.xp ?? 0,
            completed: !!progress?.completedAt,
          };
        }

        // Gesamt-XP
        const allProgress = await ctx.db
          .query("progress")
          .withIndex("by_user_world", (q) => q.eq("userId", member.userId))
          .collect();
        const totalXP = allProgress.reduce((sum, p) => sum + p.xp, 0);

        return {
          ...member,
          progressByWorld,
          totalXP,
          completedAssignments: Object.values(progressByWorld).filter((p) => p.completed).length,
          totalAssignments: assignments.length,
        };
      })
    );

    return membersWithProgress;
  },
});

// ============================================================================
// CLASSROOM MUTATIONS
// ============================================================================

// Neue Klasse erstellen
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    teacherId: v.string(),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generiere eindeutigen Invite-Code
    let inviteCode = generateInviteCode();
    let existing = await ctx.db
      .query("classrooms")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    // Falls Code schon existiert, neuen generieren
    while (existing) {
      inviteCode = generateInviteCode();
      existing = await ctx.db
        .query("classrooms")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    const classroomId = await ctx.db.insert("classrooms", {
      name: args.name,
      description: args.description,
      teacherId: args.teacherId,
      inviteCode,
      gradeLevel: args.gradeLevel,
      subject: args.subject,
      createdAt: Date.now(),
    });

    return { classroomId, inviteCode };
  },
});

// Klasse aktualisieren
export const update = mutation({
  args: {
    classroomId: v.id("classrooms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { classroomId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(classroomId, filtered);
    return { success: true };
  },
});

// Invite-Code neu generieren
export const regenerateInviteCode = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    let inviteCode = generateInviteCode();
    let existing = await ctx.db
      .query("classrooms")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    while (existing) {
      inviteCode = generateInviteCode();
      existing = await ctx.db
        .query("classrooms")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    await ctx.db.patch(args.classroomId, { inviteCode });
    return { inviteCode };
  },
});

// Klasse löschen
export const remove = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    // Lösche alle Mitgliedschaften
    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Lösche alle Assignments
    const assignments = await ctx.db
      .query("classroomAssignments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // Lösche die Klasse
    await ctx.db.delete(args.classroomId);
    return { success: true };
  },
});

// ============================================================================
// MEMBERSHIP MUTATIONS
// ============================================================================

// Mit Invite-Code beitreten
export const joinWithCode = mutation({
  args: {
    inviteCode: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const classroom = await ctx.db
      .query("classrooms")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .first();

    if (!classroom) {
      return { success: false, error: "Ungültiger Einladungscode" };
    }

    if (classroom.isArchived) {
      return { success: false, error: "Diese Klasse ist archiviert" };
    }

    // Prüfe ob User schon Mitglied ist
    const existing = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom_user", (q) =>
        q.eq("classroomId", classroom._id).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      return { success: false, error: "Du bist bereits Mitglied dieser Klasse" };
    }

    // Prüfe ob User der Teacher ist
    if (classroom.teacherId === args.userId) {
      return { success: false, error: "Du bist der Lehrer dieser Klasse" };
    }

    await ctx.db.insert("classroomMembers", {
      classroomId: classroom._id,
      userId: args.userId,
      role: "student",
      joinedAt: Date.now(),
    });

    return { success: true, classroomId: classroom._id, classroomName: classroom.name };
  },
});

// Mitglied entfernen
export const removeMember = mutation({
  args: {
    classroomId: v.id("classrooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom_user", (q) =>
        q.eq("classroomId", args.classroomId).eq("userId", args.userId)
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }

    return { success: true };
  },
});

// Klasse verlassen (als Schüler)
export const leave = mutation({
  args: {
    classroomId: v.id("classrooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom_user", (q) =>
        q.eq("classroomId", args.classroomId).eq("userId", args.userId)
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }

    return { success: true };
  },
});

// ============================================================================
// ASSIGNMENT MUTATIONS
// ============================================================================

// Welt einer Klasse zuweisen
export const assignWorld = mutation({
  args: {
    classroomId: v.id("classrooms"),
    worldId: v.id("worlds"),
    assignedBy: v.string(),
    title: v.optional(v.string()),
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Prüfe ob Assignment schon existiert
    const existing = await ctx.db
      .query("classroomAssignments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .filter((q) => q.eq(q.field("worldId"), args.worldId))
      .first();

    if (existing) {
      return { success: false, error: "Diese Welt ist bereits zugewiesen" };
    }

    const assignmentId = await ctx.db.insert("classroomAssignments", {
      classroomId: args.classroomId,
      worldId: args.worldId,
      assignedBy: args.assignedBy,
      title: args.title,
      instructions: args.instructions,
      dueDate: args.dueDate,
      isRequired: args.isRequired ?? true,
      createdAt: Date.now(),
    });

    return { success: true, assignmentId };
  },
});

// Assignment aktualisieren
export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("classroomAssignments"),
    title: v.optional(v.string()),
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { assignmentId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(assignmentId, filtered);
    return { success: true };
  },
});

// Assignment entfernen
export const removeAssignment = mutation({
  args: { assignmentId: v.id("classroomAssignments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.assignmentId);
    return { success: true };
  },
});

// ============================================================================
// TEACHER DASHBOARD QUERIES
// ============================================================================

// Übersicht für Teacher Dashboard
export const getTeacherOverview = query({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    let totalStudents = 0;
    let totalAssignments = 0;
    let recentActivity: Array<{
      type: string;
      classroom: string;
      timestamp: number;
    }> = [];

    for (const classroom of classrooms) {
      // Zähle Schüler
      const members = await ctx.db
        .query("classroomMembers")
        .withIndex("by_classroom", (q) => q.eq("classroomId", classroom._id))
        .collect();
      totalStudents += members.length;

      // Zähle Assignments
      const assignments = await ctx.db
        .query("classroomAssignments")
        .withIndex("by_classroom", (q) => q.eq("classroomId", classroom._id))
        .collect();
      totalAssignments += assignments.length;

      // Sammle neueste Beitritte
      for (const member of members.slice(-3)) {
        recentActivity.push({
          type: "join",
          classroom: classroom.name,
          timestamp: member.joinedAt,
        });
      }
    }

    // Sortiere Activity nach Zeit
    recentActivity.sort((a, b) => b.timestamp - a.timestamp);
    recentActivity = recentActivity.slice(0, 10);

    return {
      totalClassrooms: classrooms.length,
      totalStudents,
      totalAssignments,
      recentActivity,
    };
  },
});
