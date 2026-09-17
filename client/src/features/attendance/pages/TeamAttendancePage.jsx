import { useState } from 'react';
import { attendanceApi } from '../services/attendance.service';
import useApiData from '../../../hooks/useApiData';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { formatDateTime } from '../../../utils/format';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStr() {
  return new Date().toISOString().slice(0, 7);
}

export default function TeamAttendancePage() {
  const [date, setDate] = useState(todayStr());
  const [month, setMonth] = useState(monthStr());

  const { data: dayData, loading: dayLoading } = useApiData(() => attendanceApi.teamByDate(date), [date]);
  const { data: summaryData, loading: summaryLoading } = useApiData(() => attendanceApi.monthlySummary(month), [month]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Team Attendance</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Who's in today, and days present this month
        </p>
      </div>

      <Card>
        <CardHeader
          title="Daily view"
          action={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 160 }} />}
        />
        {dayLoading ? (
          <Spinner label="Loading…" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(dayData?.entries || []).map((entry) => (
              <div
                key={entry.user.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{entry.user.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {entry.checkInAt ? (
                    <>
                      <span>In: {formatDateTime(entry.checkInAt)}</span>
                      {entry.checkOutAt ? <span>Out: {formatDateTime(entry.checkOutAt)}</span> : <Badge tone="success">Checked in</Badge>}
                    </>
                  ) : (
                    <Badge tone="neutral">Absent</Badge>
                  )}
                </div>
              </div>
            ))}
            {(dayData?.entries || []).length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No staff found.</p>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Monthly summary"
          action={<Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 160 }} />}
        />
        {summaryLoading ? (
          <Spinner label="Loading…" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(summaryData?.summary || []).map((row) => (
              <div
                key={row.user.id}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{row.user.name}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{row.daysPresent} day{row.daysPresent === 1 ? '' : 's'} present</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
