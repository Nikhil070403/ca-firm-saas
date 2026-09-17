import { useState } from 'react';
import { Plus, Trash2, Edit2, Users2 } from 'lucide-react';
import { departmentApi } from '../services/department.service';
import { userApi } from '../../settings/services/settings.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';

const EMPTY_FORM = { name: '', headUserId: '' };

export default function DepartmentsPage() {
  const toast = useToast();
  const { data: departments, loading, refetch } = useApiData(() => departmentApi.list(), []);
  const { data: usersData } = useApiData(() => userApi.list({ limit: 200 }), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditingId(d._id);
    setForm({ name: d.name, headUserId: d.headUserId?._id || d.headUserId || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Department name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), headUserId: form.headUserId || null };
      if (editingId) {
        await departmentApi.update(editingId, payload);
        toast.success('Department updated');
      } else {
        await departmentApi.create(payload);
        toast.success('Department created');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await departmentApi.remove(id);
      toast.success('Department deleted');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const userOptions = (usersData?.data || []).map((u) => ({ value: u.id, label: u.name }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Departments</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Group your team and set a department head
          </p>
        </div>
        <Button icon={Plus} onClick={openNew}>New Department</Button>
      </div>

      {loading ? (
        <Spinner label="Loading departments…" />
      ) : (departments || []).length === 0 ? (
        <EmptyState title="No departments yet" description="Create your first department, e.g. Taxation or Audit" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {departments.map((d) => (
            <Card key={d._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: 14.5 }}>{d.name}</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => openEdit(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(d._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '8px 0' }}>
                Head: {d.headUserId?.name || 'Not assigned'}
              </p>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users2 size={13} /> {d.memberCount} member{d.memberCount === 1 ? '' : 's'}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Department' : 'New Department'}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="department-form" type="submit" loading={saving}>Save</Button>
          </>
        )}
      >
        <form id="department-form" onSubmit={handleSubmit}>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} autoFocus />
          </FormField>
          <FormField label="Department Head">
            <Select
              placeholder="Not assigned"
              options={userOptions}
              value={form.headUserId}
              onChange={(e) => setForm((p) => ({ ...p, headUserId: e.target.value }))}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
