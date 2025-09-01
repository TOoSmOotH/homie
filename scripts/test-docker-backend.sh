#!/usr/bin/env bash
set -euo pipefail

# Test backend TypeScript build in a Docker environment — without pushing to GitHub.
#
# Usage:
#   bash scripts/test-docker-backend.sh            # Build backend-builder stage (matches CI)
#   bash scripts/test-docker-backend.sh --tsc-only # Run tsc in a clean Node container

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

MODE="builder"
if [[ "${1:-}" == "--tsc-only" ]]; then
  MODE="tsc"
fi

if [[ "$MODE" == "builder" ]]; then
  echo "[info] Building Docker backend-builder stage (CI parity)..."
  docker build \
    -f docker/Dockerfile.production \
    --target backend-builder \
    --progress=plain \
    .
  echo "[ok] backend-builder stage built successfully."
else
  echo "[info] Running tsc inside a clean Node container (monorepo root)..."
  docker run --rm \
    -v "$PWD":/app \
    -w /app \
    node:22-alpine \
    sh -lc "apk add --no-cache python3 py3-setuptools make g++ sqlite-dev >/dev/null && npm ci --include=dev && cd backend && npx tsc"
  echo "[ok] tsc passed in container."
fi

