import { useNavigate } from 'react-router-dom';
import { Receipt, Wallet, AlertTriangle, IndianRupee } from 'lucide-react';
import useApiData from '../../../hooks/useApiData';
import { dashboardApi } from '../../dashboard/services/dashboard.service';
import { invoiceApi, receiptApi, expenseApi } from '../services/billing.service';
import StatCard from '../../../components/shared/StatCard';
import BarChart from '../../../components/shared/BarChart';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { formatCurrency, formatDate, monthLabel } from '../../../utils/format';
import './AccountsDashboardPage.css';

const INVOICE_TONES = {
  draft: 'neutral', sent: 'primary', partially_paid: 'warning',
  paid: 'success', overdue: 'danger', cancelled: 'neutral',
};

/**
 * Finance-first dashboard for the Accounts service: money in, money out,
 * what's overdue — distinct from the CRM dashboard's pipeline focus.
 */
export default function AccountsDashboardPage() {
  const navigate = useNavigate();
  const { data: overview, loading } = useApiData(() => dashboardApi.overview(), []);
  const { data: overdueData } = useApiData(
    () => invoiceApi.list({ status: 'overdue', limit: 5, sort: 'dueDate' }),
    []
  );
  const { data: receiptsData } = useApiData(
    () => receiptApi.list({ limit: 5, sort: '-receivedDate' }),
    []
  );
  const { data: expensesData } = useApiData(
    () => expenseApi.list({ limit: 5, sort: '-expenseDate' }),
    []
  );

  if (loading) return <div style={{ padding: '60px 0' }}><Spinner label="Loading accounts…" /></div>;

  const monthly = overview?.revenue?.monthly || [];
  const chartData = monthly.map((m) => ({
    label: monthLabel(m._id.year, m._id.month),
    value: m.total,
  }));
  const monthRevenue = monthly.length ? monthly[monthly.length - 1].total : 0;
  const overdueInvoices = overdueData?.data || [];
  const receipts = receiptsData?.data || [];
  const expenses = expensesData?.data || [];

  return (
    <div className="accounts-dash">
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Accounts Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          The firm's money at a glance
        </p>
      </div>

      <div className="accounts-dash__stats">
        <StatCard
          icon={AlertTriangle}
          label="Outstanding"
          value={formatCurrency(overview?.revenue?.outstandingTotal)}
          tone="danger"
        />
        <StatCard
          icon={IndianRupee}
          label="This Month's Billing"
          value={formatCurrency(monthRevenue)}
          tone="primary"
        />
        <StatCard
          icon={Receipt}
          label="Overdue Invoices"
          value={overdueData?.meta?.total ?? overdueInvoices.length}
          tone="warning"
        />
        <StatCard
          icon={Wallet}
          label="Recent Expenses (5)"
          value={formatCurrency(expenses.reduce((acc, e) => acc + (e.amount || 0), 0))}
          tone="neutral"
        />
      </div>

      <Card title="Billing (last 6 months)" subtitle="Invoice value issued per month">
        <BarChart data={chartData} height={220} formatValue={formatCurrency} />
      </Card>

      <div className="accounts-dash__lists">
        <Card
          title="Overdue Invoices"
          subtitle="Chase these first"
          action={<button type="button" className="entity-link" onClick={() => navigate('/accounts/invoices')}>View all</button>}
        >
          {overdueInvoices.length === 0 && <p className="accounts-dash__empty">Nothing overdue 🎉</p>}
          {overdueInvoices.map((inv) => (
            <button
              key={inv._id}
              type="button"
              className="accounts-dash__row"
              onClick={() => navigate(`/accounts/invoices/${inv._id}`)}
            >
              <span className="accounts-dash__row-title">{inv.invoiceNumber}</span>
              <span className="accounts-dash__row-sub">{inv.clientId?.displayName || '—'} · due {formatDate(inv.dueDate)}</span>
              <span className="accounts-dash__row-amount">{formatCurrency(inv.grandTotal - inv.amountPaid)}</span>
            </button>
          ))}
        </Card>

        <Card
          title="Latest Receipts"
          subtitle="Money received"
          action={<button type="button" className="entity-link" onClick={() => navigate('/accounts/receipts')}>View all</button>}
        >
          {receipts.length === 0 && <p className="accounts-dash__empty">No receipts yet</p>}
          {receipts.map((rcpt) => (
            <div key={rcpt._id} className="accounts-dash__row is-static">
              <span className="accounts-dash__row-title">{rcpt.receiptNumber}</span>
              <span className="accounts-dash__row-sub">
                {rcpt.clientId?.displayName || '—'} · {(rcpt.paymentMode || '').replace(/_/g, ' ')} · {formatDate(rcpt.receivedDate)}
              </span>
              <span className="accounts-dash__row-amount" style={{ color: 'var(--color-success)' }}>
                +{formatCurrency(rcpt.amount)}
              </span>
            </div>
          ))}
        </Card>

        <Card
          title="Latest Expenses"
          subtitle="Money spent"
          action={<button type="button" className="entity-link" onClick={() => navigate('/accounts/expenses')}>View all</button>}
        >
          {expenses.length === 0 && <p className="accounts-dash__empty">No expenses yet</p>}
          {expenses.map((exp) => (
            <div key={exp._id} className="accounts-dash__row is-static">
              <span className="accounts-dash__row-title">{exp.title}</span>
              <span className="accounts-dash__row-sub">
                <Badge tone="neutral">{(exp.category || '').replace(/_/g, ' ')}</Badge> {formatDate(exp.expenseDate)}
              </span>
              <span className="accounts-dash__row-amount" style={{ color: 'var(--color-danger)' }}>
                −{formatCurrency(exp.amount)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
