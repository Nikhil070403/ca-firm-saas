import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react';
import { taskApi, TASK_STATUSES, TASK_PRIORITIES } from '../services/task.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatDate, formatDateTime } from '../../../utils/format';

export default function TaskDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [checklistLabel, setChecklistLabel] = useState('');
  const [comment, setComment] = useState('');
  const [timeLog, setTimeLog] = useState({ minutes: '', note: '' });

  const { data: task, loading, refetch } = useApiData(() => taskApi.get(id), [id]);

  const handleFieldChange = async (field, value) => {
    try {
      await taskApi.update(id, { [field]: value });
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!checklistLabel.trim()) return;
    try {
      await taskApi.addChecklistItem(id, checklistLabel);
      setChecklistLabel('');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleToggleChecklist = async (itemId, isDone) => {
    try {
      await taskApi.toggleChecklistItem(id, itemId, !isDone);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleRemoveChecklist = async (itemId) => {
    try {
      await taskApi.removeChecklistItem(id, itemId);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await taskApi.addComment(id, comment);
      setComment('');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!timeLog.minutes) return;
    try {
      await taskApi.logTime(id, Number(timeLog.minutes), timeLog.note);
      setTimeLog({ minutes: '', note: '' });
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) return <Spinner label="Loading task…" />;
  if (!task) return <EmptyState title="Task not found" />;

  const totalMinutes = task.timeLogs.reduce((sum, t) => sum + t.minutes, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/crm/tasks" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to tasks
      </Link>

      <div>
        <h1 style={{ fontSize: 22, margin: 0 }}>{task.title}</h1>
        {task.description && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '6px 0 0' }}>{task.description}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Status</p>
          <Select options={TASK_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} value={task.status} onChange={(e) => handleFieldChange('status', e.target.value)} />
        </Card>
        <Card>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Priority</p>
          <Select options={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))} value={task.priority} onChange={(e) => handleFieldChange('priority', e.target.value)} />
        </Card>
        <Card>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Due Date</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{formatDate(task.dueDate)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Checklist" />
        <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input value={checklistLabel} onChange={(e) => setChecklistLabel(e.target.value)} placeholder="Add checklist item…" />
          <Button type="submit" icon={Plus} variant="secondary">Add</Button>
        </form>
        {task.checklist.length === 0 ? (
          <EmptyState title="No checklist items" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {task.checklist.map((item) => (
              <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <input type="checkbox" checked={item.isDone} onChange={() => handleToggleChecklist(item._id, item.isDone)} />
                <span style={{ flex: 1, textDecoration: item.isDone ? 'line-through' : 'none', color: item.isDone ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                  {item.label}
                </span>
                <button type="button" onClick={() => handleRemoveChecklist(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Comments" />
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment…" />
            <Button type="submit" variant="secondary">Post</Button>
          </form>
          {task.comments.length === 0 ? (
            <EmptyState title="No comments yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {task.comments.map((c) => (
                <div key={c._id} style={{ fontSize: 13 }}>
                  <strong>{c.authorId?.name || 'User'}</strong>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 11.5, marginLeft: 8 }}>{formatDateTime(c.createdAt)}</span>
                  <p style={{ margin: '2px 0 0' }}>{c.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Time Tracking" subtitle={`${totalMinutes} minutes logged`} action={<Clock size={16} color="var(--color-text-muted)" />} />
          <form onSubmit={handleLogTime} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input type="number" min="1" value={timeLog.minutes} onChange={(e) => setTimeLog((p) => ({ ...p, minutes: e.target.value }))} placeholder="Minutes" style={{ width: 100 }} />
            <Input value={timeLog.note} onChange={(e) => setTimeLog((p) => ({ ...p, note: e.target.value }))} placeholder="What did you work on?" />
            <Button type="submit" variant="secondary">Log</Button>
          </form>
          {task.timeLogs.length === 0 ? (
            <EmptyState title="No time logged yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {task.timeLogs.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{t.note || 'Time logged'}</span>
                  <Badge tone="primary">{t.minutes}m</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
