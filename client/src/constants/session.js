/**
 * Session security policy.
 *
 * - The access token only ever lives in memory (see apiClient.js).
 * - `SESSION_MARKER_KEY` in sessionStorage marks "this tab has a live
 *   session". sessionStorage survives F5 but dies with the tab, so the
 *   boot-time silent refresh only runs on a reload — never on a fresh tab
 *   after a close. That is what implements logout-on-tab-close.
 * - `LAST_ACTIVITY_KEY` records the last user interaction; the idle guard
 *   logs the session out after IDLE_TIMEOUT_MS without one, showing a
 *   warning WARNING_BEFORE_MS before it fires.
 */
export const SESSION_MARKER_KEY = 'cafirm.session.active';
export const LAST_ACTIVITY_KEY = 'cafirm.session.lastActivityAt';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const WARNING_BEFORE_MS = 2 * 60 * 1000; // warn for the final 2 minutes
export const IDLE_CHECK_INTERVAL_MS = 15 * 1000;

export function touchActivity() {
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function msSinceLastActivity() {
  const raw = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
  if (!raw) return 0;
  return Date.now() - raw;
}

export function markSessionActive() {
  sessionStorage.setItem(SESSION_MARKER_KEY, '1');
  touchActivity();
}

export function clearSessionMarker() {
  sessionStorage.removeItem(SESSION_MARKER_KEY);
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function hasSessionMarker() {
  return sessionStorage.getItem(SESSION_MARKER_KEY) === '1';
}
