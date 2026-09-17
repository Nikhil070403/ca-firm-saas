import { useState } from 'react';
import { Download } from 'lucide-react';
import { portalApi } from '../services/portal.service';
import useApiData from '../../../hooks/useApiData';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../utils/format';

/** Documents the firm has uploaded for this client — view/download only. */
export default function PortalDocumentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, loading, error } = useApiData(
    () => portalApi.documents({ page, limit: 20, search }),
    [page, search]
  );

  const columns = [
    { key: 'name', label: 'Document', render: (d) => <strong>{d.name}</strong> },
    { key: 'tags', label: 'Tags', render: (d) => (d.tags?.length ? d.tags.join(', ') : '—') },
    { key: 'createdAt', label: 'Date', render: (d) => formatDate(d.createdAt) },
    {
      key: 'actions',
      label: '',
      render: (d) => (
        <Button
          size="sm"
          variant="outline"
          icon={Download}
          onClick={(e) => { e.stopPropagation(); window.open(d.fileUrl, '_blank', 'noopener'); }}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Documents</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Files your firm has shared with you
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
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search documents…"
        emptyTitle="No documents yet"
        emptyDescription="Files your firm uploads for you will appear here"
      />
    </div>
  );
}
