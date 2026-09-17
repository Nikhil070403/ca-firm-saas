/**
 * Knowledge base for the in-app Panel Assistant.
 *
 * Deliberately offline and self-contained — no API key, no backend call — so
 * the assistant always answers instantly and costs nothing to run. Each topic
 * is keyword-matched against what the user types; `chips` are the follow-up
 * suggestions rendered as quick-reply buttons.
 *
 * EVERYTHING here is role-aware:
 * - `audience` decides who can reach a topic at all: 'staff' (superadmin/
 *   admin/employee), 'admin' (admin + superadmin only), 'client' (the Client
 *   Portal), or 'all'.
 * - `answer` may be a plain string (same text for everyone who can see the
 *   topic) OR an object keyed by role — `{ superadmin, admin, employee,
 *   default }` — so the SAME question gets an answer describing what THIS
 *   user can actually do (an employee is told they submit expenses, an admin
 *   that they approve them).
 * - Greetings, starter chips and fallbacks are per-role too (see
 *   `greetingFor` / `startersFor` / `fallbackFor`).
 *
 * The legacy 'user' role is treated as 'employee' everywhere.
 */

// ---------------------------------------------------------------- matching

/** Strip punctuation/casing so "What's a lead?" matches the keyword "lead". */
export function normalizeQuery(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Best-matching topic for a question. Longer keyword phrases score higher, so
 * "client portal" beats a bare "client" — otherwise the most generic topic
 * would win almost every question.
 *
 * A phrase matches when all of its words appear anywhere in the question, not
 * only as an exact substring: "how do I approve an expense" has to reach the
 * "approve expense" topic even with a word in between. The substring pass is
 * kept as a fallback so partial words still count ("gst" inside "gstr1").
 */
export function matchTopic(query, topics) {
  const q = normalizeQuery(query);
  if (!q) return null;

  const asked = new Set(q.split(' '));

  let best = null;
  let bestScore = 0;

  topics.forEach((topic) => {
    const score = topic.keywords.reduce((total, keyword) => {
      const kw = normalizeQuery(keyword);
      if (!kw) return total;
      const words = kw.split(' ');
      const hit = words.every((word) => asked.has(word)) || q.includes(kw);
      return hit ? total + words.length : total;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  });

  return bestScore > 0 ? best : null;
}

// ------------------------------------------------------------- role helpers

/** Collapse the legacy 'user' alias so variants only deal in four roles. */
export function effectiveRole(user) {
  const role = user && user.role;
  if (role === 'user') return 'employee';
  return role || 'employee';
}

/** Topics the given user is allowed to be told about. */
export function topicsForUser(user) {
  const role = effectiveRole(user);
  const isClient = role === 'client';
  const isAdmin = role === 'admin' || role === 'superadmin';
  return ASSISTANT_KB.filter((topic) => {
    if (topic.audience === 'all') return true;
    if (topic.audience === 'client') return isClient;
    if (topic.audience === 'admin') return isAdmin;
    return !isClient; // 'staff'
  });
}

/** Resolve a topic's answer text for this user's role. */
export function answerFor(topic, user) {
  const answer = topic && topic.answer;
  if (typeof answer === 'string') return answer;
  if (!answer) return '';
  const role = effectiveRole(user);
  return answer[role] || answer.default || '';
}

// ------------------------------------------------------- per-role greetings

export function greetingFor(user) {
  const first = (user && user.name ? user.name.split(' ')[0] : '') || 'there';
  const role = effectiveRole(user);

  if (role === 'client') {
    return `Hi ${first}! I'm your Portal Assistant. I can explain anything you see here — your compliance filings, invoices, ledger, documents, projects and messages.\n\nPick a topic below or just ask me a question.`;
  }
  if (role === 'superadmin') {
    return `Hi ${first}! You're signed in as Super Admin — the platform owner. I can explain every module, plus the controls only you have: managing admins, roles, firm settings, automation and the audit trail.\n\nPick a topic below or just ask me a question.`;
  }
  if (role === 'admin') {
    return `Hi ${first}! You're signed in as Admin. I can explain every workspace plus your admin tools — team and departments, approvals, branding, automation and the activity log.\n\nPick a topic below or just ask me a question.`;
  }
  return `Hi ${first}! You're signed in as Employee. I can explain your day-to-day tools — your assigned clients and leads, tasks, ledgers, compliance and attendance. Some areas (team, firm settings) are admin-only, so I'll always tell you what applies to you.\n\nPick a topic below or just ask me a question.`;
}

/** Starter chips shown with the greeting — different per role. */
export function startersFor(user) {
  const role = effectiveRole(user);
  if (role === 'client') {
    return ['What can I do here?', 'My compliance', 'My invoices', 'My ledger', 'Message the firm'];
  }
  if (role === 'superadmin') {
    return ['What can this panel do?', 'Roles & permissions', 'Team management', 'Automation rules', 'Compliance tracking', 'Security'];
  }
  if (role === 'admin') {
    return ['What can this panel do?', 'CRM workspace', 'Team management', 'Invoices & billing', 'Automation rules', 'Compliance tracking'];
  }
  return ['What can I do here?', 'My assigned clients', 'Tasks & Kanban', 'Khata Book', 'Compliance tracking', 'My attendance'];
}

/** Fallback when nothing matches — lists only what THIS role can ask about. */
export function fallbackFor(user) {
  const role = effectiveRole(user);
  if (role === 'client') {
    return "I don't have an answer for that one yet. I can explain everything in your portal — your compliance filings, invoices, ledger statement, documents, projects and messaging with the firm.\n\nTry one of the topics below.";
  }
  if (role === 'employee') {
    return "I don't have an answer for that one yet. I can explain your assigned clients and leads, tasks and the Kanban board, ledgers and books, compliance tracking, documents, attendance, notifications and account security.\n\nTry one of the topics below, or rephrase your question.";
  }
  return "I don't have an answer for that one yet. I can explain the CRM, Khata Book and Accounts workspaces, compliance tracking, tasks, documents, billing, team management, automation, security, and how the Client Portal works.\n\nTry one of the topics below, or rephrase your question.";
}

// ------------------------------------------------------------------ topics

export const ASSISTANT_KB = [
  // ---------------------------------------------------------------- general
  {
    id: 'overview',
    audience: 'staff',
    keywords: ['what can this panel do', 'what can you do', 'what can i do', 'overview', 'features', 'functionality', 'help', 'everything', 'what is this', 'modules', 'guide', 'get started', 'how does this work'],
    answer: {
      employee:
        "Here's what the panel gives you as an Employee:\n\n• CRM — the clients and leads assigned to you: profiles, communication logs, follow-ups and compliance tracking\n• Tasks — the Kanban board with the firm's filing workflow\n• Khata Book — party ledgers and Tally-style books\n• Accounts — invoices, receipts and expenses, if your admin has granted you that workspace\n• Attendance — check in/out and see your own history\n\nTeam management and firm settings are admin-only, and you'll only ever see clients assigned to you.\n\nWhat would you like to explore?",
      default:
        "This panel runs your whole CA practice. It has three workspaces plus a portal for your clients:\n\n• CRM — leads, clients, tasks, reminders and compliance tracking\n• Khata Book — party ledgers and Tally-style books\n• Accounts — invoices, receipts, expenses, documents and firm admin\n• Client Portal — a read-only space where your clients see their own data\n\nBehind those, a compliance engine and automation rules run daily in the background.\n\nWhat would you like to explore?",
    },
    chips: ['CRM workspace', 'Khata Book', 'Compliance tracking', 'Tasks & Kanban', 'Roles & permissions'],
  },
  {
    id: 'navigation',
    audience: 'staff',
    keywords: ['navigate', 'navigation', 'switch workspace', 'launcher', 'sidebar', 'menu', 'move around', 'find things', 'shortcuts', 'search', 'quick create', 'theme', 'dark mode'],
    answer:
      "Getting around:\n\n• Service launcher — after login you pick a workspace (CRM / Khata / Accounts)\n• Workspace switcher — the grid icon in the top bar moves you between them\n• Quick Create (+) — start a new Lead, Client, Task, Reminder or Invoice from anywhere\n• Global search — press Ctrl+K to search clients, leads and invoices at once\n• Notifications — the bell shows recent alerts; 'View all' opens the full history\n• Theme — toggle light/dark from the top bar",
    chips: ['CRM workspace', 'Notifications'],
  },

  // -------------------------------------------------------------------- CRM
  {
    id: 'crm',
    audience: 'staff',
    keywords: ['crm', 'crm workspace', 'crm module', 'customer', 'crm dashboard', 'dashboard'],
    answer: {
      employee:
        "The CRM workspace is your day-to-day cockpit:\n\n• Dashboard — your snapshot: outstanding amounts, today's tasks, upcoming reminders and risk alerts\n• Leads — a pipeline from Fresh → Interested → Proposal Sent → Negotiation (you see the leads assigned to you)\n• Clients — full 360° profiles of your assigned clients\n• Tasks — a Kanban board following the CA filing workflow\n• Reminders, Compliance and Reports\n\nWhich part shall I explain?",
      default:
        "The CRM workspace is your day-to-day cockpit:\n\n• Dashboard — outstanding amount, active clients, today's tasks, upcoming reminders, a 6-month revenue chart and risk alerts\n• Leads — a pipeline from Fresh → Interested → Proposal Sent → Negotiation\n• Clients — full 360° profiles\n• Tasks — a Kanban board following the CA filing workflow\n• Reminders, Compliance and Reports\n\nWhich part shall I explain?",
    },
    chips: ['Leads & pipeline', 'My assigned clients', 'Tasks & Kanban', 'Compliance tracking'],
  },
  {
    id: 'leads',
    audience: 'staff',
    keywords: ['lead', 'leads', 'pipeline', 'prospect', 'follow up', 'followup', 'convert lead', 'funnel', 'enquiry', 'new business'],
    answer: {
      employee:
        "Leads track new business through four stages — Fresh, Interested, Proposal Sent and Negotiation — each with its own workboard and a live count badge. You work the leads assigned to you; leads owned by others don't appear.\n\nOn a lead you can record contact details, estimated value, source and activity. The Follow-ups page lists what's due so nothing is forgotten, and when you win one, Convert to Client turns it into a full client record in one step.",
      default:
        "Leads track new business through four stages — Fresh, Interested, Proposal Sent and Negotiation — each with its own workboard and a live count badge.\n\nOn a lead you can record contact details, estimated value, source and owner, and log activity. The Follow-ups page lists what's due so nothing is forgotten.\n\nWhen you win a lead, use Convert to Client to turn it into a full client record in one step.",
    },
    chips: ['My assigned clients', 'CRM workspace'],
  },
  {
    id: 'clients',
    audience: 'staff',
    keywords: ['client', 'clients', 'client profile', 'client 360', 'customer profile', 'add client', 'client detail', 'communication log', 'bulk', 'my clients', 'assigned clients', 'my assigned clients'],
    answer: {
      employee:
        "The client profile is a 360° view on one page: contacts, tags, live ledger balance, open tasks, documents, risk score, compliance settings and a full activity timeline.\n\nAs an Employee you only see the clients assigned to you — others don't appear anywhere in the panel; that's by design. On your clients you can:\n• Log communication — calls, emails, meetings, WhatsApp, notes\n• Message the client directly — the same thread they see in their portal\n• Set compliance details that drive the automated tracking\n• Bulk re-assign or export your visible clients to CSV",
      default:
        "The client profile is a 360° view on one page: contacts, tags, live ledger balance, open tasks, documents, risk score, compliance settings and a full activity timeline.\n\nYou also get:\n• Communication log — record calls, emails, meetings, WhatsApp and notes\n• Messages — a direct chat thread the client also sees in their portal\n• Compliance settings — GST frequency, ITR form, Audit/ROC/GSTR-9C flags that drive the automated tracking\n• Bulk actions — select many clients to re-assign them or export to CSV\n\nNote: employees only see the clients assigned to them; admins see all.",
    },
    chips: ['Compliance tracking', 'Client risk score', 'Client Portal'],
  },
  {
    id: 'tasks',
    audience: 'staff',
    keywords: ['task', 'tasks', 'kanban', 'board', 'workflow', 'assign work', 'checklist', 'template', 'templates', 'drag', 'tasks kanban'],
    answer: {
      employee:
        "Tasks follow a real CA filing workflow on a Kanban board:\n\nDocument Collection → Verification → Preparation → Review → Partner Approval → Filed → Completed\n\nDrag a card between columns to move the work along (there's a list view too). Inside a task you get checklists, comments, time logging, priority, due date and the linked client.\n\nYou can apply a task template (e.g. 'Monthly GST Filing') to a client to spin up a ready-made checklist task — defining new templates is admin-only.",
      default:
        "Tasks follow a real CA filing workflow on a Kanban board:\n\nDocument Collection → Verification → Preparation → Review → Partner Approval → Filed → Completed\n\nDrag a card between columns to move the work along (there's a list view too). Inside a task you get checklists, comments, time logging, priority, due date and the linked client.\n\nTask templates let you define a reusable checklist (e.g. 'Monthly GST Filing') that anyone can apply to a client to create a ready-made task.",
    },
    chips: ['Reminders', 'Compliance tracking', 'My attendance'],
  },
  {
    id: 'reminders',
    audience: 'staff',
    keywords: ['reminder', 'reminders', 'recurring', 'alert me', 'due date'],
    answer:
      "Reminders are your manual nudges — create one for anything, including recurring reminders that repeat on a schedule. They appear on the CRM dashboard under the next 7 days and raise a notification when due.\n\nStatutory deadlines are handled separately and automatically by the compliance engine.",
    chips: ['Compliance tracking', 'Automation rules'],
  },
  {
    id: 'attendance',
    audience: 'staff',
    keywords: ['attendance', 'my attendance', 'check in', 'check out', 'checkin', 'checkout', 'present', 'absent', 'roster', 'days present'],
    answer: {
      admin:
        "Your own attendance: open CRM → Attendance to check in when you start the day and check out when you're done; your monthly history is right there.\n\nAs an admin you also get Team Attendance under Accounts — a firm-wide daily roster showing who's in vs. absent, plus a days-present monthly summary per person.",
      superadmin:
        "Your own attendance: open CRM → Attendance to check in when you start the day and check out when you're done; your monthly history is right there.\n\nYou also get Team Attendance under Accounts — a firm-wide daily roster showing who's in vs. absent, plus a days-present monthly summary per person.",
      default:
        "Open CRM → Attendance to check in when you start the day and check out when you're done. Your own monthly history — including days present — is shown right there.\n\nThe firm-wide attendance roster is visible to admins.",
    },
    chips: ['Tasks & Kanban', 'CRM workspace'],
  },

  // ------------------------------------------------------------- compliance
  {
    id: 'compliance',
    audience: 'staff',
    keywords: ['compliance', 'gst', 'gstr', 'itr', 'return', 'returns', 'filing', 'statutory', 'audit', 'roc', 'calendar', 'tax'],
    answer:
      "Compliance is tracked automatically per client, based on the compliance settings on their profile.\n\n• GST returns — GSTR-1 and GSTR-3B trackers with overdue / pending / filed status, Mark Filed and tax-payable entry\n• Yearly filings — ITR, Audit, ROC and GSTR-9C per financial year\n• Calendar — a month grid with colour-coded dots: green filed, orange upcoming, red overdue. Click a day to see its filings.\n\nBuilt-in due dates: GSTR-1 on the 11th (13th quarterly), GSTR-3B on the 20th (24th), ITR 31 Jul, Audit 30 Sep, ROC 30 Nov, GSTR-9C 31 Dec.",
    chips: ['Compliance engine', 'Automation rules', 'My assigned clients'],
  },
  {
    id: 'compliance-engine',
    audience: 'staff',
    keywords: ['compliance engine', 'automatic', 'automatically', 'background', 'cron', 'job', 'auto generate', 'reminder window', 'how does compliance work'],
    answer:
      "The compliance engine runs daily in the background — nobody triggers it manually:\n\n1. It creates each period's returns for every client from their compliance profile\n2. It emails clients a reminder inside each return's window, and keeps reminding until the return is filed\n3. It sends one payment follow-up ten days after an unpaid invoice is issued\n4. Filing confirmations and tax-payable amounts are emailed to the client and logged in-app",
    chips: ['Automation rules', 'Compliance tracking'],
  },

  // -------------------------------------------------------------- khata book
  {
    id: 'khata',
    audience: 'staff',
    keywords: ['khata', 'khata book', 'ledger', 'ledgers', 'party', 'statement', 'balance', 'day book', 'daybook', 'cash book', 'bank book', 'tally', 'books', 'excel import', 'import'],
    answer:
      "Khata Book handles party ledgers and Tally-style books:\n\n• Party ledger — per-client debits, credits and a running balance; add entries and print a statement\n• Excel import — bulk-upload entries from a spreadsheet with per-row error reporting; balances recompute in the correct date order, even for back-dated rows\n• Books — Day Book, Cash Book and Bank Book (split automatically by payment mode), plus Sales and Expense registers, each with a date range, running balance, totals and print",
    chips: ['Invoices & billing', 'My assigned clients'],
  },

  // ---------------------------------------------------------------- accounts
  {
    id: 'accounts',
    audience: 'staff',
    keywords: ['accounts', 'accounts workspace', 'billing', 'invoice', 'invoices', 'receipt', 'receipts', 'expense', 'expenses', 'payment', 'money', 'financial report', 'invoices billing'],
    answer: {
      employee:
        "The Accounts workspace covers billing — you can use it if your admin has granted you that workspace (if it's missing from your launcher, it hasn't been granted):\n\n• Invoices — create GST-ready invoices and track paid / outstanding / overdue\n• Receipts — record payments received\n• Expenses — log by category and payment mode, then submit for approval; an admin approves or rejects\n• Financial reports — view income and expense reporting\n\nDeleting records and firm administration are admin-only.",
      default:
        "The Accounts workspace covers billing and firm administration:\n\n• Invoices — create GST-ready invoices and track paid / outstanding / overdue\n• Receipts — record payments received against invoices\n• Expenses — log by category and payment mode, with an approval step: staff submit, an admin approves or rejects with a reason\n• Financial reports — income and expense reporting\n• Documents — the firm's file library with version history and approvals\n\nClients never have access to Accounts.",
    },
    chips: ['Documents', 'Expense approval', 'Khata Book'],
  },
  {
    id: 'documents',
    audience: 'staff',
    keywords: ['document', 'documents', 'file', 'files', 'upload', 'version', 'versions', 'approval', 'approve document', 'dms', 'attachment'],
    answer: {
      employee:
        "Documents are stored in a firm-wide library:\n\n• Upload files against the firm or a client, and upload new versions — every previous version stays downloadable\n• Tick 'Submit for approval' when a file needs partner sign-off; it shows as Pending until an admin approves or rejects it (rejections can carry a reason)\n\nApprove / Reject buttons are admin-only — your part is uploading and submitting.",
      default:
        "Documents are stored in a firm-wide library:\n\n• Upload files against the firm or a client\n• Version history — every re-upload keeps the previous versions, and you can download any of them\n• Approval workflow — staff tick 'Submit for approval' when uploading; you'll see a Pending badge with Approve / Reject actions, and a rejection can carry a reason\n\nImportant: uploading a NEW version of an already-approved document resets it to Pending — approving v1 is not approving v2.",
    },
    chips: ['Expense approval', 'Invoices & billing'],
  },
  {
    id: 'expense-approval',
    audience: 'staff',
    keywords: ['expense approval', 'approve expense', 'reject expense', 'submit expense', 'expense workflow', 'sign off'],
    answer: {
      employee:
        "Log the expense (category, amount, payment mode) and submit it for approval. An admin then approves or rejects it — a rejection includes a reason so you know what to fix. The status shows as Pending, Approved or Rejected right in the expenses list.\n\nYou can't approve expenses yourself — that's deliberately admin-only.",
      default:
        "Expenses follow the same approval pattern as documents. Anyone with Accounts access can log an expense and submit it for approval; only an Admin or Super Admin can approve or reject it, and a rejection can include a reason so the submitter knows what to fix.\n\nThe status shows as Pending, Approved or Rejected right in the expenses list.",
    },
    chips: ['Documents', 'Invoices & billing'],
  },

  // ------------------------------------------------------------------- admin
  {
    id: 'team',
    audience: 'admin',
    keywords: ['team', 'team management', 'invite', 'add user', 'add employee', 'staff', 'member', 'user management', 'deactivate', 'remove user', 'department', 'departments'],
    answer: {
      superadmin:
        "Team management:\n\n• Invite members and set their role, workspaces and department\n• For a client login, link it to the client business record so their portal shows the right data\n• Activate, deactivate or remove accounts\n• Departments — group staff under a department head with live member counts\n\nAs Super Admin you have no ceiling: you can edit anyone — including other Admins — and assign any role, Admin and Super Admin included.",
      default:
        "Team management:\n\n• Invite members and set their role, workspaces and department\n• For a client login, link it to the client business record so their portal shows the right data\n• Activate, deactivate or remove accounts\n• Departments — group staff under a department head with live member counts\n\nAs an Admin you manage your employees and clients. Other Admins and the Super Admin are outside your reach, and you can assign only the Employee and Client roles.",
    },
    chips: ['Roles & permissions', 'Firm settings', 'Team attendance'],
  },
  {
    id: 'settings',
    audience: 'admin',
    keywords: ['settings', 'firm settings', 'branding', 'logo', 'colour', 'color', 'white label', 'configure', 'activity log', 'audit', 'export log'],
    answer:
      "Firm administration:\n\n• Firm settings — your firm's profile: name, GST, PAN and contact details\n• Branding — upload your logo and pick an accent colour; it applies across the whole panel and the client portal instantly\n• Automation rules — five toggles controlling the real background jobs\n• Activity log — a firm-wide audit trail of every action, exportable to CSV",
    chips: ['Automation rules', 'Team management', 'Security'],
  },
  {
    id: 'automation',
    audience: 'staff',
    // "turn off …" phrases live here rather than on the reminders topic: a
    // user asking to stop reminders wants the automation switches, not the
    // manual reminder screen.
    keywords: [
      'automation', 'automation rules', 'toggle', 'switch off', 'auto', 'rules',
      'turn off', 'turn off reminders', 'stop reminders', 'disable reminders',
      'gst reminders', 'switch off reminders', 'stop emailing',
    ],
    answer: {
      employee:
        "Five automations run in the background:\n\n1. GST reminders as GSTR deadlines approach\n2. Yearly filing reminders (ITR/Audit/ROC/GSTR-9C) from 30 days out\n3. A follow-up 10 days after an unpaid invoice\n4. An alert when a task is assigned to you\n5. An alert to a client's assigned executive on a new document upload\n\nThese switches live in Firm Settings, which is admin-only — if a reminder seems to have stopped (or you want one stopped), ask your admin.",
      default:
        "Automation Rules in Firm Settings control five real background behaviours — switching one off genuinely stops it:\n\n1. GST reminders — daily nudges as GSTR deadlines approach\n2. Yearly filing reminders — ITR/Audit/ROC/GSTR-9C from 30 days out\n3. Overdue invoice follow-ups — one reminder 10 days after an unpaid invoice\n4. Task assignment alerts — notify staff when a task is assigned to them\n5. Document upload alerts — notify a client's assigned executive on a new upload",
    },
    chips: ['Compliance engine', 'Notifications'],
  },
  {
    id: 'risk',
    audience: 'staff',
    keywords: ['risk', 'risk score', 'risk engine', 'high risk', 'client risk', 'score', 'client risk score'],
    answer:
      "Every client gets a risk score from 0–100, calculated from four signals: overdue compliance returns, overdue invoices, total outstanding amount and overdue tasks.\n\nThat maps to Low (under 30), Medium (30–59) or High (60+), shown as a badge on the client profile with a breakdown of exactly what drove it. High-risk clients also surface automatically in a Risk Alerts card on the CRM dashboard.",
    chips: ['My assigned clients', 'CRM workspace'],
  },

  // ------------------------------------------------------------------ roles
  {
    id: 'roles',
    audience: 'staff',
    keywords: ['role', 'roles', 'permission', 'permissions', 'access', 'who can', 'employee can', 'admin can', 'superadmin', 'hierarchy', 'scoping', 'roles permissions', 'what can an employee see'],
    answer: {
      superadmin:
        "Four roles, enforced on the server (not just hidden in the UI):\n\n• Super Admin — that's you: full access, and the only role that can edit other admins or assign any role\n• Admin (the CA) — full modules; manages their own employees and clients, never other admins\n• Employee — everyday work, no deletes, no settings, and only sees assigned clients and leads\n• Client — the Client Portal only: their own data, read-only, plus messaging\n\nPer employee, admins control two dials: which workspaces they can open, and which clients are assigned to them.",
      admin:
        "Four roles, enforced on the server (not just hidden in the UI):\n\n• Super Admin — the platform owner; can edit anyone, including admins\n• Admin — that's you: full use of every module, managing your own employees and clients (other admins are outside your reach)\n• Employee — everyday work, no deletes, no settings, and only sees the clients and leads you assign to them\n• Client — the Client Portal only: their own data, read-only, plus messaging\n\nFor each employee you control two dials: which workspaces they can open, and which clients are assigned to them.",
      default:
        "Four roles, enforced on the server (not just hidden in the UI):\n\n• Super Admin and Admin — run the firm: team, settings, approvals, deletes\n• Employee — that's you: full day-to-day work on the clients and leads assigned to you. You can create and edit, but not delete; team management and firm settings are admin-only\n• Client — your firm's customers see only their own data in the Client Portal\n\nIf you need access to another workspace or more clients, your admin controls both.",
    },
    chips: ['Security', 'Client Portal'],
  },

  // --------------------------------------------------------------- security
  {
    id: 'security',
    audience: 'all',
    keywords: ['security', '2fa', 'two factor', 'authenticator', 'password', 'session', 'sessions', 'device', 'devices', 'log out', 'logout', 'lockout', 'idle', 'backup code'],
    answer:
      "Your account security lives under My Profile:\n\n• Two-factor authentication — optional TOTP with any authenticator app, plus 8 one-time backup codes\n• Active sessions — see every signed-in device with browser, IP and sign-in time; sign out any one, or all others at once\n• Password — reset via 'Forgot password' on the login screen\n\nAlso running automatically: five wrong passwords locks an account for 15 minutes, closing the browser tab ends the session, and 30 minutes idle signs you out with a two-minute warning.",
    chips: ['Roles & permissions'],
  },
  {
    id: 'notifications',
    audience: 'staff',
    keywords: ['notification', 'notifications', 'bell', 'alerts', 'unread', 'notification center'],
    answer:
      "The bell in the top bar shows your latest alerts. 'View all notifications' opens the full Notification Center — a paginated history with filter chips for Unread, Reminders, Tasks, Compliance and Billing. Clicking a notification marks it read and jumps to the record it refers to, and you can Mark All Read in one go.",
    chips: ['Automation rules', 'Reminders'],
  },

  // ---------------------------------------------------- portal (staff view)
  {
    id: 'portal-staff',
    audience: 'staff',
    keywords: ['portal', 'client portal', 'what clients see', 'customer login', 'give client access', 'client login'],
    answer: {
      employee:
        "The Client Portal is a separate, deliberately simple space for the firm's customers. A client signs in and sees only their own data — overview, compliance filings, invoices, ledger, documents, project progress and a message thread with the firm. It's read-only apart from messaging.\n\nMessages a client sends land on their client profile, so if they're your assigned client, you'll pick them up there.\n\nSetting up portal access (creating the login and linking it to the client record) is done by an admin.",
      default:
        "The Client Portal is a separate, deliberately simple space for your customers. A client signs in and sees only their own data — overview, compliance filings, invoices, ledger statement, documents, project progress and a message thread with your firm. It's read-only apart from messaging.\n\nThey are hard-blocked from CRM, Khata Book and Accounts on the server, so they can never browse another client.\n\nTo set one up: invite the user with the Client role, then link their login to the client business record. Until that link exists, their portal shows 'not yet linked — contact your firm'.",
    },
    chips: ['Roles & permissions', 'My assigned clients'],
  },

  // -------------------------------------------------------- portal (client)
  {
    id: 'client-overview',
    audience: 'client',
    keywords: ['what can i do', 'overview', 'help', 'features', 'what is this', 'portal', 'everything', 'get started', 'how does this work', 'dashboard'],
    answer:
      "This is your client portal with your firm. Everything here is your own information:\n\n• Overview — your balance, pending filings, outstanding invoices and open projects\n• Compliance — every statutory filing your firm is handling for you\n• Invoices — what you've been billed and what's outstanding\n• Ledger — your full account statement\n• Documents — files your firm has shared\n• Projects — progress on the work being done for you\n• Messages — a direct line to your firm\n\nWhat would you like to see?",
    chips: ['My compliance', 'My invoices', 'My ledger', 'Message the firm'],
  },
  {
    id: 'client-compliance',
    audience: 'client',
    keywords: ['compliance', 'filing', 'filings', 'gst', 'gstr', 'itr', 'return', 'returns', 'audit', 'roc', 'due', 'deadline', 'tax', 'my compliance'],
    answer:
      "The Compliance page lists every statutory filing your firm is tracking for you — GST returns, income tax, audit and others — with the period, due date and current status.\n\n'Filed' means your firm has completed it (with the date). 'Pending' means it's still due. Your firm will email you reminders as deadlines approach, so you don't need to check here daily.",
    chips: ['My invoices', 'Message the firm'],
  },
  {
    id: 'client-invoices',
    audience: 'client',
    keywords: [
      'invoice', 'invoices', 'bill', 'bills', 'payment', 'pay', 'outstanding',
      'due amount', 'charges', 'fees', 'owe', 'how much do i owe', 'amount due',
      'unpaid', 'balance due', 'my invoices',
    ],
    answer:
      "The Invoices page shows every invoice your firm has raised to your account, with the issue date, due date, total, how much is paid and what's still outstanding.\n\nIf something doesn't look right, the quickest route is the Messages page — it goes straight to your firm.",
    chips: ['My ledger', 'Message the firm'],
  },
  {
    id: 'client-ledger',
    audience: 'client',
    keywords: ['ledger', 'statement', 'balance', 'account', 'transactions', 'credit', 'debit', 'print', 'my ledger'],
    answer:
      "The Ledger page is your full account statement with the firm — opening balance, every transaction (debits, credits and adjustments) with dates and descriptions, a running balance, and your closing balance.\n\nThere's a Print button if you need a copy for your records.",
    chips: ['My invoices', 'Message the firm'],
  },
  {
    id: 'client-documents',
    audience: 'client',
    keywords: ['document', 'documents', 'file', 'files', 'download', 'shared', 'attachment', 'upload'],
    answer:
      "The Documents page holds files your firm has shared with you — returns, reports, certificates and similar. You can view and download any of them.\n\nIf you need to send a document TO your firm, use the Messages page and they'll take it from there.",
    chips: ['Message the firm', 'My compliance'],
  },
  {
    id: 'client-projects',
    audience: 'client',
    keywords: ['project', 'projects', 'task', 'tasks', 'progress', 'work', 'status', 'what are you doing'],
    answer:
      "The Projects page shows the work your firm is currently doing for you, with its priority, current status and expected completion date. It's a simple way to check progress without having to ask.",
    chips: ['My compliance', 'Message the firm'],
  },
  {
    id: 'client-messages',
    audience: 'client',
    keywords: ['message', 'messages', 'chat', 'contact', 'talk', 'ask', 'reach', 'support', 'query', 'question for firm', 'message the firm'],
    answer:
      "The Messages page is a direct thread with your firm. Anything you send appears on your client record on their side, so whoever handles your account will see it and reply here.\n\nIt's the best place for questions about an invoice, a filing or a document.",
    chips: ['My invoices', 'My compliance'],
  },
];
