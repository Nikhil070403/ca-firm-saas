import { useState, useEffect, useCallback } from 'react';
import { portalApi } from '../services/portal.service';
import { useToast } from '../../../components/shared/Toast';
import { extractErrorMessage } from '../../../services/apiClient';
import MessageThread from '../../../components/shared/MessageThread';

const POLL_INTERVAL_MS = 15000;

/** Direct line to the firm — same Message records the staff-side panel on
 * ClientDetailPage reads/writes, scoped server-side to this client's own
 * linkedClientId. */
export default function PortalMessagesPage() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await portalApi.messages();
      setMessages(data);
      portalApi.markMessagesRead().catch(() => {});
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const handleSend = async (body) => {
    setSending(true);
    try {
      const message = await portalApi.sendMessage(body);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Messages</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          A direct line to your firm
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 480 }}>
        <MessageThread
          messages={messages}
          viewerRole="client"
          onSend={handleSend}
          sending={sending}
          loading={loading}
          emptyText="No messages yet — say hello!"
        />
      </div>
    </div>
  );
}
