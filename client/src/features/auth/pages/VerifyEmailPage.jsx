import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '../services/auth.service';
import { extractErrorMessage } from '../../../services/apiClient';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(extractErrorMessage(err));
      });
  }, [token]);

  return (
    <div style={{ textAlign: 'center' }}>
      {status === 'verifying' && (
        <>
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
          <h1 style={{ fontSize: 19 }}>Verifying your email…</h1>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 size={36} color="var(--color-success)" style={{ marginBottom: 12 }} />
          <h1 style={{ fontSize: 19, marginBottom: 8 }}>Email verified</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, marginBottom: 20 }}>
            Your email address has been verified successfully.
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={36} color="var(--color-danger)" style={{ marginBottom: 12 }} />
          <h1 style={{ fontSize: 19, marginBottom: 8 }}>Verification failed</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, marginBottom: 20 }}>{message}</p>
        </>
      )}
      <Link to="/dashboard" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 13.5 }}>
        Go to dashboard
      </Link>
    </div>
  );
}
