import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, CalendarDays, ArrowLeft } from 'lucide-react';
import { userApi } from '../../settings/services/settings.service';
import { taskApi } from '../../tasks/services/task.service';
import { leadApi, LEAD_STATUS_TONES } from '../../crm/services/lead.service';
import { ROLE_LABELS } from '../../../constants/roles';
import useApiData from '../../../hooks/useApiData';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import DataTable from '../../../components/ui/DataTable';
import { formatDate } from '../../../utils/format';
import './UserProfilePage.css';

const TASK_TONES = { todo: 'neutral', in_progress: 'primary', in_review: 'warning', done: 'success', blocked: 'danger' };
const ROLE_TONE = { superadmin: 'warning', admin: 'primary', employee: 'neutral', user: 'neutral', client: 'success' };

/**
 * Team member profile — reachable from any table where a user's name
 * appears. Shows contact card plus the member's live workload (open tasks
 * and assigned leads).
 */
export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, loading, error } = useApiData(() => userApi.get(id), [id]);
  const { data: tasksData } = useApiData(
    () => taskApi.list({ assignedTo: id, limit: 10, sort: '-createdAt' }),
    [id]
  );
  const { data: leadsData } = useApiData(
    () => leadApi.list({ assignedTo: id, limit: 10, sort: '-createdAt' }),
    [id]
  );

  if (loading) return <div style={{ padding: '60px 0' }}><Spinner label="Loading profile…" /></div>;
  if (error || !user) {
    return (
      <Card>
        <p style={{ margin: 0 }}>This team member could not be loaded.</p>
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)} style={{ marginTop: 12 }}>
          Go back
        </Button>
      </Card>
    );
  }

  const tasks = tasksData?.data || [];
  const leads = leadsData?.data || [];
  const openTasks = tasks.filter((t) => !['done'].includes(t.status)).length;

  const taskColumns = [
    { key: 'title', label: 'Task', render: (t) => <strong>{t.title}</strong> },
    { key: 'status', label: 'Status', render: (t) => <Badge tone={TASK_TONES[t.status]}>{(t.status || '').replace(/_/g, ' ')}</Badge> },
    { key: 'priority', label: 'Priority', render: (t) => t.priority },
    { key: 'dueDate', label: 'Due', render: (t) => formatDate(t.dueDate) },
  ];

  const leadColumns = [
    { key: 'name', label: 'Lead', render: (l) => <strong>{l.name}</strong> },
    { key: 'company', label: 'Company', render: (l) => l.company || '—' },
    { key: 'status', label: 'Status', render: (l) => <Badge tone={LEAD_STATUS_TONES[l.status]}>{(l.status || '').replace(/_/g, ' ')}</Badge> },
    { key: 'createdAt', label: 'Added', render: (l) => formatDate(l.createdAt) },
  ];

  return (
    <div className="user-profile">
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} className="no-print">
        Back
      </Button>

      <Card>
        <div className="user-profile__head">
          <span className="user-profile__avatar">{user.name?.[0]?.toUpperCase()}</span>
          <div className="user-profile__identity">
            <h1>{user.name}</h1>
            <div className="user-profile__badges">
              <Badge tone={ROLE_TONE[user.role] || 'neutral'}>
                <ShieldCheck size={12} style={{ marginRight: 4 }} />{ROLE_LABELS[user.role] || user.role}
              </Badge>
              <Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'active' : 'inactive'}</Badge>
            </div>
          </div>
          <div className="user-profile__meta">
            <p><Mail size={14} /> {user.email}</p>
            {user.phone && <p><Phone size={14} /> {user.phone}</p>}
            <p><CalendarDays size={14} /> Joined {formatDate(user.createdAt)}</p>
          </div>
        </div>
      </Card>

      <div className="user-profile__stats">
        <Card><p className="user-profile__stat-label">Open Tasks</p><p className="user-profile__stat-value">{openTasks}</p></Card>
        <Card><p className="user-profile__stat-label">Recent Tasks</p><p className="user-profile__stat-value">{tasksData?.meta?.total ?? tasks.length}</p></Card>
        <Card><p className="user-profile__stat-label">Assigned Leads</p><p className="user-profile__stat-value">{leadsData?.meta?.total ?? leads.length}</p></Card>
        <Card><p className="user-profile__stat-label">Last Login</p><p className="user-profile__stat-value user-profile__stat-value--sm">{formatDate(user.lastLoginAt)}</p></Card>
      </div>

      <div className="user-profile__work">
        <div>
          <h2>Latest Tasks</h2>
          <DataTable
            columns={taskColumns}
            rows={tasks}
            onRowClick={(row) => navigate(`/crm/tasks/${row._id}`)}
            emptyTitle="No tasks assigned"
            emptyDescription="Tasks assigned to this member will appear here"
          />
        </div>
        <div>
          <h2>Assigned Leads</h2>
          <DataTable
            columns={leadColumns}
            rows={leads}
            onRowClick={(row) => navigate(`/crm/leads/${row._id}`)}
            emptyTitle="No leads assigned"
            emptyDescription="Leads owned by this member will appear here"
          />
        </div>
      </div>
    </div>
  );
}
