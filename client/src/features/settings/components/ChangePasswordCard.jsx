import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { authApi } from '../../auth/services/auth.service';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const EMPTY = { current: '', next: '', confirm: '' };

/**
 * In-app password change (rendered for superadmin/admin in My Profile).
 * Requires the current password; on success the server signs out every OTHER
 * session, so this login keeps working.
 */
export default function ChangePasswordCard() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.next.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (form.next !== form.confirm) {
      setError('New password and confirmation do not match');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword(form.current, form.next);
      toast.success('Password changed — other sessions were signed out');
      setForm(EMPTY);
      setError('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Change Password"
        subtitle="Requires your current password; all other sessions are signed out"
      />
      <form onSubmit={handleSubmit}>
        <FormField label="Current password" required>
          <Input
            type="password"
            autoComplete="current-password"
            value={form.current}
            onChange={handleChange('current')}
          />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="New password" hint="Minimum 8 characters" required>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.next}
              onChange={handleChange('next')}
            />
          </FormField>
          <FormField label="Confirm new password" required>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={handleChange('confirm')}
            />
          </FormField>
        </div>
        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
        )}
        <Button
          type="submit"
          icon={KeyRound}
          loading={submitting}
          disabled={!form.current || !form.next || !form.confirm}
        >
          Change Password
        </Button>
      </form>
    </Card>
  );
}
