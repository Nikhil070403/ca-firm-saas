import { Outlet, Link } from 'react-router-dom';
import { Link2, Contact, BookOpenText, Landmark, BellRing, ShieldCheck } from 'lucide-react';
import './AuthLayout.css';

const FEATURES = [
  { icon: Contact, label: 'CRM', text: 'Leads & pipeline tracking, client communication and reports' },
  { icon: BookOpenText, label: 'Khata Book', text: 'Party ledgers with live running balances, Tally-style books' },
  { icon: Landmark, label: 'Accounts', text: 'GST-ready invoices, receipts and expenses' },
  { icon: BellRing, label: 'Compliance', text: 'GST, ITR, TDS and ROC deadline reminders, auto-tracked' },
  { icon: ShieldCheck, label: 'Security & Roles', text: 'Role-based access, audit trail and automation controls' },
];

/** Decorative network graphic for the dark panel — pure CSS/SVG, no external assets. */
function NetworkGraphic() {
  const nodes = [
    [280, 40], [340, 90], [250, 130], [320, 190], [200, 70],
    [360, 150], [230, 200], [300, 30], [180, 150], [350, 210],
  ];
  const edges = [[0, 1], [1, 2], [1, 3], [0, 4], [3, 5], [2, 6], [0, 7], [4, 8], [3, 9], [5, 9], [2, 8]];
  return (
    <svg className="auth-layout__network" viewBox="0 0 400 260" fill="none" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="rgba(147, 197, 253, 0.35)" strokeWidth="1"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.5 : 2} fill="#93c5fd" opacity={i % 3 === 0 ? 0.9 : 0.55} />
      ))}
    </svg>
  );
}

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__photo-side">
        <div className="auth-layout__photo-backdrop" aria-hidden="true" />
        <div className="auth-layout__card">
          <Link to="/" className="auth-layout__brand">
            <span className="auth-layout__brand-icon"><Link2 size={18} /></span>
            <span>CA Firm SaaS<br /><small>Practice Portal</small></span>
          </Link>
          <Outlet />
        </div>
      </div>

      <div className="auth-layout__aside">
        <NetworkGraphic />
        <div className="auth-layout__aside-content">
          <p className="auth-layout__eyebrow">Solution Hub</p>
          <h2>Run your practice from one place</h2>
          <p className="auth-layout__lead">Leverage one integrated platform built for CA firms.</p>
          <ul className="auth-layout__features">
            {FEATURES.map(({ icon: Icon, label, text }) => (
              <li key={label}>
                <span className="auth-layout__feature-icon"><Icon size={17} /></span>
                <div>
                  <strong>{label}</strong>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
