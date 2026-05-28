import axios, { AxiosInstance, AxiosError } from 'axios';

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  paper: boolean;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  symbol: string;
  qty: string;
  filled_qty: string;
  type: string;
  side: string;
  status: string;
  submitted_at: string;
  filled_at: string | null;
  filled_avg_price: string | null;
  limit_price: string | null;
  stop_price: string | null;
  time_in_force: string;
}

export interface AlpacaBar {
  t: string; // timestamp ISO 8601
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  vw: number; // volume-weighted avg
}

export interface AlpacaQuote {
  symbol: string;
  ask_price: number;
  ask_size: number;
  bid_price: number;
  bid_size: number;
  timestamp: string;
}

export interface PlaceOrderParams {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  trail_percent?: number;
}

// Map friendly timeframe strings to Alpaca's expected format
const TIMEFRAME_MAP: Record<string, string> = {
  '1Min': '1Min',
  '5Min': '5Min',
  '15Min': '15Min',
  '30Min': '30Min',
  '1H': '1Hour',
  '1Hour': '1Hour',
  '4H': '4Hour',
  '4Hour': '4Hour',
  '1D': '1Day',
  '1Day': '1Day',
  '1W': '1Week',
  '1Week': '1Week',
  '1M': '1Month',
  '1Month': '1Month',
};

function mapTimeframe(tf: string): string {
  return TIMEFRAME_MAP[tf] || tf;
}

function handleAlpacaError(err: unknown, context: string): never {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string; code?: string }>;
    const status = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message || axiosErr.message;

    if (status === 404) {
      throw new Error(`[Alpaca] ${context}: Not found — ${message}`);
    }
    if (status === 422) {
      throw new Error(`[Alpaca] ${context}: Unprocessable — ${message}`);
    }
    if (status === 403) {
      throw new Error(`[Alpaca] ${context}: Forbidden — ${message}`);
    }
    if (status === 429) {
      throw new Error(`[Alpaca] ${context}: Rate limited — ${message}`);
    }
    throw new Error(`[Alpaca] ${context}: HTTP ${status} — ${message}`);
  }
  throw new Error(`[Alpaca] ${context}: ${(err as Error).message}`);
}

export class AlpacaService {
  private tradingClient: AxiosInstance;
  private dataClient: AxiosInstance;
  private paperMode: boolean;

  constructor(apiKey?: string, secretKey?: string, paperMode?: boolean) {
    const key = apiKey || process.env.ALPACA_API_KEY || '';
    const secret = secretKey || process.env.ALPACA_SECRET_KEY || '';
    this.paperMode = paperMode ?? (process.env.ALPACA_PAPER_MODE === 'true');

    const tradingBaseURL = this.paperMode
      ? 'https://paper-api.alpaca.markets/v2'
      : 'https://api.alpaca.markets/v2';

    this.tradingClient = axios.create({
      baseURL: tradingBaseURL,
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.dataClient = axios.create({
      baseURL: 'https://data.alpaca.markets/v2',
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
      },
      timeout: 10000,
    });
  }

  // ─── Account ───────────────────────────────────────────────────────────────

  async getAccount(): Promise<AlpacaAccount> {
    try {
      const { data } = await this.tradingClient.get<AlpacaAccount>('/account');
      return data;
    } catch (err) {
      handleAlpacaError(err, 'getAccount');
    }
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    try {
      const { data } = await this.tradingClient.get<AlpacaPosition[]>('/positions');
      return data;
    } catch (err) {
      handleAlpacaError(err, 'getPositions');
    }
  }

  async getPosition(symbol: string): Promise<AlpacaPosition> {
    try {
      const { data } = await this.tradingClient.get<AlpacaPosition>(
        `/positions/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return data;
    } catch (err) {
      handleAlpacaError(err, `getPosition(${symbol})`);
    }
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

  async placeOrder(params: PlaceOrderParams): Promise<AlpacaOrder> {
    try {
      const body: Record<string, unknown> = {
        symbol: params.symbol.toUpperCase(),
        side: params.side,
        type: params.type,
        time_in_force: params.time_in_force,
      };

      if (params.qty !== undefined) body.qty = String(params.qty);
      if (params.notional !== undefined) body.notional = String(params.notional);
      if (params.limit_price !== undefined) body.limit_price = String(params.limit_price);
      if (params.stop_price !== undefined) body.stop_price = String(params.stop_price);
      if (params.trail_percent !== undefined) body.trail_percent = String(params.trail_percent);

      const { data } = await this.tradingClient.post<AlpacaOrder>('/orders', body);
      return data;
    } catch (err) {
      handleAlpacaError(err, `placeOrder(${params.symbol})`);
    }
  }

  async getOrder(orderId: string): Promise<AlpacaOrder> {
    try {
      const { data } = await this.tradingClient.get<AlpacaOrder>(`/orders/${orderId}`);
      return data;
    } catch (err) {
      handleAlpacaError(err, `getOrder(${orderId})`);
    }
  }

  async getOrders(status?: string, limit?: number): Promise<AlpacaOrder[]> {
    try {
      const params: Record<string, string | number> = {};
      if (status) params.status = status;
      if (limit) params.limit = limit;

      const { data } = await this.tradingClient.get<AlpacaOrder[]>('/orders', { params });
      return data;
    } catch (err) {
      handleAlpacaError(err, 'getOrders');
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      await this.tradingClient.delete(`/orders/${orderId}`);
    } catch (err) {
      handleAlpacaError(err, `cancelOrder(${orderId})`);
    }
  }

  async cancelAllOrders(): Promise<void> {
    try {
      await this.tradingClient.delete('/orders');
    } catch (err) {
      handleAlpacaError(err, 'cancelAllOrders');
    }
  }

  // ─── Market Data ───────────────────────────────────────────────────────────

  async getBars(symbol: string, timeframe: string, limit: number): Promise<AlpacaBar[]> {
    try {
      const tf = mapTimeframe(timeframe);
      const { data } = await this.dataClient.get<{ bars: AlpacaBar[] }>(
        `/stocks/${encodeURIComponent(symbol.toUpperCase())}/bars`,
        { params: { timeframe: tf, limit } }
      );
      return data.bars || [];
    } catch (err) {
      handleAlpacaError(err, `getBars(${symbol}, ${timeframe})`);
    }
  }

  async getLatestQuote(symbol: string): Promise<AlpacaQuote> {
    try {
      const { data } = await this.dataClient.get<{
        quote: {
          ap: number;
          as: number;
          bp: number;
          bs: number;
          t: string;
        };
      }>(`/stocks/${encodeURIComponent(symbol.toUpperCase())}/quotes/latest`);

      const q = data.quote;
      return {
        symbol: symbol.toUpperCase(),
        ask_price: q.ap,
        ask_size: q.as,
        bid_price: q.bp,
        bid_size: q.bs,
        timestamp: q.t,
      };
    } catch (err) {
      handleAlpacaError(err, `getLatestQuote(${symbol})`);
    }
  }

  async getLatestTrade(symbol: string): Promise<{ price: number; timestamp: string }> {
    try {
      const { data } = await this.dataClient.get<{
        trade: { p: number; t: string };
      }>(`/stocks/${encodeURIComponent(symbol.toUpperCase())}/trades/latest`);

      return {
        price: data.trade.p,
        timestamp: data.trade.t,
      };
    } catch (err) {
      handleAlpacaError(err, `getLatestTrade(${symbol})`);
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<Record<string, AlpacaQuote>> {
    try {
      const upper = symbols.map((s) => s.toUpperCase());
      const { data } = await this.dataClient.get<{
        quotes: Record<
          string,
          { ap: number; as: number; bp: number; bs: number; t: string }
        >;
      }>('/stocks/quotes/latest', {
        params: { symbols: upper.join(',') },
      });

      const result: Record<string, AlpacaQuote> = {};
      for (const [sym, q] of Object.entries(data.quotes || {})) {
        result[sym] = {
          symbol: sym,
          ask_price: q.ap,
          ask_size: q.as,
          bid_price: q.bp,
          bid_size: q.bs,
          timestamp: q.t,
        };
      }
      return result;
    } catch (err) {
      handleAlpacaError(err, `getMultipleQuotes([${symbols.join(', ')}])`);
    }
  }

  // ─── Assets ────────────────────────────────────────────────────────────────

  async getAsset(symbol: string): Promise<unknown> {
    try {
      const { data } = await this.tradingClient.get(
        `/assets/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return data;
    } catch (err) {
      handleAlpacaError(err, `getAsset(${symbol})`);
    }
  }

  async getAssets(status?: string): Promise<unknown[]> {
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const { data } = await this.tradingClient.get<unknown[]>('/assets', { params });
      return data;
    } catch (err) {
      handleAlpacaError(err, 'getAssets');
    }
  }

  // ─── News ──────────────────────────────────────────────────────────────────
  // News lives on the v1beta1 data endpoint

  async getNews(symbols?: string[], limit?: number): Promise<unknown[]> {
    try {
      const params: Record<string, string | number> = {};
      if (symbols && symbols.length > 0) {
        params.symbols = symbols.map((s) => s.toUpperCase()).join(',');
      }
      if (limit) params.limit = limit;

      // News is under v1beta1, not v2 — build a separate request URL
      const { data } = await axios.get<{ news: unknown[] }>(
        'https://data.alpaca.markets/v1beta1/news',
        {
          headers: {
            'APCA-API-KEY-ID': this.tradingClient.defaults.headers['APCA-API-KEY-ID'] as string,
            'APCA-API-SECRET-KEY': this.tradingClient.defaults.headers['APCA-API-SECRET-KEY'] as string,
          },
          params,
          timeout: 10000,
        }
      );
      return data.news || [];
    } catch (err) {
      handleAlpacaError(err, 'getNews');
    }
  }

  isPaperMode(): boolean {
    return this.paperMode;
  }
}

// Singleton for platform-level API key (market data, public endpoints, etc.)
export const alpacaService = new AlpacaService();
