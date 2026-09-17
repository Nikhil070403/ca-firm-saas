import { useRef, useState } from 'react';
import { Upload, Trash2, Download, FileText, History, Check, X as XIcon } from 'lucide-react';
import { documentApi } from '../services/document.service';
import useApiData from '../../../hooks/useApiData';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import { isAdminRole } from '../../../constants/roles';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Textarea from '../../../components/ui/Textarea';
import FormField from '../../../components/ui/FormField';
import { formatDate } from '../../../utils/format';

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const APPROVAL_TONES = { pending: 'warning', approved: 'success', rejected: 'danger' };
const APPROVAL_LABELS = { pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected' };

export default function DocumentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const versionInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [uploadingVersionFor, setUploadingVersionFor] = useState(null);
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const canReview = isAdminRole(user?.role);

  const { data, loading, error, refetch } = useApiData(
    () => documentApi.list({ page, limit: 20, search }),
    [page, search]
  );

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentApi.upload(file, { ownerType: 'firm', ownerId: user.firmId, requiresApproval });
      toast.success(requiresApproval ? 'Document uploaded and submitted for approval' : 'Document uploaded');
      setRequiresApproval(false);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVersionFileSelected = async (e) => {
    const file = e.target.files[0];
    const docId = uploadingVersionFor;
    if (!file || !docId) return;
    setBusyId(docId);
    try {
      const updated = await documentApi.uploadNewVersion(docId, file);
      toast.success('New version uploaded');
      setHistoryDoc((prev) => (prev && prev._id === docId ? updated : prev));
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusyId(null);
      setUploadingVersionFor(null);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await documentApi.remove(id);
      toast.success('Document deleted');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleApprove = async (doc) => {
    setBusyId(doc._id);
    try {
      await documentApi.review(doc._id, 'approved');
      toast.success('Document approved');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (doc) => {
    setRejectingDoc(doc);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectingDoc) return;
    setBusyId(rejectingDoc._id);
    try {
      await documentApi.review(rejectingDoc._id, 'rejected', rejectReason.trim() || undefined);
      toast.success('Document rejected');
      setRejectingDoc(null);
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (d) => <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={15} /> {d.name}</span> },
    { key: 'fileSizeBytes', label: 'Size', render: (d) => formatBytes(d.versions?.[d.versions.length - 1]?.fileSizeBytes) },
    { key: 'version', label: 'Version', render: (d) => `v${d.currentVersion}` },
    {
      key: 'approvalStatus',
      label: 'Approval',
      render: (d) => (d.approvalStatus === 'not_required'
        ? <span style={{ color: 'var(--color-text-faint)' }}>—</span>
        : <Badge tone={APPROVAL_TONES[d.approvalStatus]}>{APPROVAL_LABELS[d.approvalStatus]}</Badge>),
    },
    { key: 'uploadedBy', label: 'Uploaded By', render: (d) => d.uploadedBy?.name || '—' },
    { key: 'createdAt', label: 'Uploaded', render: (d) => formatDate(d.createdAt) },
    {
      key: 'actions',
      label: '',
      render: (d) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {canReview && d.approvalStatus === 'pending' && (
            <>
              <button
                type="button"
                title="Approve"
                disabled={busyId === d._id}
                onClick={() => handleApprove(d)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }}
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                title="Reject"
                disabled={busyId === d._id}
                onClick={() => openReject(d)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
              >
                <XIcon size={16} />
              </button>
            </>
          )}
          <button
            type="button"
            title="Version history"
            onClick={() => setHistoryDoc(d)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <History size={15} />
          </button>
          <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }} title="Download current version">
            <Download size={15} />
          </a>
          <button type="button" onClick={() => handleDelete(d._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Documents</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Firm-wide document library
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
            Submit for approval
          </label>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileSelected} />
          <Button icon={Upload} loading={uploading} onClick={() => fileInputRef.current.click()}>Upload</Button>
        </div>
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
        searchPlaceholder="Search documents…"
        emptyTitle="No documents uploaded yet"
      />

      <Modal
        isOpen={!!historyDoc}
        onClose={() => setHistoryDoc(null)}
        title={historyDoc ? `Version history — ${historyDoc.name}` : ''}
        footer={(
          <>
            <input ref={versionInputRef} type="file" hidden onChange={handleVersionFileSelected} />
            <Button
              loading={busyId === historyDoc?._id}
              onClick={() => { setUploadingVersionFor(historyDoc._id); versionInputRef.current.click(); }}
            >
              Upload new version
            </Button>
          </>
        )}
      >
        {historyDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...historyDoc.versions].reverse().map((v) => (
              <div
                key={v.versionNumber}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)',
                  background: v.versionNumber === historyDoc.currentVersion ? 'var(--color-primary-soft)' : 'transparent',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    v{v.versionNumber} {v.versionNumber === historyDoc.currentVersion && <span style={{ color: 'var(--color-primary)' }}>(current)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {formatBytes(v.fileSizeBytes)} · uploaded {formatDate(v.uploadedAt)}
                  </div>
                </div>
                <a href={v.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>
                  <Download size={16} />
                </a>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!rejectingDoc}
        onClose={() => setRejectingDoc(null)}
        title="Reject document"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setRejectingDoc(null)}>Cancel</Button>
            <Button variant="danger" loading={busyId === rejectingDoc?._id} onClick={handleReject}>Reject</Button>
          </>
        )}
      >
        <FormField label="Reason (optional)" htmlFor="reject-reason">
          <Textarea
            id="reject-reason"
            rows={3}
            placeholder="Let the uploader know what needs fixing…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </FormField>
      </Modal>
    </div>
  );
}
