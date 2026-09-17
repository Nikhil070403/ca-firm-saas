import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { LEAD_SOURCES } from '../services/lead.service';

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', source: 'other', estimatedValue: '' };

export default function LeadFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setError('Lead name is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ ...form, estimatedValue: Number(form.estimatedValue) || 0 });
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Lead">
      <form onSubmit={handleSubmit} id="lead-form">
        <FormField label="Name" error={error} required>
          <Input value={form.name} onChange={handleChange('name')} error={error} autoFocus />
        </FormField>
        <FormField label="Company">
          <Input value={form.company} onChange={handleChange('company')} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={handleChange('email')} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={handleChange('phone')} />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Source">
            <Select options={LEAD_SOURCES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} value={form.source} onChange={handleChange('source')} />
          </FormField>
          <FormField label="Estimated Value (₹)">
            <Input type="number" min="0" value={form.estimatedValue} onChange={handleChange('estimatedValue')} />
          </FormField>
        </div>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="lead-form" type="submit" loading={submitting}>Save Lead</Button>
      </div>
    </Modal>
  );
}
