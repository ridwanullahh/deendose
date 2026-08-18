#!/usr/bin/env bash
# Deploys the DeenDose Next.js app to Cloudflare Pages.
# Usage:
#   ./scripts/deploy-cloudflare-pages.sh
# Env vars:
#   CLOUDFLARE_API_TOKEN   (required)
#   CLOUDFLARE_ACCOUNT_ID (required)
#   CLOUDFLARE_PROJECT_NAME (optional, defaults to "deendose")
set -euo pipefail

PROJECT_NAME="${CLOUDFLARE_PROJECT_NAME:-deendose}"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "ERROR: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set in env." >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "[deploy] (1/3) Building for Cloudflare Pages..."
npm run build:pages

echo "[deploy] (2/3) Setting project compatibility flags..."
# Idempotent: PATCH the project so nodejs_compat is enabled. Safe to run
# every deploy; if the project doesn't exist yet, we create it below.
curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --max-time 30 \
  -d '{
    "deployment_configs": {
      "production": {
        "compatibility_flags": ["nodejs_compat"],
        "compatibility_date": "2024-11-01"
      },
      "preview": {
        "compatibility_flags": ["nodejs_compat"],
        "compatibility_date": "2024-11-01"
      }
    }
  }' > /dev/null || echo "[deploy]    project PATCH failed (may not exist yet); will create on next step"

# Create the project if it doesn't exist (needed on first deploy).
if ! npx wrangler pages project list 2>/dev/null | grep -q "^${PROJECT_NAME}\b"; then
  echo "[deploy]    creating project ${PROJECT_NAME} (first deploy)..."
  npx wrangler pages project create "${PROJECT_NAME}" --production-branch=main
fi

echo "[deploy] (3/3) Deploying .vercel/output/static to Cloudflare Pages..."
npx wrangler pages deploy .vercel/output/static \
  --project-name="${PROJECT_NAME}" \
  --branch=main \
  --commit-dirty=true

echo "[deploy] Done. Live URL: https://${PROJECT_NAME}.pages.dev"
