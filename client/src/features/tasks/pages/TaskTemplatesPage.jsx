import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, PlayCircle, ListChecks } from 'lucide-react';
import { taskTemplateApi } from '../services/taskTemplate.service';
import { clientApi } from '../../clients/services/client.service';
import { userApi } from '../../settings/services/settings.service';
import { TASK_PRIORITIES } from '../services/task.service';
import useApiData from '../../../hooks/useApiData';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { isAdminRole } from '../../../constants/roles';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';

const PRIORITY_TONES = { low: 'neutral', medium: 'primary', high: 'warning', urgent: 'danger' };
const EMPTY_TEMPLATE = { name: '', description: '', defaultPriority: 'medium', checklistItemsText: '' };
const EMPTY_APPLY = { clientId: '', assignedTo: '', dueDate: '', title: '' };

export default function TaskTemplatesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const canManage = isAdminRole(user?.role);

  const { data: templates, loading, refetch } = useApiData(() => taskTemplateApi.list(), []);
  const { data: clientsData } = useApiData(() => clientApi.list({ limit: 200, sort: 'displayName' }), []);
  const { data: usersData } = useApiData(() => userApi.list({ limit: 200 }), []);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [saving, setSaving] = useState(false);

  const [applyTemplate, setApplyTemplate] = useState(null);
  const [applyForm, setApplyForm] = useState(EMPTY_APPLY);
  const [applying, setApplying] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_TEMPLATE);
    setEditorOpen(true);
  };

  const openEdit = (t) => {
    setEditingId(t._id);
    setForm({
      name: t.name,
      description: t.description || '',
      defaultPriority: t.defaultPriority,
      checklistItemsText: (t.checklistItems || []).join('\n'),
    });
    setEditorOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Template name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        defaultPriority: form.defaultPriority,
        checklistItems: form.checklistItemsText.split('\n').map((l) => l.trim()).filter(Boolean),
      };
      if (editingId) {
        await taskTemplateApi.update(editingId, payload);
        toast.success('Template updated');
      } else {
        await taskTemplateApi.create(payload);
        toast.success('Template created');
      }
      setEditorOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await taskTemplateApi.remove(id);
      toast.success('Template deleted');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const openApply = (t) => {
    setApplyTemplate(t);
    setApplyForm(EMPTY_APPLY);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const task = await taskTemplateApi.apply(applyTemplate._id, {
        clientId: applyForm.clientId || undefined,
        assignedTo: applyForm.assignedTo || undefined,
        dueDate: applyForm.dueDate || undefined,
        title: applyForm.title.trim() || undefined,
      });
      toast.success('Task created from template');
      setApplyTemplate(null);
      navigate(`/crm/tasks/${task._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  const clientOptions = (clientsData?.data || []).map((c) => ({ value: c._id, label: c.displayName }));
  const userOptions = (usersData?.data || []).map((u) => ({ value: u.id, label: u.name }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Task Templates</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Reusable checklists for recurring workflows — apply one to instantly create a task
          </p>
        </div>
        {canManage && <Button icon={Plus} onClick={openNew}>New Template</Button>}
      </div>

      {loading ? (
        <Spinner label="Loading templates…" />
      ) : (templates || []).length === 0 ? (
        <EmptyState
          title="No templates yet"
          description={canManage ? 'Create your first workflow template, e.g. "Monthly GST Filing"' : 'Ask your admin to set up workflow templates'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {templates.map((t) => (
            <Card key={t._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <strong style={{ fontSize: 14.5 }}>{t.name}</strong>
                  <div style={{ marginTop: 4 }}>
                    <Badge tone={PRIORITY_TONES[t.defaultPriority]}>{t.defaultPriority}</Badge>
                  </div>
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => openEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(t._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              {t.description && <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '8px 0' }}>{t.description}</p>}
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0' }}>
                <ListChecks size={13} /> {t.checklistItems?.length || 0} checklist item{t.checklistItems?.length === 1 ? '' : 's'}
              </div>
              <Button size="sm" icon={PlayCircle} onClick={() => openApply(t)} style={{ width: '100%' }}>Apply to a client</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit Template' : 'New Template'}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button form="template-form" type="submit" loading={saving}>Save Template</Button>
          </>
        )}
      >
        <form id="template-form" onSubmit={handleSaveTemplate}>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} autoFocus />
          </FormField>
          <FormField label="Description">
            <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </FormField>
          <FormField label="Default priority">
            <Select
              options={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))}
              value={form.defaultPriority}
              onChange={(e) => setForm((p) => ({ ...p, defaultPriority: e.target.value }))}
            />
          </FormField>
          <FormField label="Checklist items" hint="One item per line">
            <Textarea
              rows={6}
              value={form.checklistItemsText}
              onChange={(e) => setForm((p) => ({ ...p, checklistItemsText: e.target.value }))}
              placeholder={'Collect Form 16\nVerify TDS credits\nPrepare draft return\nPartner sign-off'}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        isOpen={!!applyTemplate}
        onClose={() => setApplyTemplate(null)}
        title={applyTemplate ? `Apply "${applyTemplate.name}"` : ''}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setApplyTemplate(null)}>Cancel</Button>
            <Button form="apply-form" type="submit" loading={applying}>Create Task</Button>
          </>
        )}
      >
        <form id="apply-form" onSubmit={handleApply}>
          <FormField label="Title" hint={`Defaults to "${applyTemplate?.name}"`}>
            <Input value={applyForm.title} onChange={(e) => setApplyForm((p) => ({ ...p, title: e.target.value }))} />
          </FormField>
          <FormField label="Client">
            <Select
              placeholder="No client"
              options={clientOptions}
              value={applyForm.clientId}
              onChange={(e) => setApplyForm((p) => ({ ...p, clientId: e.target.value }))}
            />
          </FormField>
          <FormField label="Assign to">
            <Select
              placeholder="Unassigned"
              options={userOptions}
              value={applyForm.assignedTo}
              onChange={(e) => setApplyForm((p) => ({ ...p, assignedTo: e.target.value }))}
            />
          </FormField>
          <FormField label="Due date">
            <Input type="date" value={applyForm.dueDate} onChange={(e) => setApplyForm((p) => ({ ...p, dueDate: e.target.value }))} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
