import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { ROLE_OPTIONS, SERVICE_OPTIONS } from '../services/settings.service';
import { isAdminRole, assignableRoles } from '../../../constants/roles';
import { clientApi } from '../../clients/services/client.service';
import { departmentApi } from '../../departments/services/department.service';
import useApiData from '../../../hooks/useApiData';
import './EditUserModal.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Editor for a team member: identity details plus role and assigned
 * services (workspaces). What's saved here drives the login response — the
 * launcher and route guards read `allowedServices` straight off the user.
 * Changing the email resets its verified flag server-side. `actorRole` is
 * the editor's own role — it narrows which roles can be assigned here (the
 * server enforces the same limits independently). For role==='client', a
 * "Linked Client Record" picks which Client business record the Client
 * Portal is scoped to — an unlinked client sees nothing in the portal.
 */
export default function EditUserModal({ isOpen, user, actorRole, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'client', linkedClientId: '', departmentId: '', password: '' });
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: clientsData } = useApiData(
    () => (isOpen ? clientApi.list({ limit: 200, sort: 'displayName' }) : Promise.resolve(null)),
    [isOpen]
  );
  const clients = clientsData?.data || [];

  const { data: departments } = useApiData(
    () => (isOpen ? departmentApi.list() : Promise.resolve(null)),
    [isOpen]
  );

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'client',
        linkedClientId: user.linkedClientId || '',
        departmentId: user.departmentId || '',
        password: '',
      });
      setServices(user.allowedServices || []);
      setError('');
    }
  }, [user]);

  if (!user) return null;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // An actor only ever sees roles they're allowed to assign, plus the
  // account's current role (even if legacy/otherwise out of their reach) so
  // the dropdown never silently shows the wrong thing.
  const allowed = assignableRoles(actorRole);
  const roleOptions = ROLE_OPTIONS.filter((o) => allowed.includes(o.value) || o.value === user.role);

  const targetIsAdminRole = isAdminRole(form.role);
  const targetIsClient = form.role === 'client';

  const toggleService = (key) => {
    if (key === 'accounts' && targetIsClient) return; // hard-blocked, never toggleable
    setServices((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!EMAIL_RE.test(form.email)) {
      setError('Enter a valid email address');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(user, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        allowedServices: services.filter((s) => !(s === 'accounts' && targetIsClient)),
        linkedClientId: targetIsClient ? (form.linkedClientId || null) : null,
        departmentId: targetIsClient ? null : (form.departmentId || null),
        // Only sent when actually set — blank means "leave the password alone".
        ...(form.password ? { password: form.password } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${user.name}`}
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-user-form" loading={submitting}>Save changes</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} id="edit-user-form">
        <FormField label="Name" error={error.includes('Name') ? error : ''} required>
          <Input value={form.name} onChange={handleChange('name')} autoFocus />
        </FormField>

        <FormField label="Email" error={error.includes('email') ? error : ''} required>
          <Input type="email" value={form.email} onChange={handleChange('email')} />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Phone">
            <Input value={form.phone} onChange={handleChange('phone')} />
          </FormField>
          <FormField label="Role" required>
            <Select value={form.role} onChange={handleChange('role')} options={roleOptions} />
          </FormField>
        </div>

        <FormField
          label="Set New Password"
          error={error.includes('password') ? error : ''}
          hint="Optional — leave blank to keep the current password. Setting one signs the member out of all their sessions."
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep unchanged"
            value={form.password}
            onChange={handleChange('password')}
          />
        </FormField>

        {targetIsClient && (
          <FormField
            label="Linked Client Record"
            hint="Which client this login represents — the Client Portal only ever shows this client's own data"
          >
            <Select
              value={form.linkedClientId}
              onChange={handleChange('linkedClientId')}
              options={[
                { value: '', label: 'Not linked yet' },
                ...clients.map((c) => ({ value: c._id, label: c.displayName })),
              ]}
            />
          </FormField>
        )}

        {!targetIsClient && (
          <FormField label="Department">
            <Select
              value={form.departmentId}
              onChange={handleChange('departmentId')}
              options={[
                { value: '', label: 'Not assigned' },
                ...(departments || []).map((d) => ({ value: d._id, label: d.name })),
              ]}
            />
          </FormField>
        )}

        <FormField label="Services (workspaces this member can open)">
          <div className="edit-user__services">
            {SERVICE_OPTIONS.map((svc) => {
              const blockedForClient = svc.value === 'accounts' && targetIsClient;
              const disabled = targetIsAdminRole || blockedForClient;
              return (
                <label
                  key={svc.value}
                  className={`edit-user__service ${disabled ? 'is-disabled' : ''}`}
                  title={blockedForClient ? 'Clients never get Accounts' : undefined}
                >
                  <input
                    type="checkbox"
                    checked={targetIsAdminRole || (!blockedForClient && services.includes(svc.value))}
                    disabled={disabled}
                    onChange={() => toggleService(svc.value)}
                  />
                  <span>{svc.label}</span>
                </label>
              );
            })}
          </div>
          {targetIsAdminRole && (
            <p className="edit-user__hint">Admins always have access to every service.</p>
          )}
          {!targetIsAdminRole && targetIsClient && (
            <p className="edit-user__hint">Clients never get Accounts, regardless of this setting.</p>
          )}
        </FormField>
      </form>
    </Modal>
  );
}
