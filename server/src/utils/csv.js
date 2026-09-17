/**
 * Minimal CSV writer — no papaparse/csv-stringify dependency for what's a
 * handful of flat report shapes. Escapes quotes/commas/newlines per RFC 4180.
 */
function toCsv(rows, columns) {
  const escape = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','));
  return [header, ...lines].join('\n');
}

module.exports = { toCsv };
