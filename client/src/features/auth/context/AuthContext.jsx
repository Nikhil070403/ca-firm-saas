import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../services/auth.service';
import { setAccessToken, setUnauthorizedHandler } from '../../../services/apiClient';
import {
  markSessionActive, clearSessionMarker, hasSessionMarker,
  msSinceLastActivity, IDLE_TIMEOUT_MS,
} from '../../../constants/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    clearSessionMarker();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // Boot-time session restore. The refresh cookie may still be valid, but we
  // only use it when this tab's sessionStorage marker proves the load is a
  // refresh of an already-authenticated tab. A brand-new tab (after a tab
  // close) has no marker -> straight to the login screen. Likewise, if the
  // tab slept past the idle limit, treat it as expired instead of restoring.
  useEffect(() => {
    if (!hasSessionMarker() || msSinceLastActivity() > IDLE_TIMEOUT_MS) {
      clearSessionMarker();
      setInitializing(false);
      return;
    }

    authApi
      .refresh()
      .then(({ user: refreshedUser, accessToken }) => {
        setAccessToken(accessToken);
        setUser(refreshedUser);
        markSessionActive();
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
        clearSessionMarker();
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    if (result.requires2FA) return result; // { requires2FA: true, tempToken } — caller shows the code step

    setAccessToken(result.accessToken);
    setUser(result.user);
    markSessionActive();
    return result.user;
  }, []);

  const verifyTwoFactor = useCallback(async (tempToken, code) => {
    const { user: loggedInUser, accessToken } = await authApi.verifyLoginTwoFactor(tempToken, code);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    markSessionActive();
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, accessToken } = await authApi.register(payload);
    setAccessToken(accessToken);
    setUser(newUser);
    markSessionActive();
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      initializing,
      login,
      verifyTwoFactor,
      register,
      logout,
      setUser,
    }),
    [user, initializing, login, verifyTwoFactor, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
