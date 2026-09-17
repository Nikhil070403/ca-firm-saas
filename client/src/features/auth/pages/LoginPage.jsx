import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { homePathForUser } from '../../../constants/roles';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import './LoginPage.css';

/**
 * Invite-only panel: no public registration or self-service reset links.
 * Accounts are created by an admin from Team > Invite Member; forgotten
 * passwords are reset by the firm admin.
 */
export default function LoginPage() {
  const { login, verifyTwoFactor } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set once /login responds with requires2FA — switches the form to the
  // second-factor step. Never a real access token, only redeemable by
  // /2fa/verify-login within its 10-minute window.
  const [tempToken, setTempToken] = useState(null);
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goHome = (loggedInUser) => {
    navigate(location.state?.from?.pathname || homePathForUser(loggedInUser), { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await login(form);
      if (result?.requires2FA) {
        setTempToken(result.tempToken);
        return;
      }
      toast.success('Welcome back!');
      goHome(result);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setCodeError(useBackupCode ? 'Backup code is required' : 'Code is required');
      return;
    }
    setCodeError('');
    setSubmitting(true);
    try {
      const loggedInUser = await verifyTwoFactor(tempToken, code.trim());
      toast.success('Welcome back!');
      goHome(loggedInUser);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (tempToken) {
    return (
      <div className="login">
        <button type="button" className="login__back" onClick={() => { setTempToken(null); setCode(''); }}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="login__title">Two-factor authentication</h1>
        <p className="login__subtitle">
          {useBackupCode
            ? 'Enter one of the backup codes you saved when you set up 2FA.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>

        <form onSubmit={handleVerifyCode} noValidate>
          <FormField label={useBackupCode ? 'Backup code' : 'Authentication code'} htmlFor="twofa-code" error={codeError} required>
            <div className="login__input-wrap">
              <KeyRound size={15} className="login__input-icon" />
              <Input
                id="twofa-code"
                type="text"
                inputMode={useBackupCode ? 'text' : 'numeric'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                error={codeError}
                placeholder={useBackupCode ? 'XXXXX-XXXXX' : '123456'}
                className="login__input"
                autoFocus
              />
            </div>
          </FormField>

          <Button type="submit" loading={submitting} size="lg" className="login__submit">
            Verify
          </Button>
        </form>

        <button
          type="button"
          className="login__link-button"
          onClick={() => { setUseBackupCode((v) => !v); setCode(''); setCodeError(''); }}
        >
          {useBackupCode ? 'Use authenticator code instead' : "Can't access your authenticator? Use a backup code"}
        </button>
      </div>
    );
  }

  return (
    <div className="login">
      <h1 className="login__title">Welcome back</h1>
      <p className="login__subtitle">Securely sign in to your firm's workspace</p>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email} required>
          <div className="login__input-wrap">
            <Mail size={15} className="login__input-icon" />
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
              autoComplete="email"
              placeholder="you@yourfirm.com"
              className="login__input"
              autoFocus
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password} required>
          <div className="login__input-wrap">
            <Lock size={15} className="login__input-icon" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              error={errors.password}
              autoComplete="current-password"
              placeholder="Your password"
              className="login__input login__input--password"
            />
            <button
              type="button"
              className="login__toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        <Button type="submit" loading={submitting} size="lg" className="login__submit">
          Sign in
        </Button>
      </form>

      <div className="login__footer">
        <ShieldCheck size={14} />
        <span>
          <strong>Access notice.</strong> This workspace is invite-only — accounts
          are created by your firm's admin. Locked out? Contact your administrator.
        </span>
      </div>
    </div>
  );
}
