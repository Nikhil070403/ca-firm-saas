import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { clientApi } from '../services/client.service';
import { userApi } from '../../settings/services/settings.service';
import useApiData from '../../../hooks/useApiData';
import useCreateParam from '../../../hooks/useCreateParam';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { downloadCsv } from '../../../utils/csv';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import BulkActionBar from '../../../components/shared/BulkActionBar';
import ClientFormModal from '../components/ClientFormModal';

const STATUS_TONE = { active: 'success', inactive: 'neutral', archived: 'danger' };

export default function ClientsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [assigning, setAssigning] = useState(false);
  useCreateParam(() => setModalOpen(true));

  const { data, loading, error, refetch } = useApiData(
    () => clientApi.list({ page, limit: 20, search }),
    [page, search]
  );
  const { data: usersData } = useApiData(() => userApi.list({ limit: 200 }), []);

  const rows = data?.data || [];

  const handleCreate = async (payload) => {
    try {
      await clientApi.create(payload);
      toast.success('Client created');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const toggleRow = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleBulkAssign = async (assignedTo) => {
    setAssigning(true);
    try {
      const result = await clientApi.bulkAssign([...selected], assignedTo);
      toast.success(`Reassigned ${result.data.modifiedCount} client(s)`);
      setSelected(new Set());
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleExport = () => {
    const selectedRows = rows.filter((r) => selected.has(r._id));
    downloadCsv('clients.csv', selectedRows, [
      { key: 'displayName', label: 'Client' },
      { key: 'firmType', label: 'Type' },
      { key: 'gstNumber', label: 'GST Number' },
      { key: 'panNumber', label: 'PAN Number' },
      { label: 'Assigned To', accessor: (c) => c.assignedTo?.name || '' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const columns = [
    {
      key: '__select',
      label: '',
      width: 32,
      render: (c) => (
        <input
          type="checkbox"
          checked={selected.has(c._id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleRow(c._id)}
        />
      ),
    },
    { key: 'displayName', label: 'Client', render: (c) => <strong>{c.displayName}</strong> },
    { key: 'firmType', label: 'Type', render: (c) => c.firmType.replace('_', ' ') },
    { key: 'gstNumber', label: 'GST', render: (c) => c.gstNumber || '—' },
    { key: 'assignedTo', label: 'Assigned To', render: (c) => c.assignedTo?.name || '—' },
    { key: 'status', label: 'Status', render: (c) => <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge> },
  ];

  const userOptions = (usersData?.data || []).map((u) => ({ value: u.id, label: u.name }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Clients</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            {data?.meta?.total ?? 0} clients on file
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Client</Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={page}
        limit={20}
        total={data?.meta?.total || 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search clients, GST, PAN…"
        onRowClick={(row) => navigate(`/crm/clients/${row._id}`)}
        emptyTitle="No clients yet"
        emptyDescription="Add your first client to get started"
        toolbarActions={selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            assigneeOptions={userOptions}
            onAssign={handleBulkAssign}
            onExport={handleExport}
            onClear={() => setSelected(new Set())}
            assigning={assigning}
          />
        )}
      />

      <ClientFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
