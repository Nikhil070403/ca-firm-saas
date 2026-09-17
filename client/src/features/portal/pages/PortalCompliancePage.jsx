import { useState } from 'react';
import { portalApi } from '../services/portal.service';
import useApiData from '../../../hooks/useApiData';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../utils/format';

const RETURN_LABELS = { gstr1: 'GSTR-1', gstr3b: 'GSTR-3B', itr: 'Income Tax Return', gstr9c: 'GSTR-9C', roc: 'ROC (MCA)', audit: 'Audit' };

function statusOf(ret) {
  if (ret.status === 'filed') return { label: 'filed', tone: 'success' };
  if (new Date(ret.dueDate) < new Date()) return { label: 'overdue', tone: 'danger' };
  return { label: 'pending', tone: 'warning' };
}

/** Read-only compliance calendar for the client — everything they're
 * required to file with the firm's help, and whether it's been done. */
export default function PortalCompliancePage() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useApiData(() => portalApi.compliance({ page, limit: 20, sort: 'dueDate' }), [page]);

  const columns = [
    { key: 'returnType', label: 'Filing', render: (r) => RETURN_LABELS[r.returnType] || r.returnType },
    { key: 'periodLabel', label: 'Period' },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const s = statusOf(r);
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    { key: 'filedAt', label: 'Filed On', render: (r) => formatDate(r.filedAt) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Compliance</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Every statutory filing your firm is tracking for you
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
        emptyTitle="Nothing to show yet"
        emptyDescription="Your firm hasn't set up compliance tracking for your account yet"
      />
    </div>
  );
}
