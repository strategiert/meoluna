// Convex ↔ Clerk authentication bridge.
//
// The Clerk JWT template named "convex" issues tokens with `aud: "convex"`
// signed by the Clerk instance at clerk.meoluna.com. Convex validates those
// tokens here so that `ctx.auth.getUserIdentity()` resolves to the Clerk user
// (identity.subject === users.clerkId).
//
// The issuer domain can be overridden per-deployment via CLERK_JWT_ISSUER_DOMAIN
// (set in the Convex dashboard) to support separate dev/prod Clerk instances.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? "https://clerk.meoluna.com",
      applicationID: "convex",
    },
  ],
};
