import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import PortalLayout from './layouts/PortalLayout';
import { ProtectedRoute, AdminRoute, GuestRoute, ServiceRoute, PortalRoute } from './components/shared/ProtectedRoute';
import { useAuth } from './features/auth/context/AuthContext';
import { homePathForUser } from './constants/roles';
import Spinner from './components/ui/Spinner';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./features/auth/pages/VerifyEmailPage'));

const ServiceLauncherPage = lazy(() => import('./pages/ServiceLauncherPage'));

const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const LeadListPage = lazy(() => import('./features/crm/pages/LeadListPage'));
const LeadDetailPage = lazy(() => import('./features/crm/pages/LeadDetailPage'));
const FollowUpsPage = lazy(() => import('./features/crm/pages/FollowUpsPage'));
const CrmReportsPage = lazy(() => import('./features/crm/pages/CrmReportsPage'));
const CompliancePage = lazy(() => import('./features/crm/pages/CompliancePage'));
const ComplianceCalendarPage = lazy(() => import('./features/crm/pages/ComplianceCalendarPage'));
const ClientDocumentsPage = lazy(() => import('./features/crm/pages/ClientDocumentsPage'));
const ClientsPage = lazy(() => import('./features/clients/pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('./features/clients/pages/ClientDetailPage'));
const RemindersPage = lazy(() => import('./features/reminders/pages/RemindersPage'));
const TasksPage = lazy(() => import('./features/tasks/pages/TasksPage'));
const TaskDetailPage = lazy(() => import('./features/tasks/pages/TaskDetailPage'));
const TaskTemplatesPage = lazy(() => import('./features/tasks/pages/TaskTemplatesPage'));
const MyAttendancePage = lazy(() => import('./features/attendance/pages/MyAttendancePage'));

const KhataBookPage = lazy(() => import('./features/khatabook/pages/KhataBookPage'));
const ClientLedgerPage = lazy(() => import('./features/khatabook/pages/ClientLedgerPage'));
const BookPage = lazy(() => import('./features/khatabook/pages/BookPage'));

const AccountsDashboardPage = lazy(() => import('./features/billing/pages/AccountsDashboardPage'));
const InvoicesPage = lazy(() => import('./features/billing/pages/InvoicesPage'));
const InvoiceDetailPage = lazy(() => import('./features/billing/pages/InvoiceDetailPage'));
const ReceiptsPage = lazy(() => import('./features/billing/pages/ReceiptsPage'));
const ExpensesPage = lazy(() => import('./features/billing/pages/ExpensesPage'));
const DocumentsPage = lazy(() => import('./features/documents/pages/DocumentsPage'));
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage'));
const TeamPage = lazy(() => import('./features/settings/pages/TeamPage'));
const FirmSettingsPage = lazy(() => import('./features/settings/pages/FirmSettingsPage'));
const ActivityLogPage = lazy(() => import('./features/settings/pages/ActivityLogPage'));
const DepartmentsPage = lazy(() => import('./features/departments/pages/DepartmentsPage'));
const TeamAttendancePage = lazy(() => import('./features/attendance/pages/TeamAttendancePage'));

const UserProfilePage = lazy(() => import('./features/users/pages/UserProfilePage'));
const NotificationCenterPage = lazy(() => import('./features/notifications/pages/NotificationCenterPage'));
const ProfileSettingsPage = lazy(() => import('./features/settings/pages/ProfileSettingsPage'));

const PortalOverviewPage = lazy(() => import('./features/portal/pages/PortalOverviewPage'));
const PortalCompliancePage = lazy(() => import('./features/portal/pages/PortalCompliancePage'));
const PortalInvoicesPage = lazy(() => import('./features/portal/pages/PortalInvoicesPage'));
const PortalDocumentsPage = lazy(() => import('./features/portal/pages/PortalDocumentsPage'));
const PortalLedgerPage = lazy(() => import('./features/portal/pages/PortalLedgerPage'));
const PortalTasksPage = lazy(() => import('./features/portal/pages/PortalTasksPage'));
const PortalMessagesPage = lazy(() => import('./features/portal/pages/PortalMessagesPage'));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageFallback() {
  return (
    <div style={{ padding: '60px 0' }}>
      <Spinner label="Loading…" />
    </div>
  );
}

/** Redirect helper that keeps the :clientId param from legacy khatabook URLs. */
function LegacyLedgerRedirect() {
  const { clientId } = useParams();
  return <Navigate to={`/khata/${clientId}`} replace />;
}

/** '/' lands somewhere different depending on role — clients go straight
 * into their portal, everyone else sees the service launcher. */
function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathForUser(user)} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            {/* Public self-registration is closed: members are invited from
                Team > Invite Member. Reset routes stay reachable because
                emailed reset links land on them, but nothing links to them
                from the login screen. */}
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        <Route path="/verify-email" element={<AuthLayout />}>
          <Route index element={<VerifyEmailPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {/* Service launcher lives outside the sidebar layout on purpose */}
          <Route path="/services" element={<ServiceLauncherPage />} />

          {/* ---------- Client Portal — its own layout, client role only ---------- */}
          <Route element={<PortalRoute />}>
            <Route element={<PortalLayout />}>
              <Route path="/portal" element={<PortalOverviewPage />} />
              <Route path="/portal/compliance" element={<PortalCompliancePage />} />
              <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
              <Route path="/portal/documents" element={<PortalDocumentsPage />} />
              <Route path="/portal/ledger" element={<PortalLedgerPage />} />
              <Route path="/portal/tasks" element={<PortalTasksPage />} />
              <Route path="/portal/messages" element={<PortalMessagesPage />} />
            </Route>
          </Route>

          <Route element={<DashboardLayout />}>
            {/* ---------- CRM service ---------- */}
            <Route element={<ServiceRoute service="crm" />}>
              <Route path="/crm/dashboard" element={<DashboardPage />} />
              <Route path="/crm/leads/status/:status" element={<LeadListPage />} />
              <Route path="/crm/leads/:id" element={<LeadDetailPage />} />
              <Route path="/crm/followups" element={<FollowUpsPage />} />
              <Route path="/crm/clients" element={<ClientsPage />} />
              <Route path="/crm/clients/:id" element={<ClientDetailPage />} />
              <Route path="/crm/client-documents" element={<ClientDocumentsPage />} />
              <Route path="/crm/tasks" element={<TasksPage />} />
              <Route path="/crm/tasks/:id" element={<TaskDetailPage />} />
              <Route path="/crm/task-templates" element={<TaskTemplatesPage />} />
              <Route path="/crm/attendance" element={<MyAttendancePage />} />
              <Route path="/crm/reminders" element={<RemindersPage />} />
              <Route path="/crm/reports" element={<CrmReportsPage />} />
              <Route path="/crm/compliance" element={<Navigate to="/crm/compliance/gstr1" replace />} />
              <Route path="/crm/compliance-calendar" element={<ComplianceCalendarPage />} />
              <Route path="/crm/compliance/:tab" element={<CompliancePage />} />
            </Route>

            {/* ---------- Khata Book service ---------- */}
            <Route element={<ServiceRoute service="khata" />}>
              <Route path="/khata" element={<KhataBookPage />} />
              <Route path="/khata/books/:book" element={<BookPage />} />
              <Route path="/khata/:clientId" element={<ClientLedgerPage />} />
            </Route>

            {/* ---------- Accounts service (assignable; admin pages nested) ---------- */}
            <Route element={<ServiceRoute service="accounts" />}>
              <Route path="/accounts/dashboard" element={<AccountsDashboardPage />} />
              <Route path="/accounts/invoices" element={<InvoicesPage />} />
              <Route path="/accounts/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/accounts/receipts" element={<ReceiptsPage />} />
              <Route path="/accounts/expenses" element={<ExpensesPage />} />
              <Route path="/accounts/reports" element={<ReportsPage />} />
              <Route path="/accounts/documents" element={<DocumentsPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/accounts/team" element={<TeamPage />} />
                <Route path="/accounts/departments" element={<DepartmentsPage />} />
                <Route path="/accounts/attendance" element={<TeamAttendancePage />} />
                <Route path="/accounts/settings" element={<FirmSettingsPage />} />
                <Route path="/accounts/activity" element={<ActivityLogPage />} />
              </Route>
            </Route>

            {/* ---------- Cross-service ---------- */}
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/notifications" element={<NotificationCenterPage />} />
            <Route path="/settings/profile" element={<ProfileSettingsPage />} />

            {/* ---------- Legacy path redirects ---------- */}
            <Route path="/dashboard" element={<Navigate to="/crm/dashboard" replace />} />
            <Route path="/crm/leads" element={<Navigate to="/crm/leads/status/all" replace />} />
            <Route path="/clients" element={<Navigate to="/crm/clients" replace />} />
            <Route path="/tasks" element={<Navigate to="/crm/tasks" replace />} />
            <Route path="/reminders" element={<Navigate to="/crm/reminders" replace />} />
            <Route path="/khatabook" element={<Navigate to="/khata" replace />} />
            <Route path="/khatabook/:clientId" element={<LegacyLedgerRedirect />} />
            <Route path="/billing/invoices" element={<Navigate to="/accounts/invoices" replace />} />
            <Route path="/billing/receipts" element={<Navigate to="/accounts/receipts" replace />} />
            <Route path="/billing/expenses" element={<Navigate to="/accounts/expenses" replace />} />
            <Route path="/documents" element={<Navigate to="/accounts/documents" replace />} />
            <Route path="/reports" element={<Navigate to="/accounts/reports" replace />} />
            <Route path="/team" element={<Navigate to="/accounts/team" replace />} />
            <Route path="/settings" element={<Navigate to="/accounts/settings" replace />} />
          </Route>
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
