import { useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw, IndianRupee } from 'lucide-react';
import { complianceApi, RETURN_TYPE_LABELS } from '../services/compliance.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import { formatCurrency, formatDate } from '../../../utils/format';
import './CompliancePage.css';

const TABS = [
  { key: 'gstr1', label: 'GSTR-1', filter: { returnType: 'gstr1' }, hint: 'Monthly due 11th · Quarterly due 13th · reminders from the 4th' },
  { key: 'gstr3b', label: 'GSTR-3B', filter: { returnType: 'gstr3b' }, hint: 'Monthly due 20th · Quarterly due 24th · reminders from the 14th' },
  { key: 'yearly', label: 'Yearly (ITR · 9C · ROC · Audit)', filter: { frequency: 'yearly' }, hint: 'ITR 31 Jul · Audit 30 Sep · ROC 30 Nov · GSTR-9C 31 Dec' },
];

function statusOf(ret) {
  if (ret.status === 'filed') return { label: 'filed', tone: 'success' };
  if (new Date(ret.dueDate) < new Date()) return { label: 'overdue', tone: 'danger' };
  return { label: 'pending', tone: 'warning' };
}

/**
 * The statutory workboard: every client's returns for the current period,
 * split by return type. "Mark Filed" emails the client a confirmation;
 * setting tax payable on a 3B emails the amount.
 */
export default function CompliancePage() {
  const { tab = 'gstr1' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [taxTarget, setTaxTarget] = useState(null);
  const [taxAmount, setTaxAmount] = useState('');

  const tabConfig = TABS.find((t) => t.key === tab) || TABS[0];

  const { data, loading, error, refetch } = useApiData(
    () => complianceApi.list({ page, limit: 20, sort: 'dueDate', ...tabConfig.filter }),
    [page, tab]
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await complianceApi.generate();
      toast.success(res.message || 'Returns generated');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkFiled = async (ret) => {
    try {
      await complianceApi.markFiled(ret._id);
      toast.success(`${RETURN_TYPE_LABELS[ret.returnType]} marked filed — client notified`);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleSaveTax = async (e) => {
    e.preventDefault();
    const amount = Number(taxAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await complianceApi.setTaxPayable(taxTarget._id, amount);
      toast.success('Tax payable saved — client notified by email');
      setTaxTarget(null);
      setTaxAmount('');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const columns = [
    {
      key: 'client',
      label: 'Client',
      render: (r) => (
        <button
          type="button"
          className="entity-link"
          onClick={(e) => { e.stopPropagation(); r.clientId?._id && navigate(`/crm/clients/${r.clientId._id}`); }}
        >
          <strong>{r.clientId?.displayName || '—'}</strong>
        </button>
      ),
    },
    ...(tab === 'yearly'
      ? [{ key: 'returnType', label: 'Filing', render: (r) => RETURN_TYPE_LABELS[r.returnType] }]
      : [{ key: 'frequency', label: 'Frequency', render: (r) => r.frequency }]),
    { key: 'periodLabel', label: 'Period', render: (r) => r.periodLabel },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const s = statusOf(r);
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    ...(tab === 'gstr3b' ? [{
      key: 'taxPayable',
      label: 'Tax Payable',
      render: (r) => (r.taxPayable != null ? formatCurrency(r.taxPayable) : '—'),
    }] : []),
    { key: 'filedAt', label: 'Filed On', render: (r) => formatDate(r.filedAt) },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <span style={{ display: 'inline-flex', gap: 6 }}>
          {tab === 'gstr3b' && r.status !== 'filed' && (
            <Button
              size="sm"
              variant="outline"
              icon={IndianRupee}
              onClick={(e) => { e.stopPropagation(); setTaxTarget(r); setTaxAmount(r.taxPayable ?? ''); }}
            >
              Tax
            </Button>
          )}
          {r.status !== 'filed' && (
            <Button
              size="sm"
              icon={CheckCircle2}
              onClick={(e) => { e.stopPropagation(); handleMarkFiled(r); }}
            >
              Mark Filed
            </Button>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="compliance">
      <div className="compliance__header">
        <div>
          <h1>Compliance</h1>
          <p>{tabConfig.hint}. Clients are reminded daily by email until filed.</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} loading={generating} onClick={handleGenerate}>
          Generate current period
        </Button>
      </div>

      <div className="compliance__tabs no-print">
        {TABS.map((t) => (
          <NavLink
            key={t.key}
            to={`/crm/compliance/${t.key}`}
            className={({ isActive }) => `compliance__tab ${isActive ? 'is-active' : ''}`}
          >
            {t.label}
          </NavLink>
        ))}
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
        emptyTitle="No returns generated yet"
        emptyDescription="Set a client's compliance settings on their profile, then click 'Generate current period'"
      />

      <Modal
        isOpen={Boolean(taxTarget)}
        onClose={() => setTaxTarget(null)}
        title={`Tax payable — ${taxTarget?.clientId?.displayName || ''} (${taxTarget?.periodLabel || ''})`}
        size="sm"
        footer={(
          <>
            <Button variant="outline" onClick={() => setTaxTarget(null)}>Cancel</Button>
            <Button form="tax-form" type="submit">Save & notify client</Button>
          </>
        )}
      >
        <form id="tax-form" onSubmit={handleSaveTax}>
          <FormField label="Tax payable (₹)" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              autoFocus
            />
          </FormField>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)' }}>
            The client is emailed this amount immediately after saving.
          </p>
        </form>
      </Modal>
    </div>
  );
}
