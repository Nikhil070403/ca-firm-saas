import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { TASK_PRIORITIES } from '../services/task.service';

const EMPTY_FORM = { title: '', priority: 'medium', dueDate: '', description: '' };

export default function TaskFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      setError('Title is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task">
      <form onSubmit={handleSubmit} id="task-form">
        <FormField label="Title" error={error} required>
          <Input value={form.title} onChange={handleChange('title')} error={error} autoFocus />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Priority">
            <Select options={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))} value={form.priority} onChange={handleChange('priority')} />
          </FormField>
          <FormField label="Due Date">
            <Input type="date" value={form.dueDate} onChange={handleChange('dueDate')} />
          </FormField>
        </div>
        <FormField label="Description">
          <Input value={form.description} onChange={handleChange('description')} />
        </FormField>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="task-form" type="submit" loading={submitting}>Save Task</Button>
      </div>
    </Modal>
  );
}
