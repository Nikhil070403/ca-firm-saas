import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { authApi } from '../services/auth.service';
import { extractErrorMessage } from '../../../services/apiClient';
import { useToast } from '../../../components/shared/Toast';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center' }}>
        <CheckCircle2 size={36} color="var(--color-success)" style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 19, marginBottom: 8 }}>Check your email</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, marginBottom: 20 }}>
          If an account exists for {email}, we've sent a link to reset your password.
        </p>
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 13.5 }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Forgot password</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, marginBottom: 28 }}>
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email" htmlFor="email" required>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </FormField>

        <Button type="submit" loading={submitting} style={{ width: '100%' }} size="lg">
          Send reset link
        </Button>
      </form>

      <p style={{ marginTop: 24, fontSize: 13, textAlign: 'center' }}>
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
