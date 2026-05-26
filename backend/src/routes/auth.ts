import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { generateToken, authenticate } from '../middleware/auth';
import { authLimiter, sensitiveActionLimiter } from '../middleware/rateLimit';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character.',
    }),
  ssn_last4: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({ 'string.pattern.base': 'SSN last 4 digits must be numeric.' }),
  dob: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Date of birth must be in YYYY-MM-DD format.' }),
  address: Joi.object({
    street: Joi.string().trim().min(5).max(200).required(),
    city: Joi.string().trim().min(2).max(100).required(),
    state: Joi.string().trim().length(2).uppercase().required(),
    zip: Joi.string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .required(),
    country: Joi.string().trim().default('US'),
  }).required(),
  tier: Joi.string().valid('standard', 'member', 'private').default('standard'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const twoFaSchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  session_token: Joi.string().required(),
});

// ─── POST /auth/register ─────────────────────────────────────────────────────

router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
    return;
  }

  const { name, email, password, ssn_last4, dob, address, tier } = value;

  try {
    // Check for existing user
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
      return;
    }

    // Validate age (must be 18+)
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;

    if (actualAge < 18) {
      res.status(400).json({
        success: false,
        error: 'You must be at least 18 years old to open an account.',
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Hash SSN last 4 for storage (never store in plain text)
    const ssn_last4_hash = await bcrypt.hash(ssn_last4, 10);

    const userId = uuidv4();

    // Insert new user
    await query(
      `INSERT INTO users (
        id, email, password_hash, name, tier, kyc_status,
        ssn_last4_hash, dob, address, buying_power, role, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        userId,
        email,
        password_hash,
        name,
        tier,
        'pending',
        ssn_last4_hash,
        dob,
        JSON.stringify(address),
        '0.00',
        'user',
        true,
      ]
    );

    // Generate token
    const token = generateToken({
      userId,
      email,
      tier,
      role: 'user',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. KYC review is pending.',
      data: {
        user: {
          id: userId,
          name,
          email,
          tier,
          kyc_status: 'pending',
          buying_power: 0,
        },
        token,
      },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ success: false, error: 'Failed to create account.' });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
    return;
  }

  const { email, password } = value;

  try {
    const result = await query(
      `SELECT id, email, password_hash, name, tier, kyc_status,
              buying_power, role, is_active, two_fa_enabled
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      // Timing-safe: still hash to prevent user enumeration
      await bcrypt.hash('dummy-timing-protection', 10);
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({
        success: false,
        error: 'Account has been deactivated. Please contact support.',
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      // Log failed attempt
      await query(
        'UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1, last_failed_login = NOW() WHERE id = $1',
        [user.id]
      );
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    // Reset failed attempts on success
    await query(
      'UPDATE users SET failed_login_attempts = 0, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // If 2FA is enabled, return partial token requiring 2FA
    if (user.two_fa_enabled) {
      const sessionToken = uuidv4();
      await query(
        'UPDATE users SET two_fa_session_token = $1, two_fa_session_expires = NOW() + INTERVAL \'10 minutes\' WHERE id = $2',
        [sessionToken, user.id]
      );
      res.json({
        success: true,
        requires_2fa: true,
        session_token: sessionToken,
        message: 'Please complete 2FA verification.',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      tier: user.tier,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tier: user.tier,
          kyc_status: user.kyc_status,
          buying_power: parseFloat(user.buying_power || '0'),
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Invalidate any 2FA session tokens
    if (req.user) {
      await query(
        'UPDATE users SET two_fa_session_token = NULL, two_fa_session_expires = NULL WHERE id = $1',
        [req.user.userId]
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    res.status(500).json({ success: false, error: 'Logout failed.' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, name, email, tier, kyc_status, buying_power, role,
              address, created_at, last_login, two_fa_enabled
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const user = result.rows[0];

    // Get portfolio summary
    const portfolioResult = await query(
      `SELECT
         COUNT(DISTINCT ticker) as positions,
         COALESCE(SUM(shares * avg_cost), 0) as portfolio_cost_basis
       FROM holdings WHERE user_id = $1`,
      [user.id]
    );

    const portfolio = portfolioResult.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tier: user.tier,
          kyc_status: user.kyc_status,
          buying_power: parseFloat(user.buying_power || '0'),
          role: user.role,
          address: user.address,
          created_at: user.created_at,
          last_login: user.last_login,
          two_fa_enabled: user.two_fa_enabled || false,
          positions: parseInt(portfolio.positions || '0'),
          portfolio_cost_basis: parseFloat(portfolio.portfolio_cost_basis || '0'),
        },
      },
    });
  } catch (err) {
    console.error('[Auth] /me error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user data.' });
  }
});

// ─── POST /auth/verify-2fa ────────────────────────────────────────────────────

router.post('/verify-2fa', sensitiveActionLimiter, async (req: Request, res: Response): Promise<void> => {
  const { error, value } = twoFaSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
    return;
  }

  const { code, session_token } = value;

  try {
    const result = await query(
      `SELECT id, email, tier, role, two_fa_code, two_fa_session_token, two_fa_session_expires, name
       FROM users
       WHERE two_fa_session_token = $1 AND two_fa_session_expires > NOW()`,
      [session_token]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired 2FA session. Please log in again.',
      });
      return;
    }

    const user = result.rows[0];

    // In production, use TOTP (Time-based One-Time Password) via speakeasy or otplib
    // For now, validate against stored code
    if (user.two_fa_code !== code) {
      res.status(401).json({
        success: false,
        error: 'Invalid verification code.',
      });
      return;
    }

    // Clear 2FA session
    await query(
      'UPDATE users SET two_fa_session_token = NULL, two_fa_session_expires = NULL, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = generateToken({
      userId: user.id,
      email: user.email,
      tier: user.tier,
      role: user.role,
    });

    res.json({
      success: true,
      message: '2FA verification successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tier: user.tier,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    console.error('[Auth] 2FA verify error:', err);
    res.status(500).json({ success: false, error: '2FA verification failed.' });
  }
});

export default router;
