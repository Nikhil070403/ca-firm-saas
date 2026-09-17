import { useState } from 'react';
import { portalApi } from '../services/portal.service';
import useApiData from '../../../hooks/useApiData';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../../utils/format';

const INVOICE_TONES = { draft: 'neutral', sent: 'primary', partially_paid: 'warning', paid: 'success', overdue: 'danger', cancelled: 'neutral' };

/** Read-only invoice list — a client can see what they owe and what's been
 * paid, not edit anything (billing stays the firm's job). */
export default function PortalInvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useApiData(() => portalApi.invoices({ page, limit: 20, sort: '-issueDate' }), [page]);

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice', render: (i) => <strong>{i.invoiceNumber}</strong> },
    { key: 'issueDate', label: 'Issued', render: (i) => formatDate(i.issueDate) },
    { key: 'dueDate', label: 'Due', render: (i) => formatDate(i.dueDate) },
    { key: 'grandTotal', label: 'Total', render: (i) => formatCurrency(i.grandTotal) },
    { key: 'amountPaid', label: 'Paid', render: (i) => formatCurrency(i.amountPaid) },
    { key: 'outstanding', label: 'Outstanding', render: (i) => formatCurrency(i.grandTotal - i.amountPaid) },
    { key: 'status', label: 'Status', render: (i) => <Badge tone={INVOICE_TONES[i.status]}>{i.status.replace(/_/g, ' ')}</Badge> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Invoices</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Every invoice raised to your account
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        error={error}
        page={page}
        limit={20}
        total={data?.meta?.total || 0}
        onPageChange={setPage}
        emptyTitle="No invoices yet"
      />
    </div>
  );
}
