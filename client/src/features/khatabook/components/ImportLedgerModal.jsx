import { useState, useRef } from 'react';
import { UploadCloud, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { ledgerApi } from '../services/ledger.service';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import './ImportLedgerModal.css';

const TEMPLATE_ROWS = [
  ['Date', 'Type', 'Amount', 'Description', 'Reference'],
  ['2026-04-01', 'opening_balance', '5000', 'Opening balance', ''],
  ['2026-04-05', 'debit', '11800', 'Invoice INV-2026-0001', 'INV-2026-0001'],
  ['2026-04-12', 'credit', '5000', 'Payment received', 'UPI-8842'],
  ['2026-04-20', 'adjustment', '200', 'Rounding (increase)', ''],
];

function downloadTemplate() {
  const csv = TEMPLATE_ROWS.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ledger-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Bulk-import ledger entries from an Excel/CSV file. Shows a per-row error
 * report so a firm can fix and re-upload. The parent refetches on success.
 */
export default function ImportLedgerModal({ isOpen, clientId, onClose, onImported }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => { setFile(null); setResult(null); if (inputRef.current) inputRef.current.value = ''; };

  const handleClose = () => { reset(); onClose(); };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await ledgerApi.importExcel(clientId, file);
      setResult(res.data);
      if (res.data.created > 0) {
        toast.success(res.message);
        onImported();
      } else {
        toast.error('No valid rows found — check the file against the template');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import ledger from Excel"
      footer={(
        <>
          <Button variant="outline" onClick={handleClose}>Close</Button>
          <Button icon={UploadCloud} loading={busy} disabled={!file} onClick={handleUpload}>
            Import
          </Button>
        </>
      )}
    >
      <p className="import-ledger__intro">
        Upload an <strong>.xlsx</strong> or <strong>.csv</strong> file with columns
        <strong> Date, Type, Amount, Description, Reference</strong>. Type accepts
        <em> debit, credit, adjustment</em> or <em>opening_balance</em>. Balances are
        recalculated automatically after import.
      </p>

      <button type="button" className="import-ledger__template" onClick={downloadTemplate}>
        <Download size={15} /> Download template (.csv)
      </button>

      <label className="import-ledger__drop">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
          hidden
        />
        <FileSpreadsheet size={22} />
        <span>{file ? file.name : 'Choose a file to import'}</span>
      </label>

      {result && (
        <div className="import-ledger__result">
          <p>
            <strong>{result.created}</strong> imported
            {result.skipped ? <>, <strong>{result.skipped}</strong> skipped</> : null}
            {' · '}closing balance ₹{Number(result.closingBalance || 0).toLocaleString('en-IN')}
          </p>
          {result.errors?.length > 0 && (
            <div className="import-ledger__errors">
              <p><AlertTriangle size={14} /> Rows skipped:</p>
              <ul>
                {result.errors.slice(0, 12).map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
                {result.errors.length > 12 && <li>…and {result.errors.length - 12} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
