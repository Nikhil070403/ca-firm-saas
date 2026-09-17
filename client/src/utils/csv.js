// Client-side CSV export — no backend endpoint needed, the rows are already
// in memory from whatever list the user has open. `columns` is
// [{ key, label }]; `accessor` optionally overrides how a row's value for
// that key is read (defaults to row[key]).
function escapeCsvValue(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function downloadCsv(filename, rows, columns) {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(c.accessor ? c.accessor(row) : row[c.key])).join(','));
  const csv = [header, ...lines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
