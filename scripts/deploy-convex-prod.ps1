$ErrorActionPreference = "Stop"

$env:CONVEX_DEPLOYMENT = "prod:helpful-blackbird-68"

Write-Host "Deploying Convex production deployment: $env:CONVEX_DEPLOYMENT"
npx convex deploy --yes --typecheck try
