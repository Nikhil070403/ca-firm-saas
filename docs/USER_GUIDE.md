# User Guide — CA Firm SaaS Platform

What each role can see and do in the panel, split by role. The app has four login roles (plus one legacy alias).

## 0. Roles at a glance

| Role | Label in the UI | Who it is | Scope |
|---|---|---|---|
| `superadmin` | Super Admin | The panel owner ("me") | Sees & manages everything, including other admins |
| `admin` | Admin (CA) | The firm's owner / main CA | Full firm management of its employees & clients |
| `employee` | Employee | Firm staff (a CA, accountant, manager, …) | Day-to-day work, but only on clients assigned to them; no Accounts, no deletions, no settings |
| `user` | Employee | Legacy alias for pre-existing staff accounts | Same as employee (never offered when inviting) |
| `client` | Client | A firm customer | Only the client Portal — their own data, nothing else |

> **Access to the three workspaces (CRM / Khata Book / Accounts) is assigned per user** under **Accounts → Administration → Team → Edit → Services**. None of it applies to `client` (Portal only) or to admins (always all three).

---

## 1. Super Admin

Everything an Admin can do, **plus**:

- **Manage every account in the firm** — including other admins and fellow superadmins:
  - Invite (assign roles: Super Admin / Admin / Employee / Client)
  - Edit
  - Activate / deactivate
  - Delete
  - Reset another user's password (Team → Edit → "Set New Password")
- Bypasses all service assignment (always has CRM, Khata, Accounts).

---

## 2. Admin (CA)

### CRM service
- **Dashboard** — stat cards, client/lead counts, activity, revenue position.
- **Lead Management** — workboards per stage (All / Fresh / Interested / Proposal Sent / Negotiation); add, edit, move, convert leads to clients; follow-up logging; lead detail with full timeline.
- **Engagement**:
  - **Follow-ups** — upcoming/pending follow-ups from all leads.
  - **Tasks** — all firm tasks, Kanban board + list view, create/edit, assign to staff, checklists, comments.
  - **Task Templates** — define standard workflow templates and apply them to clients.
  - **My Attendance** — check in / check out, own month history.
  - **Reminders** — create/manage reminders (e.g. compliance, renewals), calendar view.
- **Clients** — the full client list, create/edit/delete clients, client profile with contacts, tags, risk score, tasks/documents, communication log, timeline.
- **Client Documents** — firm-wide document library.
- **Compliance** — GSTR-1, GSTR-3B and Yearly Filings tabs; generate current-period returns; mark returns filed; record tax payable (GSTR-3B) → emails the client; compliance calendar.
- **CRM Reports** — funnel/conversion-style CRM analytics.

### Khata Book service
- **Client Ledgers** — every client's ledger: add debit/credit entries, running balances, print view, Excel import.
- **Books** — Day Book, Cash Book, Bank Book, Sales Register, Expense Register (date-range filtered, totals, print).

### Accounts service (admin-only area of the panel)
- **Dashboard** — accounts/overdue overview.
- **Invoices** — create/edit invoices with line items, mark statuses, record payments, printable invoice.
- **Receipts** — record receipts (auto-updates invoice + ledger).
- **Expenses** — log expenses by category/payment mode; **approve or reject** expenses submitted for approval.
- **Financial Reports** — revenue, outstanding, client-wise, employee-wise, reminder-wise, GST; CSV export.
- **Documents** — firm document library with **approval workflow** (submit for approval, approve/reject with reason) and **version history**.
- **Administration (nested)**:
  - **Team** — invite/edit/deactivate/delete employees & clients; assign roles & services; set passwords.
  - **Departments** — create firm departments and assign staff.
  - **Team Attendance** — daily roster + monthly summary for the whole firm.
  - **Firm Settings** — firm profile, branding (logo + accent color), **automation rule toggles**, email templates.
  - **Activity Log** — audit trail of everything done in the panel (CSV exportable).

### Cross-service (any logged-in role)
- **Notifications** — bell + full Notification Center (mark read, filter, mark all read).
- **My Profile** (`/settings/profile`) — own name/phone, change password, 2FA setup, active sessions / "log out other devices".
- **Global Search** (Ctrl+K) — jump to clients, leads, invoices.
- **Help assistant** — floating chat widget (bottom-right) with role-aware answers, plus quick actions (add client/lead/task/reminder, mark filings filed, etc.).
- **Panel Assistant actions**: Admins also get *assign client*, *review document*, *review expense*, *add team member*.

> Admins **cannot** edit or create other admins/superadmins — only employees and clients (enforced server-side).

---

## 3. Employee

Same CRM/Khata surface as above, **with these limits**:

- **Data scope**: only sees **clients and leads assigned to them** — nothing else in the firm (a direct open of an unassigned record shows "not found").
- **Tasks**: sees tasks assigned to them; can work through stages/checklists/comments.
- **No Accounts service** at all (invoices/receipts/expenses/reports/documents/settings are hidden and blocked server-side).
- **No deletions**, no user/team management, no approvals (document/expense review is admin-only).
- **Attendance**: self-service check-in/check-out + own history (multi-day tracking).
- Quick-create: add lead, client, task, reminder, invoice (invoice only if Accounts is assigned — normally not).
- Panel Assistant: employee-scoped topics + create actions (add client/lead/task/reminder); no team/approval actions.

> If an employee needs Clients/Khata only (no CRM leads or no Khata), an admin can turn individual services on/off under **Team → Edit → Services** (defaults: CRM + Khata).

---

## 4. Client

Clients do **not** see the CRM/Khata/Accounts panel. After login they land directly in their own **Client Portal** (`/portal`), which only ever shows **their own** data (scoped server-side; requests for anything else return 403).

Portal sections:

- **Overview** — their summary at a glance.
- **Compliance** — their pending/filed statutory returns.
- **Invoices** — their invoices (view only).
- **Ledger** — their book entries with running balance.
- **Documents** — documents attached to their record.
- **Tasks** — tasks the firm has assigned to them.
- **Messages** — direct, two-way messaging thread with their assigned staff member.

> Clients have no action buttons for money/accounts, cannot see other clients, and are invite-only (no self-registration).

---

## 5. Shared behaviors

- **Login / security**: invite-only accounts; forgot/reset password (emailed); change password in My Profile; optional 2FA (TOTP app + single-use backup codes); session list with "log out other devices"; auto-logout after 30 min idle (2-min warning modal); logout on tab close (a fresh tab asks you to log in again, reload of an open tab keeps you in).
- **Every table page** supports server-side search, sorting, and pagination; bulk actions (assign + CSV export) on Clients and Leads pages.
- **Toasts** confirm every successful save/delete and surface every error.
- **Print** from any ledger/invoice page via your browser's print dialog (no PDF download).

---

## 6. Quick capability matrix

| Function | Super Admin | Admin (CA) | Employee | Client |
|---|---|---|---|---|
| Dashboard / leads / clients / tasks / reminders / compliance (CRM) | ✓ | ✓ | ✓ (assigned records only) | Portal only |
| Khata ledger + books | ✓ | ✓ | ✓ (assigned clients only) | Own ledger (view) |
| Invoices / receipts / expenses / reports | ✓ | ✓ | ✗ | Own invoices (view) |
| Document approval / expense approval | ✓ | ✓ | ✗ | ✗ |
| Team / departments / team attendance / firm settings / activity log | ✓ | ✓ | ✗ | ✗ |
| Manage & assign other users' roles | ✓ | employees/clients only | ✗ | ✗ |
| Delete records | ✓ | ✗ (has delete caps for staff; admins maintain full caps) | ✗ | ✗ |
| Client Portal | ✗ | ✗ | ✗ | ✓ own data |
| My profile / change password / 2FA / sessions | ✓ | ✓ | ✓ | ✓ |

> Admin delete note: `admin` and `superadmin` both carry the full capability set (includes deletes); employee does not. The matrix's "Delete records" row reflects that employees are blocked, admins/superadmins are allowed.