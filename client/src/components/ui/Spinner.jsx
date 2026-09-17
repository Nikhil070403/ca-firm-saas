import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 22, label = 'Loading…', inline = false }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: inline ? 0 : '40px 0',
        color: 'var(--color-text-muted)',
        fontSize: 13,
      }}
    >
      <Loader2 size={size} style={{ animation: 'spin 0.8s linear infinite' }} />
      {!inline && label}
    </div>
  );
}
