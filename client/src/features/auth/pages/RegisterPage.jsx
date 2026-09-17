import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firmName: '', name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.firmName.trim().length < 2) next.firmName = 'Firm name is required';
    if (form.name.trim().length < 2) next.name = 'Your name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'A valid email is required';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(form);
      toast.success('Account created — check your email to verify your address');
      navigate('/services', { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Create your firm's workspace</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, marginBottom: 28 }}>
        You'll be the admin of this workspace
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Firm name" htmlFor="firmName" error={errors.firmName} required>
          <Input id="firmName" value={form.firmName} onChange={handleChange('firmName')} error={errors.firmName} placeholder="Sharma & Associates" />
        </FormField>

        <FormField label="Your name" htmlFor="name" error={errors.name} required>
          <Input id="name" value={form.name} onChange={handleChange('name')} error={errors.name} />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email} required>
          <Input id="email" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} autoComplete="email" />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters" required>
          <Input id="password" type="password" value={form.password} onChange={handleChange('password')} error={errors.password} autoComplete="new-password" />
        </FormField>

        <Button type="submit" loading={submitting} style={{ width: '100%' }} size="lg">
          Create workspace
        </Button>
      </form>

      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
