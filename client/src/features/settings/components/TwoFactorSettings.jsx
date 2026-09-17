import { useState } from 'react';
import { ShieldCheck, ShieldOff, Copy } from 'lucide-react';
import { authApi } from '../../auth/services/auth.service';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';

export default function TwoFactorSettings() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  // idle -> setup (QR shown, awaiting confirm code) -> backupCodes (one-time reveal)
  const [step, setStep] = useState('idle');
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [busy, setBusy] = useState(false);

  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState('');

  const startSetup = async () => {
    setBusy(true);
    try {
      const result = await authApi.setupTwoFactor();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setStep('setup');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const cancelSetup = () => {
    setStep('idle');
    setQrCode(null);
    setSecret(null);
    setCode('');
  };

  const confirmEnable = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const result = await authApi.enableTwoFactor(code.trim());
      setBackupCodes(result.backupCodes);
      setStep('backupCodes');
      setUser({ ...user, twoFactorEnabled: true });
      toast.success('Two-factor authentication enabled');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const finishBackupCodes = () => {
    setStep('idle');
    setQrCode(null);
    setSecret(null);
    setCode('');
    setBackupCodes([]);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied');
  };

  const handleDisable = async () => {
    if (!disablePassword) {
      setDisableError('Password is required');
      return;
    }
    setBusy(true);
    try {
      await authApi.disableTwoFactor(disablePassword);
      setUser({ ...user, twoFactorEnabled: false });
      setShowDisable(false);
      setDisablePassword('');
      setDisableError('');
      toast.success('Two-factor authentication disabled');
    } catch (err) {
      setDisableError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Two-Factor Authentication"
        subtitle="Add a second step to sign-in using an authenticator app (Google Authenticator, Authy, 1Password, etc.)"
      />

      {step === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.twoFactorEnabled ? <ShieldCheck size={18} color="var(--color-success)" /> : <ShieldOff size={18} color="var(--color-text-faint)" />}
            <Badge tone={user?.twoFactorEnabled ? 'success' : 'neutral'}>
              {user?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
            </Badge>
          </div>
          {user?.twoFactorEnabled ? (
            <Button variant="danger" onClick={() => setShowDisable(true)}>Disable</Button>
          ) : (
            <Button loading={busy} onClick={startSetup}>Enable 2FA</Button>
          )}
        </div>
      )}

      {step === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Scan this QR code with your authenticator app, then enter the 6-digit code it shows to confirm.
          </p>
          {qrCode && (
            <img src={qrCode} alt="Two-factor authentication QR code" style={{ width: 180, height: 180, alignSelf: 'center', borderRadius: 8, border: '1px solid var(--color-border)' }} />
          )}
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-faint)', margin: '0 0 4px' }}>Can't scan? Enter this key manually:</p>
            <code style={{ fontSize: 13, background: 'var(--color-bg)', padding: '6px 10px', borderRadius: 6, display: 'inline-block', letterSpacing: 1 }}>{secret}</code>
          </div>
          <form onSubmit={confirmEnable} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <FormField label="Confirmation code" htmlFor="totp-confirm">
              <Input
                id="totp-confirm"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                autoFocus
              />
            </FormField>
            <Button type="submit" loading={busy}>Confirm &amp; Enable</Button>
            <Button type="button" variant="ghost" onClick={cancelSetup}>Cancel</Button>
          </form>
        </div>
      )}

      {step === 'backupCodes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--color-danger)', margin: 0, fontWeight: 600 }}>
            Save these backup codes now — they won't be shown again. Each one can be used once if you lose access to your authenticator app.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 14,
          }}
          >
            {backupCodes.map((c) => (
              <code key={c} style={{ fontSize: 13, letterSpacing: 1 }}>{c}</code>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" icon={Copy} onClick={copyBackupCodes}>Copy codes</Button>
            <Button onClick={finishBackupCodes}>I've saved these codes</Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDisable}
        onClose={() => { setShowDisable(false); setDisablePassword(''); setDisableError(''); }}
        title="Disable two-factor authentication"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setShowDisable(false)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={handleDisable}>Disable</Button>
          </>
        )}
      >
        <FormField label="Confirm your password" htmlFor="disable-password" error={disableError} required>
          <Input
            id="disable-password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            error={disableError}
            autoFocus
          />
        </FormField>
      </Modal>
    </Card>
  );
}
