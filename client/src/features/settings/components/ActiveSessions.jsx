import { useState } from 'react';
import { Monitor, Smartphone, MapPin, LogOut } from 'lucide-react';
import { authApi } from '../../auth/services/auth.service';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import useApiData from '../../../hooks/useApiData';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { formatDateTime } from '../../../utils/format';

export default function ActiveSessions() {
  const toast = useToast();
  const { data: sessions, loading, refetch } = useApiData(() => authApi.listSessions(), []);
  const [busyId, setBusyId] = useState(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const handleRevoke = async (id) => {
    setBusyId(id);
    try {
      await authApi.revokeSession(id);
      toast.success('Session signed out');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      await authApi.revokeOtherSessions();
      toast.success('Signed out of all other sessions');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setRevokingOthers(false);
    }
  };

  const otherSessionsExist = (sessions || []).some((s) => !s.isCurrent);

  return (
    <Card>
      <CardHeader
        title="Active Sessions"
        subtitle="Devices currently signed in to your account"
        action={otherSessionsExist && (
          <Button variant="ghost" size="sm" loading={revokingOthers} onClick={handleRevokeOthers}>
            Log out other sessions
          </Button>
        )}
      />
      {loading ? (
        <Spinner label="Loading sessions…" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(sessions || []).map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)',
                background: s.isCurrent ? 'var(--color-primary-soft)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.os === 'Android' || s.os === 'iOS' ? <Smartphone size={16} /> : <Monitor size={16} />}
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.label}
                    {s.isCurrent && <Badge tone="primary">This device</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={11} /> {s.ipAddress || 'Unknown IP'} · signed in {formatDateTime(s.createdAt)}
                  </div>
                </div>
              </div>
              {!s.isCurrent && (
                <button
                  type="button"
                  title="Sign out this session"
                  disabled={busyId === s.id}
                  onClick={() => handleRevoke(s.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          ))}
          {(sessions || []).length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>No active sessions found.</p>
          )}
        </div>
      )}
    </Card>
  );
}
