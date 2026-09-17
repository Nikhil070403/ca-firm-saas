# Architecture — CA Firm SaaS Platform (Phase 1)

> **Superseded stack note:** after this doc was written, the frontend/backend *language and libraries* were simplified to plain MERN (no TypeScript, no Redux/TanStack/Radix/Shadcn/Framer Motion/socket.io/recharts/Zod) and roles were reduced to `admin`/`user`. The module map, layering rules, API envelope, and DB reference graph below are still authoritative. For the current library/tooling truth, see **"STACK PIVOT"** in [`PROJECT_STATE.md`](../PROJECT_STATE.md) — that section wins on any conflict with §2, §4, and §7 below.

## 1. System Overview

A multi-tenant-ready (single-firm-per-deployment for v1) SaaS platform for Chartered Accountant firms, unifying CRM, client management, ledger/khata book, compliance reminders, task management, document storage, billing, and reporting into one product.

```
                        ┌─────────────────────────────┐
                        │        NGINX (reverse proxy) │
                        │  TLS termination, gzip, cache │
                        └───────────────┬───────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
        ┌────────▼────────┐    ┌─────────▼─────────┐   ┌─────────▼─────────┐
        │  client (Vite    │    │  server (Express)  │   │  Cloudinary (docs, │
        │  static build)   │    │  REST API + Sockets │   │  avatars)          │
        └──────────────────┘    └─────────┬──────────┘   └────────────────────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       │                   │                   │
              ┌────────▼───────┐  ┌────────▼────────┐  ┌───────▼────────┐
              │ MongoDB Atlas   │  │  node-cron jobs  │  │  Nodemailer /   │
              │ (primary store) │  │ (reminders, dunning)│ │  SMTP provider │
              └─────────────────┘  └──────────────────┘  └────────────────┘
```

## 2. Tech Stack Rationale

| Layer | Choice | Why |
|---|---|---|
| Frontend build | Vite + React 19 + TS | Fast HMR, native ESM, React 19 concurrent features for large tables/dashboards |
| Client state | Redux Toolkit + Redux Persist | Predictable global UI state (auth, theme, sidebar) that must survive reloads |
| Server cache/state | TanStack Query | Server data (clients, tasks, invoices) is cache-first, revalidated — keeps Redux free of duplicated server state |
| Forms | React Hook Form + Zod | Uncontrolled perf at scale (bulk forms: ledger entries, invoices) + shared validation schemas with backend via mirrored Zod/Mongoose rules |
| UI | Tailwind + Shadcn UI + Lucide + Framer Motion | Accessible primitives (Radix under Shadcn) instead of hand-rolled components; motion reserved for state transitions, not decoration |
| Backend | Express + TS | Team-familiar, minimal, unopinionated enough to enforce our own layering |
| DB | MongoDB + Mongoose | Document model fits variable client/document metadata; Atlas gives managed scaling/backup |
| Auth | JWT access (15 min) + refresh token (7d, httpOnly cookie, rotated) | Stateless access checks, revocable refresh via DB-stored token hash |
| Jobs | node-cron | In-process scheduling for reminder digests, recurring reminder generation, token cleanup — no external queue needed at this scale |
| File storage | Cloudinary | Offloads document/image storage + transformation from the app server |
| Deployment | Docker Compose + NGINX | Single-host reproducible deploy; NGINX serves the client build and proxies `/api` and `/socket.io` to the server container |

## 3. High-Level Module Map

Every module below is a **feature slice** on both sides of the stack — a backend `features/<module>` set of layers and a frontend `features/<module>` set of components/hooks/services. Modules communicate only through defined service-layer calls or events, never by reaching into each other's models directly (e.g. Billing reads Client via `clientService.getById`, not `Client.findById` inline).

1. **Auth & RBAC** — cross-cutting, consumed by all modules via middleware.
2. **Dashboard** — read-only aggregator; queries other modules' services, owns no collections itself.
3. **CRM** — Leads, Pipeline stages, Follow-ups, Meetings/Calls/Email logs, Conversion → creates a Client.
4. **Client Management** — Client profile, contacts, addresses, documents (delegates file storage to Document module), timeline (event log).
5. **Khata Book** — Ledger entries scoped to a Client, running balance computed at write time (not on read) for performance.
6. **Reminder System** — Compliance calendar, recurrence engine, notification dispatch (email now; SMS/WhatsApp adapters stubbed behind a common `NotificationChannel` interface).
7. **Task Management** — Tasks assignable to users, optionally linked to a Client/Reminder, checklist + comments + attachments.
8. **Billing** — Invoices, Receipts, Expenses, Payment tracking; reads Client + optionally Task (for time-based billing) via service calls.
9. **Document Management** — Central file registry (Cloudinary refs), folders, versioning, tags; other modules attach documents by reference (`documentId`), not by owning their own upload logic.
10. **Reports** — Query layer over other modules' repositories (read-only), export pipeline (Excel/CSV/PDF).
11. **Settings** — Firm profile, roles/permissions matrix, email templates, notification prefs, backup trigger.

## 4. Auth & RBAC Model

- Roles: `admin`, `partner`, `ca`, `manager`, `employee`, `accountant`, `viewer` — stored as an enum on `User`, not a separate collection in v1 (a `permissions` override map is reserved on the schema for future per-user overrides).
- Permission checks are **capability-based**, not role-name-based in code: middleware checks `can(user, 'client:delete')`, and a static `roleCapabilities` map resolves role → capabilities. This means adding a role or changing what a role can do never touches route code.
- JWT access token: short-lived, carries `{ userId, role, firmId }`. Refresh token: opaque random value, stored server-side as a bcrypt hash on the `RefreshToken` collection with `userId`, `expiresAt`, `revokedAt`, `replacedBy` — enables rotation-on-use and detects reuse (token-theft signal → revoke whole family).
- Password reset / email verification use short-lived signed tokens (JWT with a dedicated purpose claim), single-use, invalidated after use.

## 5. Data Ownership & Cross-Module References

To avoid a tangled schema, the rule is: **a document stores an ObjectId reference to another module's entity, never a denormalized copy of mutable fields**, except for fields explicitly needed for historical accuracy (e.g. an Invoice line item snapshots the service description/rate at time of billing, because a later price change must not retroactively change old invoices).

Core reference graph:

```
Firm ── has many ──> User
User ── assigned ──> Task, Reminder, Lead
Lead ── converts to ──> Client (Lead keeps a clientId after conversion)
Client ── has many ──> LedgerEntry, Invoice, Document, Task, Reminder, ContactPerson
Invoice ── has many ──> InvoiceLineItem (embedded, snapshot data)
Invoice ── has many ──> Receipt (payment against invoice)
Reminder ── generates ──> Notification (per channel, per occurrence)
Document ── belongs to ──> Client | Task | Invoice (polymorphic via ownerType/ownerId, indexed)
```

## 6. API Conventions (apply to every endpoint, all phases)

- Response envelope:
  ```ts
  interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    meta?: { page: number; limit: number; total: number; totalPages: number };
    error?: { code: string; details?: unknown };
  }
  ```
- Every list route: `GET /api/v1/<resource>?page=&limit=&sort=&search=&<field>=` handled by one shared `parseQuery` middleware + repository-level `paginate()` helper — implemented once, reused everywhere.
- Errors flow through a single `AppError` class + global error-handling middleware; controllers never `try/catch` business logic themselves — they're wrapped by an `asyncHandler`.
- All mutating routes are validated by a Zod schema in a `validators/` file, applied via a `validate(schema)` middleware before the controller runs.
- Versioned under `/api/v1` from day one.

## 7. Real-Time & Background Work

- Socket.io namespace for live notification delivery (task assigned, reminder due, comment added) — falls back silently to poll-on-load if the socket isn't connected.
- `node-cron` jobs (defined in `jobs/`):
  - Recurring reminder generator (daily, generates next occurrence per recurrence rule).
  - Reminder digest dispatcher (checks due/overdue reminders, sends via `NotificationChannel`).
  - Refresh-token cleanup (purges expired/revoked tokens).
  - Overdue invoice flagging (marks invoices past due date as `outstanding`).

## 8. Multi-Tenancy Stance (v1 decision)

Every collection carries a `firmId`. All repository queries are firm-scoped by default (enforced by a repository base class, not left to each query author to remember). This keeps the door open for true multi-tenant SaaS later without a schema migration, while v1 ships as effectively single-firm per deployment.

## 9. What's Explicitly Deferred

- SMS/WhatsApp sending — interfaces defined (`NotificationChannel`), no live provider wired (per the original spec: "SMS Ready", "WhatsApp Ready").
- Swagger docs — annotated inline via JSDoc in Phase 4/8, generated doc site is a Phase 9 deliverable, not maintained by hand.
- True horizontal multi-tenant billing/isolation (connection-per-tenant, etc.) — out of scope for v1.

---
**Next phase (2):** concrete folder structure for `client/` and `server/`, down to placeholder files per feature module, following the module map above.
