import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { ROLE_OPTIONS, SERVICE_OPTIONS } from '../services/settings.service';
import { isAdminRole, assignableRoles } from '../../../constants/roles';
import { clientApi } from '../../clients/services/client.service';
import useApiData from '../../../hooks/useApiData';
import './EditUserModal.css';

/** Invite a new member — `actorRole` narrows which roles can be offered
 * (an admin can only create employees/clients; only superadmin can create
 * another admin or superadmin). The server enforces the same limit. For
 * role==='client', a Linked Client Record can be set immediately so the
 * new login opens straight into their Client Portal. */
export default function InviteUserModal({ isOpen, onClose, onSubmit, actorRole }) {
  const roleOptions = ROLE_OPTIONS.filter((o) => assignableRoles(actorRole).includes(o.value));
  const defaultRole = roleOptions.find((o) => o.value === 'employee')?.value || roleOptions[0]?.value || 'employee';
  const emptyForm = { name: '', email: '', role: defaultRole, phone: '', allowedServices: ['crm'], linkedClientId: '' };

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: clientsData } = useApiData(
    () => (isOpen ? clientApi.list({ limit: 200, sort: 'displayName' }) : Promise.resolve(null)),
    [isOpen]
  );
  const clients = clientsData?.data || [];

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const targetIsClient = form.role === 'client';
  const targetIsAdminRole = isAdminRole(form.role);

  const toggleService = (key) => {
    if (key === 'accounts' && targetIsClient) return; // hard-blocked, never toggleable
    setForm((prev) => ({
      ...prev,
      allowedServices: prev.allowedServices.includes(key)
        ? prev.allowedServices.filter((s) => s !== key)
        : [...prev.allowedServices, key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('A valid name and email are required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        allowedServices: form.allowedServices.filter((s) => !(s === 'accounts' && targetIsClient)),
        linkedClientId: targetIsClient ? (form.linkedClientId || null) : null,
      });
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} id="invite-user-form">
        <FormField label="Name" error={error} required>
          <Input value={form.name} onChange={handleChange('name')} error={error} autoFocus />
        </FormField>
        <FormField label="Email" required>
          <Input type="email" value={form.email} onChange={handleChange('email')} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Role">
            <Select options={roleOptions} value={form.role} onChange={handleChange('role')} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={handleChange('phone')} />
          </FormField>
        </div>
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
                    checked={targetIsAdminRole || (!blockedForClient && form.allowedServices.includes(svc.value))}
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button form="invite-user-form" type="submit" loading={submitting}>Send Invite</Button>
      </div>
    </Modal>
  );
}
