import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from '../services/billing.service';

const EMPTY_FORM = { title: '', category: 'office', amount: '', paymentMode: 'cash', notes: '', requiresApproval: false };

export default function ExpenseFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 2 || !form.amount || Number(form.amount) <= 0) {
      setError('Title and a valid amount are required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ ...form, amount: Number(form.amount) });
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} id="expense-form">
        <FormField label="Title" error={error} required>
          <Input value={form.title} onChange={handleChange('title')} error={error} autoFocus />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Category">
            <Select options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c.replace('_', ' ') }))} value={form.category} onChange={handleChange('category')} />
          </FormField>
          <FormField label="Amount (₹)" required>
            <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange('amount')} />
          </FormField>
        </div>
        <FormField label="Paid Via" hint="Cash goes to the Cash Book; everything else to the Bank Book">
          <Select
            options={PAYMENT_MODES.map((m) => ({ value: m, label: m.replace('_', ' ') }))}
            value={form.paymentMode}
            onChange={handleChange('paymentMode')}
          />
        </FormField>
        <FormField label="Notes">
          <Input value={form.notes} onChange={handleChange('notes')} />
        </FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer', marginTop: 4 }}>
          <input
            type="checkbox"
            checked={form.requiresApproval}
            onChange={(e) => setForm((prev) => ({ ...prev, requiresApproval: e.target.checked }))}
          />
          Submit for approval
        </label>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="expense-form" type="submit" loading={submitting}>Save Expense</Button>
      </div>
    </Modal>
  );
}
