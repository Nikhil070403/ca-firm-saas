import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Contact, Receipt, Loader2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import './GlobalSearch.css';

const SECTIONS = [
  {
    key: 'clients', label: 'Clients', icon: Users, endpoint: '/clients',
    toResult: (c) => ({ id: c._id, title: c.displayName, subtitle: c.gstNumber || c.email || c.phone || '—', path: `/crm/clients/${c._id}` }),
  },
  {
    key: 'leads', label: 'Leads', icon: Contact, endpoint: '/leads',
    toResult: (l) => ({ id: l._id, title: l.name, subtitle: l.company || l.phone || l.status, path: `/crm/leads/${l._id}` }),
  },
  {
    key: 'invoices', label: 'Invoices', icon: Receipt, endpoint: '/invoices',
    toResult: (i) => ({ id: i._id, title: i.invoiceNumber, subtitle: `₹${(i.grandTotal || 0).toLocaleString('en-IN')} · ${i.status}`, path: `/accounts/invoices/${i._id}` }),
  },
];

/**
 * Ctrl+K palette. Debounced fan-out to the three main list endpoints —
 * each already supports ?search= via the shared parseQuery middleware.
 */
export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults(null); return undefined; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const responses = await Promise.allSettled(
          SECTIONS.map((s) => apiClient.get(s.endpoint, { params: { search: query.trim(), limit: 5 } }))
        );
        const grouped = SECTIONS.map((section, i) => ({
          ...section,
          items: responses[i].status === 'fulfilled'
            ? (responses[i].value.data.data || []).map(section.toResult)
            : [],
        })).filter((g) => g.items.length > 0);
        setResults(grouped);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const open = (path) => { onClose(); navigate(path); };

  return (
    <div className="gsearch__overlay" onClick={onClose}>
      <div className="gsearch" onClick={(e) => e.stopPropagation()}>
        <div className="gsearch__input">
          {loading ? <Loader2 size={16} className="gsearch__spin" /> : <Search size={16} />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, leads, invoice numbers…"
          />
          <kbd>Esc</kbd>
        </div>

        <div className="gsearch__body">
          {query.trim().length < 2 && (
            <p className="gsearch__hint">Type at least 2 characters to search across the firm.</p>
          )}
          {results && results.length === 0 && (
            <p className="gsearch__hint">No matches for “{query}”.</p>
          )}
          {results?.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.key} className="gsearch__group">
                <p className="gsearch__group-title"><Icon size={13} /> {group.label}</p>
                {group.items.map((item) => (
                  <button key={item.id} type="button" className="gsearch__item" onClick={() => open(item.path)}>
                    <span className="gsearch__item-title">{item.title}</span>
                    <span className="gsearch__item-sub">{item.subtitle}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
