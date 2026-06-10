#!/bin/sh

# Dev entrypoint: prepare the database, then start Next.js with hot reload.
# (The production entrypoint is docker-entrypoint.sh, which runs `pnpm start`.)

echo "[dev] Generating Prisma client..."
npx prisma generate

echo "[dev] Waiting for database and syncing schema..."
# Use --url to pass DATABASE_URL directly, bypassing prisma.config.ts (which
# needs tsx/dotenv and may not resolve here).
until npx prisma db push --url "$DATABASE_URL"; do
  echo "[dev] Database not ready yet, retrying in 3 seconds..."
  sleep 3
done

echo "[dev] Seeding database (idempotent)..."
npx prisma db seed || echo "[dev] Seed skipped/failed (continuing)."

echo "[dev] Starting Next.js dev server with hot reload..."
# Use webpack, not Turbopack: Turbopack's Rust filesystem layer fails to resolve
# bracket-named dynamic route segments ([id], etc.) over the Windows Docker bind
# mount, 404-ing every dynamic route. Webpack uses Node's fs and resolves them.
exec pnpm exec next dev --webpack
