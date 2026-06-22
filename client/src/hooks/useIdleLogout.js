import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

/**
 * Auto-logout after a period of user inactivity.
 * Shows a warning toast shortly before logging out, and resets on any
 * mouse / keyboard / touch / scroll activity.
 *
 * @param {number} idleMinutes     total inactivity before logout (default 15 min)
 * @param {number} warnBeforeSecs  warning shown this many seconds before logout (default 60s)
 */
export function useIdleLogout(idleMinutes = 15, warnBeforeSecs = 60) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const idleTimer = useRef(null);
  const warnTimer = useRef(null);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
  }, []);

  const doLogout = useCallback(async () => {
    clearTimers();
    await logout();
    toast.error("You've been logged out due to inactivity.");
    navigate('/login', { replace: true });
  }, [clearTimers, logout, navigate]);

  const resetTimers = useCallback(() => {
    clearTimers();
    const idleMs = idleMinutes * 60 * 1000;
    const warnMs = Math.max(idleMs - warnBeforeSecs * 1000, 0);

    warnTimer.current = setTimeout(() => {
      toast.info(`You'll be logged out in ${warnBeforeSecs}s due to inactivity. Move your mouse to stay signed in.`, {
        duration: warnBeforeSecs * 1000,
      });
    }, warnMs);

    idleTimer.current = setTimeout(doLogout, idleMs);
  }, [clearTimers, idleMinutes, warnBeforeSecs, doLogout]);

  useEffect(() => {
    if (!user) { clearTimers(); return; }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    resetTimers();
    events.forEach((evt) => window.addEventListener(evt, resetTimers, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimers));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
}
