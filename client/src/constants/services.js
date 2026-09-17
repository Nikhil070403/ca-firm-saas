import {
  LayoutDashboard, Users, Contact, BookOpenText, BellRing, ListChecks,
  Receipt, FolderOpen, BarChart3, Settings, UserCog, Landmark, Handshake,
  Sparkles, ThumbsUp, FileText, CalendarClock, Wallet, FileSpreadsheet,
  ScrollText, ClipboardList, FileCheck2, IndianRupee, CalendarRange,
  BookText, Coins, Building2, ClipboardCheck, UserCheck,
} from 'lucide-react';

/**
 * The panel is split into three services chosen after login. Each service
 * owns its own sidebar (grouped, collapsible). `adminOnly` gates both the
 * launcher card and every route under the service's basePath.
 */
export const SERVICES = {
  crm: {
    key: 'crm',
    label: 'CRM',
    description: 'Leads, clients, follow-ups, tasks and team productivity.',
    icon: Handshake,
    basePath: '/crm',
    home: '/crm/dashboard',
    accent: '#2563eb',
  },
  khata: {
    key: 'khata',
    label: 'Khata Book',
    description: 'Client ledgers, debits, credits and running balances.',
    icon: BookOpenText,
    basePath: '/khata',
    home: '/khata',
    accent: '#10b981',
  },
  accounts: {
    key: 'accounts',
    label: 'Accounts',
    description: 'Invoices, receipts, expenses and financial reports.',
    icon: Landmark,
    basePath: '/accounts',
    home: '/accounts/dashboard',
    accent: '#f59e0b',
  },
};

/**
 * Lead workboard pages — one reusable list page component renders each of
 * these based on the :status route param. Keys must match the Lead model's
 * status enum on the server.
 */
export const LEAD_STATUS_PAGES = [
  { status: 'all', label: 'All Leads', icon: Contact },
  { status: 'new', label: 'Fresh Leads', icon: Sparkles },
  { status: 'qualified', label: 'Interested', icon: ThumbsUp },
  { status: 'proposal', label: 'Proposal Sent', icon: FileText },
  { status: 'negotiation', label: 'Negotiation', icon: Handshake },
];

export const SERVICE_MENUS = {
  crm: [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/crm/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Lead Management',
      collapsible: true,
      items: LEAD_STATUS_PAGES.map((p) => ({
        label: p.label,
        path: `/crm/leads/status/${p.status}`,
        icon: p.icon,
      })),
    },
    {
      group: 'Engagement',
      items: [
        { label: 'Follow-ups', path: '/crm/followups', icon: BellRing },
        { label: 'Tasks', path: '/crm/tasks', icon: ListChecks },
        { label: 'Task Templates', path: '/crm/task-templates', icon: ClipboardList },
        { label: 'My Attendance', path: '/crm/attendance', icon: UserCheck },
        { label: 'Reminders', path: '/crm/reminders', icon: CalendarClock },
      ],
    },
    {
      group: 'Clients',
      items: [
        { label: 'All Clients', path: '/crm/clients', icon: Users },
        { label: 'Client Documents', path: '/crm/client-documents', icon: FolderOpen },
      ],
    },
    {
      group: 'Compliance',
      items: [
        { label: 'GSTR-1', path: '/crm/compliance/gstr1', icon: FileCheck2 },
        { label: 'GSTR-3B', path: '/crm/compliance/gstr3b', icon: IndianRupee },
        { label: 'Yearly Filings', path: '/crm/compliance/yearly', icon: CalendarRange },
        { label: 'Calendar', path: '/crm/compliance-calendar', icon: CalendarClock },
      ],
    },
    {
      group: 'Insights',
      items: [
        { label: 'CRM Reports', path: '/crm/reports', icon: BarChart3 },
      ],
    },
  ],
  khata: [
    {
      group: 'Party Ledgers',
      items: [
        { label: 'Client Ledgers', path: '/khata', icon: BookOpenText },
      ],
    },
    {
      group: 'Books',
      items: [
        { label: 'Day Book', path: '/khata/books/daybook', icon: BookText },
        { label: 'Cash Book', path: '/khata/books/cashbook', icon: Coins },
        { label: 'Bank Book', path: '/khata/books/bankbook', icon: Landmark },
        { label: 'Sales Register', path: '/khata/books/sales', icon: Receipt },
        { label: 'Expense Register', path: '/khata/books/expenses', icon: Wallet },
      ],
    },
  ],
  accounts: [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/accounts/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Billing',
      items: [
        { label: 'Invoices', path: '/accounts/invoices', icon: Receipt },
        { label: 'Receipts', path: '/accounts/receipts', icon: ScrollText },
        { label: 'Expenses', path: '/accounts/expenses', icon: Wallet },
      ],
    },
    {
      group: 'Insights',
      items: [
        { label: 'Financial Reports', path: '/accounts/reports', icon: FileSpreadsheet },
        { label: 'Documents', path: '/accounts/documents', icon: FolderOpen },
      ],
    },
    {
      group: 'Administration',
      adminOnly: true,
      items: [
        { label: 'Team', path: '/accounts/team', icon: UserCog },
        { label: 'Departments', path: '/accounts/departments', icon: Building2 },
        { label: 'Team Attendance', path: '/accounts/attendance', icon: ClipboardCheck },
        { label: 'Firm Settings', path: '/accounts/settings', icon: Settings },
        { label: 'Activity Log', path: '/accounts/activity', icon: ClipboardList },
      ],
    },
  ],
};

export function serviceForPath(pathname) {
  return Object.values(SERVICES).find((s) => pathname.startsWith(s.basePath)) || null;
}

/**
 * Workspace access is assigned per user (Team > Edit > Services). Admins and
 * superadmins bypass the list and always see everything. Clients NEVER see
 * any of the three staff services (CRM/Khata/Accounts) at all — they have
 * their own dedicated Client Portal (`/portal`) that only ever shows their
 * own data, scoped server-side to `linkedClientId`. Giving a client the
 * regular CRM screen (even with Accounts hidden) would still let them
 * browse every OTHER client and lead in the firm, which defeats the point.
 */
export function canAccessService(user, serviceKey) {
  if (!user) return false;
  if (user.role === 'client') return false;
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  return (user.allowedServices || []).includes(serviceKey);
}

export function servicesForUser(user) {
  return Object.values(SERVICES).filter((s) => canAccessService(user, s.key));
}
