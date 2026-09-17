import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutList, Columns3 } from 'lucide-react';
import { taskApi } from '../services/task.service';
import useApiData from '../../../hooks/useApiData';
import useCreateParam from '../../../hooks/useCreateParam';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import TaskFormModal from '../components/TaskFormModal';
import TaskBoard from '../components/TaskBoard';
import UserLink from '../../../components/shared/UserLink';
import { formatDate } from '../../../utils/format';

const STATUS_TONE = { todo: 'neutral', in_progress: 'primary', in_review: 'warning', done: 'success', blocked: 'danger' };
const PRIORITY_TONE = { low: 'neutral', medium: 'primary', high: 'warning', urgent: 'danger' };

export default function TasksPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [view, setView] = useState(() => localStorage.getItem('tasks.view') || 'board');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  useCreateParam(() => setModalOpen(true));

  // Board needs the whole set to lay out columns; list stays paginated.
  const { data, loading, error, refetch } = useApiData(
    () => (view === 'board'
      ? taskApi.list({ limit: 200, sort: '-createdAt' })
      : taskApi.list({ page, limit: 20, search })),
    [view, page, search]
  );

  const switchView = (next) => {
    localStorage.setItem('tasks.view', next);
    setView(next);
  };

  const handleCreate = async (payload) => {
    try {
      await taskApi.create(payload);
      toast.success('Task created');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleMove = async (task, stage) => {
    try {
      await taskApi.update(task._id, { stage });
      toast.success(`"${task.title}" moved to ${stage.replace(/_/g, ' ')}`);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
      refetch();
    }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (t) => <strong>{t.title}</strong> },
    { key: 'clientId', label: 'Client', render: (t) => t.clientId?.displayName || '—' },
    { key: 'assignedTo', label: 'Assigned To', render: (t) => <UserLink user={t.assignedTo} /> },
    { key: 'dueDate', label: 'Due Date', render: (t) => formatDate(t.dueDate) },
    { key: 'priority', label: 'Priority', render: (t) => <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge> },
    { key: 'stage', label: 'Stage', render: (t) => (t.stage || 'document_collection').replace(/_/g, ' ') },
    { key: 'status', label: 'Status', render: (t) => <Badge tone={STATUS_TONE[t.status]}>{t.status.replace('_', ' ')}</Badge> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Tasks</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            {view === 'board' ? 'Drag cards across the filing workflow' : `${data?.meta?.total ?? 0} tasks`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant={view === 'board' ? 'secondary' : 'ghost'}
            icon={Columns3}
            onClick={() => switchView('board')}
          >
            Board
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            icon={LayoutList}
            onClick={() => switchView('list')}
          >
            List
          </Button>
          <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Task</Button>
        </div>
      </div>

      {view === 'board' ? (
        loading
          ? <div style={{ padding: '50px 0' }}><Spinner label="Loading board…" /></div>
          : <TaskBoard tasks={data?.data || []} onMove={handleMove} />
      ) : (
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
          searchPlaceholder="Search tasks…"
          onRowClick={(row) => navigate(`/crm/tasks/${row._id}`)}
          emptyTitle="No tasks yet"
        />
      )}

      <TaskFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
