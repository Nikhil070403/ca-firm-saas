import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FolderOpen } from 'lucide-react';
import { clientApi } from '../../clients/services/client.service';
import { documentApi } from '../../documents/services/document.service';
import useApiData from '../../../hooks/useApiData';
import DataTable from '../../../components/ui/DataTable';
import Card from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { formatDate } from '../../../utils/format';

function formatBytes(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Client-wise view of the document library: pick a client, see every file
 * attached to them. The upload flow stays on the client profile / documents
 * pages — this screen is for finding and pulling files fast.
 */
export default function ClientDocumentsPage() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [page, setPage] = useState(1);

  const { data: clientsData } = useApiData(
    () => clientApi.list({ limit: 200, sort: 'displayName' }),
    []
  );
  const clients = clientsData?.data || [];

  const { data, loading, error } = useApiData(
    () => (clientId
      ? documentApi.list({ ownerType: 'client', ownerId: clientId, page, limit: 20 })
      : Promise.resolve(null)),
    [clientId, page]
  );

  const columns = [
    { key: 'name', label: 'Document', render: (d) => <strong>{d.name}</strong> },
    { key: 'mimeType', label: 'Type', render: (d) => (d.mimeType || '').split('/')[1]?.toUpperCase() || '—' },
    {
      key: 'size',
      label: 'Size',
      render: (d) => formatBytes(d.versions?.find((v) => v.versionNumber === d.currentVersion)?.fileSizeBytes),
    },
    { key: 'tags', label: 'Tags', render: (d) => (d.tags?.length ? d.tags.join(', ') : '—') },
    { key: 'uploadedBy', label: 'Uploaded By', render: (d) => d.uploadedBy?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (d) => formatDate(d.createdAt) },
    {
      key: 'actions',
      label: '',
      render: (d) => (
        <Button
          size="sm"
          variant="outline"
          icon={Download}
          onClick={(e) => { e.stopPropagation(); window.open(d.fileUrl, '_blank', 'noopener'); }}
        >
          Open
        </Button>
      ),
    },
  ];

  const selectedClient = clients.find((c) => c._id === clientId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Client Documents</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Browse every file attached to a client
        </p>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Client
            </label>
            <Select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setPage(1); }}
              placeholder="Select a client…"
              options={clients.map((c) => ({ value: c._id, label: c.displayName }))}
            />
          </div>
          {selectedClient && (
            <Button variant="outline" onClick={() => navigate(`/crm/clients/${clientId}`)}>
              Open {selectedClient.displayName}'s profile
            </Button>
          )}
        </div>
      </Card>

      {!clientId ? (
        <EmptyState
          icon={FolderOpen}
          title="Pick a client"
          description="Choose a client above to see all their documents in one place"
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.data || []}
          loading={loading}
          error={error}
          page={page}
          limit={20}
          total={data?.meta?.total || 0}
          onPageChange={setPage}
          emptyTitle="No documents for this client"
          emptyDescription="Upload files from the client profile or the Documents page"
        />
      )}
    </div>
  );
}
