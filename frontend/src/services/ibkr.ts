/* ============================================================
   Obsidian Capital — Interactive Brokers OAuth + Connection Service
   Frontend-side helpers for connecting user IBKR accounts
   ============================================================ */

// ── Constants ─────────────────────────────────────────────────

export const IBKR_OAUTH_URL = 'https://www.interactivebrokers.com/authorize';

// ── OAuth Helpers ─────────────────────────────────────────────

/**
 * Build the IBKR OAuth authorization URL.
 */
export function getIBKRAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_IBKR_CLIENT_ID || '',
    redirect_uri: import.meta.env.VITE_IBKR_REDIRECT_URI || `${window.location.origin}/auth/ibkr/callback`,
    response_type: 'code',
    scope: 'trading',
    ...(state ? { state } : {}),
  });
  return `${IBKR_OAUTH_URL}?${params}`;
}

// ── Types ─────────────────────────────────────────────────────

export type IBKRConnectionStatus = 'connected' | 'disconnected' | 'pending';

export interface IBKRAccount {
  id: string;
  accountId: string;
  status: string;
  currency: string;
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  equity: number;
  lastEquity: number;
  longMarketValue: number;
  patternDayTrader: boolean;
  tradingBlocked: boolean;
  paperMode: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Format an IBKR account ID. IBKR account IDs look like U1234567.
 */
export function formatIBKRAccountId(accountId: string): string {
  return accountId.startsWith('U') ? accountId : `U${accountId}`;
}

export const ibkrOAuth = {
  /**
   * Build the IBKR OAuth authorization URL.
   *
   * @param paperMode - Whether to request paper trading scope (default true)
   */
  getAuthUrl(paperMode: boolean = true): string {
    const state = btoa(JSON.stringify({ paperMode, timestamp: Date.now() }));
    return getIBKRAuthUrl(state);
  },

  /**
   * Exchange an auth code for tokens by calling our backend.
   * The backend handles the server-to-server exchange with IBKR.
   *
   * @param code  - The authorization code from IBKR's redirect
   * @param state - The state string from the original auth request
   */
  async exchangeCode(code: string, state: string): Promise<{ success: boolean }> {
    const response = await fetch('/api/trades/ibkr/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      throw new Error(`IBKR OAuth exchange failed: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Parse state param from IBKR OAuth callback URL.
   */
  parseState(stateB64: string): { paperMode: boolean; timestamp: number } | null {
    try {
      return JSON.parse(atob(stateB64));
    } catch {
      return null;
    }
  },
};

// ── Internal Helpers ──────────────────────────────────────────

function getToken(): string {
  try {
    const stored = localStorage.getItem('oc_user');
    if (stored) return JSON.parse(stored).token || '';
  } catch {
    // Malformed storage
  }
  return '';
}
