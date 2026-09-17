import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { PAYMENT_MODES } from '../services/billing.service';

export default function RecordPaymentModal({ isOpen, onClose, onSubmit, maxAmount }) {
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ amount: Number(amount), paymentMode, paymentReference });
      setAmount('');
      setPaymentReference('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} id="payment-form">
        <FormField label={`Amount (₹)${maxAmount ? ` — outstanding ${maxAmount}` : ''}`} error={error} required>
          <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} error={error} autoFocus />
        </FormField>
        <FormField label="Payment Mode">
          <Select options={PAYMENT_MODES.map((m) => ({ value: m, label: m.replace('_', ' ') }))} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} />
        </FormField>
        <FormField label="Reference (optional)">
          <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction ID, cheque #…" />
        </FormField>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="payment-form" type="submit" loading={submitting}>Record Payment</Button>
      </div>
    </Modal>
  );
}
