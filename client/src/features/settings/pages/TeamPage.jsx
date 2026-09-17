import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { userApi, ROLE_LABELS, SERVICE_OPTIONS } from '../services/settings.service';
import { isAdminRole, canManageTargetRole } from '../../../constants/roles';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { useAuth } from '../../auth/context/AuthContext';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import RowActionsMenu from '../../../components/ui/RowActionsMenu';
import InviteUserModal from '../components/InviteUserModal';
import EditUserModal from '../components/EditUserModal';
import UserLink from '../../../components/shared/UserLink';

const SERVICE_LABELS = Object.fromEntries(SERVICE_OPTIONS.map((s) => [s.value, s.label]));

const ROLE_FILTERS = [
  { value: '', label: 'All Accounts' },
  { value: 'superadmin', label: 'Super Admins' },
  { value: 'admin', label: 'Admins (CA)' },
  { value: 'employee', label: 'Employees' },
  { value: 'client', label: 'Clients' },
];

const ROLE_TONE = { superadmin: 'warning', admin: 'primary', employee: 'neutral', user: 'neutral', client: 'success' };

export default function TeamPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, loading, error, refetch } = useApiData(
    () => userApi.list({ page, limit: 20, search, ...(roleFilter ? { role: roleFilter } : {}) }),
    [page, search, roleFilter]
  );

  const handleInvite = async (payload) => {
    try {
      await userApi.create(payload);
      toast.success('Invite sent — the member sets their password by email');
      setInviteOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleEditSave = async (user, updates) => {
    try {
      await userApi.update(user.id, updates);
      toast.success(`${updates.name || user.name}'s details updated`);
      setEditingUser(null);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userApi.setActive(user.id, !user.isActive);
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteBusy(true);
    try {
      await userApi.remove(deletingUser.id);
      toast.success(`${deletingUser.name} removed from the firm`);
      setDeletingUser(null);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const isAdmin = isAdminRole(currentUser?.role);

  const columns = [
    { key: 'name', label: 'Name', render: (u) => <UserLink user={u}><strong>{u.name}</strong></UserLink> },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (u) => <Badge tone={ROLE_TONE[u.role] || 'neutral'}>{ROLE_LABELS[u.role] || u.role}</Badge>,
    },
    {
      key: 'services',
      label: 'Services',
      render: (u) => (isAdminRole(u.role)
        ? <span style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>All services</span>
        : (
          <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
            {(u.allowedServices || []).length === 0 && <span style={{ color: 'var(--color-text-faint)' }}>None</span>}
            {(u.allowedServices || []).map((s) => (
              <Badge key={s} tone="neutral">{SERVICE_LABELS[s] || s}</Badge>
            ))}
          </span>
        )),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (u) => <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'active' : 'inactive'}</Badge>,
    },
    ...(isAdmin ? [{
      key: 'actions',
      label: '',
      render: (u) => (canManageTargetRole(currentUser.role, u.role) ? (
        <RowActionsMenu
          actions={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditingUser(u) },
            {
              label: u.isActive ? 'Deactivate' : 'Activate',
              icon: u.isActive ? UserX : UserCheck,
              onClick: () => handleToggleActive(u),
            },
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeletingUser(u) },
          ]}
        />
      ) : (
        <span style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }} title="Only a Super Admin can manage this account">—</span>
      )),
    }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Team</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Manage roles and which services each member can open
          </p>
        </div>
        {isAdmin && <Button icon={Plus} onClick={() => setInviteOpen(true)}>Invite Member</Button>}
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => { setRoleFilter(f.value); setPage(1); }}
            style={{
              padding: '7px 13px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: roleFilter === f.value ? 'var(--color-primary)' : 'var(--color-border)',
              background: roleFilter === f.value ? 'var(--color-primary)' : 'var(--color-surface)',
              color: roleFilter === f.value ? '#fff' : 'var(--color-text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        error={error}
        page={page}
        limit={20}
        total={data?.meta?.total || 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search team members…"
        getRowId={(row) => row.id}
        emptyTitle="No team members yet"
      />

      <InviteUserModal
        isOpen={inviteOpen}
        actorRole={currentUser?.role}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />

      <EditUserModal
        isOpen={Boolean(editingUser)}
        user={editingUser}
        actorRole={currentUser?.role}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditSave}
      />

      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Remove team member?"
        size="sm"
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteBusy} onClick={handleDelete}>Delete</Button>
          </>
        )}
      >
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
          <strong>{deletingUser?.name}</strong> ({deletingUser?.email}) will lose access to the
          panel immediately. Their past work and activity history stay intact.
        </p>
      </Modal>
    </div>
  );
}
