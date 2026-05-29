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

// ── Types ─────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Whether the user has an active Alpaca Broker account */
  alpacaConnected: boolean;
  /** @deprecated Use alpacaConnected */
  ibkrConnected: boolean;
  subscription: Subscription | null;
  login: (credentials: LoginCredentials & { twoFactorCode?: string }) => Promise<{ requires2FA: boolean }>;
  logout: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  clearError: () => void;
  upgradeTier: (tier: 'member' | 'private') => Promise<void>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  tier?: 'standard' | 'private';
}

// ── Mock Data ─────────────────────────────────────────────────

const MOCK_USER: User = {
  id:               'usr_01',
  email:            'massimo@obsidiancapital.com',
  name:             'Massimo Caruso',
  tier:             'private',
  kycStatus:        'approved',
  buyingPower:      250000,
  portfolioValue:   1_843_200,
  alpacaConnected:  true,
  createdAt:        '2026-01-15T00:00:00Z',
};

const MOCK_SUBSCRIPTION: Subscription = {
  tier:             'private',
  status:           'active',
  currentPeriodEnd: '2026-06-15T00:00:00Z',
  monthlyAmount:    500,
};

// ── Context ───────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [alpacaConnected, setAlpacaConnected] = useState(false);
  const [subscription, setSubscription]       = useState<Subscription | null>(null);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('oc_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
        // Restore Alpaca connection status from user object
        setAlpacaConnected(parsed.alpacaConnected ?? false);
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

        const loggedInUser: User = { ...MOCK_USER, email: credentials.email };
        setUser(loggedInUser);
        localStorage.setItem('oc_user', JSON.stringify(loggedInUser));
        setSubscription({ ...MOCK_SUBSCRIPTION, tier: loggedInUser.tier });
        setAlpacaConnected(loggedInUser.alpacaConnected ?? false);

        return { requires2FA: false };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Login failed.';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
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
        id:              `usr_${Date.now()}`,
        email:           payload.email,
        name:            payload.name,
        tier:            payload.tier === 'private' ? 'private' : 'standard',
        kycStatus:       'pending',
        buyingPower:     0,
        portfolioValue:  0,
        alpacaConnected: false, // account created async — initially false
        createdAt:       new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem('oc_user', JSON.stringify(newUser));
      setAlpacaConnected(false);
      setSubscription({
        tier:     newUser.tier,
        status:   'trialing',
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

  // ── Stripe Tier Upgrade ───────────────────────────────────

  const upgradeTier = useCallback(async (tier: 'member' | 'private') => {
    try {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('oc_user') || '{}').token || ''; } catch { return ''; }
      })();

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier,
          successUrl: `${window.location.origin}/settings/billing?upgraded=true`,
          cancelUrl:  `${window.location.origin}/settings/billing`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { checkoutUrl } = await response.json() as { checkoutUrl: string };
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
        ibkrConnected: alpacaConnected, // backwards compat alias
        subscription,
        login,
        logout,
        register,
        clearError,
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
