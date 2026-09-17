import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import useApiData from '../../../hooks/useApiData';
import { clientApi } from '../../clients/services/client.service';

const EMPTY_ITEM = { description: '', quantity: 1, rate: 0, taxPercent: 18 };

export default function InvoiceFormModal({ isOpen, onClose, onSubmit }) {
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: clientsResult } = useApiData(() => clientApi.list({ limit: 100, status: 'active' }), [], { skip: !isOpen });
  const clientOptions = (clientsResult?.data || []).map((c) => ({ value: c._id, label: c.displayName }));

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, item) => {
    const amount = Number(item.quantity) * Number(item.rate);
    return sum + amount + amount * (Number(item.taxPercent) / 100);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId || !dueDate) {
      setError('Client and due date are required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        clientId,
        dueDate,
        lineItems: items.map((i) => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), taxPercent: Number(i.taxPercent) })),
      });
      setClientId('');
      setDueDate('');
      setItems([{ ...EMPTY_ITEM }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice" size="lg">
      <form onSubmit={handleSubmit} id="invoice-form">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Client" error={error} required>
            <Select options={clientOptions} placeholder="Select client…" value={clientId} onChange={(e) => setClientId(e.target.value)} error={error} />
          </FormField>
          <FormField label="Due Date" required>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
        </div>

        <p style={{ fontSize: 12.5, fontWeight: 700, margin: '8px 0' }}>Line Items</p>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 70px 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
            <Input type="number" min="0" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
            <Input type="number" min="0" placeholder="Rate" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} />
            <Input type="number" min="0" placeholder="Tax %" value={item.taxPercent} onChange={(e) => updateItem(idx, 'taxPercent', e.target.value)} />
            <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <Button type="button" variant="ghost" icon={Plus} onClick={addItem} size="sm">Add line item</Button>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, fontSize: 14, fontWeight: 700 }}>
          Estimated Total: ₹{total.toFixed(2)}
        </div>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="invoice-form" type="submit" loading={submitting}>Create Invoice</Button>
      </div>
    </Modal>
  );
}
