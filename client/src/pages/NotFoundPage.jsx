import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
      <FileQuestion size={44} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
