import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, X as XIcon } from 'lucide-react';
import { expenseApi } from '../services/billing.service';
import useApiData from '../../../hooks/useApiData';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { isAdminRole } from '../../../constants/roles';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Textarea from '../../../components/ui/Textarea';
import ExpenseFormModal from '../components/ExpenseFormModal';
import { formatCurrency, formatDate } from '../../../utils/format';

const APPROVAL_TONES = { pending: 'warning', approved: 'success', rejected: 'danger' };
const APPROVAL_LABELS = { pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected' };

export default function ExpensesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectingExpense, setRejectingExpense] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const canReview = isAdminRole(user?.role);

  const { data, loading, error, refetch } = useApiData(
    () => expenseApi.list({ page, limit: 20, search }),
    [page, search]
  );

  const handleCreate = async (payload) => {
    try {
      await expenseApi.create(payload);
      toast.success(payload.requiresApproval ? 'Expense recorded and submitted for approval' : 'Expense recorded');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseApi.remove(id);
      toast.success('Expense deleted');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleApprove = async (expense) => {
    setBusyId(expense._id);
    try {
      await expenseApi.review(expense._id, 'approved');
      toast.success('Expense approved');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingExpense) return;
    setBusyId(rejectingExpense._id);
    try {
      await expenseApi.review(rejectingExpense._id, 'rejected', rejectReason.trim() || undefined);
      toast.success('Expense rejected');
      setRejectingExpense(null);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (e) => <strong>{e.title}</strong> },
    { key: 'category', label: 'Category', render: (e) => <Badge tone="neutral">{e.category.replace('_', ' ')}</Badge> },
    { key: 'clientId', label: 'Client', render: (e) => e.clientId?.displayName || '—' },
    { key: 'amount', label: 'Amount', render: (e) => formatCurrency(e.amount) },
    { key: 'expenseDate', label: 'Date', render: (e) => formatDate(e.expenseDate) },
    {
      key: 'approvalStatus',
      label: 'Approval',
      render: (e) => (e.approvalStatus === 'not_required'
        ? <span style={{ color: 'var(--color-text-faint)' }}>—</span>
        : <Badge tone={APPROVAL_TONES[e.approvalStatus]}>{APPROVAL_LABELS[e.approvalStatus]}</Badge>),
    },
    {
      key: 'actions',
      label: '',
      render: (e) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {canReview && e.approvalStatus === 'pending' && (
            <>
              <button
                type="button"
                title="Approve"
                disabled={busyId === e._id}
                onClick={() => handleApprove(e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }}
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                title="Reject"
                disabled={busyId === e._id}
                onClick={() => { setRejectingExpense(e); setRejectReason(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
              >
                <XIcon size={16} />
              </button>
            </>
          )}
          <button type="button" onClick={() => handleDelete(e._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/billing/invoices" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to invoices
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Expenses</h1>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Expense</Button>
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
        searchPlaceholder="Search expenses…"
        emptyTitle="No expenses recorded yet"
      />

      <ExpenseFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />

      <Modal
        isOpen={!!rejectingExpense}
        onClose={() => setRejectingExpense(null)}
        title="Reject expense"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setRejectingExpense(null)}>Cancel</Button>
            <Button variant="danger" loading={busyId === rejectingExpense?._id} onClick={handleReject}>Reject</Button>
          </>
        )}
      >
        <FormField label="Reason (optional)" htmlFor="expense-reject-reason">
          <Textarea
            id="expense-reject-reason"
            rows={3}
            placeholder="Let the submitter know what needs fixing…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </FormField>
      </Modal>
    </div>
  );
}
