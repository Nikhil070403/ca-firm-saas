import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { leadApi, SELECTABLE_LEAD_STATUSES } from '../services/lead.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import UserLink from '../../../components/shared/UserLink';

const ACTIVITY_TYPES = ['note', 'call', 'meeting', 'email', 'follow_up'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [activityForm, setActivityForm] = useState({ type: 'note', summary: '', scheduledAt: '' });
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [converting, setConverting] = useState(false);

  const { data: lead, loading, refetch } = useApiData(() => leadApi.get(id), [id]);
  const { data: activities, refetch: refetchActivities } = useApiData(() => leadApi.listActivities(id), [id], { skip: !lead });

  const handleStatusChange = async (e) => {
    try {
      await leadApi.update(id, { status: e.target.value });
      toast.success('Status updated');
      refetch();
      refetchActivities();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (activityForm.summary.trim().length < 2) return;
    setSubmittingActivity(true);
    try {
      const payload = { type: activityForm.type, summary: activityForm.summary };
      if (activityForm.scheduledAt) payload.scheduledAt = new Date(activityForm.scheduledAt).toISOString();
      await leadApi.addActivity(id, payload);
      setActivityForm({ type: 'note', summary: '', scheduledAt: '' });
      refetchActivities();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const client = await leadApi.convert(id, {});
      toast.success('Lead converted to client');
      navigate(`/crm/clients/${client._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <Spinner label="Loading lead…" />;
  if (!lead) return <EmptyState title="Lead not found" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/crm/leads" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to leads
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>{lead.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>{lead.company}</p>
        </div>
        {lead.convertedClientId ? (
          <Badge tone="success">Converted</Badge>
        ) : (
          <Button icon={CheckCircle2} onClick={handleConvert} loading={converting}>Convert to Client</Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Details" />
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 10, fontSize: 13 }}>
            <dt style={{ color: 'var(--color-text-muted)' }}>Email</dt><dd style={{ margin: 0 }}>{lead.email || '—'}</dd>
            <dt style={{ color: 'var(--color-text-muted)' }}>Phone</dt><dd style={{ margin: 0 }}>{lead.phone || '—'}</dd>
            <dt style={{ color: 'var(--color-text-muted)' }}>Source</dt><dd style={{ margin: 0 }}>{lead.source.replace('_', ' ')}</dd>
            <dt style={{ color: 'var(--color-text-muted)' }}>Est. Value</dt><dd style={{ margin: 0 }}>{formatCurrency(lead.estimatedValue)}</dd>
            <dt style={{ color: 'var(--color-text-muted)' }}>Owner</dt><dd style={{ margin: 0 }}><UserLink user={lead.assignedTo} /></dd>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Status" />
          <Select
            // Show the trimmed pipeline, but include the lead's current status
            // if it's a legacy/converted one so the dropdown still reflects it.
            options={(SELECTABLE_LEAD_STATUSES.includes(lead.status)
              ? SELECTABLE_LEAD_STATUSES
              : [lead.status, ...SELECTABLE_LEAD_STATUSES]
            ).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
            value={lead.status}
            onChange={handleStatusChange}
            disabled={Boolean(lead.convertedClientId)}
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Activity Log" subtitle="Notes, calls, meetings, emails and follow-ups" />

        <form onSubmit={handleAddActivity} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Select
            options={ACTIVITY_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))}
            value={activityForm.type}
            onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value }))}
            style={{ width: 140, flexShrink: 0 }}
          />
          <Textarea
            value={activityForm.summary}
            onChange={(e) => setActivityForm((prev) => ({ ...prev, summary: e.target.value }))}
            placeholder="Log a note, call outcome, meeting summary…"
            style={{ minHeight: 40, flex: 1 }}
          />
          {['follow_up', 'call', 'meeting'].includes(activityForm.type) && (
            <input
              type="datetime-local"
              value={activityForm.scheduledAt}
              onChange={(e) => setActivityForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
              title="Schedule it — scheduled items appear on the Follow-ups board"
              style={{
                border: '1px solid var(--color-border)', borderRadius: 8, padding: '0 10px',
                background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: 13,
              }}
            />
          )}
          <Button type="submit" loading={submittingActivity}>Log</Button>
        </form>

        {!activities || activities.length === 0 ? (
          <EmptyState title="No activity logged yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activities.map((activity) => (
              <div key={activity._id} style={{ fontSize: 13, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Badge tone="primary">{activity.type.replace('_', ' ')}</Badge>
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(activity.createdAt)}</span>
                </div>
                <p style={{ margin: '6px 0 0' }}>{activity.summary}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
