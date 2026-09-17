import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { leadApi, LEAD_STATUS_TONES } from '../services/lead.service';
import { userApi } from '../../settings/services/settings.service';
import { LEAD_STATUS_PAGES } from '../../../constants/services';
import useApiData from '../../../hooks/useApiData';
import useCreateParam from '../../../hooks/useCreateParam';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { downloadCsv } from '../../../utils/csv';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import UserLink from '../../../components/shared/UserLink';
import BulkActionBar from '../../../components/shared/BulkActionBar';
import LeadFormModal from '../components/LeadFormModal';
import { formatCurrency, formatDate } from '../../../utils/format';
import './LeadListPage.css';

/**
 * One workboard for every lead status — the :status route param drives the
 * filter, title and empty-state, so "Fresh Leads" and "Not Interested" are
 * the same component with different config instead of copied pages.
 */
export default function LeadListPage() {
  const { status = 'all' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [assigning, setAssigning] = useState(false);
  useCreateParam(() => setModalOpen(true));

  const pageConfig = LEAD_STATUS_PAGES.find((p) => p.status === status) || LEAD_STATUS_PAGES[0];

  const { data, loading, error, refetch } = useApiData(
    () => leadApi.list({ page, limit: 20, search, ...(status !== 'all' ? { status } : {}) }),
    [page, search, status]
  );
  const { data: usersData } = useApiData(() => userApi.list({ limit: 200 }), []);

  const { data: summary } = useApiData(() => leadApi.pipelineSummary(), [status]);

  // Selected row ids belong to whichever tab/page they were checked on —
  // clear them when either changes so the bulk bar can't act on rows the
  // user isn't currently looking at.
  useEffect(() => setSelected(new Set()), [status, page]);

  const countsByStatus = useMemo(() => {
    const map = {};
    (Array.isArray(summary) ? summary : []).forEach((s) => { map[s._id] = s.count; });
    return map;
  }, [summary]);
  const totalLeads = useMemo(
    () => Object.values(countsByStatus).reduce((acc, n) => acc + n, 0),
    [countsByStatus]
  );

  const handleCreate = async (payload) => {
    try {
      await leadApi.create(payload);
      toast.success('Lead created');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const rows = data?.data || [];

  const toggleRow = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleBulkAssign = async (assignedTo) => {
    setAssigning(true);
    try {
      const result = await leadApi.bulkAssign([...selected], assignedTo);
      toast.success(`Reassigned ${result.data.modifiedCount} lead(s)`);
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
    downloadCsv('leads.csv', selectedRows, [
      { key: 'name', label: 'Lead' },
      { key: 'company', label: 'Company' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'source', label: 'Source' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { label: 'Owner', accessor: (l) => l.assignedTo?.name || '' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const columns = [
    {
      key: '__select',
      label: '',
      width: 32,
      render: (l) => (
        <input
          type="checkbox"
          checked={selected.has(l._id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleRow(l._id)}
        />
      ),
    },
    { key: 'name', label: 'Lead', render: (l) => <strong>{l.name}</strong> },
    { key: 'company', label: 'Company', render: (l) => l.company || '—' },
    { key: 'phone', label: 'Contact', render: (l) => l.phone || l.email || '—' },
    { key: 'source', label: 'Source', render: (l) => (l.source || '').replace(/_/g, ' ') },
    { key: 'estimatedValue', label: 'Value', render: (l) => formatCurrency(l.estimatedValue) },
    { key: 'assignedTo', label: 'Owner', render: (l) => <UserLink user={l.assignedTo} /> },
    { key: 'status', label: 'Status', render: (l) => <Badge tone={LEAD_STATUS_TONES[l.status]}>{(l.status || '').replace(/_/g, ' ')}</Badge> },
    { key: 'createdAt', label: 'Added', render: (l) => formatDate(l.createdAt) },
  ];

  return (
    <div className="lead-board">
      <div className="lead-board__header">
        <div>
          <h1>{pageConfig.label}</h1>
          <p>
            {status === 'all'
              ? `${data?.meta?.total ?? 0} leads across the pipeline`
              : `${data?.meta?.total ?? 0} of ${totalLeads} leads`}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Lead</Button>
      </div>

      <div className="lead-board__tabs no-print">
        {LEAD_STATUS_PAGES.map((p) => (
          <NavLink
            key={p.status}
            to={`/crm/leads/status/${p.status}`}
            className={({ isActive }) => `lead-board__tab ${isActive ? 'is-active' : ''}`}
          >
            {p.label}
            <span className="lead-board__tab-count">
              {p.status === 'all' ? totalLeads : (countsByStatus[p.status] || 0)}
            </span>
          </NavLink>
        ))}
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
        searchPlaceholder="Search name, company, phone…"
        onRowClick={(row) => navigate(`/crm/leads/${row._id}`)}
        emptyTitle={status === 'all' ? 'No leads yet' : `No "${pageConfig.label}" leads`}
        emptyDescription={status === 'all'
          ? 'Add your first lead to start tracking the pipeline'
          : 'Leads moved to this status will appear here'}
        toolbarActions={selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            assigneeOptions={(usersData?.data || []).map((u) => ({ value: u.id, label: u.name }))}
            onAssign={handleBulkAssign}
            onExport={handleExport}
            onClear={() => setSelected(new Set())}
            assigning={assigning}
          />
        )}
      />

      <LeadFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
