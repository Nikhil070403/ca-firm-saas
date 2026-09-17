import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, AlertCircle, ListChecks, Users, BellRing, ShieldAlert } from 'lucide-react';
import { dashboardApi } from '../services/dashboard.service';
import { clientApi } from '../../clients/services/client.service';
import useApiData from '../../../hooks/useApiData';
import StatCard from '../../../components/shared/StatCard';
import BarChart from '../../../components/shared/BarChart';
import Card, { CardHeader } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatCurrency, formatDate, monthLabel } from '../../../utils/format';
import UserLink from '../../../components/shared/UserLink';

const TASK_STATUS_TONE = { todo: 'neutral', in_progress: 'primary', in_review: 'warning', done: 'success', blocked: 'danger' };

const RISK_TONES = { high: 'danger', medium: 'warning', low: 'success' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useApiData(() => dashboardApi.overview(), []);
  const { data: riskClients } = useApiData(() => clientApi.riskOverview().catch(() => []), []);

  const revenueChartData = useMemo(() => {
    if (!data) return [];
    return data.revenue.monthly.map((m) => ({
      label: monthLabel(m._id.year, m._id.month),
      value: m.revenue,
    }));
  }, [data]);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) return <EmptyState title="Couldn't load dashboard" description={error} />;
  if (!data) return null;

  const totalTasksToday = data.todaysTasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Here's what's happening across your firm today.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Outstanding" value={formatCurrency(data.revenue.outstandingTotal)} icon={AlertCircle} tone="danger" />
        <StatCard label="Active Clients" value={data.activeClientCount} icon={Users} tone="primary" />
        <StatCard label="Today's Tasks" value={totalTasksToday} icon={ListChecks} tone="warning" />
        <StatCard label="Upcoming Reminders (7d)" value={data.upcomingReminders.length} icon={BellRing} tone="success" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Revenue (last 6 months)" subtitle="Invoice value issued per month" />
          <BarChart data={revenueChartData} formatValue={formatCurrency} />
        </Card>

        <Card>
          <CardHeader title="Lead Pipeline" />
          {data.leadPipeline.length === 0 ? (
            <EmptyState title="No leads yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.leadPipeline.map((stage) => (
                <div key={stage._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <Badge tone="primary">{stage._id}</Badge>
                  <span style={{ fontWeight: 700 }}>{stage.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Today's Tasks" action={<Link to="/crm/tasks" style={{ fontSize: 12.5, color: 'var(--color-primary)', fontWeight: 600 }}>View all</Link>} />
          {data.todaysTasks.length === 0 ? (
            <EmptyState title="Nothing due today" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.todaysTasks.map((task) => (
                <div key={task._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{task.title}</span>
                  <Badge tone={TASK_STATUS_TONE[task.status] || 'neutral'}>{task.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming Reminders" action={<Link to="/reminders" style={{ fontSize: 12.5, color: 'var(--color-primary)', fontWeight: 600 }}>View all</Link>} />
          {data.upcomingReminders.length === 0 ? (
            <EmptyState title="Nothing due in the next 7 days" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.upcomingReminders.map((reminder) => (
                <div key={reminder._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{reminder.title}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(reminder.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {riskClients?.some((c) => c.level !== 'low') && (
        <Card>
          <CardHeader
            title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} /> Risk Alerts</span>}
            subtitle="Clients needing attention — overdue returns, unpaid invoices, missed deadlines"
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {riskClients.filter((c) => c.level !== 'low').map((c) => (
              <button
                key={c.clientId}
                type="button"
                onClick={() => navigate(`/crm/clients/${c.clientId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 6px', border: 'none', borderBottom: '1px solid var(--color-border)',
                  background: 'none', fontFamily: 'inherit', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                }}
              >
                <strong style={{ flex: 1 }}>{c.displayName}</strong>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                  {[
                    c.factors.overdueReturns && `${c.factors.overdueReturns} overdue return${c.factors.overdueReturns > 1 ? 's' : ''}`,
                    c.factors.overdueInvoices && `${c.factors.overdueInvoices} overdue invoice${c.factors.overdueInvoices > 1 ? 's' : ''}`,
                    c.factors.outstanding > 0 && `${formatCurrency(c.factors.outstanding)} outstanding`,
                  ].filter(Boolean).join(' · ')}
                </span>
                <Badge tone={RISK_TONES[c.level]}>{c.level} · {c.score}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Recent Activity" />
        {data.recentActivities.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.recentActivities.map((activity) => (
              <div key={activity._id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span>
                  <UserLink user={activity.performedBy}><strong>{activity.performedBy?.name || 'Someone'}</strong></UserLink> {activity.description}
                </span>
                <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(activity.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
