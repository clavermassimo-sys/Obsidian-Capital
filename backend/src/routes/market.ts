import { Router, Request, Response } from 'express';
import axios from 'axios';
import { polygonService } from '../services/polygon';
import { alpacaBroker } from '../services/alpaca-broker';
import { marketDataLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(marketDataLimiter);

// ─── GET /market/quote/:symbol ────────────────────────────────────────────────

router.get('/quote/:symbol', async (req: Request, res: Response): Promise<void> => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    // Primary: Polygon.io
    const quote = await polygonService.getQuote(symbol);

    res.json({
      success: true,
      data: {
        quote: {
          ticker:     quote.symbol,
          price:      quote.price,
          open:       quote.open,
          high:       quote.high,
          low:        quote.low,
          prev_close: quote.close,
          change:     quote.change,
          change_pct: quote.changePct,
          volume:     quote.volume,
          bid:        quote.bid,
          ask:        quote.ask,
          high_52:    quote.high52,
          low_52:     quote.low52,
          market_cap: quote.marketCap,
          currency:   'USD',
          as_of:      new Date().toISOString(),
          source:     'polygon',
        },
      },
    });
    return;
  } catch (primaryErr) {
    console.warn('[Market] Polygon quote failed, trying Alpaca fallback:', (primaryErr as Error).message);
  }

  // Fallback: Alpaca market data
  try {
    const aq = await alpacaBroker.getQuote(symbol);
    res.json({
      success: true,
      data: {
        quote: {
          ticker:     aq.symbol,
          price:      aq.price,
          open:       aq.price,
          high:       aq.price,
          low:        aq.price,
          prev_close: parseFloat((aq.price - aq.change).toFixed(4)),
          change:     aq.change,
          change_pct: aq.changePct,
          volume:     aq.volume,
          bid:        aq.bid,
          ask:        aq.ask,
          high_52:    aq.high52,
          low_52:     aq.low52,
          market_cap: null,
          currency:   'USD',
          as_of:      new Date().toISOString(),
          source:     'alpaca',
        },
      },
    });
  } catch (fallbackErr) {
    console.error('[Market] Quote error (both sources failed):', (fallbackErr as Error).message);
    res.status(500).json({ success: false, error: `Failed to fetch quote for ${symbol}.` });
  }
});

// ─── GET /market/bars/:symbol ─────────────────────────────────────────────────

router.get('/bars/:symbol', async (req: Request, res: Response): Promise<void> => {
  const symbol    = req.params.symbol.toUpperCase();
  const timeframe = (req.query.timeframe as string) || '1D';
  const limit     = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 100));

  try {
    // Primary: Polygon.io
    const bars = await polygonService.getBars(symbol, timeframe, limit);

    res.json({
      success: true,
      data: {
        symbol,
        timeframe,
        bars,
        count:  bars.length,
        source: 'polygon',
      },
    });
    return;
  } catch (primaryErr) {
    console.warn('[Market] Polygon bars failed, trying Alpaca fallback:', (primaryErr as Error).message);
  }

  // Fallback: Alpaca market data
  // Map Polygon timeframe labels to Alpaca equivalents
  const tfMap: Record<string, string> = {
    '1': '1Min', '5': '5Min', '15': '15Min', '30': '30Min',
    '1H': '1Hour', '1D': '1Day', '1W': '1Week', '1M': '1Month',
  };
  const alpacaTf = tfMap[timeframe] ?? '1Day';

  try {
    const abars = await alpacaBroker.getBars(symbol, alpacaTf, limit);
    res.json({
      success: true,
      data: {
        symbol,
        timeframe,
        bars:   abars.map((b) => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })),
        count:  abars.length,
        source: 'alpaca',
      },
    });
  } catch (fallbackErr) {
    console.error('[Market] Bars error (both sources failed):', (fallbackErr as Error).message);
    res.status(500).json({ success: false, error: `Failed to fetch bars for ${symbol}.` });
  }
});

// ─── GET /market/search ───────────────────────────────────────────────────────

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const q = ((req.query.q as string) || '').trim();

  if (!q || q.length < 1) {
    res.status(400).json({ success: false, error: 'Search query is required.' });
    return;
  }

  try {
    // Primary: Polygon.io
    const polygonResults = await polygonService.searchTickers(q);

    // Merge Alpaca results as supplemental (run in background, non-blocking)
    let alpacaResults: Array<{ symbol: string; name: string; type: string }> = [];
    try {
      alpacaResults = await alpacaBroker.searchAssets(q);
    } catch {
      // Non-fatal — Alpaca search is supplemental
    }

    // Merge and deduplicate by symbol (Polygon takes priority)
    const seen = new Set<string>();
    const merged = [
      ...polygonResults.map((r) => ({ ticker: r.symbol, name: r.name, type: r.type, exchange: r.exchange, source: 'polygon' })),
      ...alpacaResults
        .filter((a) => !polygonResults.some((p) => p.symbol === a.symbol))
        .map((a) => ({ ticker: a.symbol, name: a.name, type: a.type, exchange: '', source: 'alpaca' })),
    ].filter((r) => {
      if (seen.has(r.ticker)) return false;
      seen.add(r.ticker);
      return true;
    });

    res.json({
      success: true,
      data: {
        results: merged,
        count:   merged.length,
        query:   q,
        source:  'polygon+alpaca',
      },
    });
  } catch (err) {
    console.error('[Market] Search error:', (err as Error).message);
    res.status(500).json({ success: false, error: 'Search failed.' });
  }
});

// ─── GET /market/indices ──────────────────────────────────────────────────────

router.get('/indices', async (_req: Request, res: Response): Promise<void> => {
  try {
    const indices = await polygonService.getIndices();

    res.json({
      success: true,
      data: {
        indices: indices.map((i) => ({
          symbol:     i.symbol,
          name:       i.name,
          value:      i.price,
          change:     i.change,
          change_pct: i.changePct,
          as_of:      new Date().toISOString(),
          source:     'polygon',
        })),
        as_of: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Market] Indices error:', (err as Error).message);
    res.status(500).json({ success: false, error: 'Failed to fetch indices.' });
  }
});

// ─── GET /market/movers ───────────────────────────────────────────────────────

router.get('/movers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { gainers, losers } = await polygonService.getMovers();

    const formatMover = (q: typeof gainers[0]) => ({
      ticker:     q.symbol,
      price:      q.price,
      change:     q.change,
      change_pct: q.changePct,
      volume:     q.volume,
      source:     'polygon',
    });

    res.json({
      success: true,
      data: {
        gainers: gainers.map(formatMover),
        losers:  losers.map(formatMover),
        as_of:   new Date().toISOString(),
        source:  'polygon',
      },
    });
  } catch (err) {
    console.error('[Market] Movers error:', (err as Error).message);
    res.status(500).json({ success: false, error: 'Failed to fetch movers.' });
  }
});

// ─── GET /market/news ─────────────────────────────────────────────────────────

router.get('/news', async (req: Request, res: Response): Promise<void> => {
  const symbols = (req.query.symbols as string) || undefined;
  const limit   = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

  try {
    const articles = await polygonService.getNews(symbols, limit);

    res.json({
      success: true,
      data: {
        articles: articles.map((n) => ({
          id:           n.id,
          headline:     n.headline,
          summary:      n.summary,
          url:          n.url,
          published_at: n.publishedAt,
          tickers:      n.symbols,
          image_url:    n.imageUrl,
          source:       n.source,
        })),
        count:  articles.length,
        source: 'polygon',
      },
    });
  } catch (err) {
    console.error('[Market] News error:', (err as Error).message);
    res.status(500).json({ success: false, error: 'Failed to fetch news.' });
  }
});

// ─── GET /market/assets ───────────────────────────────────────────────────────

router.get('/assets', async (req: Request, res: Response): Promise<void> => {
  const page  = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));

  try {
    const assets = await polygonService.getAssets(page * limit);

    const offset    = (page - 1) * limit;
    const paginated = assets.slice(offset, offset + limit);
    const total     = assets.length;

    res.json({
      success: true,
      data: {
        assets: paginated.map((a) => ({
          symbol:   a.symbol,
          name:     a.name,
          type:     a.type,
          tradable: true,
          status:   'active',
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
          has_next:    page * limit < total,
          has_prev:    page > 1,
        },
        source: 'polygon',
      },
    });
  } catch (err) {
    console.error('[Market] Assets error:', (err as Error).message);
    res.status(500).json({ success: false, error: 'Failed to fetch assets.' });
  }
});

// ─── GET /market/crypto ───────────────────────────────────────────────────────
// Top cryptocurrency prices from CoinGecko (separate data source — kept as-is)

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
            vs_currency:             'usd',
            ids:                     COINGECKO_IDS.join(','),
            order:                   'market_cap_desc',
            per_page:                10,
            page:                    1,
            sparkline:               false,
            price_change_percentage: '24h',
          },
          headers: cgApiKey ? { 'x-cg-demo-api-key': cgApiKey } : {},
          timeout: 8000,
        },
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
        id:                  c.id,
        symbol:              c.symbol.toUpperCase(),
        name:                c.name,
        price:               c.current_price,
        change:              parseFloat((c.price_change_24h ?? 0).toFixed(2)),
        change_pct:          parseFloat((c.price_change_percentage_24h ?? 0).toFixed(2)),
        market_cap:          c.market_cap,
        volume_24h:          c.total_volume,
        image:               c.image,
        high_24h:            c.high_24h,
        low_24h:             c.low_24h,
        circulating_supply:  c.circulating_supply,
        rank:                c.market_cap_rank,
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
    { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',   price: 67420.00, change_pct:  2.34, market_cap: 1327000000000, rank: 1 },
    { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',  price:  3542.00, change_pct:  1.87, market_cap:  425000000000, rank: 2 },
    { id: 'solana',      symbol: 'SOL',  name: 'Solana',    price:   172.40, change_pct:  4.12, market_cap:   79000000000, rank: 5 },
    { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',       price:   598.30, change_pct:  0.95, market_cap:   87000000000, rank: 4 },
    { id: 'ripple',      symbol: 'XRP',  name: 'XRP',       price:     0.59, change_pct: -0.43, market_cap:   33000000000, rank: 6 },
    { id: 'cardano',     symbol: 'ADA',  name: 'Cardano',   price:     0.47, change_pct: -1.20, market_cap:   16000000000, rank: 9 },
    { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin',  price:     0.16, change_pct:  3.50, market_cap:   23000000000, rank: 8 },
    { id: 'chainlink',   symbol: 'LINK', name: 'Chainlink', price:    14.80, change_pct:  2.10, market_cap:    8700000000, rank: 15 },
  ].map((c) => ({
    ...c,
    change:     parseFloat(((c.price * c.change_pct) / 100).toFixed(6)),
    volume_24h: Math.floor(c.market_cap * 0.05),
    as_of:      new Date().toISOString(),
    source:     'mock',
  }));

  res.json({
    success: true,
    data: { coins: MOCK_CRYPTO, count: MOCK_CRYPTO.length, as_of: new Date().toISOString(), source: 'mock' },
  });
});

export default router;
