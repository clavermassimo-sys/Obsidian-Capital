import axios, { AxiosInstance, AxiosError } from 'axios';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IBKRAccount {
  accountId: string;
  accountType: string;
  currency: string;
  availableFunds: number;
  netLiquidation: number;
  totalCashValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  marginCushion: number;
}

export interface IBKRPosition {
  acctId: string;
  conid: number;
  contractDesc: string;
  position: number;
  avgCost: number;
  mktPrice: number;
  mktValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface IBKROrder {
  orderId: string;
  conid: number;
  ticker: string;
  side: string;
  orderType: string;
  quantity: number;
  price: number | null;
  status: string;
  filledQuantity: number;
  avgFillPrice: number | null;
  timeInForce: string;
  createdAt: string;
}

export interface IBKRContract {
  conid: number;
  symbol: string;
  secType: string;
  exchange: string;
  currency: string;
  companyName: string;
}

export interface PlaceIBKROrderParams {
  acctId: string;
  conid: number;
  side: 'BUY' | 'SELL';
  orderType: 'MKT' | 'LMT' | 'STP' | 'STP LMT' | 'TRAIL';
  quantity: number;
  price?: number;
  auxPrice?: number;
  trailingPercent?: number;
  tif: 'DAY' | 'GTC' | 'IOC' | 'FOK';
}

// ─── Raw IBKR API response shapes ─────────────────────────────────────────────

interface IBKRPortfolioSummaryRaw {
  availablefunds?: { amount?: number };
  netliquidation?: { amount?: number };
  totalcashvalue?: { amount?: number };
  unrealizedpnl?: { amount?: number };
  realizedpnl?: { amount?: number };
  cushion?: { amount?: number };
  accounttype?: { value?: string };
  currency?: { value?: string };
}

interface IBKRPositionRaw {
  acctId?: string;
  conid?: number;
  contractDesc?: string;
  position?: number;
  avgCost?: number;
  mktPrice?: number;
  mktValue?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
}

interface IBKROrderRaw {
  orderId?: string;
  conid?: number;
  ticker?: string;
  side?: string;
  orderType?: string;
  totalSize?: number;
  price?: number | null;
  status?: string;
  filledQuantity?: number;
  avgFillPrice?: number | null;
  timeInForce?: string;
  lastExecutionTime?: string;
}

interface IBKRPlaceOrderResponseRaw {
  orderId?: string;
  order_id?: string;
  local_order_id?: string;
}

interface IBKRSearchContractRaw {
  conid?: number;
  symbol?: string;
  secType?: string;
  primaryExch?: string;
  currency?: string;
  companyHeader?: string;
  companyName?: string;
  description?: string;
}

// ─── Error Helper ─────────────────────────────────────────────────────────────

function handleIBKRError(err: unknown, context: string): never {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
    const status = axiosErr.response?.status;
    const message =
      axiosErr.response?.data?.error ||
      axiosErr.response?.data?.message ||
      axiosErr.message;

    if (status === 401) throw new Error(`[IBKR] ${context}: Unauthorized — ${message}`);
    if (status === 403) throw new Error(`[IBKR] ${context}: Forbidden — ${message}`);
    if (status === 404) throw new Error(`[IBKR] ${context}: Not found — ${message}`);
    if (status === 422) throw new Error(`[IBKR] ${context}: Unprocessable — ${message}`);
    if (status === 429) throw new Error(`[IBKR] ${context}: Rate limited — ${message}`);
    throw new Error(`[IBKR] ${context}: HTTP ${status} — ${message}`);
  }
  throw new Error(`[IBKR] ${context}: ${(err as Error).message}`);
}

// ─── IBKRService Class ────────────────────────────────────────────────────────

export class IBKRService {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: process.env.IBKR_BASE_URL || 'https://api.ibkr.com/v1/api',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  // ─── Account ───────────────────────────────────────────────────────────────

  async getAccounts(): Promise<IBKRAccount[]> {
    if (!this.accessToken) {
      console.warn('[IBKR] No access token — returning empty accounts list');
      return [];
    }
    try {
      // GET /portfolio/accounts returns array of account objects
      const { data } = await this.client.get<Array<{ id?: string; accountId?: string; type?: string; currency?: string }>>('/portfolio/accounts');
      const accounts = Array.isArray(data) ? data : [];

      // Fetch summaries in parallel
      const summaries = await Promise.allSettled(
        accounts.map((a) => {
          const id = a.id || a.accountId || '';
          return this.getAccount(id);
        })
      );

      return summaries
        .filter((r): r is PromiseFulfilledResult<IBKRAccount> => r.status === 'fulfilled')
        .map((r) => r.value);
    } catch (err) {
      handleIBKRError(err, 'getAccounts');
    }
  }

  async getAccount(accountId: string): Promise<IBKRAccount> {
    if (!this.accessToken || !accountId) {
      console.warn('[IBKR] No access token or account ID — returning default account');
      return {
        accountId: accountId || '',
        accountType: 'INDIVIDUAL',
        currency: 'USD',
        availableFunds: 0,
        netLiquidation: 0,
        totalCashValue: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        marginCushion: 0,
      };
    }
    try {
      const { data } = await this.client.get<IBKRPortfolioSummaryRaw>(
        `/portfolio/${encodeURIComponent(accountId)}/summary`
      );
      return {
        accountId,
        accountType: data.accounttype?.value || 'INDIVIDUAL',
        currency: data.currency?.value || 'USD',
        availableFunds: data.availablefunds?.amount ?? 0,
        netLiquidation: data.netliquidation?.amount ?? 0,
        totalCashValue: data.totalcashvalue?.amount ?? 0,
        unrealizedPnL: data.unrealizedpnl?.amount ?? 0,
        realizedPnL: data.realizedpnl?.amount ?? 0,
        marginCushion: data.cushion?.amount ?? 0,
      };
    } catch (err) {
      handleIBKRError(err, `getAccount(${accountId})`);
    }
  }

  // ─── Positions ─────────────────────────────────────────────────────────────

  async getPositions(accountId: string): Promise<IBKRPosition[]> {
    if (!this.accessToken || !accountId) {
      console.warn('[IBKR] No access token or account ID — returning empty positions');
      return [];
    }
    try {
      const { data } = await this.client.get<IBKRPositionRaw[]>(
        `/portfolio/${encodeURIComponent(accountId)}/positions/0`
      );
      const rows = Array.isArray(data) ? data : [];
      return rows.map((p) => ({
        acctId: p.acctId || accountId,
        conid: p.conid ?? 0,
        contractDesc: p.contractDesc || '',
        position: p.position ?? 0,
        avgCost: p.avgCost ?? 0,
        mktPrice: p.mktPrice ?? 0,
        mktValue: p.mktValue ?? 0,
        unrealizedPnl: p.unrealizedPnl ?? 0,
        realizedPnl: p.realizedPnl ?? 0,
      }));
    } catch (err) {
      handleIBKRError(err, `getPositions(${accountId})`);
    }
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

  async placeOrder(params: PlaceIBKROrderParams): Promise<IBKROrder> {
    if (!this.accessToken) {
      console.warn('[IBKR] No access token — cannot place order');
      throw new Error('[IBKR] placeOrder: No access token configured.');
    }
    try {
      const orderBody = {
        acctId: params.acctId,
        conid: params.conid,
        orderType: params.orderType,
        side: params.side,
        quantity: params.quantity,
        tif: params.tif,
        ...(params.price !== undefined && { price: params.price }),
        ...(params.auxPrice !== undefined && { auxPrice: params.auxPrice }),
        ...(params.trailingPercent !== undefined && { trailingPercent: params.trailingPercent }),
      };

      const { data } = await this.client.post<IBKRPlaceOrderResponseRaw[]>(
        `/iserver/account/${encodeURIComponent(params.acctId)}/orders`,
        [orderBody]
      );

      const result = Array.isArray(data) ? data[0] : (data as IBKRPlaceOrderResponseRaw);
      const orderId = result?.orderId || result?.order_id || result?.local_order_id || String(Date.now());

      return {
        orderId,
        conid: params.conid,
        ticker: '',
        side: params.side,
        orderType: params.orderType,
        quantity: params.quantity,
        price: params.price ?? null,
        status: 'Submitted',
        filledQuantity: 0,
        avgFillPrice: null,
        timeInForce: params.tif,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      handleIBKRError(err, `placeOrder(conid=${params.conid})`);
    }
  }

  async getOrders(accountId: string): Promise<IBKROrder[]> {
    if (!this.accessToken) {
      console.warn('[IBKR] No access token — returning empty orders list');
      return [];
    }
    try {
      const { data } = await this.client.get<{ orders?: IBKROrderRaw[] }>('/iserver/account/orders', {
        params: { accountId },
      });
      const orders = data?.orders || [];
      return orders.map((o) => ({
        orderId: o.orderId || '',
        conid: o.conid ?? 0,
        ticker: o.ticker || '',
        side: o.side || '',
        orderType: o.orderType || '',
        quantity: o.totalSize ?? 0,
        price: o.price ?? null,
        status: o.status || '',
        filledQuantity: o.filledQuantity ?? 0,
        avgFillPrice: o.avgFillPrice ?? null,
        timeInForce: o.timeInForce || '',
        createdAt: o.lastExecutionTime || new Date().toISOString(),
      }));
    } catch (err) {
      handleIBKRError(err, `getOrders(${accountId})`);
    }
  }

  async cancelOrder(accountId: string, orderId: string): Promise<void> {
    if (!this.accessToken) {
      console.warn('[IBKR] No access token — cannot cancel order');
      throw new Error('[IBKR] cancelOrder: No access token configured.');
    }
    try {
      await this.client.delete(
        `/iserver/account/${encodeURIComponent(accountId)}/order/${encodeURIComponent(orderId)}`
      );
    } catch (err) {
      handleIBKRError(err, `cancelOrder(${orderId})`);
    }
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────

  async searchContracts(symbol: string): Promise<IBKRContract[]> {
    if (!this.accessToken) {
      console.warn('[IBKR] No access token — returning empty contract list');
      return [];
    }
    try {
      const { data } = await this.client.get<IBKRSearchContractRaw[]>('/iserver/secdef/search', {
        params: { symbol: symbol.toUpperCase(), secType: 'STK' },
      });
      const results = Array.isArray(data) ? data : [];
      return results.map((c) => ({
        conid: c.conid ?? 0,
        symbol: c.symbol || symbol.toUpperCase(),
        secType: c.secType || 'STK',
        exchange: c.primaryExch || 'SMART',
        currency: c.currency || 'USD',
        companyName: c.companyHeader || c.companyName || c.description || symbol,
      }));
    } catch (err) {
      handleIBKRError(err, `searchContracts(${symbol})`);
    }
  }

  async getContractDetails(conid: number): Promise<IBKRContract> {
    if (!this.accessToken) {
      console.warn('[IBKR] No access token — returning empty contract details');
      return { conid, symbol: '', secType: 'STK', exchange: 'SMART', currency: 'USD', companyName: '' };
    }
    try {
      const { data } = await this.client.get<IBKRSearchContractRaw[]>(
        `/iserver/secdef/info`,
        { params: { conid, sectype: 'STK' } }
      );
      const c = Array.isArray(data) && data.length > 0 ? data[0] : ({} as IBKRSearchContractRaw);
      return {
        conid: c.conid ?? conid,
        symbol: c.symbol || '',
        secType: c.secType || 'STK',
        exchange: c.primaryExch || 'SMART',
        currency: c.currency || 'USD',
        companyName: c.companyHeader || c.companyName || c.description || '',
      };
    } catch (err) {
      handleIBKRError(err, `getContractDetails(${conid})`);
    }
  }
}

// ─── IBKR OAuth Helpers ───────────────────────────────────────────────────────

export function getIBKRAuthUrl(state: string): string {
  const clientId = process.env.IBKR_CLIENT_ID || '';
  const redirectUri = process.env.IBKR_OAUTH_REDIRECT_URI || 'http://localhost:3001/api/auth/ibkr/callback';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });
  return `https://www.interactivebrokers.com/authorize?${params.toString()}`;
}

export async function exchangeIBKRCode(
  code: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const clientId = process.env.IBKR_CLIENT_ID || '';
  const clientSecret = process.env.IBKR_CLIENT_SECRET || '';
  const redirectUri = process.env.IBKR_OAUTH_REDIRECT_URI || 'http://localhost:3001/api/auth/ibkr/callback';
  const baseUrl = process.env.IBKR_BASE_URL || 'https://api.ibkr.com/v1/api';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const { data } = await axios.post<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>(`${baseUrl}/oauth/token`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

export async function refreshIBKRToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.IBKR_CLIENT_ID || '';
  const clientSecret = process.env.IBKR_CLIENT_SECRET || '';
  const baseUrl = process.env.IBKR_BASE_URL || 'https://api.ibkr.com/v1/api';

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const { data } = await axios.post<{
    access_token: string;
    expires_in: number;
  }>(`${baseUrl}/oauth/token`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}
