# Ticketing Support

A support / ticketing platform built with [Next.js](https://nextjs.org), Prisma + PostgreSQL, and a standalone Socket.IO server for real-time replies and notifications.

## Architecture

The stack runs as three Docker Compose services:

| Service    | Container            | Port | Description                                                                 |
| ---------- | -------------------- | ---- | --------------------------------------------------------------------------- |
| `web`      | `ticketing-web`      | 3000 | The Next.js application.                                                     |
| `realtime` | `ticketing-realtime` | 3001 | Standalone Socket.IO server ([realtime/socketServer.ts](realtime/socketServer.ts)) that fans out reply/notification events. |
| `db`       | `ticketing-db`       | 5432 | PostgreSQL 15.                                                              |

Docker is the supported way to run the app — it wires the three services together, prepares the database, and seeds the initial admin account automatically.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A `.env` file at the repo root (see [Environment variables](#environment-variables)). It is git-ignored, so create it before the first run.

## Environment variables

Both compose files read configuration from `.env`. The most important keys:

| Variable                              | Used by              | Notes                                                                                   |
| ------------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`                        | Prisma (host-side)   | Uses `localhost` for running the Prisma CLI from your machine. Inside the `web` container it is overridden to point at the `db` service. |
| `POSTGRES_USER` / `_PASSWORD` / `_DB` | `db` service         | Read by Postgres on first init — keep them in sync with `DATABASE_URL`.                  |
| `JWT_SECRET`                          | Auth                 | Long random string used to sign auth JWTs.                                               |
| `ADMIN_*`                             | Seed                 | Initial admin account created by [prisma/seed.ts](prisma/seed.ts). Change before seeding a real environment. |
| `DEFAULT_USER_PASSWORD`               | Web                  | Initial password for users the admin creates from the dashboard.                        |
| `SOCKET_PORT`                         | `realtime` service   | Port the Socket.IO server listens on (3001).                                            |
| `NEXT_PUBLIC_APP_URL`                 | Web / realtime CORS  | Origin the browser loads the app from; also the CORS origin the realtime server allows. |
| `NEXT_PUBLIC_SOCKET_URL`              | Browser              | Public URL of the realtime server (inlined into the client bundle).                     |

> Container-network values (`DATABASE_URL` over the compose network and `SOCKET_INTERNAL_URL`) are set directly in [docker-compose.yml](docker-compose.yml) for the `web` service, so the `.env` values stay host-facing.

## Running in production

The base [docker-compose.yml](docker-compose.yml) is a **production build**: the source is baked into the image and `next build` runs at image-build time.

```bash
docker compose up --build -d
```

This builds and starts all three services. On startup the `web` container's entrypoint ([docker-entrypoint.sh](docker-entrypoint.sh)) waits for the database, applies the schema (`prisma db push`), seeds the admin account, then runs `pnpm start`.

Open [http://localhost:3000](http://localhost:3000).

> **Because the source is baked in, code changes require a rebuild.** After editing application code, re-run with `--build` (e.g. `docker compose up --build -d web`) to pick up the changes.

To stop:

```bash
docker compose down          # keep the database volume
docker compose down -v       # also drop the Postgres data volume
```

## Running in development (hot reload)

For local development, layer the [docker-compose.dev.yml](docker-compose.dev.yml) override on top of the base file:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The override swaps `web` and `realtime` to their `*.dev` images
([Dockerfile.dev](Dockerfile.dev) and [realtime/Dockerfile.dev](realtime/Dockerfile.dev)) and changes the workflow so you **don't rebuild per change**:

- The host source is bind-mounted into the containers, so edits are picked up live.
- `web` runs `next dev` (Fast Refresh / HMR); `realtime` runs `tsx watch` (auto-restart).
- The container's own `node_modules` and `.next` are masked by anonymous volumes so the Windows host's copies never clobber the Linux builds.
- File-watch polling (`WATCHPACK_POLLING` / `CHOKIDAR_USEPOLLING`) is enabled because bind-mounted filesystems on Windows don't emit inotify events.

The dev entrypoint ([docker-entrypoint.dev.sh](docker-entrypoint.dev.sh)) regenerates the Prisma client, syncs the schema, seeds, then starts the dev server.

### Windows note: webpack, not Turbopack

The dev server is started with `next dev --webpack` on purpose. Turbopack's filesystem layer fails to resolve bracket-named dynamic route segments (`[id]`, etc.) over the Windows Docker bind mount and 404s every dynamic route; webpack resolves them correctly.

### If you hit mass 404s

Stale anonymous volumes (`.next` / `node_modules`) are a common cause of widespread 404s after dependency or build changes. Recreate them:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Running outside Docker

You can run the Next.js app directly for quick UI work, but you still need a reachable Postgres and (for real-time features) the Socket.IO server. With `DATABASE_URL` pointing at a running database:

```bash
pnpm install
pnpm exec prisma generate
pnpm dev
```

The app falls back to `localhost:3001` for the realtime server when `SOCKET_INTERNAL_URL` is unset (non-Docker runs).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
