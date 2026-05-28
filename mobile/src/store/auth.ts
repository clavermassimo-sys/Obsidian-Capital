/* ============================================================
   Obsidian Capital Mobile — Zustand Auth Store
   Persists JWT to SecureStore; exposes login / logout / loadStoredAuth
   ============================================================ */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, TOKEN_KEY } from '@/services/api';
import type { User } from '@/services/api';

// ── Store Shape ───────────────────────────────────────────────

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  /** Authenticate with email + password, persist token */
  login: (email: string, password: string) => Promise<void>;

  /** Clear session from memory and SecureStore */
  logout: () => Promise<void>;

  /** Re-hydrate user from stored token on app start */
  loadStoredAuth: () => Promise<void>;

  /** Clear transient error */
  clearError: () => void;
}

// ── Implementation ────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // ── login ───────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authApi.login(email, password);

      // Persist token in device SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      set({ user, token, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Login failed.');
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  // ── logout ──────────────────────────────────────────────────
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // best-effort
    }
    set({ user: null, token: null, error: null });
  },

  // ── loadStoredAuth ───────────────────────────────────────────
  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // Validate token by fetching current user
      const { user } = await authApi.getMe();
      set({ user, token, isLoading: false });
    } catch {
      // Token expired or invalid — clear it
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => null);
      set({ user: null, token: null, isLoading: false });
    }
  },

  // ── clearError ───────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));
