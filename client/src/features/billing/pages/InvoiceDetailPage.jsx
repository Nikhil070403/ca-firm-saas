import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Wallet } from 'lucide-react';
import { invoiceApi, receiptApi, INVOICE_STATUSES } from '../services/billing.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import RecordPaymentModal from '../components/RecordPaymentModal';
import { formatCurrency, formatDate } from '../../../utils/format';

const STATUS_TONE = { draft: 'neutral', sent: 'primary', partially_paid: 'warning', paid: 'success', overdue: 'danger', cancelled: 'neutral' };

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { data: invoice, loading, refetch } = useApiData(() => invoiceApi.get(id), [id]);

  const handleStatusChange = async (e) => {
    try {
      await invoiceApi.updateStatus(id, e.target.value);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleRecordPayment = async (payload) => {
    try {
      await receiptApi.create({ ...payload, clientId: invoice.clientId._id, invoiceId: invoice._id });
      toast.success('Payment recorded');
      setPaymentModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) return <Spinner label="Loading invoice…" />;
  if (!invoice) return <EmptyState title="Invoice not found" />;

  const outstanding = invoice.grandTotal - invoice.amountPaid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/billing/invoices" className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to invoices
      </Link>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <Select options={INVOICE_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} value={invoice.status} onChange={handleStatusChange} style={{ width: 180 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" icon={Printer} onClick={() => window.print()}>Print</Button>
          {outstanding > 0 && <Button icon={Wallet} onClick={() => setPaymentModalOpen(true)}>Record Payment</Button>}
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: 0 }}>Invoice {invoice.invoiceNumber}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
              Issued {formatDate(invoice.issueDate)} &middot; Due {formatDate(invoice.dueDate)}
            </p>
          </div>
          <Badge tone={STATUS_TONE[invoice.status]}>{invoice.status.replace('_', ' ')}</Badge>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{invoice.clientId.displayName}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{invoice.clientId.email}</p>
          {invoice.clientId.gstNumber && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>GSTIN: {invoice.clientId.gstNumber}</p>}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)', fontSize: 11.5, textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '8px 4px' }}>Description</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Rate</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Tax %</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 4px' }}>{item.description}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>{item.taxPercent}%</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginLeft: 'auto', width: 260, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{formatCurrency(invoice.taxTotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, borderTop: '1px solid var(--color-border)', paddingTop: 6 }}>
            <span>Total</span><span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}><span>Paid</span><span>{formatCurrency(invoice.amountPaid)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: outstanding > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            <span>Outstanding</span><span>{formatCurrency(outstanding)}</span>
          </div>
        </div>
      </Card>

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleRecordPayment}
        maxAmount={formatCurrency(outstanding)}
      />
    </div>
  );
}
