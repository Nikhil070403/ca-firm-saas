import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Receipt as ReceiptIcon, Wallet } from 'lucide-react';
import { invoiceApi } from '../services/billing.service';
import useApiData from '../../../hooks/useApiData';
import useCreateParam from '../../../hooks/useCreateParam';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import InvoiceFormModal from '../components/InvoiceFormModal';
import { formatCurrency, formatDate } from '../../../utils/format';

const STATUS_TONE = { draft: 'neutral', sent: 'primary', partially_paid: 'warning', paid: 'success', overdue: 'danger', cancelled: 'neutral' };

export default function InvoicesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  useCreateParam(() => setModalOpen(true));

  const { data, loading, error, refetch } = useApiData(
    () => invoiceApi.list({ page, limit: 20, search }),
    [page, search]
  );

  const handleCreate = async (payload) => {
    try {
      await invoiceApi.create(payload);
      toast.success('Invoice created');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', render: (i) => <strong>{i.invoiceNumber}</strong> },
    { key: 'clientId', label: 'Client', render: (i) => i.clientId?.displayName || '—' },
    { key: 'dueDate', label: 'Due Date', render: (i) => formatDate(i.dueDate) },
    { key: 'grandTotal', label: 'Total', render: (i) => formatCurrency(i.grandTotal) },
    { key: 'amountPaid', label: 'Paid', render: (i) => formatCurrency(i.amountPaid) },
    { key: 'status', label: 'Status', render: (i) => <Badge tone={STATUS_TONE[i.status]}>{i.status.replace('_', ' ')}</Badge> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Billing · Invoices</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            {data?.meta?.total ?? 0} invoices
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/billing/receipts"><Button variant="outline" icon={ReceiptIcon}>Receipts</Button></Link>
          <Link to="/billing/expenses"><Button variant="outline" icon={Wallet}>Expenses</Button></Link>
          <Button icon={Plus} onClick={() => setModalOpen(true)}>Create Invoice</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        error={error}
        page={page}
        limit={20}
        total={data?.meta?.total || 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search invoice #…"
        onRowClick={(row) => navigate(`/billing/invoices/${row._id}`)}
        emptyTitle="No invoices yet"
      />

      <InvoiceFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
