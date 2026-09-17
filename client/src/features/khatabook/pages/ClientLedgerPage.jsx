import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, Upload } from 'lucide-react';
import { ledgerApi } from '../services/ledger.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import LedgerEntryFormModal from '../components/LedgerEntryFormModal';
import ImportLedgerModal from '../components/ImportLedgerModal';
import { formatCurrency, formatDate } from '../../../utils/format';

const TYPE_TONE = { debit: 'danger', credit: 'success', opening_balance: 'neutral', adjustment: 'warning' };

export default function ClientLedgerPage() {
  const { clientId } = useParams();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, loading, error, refetch } = useApiData(() => ledgerApi.statement(clientId), [clientId]);

  const handleAddEntry = async (payload) => {
    try {
      await ledgerApi.addEntry(payload);
      toast.success('Entry recorded');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) return <Spinner label="Loading ledger…" />;
  if (error) return <EmptyState title="Couldn't load ledger" description={error} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/khata" className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to Khata Book
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>{data.client.displayName}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>Ledger statement</p>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" icon={Printer} onClick={() => window.print()}>Print</Button>
          <Button variant="outline" icon={Upload} onClick={() => setImportOpen(true)}>Import Excel</Button>
          <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Entry</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Opening Balance</p>
          <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 800 }}>{formatCurrency(data.openingBalance)}</p>
        </Card>
        <Card>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Closing Balance</p>
          <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 800 }}>{formatCurrency(data.closingBalance)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Transactions" />
        {data.entries.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)', fontSize: 11.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                  <th style={{ padding: '8px 10px' }}>Type</th>
                  <th style={{ padding: '8px 10px' }}>Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px' }}>{formatDate(entry.entryDate)}</td>
                    <td style={{ padding: '10px' }}><Badge tone={TYPE_TONE[entry.entryType]}>{entry.entryType.replace('_', ' ')}</Badge></td>
                    <td style={{ padding: '10px' }}>{entry.description}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(entry.amount)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(entry.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LedgerEntryFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddEntry} clientId={clientId} />

      <ImportLedgerModal
        isOpen={importOpen}
        clientId={clientId}
        onClose={() => setImportOpen(false)}
        onImported={refetch}
      />
    </div>
  );
}
