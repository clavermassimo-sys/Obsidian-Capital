/* ============================================================
   Obsidian Capital — Alpaca service (backwards-compatibility shim)
   All functionality has moved to ibkr.ts. This file re-exports
   from ibkr.ts so existing imports continue to work.
   ============================================================ */

export {
  ibkrOAuth as alpacaOAuth,
  IBKR_OAUTH_URL as ALPACA_OAUTH_BASE,
  getIBKRAuthUrl,
  formatIBKRAccountId,
} from './ibkr';

export type { IBKRAccount as AlpacaAccount, IBKRConnectionStatus as AlpacaConnectionStatus } from './ibkr';
