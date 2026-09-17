import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
      <Icon size={32} style={{ marginBottom: 12, opacity: 0.6 }} />
      <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--color-text)', fontSize: 14 }}>{title}</p>
      {description && <p style={{ margin: '0 0 16px', fontSize: 13 }}>{description}</p>}
      {action}
    </div>
  );
}
