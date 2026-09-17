import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from './Spinner';
import EmptyState from './EmptyState';
import './DataTable.css';

/**
 * Hand-rolled replacement for TanStack Table (see PROJECT_STATE.md stack
 * pivot). Sorting/filtering/search happen server-side via the list API's
 * shared parseQuery contract — this component is presentation + pagination
 * controls only, not a client-side data engine.
 */
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  error = null,
  page = 1,
  limit = 20,
  total = 0,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  toolbarActions,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription,
  getRowId = (row) => row._id || row.id,
}) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="data-table">
      {(onSearchChange || toolbarActions) && (
        <div className="data-table__toolbar">
          {onSearchChange && (
            <div className="data-table__search">
              <Search size={15} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          <div className="data-table__toolbar-actions">{toolbarActions}</div>
        </div>
      )}

      <div className="data-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && !error && rows.map((row) => (
              <tr key={getRowId(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'is-clickable' : ''}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <Spinner />}
        {!loading && error && (
          <div className="data-table__error">{error}</div>
        )}
        {!loading && !error && rows.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>

      {onPageChange && total > 0 && (
        <div className="data-table__pagination">
          <span>
            Page {page} of {totalPages} &middot; {total} total
          </span>
          <div className="data-table__pagination-controls">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
