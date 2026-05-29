# Convex Deployment

Meoluna has two deployments:

- Frontend: Vercel, deployed automatically from `main`.
- Backend: Convex, deployed manually.

Production Convex is:

```text
https://helpful-blackbird-68.convex.cloud
CONVEX_DEPLOYMENT=prod:helpful-blackbird-68
```

Local `.env.local` may point to a Convex dev deployment. Do not use it for production deploys.

Use this command for production Convex deploys:

```powershell
npm run deploy:convex:prod
```

This script sets `CONVEX_DEPLOYMENT=prod:helpful-blackbird-68` for the current process and then runs:

```powershell
npx convex deploy --yes --typecheck try
```
