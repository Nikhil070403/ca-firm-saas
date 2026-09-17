import { userApi } from '../features/settings/services/settings.service';
import { clientApi } from '../features/clients/services/client.service';
import { leadApi } from '../features/crm/services/lead.service';
import { taskApi } from '../features/tasks/services/task.service';
import { reminderApi } from '../features/reminders/services/reminder.service';
import { complianceApi, RETURN_TYPE_LABELS } from '../features/crm/services/compliance.service';
import { documentApi } from '../features/documents/services/document.service';
import { invoiceApi, expenseApi } from '../features/billing/services/billing.service';
import { effectiveRole } from './assistantKnowledge';

/**
 * Actions the Panel Assistant can actually PERFORM, so a user never has to
 * leave the chat to get something done.
 *
 * Two hard rules, both mirrored by the server (this list is UX, never the
 * security boundary — every call below hits the same guarded endpoint the
 * normal screens use, so a tampered client still gets a 403):
 *
 * 1. `roles` gates who may even see/run the action. An employee is not
 *    offered "Add team member" because `POST /users` would reject them.
 * 2. Anything with side effects collects its fields first and then asks for
 *    an explicit Confirm — the assistant never creates a record off a single
 *    ambiguous sentence.
 *
 * `fields` drive a small generated form inside the chat. `run(values)` does
 * the work and returns a short success line; `resultPath` (optional) offers a
 * "View it" link afterwards.
 */

export const ALL_STAFF = ['superadmin', 'admin', 'employee'];
export const ADMINS = ['superadmin', 'admin'];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/**
 * Lookup helpers for `type: 'lookup'` fields — they populate a dropdown with
 * REAL records so an edit action always targets something that exists.
 *
 * Filtering happens client-side after a bounded fetch: the list endpoints
 * don't all expose the filter we need (e.g. /documents has no
 * approvalStatus filter), and doing it here keeps every lookup consistent
 * instead of half server-filtered and half not. Results are naturally scoped
 * by the server — an employee's fetch only returns their assigned records.
 */
const LOOKUP_LIMIT = 100;

const rowsOf = (res) => (res && Array.isArray(res.data) ? res.data : []);
const clientNameOf = (row) => (row.clientId && row.clientId.displayName) || (row.client && row.client.displayName) || '';

async function loadPendingCompliance() {
  const rows = rowsOf(await complianceApi.list({ limit: LOOKUP_LIMIT }));
  return rows
    .filter((r) => r.status !== 'filed')
    .map((r) => ({
      value: r._id,
      label: `${RETURN_TYPE_LABELS[r.returnType] || r.returnType} · ${r.periodLabel || r.periodKey}${clientNameOf(r) ? ` · ${clientNameOf(r)}` : ''}`,
    }));
}

async function loadClients() {
  const rows = rowsOf(await clientApi.list({ limit: LOOKUP_LIMIT, sort: 'displayName' }));
  return rows.map((c) => ({ value: c._id, label: c.displayName }));
}

async function loadAssignableStaff() {
  const rows = rowsOf(await userApi.list({ limit: LOOKUP_LIMIT }));
  return rows
    .filter((u) => u.role !== 'client' && u.isActive !== false)
    .map((u) => ({ value: u.id || u._id, label: `${u.name} (${u.role})` }));
}

async function loadOpenTasks() {
  const rows = rowsOf(await taskApi.list({ limit: LOOKUP_LIMIT }));
  return rows
    .filter((t) => t.status !== 'done')
    .map((t) => ({ value: t._id, label: `${t.title}${clientNameOf(t) ? ` · ${clientNameOf(t)}` : ''}` }));
}

async function loadPendingReminders() {
  const rows = rowsOf(await reminderApi.list({ limit: LOOKUP_LIMIT }));
  return rows
    .filter((r) => r.status !== 'completed' && r.status !== 'dismissed')
    .map((r) => ({ value: r._id, label: r.title }));
}

async function loadPendingDocuments() {
  const rows = rowsOf(await documentApi.list({ limit: LOOKUP_LIMIT }));
  return rows
    .filter((d) => d.approvalStatus === 'pending')
    .map((d) => ({ value: d._id, label: d.name }));
}

async function loadPendingExpenses() {
  const rows = rowsOf(await expenseApi.list({ limit: LOOKUP_LIMIT }));
  return rows
    .filter((e) => e.approvalStatus === 'pending')
    .map((e) => ({ value: e._id, label: `${e.title || e.category} · ₹${e.amount}` }));
}

async function loadUnpaidInvoices() {
  const rows = rowsOf(await invoiceApi.list({ limit: LOOKUP_LIMIT }));
  return rows
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .map((i) => ({ value: i._id, label: `${i.invoiceNumber || 'Invoice'} · ₹${i.total ?? i.amount ?? 0}${clientNameOf(i) ? ` · ${clientNameOf(i)}` : ''}` }));
}

const DECISION_OPTIONS = [
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
];

export const ASSISTANT_ACTIONS = [
  // ------------------------------------------------------------ team member
  {
    id: 'add-user',
    label: 'Add team member',
    roles: ADMINS,
    keywords: ['add user', 'new user', 'create user', 'add member', 'add team member', 'invite', 'invite user', 'add employee', 'new employee', 'add staff', 'onboard', 'add client login', 'create account'],
    intro: "I can invite a team member. They'll get an email to set their own password.",
    // Role choices are narrowed per actor at runtime (see roleOptionsFor).
    fields: [
      { name: 'name', label: 'Full name', required: true, placeholder: 'e.g. Priya Sharma' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@firm.com' },
      { name: 'role', label: 'Role', type: 'select', required: true, dynamic: 'assignableRoles' },
      { name: 'phone', label: 'Phone', placeholder: 'Optional' },
    ],
    confirmLabel: 'Send invite',
    async run(values) {
      const user = await userApi.create({
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        phone: values.phone?.trim() || undefined,
      });
      return {
        message: `Invited ${user.name} (${user.email}) as ${values.role}. They'll receive an email to set their password.`,
        path: '/accounts/team',
        pathLabel: 'Open Team',
      };
    },
  },

  // ----------------------------------------------------------------- client
  {
    id: 'add-client',
    label: 'Add client',
    roles: ALL_STAFF,
    keywords: ['add client', 'new client', 'create client', 'register client', 'onboard client', 'add a client'],
    intro: 'I can create a client record. Only the name is required — you can fill in the rest later on their profile.',
    fields: [
      { name: 'displayName', label: 'Client name', required: true, placeholder: 'e.g. Sharma Traders' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional' },
      { name: 'phone', label: 'Phone', placeholder: 'Optional' },
      { name: 'gstNumber', label: 'GST number', placeholder: 'Optional' },
    ],
    confirmLabel: 'Create client',
    async run(values) {
      const client = await clientApi.create({
        displayName: values.displayName.trim(),
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        gstNumber: values.gstNumber?.trim() || undefined,
      });
      return {
        message: `Created client "${client.displayName}".`,
        path: `/crm/clients/${client._id}`,
        pathLabel: 'Open client',
      };
    },
  },

  // ------------------------------------------------------------------- lead
  {
    id: 'add-lead',
    label: 'Add lead',
    roles: ALL_STAFF,
    keywords: ['add lead', 'new lead', 'create lead', 'add prospect', 'new enquiry', 'add enquiry', 'log a lead'],
    intro: 'I can add a lead to your pipeline. It starts in the Fresh stage.',
    fields: [
      { name: 'name', label: 'Lead name', required: true, placeholder: 'e.g. Anil Mehta' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional' },
      { name: 'phone', label: 'Phone', placeholder: 'Optional' },
      {
        name: 'source',
        label: 'Source',
        type: 'select',
        options: [
          { value: '', label: 'Not specified' },
          { value: 'referral', label: 'Referral' },
          { value: 'website', label: 'Website' },
          { value: 'social_media', label: 'Social media' },
          { value: 'walk_in', label: 'Walk-in' },
          { value: 'cold_call', label: 'Cold call' },
          { value: 'advertisement', label: 'Advertisement' },
          { value: 'other', label: 'Other' },
        ],
      },
    ],
    confirmLabel: 'Create lead',
    async run(values) {
      const lead = await leadApi.create({
        name: values.name.trim(),
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        source: values.source || undefined,
      });
      return {
        message: `Added lead "${lead.name}" to the pipeline.`,
        path: `/crm/leads/${lead._id}`,
        pathLabel: 'Open lead',
      };
    },
  },

  // ------------------------------------------------------------------- task
  {
    id: 'add-task',
    label: 'Create task',
    roles: ALL_STAFF,
    keywords: ['add task', 'new task', 'create task', 'assign task', 'add a task', 'make a task', 'todo'],
    intro: 'I can create a task on the board. It starts in Document Collection.',
    fields: [
      { name: 'title', label: 'Task title', required: true, placeholder: 'e.g. File GSTR-3B for June' },
      { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY_OPTIONS, defaultValue: 'medium' },
      { name: 'dueDate', label: 'Due date', type: 'date' },
      { name: 'description', label: 'Notes', type: 'textarea', placeholder: 'Optional' },
    ],
    confirmLabel: 'Create task',
    async run(values) {
      const task = await taskApi.create({
        title: values.title.trim(),
        priority: values.priority || 'medium',
        dueDate: values.dueDate || undefined,
        description: values.description?.trim() || undefined,
      });
      return {
        message: `Created task "${task.title}".`,
        path: `/crm/tasks/${task._id}`,
        pathLabel: 'Open task',
      };
    },
  },

  // --------------------------------------------------------------- reminder
  {
    id: 'add-reminder',
    label: 'Set reminder',
    roles: ALL_STAFF,
    keywords: ['add reminder', 'new reminder', 'set reminder', 'remind me', 'create reminder', 'schedule reminder'],
    intro: 'I can set a reminder for you.',
    fields: [
      { name: 'title', label: 'Remind me to', required: true, placeholder: 'e.g. Call Sharma Traders' },
      { name: 'dueDate', label: 'When', type: 'date', required: true },
      { name: 'description', label: 'Notes', type: 'textarea', placeholder: 'Optional' },
    ],
    confirmLabel: 'Set reminder',
    async run(values) {
      await reminderApi.create({
        title: values.title.trim(),
        dueDate: values.dueDate,
        description: values.description?.trim() || undefined,
      });
      return {
        message: `Reminder set: "${values.title.trim()}".`,
        path: '/crm/reminders',
        pathLabel: 'Open reminders',
      };
    },
  },
  // ==================================================================
  // EDIT ACTIONS — each targets an existing record chosen from a lookup
  // ==================================================================

  {
    id: 'mark-filed',
    label: 'Mark a filing as filed',
    roles: ALL_STAFF,
    keywords: ['mark filed', 'mark as filed', 'file return', 'filed gstr', 'mark gstr', 'return filed', 'mark compliance', 'completed filing', 'submit return', 'mark itr'],
    intro: 'Which filing should I mark as filed? The client is notified automatically.',
    fields: [
      {
        name: 'returnId',
        label: 'Pending filing',
        type: 'lookup',
        required: true,
        loadOptions: loadPendingCompliance,
        emptyText: 'Nothing is pending — everything is already filed.',
      },
    ],
    confirmLabel: 'Mark filed',
    async run(values, ctx) {
      await complianceApi.markFiled(values.returnId);
      return {
        message: `Marked "${ctx.labelOf('returnId')}" as filed. The client has been notified.`,
        path: '/crm/compliance/gstr1',
        pathLabel: 'Open compliance',
      };
    },
  },

  {
    id: 'assign-client',
    label: 'Assign a client',
    roles: ADMINS,
    keywords: ['assign client', 'reassign client', 'change owner', 'assign to', 'give client to', 'transfer client', 'allocate client'],
    intro: 'I can reassign a client to a team member.',
    fields: [
      { name: 'clientId', label: 'Client', type: 'lookup', required: true, loadOptions: loadClients, emptyText: 'No clients yet.' },
      { name: 'assignedTo', label: 'Assign to', type: 'lookup', required: true, loadOptions: loadAssignableStaff, emptyText: 'No staff accounts found.' },
    ],
    confirmLabel: 'Assign',
    async run(values, ctx) {
      await clientApi.update(values.clientId, { assignedTo: values.assignedTo });
      return {
        message: `Assigned ${ctx.labelOf('clientId')} to ${ctx.labelOf('assignedTo')}.`,
        path: `/crm/clients/${values.clientId}`,
        pathLabel: 'Open client',
      };
    },
  },

  {
    id: 'complete-task',
    label: 'Complete a task',
    roles: ALL_STAFF,
    keywords: ['complete task', 'finish task', 'mark task done', 'task done', 'close task', 'mark done'],
    intro: 'Which task is done?',
    fields: [
      { name: 'taskId', label: 'Open task', type: 'lookup', required: true, loadOptions: loadOpenTasks, emptyText: 'No open tasks — you are all caught up.' },
    ],
    confirmLabel: 'Mark done',
    async run(values, ctx) {
      await taskApi.update(values.taskId, { status: 'done', stage: 'completed' });
      return {
        message: `Marked "${ctx.labelOf('taskId')}" as done.`,
        path: '/crm/tasks',
        pathLabel: 'Open board',
      };
    },
  },

  {
    id: 'complete-reminder',
    label: 'Complete a reminder',
    roles: ALL_STAFF,
    keywords: ['complete reminder', 'reminder done', 'dismiss reminder', 'mark reminder', 'finish reminder'],
    intro: 'Which reminder should I close?',
    fields: [
      { name: 'reminderId', label: 'Pending reminder', type: 'lookup', required: true, loadOptions: loadPendingReminders, emptyText: 'No pending reminders.' },
    ],
    confirmLabel: 'Complete',
    async run(values, ctx) {
      await reminderApi.complete(values.reminderId);
      return {
        message: `Completed reminder "${ctx.labelOf('reminderId')}".`,
        path: '/crm/reminders',
        pathLabel: 'Open reminders',
      };
    },
  },

  {
    id: 'review-document',
    label: 'Approve / reject a document',
    roles: ADMINS,
    keywords: ['approve document', 'reject document', 'review document', 'sign off document', 'approve file', 'document approval'],
    intro: 'I can approve or reject a document awaiting review.',
    fields: [
      { name: 'documentId', label: 'Awaiting approval', type: 'lookup', required: true, loadOptions: loadPendingDocuments, emptyText: 'No documents are awaiting approval.' },
      { name: 'decision', label: 'Decision', type: 'select', options: DECISION_OPTIONS, defaultValue: 'approved' },
      { name: 'reason', label: 'Reason (if rejecting)', type: 'textarea', placeholder: 'Optional — helps the uploader fix it' },
    ],
    confirmLabel: 'Submit review',
    async run(values, ctx) {
      await documentApi.review(values.documentId, values.decision, values.reason?.trim() || undefined);
      return {
        message: `Document "${ctx.labelOf('documentId')}" ${values.decision}. The uploader has been notified.`,
        path: '/accounts/documents',
        pathLabel: 'Open documents',
      };
    },
  },

  {
    id: 'review-expense',
    label: 'Approve / reject an expense',
    roles: ADMINS,
    keywords: ['approve expense', 'reject expense', 'review expense', 'expense approval', 'sign off expense'],
    intro: 'I can approve or reject an expense awaiting review.',
    fields: [
      { name: 'expenseId', label: 'Awaiting approval', type: 'lookup', required: true, loadOptions: loadPendingExpenses, emptyText: 'No expenses are awaiting approval.' },
      { name: 'decision', label: 'Decision', type: 'select', options: DECISION_OPTIONS, defaultValue: 'approved' },
      { name: 'reason', label: 'Reason (if rejecting)', type: 'textarea', placeholder: 'Optional' },
    ],
    confirmLabel: 'Submit review',
    async run(values, ctx) {
      await expenseApi.review(values.expenseId, values.decision, values.reason?.trim() || undefined);
      return {
        message: `Expense "${ctx.labelOf('expenseId')}" ${values.decision}.`,
        path: '/accounts/expenses',
        pathLabel: 'Open expenses',
      };
    },
  },

  {
    id: 'mark-invoice-paid',
    label: 'Mark an invoice paid',
    roles: ALL_STAFF,
    keywords: ['mark invoice paid', 'invoice paid', 'mark paid', 'payment received', 'settle invoice', 'close invoice'],
    intro: 'Which invoice has been paid in full?',
    fields: [
      { name: 'invoiceId', label: 'Unpaid invoice', type: 'lookup', required: true, loadOptions: loadUnpaidInvoices, emptyText: 'No unpaid invoices.' },
    ],
    confirmLabel: 'Mark paid',
    async run(values, ctx) {
      await invoiceApi.updateStatus(values.invoiceId, 'paid');
      return {
        message: `Marked ${ctx.labelOf('invoiceId')} as paid.`,
        path: `/accounts/invoices/${values.invoiceId}`,
        pathLabel: 'Open invoice',
      };
    },
  },
];

/**
 * Navigation targets. Pure movement — no side effects — so these need no
 * confirmation step, only the same role/route gating the sidebar uses.
 */
export const ASSISTANT_DESTINATIONS = [
  { label: 'CRM dashboard', path: '/crm/dashboard', roles: ALL_STAFF, keywords: ['crm dashboard', 'open crm', 'go to crm', 'dashboard'] },
  { label: 'Clients', path: '/crm/clients', roles: ALL_STAFF, keywords: ['open clients', 'go to clients', 'client list', 'show clients', 'my clients'] },
  { label: 'Leads', path: '/crm/leads/status/all', roles: ALL_STAFF, keywords: ['open leads', 'go to leads', 'lead list', 'show leads', 'pipeline'] },
  { label: 'Task board', path: '/crm/tasks', roles: ALL_STAFF, keywords: ['open tasks', 'go to tasks', 'task board', 'kanban', 'show tasks'] },
  { label: 'Reminders', path: '/crm/reminders', roles: ALL_STAFF, keywords: ['open reminders', 'go to reminders', 'show reminders'] },
  { label: 'Compliance calendar', path: '/crm/compliance-calendar', roles: ALL_STAFF, keywords: ['compliance calendar', 'open calendar', 'go to calendar'] },
  { label: 'GST returns', path: '/crm/compliance/gstr1', roles: ALL_STAFF, keywords: ['open compliance', 'gst returns', 'go to compliance', 'gstr'] },
  { label: 'Khata Book', path: '/khata', roles: ALL_STAFF, keywords: ['open khata', 'go to khata', 'khata book', 'ledgers', 'open ledger'] },
  { label: 'Invoices', path: '/accounts/invoices', roles: ALL_STAFF, keywords: ['open invoices', 'go to invoices', 'show invoices', 'billing'] },
  { label: 'Expenses', path: '/accounts/expenses', roles: ALL_STAFF, keywords: ['open expenses', 'go to expenses', 'show expenses'] },
  { label: 'Documents', path: '/accounts/documents', roles: ALL_STAFF, keywords: ['open documents', 'go to documents', 'document library', 'files'] },
  { label: 'My attendance', path: '/crm/attendance', roles: ALL_STAFF, keywords: ['attendance', 'check in', 'check out', 'my attendance'] },
  { label: 'Notifications', path: '/notifications', roles: ALL_STAFF, keywords: ['notifications', 'open notifications', 'alerts'] },
  { label: 'My profile', path: '/settings/profile', roles: [...ALL_STAFF, 'client'], keywords: ['my profile', 'profile', 'change password', 'account settings', 'security settings', '2fa'] },
  // Admin-only areas
  { label: 'Team', path: '/accounts/team', roles: ADMINS, keywords: ['open team', 'go to team', 'team page', 'manage team', 'team members'] },
  { label: 'Departments', path: '/accounts/departments', roles: ADMINS, keywords: ['departments', 'open departments'] },
  { label: 'Team attendance', path: '/accounts/attendance', roles: ADMINS, keywords: ['team attendance', 'staff attendance', 'roster'] },
  { label: 'Firm settings', path: '/accounts/settings', roles: ADMINS, keywords: ['firm settings', 'open settings', 'branding', 'automation rules'] },
  { label: 'Activity log', path: '/accounts/activity', roles: ADMINS, keywords: ['activity log', 'audit log', 'open activity'] },
  // Client portal
  { label: 'Overview', path: '/portal', roles: ['client'], keywords: ['overview', 'home', 'dashboard'] },
  { label: 'My compliance', path: '/portal/compliance', roles: ['client'], keywords: ['my compliance', 'my filings', 'open compliance'] },
  { label: 'My invoices', path: '/portal/invoices', roles: ['client'], keywords: ['my invoices', 'open invoices', 'my bills'] },
  { label: 'My ledger', path: '/portal/ledger', roles: ['client'], keywords: ['my ledger', 'my statement', 'open ledger'] },
  { label: 'My documents', path: '/portal/documents', roles: ['client'], keywords: ['my documents', 'open documents', 'my files'] },
  { label: 'My projects', path: '/portal/tasks', roles: ['client'], keywords: ['my projects', 'open projects', 'progress'] },
  { label: 'Messages', path: '/portal/messages', roles: ['client'], keywords: ['messages', 'message the firm', 'contact firm', 'open messages'] },
];

/** Actions this user is permitted to run. */
export function actionsForUser(user) {
  const role = effectiveRole(user);
  return ASSISTANT_ACTIONS.filter((a) => a.roles.includes(role));
}

/** Destinations this user is permitted to open. */
export function destinationsForUser(user) {
  const role = effectiveRole(user);
  return ASSISTANT_DESTINATIONS.filter((d) => d.roles.includes(role));
}

/**
 * Role options for the "Add team member" action, mirroring
 * rbac.middleware.assignableRoles: a superadmin may create anyone, an admin
 * only employees and clients.
 */
export function roleOptionsFor(user) {
  const role = effectiveRole(user);
  const base = [
    { value: 'employee', label: 'Employee' },
    { value: 'client', label: 'Client' },
  ];
  if (role === 'superadmin') {
    return [{ value: 'admin', label: 'Admin (CA)' }, ...base, { value: 'superadmin', label: 'Super Admin' }];
  }
  return base;
}
