import { Download } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import useApiData from '../../../hooks/useApiData';
import { downloadCsv } from '../../../utils/csv';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import UserLink from '../../../components/shared/UserLink';
import { formatDateTime } from '../../../utils/format';

const ENTITY_TONES = {
  lead: 'primary', client: 'primary', task: 'warning',
  invoice: 'success', reminder: 'warning', document: 'neutral', user: 'neutral',
};

/**
 * Firm-wide audit trail (admin only): who did what, across every module.
 */
export default function ActivityLogPage() {
  const { data: activities, loading, error } = useApiData(
    () => apiClient.get('/activity', { params: { limit: 100 } }).then((r) => r.data.data.activities),
    []
  );

  const columns = [
    { key: 'createdAt', label: 'When', render: (a) => formatDateTime(a.createdAt) },
    {
      key: 'entityType',
      label: 'Module',
      render: (a) => <Badge tone={ENTITY_TONES[a.entityType] || 'neutral'}>{a.entityType}</Badge>,
    },
    { key: 'description', label: 'Activity', render: (a) => a.description },
    { key: 'performedBy', label: 'By', render: (a) => <UserLink user={a.performedBy} /> },
  ];

  const handleExport = () => {
    downloadCsv('activity-log.csv', activities || [], [
      { label: 'When', accessor: (a) => formatDateTime(a.createdAt) },
      { key: 'entityType', label: 'Module' },
      { key: 'description', label: 'Activity' },
      { label: 'By', accessor: (a) => a.performedBy?.name || '' },
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Activity Log</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            The last {activities?.length ?? 0} actions across the firm
          </p>
        </div>
        <Button size="sm" variant="outline" icon={Download} disabled={!activities?.length} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={activities || []}
        loading={loading}
        error={error}
        emptyTitle="No activity yet"
        emptyDescription="Actions performed across the firm will be logged here"
      />
    </div>
  );
}
