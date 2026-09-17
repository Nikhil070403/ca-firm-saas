import { useState } from 'react';
import { portalApi } from '../services/portal.service';
import useApiData from '../../../hooks/useApiData';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../utils/format';

const STATUS_TONE = { todo: 'neutral', in_progress: 'primary', in_review: 'warning', done: 'success', blocked: 'danger' };

/** Progress view of the work the firm is doing for this client. */
export default function PortalTasksPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useApiData(() => portalApi.tasks({ page, limit: 20, sort: '-createdAt' }), [page]);

  const columns = [
    { key: 'title', label: 'Item', render: (t) => <strong>{t.title}</strong> },
    { key: 'priority', label: 'Priority', render: (t) => t.priority },
    { key: 'status', label: 'Status', render: (t) => <Badge tone={STATUS_TONE[t.status]}>{t.status.replace(/_/g, ' ')}</Badge> },
    { key: 'dueDate', label: 'Expected By', render: (t) => formatDate(t.dueDate) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Projects</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Progress on the work your firm is doing for you
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
        emptyTitle="Nothing in progress"
        emptyDescription="Work your firm assigns for your account will show up here"
      />
    </div>
  );
}
