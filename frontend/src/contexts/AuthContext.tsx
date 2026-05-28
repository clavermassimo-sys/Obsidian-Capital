/* ============================================================
   Obsidian Capital — Auth Context
   ============================================================ */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { User, LoginCredentials, Subscription } from '@/types/index';
import { alpacaOAuth } from '@/services/alpaca';

// ── Types ─────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  alpacaConnected: boolean;
  subscription: Subscription | null;
  login: (credentials: LoginCredentials & { twoFactorCode?: string }) => Promise<{ requires2FA: boolean }>;
  logout: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  clearError: () => void;
  connectAlpaca: (paperMode?: boolean) => void;
  disconnectAlpaca: () => Promise<void>;
  upgradeTier: (tier: 'member' | 'private') => Promise<void>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  tier?: 'standard' | 'private';
  dob?: string;
  ssnLast4?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// ── Mock Data ─────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'usr_01',
  email: 'massimo@obsidiancapital.com',
  name: 'Massimo Caruso',
  tier: 'private',
  kycStatus: 'approved',
  buyingPower: 250000,
  portfolioValue: 1_843_200,
  createdAt: '2026-01-15T00:00:00Z',
};

const MOCK_SUBSCRIPTION: Subscription = {
  tier: 'private',
  status: 'active',
  currentPeriodEnd: '2026-06-15T00:00:00Z',
  monthlyAmount: 500,
};

// ── Context ───────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alpacaConnected, setAlpacaConnected] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('oc_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Restore Alpaca connection status
        const alpacaMode = localStorage.getItem('alpaca_connected');
        if (alpacaMode === 'true') setAlpacaConnected(true);
        // Mock subscription based on tier
        setSubscription({ ...MOCK_SUBSCRIPTION, tier: parsed.tier ?? 'standard' });
      } catch {
        localStorage.removeItem('oc_user');
      }
    }
    setIsLoading(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginCredentials & { twoFactorCode?: string }): Promise<{ requires2FA: boolean }> => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 800));

        if (!credentials.email || !credentials.password) {
          throw new Error('Email and password are required.');
        }
        if (credentials.password.length < 6) {
          throw new Error('Invalid credentials.');
        }

        // Mock 2FA step: if twoFactorCode not yet provided, signal it's needed
        if (!credentials.twoFactorCode) {
          setIsLoading(false);
          return { requires2FA: true };
        }

        // Validate mock 2FA code
        if (credentials.twoFactorCode !== '123456') {
          throw new Error('Invalid verification code.');
        }

        const loggedInUser = { ...MOCK_USER, email: credentials.email };
        setUser(loggedInUser);
        localStorage.setItem('oc_user', JSON.stringify(loggedInUser));
        setSubscription({ ...MOCK_SUBSCRIPTION, tier: loggedInUser.tier });

        // Restore Alpaca status
        const alpacaMode = localStorage.getItem('alpaca_connected');
        if (alpacaMode === 'true') setAlpacaConnected(true);

        return { requires2FA: false };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Login failed.';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Logout ────────────────────────────────────────────────

  const logout = useCallback(() => {
    setUser(null);
    setAlpacaConnected(false);
    setSubscription(null);
    localStorage.removeItem('oc_user');
  }, []);

  // ── Register ──────────────────────────────────────────────

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      if (!payload.email || !payload.password) {
        throw new Error('All fields are required.');
      }
      const newUser: User = {
        id: `usr_${Date.now()}`,
        email: payload.email,
        name: payload.name,
        tier: payload.tier === 'private' ? 'private' : 'standard',
        kycStatus: 'pending',
        buyingPower: 0,
        portfolioValue: 0,
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem('oc_user', JSON.stringify(newUser));
      setSubscription({
        tier: newUser.tier,
        status: 'trialing',
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Alpaca OAuth ──────────────────────────────────────────

  /**
   * Redirect user to Alpaca OAuth to connect their account.
   * @param paperMode - true = paper trading, false = live (default true)
   */
  const connectAlpaca = useCallback((paperMode: boolean = true) => {
    const clientId = import.meta.env.VITE_ALPACA_CLIENT_ID || '';
    const redirectUri = `${window.location.origin}/settings/alpaca-callback`;
    const authUrl = alpacaOAuth.getAuthUrl(clientId, redirectUri, paperMode);
    window.location.href = authUrl;
  }, []);

  /**
   * Disconnect Alpaca account by removing stored tokens (via backend).
   */
  const disconnectAlpaca = useCallback(async () => {
    try {
      await fetch('/api/trades/alpaca/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(() => {
            try { return JSON.parse(localStorage.getItem('oc_user') || '{}').token || ''; } catch { return ''; }
          })()}`,
        },
      });
    } catch {
      // Best-effort disconnect
    } finally {
      setAlpacaConnected(false);
      localStorage.removeItem('alpaca_connected');
    }
  }, []);

  // ── Stripe Tier Upgrade ───────────────────────────────────

  /**
   * Redirect to Stripe Checkout to upgrade the user's tier.
   */
  const upgradeTier = useCallback(async (tier: 'member' | 'private') => {
    try {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('oc_user') || '{}').token || ''; } catch { return ''; }
      })();

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier,
          successUrl: `${window.location.origin}/settings/billing?upgraded=true`,
          cancelUrl: `${window.location.origin}/settings/billing`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upgrade failed.';
      setError(msg);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        alpacaConnected,
        subscription,
        login,
        logout,
        register,
        clearError,
        connectAlpaca,
        disconnectAlpaca,
        upgradeTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
