import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import './RowActionsMenu.css';

const MENU_WIDTH = 160;
const ITEM_HEIGHT = 36;

/**
 * Three-dot dropdown for table rows. The menu renders through a portal on
 * document.body with fixed positioning — an absolutely-positioned child
 * would be clipped by the table's overflow scroll container. Flips upward
 * when there's no room below, and closes on any scroll/resize rather than
 * trying to track the row.
 */
export default function RowActionsMenu({ actions = [] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const toggle = () => {
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        const menuHeight = actions.length * ITEM_HEIGHT + 12;
        const openUp = rect.bottom + menuHeight > window.innerHeight - 8;
        setPos({
          top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
          left: Math.max(8, rect.right - MENU_WIDTH),
        });
      }
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className="row-actions__trigger"
        onClick={toggle}
        aria-label="Row actions"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="row-actions__menu"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map(({ label, icon: Icon, tone, onClick }) => (
            <button
              key={label}
              type="button"
              className={`row-actions__item ${tone === 'danger' ? 'is-danger' : ''}`}
              onClick={() => { setOpen(false); onClick(); }}
            >
              {Icon && <Icon size={14} />}
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
