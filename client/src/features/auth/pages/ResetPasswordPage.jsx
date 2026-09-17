import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/auth.service';
import { extractErrorMessage } from '../../../services/apiClient';
import { useToast } from '../../../components/shared/Toast';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset — please sign in');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Invalid link</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, marginBottom: 20 }}>
          This password reset link is missing its token.
        </p>
        <Link to="/forgot-password" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Set a new password</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, marginBottom: 28 }}>
        Choose a strong password for your account
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="New password" htmlFor="password" error={error} hint="At least 8 characters" required>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} autoComplete="new-password" />
        </FormField>

        <Button type="submit" loading={submitting} style={{ width: '100%' }} size="lg">
          Reset password
        </Button>
      </form>
    </div>
  );
}
