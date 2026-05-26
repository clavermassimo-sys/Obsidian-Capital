import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { marketDataLimiter } from '../middleware/rateLimit';

const router = Router();

// Market data endpoints are accessible with or without auth,
// but rate-limited to prevent abuse
router.use(marketDataLimiter);

// ─── Mock Market Data ─────────────────────────────────────────────────────────
// In production, replace with a real market data provider (Polygon.io, Alpaca, etc.)

const MOCK_STOCKS: Record<
  string,
  { name: string; sector: string; basePrice: number; description: string }
> = {
  AAPL: { name: 'Apple Inc.', sector: 'Technology', basePrice: 189.3, description: 'Consumer electronics, software, and online services.' },
  MSFT: { name: 'Microsoft Corporation', sector: 'Technology', basePrice: 415.6, description: 'Cloud computing, productivity software, and gaming.' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'Communication Services', basePrice: 175.2, description: 'Internet search, advertising, and cloud computing.' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', basePrice: 186.4, description: 'E-commerce, cloud computing, and digital streaming.' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'Technology', basePrice: 875.9, description: 'Graphics processing units and AI computing platforms.' },
  TSLA: { name: 'Tesla Inc.', sector: 'Consumer Discretionary', basePrice: 245.8, description: 'Electric vehicles, energy storage, and solar products.' },
  META: { name: 'Meta Platforms Inc.', sector: 'Communication Services', basePrice: 515.3, description: 'Social media, virtual reality, and digital advertising.' },
  BRK: { name: 'Berkshire Hathaway Inc.', sector: 'Financials', basePrice: 380.5, description: 'Diversified holdings across insurance, utilities, and more.' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 'Financials', basePrice: 202.4, description: 'Investment banking, financial services, and asset management.' },
  V: { name: 'Visa Inc.', sector: 'Financials', basePrice: 274.6, description: 'Global digital payments network and financial technology.' },
  JNJ: { name: 'Johnson & Johnson', sector: 'Healthcare', basePrice: 152.3, description: 'Pharmaceutical, medical devices, and consumer health products.' },
  WMT: { name: 'Walmart Inc.', sector: 'Consumer Staples', basePrice: 68.9, description: 'Multinational retail corporation and e-commerce.' },
  XOM: { name: 'Exxon Mobil Corporation', sector: 'Energy', basePrice: 113.7, description: 'Oil and gas exploration, production, and refining.' },
  UNH: { name: 'UnitedHealth Group Inc.', sector: 'Healthcare', basePrice: 528.4, description: 'Health insurance, pharmacy benefits, and health services.' },
  MA: { name: 'Mastercard Incorporated', sector: 'Financials', basePrice: 468.2, description: 'Global payment processing and financial technology.' },
  HD: { name: 'The Home Depot Inc.', sector: 'Consumer Discretionary', basePrice: 345.7, description: 'Home improvement retail stores.' },
  AVGO: { name: 'Broadcom Inc.', sector: 'Technology', basePrice: 1387.5, description: 'Semiconductors and infrastructure software.' },
  LLY: { name: 'Eli Lilly and Company', sector: 'Healthcare', basePrice: 742.6, description: 'Pharmaceutical company focused on diabetes and oncology.' },
  COST: { name: 'Costco Wholesale Corporation', sector: 'Consumer Staples', basePrice: 723.4, description: 'Membership-only warehouse retail.' },
  ABBV: { name: 'AbbVie Inc.', sector: 'Healthcare', basePrice: 168.9, description: 'Biopharmaceutical company specializing in immunology and oncology.' },
};

const MOCK_INDICES = [
  { symbol: 'SPX', name: 'S&P 500', value: 5218.3, change: 24.7, change_pct: 0.48 },
  { symbol: 'DJI', name: 'Dow Jones Industrial Average', value: 39127.8, change: -45.3, change_pct: -0.12 },
  { symbol: 'COMP', name: 'NASDAQ Composite', value: 16340.5, change: 97.2, change_pct: 0.60 },
  { symbol: 'RUT', name: 'Russell 2000', value: 2082.4, change: 11.6, change_pct: 0.56 },
  { symbol: 'VIX', name: 'CBOE Volatility Index', value: 14.23, change: -0.41, change_pct: -2.80 },
];

const MOCK_NEWS = [
  {
    id: '1',
    headline: 'Federal Reserve Signals Cautious Approach to Rate Cuts Amid Inflation Concerns',
    summary: 'Fed Chair reiterated the central bank\'s data-dependent stance, noting inflation progress while emphasizing the need for continued vigilance.',
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
    summary: 'Warren Buffett\'s conglomerate continues to build its cash war chest, suggesting caution about current market valuations.',
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

/**
 * Generate a realistic mock price with variance from base price.
 * Price variance is seeded by ticker + current hour for consistency within a session.
 */
const getMockPrice = (ticker: string, basePrice: number) => {
  const hourSeed = new Date().getHours();
  const seed = ticker.charCodeAt(0) + ticker.charCodeAt(ticker.length - 1) + hourSeed;
  const variance = ((seed % 100) / 100 - 0.5) * 0.04; // ±2% range
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

// ─── GET /market/quote/:ticker ────────────────────────────────────────────────

router.get('/quote/:ticker', async (req: Request, res: Response): Promise<void> => {
  const ticker = req.params.ticker.toUpperCase();

  const stock = MOCK_STOCKS[ticker];

  if (!stock) {
    res.status(404).json({
      success: false,
      error: `Quote for ${ticker} not found.`,
    });
    return;
  }

  const priceData = getMockPrice(ticker, stock.basePrice);

  res.json({
    success: true,
    data: {
      quote: {
        ticker,
        name: stock.name,
        sector: stock.sector,
        description: stock.description,
        price: priceData.currentPrice,
        prev_close: priceData.prevClose,
        change: priceData.change,
        change_pct: priceData.changePct,
        day_high: priceData.dayHigh,
        day_low: priceData.dayLow,
        volume: priceData.volume,
        market_cap: priceData.marketCap,
        currency: 'USD',
        exchange: 'NASDAQ',
        as_of: new Date().toISOString(),
      },
    },
  });
});

// ─── GET /market/search?q=query ───────────────────────────────────────────────

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const q = ((req.query.q as string) || '').trim().toUpperCase();

  if (!q || q.length < 1) {
    res.status(400).json({
      success: false,
      error: 'Search query is required.',
    });
    return;
  }

  const results = Object.entries(MOCK_STOCKS)
    .filter(
      ([ticker, data]) =>
        ticker.includes(q) || data.name.toUpperCase().includes(q)
    )
    .slice(0, 10)
    .map(([ticker, data]) => {
      const priceData = getMockPrice(ticker, data.basePrice);
      return {
        ticker,
        name: data.name,
        sector: data.sector,
        price: priceData.currentPrice,
        change: priceData.change,
        change_pct: priceData.changePct,
      };
    });

  res.json({
    success: true,
    data: {
      results,
      count: results.length,
      query: q,
    },
  });
});

// ─── GET /market/indices ──────────────────────────────────────────────────────

router.get('/indices', async (_req: Request, res: Response): Promise<void> => {
  const indices = MOCK_INDICES.map((idx) => {
    // Add small random tick to keep data fresh
    const tick = (Math.random() * 2 - 1) * 0.1;
    return {
      ...idx,
      value: parseFloat((idx.value + tick).toFixed(2)),
      as_of: new Date().toISOString(),
    };
  });

  res.json({
    success: true,
    data: { indices },
  });
});

// ─── GET /market/movers ───────────────────────────────────────────────────────

router.get('/movers', async (_req: Request, res: Response): Promise<void> => {
  const allQuotes = Object.entries(MOCK_STOCKS).map(([ticker, data]) => {
    const priceData = getMockPrice(ticker, data.basePrice);
    return {
      ticker,
      name: data.name,
      sector: data.sector,
      price: priceData.currentPrice,
      change: priceData.change,
      change_pct: priceData.changePct,
      volume: priceData.volume,
    };
  });

  const sorted = [...allQuotes].sort((a, b) => b.change_pct - a.change_pct);

  const gainers = sorted.filter((s) => s.change_pct > 0).slice(0, 5);
  const losers = sorted
    .filter((s) => s.change_pct < 0)
    .sort((a, b) => a.change_pct - b.change_pct)
    .slice(0, 5);
  const mostActive = [...allQuotes]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      gainers,
      losers,
      most_active: mostActive,
      as_of: new Date().toISOString(),
    },
  });
});

// ─── GET /market/news ─────────────────────────────────────────────────────────

router.get('/news', async (req: Request, res: Response): Promise<void> => {
  const ticker = req.query.ticker as string | undefined;
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 5));

  let news = [...MOCK_NEWS];

  if (ticker) {
    news = news.filter((n) =>
      n.tickers.includes(ticker.toUpperCase())
    );
  }

  res.json({
    success: true,
    data: {
      articles: news.slice(0, limit),
      count: Math.min(news.length, limit),
    },
  });
});

export default router;
