import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Send, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { ROLE_LABELS } from '../../constants/roles';
import { extractErrorMessage } from '../../services/apiClient';
import {
  greetingFor, startersFor, fallbackFor, answerFor, matchTopic, topicsForUser,
} from '../../constants/assistantKnowledge';
import {
  actionsForUser, destinationsForUser, roleOptionsFor,
} from '../../constants/assistantActions';
import './PanelAssistant.css';

/**
 * Floating assistant that both EXPLAINS the panel and DOES things in it —
 * creating records and navigating — without the user leaving the chat.
 *
 * Everything is role-derived: which topics are reachable, which actions are
 * offered, which destinations exist, the greeting, the starters, and the
 * answer text itself. The action list is UX only — each `run()` calls the
 * same guarded endpoint the normal screens use, so the server stays the
 * security boundary.
 *
 * Intent priority is action > destination > knowledge, because "add a client"
 * should create one rather than explain what clients are.
 */
export default function PanelAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isClient = user?.role === 'client';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // The in-chat form for a side-effecting action: { action, values, error, submitting }
  const [pending, setPending] = useState(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const topics = useMemo(() => topicsForUser(user), [user]);
  const actions = useMemo(() => actionsForUser(user), [user]);
  const destinations = useMemo(() => destinationsForUser(user), [user]);
  const starters = useMemo(() => startersFor(user), [user]);
  const fallback = fallbackFor(user);

  // Offer the things this role can DO alongside the things it can ask about.
  const quickActions = useMemo(() => actions.map((a) => a.label), [actions]);

  const chipsFor = (topic) => {
    const usable = (topic.chips || []).filter((chip) => matchTopic(chip, topics));
    return usable.length > 0 ? usable : starters;
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        from: 'bot',
        text: greetingFor(user),
        chips: starters,
        actionChips: quickActions,
      }]);
    }
  }, [isOpen, messages.length, user, starters, quickActions]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, pending]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const pushBot = (msg) => setMessages((prev) => [...prev, { from: 'bot', ...msg }]);

  /** Resolve a field's select options, which may depend on the actor's role. */
  const optionsForField = (field) => {
    if (field.dynamic === 'assignableRoles') return roleOptionsFor(user);
    return field.options || [];
  };

  const beginAction = async (action) => {
    const values = {};
    action.fields.forEach((f) => {
      values[f.name] = f.defaultValue || (f.type === 'select' ? (optionsForField(f)[0]?.value ?? '') : '');
    });

    const hasLookups = action.fields.some((f) => f.type === 'lookup');
    setPending({ action, values, error: '', submitting: false, loading: hasLookups, lookups: {} });
    pushBot({ text: action.intro });

    if (!hasLookups) return;

    // Edit actions target a real record, so pull the current candidates. The
    // server scopes these already (an employee only sees their own).
    try {
      const lookups = {};
      await Promise.all(action.fields
        .filter((f) => f.type === 'lookup')
        .map(async (f) => { lookups[f.name] = await f.loadOptions(); }));

      setPending((p) => {
        if (!p || p.action.id !== action.id) return p; // cancelled while loading
        const next = { ...p.values };
        Object.entries(lookups).forEach(([name, opts]) => {
          if (!next[name] && opts.length > 0) next[name] = opts[0].value;
        });
        return { ...p, values: next, lookups, loading: false };
      });
    } catch (err) {
      setPending((p) => (p && p.action.id === action.id
        ? { ...p, loading: false, error: extractErrorMessage(err) }
        : p));
    }
  };

  const cancelAction = () => {
    setPending(null);
    pushBot({ text: 'No problem — cancelled. Anything else?', chips: starters, actionChips: quickActions });
  };

  const submitAction = async () => {
    if (!pending || pending.loading) return;
    const { action, values, lookups } = pending;

    const missing = action.fields.find((f) => f.required && !String(values[f.name] || '').trim());
    if (missing) {
      setPending((p) => ({ ...p, error: `${missing.label} is required` }));
      return;
    }

    setPending((p) => ({ ...p, submitting: true, error: '' }));
    try {
      // Success messages read better with the record's NAME than its id, and
      // after the call the row may no longer be in the pending list.
      const labelOf = (fieldName) => {
        const opts = (lookups && lookups[fieldName]) || [];
        const hit = opts.find((o) => o.value === values[fieldName]);
        return hit ? hit.label : values[fieldName];
      };
      const result = await action.run(values, { labelOf });
      setPending(null);
      pushBot({
        text: result.message,
        success: true,
        link: result.path ? { path: result.path, label: result.pathLabel || 'View it' } : null,
        chips: starters,
        actionChips: quickActions,
      });
    } catch (err) {
      // Server rejections (validation, permissions) surface verbatim so the
      // user sees the real reason rather than a generic failure.
      setPending((p) => ({ ...p, submitting: false, error: extractErrorMessage(err) }));
    }
  };

  const go = (destination) => {
    navigate(destination.path);
    setIsOpen(false);
  };

  const ask = (question) => {
    const text = (question || '').trim();
    if (!text) return;

    setMessages((prev) => [...prev, { from: 'user', text }]);
    setDraft('');

    // An in-progress form takes precedence — don't reinterpret mid-flow.
    if (pending) {
      pushBot({ text: 'Let’s finish this first — fill the form above, or press Cancel.' });
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      const action = matchTopic(text, actions);
      if (action) { beginAction(action); return; }

      const destination = matchTopic(text, destinations);
      if (destination) {
        pushBot({
          text: `Opening ${destination.label}.`,
          navigate: destination,
          chips: starters,
        });
        return;
      }

      const topic = matchTopic(text, topics);
      pushBot({
        text: topic ? answerFor(topic, user) : fallback,
        chips: topic ? chipsFor(topic) : starters,
        actionChips: topic ? [] : quickActions,
      });
    }, 400);
  };

  const updateValue = (name, value) => {
    setPending((p) => ({ ...p, values: { ...p.values, [name]: value }, error: '' }));
  };

  /** Block Confirm when a required lookup came back empty — there's nothing to act on. */
  const canSubmit = (p) => p.action.fields.every((f) => (
    f.type !== 'lookup' || !f.required || ((p.lookups[f.name] || []).length > 0)
  ));

  return (
    <>
      <button
        type="button"
        className={`assistant-fab ${isOpen ? 'is-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open Panel Assistant"
        title="Ask a question or get something done"
      >
        <Bot size={22} />
        <span className="assistant-fab__dot" />
      </button>

      <div className={`assistant ${isOpen ? 'is-open' : ''}`} role="dialog" aria-label="Panel Assistant">
        <header className="assistant__header">
          <span className="assistant__avatar"><Sparkles size={16} /></span>
          <div className="assistant__id">
            <strong>{isClient ? 'Portal Assistant' : 'Panel Assistant'}</strong>
            <small>Ask or act — scoped to your {ROLE_LABELS[user?.role] || 'account'} role</small>
          </div>
          <button type="button" className="assistant__close" onClick={() => setIsOpen(false)} aria-label="Close assistant">
            <X size={17} />
          </button>
        </header>

        <div className="assistant__body" ref={bodyRef}>
          {messages.map((message, i) => (
            <div key={i} className={`assistant__row assistant__row--${message.from}`}>
              {message.from === 'bot' && <span className="assistant__msg-avatar"><Bot size={13} /></span>}
              <div className="assistant__group">
                <div className={`assistant__bubble ${message.success ? 'is-success' : ''}`}>
                  {message.success && <Check size={14} className="assistant__success-icon" />}
                  {message.text}
                </div>

                {message.navigate && (
                  <button type="button" className="assistant__go" onClick={() => go(message.navigate)}>
                    {message.navigate.label} <ArrowRight size={13} />
                  </button>
                )}

                {message.link && (
                  <button
                    type="button"
                    className="assistant__go"
                    onClick={() => { navigate(message.link.path); setIsOpen(false); }}
                  >
                    {message.link.label} <ArrowRight size={13} />
                  </button>
                )}

                {message.actionChips?.length > 0 && (
                  <div className="assistant__chips">
                    {message.actionChips.map((chip) => (
                      <button key={chip} type="button" className="assistant__chip assistant__chip--action" onClick={() => ask(chip)}>
                        + {chip}
                      </button>
                    ))}
                  </div>
                )}

                {message.chips?.length > 0 && (
                  <div className="assistant__chips">
                    {message.chips.map((chip) => (
                      <button key={chip} type="button" className="assistant__chip" onClick={() => ask(chip)}>
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* In-chat form for the action being set up */}
          {pending && (
            <div className="assistant__row assistant__row--bot">
              <span className="assistant__msg-avatar"><Bot size={13} /></span>
              <div className="assistant__group assistant__group--wide">
                <div className="assistant__form">
                  <p className="assistant__form-title">{pending.action.label}</p>

                  {pending.loading && <p className="assistant__form-note">Loading records…</p>}

                  {!pending.loading && pending.action.fields.map((field) => {
                    if (field.type !== 'lookup') return null;
                    const opts = pending.lookups[field.name] || [];
                    // Nothing to act on — say so plainly instead of showing an
                    // empty dropdown the user can't submit.
                    return opts.length === 0 ? (
                      <p key={field.name} className="assistant__form-note">
                        {field.emptyText || `No records available for ${field.label}.`}
                      </p>
                    ) : null;
                  })}

                  {!pending.loading && pending.action.fields.map((field) => {
                    if (field.type === 'lookup') {
                      const opts = pending.lookups[field.name] || [];
                      if (opts.length === 0) return null;
                      return (
                        <label key={field.name} className="assistant__field">
                          <span>
                            {field.label}
                            {field.required && <em className="assistant__req"> *</em>}
                          </span>
                          <select
                            value={pending.values[field.name]}
                            onChange={(e) => updateValue(field.name, e.target.value)}
                          >
                            {opts.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </label>
                      );
                    }
                    return (
                    <label key={field.name} className="assistant__field">
                      <span>
                        {field.label}
                        {field.required && <em className="assistant__req"> *</em>}
                      </span>
                      {field.type === 'select' ? (
                        <select
                          value={pending.values[field.name]}
                          onChange={(e) => updateValue(field.name, e.target.value)}
                        >
                          {optionsForField(field).map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          placeholder={field.placeholder}
                          value={pending.values[field.name]}
                          onChange={(e) => updateValue(field.name, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={pending.values[field.name]}
                          onChange={(e) => updateValue(field.name, e.target.value)}
                        />
                      )}
                    </label>
                    );
                  })}

                  {pending.error && <p className="assistant__form-error">{pending.error}</p>}

                  <div className="assistant__form-actions">
                    <button type="button" className="assistant__btn-ghost" onClick={cancelAction} disabled={pending.submitting}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="assistant__btn"
                      onClick={submitAction}
                      disabled={pending.submitting || pending.loading || !canSubmit(pending)}
                    >
                      {pending.submitting ? 'Working…' : (pending.action.confirmLabel || 'Confirm')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="assistant__row assistant__row--bot">
              <span className="assistant__msg-avatar"><Bot size={13} /></span>
              <div className="assistant__bubble assistant__typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        <form className="assistant__input" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a question or say what to do…"
            aria-label="Ask the assistant"
          />
          <button type="submit" className="assistant__send" disabled={!draft.trim()} aria-label="Send">
            <Send size={15} />
          </button>
        </form>
      </div>
    </>
  );
}
