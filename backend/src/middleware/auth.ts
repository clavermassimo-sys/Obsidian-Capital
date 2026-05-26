import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

export interface JwtPayload {
  userId: string;
  email: string;
  tier: 'standard' | 'member' | 'private';
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'obsidian-capital',
    audience: 'obsidian-capital-client',
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'obsidian-capital',
    audience: 'obsidian-capital-client',
  }) as JwtPayload;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. Malformed authorization header.',
      });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      const err = jwtError as Error;
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: 'Token expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }
      res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Verify user still exists in database
    const result = await query(
      'SELECT id, email, tier, role, kyc_status FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'User account not found or deactivated.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    const dbUser = result.rows[0];

    // Attach fresh user data to request
    req.user = {
      userId: decoded.userId,
      email: dbUser.email,
      tier: dbUser.tier,
      role: dbUser.role,
    };

    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
    });
    return;
  }

  next();
};

export const requireKyc = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated.' });
    return;
  }

  const result = await query(
    'SELECT kyc_status FROM users WHERE id = $1',
    [req.user.userId]
  );

  if (result.rows.length === 0 || result.rows[0].kyc_status !== 'approved') {
    res.status(403).json({
      success: false,
      error: 'KYC verification required to perform this action.',
      code: 'KYC_REQUIRED',
    });
    return;
  }

  next();
};
