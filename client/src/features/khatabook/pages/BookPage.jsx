import { useState, useMemo } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Printer } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import useApiData from '../../../hooks/useApiData';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../../utils/format';
import './BookPage.css';

const BOOKS = [
  { key: 'daybook', label: 'Day Book', kind: 'money', description: 'Every receipt and expense, chronologically' },
  { key: 'cashbook', label: 'Cash Book', kind: 'money', description: 'Cash receipts and cash expenses with running balance' },
  { key: 'bankbook', label: 'Bank Book', kind: 'money', description: 'Bank / UPI / cheque / card movements with running balance' },
  { key: 'sales', label: 'Sales Register', kind: 'sales', description: 'All invoices raised (excluding cancelled)' },
  { key: 'expenses', label: 'Expense Register', kind: 'money', description: 'All expenses recorded' },
];

const INVOICE_TONES = { draft: 'neutral', sent: 'primary', partially_paid: 'warning', paid: 'success', overdue: 'danger' };

function monthDefaults() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const toInput = (d) => d.toISOString().slice(0, 10);
  return { from: toInput(first), to: toInput(now) };
}

/**
 * Tally-style firm books over billing data. One page renders all five books
 * from the :book route param — same date-range filter, print-friendly.
 */
export default function BookPage() {
  const { book = 'daybook' } = useParams();
  const [range, setRange] = useState(monthDefaults());
  const bookConfig = BOOKS.find((b) => b.key === book) || BOOKS[0];

  const { data, loading, error } = useApiData(
    () => apiClient.get(`/khatabook/books/${book}`, { params: range }).then((r) => r.data.data),
    [book, range.from, range.to]
  );

  const rows = data?.rows || [];
  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({ inflow: acc.inflow + (r.inflow || 0), outflow: acc.outflow + (r.outflow || 0) }),
    { inflow: 0, outflow: 0 }
  ), [rows]);

  return (
    <div className="book-page">
      <div className="book-page__header">
        <div>
          <h1>{bookConfig.label}</h1>
          <p>{bookConfig.description}</p>
        </div>
        <Button variant="outline" icon={Printer} onClick={() => window.print()} className="no-print">
          Print
        </Button>
      </div>

      <div className="book-page__tabs no-print">
        {BOOKS.map((b) => (
          <NavLink
            key={b.key}
            to={`/khata/books/${b.key}`}
            className={({ isActive }) => `book-page__tab ${isActive ? 'is-active' : ''}`}
          >
            {b.label}
          </NavLink>
        ))}
      </div>

      <Card className="no-print" style={{ padding: 16 }}>
        <div className="book-page__filters">
          <label>
            From
            <input type="date" value={range.from} onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))} />
          </label>
          <label>
            To
            <input type="date" value={range.to} onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))} />
          </label>
        </div>
      </Card>

      {loading && <div style={{ padding: '40px 0' }}><Spinner label="Opening the book…" /></div>}
      {error && !loading && <Card><p style={{ margin: 0, color: 'var(--color-danger)' }}>Could not load this book.</p></Card>}

      {!loading && !error && rows.length === 0 && (
        <EmptyState title="No entries in this period" description="Change the date range, or record receipts/expenses/invoices first" />
      )}

      {!loading && !error && rows.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="book-page__scroll">
            <table className="book-page__table">
              <thead>
                {bookConfig.kind === 'sales' ? (
                  <tr>
                    <th>Date</th><th>Invoice</th><th>Client</th><th>GSTIN</th>
                    <th className="num">Taxable</th><th className="num">Tax</th>
                    <th className="num">Total</th><th className="num">Received</th><th>Status</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Date</th><th>Voucher</th><th>Particulars</th><th>Ref / Category</th><th>Mode</th>
                    <th className="num">Money In</th><th className="num">Money Out</th>
                    {book !== 'expenses' && <th className="num">Balance</th>}
                  </tr>
                )}
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  bookConfig.kind === 'sales' ? (
                    <tr key={idx}>
                      <td>{formatDate(row.date)}</td>
                      <td><strong>{row.reference}</strong></td>
                      <td>{row.particulars}</td>
                      <td>{row.gstNumber || '—'}</td>
                      <td className="num">{formatCurrency(row.taxable)}</td>
                      <td className="num">{formatCurrency(row.tax)}</td>
                      <td className="num"><strong>{formatCurrency(row.inflow)}</strong></td>
                      <td className="num">{formatCurrency(row.received)}</td>
                      <td><Badge tone={INVOICE_TONES[row.status] || 'neutral'}>{(row.status || '').replace(/_/g, ' ')}</Badge></td>
                    </tr>
                  ) : (
                    <tr key={idx}>
                      <td>{formatDate(row.date)}</td>
                      <td><Badge tone={row.voucherType === 'Receipt' ? 'success' : 'warning'}>{row.voucherType}</Badge></td>
                      <td>{row.particulars}</td>
                      <td style={{ textTransform: 'capitalize' }}>{row.reference || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{(row.mode || '').replace(/_/g, ' ')}</td>
                      <td className="num" style={{ color: row.inflow ? 'var(--color-success)' : undefined }}>
                        {row.inflow ? formatCurrency(row.inflow) : '—'}
                      </td>
                      <td className="num" style={{ color: row.outflow ? 'var(--color-danger)' : undefined }}>
                        {row.outflow ? formatCurrency(row.outflow) : '—'}
                      </td>
                      {book !== 'expenses' && <td className="num"><strong>{formatCurrency(row.balance)}</strong></td>}
                    </tr>
                  )
                ))}
              </tbody>
              <tfoot>
                {bookConfig.kind === 'sales' ? (
                  <tr>
                    <td colSpan={6}><strong>Total</strong></td>
                    <td className="num"><strong>{formatCurrency(totals.inflow)}</strong></td>
                    <td colSpan={2} />
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5}><strong>Total</strong></td>
                    <td className="num"><strong>{formatCurrency(totals.inflow)}</strong></td>
                    <td className="num"><strong>{formatCurrency(totals.outflow)}</strong></td>
                    {book !== 'expenses' && <td className="num"><strong>{formatCurrency(totals.inflow - totals.outflow)}</strong></td>}
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
