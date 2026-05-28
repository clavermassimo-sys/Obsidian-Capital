import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer, Socket } from 'socket.io';

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

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'obsidian-capital-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
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

// Mock market data — base prices for real-time simulation
const LIVE_TICKERS: Record<string, { name: string; price: number; trend: number }> = {
  AAPL:  { name: 'Apple Inc.',              price: 189.30, trend:  0.0002 },
  MSFT:  { name: 'Microsoft Corporation',   price: 415.60, trend:  0.0003 },
  GOOGL: { name: 'Alphabet Inc.',           price: 175.20, trend:  0.0001 },
  AMZN:  { name: 'Amazon.com Inc.',         price: 186.40, trend:  0.0002 },
  NVDA:  { name: 'NVIDIA Corporation',      price: 875.90, trend:  0.0005 },
  TSLA:  { name: 'Tesla Inc.',              price: 245.80, trend: -0.0001 },
  META:  { name: 'Meta Platforms Inc.',     price: 515.30, trend:  0.0003 },
  JPM:   { name: 'JPMorgan Chase & Co.',    price: 202.40, trend:  0.0001 },
  V:     { name: 'Visa Inc.',               price: 274.60, trend:  0.0001 },
  SPX:   { name: 'S&P 500 Index',           price: 5218.30, trend: 0.0002 },
};

// Store current prices to calculate deltas
const currentPrices: Record<string, number> = {};
for (const [ticker, data] of Object.entries(LIVE_TICKERS)) {
  currentPrices[ticker] = data.price;
}

/**
 * Generate a realistic next tick price using a mean-reverting random walk.
 * Applies the ticker's trend bias plus Gaussian-approximated noise.
 */
const nextPrice = (ticker: string): number => {
  const data = LIVE_TICKERS[ticker];
  const prev = currentPrices[ticker];

  // Box-Muller transform for Gaussian noise
  const u1 = Math.random();
  const u2 = Math.random();
  const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  const volatility = 0.0008; // ~0.08% per tick
  const noise = gaussian * volatility;
  const meanReversion = (data.price - prev) * 0.001; // soft pull toward base

  const newPrice = parseFloat((prev * (1 + data.trend + noise + meanReversion)).toFixed(2));
  currentPrices[ticker] = newPrice;
  return newPrice;
};

/**
 * Broadcast price updates to all connected clients every 2 seconds.
 * Only broadcasts when at least one client is connected.
 */
const startPriceBroadcaster = () => {
  setInterval(() => {
    if (connectedClients === 0) return;

    const updates = Object.keys(LIVE_TICKERS).map((ticker) => {
      const prev = currentPrices[ticker];
      const price = nextPrice(ticker);
      const change = parseFloat((price - LIVE_TICKERS[ticker].price).toFixed(2));
      const changePct = parseFloat(((change / LIVE_TICKERS[ticker].price) * 100).toFixed(2));
      const prevChange = parseFloat((price - prev).toFixed(2));

      return {
        ticker,
        name: LIVE_TICKERS[ticker].name,
        price,
        change,
        change_pct: changePct,
        tick_change: prevChange,
        volume: Math.floor(Math.random() * 5000 + 1000),
        timestamp: Date.now(),
      };
    });

    io.emit('price:update', { updates, server_time: Date.now() });
  }, 2000);
};

// Broadcast index summary every 5 seconds
const startIndexBroadcaster = () => {
  setInterval(() => {
    if (connectedClients === 0) return;

    const spxPrice = currentPrices['SPX'] || 5218.30;
    const spxChange = parseFloat((spxPrice - 5218.30).toFixed(2));
    const spxChangePct = parseFloat(((spxChange / 5218.30) * 100).toFixed(2));

    io.emit('index:update', {
      indices: [
        { symbol: 'SPX', name: 'S&P 500', value: spxPrice, change: spxChange, change_pct: spxChangePct },
        { symbol: 'DJI', name: 'Dow Jones', value: 39127.8 + (Math.random() * 100 - 50), change: 0, change_pct: 0 },
        { symbol: 'COMP', name: 'NASDAQ', value: 16340.5 + (Math.random() * 80 - 40), change: 0, change_pct: 0 },
      ],
      timestamp: Date.now(),
    });
  }, 5000);
};

// ─── Socket.IO Connection Handlers ───────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  connectedClients++;
  console.log(`[WS] Client connected: ${socket.id} | Total: ${connectedClients}`);

  // Send initial price snapshot on connect
  const snapshot = Object.keys(LIVE_TICKERS).map((ticker) => ({
    ticker,
    name: LIVE_TICKERS[ticker].name,
    price: currentPrices[ticker],
    change: parseFloat((currentPrices[ticker] - LIVE_TICKERS[ticker].price).toFixed(2)),
    change_pct: parseFloat(
      (((currentPrices[ticker] - LIVE_TICKERS[ticker].price) / LIVE_TICKERS[ticker].price) * 100).toFixed(2)
    ),
    timestamp: Date.now(),
  }));

  socket.emit('price:snapshot', { updates: snapshot, server_time: Date.now() });

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
  console.log(`│    GET  /api/portfolio/holdings                  │`);
  console.log(`│    POST /api/trades/order          [Alpaca]      │`);
  console.log(`│    GET  /api/trades/positions      [Alpaca]      │`);
  console.log(`│    GET  /api/market/quote/:ticker  [Alpaca]      │`);
  console.log(`│    GET  /api/market/crypto         [CoinGecko]   │`);
  console.log(`│    GET  /api/subscriptions/status  [Stripe]      │`);
  console.log(`│    POST /api/subscriptions/upgrade [Stripe]      │`);
  console.log(`│    POST /webhooks/stripe           [Stripe WH]   │`);
  console.log(`│    GET  /api/admin/stats                         │`);
  console.log(`│  WebSocket: ws://localhost:${PORT}                  │`);
  console.log(`└─────────────────────────────────────────────────┘\n`);
});

export { app, httpServer, io };
