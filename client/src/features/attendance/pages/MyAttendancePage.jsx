import { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { attendanceApi } from '../services/attendance.service';
import useApiData from '../../../hooks/useApiData';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/ui/DataTable';
import { formatDate, formatDateTime } from '../../../utils/format';

function monthStr() {
  return new Date().toISOString().slice(0, 7);
}

export default function MyAttendancePage() {
  const toast = useToast();
  const [month] = useState(monthStr());
  const [busy, setBusy] = useState(false);
  const { data: records, loading, refetch } = useApiData(() => attendanceApi.myHistory(month), [month]);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = (records || []).find((r) => r.date === today);

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await attendanceApi.checkIn();
      toast.success('Checked in');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try {
      await attendanceApi.checkOut();
      toast.success('Checked out');
      refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'checkInAt', label: 'Check In', render: (r) => (r.checkInAt ? formatDateTime(r.checkInAt) : '—') },
    { key: 'checkOutAt', label: 'Check Out', render: (r) => (r.checkOutAt ? formatDateTime(r.checkOutAt) : '—') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>My Attendance</h1>

      <Card>
        <CardHeader title="Today" subtitle="Mark your check-in and check-out for the day" />
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={LogIn} loading={busy} disabled={!!todayRecord?.checkInAt} onClick={handleCheckIn}>
            {todayRecord?.checkInAt ? `Checked in ${formatDateTime(todayRecord.checkInAt)}` : 'Check In'}
          </Button>
          <Button
            icon={LogOut}
            variant="secondary"
            loading={busy}
            disabled={!todayRecord?.checkInAt || !!todayRecord?.checkOutAt}
            onClick={handleCheckOut}
          >
            {todayRecord?.checkOutAt ? `Checked out ${formatDateTime(todayRecord.checkOutAt)}` : 'Check Out'}
          </Button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={records || []}
        loading={loading}
        getRowId={(r) => r._id}
        emptyTitle="No attendance recorded this month"
      />
    </div>
  );
}
