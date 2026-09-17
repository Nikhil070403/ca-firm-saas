import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, BookOpenText, Mail, Phone, MapPin,
  FolderOpen, ListChecks, FileText, Download, PhoneCall, Users2,
  MessageCircle, StickyNote, Send,
} from 'lucide-react';
import { clientApi } from '../services/client.service';
import { ledgerApi } from '../../khatabook/services/ledger.service';
import { taskApi } from '../../tasks/services/task.service';
import { documentApi } from '../../documents/services/document.service';
import { GST_FREQUENCIES, ITR_FORMS } from '../../crm/services/compliance.service';
import Select from '../../../components/ui/Select';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import UserLink from '../../../components/shared/UserLink';
import MessageThread from '../../../components/shared/MessageThread';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';
import './ClientDetailPage.css';

const TASK_TONES = { todo: 'neutral', in_progress: 'primary', in_review: 'warning', done: 'success', blocked: 'danger' };
const EMPTY_CONTACT = { name: '', designation: '', email: '', phone: '' };

const COMM_TYPES = [
  { value: 'call', label: 'Call', icon: PhoneCall },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Users2 },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'note', label: 'Internal Note', icon: StickyNote },
];
const COMM_ICON = Object.fromEntries(COMM_TYPES.map((t) => [t.value, t.icon]));

function addressText(address) {
  if (!address) return null;
  const parts = [address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);

  const { data: client, loading, refetch } = useApiData(() => clientApi.get(id), [id]);
  const { data: risk } = useApiData(() => clientApi.risk(id).catch(() => null), [id]);
  const [savingCompliance, setSavingCompliance] = useState(false);

  const handleComplianceChange = async (patch) => {
    setSavingCompliance(true);
    try {
      await clientApi.update(id, { compliance: { ...(client.compliance || {}), ...patch } });
      toast.success('Compliance settings saved');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingCompliance(false);
    }
  };
  const { data: timeline } = useApiData(() => clientApi.timeline(id), [id], { skip: !client });
  const { data: balance } = useApiData(() => ledgerApi.balance(id).catch(() => null), [id]);
  const { data: tasksData } = useApiData(
    () => taskApi.list({ clientId: id, limit: 50, sort: '-createdAt' }),
    [id]
  );
  const { data: docsData } = useApiData(
    () => documentApi.list({ ownerType: 'client', ownerId: id, limit: 5, sort: '-createdAt' }),
    [id]
  );
  const { data: communications, refetch: refetchCommunications } = useApiData(
    () => clientApi.listCommunications(id),
    [id]
  );
  const [commForm, setCommForm] = useState({ type: 'call', summary: '' });
  const [loggingComm, setLoggingComm] = useState(false);

  const { data: messages, loading: messagesLoading, refetch: refetchMessages } = useApiData(
    () => clientApi.listMessages(id).then((list) => { clientApi.markMessagesRead(id).catch(() => {}); return list; }),
    [id]
  );
  const [sendingMessage, setSendingMessage] = useState(false);
  const handleSendMessage = async (body) => {
    setSendingMessage(true);
    try {
      await clientApi.sendMessage(id, body);
      refetchMessages();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleContactChange = (field) => (e) => setContactForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (contactForm.name.trim().length < 2) {
      toast.error('Contact name is required');
      return;
    }
    try {
      await clientApi.addContact(id, contactForm);
      toast.success('Contact added');
      setContactModalOpen(false);
      setContactForm(EMPTY_CONTACT);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleRemoveContact = async (contactId) => {
    try {
      await clientApi.removeContact(id, contactId);
      toast.success('Contact removed');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleLogCommunication = async (e) => {
    e.preventDefault();
    if (commForm.summary.trim().length < 2) {
      toast.error('Add a short summary before logging');
      return;
    }
    setLoggingComm(true);
    try {
      await clientApi.logCommunication(id, commForm);
      toast.success('Communication logged');
      setCommForm({ type: commForm.type, summary: '' });
      refetchCommunications();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoggingComm(false);
    }
  };

  if (loading) return <div style={{ padding: '60px 0' }}><Spinner label="Loading client…" /></div>;
  if (!client) return <EmptyState title="Client not found" />;

  const tasks = tasksData?.data || [];
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const documents = docsData?.data || [];
  const address = addressText(client.address);
  const initials = client.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="client-profile">
      <Link to="/crm/clients" className="client-profile__back no-print">
        <ArrowLeft size={15} /> Back to clients
      </Link>

      {/* ---- Header ---- */}
      <Card>
        <div className="client-profile__head">
          <span className="client-profile__avatar">{initials}</span>
          <div className="client-profile__identity">
            <h1>{client.displayName}</h1>
            <div className="client-profile__badges">
              <Badge tone="primary">{client.firmType.replace(/_/g, ' ')}</Badge>
              <Badge tone={client.status === 'active' ? 'success' : 'neutral'}>{client.status}</Badge>
              {risk && (
                <Badge
                  tone={risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'success'}
                  title={`Risk ${risk.score}/100 — ${risk.factors.overdueReturns} overdue return(s), ${risk.factors.overdueInvoices} overdue invoice(s), ₹${Number(risk.factors.outstanding).toLocaleString('en-IN')} outstanding, ${risk.factors.overdueTasks} overdue task(s)`}
                >
                  {risk.level} risk · {risk.score}
                </Badge>
              )}
              {(client.tags || []).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
            </div>
            <div className="client-profile__contact-chips">
              {client.email && <span><Mail size={13} /> {client.email}</span>}
              {client.phone && <span><Phone size={13} /> {client.phone}</span>}
              {address && <span><MapPin size={13} /> {address}</span>}
            </div>
          </div>
          <div className="client-profile__actions no-print">
            <Button icon={BookOpenText} onClick={() => navigate(`/khata/${client._id}`)}>
              View Ledger
            </Button>
          </div>
        </div>
      </Card>

      {/* ---- Stats ---- */}
      <div className="client-profile__stats">
        <Card>
          <p className="client-profile__stat-label">Ledger Balance</p>
          <p className="client-profile__stat-value" style={{ color: (balance || 0) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {formatCurrency(balance || 0)}
          </p>
          <p className="client-profile__stat-hint">{(balance || 0) > 0 ? 'Receivable from client' : 'Nothing outstanding'}</p>
        </Card>
        <Card>
          <p className="client-profile__stat-label">Open Tasks</p>
          <p className="client-profile__stat-value">{openTasks.length}</p>
          <p className="client-profile__stat-hint">of {tasksData?.meta?.total ?? tasks.length} total</p>
        </Card>
        <Card>
          <p className="client-profile__stat-label">Documents</p>
          <p className="client-profile__stat-value">{docsData?.meta?.total ?? documents.length}</p>
          <p className="client-profile__stat-hint">files on record</p>
        </Card>
        <Card>
          <p className="client-profile__stat-label">Client Since</p>
          <p className="client-profile__stat-value client-profile__stat-value--sm">{formatDate(client.createdAt)}</p>
          <p className="client-profile__stat-hint">added by {client.createdBy?.name || 'the firm'}</p>
        </Card>
      </div>

      {/* ---- Compliance settings ---- */}
      <Card
        title="Compliance Settings"
        subtitle={savingCompliance ? 'Saving…' : 'Drives the automatic GST / yearly return tracking and client reminders'}
      >
        <div className="client-profile__compliance">
          <label>
            <span>GST Filing</span>
            <Select
              value={client.compliance?.gstFrequency || ''}
              options={GST_FREQUENCIES}
              onChange={(e) => handleComplianceChange({ gstFrequency: e.target.value || null })}
            />
          </label>
          <label>
            <span>Income Tax Form</span>
            <Select
              value={client.compliance?.itrForm || ''}
              options={ITR_FORMS}
              onChange={(e) => handleComplianceChange({ itrForm: e.target.value || null })}
            />
          </label>
          {[
            { key: 'gstr9c', label: 'GSTR-9C (Annual)' },
            { key: 'roc', label: 'ROC / MCA Filing' },
            { key: 'audit', label: 'Audit' },
          ].map((item) => (
            <label key={item.key} className="client-profile__compliance-check">
              <input
                type="checkbox"
                checked={Boolean(client.compliance?.[item.key])}
                onChange={(e) => handleComplianceChange({ [item.key]: e.target.checked })}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* ---- Details + Contacts ---- */}
      <div className="client-profile__grid">
        <Card>
          <CardHeader title="Details" />
          <dl className="client-profile__dl">
            <dt>Email</dt><dd>{client.email || '—'}</dd>
            <dt>Phone</dt><dd>{client.phone || '—'}</dd>
            <dt>GST Number</dt><dd>{client.gstNumber || '—'}</dd>
            <dt>PAN Number</dt><dd>{client.panNumber || '—'}</dd>
            <dt>Assigned To</dt><dd><UserLink user={client.assignedTo} /></dd>
            <dt>Address</dt><dd>{address || '—'}</dd>
            {client.notes && (<><dt>Notes</dt><dd>{client.notes}</dd></>)}
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Contact Persons"
            action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setContactModalOpen(true)}>Add</Button>}
          />
          {client.contactPersons.length === 0 ? (
            <EmptyState title="No contact persons yet" description="Add the people you coordinate with at this client" />
          ) : (
            <div className="client-profile__contacts">
              {client.contactPersons.map((contact) => (
                <div key={contact._id} className="client-profile__contact">
                  <span className="client-profile__contact-avatar">{contact.name[0]?.toUpperCase()}</span>
                  <div className="client-profile__contact-info">
                    <strong>{contact.name}</strong>
                    <span>
                      {[contact.designation, contact.phone, contact.email].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="client-profile__contact-remove no-print"
                    onClick={() => handleRemoveContact(contact._id)}
                    aria-label={`Remove ${contact.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ---- Tasks + Documents ---- */}
      <div className="client-profile__grid">
        <Card>
          <CardHeader
            title="Open Tasks"
            action={<button type="button" className="entity-link" onClick={() => navigate('/crm/tasks')}><ListChecks size={13} /> All tasks</button>}
          />
          {openTasks.length === 0 ? (
            <EmptyState title="No open tasks" description="Work linked to this client will show here" />
          ) : (
            <div className="client-profile__list">
              {openTasks.slice(0, 6).map((task) => (
                <button key={task._id} type="button" className="client-profile__row" onClick={() => navigate(`/crm/tasks/${task._id}`)}>
                  <span className="client-profile__row-title">{task.title}</span>
                  <span className="client-profile__row-meta">
                    <Badge tone={TASK_TONES[task.status]}>{task.status.replace(/_/g, ' ')}</Badge>
                    {task.dueDate && <span>due {formatDate(task.dueDate)}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent Documents"
            action={<button type="button" className="entity-link" onClick={() => navigate('/crm/client-documents')}><FolderOpen size={13} /> All documents</button>}
          />
          {documents.length === 0 ? (
            <EmptyState title="No documents yet" description="Files uploaded for this client will show here" />
          ) : (
            <div className="client-profile__list">
              {documents.map((doc) => (
                <div key={doc._id} className="client-profile__row is-static">
                  <span className="client-profile__row-title"><FileText size={14} /> {doc.name}</span>
                  <span className="client-profile__row-meta">
                    <span>{formatDate(doc.createdAt)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Download}
                      onClick={() => window.open(doc.fileUrl, '_blank', 'noopener')}
                    >
                      Open
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ---- Messages ---- */}
      <Card title="Messages" subtitle="Direct chat with this client — visible to them in their Portal">
        <div style={{ height: 380 }}>
          <MessageThread
            messages={messages}
            viewerRole="staff"
            onSend={handleSendMessage}
            sending={sendingMessage}
            loading={messagesLoading}
            emptyText="No messages yet — start the conversation"
          />
        </div>
      </Card>

      {/* ---- Communication ---- */}
      <Card title="Communication" subtitle="Calls, emails, meetings, WhatsApp and internal notes with this client">
        <form onSubmit={handleLogCommunication} className="client-profile__comm-form no-print">
          <Select
            value={commForm.type}
            onChange={(e) => setCommForm((prev) => ({ ...prev, type: e.target.value }))}
            options={COMM_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            style={{ width: 160, flexShrink: 0 }}
          />
          <Textarea
            value={commForm.summary}
            onChange={(e) => setCommForm((prev) => ({ ...prev, summary: e.target.value }))}
            placeholder="What happened? e.g. Called client about pending GST documents…"
            style={{ minHeight: 40, flex: 1 }}
          />
          <Button type="submit" icon={Send} loading={loggingComm}>Log</Button>
        </form>

        {(!communications || communications.length === 0) ? (
          <EmptyState title="No communication logged yet" description="Calls, emails and meetings with this client will appear here" />
        ) : (
          <div className="client-profile__comm-list">
            {communications.map((c) => {
              const Icon = COMM_ICON[c.type] || StickyNote;
              return (
                <div key={c._id} className="client-profile__comm-item">
                  <span className={`client-profile__comm-icon is-${c.type}`}><Icon size={15} /></span>
                  <div className="client-profile__comm-body">
                    <p>{c.summary}</p>
                    <span>
                      <UserLink user={c.performedBy} /> · {formatDateTime(c.occurredAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ---- Timeline ---- */}
      <Card>
        <CardHeader title="Timeline" subtitle="Everything that happened on this client" />
        {!timeline || timeline.length === 0 ? (
          <EmptyState title="No activity recorded yet" />
        ) : (
          <div className="client-profile__timeline">
            {timeline.map((event) => (
              <div key={event._id} className="client-profile__timeline-item">
                <span className="client-profile__timeline-dot" />
                <div>
                  <p>{event.description}</p>
                  <span>
                    {event.performedBy?.name ? <UserLink user={event.performedBy} /> : 'System'}
                    {' · '}{formatDateTime(event.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---- Add contact modal ---- */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title="Add Contact Person"
        footer={(
          <>
            <Button variant="outline" onClick={() => setContactModalOpen(false)} type="button">Cancel</Button>
            <Button form="contact-form" type="submit">Add Contact</Button>
          </>
        )}
      >
        <form onSubmit={handleAddContact} id="contact-form">
          <FormField label="Name" required>
            <Input value={contactForm.name} onChange={handleContactChange('name')} autoFocus />
          </FormField>
          <FormField label="Designation">
            <Input value={contactForm.designation} onChange={handleContactChange('designation')} placeholder="e.g. Accounts Manager" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Phone">
              <Input value={contactForm.phone} onChange={handleContactChange('phone')} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={contactForm.email} onChange={handleContactChange('email')} />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
