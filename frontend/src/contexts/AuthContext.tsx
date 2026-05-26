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
import type { User, LoginCredentials } from '@/types/index';

// ── Types ─────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials & { twoFactorCode?: string }) => Promise<{ requires2FA: boolean }>;
  logout: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  clearError: () => void;
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

// ── Context ───────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('oc_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('oc_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials & { twoFactorCode?: string }): Promise<{ requires2FA: boolean }> => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 800));

        // Mock validation
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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('oc_user');
  }, []);

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
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
        login,
        logout,
        register,
        clearError,
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
