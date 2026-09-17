import { useMemo, useState } from 'react';
import { Plus, Check, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { reminderApi } from '../services/reminder.service';
import useApiData from '../../../hooks/useApiData';
import useCreateParam from '../../../hooks/useCreateParam';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import ReminderFormModal from '../components/ReminderFormModal';
import MonthCalendar from '../components/MonthCalendar';
import { formatDate } from '../../../utils/format';

const STATUS_TONE = { pending: 'neutral', sent: 'primary', completed: 'success', dismissed: 'neutral', overdue: 'danger' };

export default function RemindersPage() {
  const toast = useToast();
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  useCreateParam(() => setModalOpen(true));
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data, loading, error, refetch } = useApiData(
    () => reminderApi.list({ page, limit: 20, search }),
    [page, search],
    { skip: view !== 'list' }
  );

  const monthRange = useMemo(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [cursor]);

  const { data: calendarReminders, refetch: refetchCalendar } = useApiData(
    () => reminderApi.calendar(monthRange),
    [monthRange.from, monthRange.to],
    { skip: view !== 'calendar' }
  );

  const handleCreate = async (payload) => {
    try {
      await reminderApi.create(payload);
      toast.success('Reminder created');
      setModalOpen(false);
      refetch();
      refetchCalendar();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleComplete = async (id) => {
    try {
      await reminderApi.complete(id);
      toast.success('Marked complete');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (r) => <strong>{r.title}</strong> },
    { key: 'category', label: 'Category', render: (r) => r.category.replace('_', ' ') },
    { key: 'clientId', label: 'Client', render: (r) => r.clientId?.displayName || '—' },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => r.status !== 'completed' && (
        <Button size="sm" variant="secondary" icon={Check} onClick={() => handleComplete(r._id)}>Complete</Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Reminders</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Compliance deadlines and custom reminders
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} icon={List} onClick={() => setView('list')}>List</Button>
          <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} icon={CalendarIcon} onClick={() => setView('calendar')}>Calendar</Button>
          <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Reminder</Button>
        </div>
      </div>

      {view === 'list' ? (
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
          searchPlaceholder="Search reminders…"
          emptyTitle="No reminders yet"
        />
      ) : (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Button variant="ghost" icon={ChevronLeft} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} />
            <strong>{cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>
            <Button variant="ghost" icon={ChevronRight} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} />
          </div>
          <MonthCalendar
            year={cursor.getFullYear()}
            month={cursor.getMonth()}
            reminders={calendarReminders || []}
            onSelectDay={(day, items) => setSelectedDay({ day, items })}
          />
          {selectedDay && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Reminders on {selectedDay.day}</p>
              {selectedDay.items.map((r) => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
                  <span>{r.title}</span>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <ReminderFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
