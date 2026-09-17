import { useState } from 'react';
import { Download } from 'lucide-react';
import { reportApi, downloadCsv } from '../services/report.service';
import useApiData from '../../../hooks/useApiData';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import BarChart from '../../../components/shared/BarChart';
import { formatCurrency, formatDate, monthLabel } from '../../../utils/format';

const TABS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'clientWise', label: 'Client-wise' },
  { key: 'employeeWise', label: 'Employee-wise' },
  { key: 'reminderWise', label: 'Reminder-wise' },
  { key: 'gst', label: 'GST' },
];

function SimpleTable({ columns, rows }) {
  if (!rows || rows.length === 0) return <EmptyState title="No data for this report yet" />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)', fontSize: 11.5, textTransform: 'uppercase' }}>
            {columns.map((c) => <th key={c.key} style={{ padding: '8px 10px' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
              {columns.map((c) => <td key={c.key} style={{ padding: '10px' }}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('revenue');

  const { data: revenue, loading: revLoading } = useApiData(() => reportApi.revenue(), [], { skip: tab !== 'revenue' });
  const { data: outstanding, loading: outLoading } = useApiData(() => reportApi.outstanding(), [], { skip: tab !== 'outstanding' });
  const { data: clientWise, loading: cwLoading } = useApiData(() => reportApi.clientWise(), [], { skip: tab !== 'clientWise' });
  const { data: employeeWise, loading: ewLoading } = useApiData(() => reportApi.employeeWise(), [], { skip: tab !== 'employeeWise' });
  const { data: reminderWise, loading: rwLoading } = useApiData(() => reportApi.reminderWise(), [], { skip: tab !== 'reminderWise' });
  const { data: gst, loading: gstLoading } = useApiData(() => reportApi.gst(), [], { skip: tab !== 'gst' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>Reports</h1>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '9px 14px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'revenue' && (
        <Card>
          <CardHeader title="Revenue" subtitle="Monthly invoice value vs collected" />
          {revLoading ? <Spinner /> : (
            <>
              <BarChart
                data={(revenue?.monthly || []).map((m) => ({ label: monthLabel(m._id.year, m._id.month), value: m.revenue }))}
                formatValue={formatCurrency}
              />
              <p style={{ marginTop: 16, fontSize: 13, fontWeight: 700 }}>
                Total Outstanding: {formatCurrency(revenue?.outstandingTotal)}
              </p>
            </>
          )}
        </Card>
      )}

      {tab === 'outstanding' && (
        <Card>
          <CardHeader
            title="Outstanding Invoices"
            action={<Button size="sm" variant="outline" icon={Download} onClick={() => downloadCsv('/reports/outstanding', {}, 'outstanding-report.csv')}>Export CSV</Button>}
          />
          {outLoading ? <Spinner /> : (
            <SimpleTable
              rows={outstanding}
              columns={[
                { key: 'invoiceNumber', label: 'Invoice #', render: (r) => r.invoiceNumber },
                { key: 'client', label: 'Client', render: (r) => r.clientId?.displayName },
                { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
                { key: 'outstanding', label: 'Outstanding', render: (r) => formatCurrency(r.grandTotal - r.amountPaid) },
              ]}
            />
          )}
        </Card>
      )}

      {tab === 'clientWise' && (
        <Card>
          <CardHeader
            title="Client-wise Billing"
            action={<Button size="sm" variant="outline" icon={Download} onClick={() => downloadCsv('/reports/client-wise', {}, 'client-wise-report.csv')}>Export CSV</Button>}
          />
          {cwLoading ? <Spinner /> : (
            <SimpleTable
              rows={clientWise}
              columns={[
                { key: 'client', label: 'Client', render: (r) => r.client?.displayName },
                { key: 'totalBilled', label: 'Billed', render: (r) => formatCurrency(r.totalBilled) },
                { key: 'totalPaid', label: 'Paid', render: (r) => formatCurrency(r.totalPaid) },
                { key: 'outstanding', label: 'Outstanding', render: (r) => formatCurrency(r.outstanding) },
              ]}
            />
          )}
        </Card>
      )}

      {tab === 'employeeWise' && (
        <Card>
          <CardHeader title="Employee-wise Productivity" />
          {ewLoading ? <Spinner /> : (
            <SimpleTable
              rows={employeeWise}
              columns={[
                { key: 'user', label: 'Employee', render: (r) => r.user?.name },
                { key: 'totalTasks', label: 'Total Tasks', render: (r) => r.totalTasks },
                { key: 'completedTasks', label: 'Completed', render: (r) => r.completedTasks },
                { key: 'minutesLogged', label: 'Minutes Logged', render: (r) => r.minutesLogged },
              ]}
            />
          )}
        </Card>
      )}

      {tab === 'reminderWise' && (
        <Card>
          <CardHeader title="Reminder-wise Breakdown" />
          {rwLoading ? <Spinner /> : (
            <SimpleTable
              rows={reminderWise}
              columns={[
                { key: 'category', label: 'Category', render: (r) => r._id.category.replace('_', ' ') },
                { key: 'status', label: 'Status', render: (r) => r._id.status },
                { key: 'count', label: 'Count', render: (r) => r.count },
              ]}
            />
          )}
        </Card>
      )}

      {tab === 'gst' && (
        <Card>
          <CardHeader
            title="GST Report"
            action={<Button size="sm" variant="outline" icon={Download} onClick={() => downloadCsv('/reports/gst', {}, 'gst-report.csv')}>Export CSV</Button>}
          />
          {gstLoading ? <Spinner /> : (
            <SimpleTable
              rows={gst}
              columns={[
                { key: 'invoiceNumber', label: 'Invoice #', render: (r) => r.invoiceNumber },
                { key: 'client', label: 'Client', render: (r) => r.client?.displayName },
                { key: 'gstNumber', label: 'GSTIN', render: (r) => r.client?.gstNumber },
                { key: 'taxTotal', label: 'Tax', render: (r) => formatCurrency(r.taxTotal) },
                { key: 'grandTotal', label: 'Total', render: (r) => formatCurrency(r.grandTotal) },
              ]}
            />
          )}
        </Card>
      )}
    </div>
  );
}
