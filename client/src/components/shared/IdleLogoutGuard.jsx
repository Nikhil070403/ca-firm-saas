import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimerOff } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useToast } from './Toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import {
  touchActivity, msSinceLastActivity,
  IDLE_TIMEOUT_MS, WARNING_BEFORE_MS, IDLE_CHECK_INTERVAL_MS,
} from '../../constants/session';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

/**
 * Auto-logout after IDLE_TIMEOUT_MS without user interaction, with a
 * countdown warning for the final WARNING_BEFORE_MS. Mounted once inside
 * the authenticated route tree. The last-activity timestamp lives in
 * sessionStorage so a page refresh doesn't reset the clock, and a laptop
 * waking from sleep past the limit logs out on the next check tick.
 */
export default function IdleLogoutGuard() {
  const { isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const loggingOut = useRef(false);
  const warningOpenRef = useRef(false);

  const forceLogout = useCallback(async () => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    setWarningOpen(false);
    warningOpenRef.current = false;
    try {
      await logout();
    } finally {
      toast.error('You were logged out after 30 minutes of inactivity');
      navigate('/login', { replace: true });
      loggingOut.current = false;
    }
  }, [logout, toast, navigate]);

  const staySignedIn = useCallback(() => {
    touchActivity();
    setWarningOpen(false);
    warningOpenRef.current = false;
  }, []);

  // Record user interactions. While the warning modal is open, passive
  // activity (a stray mouse wheel) must NOT silently extend the session —
  // only the explicit "Stay signed in" button does.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const onActivity = () => {
      if (!warningOpenRef.current) touchActivity();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
  }, [isAuthenticated]);

  // The watchdog: checks idle time on an interval and drives both the
  // warning countdown and the final logout.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const check = () => {
      const idleFor = msSinceLastActivity();
      const remaining = IDLE_TIMEOUT_MS - idleFor;

      if (remaining <= 0) {
        forceLogout();
        return;
      }
      if (remaining <= WARNING_BEFORE_MS) {
        setWarningOpen(true);
        warningOpenRef.current = true;
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else if (warningOpenRef.current) {
        setWarningOpen(false);
        warningOpenRef.current = false;
      }
    };

    check();
    const everyTick = setInterval(check, IDLE_CHECK_INTERVAL_MS);
    // While the warning is visible, refresh the countdown every second.
    const everySecond = setInterval(() => {
      if (warningOpenRef.current) {
        setSecondsLeft(Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - msSinceLastActivity()) / 1000)));
      }
    }, 1000);

    return () => {
      clearInterval(everyTick);
      clearInterval(everySecond);
    };
  }, [isAuthenticated, forceLogout]);

  if (!isAuthenticated) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <Modal
      isOpen={warningOpen}
      onClose={staySignedIn}
      title="Are you still there?"
      size="sm"
      footer={(
        <>
          <Button variant="outline" onClick={forceLogout}>Log out now</Button>
          <Button onClick={staySignedIn}>Stay signed in</Button>
        </>
      )}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: 'var(--color-warning-soft)', color: 'var(--color-warning)',
        }}
        >
          <TimerOff size={20} />
        </span>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>
          You've been inactive for a while. For security, you'll be logged out
          automatically in <strong>{mins}:{secs}</strong> unless you continue.
        </p>
      </div>
    </Modal>
  );
}
