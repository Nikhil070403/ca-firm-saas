import { useNavigate } from 'react-router-dom';
import { IndianRupee, FileCheck2, ListChecks, AlertTriangle } from 'lucide-react';
import { portalApi } from '../services/portal.service';
import useApiData from '../../../hooks/useApiData';
import StatCard from '../../../components/shared/StatCard';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../../utils/format';

const INVOICE_TONES = { draft: 'neutral', sent: 'primary', partially_paid: 'warning', paid: 'success', overdue: 'danger', cancelled: 'neutral' };
const TASK_TONES = { todo: 'neutral', in_progress: 'primary', in_review: 'warning', done: 'success', blocked: 'danger' };

/** Landing page of the Client Portal — everything scoped server-side to
 * req.user.linkedClientId, never something the client can widen. */
export default function PortalOverviewPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useApiData(() => portalApi.overview(), []);

  if (loading) return <div style={{ padding: '60px 0' }}><Spinner label="Loading your workspace…" /></div>;
  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Your account isn't linked yet"
        description={error || 'Contact your firm so they can link your login to your client record.'}
      />
    );
  }
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Welcome, {data.client.displayName}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Here's where things stand with your firm right now
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={IndianRupee} label="Ledger Balance" value={formatCurrency(data.ledgerBalance)} tone={data.ledgerBalance > 0 ? 'danger' : 'success'} />
        <StatCard icon={FileCheck2} label="Pending Compliance" value={data.pendingComplianceTotal} tone="warning" />
        <StatCard icon={IndianRupee} label="Outstanding Invoices" value={formatCurrency(data.outstandingTotal)} tone="danger" />
        <StatCard icon={ListChecks} label="Open Projects" value={data.openTasks.length} tone="primary" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Card
          title="Pending Compliance"
          subtitle="Returns due soon"
          action={<button type="button" className="entity-link" onClick={() => navigate('/portal/compliance')}>View all</button>}
        >
          {data.pendingCompliance.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-faint)', textAlign: 'center', padding: '16px 0' }}>Nothing pending 🎉</p>
          ) : (
            data.pendingCompliance.map((ret) => (
              <div key={ret._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span>{ret.returnType.toUpperCase()} · {ret.periodLabel}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>due {formatDate(ret.dueDate)}</span>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Recent Invoices"
          action={<button type="button" className="entity-link" onClick={() => navigate('/portal/invoices')}>View all</button>}
        >
          {data.recentInvoices.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-faint)', textAlign: 'center', padding: '16px 0' }}>No invoices yet</p>
          ) : (
            data.recentInvoices.map((inv) => (
              <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span>{inv.invoiceNumber}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {formatCurrency(inv.grandTotal)}
                  <Badge tone={INVOICE_TONES[inv.status]}>{inv.status.replace(/_/g, ' ')}</Badge>
                </span>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Open Projects"
          action={<button type="button" className="entity-link" onClick={() => navigate('/portal/tasks')}>View all</button>}
        >
          {data.openTasks.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-faint)', textAlign: 'center', padding: '16px 0' }}>Nothing in progress</p>
          ) : (
            data.openTasks.map((task) => (
              <div key={task._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span>{task.title}</span>
                <Badge tone={TASK_TONES[task.status]}>{task.status.replace(/_/g, ' ')}</Badge>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Recent Documents"
          action={<button type="button" className="entity-link" onClick={() => navigate('/portal/documents')}>View all</button>}
        >
          {data.recentDocuments.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-faint)', textAlign: 'center', padding: '16px 0' }}>No documents yet</p>
          ) : (
            data.recentDocuments.map((doc) => (
              <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span>{doc.name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(doc.createdAt)}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
