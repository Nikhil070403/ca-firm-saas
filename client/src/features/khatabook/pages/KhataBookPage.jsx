import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';
import { clientApi } from '../../clients/services/client.service';
import useApiData from '../../../hooks/useApiData';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';

export default function KhataBookPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, loading, error } = useApiData(
    () => clientApi.list({ page, limit: 20, search, status: 'active' }),
    [page, search]
  );

  const columns = [
    { key: 'displayName', label: 'Client', render: (c) => <strong>{c.displayName}</strong> },
    { key: 'gstNumber', label: 'GST', render: (c) => c.gstNumber || '—' },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <Button size="sm" variant="secondary" icon={BookOpenText} onClick={() => navigate(`/khata/${c._id}`)}>
          View Ledger
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Khata Book</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Select a client to view or update their ledger
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
        searchPlaceholder="Search clients…"
      />
    </div>
  );
}
