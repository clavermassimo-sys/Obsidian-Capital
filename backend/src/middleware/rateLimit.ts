import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response } from 'express';

const rateLimitResponse = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: 'Too many requests. Please slow down and try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.getHeader('Retry-After'),
  });
};

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
};

// General API rate limit: 100 requests per 15 minutes
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests from this IP.',
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Strict limit for auth endpoints: 10 attempts per 15 minutes
export const authLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (req: Request) => {
    // Rate limit by IP + email combination to prevent distributed attacks
    const email = (req.body?.email as string) || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${ip}:${email.toLowerCase()}`;
  },
});

// Order submission limit: 30 orders per minute
export const tradeLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 30,
  message: 'Order submission rate limit exceeded. Maximum 30 orders per minute.',
  keyGenerator: (req: Request) => {
    // Rate limit by authenticated user ID
    const userId = req.user?.userId || req.ip || 'unknown';
    return `trade:${userId}`;
  },
});

// Market data limit: 300 requests per minute (for real-time feeds)
export const marketDataLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 300,
  message: 'Market data request limit exceeded.',
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Admin endpoints: 200 requests per 5 minutes
export const adminLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 5 * 60 * 1000,
  max: 200,
  message: 'Admin endpoint rate limit exceeded.',
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

// Password reset / 2FA: very strict, 5 per hour
export const sensitiveActionLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many sensitive action attempts. Please try again in an hour.',
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `sensitive:${ip}`;
  },
});
