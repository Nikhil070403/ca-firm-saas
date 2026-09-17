# Developer Guide — CA Firm SaaS Platform

Technical reference for anyone working on the codebase: stack, layout, conventions, and how to extend the product without breaking existing patterns.

## 1. Stack at a glance

| Layer | Choice | Notes |
|---|---|---|
| Backend | Node 20+, Express 4, **plain JS (CommonJS)** | No TypeScript, no Babel beyond what Express needs |
| Frontend | React 19 + Vite 5, **plain JS/JSX (ESM)** | No Redux, no TanStack, no UI framework |
| Database | MongoDB + Mongoose 8 | One collection per feature module |
| Auth | JWT access token + httpOnly refresh cookie (rotated) | Sessions stored as bcrypt-hashed `RefreshToken` rows |
| Passwords | bcrypt (bcryptjs), cost 12 | Never store/compare plaintext |
| 2FA | otplib@12 (TOTP) + qrcode | Backup codes stored as hashes, single-use |
| Jobs | node-cron (in-process) | No external queue |
| Files | Cloudinary + multer (memory) | Document/avatar storage |
| Email | Nodemailer (best-effort, never throws) | Placeholder host skipped |
| Testing | Jest + mongodb-memory-server (server), Vitest + Testing Library (client) | |

Monorepo with npm workspaces: `server/` and `client/` resolve from the root `package.json`.

## 2. Quick start

### Local (no Docker)

```
npm install                       # installs both workspaces
cp server/.env.example server/.env    # fill in MONGO_URI at minimum
cp client/.env.example client/.env
npm run seed                      # creates first firm + superadmin
npm run dev                       # server :5000, client :5173
```

Seed defaults: `admin@example.com` / `ChangeMe123!` (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

### Docker Compose

```
cp server/.env.example server/.env
docker compose up --build         # mongo + server :5000 + nginx client :8080
docker compose exec server node src/utils/seed.js
```

`client/nginx.conf` reverse-proxies `/api` to the server container.

### Useful root scripts

| Script | What it does |
|---|---|
| `npm run dev` | Both workspaces via concurrently |
| `npm run build` | Production client build → `client/dist` |
| `npm run lint` | ESLint server + client |
| `npm run test` | Jest (server) then Vitest (client) |
| `npm run seed` | Bootstrap firm + superadmin |
| `npm run set-password -w server -- email pass` | Reset a user password from CLI (skips validation) |

## 3. Repository layout

```
ca-firm-saas/
├── client/                       # React SPA
│   ├── src/
│   │   ├── App.jsx               # ALL routes live here (single router)
│   │   ├── main.jsx              # entry (mounts AuthContext + Toast)
│   │   ├── index.css             # design tokens (CSS custom properties)
│   │   ├── components/
│   │   │   ├── ui/               # Button, Input, Select, Modal, DataTable, …
│   │   │   ├── shared/           # Toasts, ProtectedRoute, GlobalSearch, PanelAssistant, …
│   │   │   └── layout/           # Sidebar, Topbar
│   │   ├── layouts/              # AuthLayout, DashboardLayout, PortalLayout
│   │   ├── features/<module>/    # pages, components, services, context per module
│   │   ├── services/apiClient.js # axios wrapper (auth header, error unwrap)
│   │   ├── hooks/                # useApiData, useCreateParam, useTheme
│   │   └── constants/            # services.js, roles.js, session.js, assistant*
├── server/
│   └── src/
│       ├── server.js             # boot: config → db → app → jobs
│       ├── app.js                # express app, helmet/cors/rate-limit/morgan
│       ├── config/               # env, db, mailer, cloudinary
│       ├── routes/index.js       # mounts every feature route (register new ones here!)
│       ├── middlewares/          # auth, rbac, validate, upload, rateLimiter, errorHandler
│       ├── models/               # cross-cutting: registerModels.js, ActivityLog, auditPlugin
│       ├── services/             # cross-cutting: activityLog.service
│       ├── repositories/         # BaseRepository (firm-scoping + pagination)
│       ├── utils/                # AppError, ApiResponse, jwt, mailer glue, csv, seed, …
│       ├── jobs/                 # node-cron jobs
│       └── features/<module>/    # models, repositories, services, controllers, validators, routes
├── docs/                         # ARCHITECTURE.md, DEVELOPER.md, USER_GUIDE.md
├── docker-compose.yml
└── render.yaml                   # Render.com deploy manifest
```

## 4. Server conventions (strict)

### Layering

`routes → controller → service → repository → model`

- Controllers **never** touch Mongoose directly.
- Services hold business logic and cross-module reads (via other services, never another module's models inline).
- Repositories abstract Mongoose queries. All repositories inherit `BaseRepository` (`server/src/repositories/BaseRepository.js`), which **auto-scopes every query by `firmId` and soft-delete (`isDeleted: false`)**. Never query a model directly — bypassing the repository bypasses firm isolation.
- Models call `mongoose.model(...)` as a side effect on `require()`. Every model is `require()`-d exactly once by `server/src/models/registerModels.js`, imported first thing in `server.js`. If you add a model, add it there too — otherwise any `ref: 'X'` populate throws `MissingSchemaError`.

### API envelope

Every response uses `server/src/utils/ApiResponse.js`:

```ts
{ success, message, data, meta?: { page, limit, total, totalPages }, error?: { code, details } }
```

### Errors

- Controllers are wrapped in `asyncHandler`; business logic never `try/catch`es.
- Throw `AppError` (with `status`/`code`); the global `errorHandler.middleware.js` serializes it. Never throw a bare `Error` where an HTTP status is needed.

### Validation

- `features/<module>/validators/*.validator.js` are plain JS validator functions returning `{ isValid, errors }`. No Zod.
- Applied via `validate(validateX)` middleware before the controller runs.
- Helpers in `server/src/utils/validationHelpers.js` (`ValidationResult`, `requireString`, `requireEmail`, `requireEnum`, `optionalObjectId`, …).

### Auth & RBAC

- `middlewares/auth.middleware.js` — `requireAuth` verifies JWT access token. Access token claims: `{ userId, role, firmId, sessionId }` (short-lived).
- `middlewares/rbac.middleware.js` — **capability-based**, not role-name-based:
  - `authorize('client:delete')` — capability gates on routes.
  - `requireAdminRole` — strict admin/superadmin role gate (used for approval workflows, team management).
  - `can`, `canManageTargetRole(actorRole, targetRole)`, `assignableRoles(actorRole)`, `isAdminRole(role)`.
  - `ROLE_CAPABILITIES` = `{ superadmin: ['*'], admin: ['*'], employee/user: STAFF_CAPABILITIES, client: ['user:read'] }`. Clients access firm data **only** through the Client Portal service layer, never the general API.
- Refresh token: opaque random value, stored as **bcrypt hash** in `RefreshToken`, rotated on use, family-revoked on reuse detection. Travels as an httpOnly cookie scoped to `/api/v1/auth`, browser-session cookie. Session ids tie access tokens to refresh records (`auth.service.issueSession`).
- **Do not move refresh token storage to localStorage or make boot-refresh unconditional** — the tab-close logout (`constants/session.js`) depends on the current shape.

### Middleware order / hardening

`helmet` (CSP intentionally off — see comment in `app.js`), CORS (origin allow-list via `env.corsOrigins`), `express.json({ limit: '2mb' })`, cookie-parser, `mongoSanitize`, `apiLimiter`. Mutating auth routes use a stricter `authLimiter`.

### Jobs

`server/src/jobs/` — `node-cron`, registered in `jobs/index.js`:
- `complianceGenerate` — daily 05:30, idempotent upsert of current-period compliance returns.
- `complianceReminders` — daily 08:00, emails pending returns inside reminder window (max 1/day).
- `invoiceFollowUps` — daily 09:30, one payment nag 10 days after issue.
- `flagOverdueInvoices` — marks past-due invoices outstanding.
- `generateRecurringReminders`, `reminderDigest`, `cleanupRefreshTokens`.

### Email

`config/mailer.js` — `sendMail` **never throws** (returns `{ sent: false, error }`) and skips the placeholder `smtp.example.com` host. Never let a registration/invite fail because SMTP is down.

## 5. Client conventions

### Routing

- **All routes live in `client/src/App.jsx`** (single source of truth). Three namespaces: `/crm/*`, `/khata/*`, `/accounts/*`, plus cross-service `/users/:id`, `/notifications`, `/settings/profile`, and the Portal `/portal/*`.
- Guards: `ProtectedRoute`, `GuestRoute`, `ServiceRoute` (per-service assignment), `AdminRoute`, `PortalRoute` (`components/shared/ProtectedRoute.jsx`).
- Legacy paths are redirected in `App.jsx` — don't add new top-level route files.

### Service menu / access

- `constants/services.js` — `SERVICES` (crm/khata/accounts + accent colors), `SERVICE_MENUS` (grouped collapsible sidebars, `adminOnly` groups), `LEAD_STATUS_PAGES`.
- `canAccessService(user, key)` / `servicesForUser(user)` — admins always get everything; clients never get any staff service; everyone else is limited to `user.allowedServices`.
- Route changes → update `SERVICE_MENUS` **and** `App.jsx`, or the menu and the URL split apart.

### Roles

- `constants/roles.js` **mirrors `server/src/middlewares/rbac.middleware.js` by hand** — keep them in sync. `ROLE_LABELS`, `isAdminRole`, `isSuperAdmin`, `canManageTargetRole`, `assignableRoles`, `homePathForUser`.
- Legacy role `user` renders as "Employee" — pre-existing accounts only, never offered in the UI.

### Data fetching

- `hooks/useApiData.js` — canonical list-fetching hook. **Gotcha:** `skip` lives in the effect's deps, not inside `load` (see `PROJECT_STATE.md` "Manual Verification Findings"). Always read current values.
- `hooks/useCreateParam.js` — opens a page's create modal from `?create=1` (Topbar "+" Quick Create), strips the param after one open.
- `services/apiClient.js` — axios instance attaching `Authorization: Bearer`, unwrapping the envelope, `extractErrorMessage` for display.

### UI

- Hand-rolled components in `components/ui/` (Button, Input, Select, Textarea, Modal, Card, Badge, DataTable, Spinner, EmptyState, FormField, RowActionsMenu) and `components/shared/` (Toast, StatCard, GlobalSearch, BulkActionBar, BarChart, MessageThread, UserLink, NotificationBell, IdleLogoutGuard, ProtectedRoute, PanelAssistant).
- One stylesheet per component, colocated, using CSS custom properties from `index.css` (`--color-*`, `--sidebar-*`, `--space-*`). Hand-rolled SVG charts only (no chart lib).
- **`Select.jsx` takes an `options` array prop, NOT children.** Options must carry a real `value` — remember `User.toSafeJSON()` returns `id`, not `_id`, when building option lists from user data.
- Client pickers: `useApiData(() => clientApi.list({ limit: 100, status: 'active' }))` — works at current scale; replace with an async-search combobox if a firm has hundreds of clients.
- Print views (ledger statement, invoice): `.no-print` class + `window.print()` — no PDF library.

### Notifications / realtime

No socket.io. Notification bell polls (interval), Portal messages poll every 15s. Keep the poll fallback even if you ever add realtime.

## 6. Data model & cross-module rules

- Every collection carries `firmId`, `createdBy`, `updatedBy`, `isDeleted`, `deletedAt`, `deletedBy` via the shared `auditPlugin` (`server/src/models/plugins/auditPlugin.js`) — except `Firm` (the tenant itself).
- **Reference, don't denormalize**: store ObjectIds to other modules' entities, never copies of mutable fields. Snapshot only data needed for historical accuracy (e.g. invoice line-item price at billing time).
- Reference graph (see `docs/ARCHITECTURE.md` §5): firm → users/tasks/reminders/leads/clients; lead → client (on conversion); client → ledger entries/invoices/documents/tasks/reminders; invoice → line items (embedded) + receipts; reminder → notifications; document → polymorphic `ownerType`/`ownerId` (firm | client | task).

### Core models

`Firm` · `User` (+ RefreshToken) · `Client` · `CommunicationLog` · `Lead` (+ LeadActivity) · `LedgerEntry` · `Reminder` (+ Notification) · `Task` (+ TaskTemplate) · `Invoice` (+ Receipt, Expense) · `Document` (+ DocumentFolder) · `ComplianceReturn` · `Department` · `Attendance` · `Message` · `EmailTemplate` · `ActivityLog`

## 7. Permission matrix (server-enforced)

| Capability family | superadmin | admin | employee / user | client |
|---|---|---|---|---|
| client / lead / ledger / reminder / task / document / dashboard | ✓ | ✓ | ✓ (read + create/update own scope) | ✗ (Portal only) |
| invoice / expense / receipt / report / settings | ✓ | ✓ | ✗ | ✗ |
| delete (`*:delete`) | ✓ | ✓ | ✗ | ✗ |
| user management (`user:*`) | ✓ | ✓ (create/edit, not other admins) | ✗ (read only) | ✗ |
| Portal (`/portal/*`) | ✗ | ✗ | ✗ | ✓ (own data only) |

Notes:
- `employee`/`user` list-scoping: `listClients` / `listLeads` force-filter to `assignedTo === actor.id` when the actor is employee/user; a direct `getOne` on an unassigned record 404s (never reveals existence).
- Admin can only manage `employee`/`client` targets; superadmin manages everyone.
- Clients calling `GET /clients`, `GET /leads`, `GET /tasks`, `GET /invoices` get **403** — the Portal is the only sanctioned path, enforced in `rbac.middleware.js`.

## 8. API quick map

All under `/api/v1`. Full list in `PROJECT_STATE.md` (§ "Backend Complete"). Key groups:

- `/auth` — register, login (2FA-aware), refresh, logout, me, forgot/reset-password, verify-email, change-password, sessions, 2fa
- `/users`, `/dashboard`, `/clients`, `/leads`, `/khatabook`, `/reminders`, `/notifications`, `/tasks`, `/task-templates`, `/invoices`, `/receipts`, `/expenses`, `/documents`, `/reports`, `/settings`, `/compliance`, `/portal`, `/departments`, `/attendance`, `/activity`

Every list endpoint supports `?page&limit&sort&search&<field filters>` (shared `parseQuery` + repository `paginate()`).

## 9. Adding a new feature/module (checklist)

1. Create `server/src/features/<module>/` with `{models, repositories, services, controllers, validators, routes}` — every naming pattern mirrors existing modules.
2. Register the model in `server/src/models/registerModels.js`.
3. Mount the route in `server/src/routes/index.js` (dead code otherwise).
4. Gate endpoints with `requireAuth` + `authorize('…')` (capability) or `requireAdminRole` (role gate). Add the capability to `ROLE_CAPABILITIES` in `rbac.middleware.js`.
5. Client: page(s) under `client/src/features/<module>/`, service file, route in `App.jsx`, menu entry in `constants/services.js`, role info in `constants/roles.js` (and mirror capability changes).
6. Wire any automation trigger through `utils/firmAutomation.js` gates if relevant.
7. Add/adjust tests (`server/tests/*.test.js`, colocated `*.test.jsx` on the client).
8. Update `PROJECT_STATE.md` (build log) and the two docs.

## 10. Testing

- **Server:** `npm run test -w server` — Jest with `mongodb-memory-server`. `tests/setup.js` sets `MONGO_URI` in `process.env` **before** `config/env.js` is loaded (env is read once at import). So `app`/`db` must be `require()`-d lazily inside a test's `beforeAll`, never at the top of the file.
- **Client:** `npm run test -w client` — Vitest (jsdom), tests colocated `*.test.jsx`, jest-dom matchers via `src/setupTests.js`.

## 11. Known pitfalls & scope cuts

- `User.toSafeJSON()` returns `id`, not `_id` — build `<Select>` options as `u.id` (`PROJECT_STATE.md` "Round 2 — EDIT actions" documents a real bug here).
- `useApiData` `skip` is read in the effect deps — keep it there.
- Tab-close logout: never reintroduce localStorage session persistence or unconditional boot refresh.
- CSP is disabled to allow Cloudinary-hosted images; re-enable with an explicit allow-list for locked-down production.
- Scope cuts (by design): no PDF generation (browser `window.print()`), SMS/WhatsApp channels schema-ready but not wired, backup = JSON export, per-client/per-task document upload UI not yet wired (backend supports it).
- Server runs with `nodemon` in dev — port 5000 must be free (a stale background process will block it).

## 12. Deployment

- `docker-compose.yml` — mongo + server + nginx client (single host).
- `render.yaml` — Render.com blueprint (server + client static).
- Production build serves `client/dist` from the Express process itself (`app.js` SPA fallback), so a single-origin deploy needs no CORS.
- Secrets live in `server/.env` (not committed); `client/.env` holds only Vite-time `VITE_API_URL`/`VITE_CLIENT_URL`.