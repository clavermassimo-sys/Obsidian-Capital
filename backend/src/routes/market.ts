import { Router, Request, Response } from 'express';
import axios from 'axios';
import { alpacaService } from '../services/alpaca';
import { marketDataLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(marketDataLimiter);

// ─── Mock Fallback Data ───────────────────────────────────────────────────────
// Used when Alpaca API keys are not configured

const ALPACA_CONFIGURED = !!(
  process.env.ALPACA_API_KEY && process.env.ALPACA_API_KEY !== 'your_alpaca_api_key'
);

const MOCK_STOCKS: Record<
  string,
  { name: string; sector: string; basePrice: number; description: string }
> = {
  AAPL:  { name: 'Apple Inc.',                 sector: 'Technology',              basePrice: 189.30, description: 'Consumer electronics, software, and online services.' },
  MSFT:  { name: 'Microsoft Corporation',      sector: 'Technology',              basePrice: 415.60, description: 'Cloud computing, productivity software, and gaming.' },
  GOOGL: { name: 'Alphabet Inc.',              sector: 'Communication Services',  basePrice: 175.20, description: 'Internet search, advertising, and cloud computing.' },
  AMZN:  { name: 'Amazon.com Inc.',            sector: 'Consumer Discretionary',  basePrice: 186.40, description: 'E-commerce, cloud computing, and digital streaming.' },
  NVDA:  { name: 'NVIDIA Corporation',         sector: 'Technology',              basePrice: 875.90, description: 'Graphics processing units and AI computing platforms.' },
  TSLA:  { name: 'Tesla Inc.',                 sector: 'Consumer Discretionary',  basePrice: 245.80, description: 'Electric vehicles, energy storage, and solar products.' },
  META:  { name: 'Meta Platforms Inc.',        sector: 'Communication Services',  basePrice: 515.30, description: 'Social media, virtual reality, and digital advertising.' },
  BRK:   { name: 'Berkshire Hathaway Inc.',    sector: 'Financials',              basePrice: 380.50, description: 'Diversified holdings across insurance, utilities, and more.' },
  JPM:   { name: 'JPMorgan Chase & Co.',       sector: 'Financials',              basePrice: 202.40, description: 'Investment banking, financial services, and asset management.' },
  V:     { name: 'Visa Inc.',                  sector: 'Financials',              basePrice: 274.60, description: 'Global digital payments network and financial technology.' },
  JNJ:   { name: 'Johnson & Johnson',          sector: 'Healthcare',              basePrice: 152.30, description: 'Pharmaceutical, medical devices, and consumer health products.' },
  WMT:   { name: 'Walmart Inc.',               sector: 'Consumer Staples',        basePrice: 68.90,  description: 'Multinational retail corporation and e-commerce.' },
  XOM:   { name: 'Exxon Mobil Corporation',    sector: 'Energy',                  basePrice: 113.70, description: 'Oil and gas exploration, production, and refining.' },
  UNH:   { name: 'UnitedHealth Group Inc.',    sector: 'Healthcare',              basePrice: 528.40, description: 'Health insurance, pharmacy benefits, and health services.' },
  MA:    { name: 'Mastercard Incorporated',    sector: 'Financials',              basePrice: 468.20, description: 'Global payment processing and financial technology.' },
  HD:    { name: 'The Home Depot Inc.',        sector: 'Consumer Discretionary',  basePrice: 345.70, description: 'Home improvement retail stores.' },
  AVGO:  { name: 'Broadcom Inc.',              sector: 'Technology',              basePrice: 1387.50, description: 'Semiconductors and infrastructure software.' },
  LLY:   { name: 'Eli Lilly and Company',      sector: 'Healthcare',              basePrice: 742.60, description: 'Pharmaceutical company focused on diabetes and oncology.' },
  COST:  { name: 'Costco Wholesale Corporation', sector: 'Consumer Staples',      basePrice: 723.40, description: 'Membership-only warehouse retail.' },
  ABBV:  { name: 'AbbVie Inc.',               sector: 'Healthcare',              basePrice: 168.90, description: 'Biopharmaceutical company specializing in immunology and oncology.' },
};

const MOCK_NEWS = [
  {
    id: '1',
    headline: 'Federal Reserve Signals Cautious Approach to Rate Cuts Amid Inflation Concerns',
    summary: "Fed Chair reiterated the central bank's data-dependent stance, noting inflation progress while emphasizing the need for continued vigilance.",
    source: 'Financial Times',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    url: '#',
    tickers: ['SPY', 'TLT', 'GLD'],
    category: 'macro',
  },
  {
    id: '2',
    headline: 'NVIDIA Reports Record Quarterly Revenue Driven by AI Chip Demand',
    summary: 'Data center revenue surged 427% year-over-year as AI infrastructure buildout accelerates among major cloud providers and enterprises.',
    source: 'Bloomberg',
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    url: '#',
    tickers: ['NVDA', 'AMD', 'INTC'],
    category: 'earnings',
  },
  {
    id: '3',
    headline: 'Apple Unveils New AI Features Across Product Line at WWDC',
    summary: 'Apple Intelligence integrates large language models across iPhone, iPad, and Mac, positioning the company competitively in the AI landscape.',
    source: 'Reuters',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    url: '#',
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    category: 'technology',
  },
  {
    id: '4',
    headline: 'Berkshire Hathaway Increases Cash Reserves to Record $189 Billion',
    summary: "Warren Buffett's conglomerate continues to build its cash war chest, suggesting caution about current market valuations.",
    source: 'Wall Street Journal',
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    url: '#',
    tickers: ['BRK', 'SPY'],
    category: 'investment',
  },
  {
    id: '5',
    headline: 'JPMorgan Upgrades US Equities Outlook on Strong Corporate Earnings',
    summary: 'The bank raised its year-end S&P 500 target to 5,800, citing robust earnings growth and resilient consumer spending.',
    source: 'CNBC',
    published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    url: '#',
    tickers: ['JPM', 'GS', 'MS'],
    category: 'analysis',
  },
];

const getMockPrice = (ticker: string, basePrice: number) => {
  const hourSeed = new Date().getHours();
  const seed = ticker.charCodeAt(0) + ticker.charCodeAt(ticker.length - 1) + hourSeed;
  const variance = ((seed % 100) / 100 - 0.5) * 0.04;
  const currentPrice = parseFloat((basePrice * (1 + variance)).toFixed(2));
  const prevClose = parseFloat((basePrice * (1 + ((seed % 80) / 80 - 0.5) * 0.03)).toFixed(2));
  const change = parseFloat((currentPrice - prevClose).toFixed(2));
  const changePct = parseFloat(((change / prevClose) * 100).toFixed(2));
  const dayHigh = parseFloat((currentPrice * 1.015).toFixed(2));
  const dayLow = parseFloat((currentPrice * 0.985).toFixed(2));
  const volume = Math.floor((seed % 50 + 10) * 1000000);
  const marketCap = parseFloat((currentPrice * volume * 8.5).toFixed(0));
  return { currentPrice, prevClose, change, changePct, dayHigh, dayLow, volume, marketCap };
};

// Generate mock OHLCV bars for a symbol
const getMockBars = (ticker: string, basePrice: number, count: number) => {
  const bars = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.5) * 0.02 * price;
    const close = parseFloat((open + change).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.005)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.005)).toFixed(2));
    const volume = Math.floor(Math.random() * 5000000 + 500000);
    bars.push({
      t: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume,
      vw: parseFloat(((open + close) / 2).toFixed(2)),
    });
    price = close;
  }
  return bars;
};

// ─── GET /market/quote/:symbol ────────────────────────────────────────────────

router.get('/quote/:symbol', async (req: Request, res: Response): Promise<void> => {
  const symbol = req.params.symbol.toUpperCase();

  if (ALPACA_CONFIGURED) {
    try {
      const [quote, trade] = await Promise.all([
        alpacaService.getLatestQuote(symbol),
        alpacaService.getLatestTrade(symbol),
      ]);

      const midPrice = (quote.ask_price + quote.bid_price) / 2;
      const mockStock = MOCK_STOCKS[symbol];

      res.json({
        success: true,
        data: {
          quote: {
            ticker: symbol,
            name: mockStock?.name || symbol,
            sector: mockStock?.sector || 'Unknown',
            description: mockStock?.description || '',
            price: trade.price,
            ask: quote.ask_price,
            bid: quote.bid_price,
            mid: parseFloat(midPrice.toFixed(2)),
            ask_size: quote.ask_size,
            bid_size: quote.bid_size,
            currency: 'USD',
            as_of: quote.timestamp,
            source: 'alpaca',
          },
        },
      });
      return;
    } catch (err) {
      console.warn('[Market] Alpaca quote failed, using mock:', (err as Error).message);
    }
  } else {
    console.warn('[Market] Alpaca not configured, using mock data for quote:', symbol);
  }

  // Fallback mock
  const stock = MOCK_STOCKS[symbol];
  if (!stock) {
    res.status(404).json({ success: false, error: `Quote for ${symbol} not found.` });
    return;
  }

  const p = getMockPrice(symbol, stock.basePrice);
  res.json({
    success: true,
    data: {
      quote: {
        ticker: symbol,
        name: stock.name,
        sector: stock.sector,
        description: stock.description,
        price: p.currentPrice,
        prev_close: p.prevClose,
        change: p.change,
        change_pct: p.changePct,
        day_high: p.dayHigh,
        day_low: p.dayLow,
        volume: p.volume,
        market_cap: p.marketCap,
        currency: 'USD',
        as_of: new Date().toISOString(),
        source: 'mock',
      },
    },
  });
});

// ─── GET /market/bars/:symbol ─────────────────────────────────────────────────

router.get('/bars/:symbol', async (req: Request, res: Response): Promise<void> => {
  const symbol = req.params.symbol.toUpperCase();
  const timeframe = (req.query.timeframe as string) || '1D';
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 100));

  if (ALPACA_CONFIGURED) {
    try {
      const bars = await alpacaService.getBars(symbol, timeframe, limit);
      res.json({
        success: true,
        data: {
          symbol,
          timeframe,
          bars,
          count: bars.length,
          source: 'alpaca',
        },
      });
      return;
    } catch (err) {
      console.warn('[Market] Alpaca bars failed, using mock:', (err as Error).message);
    }
  } else {
    console.warn('[Market] Alpaca not configured, using mock data for bars:', symbol);
  }

  // Fallback mock
  const stock = MOCK_STOCKS[symbol];
  const basePrice = stock?.basePrice ?? 100;
  const bars = getMockBars(symbol, basePrice, limit);

  res.json({
    success: true,
    data: {
      symbol,
      timeframe,
      bars,
      count: bars.length,
      source: 'mock',
    },
  });
});

// ─── GET /market/search ───────────────────────────────────────────────────────

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const q = ((req.query.q as string) || '').trim().toUpperCase();

  if (!q || q.length < 1) {
    res.status(400).json({ success: false, error: 'Search query is required.' });
    return;
  }

  if (ALPACA_CONFIGURED) {
    try {
      // Alpaca assets endpoint — filter by search query
      const assets = (await alpacaService.getAssets('active')) as Array<{
        symbol: string;
        name: string;
        class: string;
        tradable: boolean;
        marginable: boolean;
        shortable: boolean;
        easy_to_borrow: boolean;
        fractionable: boolean;
      }>;

      const results = assets
        .filter(
          (a) =>
            a.tradable &&
            (a.symbol.includes(q) || (a.name && a.name.toUpperCase().includes(q)))
        )
        .slice(0, 20)
        .map((a) => ({
          ticker: a.symbol,
          name: a.name,
          asset_class: a.class,
          tradable: a.tradable,
          fractionable: a.fractionable,
        }));

      res.json({
        success: true,
        data: { results, count: results.length, query: q, source: 'alpaca' },
      });
      return;
    } catch (err) {
      console.warn('[Market] Alpaca search failed, using mock:', (err as Error).message);
    }
  }

  // Fallback mock
  const results = Object.entries(MOCK_STOCKS)
    .filter(([ticker, data]) => ticker.includes(q) || data.name.toUpperCase().includes(q))
    .slice(0, 10)
    .map(([ticker, data]) => {
      const p = getMockPrice(ticker, data.basePrice);
      return {
        ticker,
        name: data.name,
        sector: data.sector,
        price: p.currentPrice,
        change: p.change,
        change_pct: p.changePct,
        source: 'mock',
      };
    });

  res.json({
    success: true,
    data: { results, count: results.length, query: q, source: 'mock' },
  });
});

// ─── GET /market/indices ──────────────────────────────────────────────────────
// Use Alpaca bars for SPY, QQQ, DIA, IWM as proxies for major indices

router.get('/indices', async (_req: Request, res: Response): Promise<void> => {
  const INDEX_MAP = [
    { etf: 'SPY', symbol: 'SPX', name: 'S&P 500' },
    { etf: 'QQQ', symbol: 'NDX', name: 'NASDAQ 100' },
    { etf: 'DIA', symbol: 'DJI', name: 'Dow Jones Industrial Average' },
    { etf: 'IWM', symbol: 'RUT', name: 'Russell 2000' },
  ];

  if (ALPACA_CONFIGURED) {
    try {
      const etfSymbols = INDEX_MAP.map((m) => m.etf);
      const quotes = await alpacaService.getMultipleQuotes(etfSymbols);

      const indices = await Promise.all(
        INDEX_MAP.map(async (idx) => {
          const q = quotes[idx.etf];
          if (!q) return null;

          const mid = (q.ask_price + q.bid_price) / 2;

          // Get previous close via latest bar
          let prevClose = mid;
          try {
            const bars = await alpacaService.getBars(idx.etf, '1Day', 2);
            if (bars.length >= 2) {
              prevClose = bars[bars.length - 2].c;
            } else if (bars.length === 1) {
              prevClose = bars[0].o;
            }
          } catch {
            // ignore
          }

          const change = parseFloat((mid - prevClose).toFixed(2));
          const changePct = parseFloat(((change / prevClose) * 100).toFixed(2));

          return {
            symbol: idx.symbol,
            etf: idx.etf,
            name: idx.name,
            value: parseFloat(mid.toFixed(2)),
            change,
            change_pct: changePct,
            as_of: q.timestamp,
            source: 'alpaca',
          };
        })
      );

      const validIndices = indices.filter(Boolean);

      res.json({ success: true, data: { indices: validIndices, as_of: new Date().toISOString() } });
      return;
    } catch (err) {
      console.warn('[Market] Alpaca indices failed, using mock:', (err as Error).message);
    }
  }

  // Fallback mock
  const mockIndices = [
    { symbol: 'SPX', name: 'S&P 500',                        value: 5218.30, change:  24.70, change_pct:  0.48 },
    { symbol: 'DJI', name: 'Dow Jones Industrial Average',   value: 39127.80, change: -45.30, change_pct: -0.12 },
    { symbol: 'NDX', name: 'NASDAQ 100',                     value: 18340.50, change:  97.20, change_pct:  0.53 },
    { symbol: 'RUT', name: 'Russell 2000',                   value: 2082.40,  change:  11.60, change_pct:  0.56 },
    { symbol: 'VIX', name: 'CBOE Volatility Index',          value: 14.23,    change:  -0.41, change_pct: -2.80 },
  ].map((idx) => ({
    ...idx,
    value: parseFloat((idx.value + (Math.random() * 2 - 1) * 0.1).toFixed(2)),
    as_of: new Date().toISOString(),
    source: 'mock',
  }));

  res.json({ success: true, data: { indices: mockIndices, as_of: new Date().toISOString() } });
});

// ─── GET /market/movers ───────────────────────────────────────────────────────

router.get('/movers', async (_req: Request, res: Response): Promise<void> => {
  if (ALPACA_CONFIGURED) {
    try {
      // Get quotes for a set of popular tickers and rank by price change
      const WATCH_LIST = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META',
        'JPM', 'V', 'UNH', 'LLY', 'AVGO', 'COST', 'HD', 'MA',
      ];

      const quotes = await alpacaService.getMultipleQuotes(WATCH_LIST);

      const enriched = await Promise.all(
        Object.entries(quotes).map(async ([sym, q]) => {
          const mid = (q.ask_price + q.bid_price) / 2;
          let prevClose = mid;
          try {
            const bars = await alpacaService.getBars(sym, '1Day', 2);
            if (bars.length >= 2) prevClose = bars[bars.length - 2].c;
          } catch {
            // ignore
          }
          const change = parseFloat((mid - prevClose).toFixed(2));
          const changePct = parseFloat(((change / prevClose) * 100).toFixed(2));
          return {
            ticker: sym,
            name: MOCK_STOCKS[sym]?.name || sym,
            price: parseFloat(mid.toFixed(2)),
            change,
            change_pct: changePct,
            source: 'alpaca',
          };
        })
      );

      const sorted = [...enriched].sort((a, b) => b.change_pct - a.change_pct);
      const gainers = sorted.filter((s) => s.change_pct > 0).slice(0, 5);
      const losers = sorted.filter((s) => s.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 5);

      res.json({
        success: true,
        data: { gainers, losers, as_of: new Date().toISOString(), source: 'alpaca' },
      });
      return;
    } catch (err) {
      console.warn('[Market] Alpaca movers failed, using mock:', (err as Error).message);
    }
  }

  // Fallback mock
  const allQuotes = Object.entries(MOCK_STOCKS).map(([ticker, data]) => {
    const p = getMockPrice(ticker, data.basePrice);
    return { ticker, name: data.name, sector: data.sector, price: p.currentPrice, change: p.change, change_pct: p.changePct, volume: p.volume };
  });

  const sorted = [...allQuotes].sort((a, b) => b.change_pct - a.change_pct);
  const gainers = sorted.filter((s) => s.change_pct > 0).slice(0, 5);
  const losers = sorted.filter((s) => s.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 5);
  const mostActive = [...allQuotes].sort((a, b) => b.volume - a.volume).slice(0, 5);

  res.json({
    success: true,
    data: { gainers, losers, most_active: mostActive, as_of: new Date().toISOString(), source: 'mock' },
  });
});

// ─── GET /market/news ─────────────────────────────────────────────────────────

router.get('/news', async (req: Request, res: Response): Promise<void> => {
  const symbols = req.query.symbols
    ? (req.query.symbols as string).toUpperCase().split(',').map((s) => s.trim())
    : undefined;
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

  if (ALPACA_CONFIGURED) {
    try {
      const news = await alpacaService.getNews(symbols, limit);

      const formatted = (news as Array<{
        id: number;
        headline: string;
        summary: string;
        author: string;
        source: string;
        created_at: string;
        updated_at: string;
        url: string;
        symbols: string[];
        images: Array<{ size: string; url: string }>;
      }>).map((n) => ({
        id: String(n.id),
        headline: n.headline,
        summary: n.summary,
        author: n.author,
        source: n.source,
        published_at: n.created_at,
        updated_at: n.updated_at,
        url: n.url,
        tickers: n.symbols,
        images: n.images,
      }));

      res.json({
        success: true,
        data: { articles: formatted, count: formatted.length, source: 'alpaca' },
      });
      return;
    } catch (err) {
      console.warn('[Market] Alpaca news failed, using mock:', (err as Error).message);
    }
  }

  // Fallback mock
  let news = [...MOCK_NEWS];
  if (symbols && symbols.length > 0) {
    news = news.filter((n) => symbols.some((s) => n.tickers.includes(s)));
  }

  res.json({
    success: true,
    data: { articles: news.slice(0, limit), count: Math.min(news.length, limit), source: 'mock' },
  });
});

// ─── GET /market/assets ───────────────────────────────────────────────────────

router.get('/assets', async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || 'active';
  const assetClass = (req.query.asset_class as string) || 'us_equity';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));

  if (ALPACA_CONFIGURED) {
    try {
      const assets = (await alpacaService.getAssets(status)) as Array<{
        id: string;
        symbol: string;
        name: string;
        class: string;
        exchange: string;
        tradable: boolean;
        marginable: boolean;
        shortable: boolean;
        easy_to_borrow: boolean;
        fractionable: boolean;
        status: string;
      }>;

      const filtered = assets.filter(
        (a) => !assetClass || a.class === assetClass
      );

      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paginated = filtered.slice(offset, offset + limit);

      res.json({
        success: true,
        data: {
          assets: paginated,
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
            has_next: page * limit < total,
            has_prev: page > 1,
          },
          source: 'alpaca',
        },
      });
      return;
    } catch (err) {
      console.warn('[Market] Alpaca assets failed, using mock:', (err as Error).message);
    }
  }

  // Fallback mock
  const mockAssets = Object.entries(MOCK_STOCKS).map(([ticker, data]) => ({
    id: ticker,
    symbol: ticker,
    name: data.name,
    class: 'us_equity',
    exchange: 'NASDAQ',
    tradable: true,
    marginable: true,
    shortable: true,
    easy_to_borrow: true,
    fractionable: true,
    status: 'active',
  }));

  res.json({
    success: true,
    data: {
      assets: mockAssets.slice(0, limit),
      pagination: { page: 1, limit, total: mockAssets.length, total_pages: 1, has_next: false, has_prev: false },
      source: 'mock',
    },
  });
});

// ─── GET /market/crypto ───────────────────────────────────────────────────────
// Top cryptocurrency prices from CoinGecko

const COINGECKO_CONFIGURED = !!(
  process.env.COINGECKO_API_KEY && process.env.COINGECKO_API_KEY !== 'your_coingecko_api_key'
);

const COINGECKO_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'cardano', 'avalanche-2', 'polkadot', 'dogecoin', 'chainlink',
];

router.get('/crypto', async (_req: Request, res: Response): Promise<void> => {
  if (COINGECKO_CONFIGURED) {
    try {
      const cgApiKey = process.env.COINGECKO_API_KEY;
      const { data } = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            ids: COINGECKO_IDS.join(','),
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h',
          },
          headers: cgApiKey ? { 'x-cg-demo-api-key': cgApiKey } : {},
          timeout: 8000,
        }
      );

      const coins = (data as Array<{
        id: string;
        symbol: string;
        name: string;
        current_price: number;
        price_change_24h: number;
        price_change_percentage_24h: number;
        market_cap: number;
        total_volume: number;
        image: string;
        high_24h: number;
        low_24h: number;
        circulating_supply: number;
        market_cap_rank: number;
      }>).map((c) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        price: c.current_price,
        change: parseFloat((c.price_change_24h ?? 0).toFixed(2)),
        change_pct: parseFloat((c.price_change_percentage_24h ?? 0).toFixed(2)),
        market_cap: c.market_cap,
        volume_24h: c.total_volume,
        image: c.image,
        high_24h: c.high_24h,
        low_24h: c.low_24h,
        circulating_supply: c.circulating_supply,
        rank: c.market_cap_rank,
      }));

      res.json({
        success: true,
        data: { coins, count: coins.length, as_of: new Date().toISOString(), source: 'coingecko' },
      });
      return;
    } catch (err) {
      console.warn('[Market] CoinGecko failed, using mock:', (err as Error).message);
    }
  } else {
    console.warn('[Market] CoinGecko not configured, using mock crypto data.');
  }

  // Fallback mock crypto
  const MOCK_CRYPTO = [
    { id: 'bitcoin',      symbol: 'BTC', name: 'Bitcoin',   price: 67420.00, change_pct:  2.34, market_cap: 1327000000000, rank: 1 },
    { id: 'ethereum',     symbol: 'ETH', name: 'Ethereum',  price:  3542.00, change_pct:  1.87, market_cap:  425000000000, rank: 2 },
    { id: 'solana',       symbol: 'SOL', name: 'Solana',    price:   172.40, change_pct:  4.12, market_cap:   79000000000, rank: 5 },
    { id: 'binancecoin',  symbol: 'BNB', name: 'BNB',       price:   598.30, change_pct:  0.95, market_cap:   87000000000, rank: 4 },
    { id: 'ripple',       symbol: 'XRP', name: 'XRP',       price:     0.59, change_pct: -0.43, market_cap:   33000000000, rank: 6 },
    { id: 'cardano',      symbol: 'ADA', name: 'Cardano',   price:     0.47, change_pct: -1.20, market_cap:   16000000000, rank: 9 },
    { id: 'dogecoin',     symbol: 'DOGE', name: 'Dogecoin', price:     0.16, change_pct:  3.50, market_cap:   23000000000, rank: 8 },
    { id: 'chainlink',    symbol: 'LINK', name: 'Chainlink', price:   14.80, change_pct:  2.10, market_cap:    8700000000, rank: 15 },
  ].map((c) => ({
    ...c,
    change: parseFloat(((c.price * c.change_pct) / 100).toFixed(6)),
    volume_24h: Math.floor(c.market_cap * 0.05),
    as_of: new Date().toISOString(),
    source: 'mock',
  }));

  res.json({
    success: true,
    data: { coins: MOCK_CRYPTO, count: MOCK_CRYPTO.length, as_of: new Date().toISOString(), source: 'mock' },
  });
});

export default router;
