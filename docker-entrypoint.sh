#!/bin/sh

echo "[Entrypoint] Checking database connection and pushing schema..."

# Loop until prisma can successfully push to the database.
# Use --url to pass the DATABASE_URL directly, bypassing prisma.config.ts
# which requires tsx/dotenv and may not resolve in the production container.
until npx prisma db push --url "$DATABASE_URL"; do
  echo "[Entrypoint] Database not ready yet, retrying in 3 seconds..."
  sleep 3
done

echo "[Entrypoint] Database schema is up to date."

# Seed the database (idempotent)
echo "[Entrypoint] Seeding database..."
npx prisma db seed

echo "[Entrypoint] Starting Next.js application..."
exec pnpm start
