import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { REMINDER_CATEGORIES, RECURRENCE_TYPES } from '../services/reminder.service';

const EMPTY_FORM = { title: '', category: 'custom', dueDate: '', recurrence: 'none', description: '' };

export default function ReminderFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 2 || !form.dueDate) {
      setError('Title and due date are required');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Reminder">
      <form onSubmit={handleSubmit} id="reminder-form">
        <FormField label="Title" error={error} required>
          <Input value={form.title} onChange={handleChange('title')} error={error} autoFocus />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Category">
            <Select options={REMINDER_CATEGORIES.map((c) => ({ value: c, label: c.replace('_', ' ') }))} value={form.category} onChange={handleChange('category')} />
          </FormField>
          <FormField label="Due Date" required>
            <Input type="date" value={form.dueDate} onChange={handleChange('dueDate')} />
          </FormField>
        </div>
        <FormField label="Recurrence">
          <Select options={RECURRENCE_TYPES.map((r) => ({ value: r, label: r }))} value={form.recurrence} onChange={handleChange('recurrence')} />
        </FormField>
        <FormField label="Notes">
          <Input value={form.description} onChange={handleChange('description')} />
        </FormField>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="reminder-form" type="submit" loading={submitting}>Save Reminder</Button>
      </div>
    </Modal>
  );
}
