import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import useApiData from '../../../hooks/useApiData';
import { clientApi } from '../../clients/services/client.service';
import { PAYMENT_MODES } from '../services/billing.service';

const EMPTY_FORM = { clientId: '', amount: '', paymentMode: 'bank_transfer', paymentReference: '' };

export default function StandaloneReceiptModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: clientsResult } = useApiData(() => clientApi.list({ limit: 100, status: 'active' }), [], { skip: !isOpen });
  const clientOptions = (clientsResult?.data || []).map((c) => ({ value: c._id, label: c.displayName }));

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.amount || Number(form.amount) <= 0) {
      setError('Client and a valid amount are required');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Record Receipt">
      <form onSubmit={handleSubmit} id="standalone-receipt-form">
        <FormField label="Client" error={error} required>
          <Select options={clientOptions} placeholder="Select client…" value={form.clientId} onChange={handleChange('clientId')} error={error} />
        </FormField>
        <FormField label="Amount (₹)" required>
          <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange('amount')} />
        </FormField>
        <FormField label="Payment Mode">
          <Select options={PAYMENT_MODES.map((m) => ({ value: m, label: m.replace('_', ' ') }))} value={form.paymentMode} onChange={handleChange('paymentMode')} />
        </FormField>
        <FormField label="Reference (optional)">
          <Input value={form.paymentReference} onChange={handleChange('paymentReference')} />
        </FormField>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="standalone-receipt-form" type="submit" loading={submitting}>Record Receipt</Button>
      </div>
    </Modal>
  );
}
