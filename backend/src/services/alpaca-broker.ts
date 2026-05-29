/* ============================================================
   Obsidian Capital — Alpaca Broker API Service
   White-label broker: accounts created programmatically,
   no OAuth redirect, no Alpaca branding exposed to users.
   ============================================================ */

import axios, { AxiosInstance } from 'axios';

// ── Account types ─────────────────────────────────────────────

export interface AlpacaBrokerAccount {
  id: string;
  account_number: string;
  status: string; // 'ACTIVE', 'ONBOARDING', 'SUBMITTED', etc.
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  long_market_value: string;
  equity: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  symbol: string;
  qty: string;
  filled_qty: string;
  type: string;  // market, limit, stop, stop_limit, trailing_stop
  side: string;  // buy, sell
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  trail_percent?: string;
  filled_avg_price?: string;
  status: string;
  created_at: string;
  filled_at?: string;
}

export interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface AlpacaQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  volume: number;
  high52: number;
  low52: number;
}

export interface CreateAccountParams {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;   // YYYY-MM-DD
  taxId: string;         // SSN
  phone?: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  countryOfTaxResidence?: string;
}

// ── Service ───────────────────────────────────────────────────

export class AlpacaBrokerService {
  private client: AxiosInstance;
  private dataClient: AxiosInstance;
  readonly isSandbox: boolean;

  constructor() {
    const key    = process.env.ALPACA_BROKER_KEY    || '';
    const secret = process.env.ALPACA_BROKER_SECRET || '';
    this.isSandbox = process.env.NODE_ENV !== 'production';

    const baseURL = this.isSandbox
      ? 'https://broker-api.sandbox.alpaca.markets/v1'
      : 'https://broker-api.alpaca.markets/v1';

    const basicAuth = Buffer.from(`${key}:${secret}`).toString('base64');

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    this.dataClient = axios.create({
      baseURL: 'https://data.alpaca.markets/v2',
      headers: {
        'APCA-API-KEY-ID':     key,
        'APCA-API-SECRET-KEY': secret,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  // ── Account Management ────────────────────────────────────────

  async createAccount(params: CreateAccountParams): Promise<AlpacaBrokerAccount> {
    const { data } = await this.client.post('/accounts', {
      contact: {
        email_address:    params.email,
        phone_number:     params.phone || '',
        street_address:   [params.streetAddress],
        city:             params.city,
        state:            params.state,
        postal_code:      params.postalCode,
        country:          params.countryOfTaxResidence || 'USA',
      },
      identity: {
        given_name:               params.firstName,
        family_name:              params.lastName,
        date_of_birth:            params.dateOfBirth,
        tax_id:                   params.taxId,
        tax_id_type:              'USA_SSN',
        country_of_citizenship:   'USA',
        country_of_birth:         'USA',
        country_of_tax_residence: params.countryOfTaxResidence || 'USA',
        funding_source:           ['employment_income'],
      },
      disclosures: {
        is_control_person:               false,
        is_affiliated_exchange_or_finra: false,
        is_politically_exposed:          false,
        immediate_family_exposed:        false,
      },
      agreements: [
        { agreement: 'margin_agreement',   signed_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { agreement: 'account_agreement',  signed_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { agreement: 'customer_agreement', signed_at: new Date().toISOString(), ip_address: '127.0.0.1' },
      ],
      documents: [],
    });
    return data as AlpacaBrokerAccount;
  }

  async getAccount(accountId: string): Promise<AlpacaBrokerAccount> {
    const { data } = await this.client.get(`/trading/accounts/${accountId}/account`);
    return data as AlpacaBrokerAccount;
  }

  async getPositions(accountId: string): Promise<AlpacaPosition[]> {
    const { data } = await this.client.get(`/trading/accounts/${accountId}/positions`);
    return (Array.isArray(data) ? data : []) as AlpacaPosition[];
  }

  // ── Orders ────────────────────────────────────────────────────

  async placeOrder(accountId: string, params: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
    time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
    trail_percent?: number;
  }): Promise<AlpacaOrder> {
    const body: Record<string, unknown> = {
      symbol:        params.symbol,
      qty:           String(params.qty),
      side:          params.side,
      type:          params.type,
      time_in_force: params.time_in_force,
    };
    if (params.limit_price   !== undefined) body.limit_price   = String(params.limit_price);
    if (params.stop_price    !== undefined) body.stop_price    = String(params.stop_price);
    if (params.trail_percent !== undefined) body.trail_percent = String(params.trail_percent);

    const { data } = await this.client.post(`/trading/accounts/${accountId}/orders`, body);
    return data as AlpacaOrder;
  }

  async getOrders(accountId: string): Promise<AlpacaOrder[]> {
    const { data } = await this.client.get(`/trading/accounts/${accountId}/orders`, {
      params: { status: 'all', limit: 100 },
    });
    return (Array.isArray(data) ? data : []) as AlpacaOrder[];
  }

  async cancelOrder(accountId: string, orderId: string): Promise<void> {
    await this.client.delete(`/trading/accounts/${accountId}/orders/${orderId}`);
  }

  async getPortfolioHistory(
    accountId: string,
    period = '1M',
  ): Promise<Array<{ date: string; value: number }>> {
    try {
      const { data } = await this.client.get(
        `/trading/accounts/${accountId}/portfolio/history`,
        { params: { period, timeframe: '1D', extended_hours: false } },
      );
      const timestamps: number[] = data.timestamp ?? [];
      const values: number[]     = data.equity     ?? [];
      return timestamps.map((ts, i) => ({
        date:  new Date(ts * 1000).toISOString(),
        value: values[i] ?? 0,
      }));
    } catch {
      return [];
    }
  }

  // ── Market Data ───────────────────────────────────────────────

  async getQuote(symbol: string): Promise<AlpacaQuote> {
    try {
      const [snapRes, barRes] = await Promise.allSettled([
        this.dataClient.get(`/stocks/${symbol}/snapshot`),
        this.dataClient.get(`/stocks/${symbol}/bars`, {
          params: { timeframe: '1Day', limit: 2 },
        }),
      ]);

      let price = 0, change = 0, changePct = 0, bid = 0, ask = 0, volume = 0, high52 = 0, low52 = 0;

      if (snapRes.status === 'fulfilled') {
        const snap = snapRes.value.data;
        price  = snap?.latestTrade?.p  ?? snap?.minuteBar?.c ?? 0;
        bid    = snap?.latestQuote?.bp ?? 0;
        ask    = snap?.latestQuote?.ap ?? 0;
        volume = snap?.dailyBar?.v     ?? 0;
        const prevClose = snap?.prevDailyBar?.c ?? price;
        change    = parseFloat((price - prevClose).toFixed(4));
        changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(4)) : 0;
      }

      if (barRes.status === 'fulfilled') {
        const bars: AlpacaBar[] = barRes.value.data?.bars ?? [];
        if (bars.length > 0) {
          high52 = Math.max(...bars.map((b) => b.h));
          low52  = Math.min(...bars.map((b) => b.l));
        }
      }

      return { symbol: symbol.toUpperCase(), price, change, changePct, bid, ask, volume, high52, low52 };
    } catch {
      return { symbol: symbol.toUpperCase(), price: 0, change: 0, changePct: 0, bid: 0, ask: 0, volume: 0, high52: 0, low52: 0 };
    }
  }

  async getBars(symbol: string, timeframe = '1Day', limit = 200): Promise<AlpacaBar[]> {
    try {
      const { data } = await this.dataClient.get(`/stocks/${symbol}/bars`, {
        params: { timeframe, limit, adjustment: 'split' },
      });
      return (data?.bars ?? []) as AlpacaBar[];
    } catch {
      return [];
    }
  }

  async searchAssets(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    try {
      const { data } = await this.client.get('/assets', {
        params: { status: 'active', asset_class: 'us_equity' },
      });
      const all = (Array.isArray(data) ? data : []) as Array<{ symbol: string; name: string; class: string }>;
      const q = query.toUpperCase();
      return all
        .filter((a) => a.symbol.startsWith(q) || a.name?.toUpperCase().includes(q))
        .slice(0, 10)
        .map((a) => ({ symbol: a.symbol, name: a.name || a.symbol, type: 'equity' }));
    } catch {
      return [];
    }
  }

  async getSnapshots(
    symbols: string[],
  ): Promise<Record<string, { price: number; change: number; changePct: number }>> {
    try {
      const { data } = await this.dataClient.get('/stocks/snapshots', {
        params: { symbols: symbols.join(',') },
      });
      const result: Record<string, { price: number; change: number; changePct: number }> = {};
      for (const [sym, snap] of Object.entries(data ?? {})) {
        const s = snap as {
          latestTrade?: { p: number };
          prevDailyBar?: { c: number };
          minuteBar?: { c: number };
        };
        const price = s?.latestTrade?.p ?? s?.minuteBar?.c ?? 0;
        const prev  = s?.prevDailyBar?.c ?? price;
        const change    = parseFloat((price - prev).toFixed(4));
        const changePct = prev > 0 ? parseFloat(((change / prev) * 100).toFixed(4)) : 0;
        result[sym] = { price, change, changePct };
      }
      return result;
    } catch {
      return {};
    }
  }
}

export const alpacaBroker = new AlpacaBrokerService();
