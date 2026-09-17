# CA Firm SaaS Platform

CRM, Khata Book, reminders, client management, tasks, documents, billing and reporting for CA firms — MongoDB, Express, React, Node. Plain JavaScript (see [`PROJECT_STATE.md`](./PROJECT_STATE.md) for the stack decisions), two roles (`admin` / `user`).

## Run locally (without Docker)

Requires Node 20+ and a MongoDB instance (local or Atlas).

```bash
npm install                       # installs both workspaces
cp server/.env.example server/.env    # fill in MONGO_URI at minimum
cp client/.env.example client/.env
npm run seed                      # creates the first firm + admin user
npm run dev                       # runs server (:5000) and client (:5173) together
```

Seed credentials default to `admin@example.com` / `ChangeMe123!` (override via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `server/.env`).

## Run with Docker Compose

```bash
cp server/.env.example server/.env    # fill in real secrets before anything but local dev
docker compose up --build
```

This starts MongoDB, the API (`:5000`), and the client served by nginx (`:8080`, which reverse-proxies `/api` to the server container — see `client/nginx.conf`). Seed the admin user once the containers are up:

```bash
docker compose exec server node src/utils/seed.js
```

## Project layout

- `server/` — Express API, feature-based (`src/features/<module>/{models,repositories,services,controllers,validators,routes}`)
- `client/` — React 19 + Vite SPA, same feature-based shape under `src/features/<module>/`
- `docs/ARCHITECTURE.md` — system design (module map, layering rules, DB reference graph)
- `PROJECT_STATE.md` — build log: what's done, key decisions, and patterns to follow when extending

## Known scope cuts (see `PROJECT_STATE.md` for the full list)

- No PDF generation library — "print" views (ledger statement, invoices) use the browser's native print dialog.
- SMS/WhatsApp reminder channels are schema-ready (`Reminder.channels`) but not wired to a provider.
- "Backup" is a JSON data export, not a binary database snapshot.
- Document upload is only wired for firm-wide documents on the frontend; the backend already supports per-client/per-task attachment.
