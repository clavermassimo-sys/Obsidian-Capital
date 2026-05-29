import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

import Stripe from 'stripe';

import { alpacaBroker } from './services/alpaca-broker';
import { polygonService } from './services/polygon';
import { query as dbQuery } from './config/database';

import { apiLimiter } from './middleware/rateLimit';
import authRouter from './routes/auth';
import portfolioRouter from './routes/portfolio';
import tradesRouter from './routes/trades';
import marketRouter from './routes/market';
import adminRouter from './routes/admin';
import subscriptionsRouter from './routes/subscriptions';
import webhooksRouter from './routes/webhooks';

// ─── App Initialization ───────────────────────────────────────────────────────

const app: Application = express();
const httpServer = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5174';

// ─── Trust Proxy (for rate limiting behind nginx/load balancer) ───────────────
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allows requests from the Obsidian Capital frontend, admin panel, and localhost

const allowedOrigins = [FRONTEND_URL, ADMIN_URL, 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// ─── Stripe Webhook (raw body BEFORE json parser) ────────────────────────────
// Stripe signature verification requires the raw request body.
// This MUST be registered before express.json() so the raw buffer is preserved.

app.use(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhooksRouter
);

// ─── Request Parsing ──────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────

const morganFormat =
  NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms - :res[content-length]';

app.use(
  morgan(morganFormat, {
    skip: (req) => req.path === '/health',
  })
);

// ─── Global Rate Limiting ─────────────────────────────────────────────────────

app.use('/api/', apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

// ── Startup API Verification ────────────────────────────────────
async function verifyConnections(): Promise<void> {
  const log = (ok: boolean, name: string, detail = '') => {
    const icon = ok ? '✅' : '❌';
    const msg  = ok ? `${name} connected` : `${name} failed${detail ? ': ' + detail : ''}`;
    console.log(`${icon}  ${msg}`);
  };

  // Database
  try {
    await dbQuery('SELECT 1');
    log(true, 'Database');
  } catch (e: unknown) {
    log(false, 'Database', (e as Error).message);
  }

  // Polygon.io
  const polygonKey = process.env.POLYGON_API_KEY;
  if (polygonKey) {
    try {
      const r = await (await import('axios')).default.get(
        `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2024-01-01/2024-01-02?apiKey=${polygonKey}`,
        { timeout: 5000 }
      );
      log(r.status === 200, 'Polygon.io');
    } catch (e: unknown) {
      log(false, 'Polygon.io', (e as Error).message);
    }
  } else {
    log(false, 'Polygon.io', 'POLYGON_API_KEY not set');
  }

  // Alpaca
  const alpacaKey    = process.env.ALPACA_BROKER_KEY;
  const alpacaSecret = process.env.ALPACA_BROKER_SECRET;
  if (alpacaKey && alpacaSecret) {
    try {
      const axiosInst = (await import('axios')).default;
      const base = process.env.NODE_ENV === 'production'
        ? 'https://broker-api.alpaca.markets'
        : 'https://broker-api.sandbox.alpaca.markets';
      const r = await axiosInst.get(`${base}/v1/accounts?max_results=1`, {
        auth: { username: alpacaKey, password: alpacaSecret },
        timeout: 5000,
      });
      log(r.status === 200, 'Alpaca Broker');
    } catch (e: unknown) {
      log(false, 'Alpaca Broker', (e as Error).message);
    }
  } else {
    log(false, 'Alpaca Broker', 'Keys not set');
  }

  // Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey.startsWith('sk_')) {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
      await stripe.balance.retrieve();
      log(true, 'Stripe');
    } catch (e: unknown) {
      log(false, 'Stripe', (e as Error).message);
    }
  } else {
    log(false, 'Stripe', 'STRIPE_SECRET_KEY not set');
  }
}

// ── Health Endpoint ─────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const checks: Record<string, { ok: boolean; latency?: number; detail?: string }> = {};

  // Database
  const dbStart = Date.now();
  try {
    await dbQuery('SELECT 1');
    checks.database = { ok: true, latency: Date.now() - dbStart };
  } catch (e: unknown) {
    checks.database = { ok: false, detail: (e as Error).message };
  }

  // Polygon
  const polygonKey = process.env.POLYGON_API_KEY;
  if (!polygonKey) {
    checks.polygon = { ok: false, detail: 'key not set' };
  } else {
    const t = Date.now();
    try {
      const r = await (await import('axios')).default.get(
        `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2024-01-01/2024-01-02?apiKey=${polygonKey}`,
        { timeout: 4000 }
      );
      checks.polygon = { ok: r.status === 200, latency: Date.now() - t };
    } catch (e: unknown) {
      checks.polygon = { ok: false, detail: (e as Error).message };
    }
  }

  // Alpaca
  const alpacaKey    = process.env.ALPACA_BROKER_KEY;
  const alpacaSecret = process.env.ALPACA_BROKER_SECRET;
  if (!alpacaKey || !alpacaSecret) {
    checks.alpaca = { ok: false, detail: 'keys not set' };
  } else {
    const t = Date.now();
    try {
      const base = process.env.NODE_ENV === 'production'
        ? 'https://broker-api.alpaca.markets'
        : 'https://broker-api.sandbox.alpaca.markets';
      const r = await (await import('axios')).default.get(`${base}/v1/accounts?max_results=1`, {
        auth: { username: alpacaKey, password: alpacaSecret },
        timeout: 4000,
      });
      checks.alpaca = { ok: r.status === 200, latency: Date.now() - t };
    } catch (e: unknown) {
      checks.alpaca = { ok: false, detail: (e as Error).message };
    }
  }

  // Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || !stripeKey.startsWith('sk_')) {
    checks.stripe = { ok: false, detail: 'key not set' };
  } else {
    const t = Date.now();
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
      await stripe.balance.retrieve();
      checks.stripe = { ok: true, latency: Date.now() - t };
    } catch (e: unknown) {
      checks.stripe = { ok: false, detail: (e as Error).message };
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  res.status(allOk ? 200 : 207).json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: checks,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/market', marketRouter);
app.use('/api/admin', adminRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
    code: 'NOT_FOUND',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  if (err.message.startsWith('CORS:')) {
    res.status(403).json({ success: false, error: err.message });
    return;
  }

  if (NODE_ENV === 'development') {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again.',
  });
});

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track connected clients count
let connectedClients = 0;

// Core tickers to poll from Polygon.io for real-time price updates
const CORE_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM', 'V', 'SPY'];

// Cache of last known prices (used to compute tick_change)
const lastPriceCache: Record<string, number> = {};

/**
 * Fetch real quotes from Alpaca data API (batch snapshot) and broadcast to all
 * connected clients. Falls back to Polygon if Alpaca fails.
 * Runs every 15 seconds.
 */
const startPriceBroadcaster = () => {
  const broadcast = async () => {
    if (connectedClients === 0) return;

    let updates: Array<{
      ticker: string;
      name: string;
      price: number;
      change: number;
      change_pct: number;
      tick_change: number;
      volume: number;
      timestamp: number;
    }> = [];

    // Primary: Alpaca batch snapshot (one request for all tickers)
    try {
      const snapshots = await alpacaBroker.getSnapshots(CORE_TICKERS);
      updates = CORE_TICKERS
        .map((ticker) => {
          const s = snapshots[ticker];
          if (!s) return null;
          const prev = lastPriceCache[ticker] ?? s.price;
          lastPriceCache[ticker] = s.price;
          return {
            ticker,
            name:        ticker,
            price:       s.price,
            change:      s.change,
            change_pct:  s.changePct,
            tick_change: parseFloat((s.price - prev).toFixed(4)),
            volume:      0,
            timestamp:   Date.now(),
          };
        })
        .filter((u): u is NonNullable<typeof u> => u !== null);
    } catch {
      // Fallback: Polygon individual quotes
      try {
        const results = await Promise.allSettled(
          CORE_TICKERS.map((ticker) => polygonService.getQuote(ticker)),
        );
        updates = results
          .map((r, i) => {
            if (r.status !== 'fulfilled') return null;
            const q      = r.value;
            const ticker = CORE_TICKERS[i];
            const prev   = lastPriceCache[ticker] ?? q.price;
            lastPriceCache[ticker] = q.price;
            return {
              ticker,
              name:        ticker,
              price:       q.price,
              change:      q.change,
              change_pct:  q.changePct,
              tick_change: parseFloat((q.price - prev).toFixed(4)),
              volume:      q.volume ?? 0,
              timestamp:   Date.now(),
            };
          })
          .filter((u): u is NonNullable<typeof u> => u !== null);
      } catch {
        // Non-fatal — skip this tick
      }
    }

    if (updates.length > 0) {
      io.emit('price:update', { updates, server_time: Date.now() });
    }
  };

  // Initial fetch immediately, then every 15 seconds
  broadcast().catch(() => undefined);
  setInterval(() => { broadcast().catch(() => undefined); }, 15_000);
};

/**
 * Broadcast real index data from Polygon.io every 30 seconds.
 */
const startIndexBroadcaster = () => {
  const broadcast = async () => {
    if (connectedClients === 0) return;
    try {
      const indices = await polygonService.getIndices();
      if (indices.length > 0) {
        io.emit('index:update', {
          indices: indices.map((idx: { symbol: string; name: string; price: number; change: number; changePct: number }) => ({
            symbol:     idx.symbol,
            name:       idx.name,
            value:      idx.price,
            change:     idx.change,
            change_pct: idx.changePct,
          })),
          timestamp: Date.now(),
        });
      }
    } catch {
      // Non-fatal — skip this tick
    }
  };

  broadcast().catch(() => undefined);
  setInterval(() => { broadcast().catch(() => undefined); }, 30_000);
};

// ─── Socket.IO Connection Handlers ───────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  connectedClients++;
  console.log(`[WS] Client connected: ${socket.id} | Total: ${connectedClients}`);

  // Send initial price snapshot from cache (populated by broadcaster) or skip
  const snapshot = Object.entries(lastPriceCache).map(([ticker, price]) => ({
    ticker,
    name: ticker,
    price,
    change: 0,
    change_pct: 0,
    timestamp: Date.now(),
  }));

  if (snapshot.length > 0) {
    socket.emit('price:snapshot', { updates: snapshot, server_time: Date.now() });
  }

  // ── Authenticated room join ──────────────────────────────────────────────────
  // Clients send { token } after connecting so we can place them in user:{userId}
  socket.on('auth', (data: { token?: string }) => {
    if (!data?.token) return;
    try {
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'obsidian_secret_key_change_in_production') as { userId: string };
      if (decoded?.userId) {
        socket.join(`user:${decoded.userId}`);
        console.log(`[WS] ${socket.id} joined room user:${decoded.userId}`);
      }
    } catch {
      // Invalid token — ignore
    }
  });

  // Allow clients to subscribe to specific tickers
  socket.on('subscribe:ticker', (data: { tickers: string[] }) => {
    if (!Array.isArray(data?.tickers)) return;
    const validTickers = data.tickers.filter((t) => typeof t === 'string' && t.length <= 10);
    validTickers.forEach((ticker) => socket.join(`ticker:${ticker.toUpperCase()}`));
    console.log(`[WS] ${socket.id} subscribed to: ${validTickers.join(', ')}`);
  });

  socket.on('unsubscribe:ticker', (data: { tickers: string[] }) => {
    if (!Array.isArray(data?.tickers)) return;
    data.tickers.forEach((ticker) => socket.leave(`ticker:${ticker.toUpperCase()}`));
  });

  // Handle portfolio tracking subscription (authenticated)
  socket.on('subscribe:portfolio', (data: { userId: string }) => {
    if (data?.userId) {
      socket.join(`portfolio:${data.userId}`);
    }
  });

  socket.on('disconnect', (reason: string) => {
    connectedClients = Math.max(0, connectedClients - 1);
    console.log(`[WS] Client disconnected: ${socket.id} (${reason}) | Total: ${connectedClients}`);
  });

  socket.on('error', (err: Error) => {
    console.error(`[WS] Socket error (${socket.id}):`, err.message);
  });
});

// Note: Alpaca Broker API uses Basic Auth — no session keepalive required.

// Start broadcasters
startPriceBroadcaster();
startIndexBroadcaster();

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const gracefulShutdown = (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  httpServer.close(() => {
    console.log('[Server] HTTP server closed.');
    io.close(() => {
      console.log('[Server] Socket.IO closed.');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err: Error) => {
  console.error('[Server] Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

// ─── Start Server ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────────────┐`);
  console.log(`│       OBSIDIAN CAPITAL — API SERVER              │`);
  console.log(`├─────────────────────────────────────────────────┤`);
  console.log(`│  Status    : Running                             │`);
  console.log(`│  Port      : ${PORT}                               │`);
  console.log(`│  Env       : ${NODE_ENV.padEnd(35)}│`);
  console.log(`│  Frontend  : ${FRONTEND_URL.padEnd(35)}│`);
  console.log(`│  Admin     : ${ADMIN_URL.padEnd(35)}│`);
  console.log(`├─────────────────────────────────────────────────┤`);
  console.log(`│  Routes:                                         │`);
  console.log(`│    GET  /health                                  │`);
  console.log(`│    POST /api/auth/register                       │`);
  console.log(`│    POST /api/auth/login                          │`);
  console.log(`│    GET  /api/auth/kyc/status   [Stripe Identity] │`);
  console.log(`│    POST /api/auth/kyc/session  [Stripe Identity] │`);
  console.log(`│    GET  /api/portfolio/holdings                  │`);
  console.log(`│    POST /api/trades/order       [Alpaca Broker]  │`);
  console.log(`│    GET  /api/trades/positions   [Alpaca Broker]  │`);
  console.log(`│    GET  /api/trades/account     [Alpaca Broker]  │`);
  console.log(`│    GET  /api/market/quote/:ticker  [Polygon.io]  │`);
  console.log(`│    GET  /api/market/crypto         [CoinGecko]   │`);
  console.log(`│    GET  /api/subscriptions/status  [Stripe]      │`);
  console.log(`│    POST /api/subscriptions/upgrade [Stripe]      │`);
  console.log(`│    POST /webhooks/stripe           [Stripe WH]   │`);
  console.log(`│    GET  /api/admin/stats                         │`);
  console.log(`│  WebSocket: ws://localhost:${PORT}                  │`);
  console.log(`└─────────────────────────────────────────────────┘\n`);
  verifyConnections();
});

export { app, httpServer, io };
