/* ============================================================
   Obsidian Capital — Alpaca service (backwards-compatibility shim)
   All functionality has moved to ibkr.ts. This file re-exports
   from ibkr.ts so existing imports continue to work.
   ============================================================ */

// Re-export everything from ibkr.ts for backwards compatibility
export {
  ibkrOAuth as alpacaOAuth,
  IBKRConnectionStatus as AlpacaConnectionStatus,
  IBKR_OAUTH_URL as ALPACA_OAUTH_BASE,
  getIBKRAuthUrl,
  formatIBKRAccountId,
} from './ibkr';

export type { IBKRAccount as AlpacaAccount } from './ibkr';
