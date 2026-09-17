import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const ENTRY_TYPES = [
  { value: 'debit', label: 'Debit (client owes more)' },
  { value: 'credit', label: 'Credit (payment received)' },
  { value: 'adjustment', label: 'Adjustment' },
];

const EMPTY_FORM = { entryType: 'debit', amount: '', description: '', direction: 'increase' };

export default function LedgerEntryFormModal({ isOpen, onClose, onSubmit, clientId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (form.description.trim().length < 2) {
      setError('Description is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ ...form, clientId, amount: Number(form.amount) });
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Ledger Entry">
      <form onSubmit={handleSubmit} id="ledger-entry-form">
        <FormField label="Entry Type">
          <Select options={ENTRY_TYPES} value={form.entryType} onChange={handleChange('entryType')} />
        </FormField>
        {form.entryType === 'adjustment' && (
          <FormField label="Direction">
            <Select
              options={[{ value: 'increase', label: 'Increase balance' }, { value: 'decrease', label: 'Decrease balance' }]}
              value={form.direction}
              onChange={handleChange('direction')}
            />
          </FormField>
        )}
        <FormField label="Amount (₹)" error={error} required>
          <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange('amount')} error={error} />
        </FormField>
        <FormField label="Description" required>
          <Input value={form.description} onChange={handleChange('description')} placeholder="e.g. Advisory fee for June" />
        </FormField>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="ledger-entry-form" type="submit" loading={submitting}>Save Entry</Button>
      </div>
    </Modal>
  );
}
