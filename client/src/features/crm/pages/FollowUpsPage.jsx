import { useNavigate } from 'react-router-dom';
import { CheckCircle2, PhoneCall, CalendarClock, Users } from 'lucide-react';
import { leadApi, LEAD_STATUS_TONES } from '../services/lead.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import UserLink from '../../../components/shared/UserLink';
import { formatDateTime } from '../../../utils/format';

const TYPE_ICONS = { follow_up: CalendarClock, call: PhoneCall, meeting: Users };

/**
 * Every scheduled, not-yet-completed follow-up / call / meeting across all
 * leads, soonest first. Overdue rows are flagged so the team clears them
 * before today's new work.
 */
export default function FollowUpsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: followUps, loading, error, refetch } = useApiData(() => leadApi.upcomingFollowUps(), []);

  const handleComplete = async (activity) => {
    try {
      await leadApi.completeFollowUp(activity._id);
      toast.success('Marked complete');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const now = Date.now();
  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (a) => {
        const Icon = TYPE_ICONS[a.type] || CalendarClock;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textTransform: 'capitalize' }}>
            <Icon size={14} /> {(a.type || '').replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'lead',
      label: 'Lead',
      render: (a) => <strong>{a.leadId?.name || '—'}</strong>,
    },
    { key: 'company', label: 'Company', render: (a) => a.leadId?.company || '—' },
    {
      key: 'leadStatus',
      label: 'Lead Status',
      render: (a) => a.leadId?.status
        ? <Badge tone={LEAD_STATUS_TONES[a.leadId.status]}>{a.leadId.status.replace(/_/g, ' ')}</Badge>
        : '—',
    },
    { key: 'summary', label: 'What', render: (a) => a.summary },
    {
      key: 'scheduledAt',
      label: 'When',
      render: (a) => {
        const overdue = a.scheduledAt && new Date(a.scheduledAt).getTime() < now;
        return (
          <span style={{ color: overdue ? 'var(--color-danger)' : 'inherit', fontWeight: overdue ? 600 : 400 }}>
            {formatDateTime(a.scheduledAt)}{overdue ? ' · overdue' : ''}
          </span>
        );
      },
    },
    { key: 'performedBy', label: 'Owner', render: (a) => <UserLink user={a.performedBy} /> },
    {
      key: 'actions',
      label: '',
      render: (a) => (
        <Button
          size="sm"
          variant="outline"
          icon={CheckCircle2}
          onClick={(e) => { e.stopPropagation(); handleComplete(a); }}
        >
          Done
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Follow-ups</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          {followUps?.length ?? 0} scheduled follow-ups, calls and meetings pending
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={followUps || []}
        loading={loading}
        error={error}
        onRowClick={(row) => row.leadId?._id && navigate(`/crm/leads/${row.leadId._id}`)}
        emptyTitle="Nothing scheduled"
        emptyDescription="Log a follow-up, call or meeting with a date on any lead and it will show up here"
      />
    </div>
  );
}
