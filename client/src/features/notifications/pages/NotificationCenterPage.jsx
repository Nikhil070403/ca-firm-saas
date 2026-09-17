import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing, CheckCheck, ListChecks, MessageSquare, Receipt, Users,
  Sparkles, FileCheck2, IndianRupee, AlertTriangle,
} from 'lucide-react';
import { notificationApi } from '../../reminders/services/notification.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import { formatDateTime } from '../../../utils/format';
import './NotificationCenterPage.css';

const TYPE_META = {
  reminder_due: { label: 'Reminder', icon: BellRing },
  task_assigned: { label: 'Task', icon: ListChecks },
  task_comment: { label: 'Task', icon: MessageSquare },
  invoice_overdue: { label: 'Billing', icon: Receipt },
  lead_followup: { label: 'CRM', icon: Users },
  system: { label: 'System', icon: Sparkles },
  compliance_reminder: { label: 'Compliance', icon: FileCheck2 },
  compliance_filed: { label: 'Compliance', icon: FileCheck2 },
  tax_payable: { label: 'Tax', icon: IndianRupee },
  invoice_followup: { label: 'Billing', icon: Receipt },
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'reminder_due', label: 'Reminders' },
  { value: 'task_assigned', label: 'Tasks' },
  { value: 'compliance_reminder', label: 'Compliance' },
  { value: 'invoice_overdue', label: 'Billing' },
];

/**
 * Full history of every in-app notification, not just the last 8 in the
 * bell dropdown. Filterable by type, with per-item and mark-all read.
 */
export default function NotificationCenterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const params = filter === 'unread'
    ? { unreadOnly: 'true', page, limit: 20 }
    : { ...(filter ? { type: filter } : {}), page, limit: 20 };

  const { data, loading, error, refetch } = useApiData(
    () => notificationApi.list(params),
    [filter, page]
  );

  const items = data?.data || [];
  const unreadCount = data?.meta?.unreadCount || 0;

  const handleMarkRead = async (n) => {
    if (n.status === 'read') {
      if (n.link) navigate(n.link);
      return;
    }
    try {
      await notificationApi.markRead(n._id);
      refetch();
      if (n.link) navigate(n.link);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      toast.success('All notifications marked read');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="notif-center">
      <div className="notif-center__header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" icon={CheckCheck} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="notif-center__filters no-print">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`notif-center__filter ${filter === f.value ? 'is-active' : ''}`}
            onClick={() => { setFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: '50px 0' }}><Spinner label="Loading notifications…" /></div>}
      {error && !loading && (
        <Card><p style={{ margin: 0, color: 'var(--color-danger)' }}><AlertTriangle size={14} /> Could not load notifications.</p></Card>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="Nothing here" description="Notifications about tasks, compliance, reminders and billing will show up here" />
      )}

      {!loading && !error && items.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div className="notif-center__list">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || { label: 'Update', icon: Sparkles };
              const Icon = meta.icon;
              return (
                <button
                  key={n._id}
                  type="button"
                  className={`notif-center__item ${n.status !== 'read' ? 'is-unread' : ''}`}
                  onClick={() => handleMarkRead(n)}
                >
                  <span className="notif-center__icon"><Icon size={16} /></span>
                  <span className="notif-center__body">
                    <span className="notif-center__title-row">
                      <strong>{n.title}</strong>
                      <span className="notif-center__type">{meta.label}</span>
                    </span>
                    <span className="notif-center__message">{n.message}</span>
                  </span>
                  <span className="notif-center__time">{formatDateTime(n.createdAt)}</span>
                  {n.status !== 'read' && <span className="notif-center__dot" />}
                </button>
              );
            })}
          </div>
          {data?.meta?.totalPages > 1 && (
            <div className="notif-center__pagination">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span>Page {page} of {data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
