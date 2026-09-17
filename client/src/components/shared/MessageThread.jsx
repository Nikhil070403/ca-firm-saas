import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import Spinner from '../ui/Spinner';
import { formatDateTime } from '../../utils/format';
import './MessageThread.css';

/**
 * Shared bubble-list chat UI for the client<->firm conversation. `viewerRole`
 * ('staff' | 'client') decides which bubbles render as "mine" (right-aligned)
 * vs "theirs" — the same component and the same Message records power both
 * the staff-side panel on ClientDetailPage and the client's Portal page.
 */
export default function MessageThread({ messages, viewerRole, onSend, sending, loading, emptyText = 'No messages yet' }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    await onSend(body);
  };

  return (
    <div className="message-thread">
      <div className="message-thread__list">
        {loading ? (
          <Spinner label="Loading messages…" />
        ) : (messages || []).length === 0 ? (
          <p className="message-thread__empty">{emptyText}</p>
        ) : (
          (messages || []).map((m) => {
            const isOwn = m.senderRole === viewerRole;
            return (
              <div key={m._id} className={`message-thread__row ${isOwn ? 'is-own' : ''}`}>
                <div className="message-thread__bubble">
                  <p className="message-thread__body">{m.body}</p>
                  <span className="message-thread__meta">
                    {m.senderId?.name || (m.senderRole === 'client' ? 'Client' : 'Firm')} · {formatDateTime(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form className="message-thread__composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="message-thread__input"
          maxLength={4000}
        />
        <button type="submit" className="message-thread__send" disabled={sending || !text.trim()} aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
