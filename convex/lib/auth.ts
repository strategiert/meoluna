// Central authorization helpers for Convex functions.
//
// Root-cause fix: previously every function trusted a client-supplied
// `userId` / `clerkId` / `teacherId` string as identity. Those arguments are
// attacker-controlled and MUST NOT be used for authorization. Always derive
// the acting identity from the verified Clerk JWT via `ctx.auth`.
//
// identity.subject === Clerk user id === users.clerkId (the join key used
// throughout the schema: worlds.userId, progress.userId, classrooms.teacherId,
// classroomMembers.userId are all clerkIds).

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/** Any authenticated context (query/mutation/action). */
type AuthCtx = { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } };

/**
 * Returns the verified Clerk identity or throws. Works in queries, mutations
 * and actions (actions have `ctx.auth` but no `ctx.db`).
 */
export async function requireIdentity(ctx: AuthCtx): Promise<{ subject: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Nicht authentifiziert.");
  }
  return identity;
}

/** The clerkId of the authenticated caller, or null if anonymous. */
export async function getCallerClerkId(ctx: AuthCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

/**
 * Returns the caller's `users` document, creating nothing. Throws if the
 * caller is unauthenticated or has no synced user record.
 */
export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) {
    throw new Error("Benutzerkonto nicht gefunden.");
  }
  return user;
}

/** Like requireUser, but returns null instead of throwing when anonymous. */
export async function getUserOrNull(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}

/** Requires the caller to have the admin role. */
export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Adminrechte erforderlich.");
  }
  return user;
}

/** Requires the caller to have teacher or admin role. */
export async function requireTeacher(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "teacher" && user.role !== "admin") {
    throw new Error("Lehrerrechte erforderlich.");
  }
  return user;
}

/**
 * Requires the caller to be the teacher who owns `classroomId` (or an admin).
 * Returns the caller and the classroom.
 */
export async function requireClassroomOwner(
  ctx: Ctx,
  classroomId: Id<"classrooms">,
): Promise<{ user: Doc<"users">; classroom: Doc<"classrooms"> }> {
  const user = await requireUser(ctx);
  const classroom = await ctx.db.get(classroomId);
  if (!classroom) {
    throw new Error("Klasse nicht gefunden.");
  }
  if (classroom.teacherId !== user.clerkId && user.role !== "admin") {
    throw new Error("Nicht autorisiert für diese Klasse.");
  }
  return { user, classroom };
}

/**
 * Requires the caller to be a member (student/assistant) OR the teacher of
 * `classroomId`, or an admin. Returns the caller, classroom and membership
 * (null if the caller is the teacher/admin rather than a member).
 */
export async function requireClassroomAccess(
  ctx: Ctx,
  classroomId: Id<"classrooms">,
): Promise<{
  user: Doc<"users">;
  classroom: Doc<"classrooms">;
  membership: Doc<"classroomMembers"> | null;
}> {
  const user = await requireUser(ctx);
  const classroom = await ctx.db.get(classroomId);
  if (!classroom) {
    throw new Error("Klasse nicht gefunden.");
  }
  if (classroom.teacherId === user.clerkId || user.role === "admin") {
    return { user, classroom, membership: null };
  }
  const membership = await ctx.db
    .query("classroomMembers")
    .withIndex("by_classroom_user", (q) =>
      q.eq("classroomId", classroomId).eq("userId", user.clerkId),
    )
    .first();
  if (!membership) {
    throw new Error("Nicht autorisiert für diese Klasse.");
  }
  return { user, classroom, membership };
}
