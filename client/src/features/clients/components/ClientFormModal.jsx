import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const FIRM_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'private_limited', label: 'Private Limited' },
  { value: 'public_limited', label: 'Public Limited' },
  { value: 'huf', label: 'HUF' },
  { value: 'trust', label: 'Trust' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = { displayName: '', firmType: 'individual', email: '', phone: '', gstNumber: '', panNumber: '' };

export default function ClientFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.displayName.trim().length < 2) {
      setError('Client name is required');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Client">
      <form
        onSubmit={handleSubmit}
        id="client-form"
      >
        <FormField label="Client / Firm name" error={error} required>
          <Input value={form.displayName} onChange={handleChange('displayName')} error={error} autoFocus />
        </FormField>
        <FormField label="Entity type">
          <Select options={FIRM_TYPES} value={form.firmType} onChange={handleChange('firmType')} />
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
          <FormField label="GST Number">
            <Input value={form.gstNumber} onChange={handleChange('gstNumber')} />
          </FormField>
          <FormField label="PAN Number">
            <Input value={form.panNumber} onChange={handleChange('panNumber')} />
          </FormField>
        </div>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="client-form" type="submit" loading={submitting}>Save Client</Button>
      </div>
    </Modal>
  );
}
