#!/usr/bin/env bash
# deploy-cloudflare-pages.sh
#
# Deploys the DeenDose Next.js app to Cloudflare Pages using
# @cloudflare/next-on-pages + wrangler. Sets CLOUDFLARE_API_TOKEN
# and CLOUDFLARE_ACCOUNT_ID from env (or accepts them as args).
# Runs `npm run build:pages`, then `npx wrangler pages deploy
# .vercel/output --project-name=deendose --branch=main`, captures
# the resulting *.pages.dev URL, prints it, and exits 0 on success.
#
# Usage:
#   ./scripts/deploy-cloudflare-pages.sh
#   ./scripts/deploy-cloudflare-pages.sh <account_id> <api_token>
#
# Requires: CLOUDFLARE_PROJECT_NAME (defaults to "deendose").
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

ACCOUNT_ID="${1:-${CLOUDFLARE_ACCOUNT_ID:-}}"
API_TOKEN="${2:-${CLOUDFLARE_API_TOKEN:-}}"
PROJECT_NAME="${CLOUDFLARE_PROJECT_NAME:-deendose}"
BRANCH="${CLOUDFLARE_PAGES_BRANCH:-main}"

if [[ -z "${ACCOUNT_ID}" ]]; then
  echo "[deploy] ERROR: CLOUDFLARE_ACCOUNT_ID is not set." >&2
  echo "[deploy] Pass it as the first arg or via env." >&2
  exit 2
fi
if [[ -z "${API_TOKEN}" ]]; then
  echo "[deploy] ERROR: CLOUDFLARE_API_TOKEN is not set." >&2
  echo "[deploy] Pass it as the second arg or via env." >&2
  exit 2
fi

export CLOUDFLARE_ACCOUNT_ID="${ACCOUNT_ID}"
export CLOUDFLARE_API_TOKEN="${API_TOKEN}"

echo "[deploy] Account ID:   ${ACCOUNT_ID}"
echo "[deploy] Project:      ${PROJECT_NAME}"
echo "[deploy] Branch:       ${BRANCH}"
echo "[deploy] Repo root:    ${REPO_ROOT}"
echo "[deploy] Building .vercel/output via @cloudflare/next-on-pages..."

# Build the Pages asset bundle from the Next.js app.
# --skip-build-output=false means: actually run `next build` first
# (next-on-pages default behaviour). If the flag is needed in a
# specific version of next-on-pages, we honour an override via
# the env var NEXT_ON_PAGES_FLAGS.
EXTRA_FLAGS="${NEXT_ON_PAGES_FLAGS:-}"
if [[ -n "${EXTRA_FLAGS}" ]]; then
  npx @cloudflare/next-on-pages ${EXTRA_FLAGS}
else
  npx @cloudflare/next-on-pages
fi

OUTPUT_DIR="${REPO_ROOT}/.vercel/output"
if [[ ! -d "${OUTPUT_DIR}" ]]; then
  echo "[deploy] ERROR: ${OUTPUT_DIR} does not exist. Build failed?" >&2
  exit 1
fi

echo "[deploy] Deploying to Cloudflare Pages (project=${PROJECT_NAME}, branch=${BRANCH})..."

# Capture wrangler output so we can extract the live URL.
DEPLOY_LOG="$(mktemp)"
trap 'rm -f "${DEPLOY_LOG}"' EXIT

npx wrangler pages deploy "${OUTPUT_DIR}" \
  --project-name="${PROJECT_NAME}" \
  --branch="${BRANCH}" \
  --commit-dirty=true \
  2>&1 | tee "${DEPLOY_LOG}"

# Extract the first *.pages.dev URL from the log.
LIVE_URL="$(grep -oE 'https://[a-zA-Z0-9.-]+\.pages\.dev' "${DEPLOY_LOG}" | head -n1 || true)"
if [[ -n "${LIVE_URL}" ]]; then
  echo "[deploy] Live URL: ${LIVE_URL}"
else
  echo "[deploy] Could not extract a *.pages.dev URL from wrangler output." >&2
  echo "[deploy] Check the log above for the actual deployment URL." >&2
fi

echo "[deploy] Done. exit 0"
exit 0
