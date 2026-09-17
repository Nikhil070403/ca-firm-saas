import { useState } from 'react';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import Button from '../ui/Button';

/** Reusable "N selected" toolbar — reassign or export the selection, or
 * clear it. Rendered inside DataTable's toolbarActions slot. */
export default function BulkActionBar({ count, assigneeOptions, onAssign, onExport, onClear, assigning }) {
  const [assignee, setAssignee] = useState('');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{count} selected</span>
      <Select
        placeholder="Assign to…"
        options={assigneeOptions}
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        style={{ width: 170 }}
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={!assignee}
        loading={assigning}
        onClick={() => onAssign(assignee)}
      >
        Assign
      </Button>
      <Button size="sm" variant="outline" onClick={onExport}>Export CSV</Button>
      <button
        type="button"
        onClick={onClear}
        title="Clear selection"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
