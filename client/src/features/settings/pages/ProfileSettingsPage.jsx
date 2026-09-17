import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { authApi } from '../../auth/services/auth.service';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import TwoFactorSettings from '../components/TwoFactorSettings';
import ActiveSessions from '../components/ActiveSessions';
import ChangePasswordCard from '../components/ChangePasswordCard';
import { isAdminRole } from '../../../constants/roles';

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await authApi.updateMe(form);
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>My Profile</h1>

      <Card>
        <CardHeader title="Account" subtitle={<>{user?.email} <Badge tone="primary">{user?.role}</Badge></>} />
        <form onSubmit={handleSubmit}>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </FormField>
          <Button type="submit" loading={submitting}>Save Changes</Button>
        </form>
      </Card>

      {isAdminRole(user?.role) && <ChangePasswordCard />}

      <TwoFactorSettings />

      <ActiveSessions />

      {!isAdminRole(user?.role) && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Need to change your password? Use the{' '}
          <Link to="/forgot-password" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            forgot password
          </Link>{' '}
          flow from the login screen.
        </p>
      )}
    </div>
  );
}
