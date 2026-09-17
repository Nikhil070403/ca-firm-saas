import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { receiptApi } from '../services/billing.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import StandaloneReceiptModal from '../components/StandaloneReceiptModal';
import { formatCurrency, formatDate } from '../../../utils/format';

export default function ReceiptsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useApiData(
    () => receiptApi.list({ page, limit: 20, search }),
    [page, search]
  );

  const handleCreate = async (payload) => {
    try {
      await receiptApi.create(payload);
      toast.success('Receipt recorded');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const columns = [
    { key: 'receiptNumber', label: 'Receipt #', render: (r) => <strong>{r.receiptNumber}</strong> },
    { key: 'clientId', label: 'Client', render: (r) => r.clientId?.displayName || '—' },
    { key: 'invoiceId', label: 'Invoice', render: (r) => r.invoiceId?.invoiceNumber || '—' },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'paymentMode', label: 'Mode', render: (r) => r.paymentMode.replace('_', ' ') },
    { key: 'receivedDate', label: 'Date', render: (r) => formatDate(r.receivedDate) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/billing/invoices" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to invoices
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Receipts</h1>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Record Receipt</Button>
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
        searchPlaceholder="Search receipt #…"
        emptyTitle="No receipts yet"
      />

      <StandaloneReceiptModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
