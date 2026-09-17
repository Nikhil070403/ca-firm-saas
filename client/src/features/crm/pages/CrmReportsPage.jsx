import { useMemo } from 'react';
import { leadApi, SELECTABLE_LEAD_STATUSES } from '../services/lead.service';
import useApiData from '../../../hooks/useApiData';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import UserLink from '../../../components/shared/UserLink';
import { formatCurrency } from '../../../utils/format';
import './CrmReportsPage.css';

/**
 * CRM analytics: pipeline funnel, conversion rate, lead-source performance
 * and per-owner performance — everything computed from the three lead
 * summary endpoints.
 */
export default function CrmReportsPage() {
  const { data: pipeline, loading: l1 } = useApiData(() => leadApi.pipelineSummary(), []);
  const { data: sources, loading: l2 } = useApiData(() => leadApi.sourceSummary(), []);
  const { data: owners, loading: l3 } = useApiData(() => leadApi.ownerSummary(), []);
  const loading = l1 || l2 || l3;

  const { funnel, totals } = useMemo(() => {
    const counts = {};
    (Array.isArray(pipeline) ? pipeline : []).forEach((row) => { counts[row._id] = row; });
    // Funnel bars show the trimmed pipeline only; aggregate totals still
    // count every status (incl. won/lost) so conversion stays accurate.
    const ordered = SELECTABLE_LEAD_STATUSES.map((status) => ({
      status,
      count: counts[status]?.count || 0,
      value: counts[status]?.value || 0,
    }));
    const total = Object.values(counts).reduce((acc, r) => acc + (r.count || 0), 0);
    const won = counts.won?.count || 0;
    const lost = counts.lost?.count || 0;
    return {
      funnel: ordered,
      totals: {
        total,
        won,
        lost,
        open: total - won - lost,
        conversion: total ? Math.round((won / total) * 100) : 0,
        pipelineValue: ordered.reduce((acc, r) => acc + r.value, 0),
      },
    };
  }, [pipeline]);

  const maxCount = Math.max(1, ...funnel.map((f) => f.count));

  if (loading) {
    return <div style={{ padding: '60px 0' }}><Spinner label="Crunching CRM numbers…" /></div>;
  }

  return (
    <div className="crm-reports">
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>CRM Reports</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Pipeline health, sources and team performance
        </p>
      </div>

      <div className="crm-reports__stats">
        <Card><p className="crm-reports__stat-label">Total Leads</p><p className="crm-reports__stat-value">{totals.total}</p></Card>
        <Card><p className="crm-reports__stat-label">Open</p><p className="crm-reports__stat-value">{totals.open}</p></Card>
        <Card><p className="crm-reports__stat-label">Won</p><p className="crm-reports__stat-value" style={{ color: 'var(--color-success)' }}>{totals.won}</p></Card>
        <Card><p className="crm-reports__stat-label">Conversion Rate</p><p className="crm-reports__stat-value">{totals.conversion}%</p></Card>
        <Card><p className="crm-reports__stat-label">Open Pipeline Value</p><p className="crm-reports__stat-value">{formatCurrency(totals.pipelineValue)}</p></Card>
      </div>

      <Card title="Pipeline Funnel" subtitle="Lead count at each stage">
        <div className="crm-reports__funnel">
          {funnel.map((row) => (
            <div key={row.status} className="crm-reports__funnel-row">
              <span className="crm-reports__funnel-label">{row.status.replace(/_/g, ' ')}</span>
              <div className="crm-reports__funnel-track">
                <div
                  className={`crm-reports__funnel-bar is-${row.status}`}
                  style={{ width: `${(row.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="crm-reports__funnel-count">{row.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="crm-reports__tables">
        <Card title="Lead Sources" subtitle="Where leads come from and what converts">
          <table className="crm-reports__table">
            <thead>
              <tr><th>Source</th><th>Leads</th><th>Won</th><th>Conv.</th><th>Est. Value</th></tr>
            </thead>
            <tbody>
              {(sources || []).map((s) => (
                <tr key={s._id || 'unknown'}>
                  <td style={{ textTransform: 'capitalize' }}>{(s._id || 'unknown').replace(/_/g, ' ')}</td>
                  <td>{s.count}</td>
                  <td>{s.won}</td>
                  <td>{s.count ? Math.round((s.won / s.count) * 100) : 0}%</td>
                  <td>{formatCurrency(s.value)}</td>
                </tr>
              ))}
              {(!sources || sources.length === 0) && (
                <tr><td colSpan={5} className="crm-reports__empty">No lead data yet</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card title="Team Performance" subtitle="Leads handled per owner">
          <table className="crm-reports__table">
            <thead>
              <tr><th>Owner</th><th>Leads</th><th>Won</th><th>Lost</th><th>Win Rate</th></tr>
            </thead>
            <tbody>
              {(owners || []).map((o) => (
                <tr key={o._id || 'unassigned'}>
                  <td>
                    {o.owner
                      ? <UserLink user={{ _id: o._id, name: o.owner.name }} />
                      : <span style={{ color: 'var(--color-text-faint)' }}>Unassigned</span>}
                  </td>
                  <td>{o.count}</td>
                  <td>{o.won}</td>
                  <td>{o.lost}</td>
                  <td>{o.count ? Math.round((o.won / o.count) * 100) : 0}%</td>
                </tr>
              ))}
              {(!owners || owners.length === 0) && (
                <tr><td colSpan={5} className="crm-reports__empty">No lead data yet</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
