import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireUser,
  requireTeacher,
  requireClassroomOwner,
  requireClassroomAccess,
} from "./lib/auth";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generiere kryptografisch zufälligen 8-stelligen Invite-Code.
// 32-Zeichen-Alphabet (keine verwechselbaren Zeichen) × 8 Stellen = ~40 Bit.
// 256 % 32 === 0 → modulo ist unverzerrt.
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

// ============================================================================
// CLASSROOM QUERIES
// ============================================================================

// Alle Klassen des angemeldeten Teachers (Identität serverseitig aus ctx.auth).
export const listByTeacher = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_teacher", (q) => q.eq("teacherId", user.clerkId))
      .collect();

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

// Alle Klassen, in denen der angemeldete User Mitglied ist.
export const listByStudent = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const memberships = await ctx.db
      .query("classroomMembers")
      .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
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

// Einzelne Klasse mit Details — nur für Teacher/Mitglieder/Admin.
export const getById = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const { classroom } = await requireClassroomAccess(ctx, args.classroomId);

    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const assignments = await ctx.db
      .query("classroomAssignments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

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

// Klasse per Invite-Code finden (Beitritts-Preview).
// Erfordert Anmeldung (nur eingeloggte Nutzer treten Klassen bei) und gibt
// nur minimale, nicht-sensible Metadaten zurück.
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const classroom = await ctx.db
      .query("classrooms")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase())
      )
      .first();

    if (!classroom) return null;

    return {
      _id: classroom._id,
      name: classroom.name,
      description: classroom.description,
      gradeLevel: classroom.gradeLevel,
      subject: classroom.subject,
    };
  },
});

// Mitglieder einer Klasse mit Fortschritt — nur Teacher/Admin (Kinder-PII).
export const getMembers = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    await requireClassroomOwner(ctx, args.classroomId);

    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const assignments = await ctx.db
      .query("classroomAssignments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const membersWithProgress = await Promise.all(
      members.map(async (member) => {
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

// Neue Klasse erstellen — nur Teacher/Admin. teacherId = angemeldeter Nutzer.
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireTeacher(ctx);

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

    const classroomId = await ctx.db.insert("classrooms", {
      name: args.name,
      description: args.description,
      teacherId: user.clerkId,
      inviteCode,
      gradeLevel: args.gradeLevel,
      subject: args.subject,
      createdAt: Date.now(),
    });

    return { classroomId, inviteCode };
  },
});

// Klasse aktualisieren — nur besitzender Teacher/Admin.
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
    await requireClassroomOwner(ctx, args.classroomId);
    const { classroomId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(classroomId, filtered);
    return { success: true };
  },
});

// Invite-Code neu generieren — nur besitzender Teacher/Admin.
export const regenerateInviteCode = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    await requireClassroomOwner(ctx, args.classroomId);

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

// Klasse löschen — nur besitzender Teacher/Admin.
export const remove = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    await requireClassroomOwner(ctx, args.classroomId);

    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    const assignments = await ctx.db
      .query("classroomAssignments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(args.classroomId);
    return { success: true };
  },
});

// ============================================================================
// MEMBERSHIP MUTATIONS
// ============================================================================

// Mit Invite-Code beitreten — als angemeldeter Nutzer (userId = ctx.auth).
export const joinWithCode = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const classroom = await ctx.db
      .query("classrooms")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase())
      )
      .first();

    if (!classroom) {
      return { success: false, error: "Ungültiger Einladungscode" };
    }

    if (classroom.isArchived) {
      return { success: false, error: "Diese Klasse ist archiviert" };
    }

    const existing = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom_user", (q) =>
        q.eq("classroomId", classroom._id).eq("userId", user.clerkId)
      )
      .first();

    if (existing) {
      return { success: false, error: "Du bist bereits Mitglied dieser Klasse" };
    }

    if (classroom.teacherId === user.clerkId) {
      return { success: false, error: "Du bist der Lehrer dieser Klasse" };
    }

    await ctx.db.insert("classroomMembers", {
      classroomId: classroom._id,
      userId: user.clerkId,
      role: "student",
      joinedAt: Date.now(),
    });

    return { success: true, classroomId: classroom._id, classroomName: classroom.name };
  },
});

// Mitglied entfernen — nur besitzender Teacher/Admin.
export const removeMember = mutation({
  args: {
    classroomId: v.id("classrooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireClassroomOwner(ctx, args.classroomId);

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

// Klasse verlassen (als Schüler) — entfernt nur die eigene Mitgliedschaft.
export const leave = mutation({
  args: {
    classroomId: v.id("classrooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const member = await ctx.db
      .query("classroomMembers")
      .withIndex("by_classroom_user", (q) =>
        q.eq("classroomId", args.classroomId).eq("userId", user.clerkId)
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

// Welt einer Klasse zuweisen — nur besitzender Teacher/Admin.
export const assignWorld = mutation({
  args: {
    classroomId: v.id("classrooms"),
    worldId: v.id("worlds"),
    title: v.optional(v.string()),
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireClassroomOwner(ctx, args.classroomId);

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
      assignedBy: user.clerkId,
      title: args.title,
      instructions: args.instructions,
      dueDate: args.dueDate,
      isRequired: args.isRequired ?? true,
      createdAt: Date.now(),
    });

    return { success: true, assignmentId };
  },
});

// Assignment aktualisieren — nur Teacher/Admin der zugehörigen Klasse.
export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("classroomAssignments"),
    title: v.optional(v.string()),
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Zuweisung nicht gefunden.");
    }
    await requireClassroomOwner(ctx, assignment.classroomId);

    const { assignmentId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(assignmentId, filtered);
    return { success: true };
  },
});

// Assignment entfernen — nur Teacher/Admin der zugehörigen Klasse.
export const removeAssignment = mutation({
  args: { assignmentId: v.id("classroomAssignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      return { success: true };
    }
    await requireClassroomOwner(ctx, assignment.classroomId);
    await ctx.db.delete(args.assignmentId);
    return { success: true };
  },
});

// ============================================================================
// TEACHER DASHBOARD QUERIES
// ============================================================================

// Übersicht für Teacher Dashboard — Identität serverseitig.
export const getTeacherOverview = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_teacher", (q) => q.eq("teacherId", user.clerkId))
      .collect();

    let totalStudents = 0;
    let totalAssignments = 0;
    let recentActivity: Array<{
      type: string;
      classroom: string;
      timestamp: number;
    }> = [];

    for (const classroom of classrooms) {
      const members = await ctx.db
        .query("classroomMembers")
        .withIndex("by_classroom", (q) => q.eq("classroomId", classroom._id))
        .collect();
      totalStudents += members.length;

      const assignments = await ctx.db
        .query("classroomAssignments")
        .withIndex("by_classroom", (q) => q.eq("classroomId", classroom._id))
        .collect();
      totalAssignments += assignments.length;

      for (const member of members.slice(-3)) {
        recentActivity.push({
          type: "join",
          classroom: classroom.name,
          timestamp: member.joinedAt,
        });
      }
    }

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
