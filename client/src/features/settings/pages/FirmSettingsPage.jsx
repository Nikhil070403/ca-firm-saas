import { useEffect, useState } from 'react';
import { Zap, FileCheck2, CalendarRange, Receipt, ListChecks, FolderOpen } from 'lucide-react';
import { firmApi } from '../services/settings.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { useBranding } from '../context/BrandingContext';
import Card, { CardHeader } from '../../../components/ui/Card';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import './FirmSettingsPage.css';

const AUTOMATION_RULES = [
  {
    key: 'gstReminders',
    icon: FileCheck2,
    label: 'GST return reminders',
    description: 'When a GSTR-1/3B deadline is near, remind the client daily by email until it is filed.',
  },
  {
    key: 'yearlyReminders',
    icon: CalendarRange,
    label: 'Yearly filing reminders',
    description: 'Remind clients about ITR, Audit, ROC and GSTR-9C starting 30 days before the due date.',
  },
  {
    key: 'invoiceFollowUps',
    icon: Receipt,
    label: 'Overdue invoice follow-ups',
    description: 'Automatically email a payment reminder 10 days after an unpaid invoice is issued.',
  },
  {
    key: 'taskAssignmentNotify',
    icon: ListChecks,
    label: 'Task assignment notifications',
    description: 'Notify a staff member the moment a task is assigned to them.',
  },
  {
    key: 'documentUploadNotify',
    icon: FolderOpen,
    label: 'Document upload notifications',
    description: "Notify a client's assigned executive whenever a new document is uploaded for that client.",
  },
];

const DEFAULT_PRIMARY_COLOR = '#1e3a8a';

export default function FirmSettingsPage() {
  const toast = useToast();
  const { applyBranding } = useBranding();
  const { data: firm, loading, refetch } = useApiData(() => firmApi.get(), []);
  const [form, setForm] = useState(null);
  const [brandForm, setBrandForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingRule, setSavingRule] = useState(null);

  useEffect(() => {
    if (firm) {
      setForm({
        name: firm.name || '',
        email: firm.email || '',
        phone: firm.phone || '',
        gstNumber: firm.gstNumber || '',
        panNumber: firm.panNumber || '',
      });
      setBrandForm({
        logoUrl: firm.logoUrl || '',
        primaryColor: firm.primaryColor || DEFAULT_PRIMARY_COLOR,
      });
    }
  }, [firm]);

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const updated = await firmApi.update({
        logoUrl: brandForm.logoUrl.trim() || null,
        primaryColor: brandForm.primaryColor,
      });
      applyBranding({ name: updated.name, logoUrl: updated.logoUrl, primaryColor: updated.primaryColor });
      toast.success('Branding updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingBranding(false);
    }
  };

  const handleResetBranding = async () => {
    setSavingBranding(true);
    try {
      const updated = await firmApi.update({ logoUrl: null, primaryColor: null });
      setBrandForm({ logoUrl: '', primaryColor: DEFAULT_PRIMARY_COLOR });
      applyBranding({ name: updated.name, logoUrl: null, primaryColor: null });
      toast.success('Branding reset to default');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingBranding(false);
    }
  };

  if (loading || !form) return <div style={{ padding: '60px 0' }}><Spinner label="Loading firm settings…" /></div>;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await firmApi.update(form);
      toast.success('Firm settings updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRule = async (key, enabled) => {
    setSavingRule(key);
    try {
      await firmApi.update({ automationRules: { ...(firm.automationRules || {}), [key]: enabled } });
      toast.success(`${enabled ? 'Enabled' : 'Disabled'} — takes effect on the next run`);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingRule(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>Firm Settings</h1>

      <Card>
        <CardHeader title="Firm Profile" />
        <form onSubmit={handleSubmit}>
          <FormField label="Firm name" required>
            <Input value={form.name} onChange={handleChange('name')} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={handleChange('email')} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={handleChange('phone')} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="GST Number">
              <Input value={form.gstNumber} onChange={handleChange('gstNumber')} />
            </FormField>
            <FormField label="PAN Number">
              <Input value={form.panNumber} onChange={handleChange('panNumber')} />
            </FormField>
          </div>
          <Button type="submit" loading={submitting}>Save Changes</Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Branding" subtitle="Make the workspace look like your own product — your logo and accent color, everywhere" />
        <form onSubmit={handleSaveBranding}>
          <FormField label="Logo URL" hint="A hosted image URL (square works best). Leave blank to use the default mark.">
            <Input
              value={brandForm.logoUrl}
              onChange={(e) => setBrandForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://…"
            />
          </FormField>
          <FormField label="Accent color">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={brandForm.primaryColor}
                onChange={(e) => setBrandForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                style={{ width: 44, height: 34, padding: 2, border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{brandForm.primaryColor}</span>
            </div>
          </FormField>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" loading={savingBranding}>Save Branding</Button>
            <Button type="button" variant="ghost" onClick={handleResetBranding} disabled={savingBranding}>Reset to default</Button>
          </div>
        </form>
      </Card>

      <Card
        title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Zap size={16} style={{ color: 'var(--color-warning)' }} /> Automation Rules</span>}
        subtitle="Turn off any automated behavior the firm doesn't want — each toggle controls a real background job, not just a display"
      >
        <div className="automation-rules">
          {AUTOMATION_RULES.map(({ key, icon: Icon, label, description }) => {
            const enabled = firm.automationRules?.[key] !== false;
            return (
              <div key={key} className="automation-rules__row">
                <span className="automation-rules__icon"><Icon size={16} /></span>
                <div className="automation-rules__text">
                  <strong>{label}</strong>
                  <span>{description}</span>
                </div>
                <label className="automation-rules__switch">
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={savingRule === key}
                    onChange={(e) => handleToggleRule(key, e.target.checked)}
                  />
                  <span className="automation-rules__slider" />
                </label>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
