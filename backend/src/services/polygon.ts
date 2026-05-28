import axios from 'axios';

// ─── Polygon.io client ────────────────────────────────────────────────────────

const POLYGON_CONFIGURED = !!(
  process.env.POLYGON_API_KEY && process.env.POLYGON_API_KEY !== 'your_polygon_api_key'
);

const polygonClient = axios.create({
  baseURL: process.env.POLYGON_BASE_URL || 'https://api.polygon.io',
  timeout: 10000,
});

// Attach apiKey as a query param on every request
polygonClient.interceptors.request.use((config) => {
  config.params = {
    ...(config.params || {}),
    apiKey: process.env.POLYGON_API_KEY,
  };
  return config;
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PolygonBar {
  t: number;   // Unix ms timestamp
  o: number;   // open
  h: number;   // high
  l: number;   // low
  c: number;   // close
  v: number;   // volume
  vw: number;  // volume-weighted avg price
  n: number;   // number of transactions
}

export interface PolygonQuote {
  symbol: string;
  price: number;       // last trade price
  open: number;
  high: number;
  low: number;
  close: number;       // previous close
  volume: number;
  change: number;      // price - prevClose
  changePct: number;   // (price - prevClose) / prevClose * 100
  bid: number;
  ask: number;
  high52: number;
  low52: number;
  marketCap?: number;
  pe?: number;
}

// ─── Static fallback data ─────────────────────────────────────────────────────

const FALLBACK_STOCKS: Record<string, { name: string; basePrice: number; sector: string }> = {
  AAPL:  { name: 'Apple Inc.',                  basePrice: 189.30, sector: 'Technology' },
  MSFT:  { name: 'Microsoft Corporation',       basePrice: 415.60, sector: 'Technology' },
  GOOGL: { name: 'Alphabet Inc.',               basePrice: 175.20, sector: 'Communication Services' },
  AMZN:  { name: 'Amazon.com Inc.',             basePrice: 186.40, sector: 'Consumer Discretionary' },
  NVDA:  { name: 'NVIDIA Corporation',          basePrice: 875.90, sector: 'Technology' },
  TSLA:  { name: 'Tesla Inc.',                  basePrice: 245.80, sector: 'Consumer Discretionary' },
  META:  { name: 'Meta Platforms Inc.',         basePrice: 515.30, sector: 'Communication Services' },
  JPM:   { name: 'JPMorgan Chase & Co.',        basePrice: 202.40, sector: 'Financials' },
  V:     { name: 'Visa Inc.',                   basePrice: 274.60, sector: 'Financials' },
  JNJ:   { name: 'Johnson & Johnson',           basePrice: 152.30, sector: 'Healthcare' },
  UNH:   { name: 'UnitedHealth Group Inc.',     basePrice: 528.40, sector: 'Healthcare' },
  MA:    { name: 'Mastercard Incorporated',     basePrice: 468.20, sector: 'Financials' },
  HD:    { name: 'The Home Depot Inc.',         basePrice: 345.70, sector: 'Consumer Discretionary' },
  AVGO:  { name: 'Broadcom Inc.',               basePrice: 1387.50, sector: 'Technology' },
  LLY:   { name: 'Eli Lilly and Company',       basePrice: 742.60, sector: 'Healthcare' },
  COST:  { name: 'Costco Wholesale Corporation', basePrice: 723.40, sector: 'Consumer Staples' },
  WMT:   { name: 'Walmart Inc.',                basePrice: 68.90,  sector: 'Consumer Staples' },
  XOM:   { name: 'Exxon Mobil Corporation',     basePrice: 113.70, sector: 'Energy' },
  BRK:   { name: 'Berkshire Hathaway Inc.',     basePrice: 380.50, sector: 'Financials' },
  ABBV:  { name: 'AbbVie Inc.',                 basePrice: 168.90, sector: 'Healthcare' },
};

function fallbackPrice(symbol: string, base: number) {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + new Date().getHours();
  const variance = ((seed % 100) / 100 - 0.5) * 0.04;
  const price = parseFloat((base * (1 + variance)).toFixed(2));
  const prevClose = parseFloat((base * (1 + ((seed % 80) / 80 - 0.5) * 0.03)).toFixed(2));
  const change = parseFloat((price - prevClose).toFixed(2));
  const changePct = parseFloat(((change / prevClose) * 100).toFixed(2));
  return { price, prevClose, change, changePct };
}

function fallbackBars(basePrice: number, count: number): PolygonBar[] {
  const bars: PolygonBar[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const delta = (Math.random() - 0.5) * 0.02 * price;
    const close = parseFloat((open + delta).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.005)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.005)).toFixed(2));
    const volume = Math.floor(Math.random() * 5000000 + 500000);
    const vw = parseFloat(((open + close) / 2).toFixed(2));
    bars.push({ t: now - i * 24 * 60 * 60 * 1000, o: open, h: high, l: low, c: close, v: volume, vw, n: Math.floor(volume / 100) });
    price = close;
  }
  return bars;
}

// ─── Date range helper ─────────────────────────────────────────────────────────

function getDateRange(timeframe: string): { from: string; to: string; mult: number; span: string } {
  const now = new Date();
  const toDate = now.toISOString().split('T')[0];
  let from: Date;
  let mult = 1;
  let span = 'day';

  switch (timeframe) {
    case '1m':  mult = 1;  span = 'minute'; from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); break;
    case '5m':  mult = 5;  span = 'minute'; from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); break;
    case '15m': mult = 15; span = 'minute'; from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); break;
    case '1h':  mult = 1;  span = 'hour';   from = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); break;
    case '4h':  mult = 4;  span = 'hour';   from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case '1D':  mult = 1;  span = 'day';    from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    case '1W':  mult = 1;  span = 'week';   from = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000); break;
    case '1M':  mult = 1;  span = 'month';  from = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000); break;
    default:    mult = 1;  span = 'day';    from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  return { from: from.toISOString().split('T')[0], to: toDate, mult, span };
}

// ─── Raw Polygon response types ───────────────────────────────────────────────

interface PolygonAggResult {
  t?: number; o?: number; h?: number; l?: number; c?: number; v?: number; vw?: number; n?: number;
}

interface PolygonTickerDetail {
  results?: {
    market_cap?: number;
    name?: string;
    weighted_shares_outstanding?: number;
  };
}

interface PolygonPrevClose {
  results?: Array<{ o?: number; h?: number; l?: number; c?: number; v?: number; vw?: number }>;
}

interface PolygonLastTrade {
  results?: { p?: number };
  last?: { price?: number };
}

interface PolygonSnapshotTicker {
  ticker?: string;
  day?: { o?: number; h?: number; l?: number; c?: number; v?: number; vw?: number };
  prevDay?: { c?: number };
  lastTrade?: { p?: number };
  lastQuote?: { P?: number; p?: number };
  todaysChangePerc?: number;
  todaysChange?: number;
}

interface PolygonSnapshotResponse {
  tickers?: PolygonSnapshotTicker[];
}

interface PolygonNewsArticle {
  id?: string;
  title?: string;
  description?: string;
  article_url?: string;
  published_utc?: string;
  tickers?: string[];
  image_url?: string;
  publisher?: { name?: string };
  amp_url?: string;
}

interface PolygonTickerSearchResult {
  ticker?: string;
  name?: string;
  type?: string;
  primary_exchange?: string;
  market?: string;
  active?: boolean;
}

// ─── polygonService ───────────────────────────────────────────────────────────

export const polygonService = {
  // ─── getQuote ─────────────────────────────────────────────────────────────
  // Combines prev-day OHLCV, last trade price, and ticker details

  async getQuote(symbol: string): Promise<PolygonQuote> {
    const sym = symbol.toUpperCase();

    if (!POLYGON_CONFIGURED) {
      console.warn('POLYGON_API_KEY not set — using fallback market data');
      const stock = FALLBACK_STOCKS[sym];
      const base = stock?.basePrice ?? 100;
      const { price, prevClose, change, changePct } = fallbackPrice(sym, base);
      return {
        symbol: sym,
        price,
        open: parseFloat((prevClose * 1.002).toFixed(2)),
        high: parseFloat((price * 1.015).toFixed(2)),
        low: parseFloat((price * 0.985).toFixed(2)),
        close: prevClose,
        volume: Math.floor(Math.random() * 40000000 + 5000000),
        change,
        changePct,
        bid: parseFloat((price - 0.01).toFixed(2)),
        ask: parseFloat((price + 0.01).toFixed(2)),
        high52: parseFloat((base * 1.3).toFixed(2)),
        low52: parseFloat((base * 0.7).toFixed(2)),
        marketCap: parseFloat((base * 5000000 * 1000).toFixed(0)),
      };
    }

    try {
      // Parallel: prev day bars, last trade, ticker details
      const [prevRes, tradeRes, detailRes] = await Promise.allSettled([
        polygonClient.get<PolygonPrevClose>(`/v2/aggs/ticker/${sym}/prev`),
        polygonClient.get<PolygonLastTrade>(`/v2/last/trade/${sym}`),
        polygonClient.get<PolygonTickerDetail>(`/v3/reference/tickers/${sym}`),
      ]);

      const prev = prevRes.status === 'fulfilled' ? prevRes.value.data?.results?.[0] : undefined;
      const tradeData = tradeRes.status === 'fulfilled' ? tradeRes.value.data : undefined;
      const detail = detailRes.status === 'fulfilled' ? detailRes.value.data?.results : undefined;

      const prevClose = prev?.c ?? 0;
      const open = prev?.o ?? 0;
      const high = prev?.h ?? 0;
      const low = prev?.l ?? 0;
      const volume = prev?.v ?? 0;

      const lastPrice =
        tradeData?.results?.p ??
        tradeData?.last?.price ??
        prevClose;

      const change = parseFloat((lastPrice - prevClose).toFixed(2));
      const changePct = prevClose > 0
        ? parseFloat(((change / prevClose) * 100).toFixed(2))
        : 0;

      const marketCap = detail?.market_cap ?? undefined;

      return {
        symbol: sym,
        price: lastPrice,
        open,
        high,
        low,
        close: prevClose,
        volume,
        change,
        changePct,
        bid: parseFloat((lastPrice - 0.01).toFixed(2)),
        ask: parseFloat((lastPrice + 0.01).toFixed(2)),
        high52: high * 1.05,
        low52: low * 0.9,
        marketCap,
      };
    } catch (err) {
      console.warn(`[Polygon] getQuote(${sym}) failed — using fallback:`, (err as Error).message);
      const stock = FALLBACK_STOCKS[sym];
      const base = stock?.basePrice ?? 100;
      const { price, prevClose, change, changePct } = fallbackPrice(sym, base);
      return {
        symbol: sym,
        price,
        open: parseFloat((prevClose * 1.002).toFixed(2)),
        high: parseFloat((price * 1.015).toFixed(2)),
        low: parseFloat((price * 0.985).toFixed(2)),
        close: prevClose,
        volume: Math.floor(Math.random() * 40000000 + 5000000),
        change,
        changePct,
        bid: parseFloat((price - 0.01).toFixed(2)),
        ask: parseFloat((price + 0.01).toFixed(2)),
        high52: parseFloat((base * 1.3).toFixed(2)),
        low52: parseFloat((base * 0.7).toFixed(2)),
        marketCap: parseFloat((base * 5000000 * 1000).toFixed(0)),
      };
    }
  },

  // ─── getBars ──────────────────────────────────────────────────────────────

  async getBars(symbol: string, timeframe: string, limit = 100): Promise<PolygonBar[]> {
    const sym = symbol.toUpperCase();

    if (!POLYGON_CONFIGURED) {
      console.warn('POLYGON_API_KEY not set — using fallback market data');
      const base = FALLBACK_STOCKS[sym]?.basePrice ?? 100;
      return fallbackBars(base, limit);
    }

    try {
      const { from, to, mult, span } = getDateRange(timeframe);

      const { data } = await polygonClient.get<{ results?: PolygonAggResult[]; resultsCount?: number }>(
        `/v2/aggs/ticker/${sym}/range/${mult}/${span}/${from}/${to}`,
        { params: { adjusted: true, sort: 'asc', limit: Math.min(limit, 50000) } }
      );

      const results = data.results || [];
      return results.slice(-limit).map((r) => ({
        t: r.t ?? 0,
        o: r.o ?? 0,
        h: r.h ?? 0,
        l: r.l ?? 0,
        c: r.c ?? 0,
        v: r.v ?? 0,
        vw: r.vw ?? 0,
        n: r.n ?? 0,
      }));
    } catch (err) {
      console.warn(`[Polygon] getBars(${sym}) failed — using fallback:`, (err as Error).message);
      const base = FALLBACK_STOCKS[sym]?.basePrice ?? 100;
      return fallbackBars(base, limit);
    }
  },

  // ─── searchTickers ────────────────────────────────────────────────────────

  async searchTickers(
    query: string
  ): Promise<Array<{ symbol: string; name: string; type: string; exchange: string }>> {
    if (!POLYGON_CONFIGURED) {
      console.warn('POLYGON_API_KEY not set — using fallback market data');
      const q = query.toUpperCase();
      return Object.entries(FALLBACK_STOCKS)
        .filter(([ticker, data]) => ticker.includes(q) || data.name.toUpperCase().includes(q))
        .slice(0, 10)
        .map(([ticker, data]) => ({ symbol: ticker, name: data.name, type: 'CS', exchange: 'NASDAQ' }));
    }

    try {
      const { data } = await polygonClient.get<{ results?: PolygonTickerSearchResult[] }>(
        '/v3/reference/tickers',
        { params: { search: query, active: true, limit: 10 } }
      );

      return (data.results || []).map((r) => ({
        symbol: r.ticker || '',
        name: r.name || '',
        type: r.type || 'CS',
        exchange: r.primary_exchange || r.market || '',
      }));
    } catch (err) {
      console.warn('[Polygon] searchTickers failed — using fallback:', (err as Error).message);
      const q = query.toUpperCase();
      return Object.entries(FALLBACK_STOCKS)
        .filter(([ticker, data]) => ticker.includes(q) || data.name.toUpperCase().includes(q))
        .slice(0, 10)
        .map(([ticker, data]) => ({ symbol: ticker, name: data.name, type: 'CS', exchange: 'NASDAQ' }));
    }
  },

  // ─── getIndices ───────────────────────────────────────────────────────────
  // Use ETF proxies: SPY=S&P 500, QQQ=Nasdaq 100, DIA=Dow, IWM=Russell 2000

  async getIndices(): Promise<Array<{ symbol: string; name: string; price: number; change: number; changePct: number }>> {
    const INDEX_MAP = [
      { etf: 'SPY', symbol: 'SPX', name: 'S&P 500' },
      { etf: 'QQQ', symbol: 'NDX', name: 'NASDAQ 100' },
      { etf: 'DIA', symbol: 'DJI', name: 'Dow Jones Industrial Average' },
      { etf: 'IWM', symbol: 'RUT', name: 'Russell 2000' },
    ];

    if (!POLYGON_CONFIGURED) {
      console.warn('POLYGON_API_KEY not set — using fallback market data');
      return [
        { symbol: 'SPX', name: 'S&P 500',                      price: 5218.30,  change:  24.70, changePct:  0.48 },
        { symbol: 'NDX', name: 'NASDAQ 100',                   price: 18340.50, change:  97.20, changePct:  0.53 },
        { symbol: 'DJI', name: 'Dow Jones Industrial Average', price: 39127.80, change: -45.30, changePct: -0.12 },
        { symbol: 'RUT', name: 'Russell 2000',                 price: 2082.40,  change:  11.60, changePct:  0.56 },
      ].map((i) => ({
        ...i,
        price: parseFloat((i.price + (Math.random() * 2 - 1) * 0.1).toFixed(2)),
      }));
    }

    try {
      const etfSymbols = INDEX_MAP.map((m) => m.etf).join(',');
      const { data } = await polygonClient.get<PolygonSnapshotResponse>(
        `/v2/snapshot/locale/us/markets/stocks/tickers`,
        { params: { tickers: etfSymbols } }
      );

      const tickerMap: Record<string, PolygonSnapshotTicker> = {};
      for (const t of data.tickers || []) {
        if (t.ticker) tickerMap[t.ticker] = t;
      }

      return INDEX_MAP.map((idx) => {
        const snap = tickerMap[idx.etf];
        const price = snap?.lastTrade?.p ?? snap?.day?.c ?? 0;
        const prevClose = snap?.prevDay?.c ?? price;
        const change = parseFloat((price - prevClose).toFixed(2));
        const changePct = prevClose > 0
          ? parseFloat(((change / prevClose) * 100).toFixed(2))
          : (snap?.todaysChangePerc ?? 0);

        return { symbol: idx.symbol, name: idx.name, price, change, changePct };
      });
    } catch (err) {
      console.warn('[Polygon] getIndices failed — using fallback:', (err as Error).message);
      return [
        { symbol: 'SPX', name: 'S&P 500',                      price: 5218.30,  change:  24.70, changePct:  0.48 },
        { symbol: 'NDX', name: 'NASDAQ 100',                   price: 18340.50, change:  97.20, changePct:  0.53 },
        { symbol: 'DJI', name: 'Dow Jones Industrial Average', price: 39127.80, change: -45.30, changePct: -0.12 },
        { symbol: 'RUT', name: 'Russell 2000',                 price: 2082.40,  change:  11.60, changePct:  0.56 },
      ];
    }
  },

  // ─── getMovers ────────────────────────────────────────────────────────────

  async getMovers(): Promise<{ gainers: PolygonQuote[]; losers: PolygonQuote[] }> {
    if (!POLYGON_CONFIGURED) {
      console.warn('POLYGON_API_KEY not set — using fallback market data');
      const all = Object.entries(FALLBACK_STOCKS).map(([sym, s]) => {
        const { price, prevClose, change, changePct } = fallbackPrice(sym, s.basePrice);
        return {
          symbol: sym, price, open: prevClose, high: price * 1.01, low: price * 0.99,
          close: prevClose, volume: Math.floor(Math.random() * 30000000 + 1000000),
          change, changePct,
          bid: price - 0.01, ask: price + 0.01,
          high52: s.basePrice * 1.3, low52: s.basePrice * 0.7,
        } as PolygonQuote;
      });
      const sorted = [...all].sort((a, b) => b.changePct - a.changePct);
      return {
        gainers: sorted.filter((s) => s.changePct > 0).slice(0, 5),
        losers: sorted.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5),
      };
    }

    try {
      const [gainersRes, losersRes] = await Promise.all([
        polygonClient.get<PolygonSnapshotResponse>('/v2/snapshot/locale/us/markets/stocks/gainers'),
        polygonClient.get<PolygonSnapshotResponse>('/v2/snapshot/locale/us/markets/stocks/losers'),
      ]);

      const toQuote = (t: PolygonSnapshotTicker): PolygonQuote => {
        const price = t.lastTrade?.p ?? t.day?.c ?? 0;
        const prevClose = t.prevDay?.c ?? price;
        const change = parseFloat((price - prevClose).toFixed(2));
        const changePct = prevClose > 0
          ? parseFloat(((change / prevClose) * 100).toFixed(2))
          : (t.todaysChangePerc ?? 0);
        return {
          symbol: t.ticker || '',
          price,
          open: t.day?.o ?? 0,
          high: t.day?.h ?? 0,
          low: t.day?.l ?? 0,
          close: prevClose,
          volume: t.day?.v ?? 0,
          change,
          changePct,
          bid: t.lastQuote?.p ?? price - 0.01,
          ask: t.lastQuote?.P ?? price + 0.01,
          high52: price * 1.3,
          low52: price * 0.7,
        };
      };

      return {
        gainers: (gainersRes.data.tickers || []).slice(0, 5).map(toQuote),
        losers: (losersRes.data.tickers || []).slice(0, 5).map(toQuote),
      };
    } catch (err) {
      console.warn('[Polygon] getMovers failed — using fallback:', (err as Error).message);
      const all = Object.entries(FALLBACK_STOCKS).map(([sym, s]) => {
        const { price, prevClose, change, changePct } = fallbackPrice(sym, s.basePrice);
        return {
          symbol: sym, price, open: prevClose, high: price * 1.01, low: price * 0.99,
          close: prevClose, volume: Math.floor(Math.random() * 30000000 + 1000000),
          change, changePct, bid: price - 0.01, ask: price + 0.01,
          high52: s.basePrice * 1.3, low52: s.basePrice * 0.7,
        } as PolygonQuote;
      });
      const sorted = [...all].sort((a, b) => b.changePct - a.changePct);
      return {
        gainers: sorted.filter((s) => s.changePct > 0).slice(0, 5),
        losers: sorted.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5),
      };
    }
  },

  // ─── getNews ──────────────────────────────────────────────────────────────

  async getNews(
    symbols?: string,
    limit = 10
  ): Promise<Array<{
    id: string;
    headline: string;
    summary: string;
    url: string;
    publishedAt: string;
    symbols: string[];
    imageUrl?: string;
    source: string;
  }>> {
    if (!POLYGON_CONFIGURED) {
      console.warn('POLYGON_API_KEY not set — using fallback market data');
      return [
        {
          id: '1',
          headline: 'Federal Reserve Signals Cautious Approach to Rate Cuts Amid Inflation Concerns',
          summary: "Fed Chair reiterated the central bank's data-dependent stance, noting inflation progress while emphasizing the need for continued vigilance.",
          url: '#',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          symbols: ['SPY', 'TLT', 'GLD'],
          source: 'Financial Times',
        },
        {
          id: '2',
          headline: 'NVIDIA Reports Record Quarterly Revenue Driven by AI Chip Demand',
          summary: 'Data center revenue surged 427% year-over-year as AI infrastructure buildout accelerates among major cloud providers and enterprises.',
          url: '#',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          symbols: ['NVDA', 'AMD'],
          source: 'Bloomberg',
        },
        {
          id: '3',
          headline: 'Apple Unveils New AI Features Across Product Line at WWDC',
          summary: 'Apple Intelligence integrates large language models across iPhone, iPad, and Mac, positioning the company competitively in the AI landscape.',
          url: '#',
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          symbols: ['AAPL', 'MSFT', 'GOOGL'],
          source: 'Reuters',
        },
        {
          id: '4',
          headline: 'Berkshire Hathaway Increases Cash Reserves to Record $189 Billion',
          summary: "Warren Buffett's conglomerate continues to build its cash war chest, suggesting caution about current market valuations.",
          url: '#',
          publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          symbols: ['BRK', 'SPY'],
          source: 'Wall Street Journal',
        },
        {
          id: '5',
          headline: 'JPMorgan Upgrades US Equities Outlook on Strong Corporate Earnings',
          summary: 'The bank raised its year-end S&P 500 target to 5,800, citing robust earnings growth and resilient consumer spending.',
          url: '#',
          publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          symbols: ['JPM', 'GS', 'MS'],
          source: 'CNBC',
        },
      ].slice(0, limit);
    }

    try {
      const params: Record<string, string | number> = { limit: Math.min(limit, 50), order: 'desc', sort: 'published_utc' };
      if (symbols) params.ticker = symbols.toUpperCase();

      const { data } = await polygonClient.get<{ results?: PolygonNewsArticle[] }>(
        '/v2/reference/news',
        { params }
      );

      return (data.results || []).map((n) => ({
        id: n.id || '',
        headline: n.title || '',
        summary: n.description || '',
        url: n.article_url || n.amp_url || '#',
        publishedAt: n.published_utc || new Date().toISOString(),
        symbols: n.tickers || [],
        imageUrl: n.image_url,
        source: n.publisher?.name || 'Unknown',
      }));
    } catch (err) {
      console.warn('[Polygon] getNews failed — using fallback:', (err as Error).message);
      return [
        {
          id: '1',
          headline: 'Federal Reserve Signals Cautious Approach to Rate Cuts',
          summary: "The central bank maintains its data-dependent stance on monetary policy.",
          url: '#',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          symbols: ['SPY'],
          source: 'Financial Times',
        },
      ].slice(0, limit);
    }
  },

  // ─── getAssets ────────────────────────────────────────────────────────────

  async getAssets(
    limit = 100
  ): Promise<Array<{ symbol: string; name: string; type: string }>> {
    if (!POLYGON_CONFIGURED) {
      console.warn('POLYGON_API_KEY not set — using fallback market data');
      return Object.entries(FALLBACK_STOCKS).slice(0, limit).map(([ticker, data]) => ({
        symbol: ticker,
        name: data.name,
        type: 'CS',
      }));
    }

    try {
      const { data } = await polygonClient.get<{ results?: PolygonTickerSearchResult[] }>(
        '/v3/reference/tickers',
        { params: { active: true, market: 'stocks', limit: Math.min(limit, 1000) } }
      );

      return (data.results || []).map((r) => ({
        symbol: r.ticker || '',
        name: r.name || '',
        type: r.type || 'CS',
      }));
    } catch (err) {
      console.warn('[Polygon] getAssets failed — using fallback:', (err as Error).message);
      return Object.entries(FALLBACK_STOCKS).slice(0, limit).map(([ticker, data]) => ({
        symbol: ticker,
        name: data.name,
        type: 'CS',
      }));
    }
  },
};
