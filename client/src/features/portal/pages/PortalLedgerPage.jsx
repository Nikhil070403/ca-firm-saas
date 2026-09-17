import { Printer } from 'lucide-react';
import { portalApi } from '../services/portal.service';
import useApiData from '../../../hooks/useApiData';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../../utils/format';

const TYPE_TONE = { debit: 'danger', credit: 'success', opening_balance: 'neutral', adjustment: 'warning' };

/** Read-only ledger statement — the same numbers the firm sees, no editing. */
export default function PortalLedgerPage() {
  const { data, loading, error } = useApiData(() => portalApi.ledger(), []);

  if (loading) return <div style={{ padding: '60px 0' }}><Spinner label="Loading ledger…" /></div>;
  if (error || !data) return <EmptyState title="Couldn't load your ledger" description={error} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Ledger Statement</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>Your account with the firm</p>
        </div>
        <Button variant="outline" icon={Printer} onClick={() => window.print()} className="no-print">Print</Button>
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
    </div>
  );
}
