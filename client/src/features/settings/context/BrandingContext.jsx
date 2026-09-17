import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { firmApi } from '../services/settings.service';
import { useAuth } from '../../auth/context/AuthContext';

const DEFAULT_BRANDING = { name: null, logoUrl: null, primaryColor: null };

const BrandingContext = createContext({ ...DEFAULT_BRANDING, applyBranding: () => {} });

/**
 * White-label accent: fetches the firm's logo/color once per login and
 * applies primaryColor as the --color-primary CSS variable on the root
 * element — every button/link/badge that already reads that variable picks
 * it up automatically, no component-level changes needed. Cleared on
 * logout so a shared browser never bleeds one firm's branding into the
 * next login.
 */
export function BrandingProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  // Pushes freshly-saved branding straight into the shared context (used by
  // FirmSettingsPage after a save) so the sidebar/portal shell updates
  // immediately, without waiting for a reload.
  const applyBranding = useCallback((b) => {
    setBranding(b);
    if (b.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', b.primaryColor);
    } else {
      document.documentElement.style.removeProperty('--color-primary');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      document.documentElement.style.removeProperty('--color-primary');
      setBranding(DEFAULT_BRANDING);
      return;
    }
    firmApi.branding().then(applyBranding).catch(() => {});
  }, [isAuthenticated, applyBranding]);

  return <BrandingContext.Provider value={{ ...branding, applyBranding }}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
