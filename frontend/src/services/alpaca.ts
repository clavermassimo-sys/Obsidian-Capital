/* ============================================================
   Obsidian Capital — Alpaca OAuth + Connection Service
   Frontend-side helpers for connecting user Alpaca accounts
   ============================================================ */

// ── Types ─────────────────────────────────────────────────────

export interface AlpacaConnectionStatus {
  connected: boolean;
  accountNumber?: string;
  paperMode?: boolean;
  equity?: string;
  buyingPower?: string;
}

// ── Constants ─────────────────────────────────────────────────

export const ALPACA_OAUTH_BASE = 'https://app.alpaca.markets/oauth/authorize';

// ── OAuth Helpers ─────────────────────────────────────────────

export const alpacaOAuth = {
  /**
   * Build the Alpaca OAuth authorization URL.
   *
   * @param clientId    - Your Alpaca OAuth client ID (from env)
   * @param redirectUri - The URI Alpaca will redirect back to after auth
   * @param paperMode   - Whether to request paper trading scope (default true)
   */
  getAuthUrl(clientId: string, redirectUri: string, paperMode: boolean = true): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'account:write trading',
      state: btoa(JSON.stringify({ paperMode, timestamp: Date.now() })),
    });
    return `${ALPACA_OAUTH_BASE}?${params.toString()}`;
  },

  /**
   * Exchange an auth code for tokens by calling our backend.
   * The backend handles the server-to-server exchange with Alpaca.
   *
   * @param code  - The authorization code from Alpaca's redirect
   * @param state - The state string from the original auth request
   */
  async exchangeCode(code: string, state: string): Promise<{ success: boolean }> {
    const response = await fetch('/api/trades/alpaca/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      throw new Error(`Alpaca OAuth exchange failed: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Parse state param from Alpaca OAuth callback URL.
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
