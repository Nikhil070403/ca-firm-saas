import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '../../features/reminders/services/notification.service';
import './NotificationBell.css';

const POLL_INTERVAL_MS = 60000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const load = useCallback(() => {
    notificationApi
      .list({ limit: 8 })
      .then((res) => {
        setItems(res.data);
        setUnreadCount(res.meta?.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    load();
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button type="button" className="notification-bell__trigger" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-bell__list">
            {items.length === 0 && <p className="notification-bell__empty">You're all caught up</p>}
            {items.map((n) => (
              <div key={n._id} className={`notification-bell__item ${n.status !== 'read' ? 'is-unread' : ''}`}>
                <p className="notification-bell__title">{n.title}</p>
                <p className="notification-bell__message">{n.message}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="notification-bell__view-all"
            onClick={() => { setOpen(false); navigate('/notifications'); }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
