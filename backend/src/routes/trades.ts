import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireKyc } from '../middleware/auth';
import { tradeLimiter } from '../middleware/rateLimit';
import { IBKRService, exchangeIBKRCode, getIBKRAuthUrl } from '../services/ibkr';
import { polygonService } from '../services/polygon';
import { stripeService } from '../services/stripe';
import { getCommissionBreakdown } from '../middleware/commission';
import { query, transaction } from '../config/database';

const router = Router();

// All trade routes require authentication
router.use(authenticate);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const orderSchema = Joi.object({
  ticker: Joi.string().trim().uppercase().min(1).max(10).required(),
  company_name: Joi.string().trim().min(1).max(200).required(),
  // conid is the IBKR contract ID — required for live orders
  conid: Joi.number().integer().positive().required(),
  side: Joi.string().valid('BUY', 'SELL').required(),
  qty: Joi.number().positive().precision(6).max(1000000).required(),
  orderType: Joi.string()
    .valid('MKT', 'LMT', 'STP', 'STP LMT', 'TRAIL')
    .default('MKT'),
  tif: Joi.string().valid('DAY', 'GTC', 'IOC', 'FOK').default('DAY'),
  price: Joi.when('orderType', {
    is: Joi.string().valid('LMT', 'STP LMT'),
    then: Joi.number().positive().precision(2).required(),
    otherwise: Joi.number().optional(),
  }),
  auxPrice: Joi.when('orderType', {
    is: Joi.string().valid('STP', 'STP LMT'),
    then: Joi.number().positive().precision(2).required(),
    otherwise: Joi.number().optional(),
  }),
  trailingPercent: Joi.when('orderType', {
    is: 'TRAIL',
    then: Joi.number().positive().precision(2).required(),
    otherwise: Joi.number().optional(),
  }),
  // Optional price estimate for commission preview (used when live price is unavailable)
  estimatedPrice: Joi.number().positive().optional(),
});

const connectIBKRSchema = Joi.object({
  access_token: Joi.string().required(),
  refresh_token: Joi.string().optional().allow(''),
  paper_mode: Joi.boolean().default(false),
  ibkr_account_id: Joi.string().optional().allow(''),
});

// ─── GET /trades/preview ──────────────────────────────────────────────────────
// Calculate commission breakdown before order submission (no side effects)

router.get('/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const subtotalRaw = parseFloat(req.query.subtotal as string);
    if (!subtotalRaw || isNaN(subtotalRaw) || subtotalRaw <= 0) {
      res.status(400).json({
        success: false,
        error: 'Query parameter "subtotal" must be a positive number.',
      });
      return;
    }

    const tier = (req.user?.tier ?? 'standard') as 'standard' | 'member' | 'private';
    const breakdown = getCommissionBreakdown(subtotalRaw, tier);

    res.json({
      success: true,
      data: {
        commission: breakdown,
        tier_info: {
          standard: getCommissionBreakdown(subtotalRaw, 'standard'),
          member: getCommissionBreakdown(subtotalRaw, 'member'),
          private: getCommissionBreakdown(subtotalRaw, 'private'),
        },
      },
    });
  } catch (err) {
    console.error('[Trades] Preview error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate commission preview.' });
  }
});

// ─── POST /trades/order ───────────────────────────────────────────────────────
// Place order via IBKR, record commission, charge Stripe if on file

router.post(
  '/order',
  tradeLimiter,
  requireKyc,
  async (req: Request, res: Response): Promise<void> => {
    const { error, value } = orderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const {
      ticker,
      company_name,
      conid,
      side,
      qty,
      orderType,
      tif,
      price,
      auxPrice,
      trailingPercent,
      estimatedPrice,
    } = value;

    const userId = req.user!.userId;
    const tier = req.user!.tier as 'standard' | 'member' | 'private';

    try {
      // ─── 1. Look up user's IBKR connection and Stripe customer ──────────────
      const userResult = await query(
        `SELECT u.tier, u.stripe_customer_id, u.ibkr_connected,
                ic.access_token, ic.account_id AS ibkr_account_id, ic.paper_mode
         FROM users u
         LEFT JOIN ibkr_connections ic ON ic.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const userRow = userResult.rows[0];
      const stripeCustomerId: string | null = userRow.stripe_customer_id || null;

      if (!userRow.ibkr_connected || !userRow.access_token) {
        res.status(403).json({
          success: false,
          error: 'Interactive Brokers account is not connected. Please link your IBKR account first.',
          code: 'IBKR_NOT_CONNECTED',
        });
        return;
      }

      const ibkrAccountId = userRow.ibkr_account_id as string;
      const ibkrClient = new IBKRService(userRow.access_token as string);

      // ─── 2. Calculate commission on subtotal ─────────────────────────────────
      let subtotal: number;
      if (estimatedPrice) {
        subtotal = parseFloat((qty * estimatedPrice).toFixed(2));
      } else {
        // Attempt to get a live quote for commission calculation
        try {
          const quote = await polygonService.getQuote(ticker);
          subtotal = parseFloat((qty * quote.price).toFixed(2));
        } catch {
          // If market data is unavailable, fall back to a rough estimate
          subtotal = qty * 100; // placeholder; commission will be updated post-fill
        }
      }

      const commission = getCommissionBreakdown(subtotal, tier);

      // ─── 3. Submit order to IBKR ─────────────────────────────────────────────
      const ibkrOrder = await ibkrClient.placeOrder({
        acctId: ibkrAccountId,
        conid,
        side: side as 'BUY' | 'SELL',
        orderType: orderType as 'MKT' | 'LMT' | 'STP' | 'STP LMT' | 'TRAIL',
        quantity: qty,
        tif: tif as 'DAY' | 'GTC' | 'IOC' | 'FOK',
        ...(price !== undefined && { price }),
        ...(auxPrice !== undefined && { auxPrice }),
        ...(trailingPercent !== undefined && { trailingPercent }),
      });

      // ─── 4. Record trade + commission in DB ──────────────────────────────────
      const tradeId = uuidv4();
      const filledPrice = ibkrOrder.avgFillPrice ?? (price ?? null);
      const filledQty = ibkrOrder.filledQuantity > 0 ? ibkrOrder.filledQuantity : qty;

      const ibkrStatus = ibkrOrder.status?.toLowerCase() ?? 'submitted';
      const tradeStatus =
        ibkrStatus === 'filled' ? 'completed'
        : ibkrStatus === 'cancelled' || ibkrStatus === 'canceled' ? 'cancelled'
        : 'pending';

      const finalSubtotal =
        filledPrice && filledQty
          ? parseFloat((filledQty * filledPrice).toFixed(2))
          : subtotal;

      const finalCommission = getCommissionBreakdown(finalSubtotal, tier);

      await transaction(async (client) => {
        await client.query(
          `INSERT INTO trades (
             id, user_id, ticker, company_name, type, shares, price,
             commission, total, status, order_type, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [
            tradeId,
            userId,
            ticker,
            company_name,
            side.toLowerCase() === 'buy' ? 'buy' : 'sell',
            filledQty,
            filledPrice ?? 0,
            finalCommission.amount,
            finalCommission.total,
            tradeStatus,
            orderType.toLowerCase(),
          ]
        );

        await client.query(
          `INSERT INTO commissions (
             trade_id, user_id, tier, trade_value, commission_rate,
             commission_amount, payment_status
           ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [
            tradeId,
            userId,
            tier,
            finalSubtotal,
            finalCommission.rate,
            finalCommission.amount,
          ]
        );
      });

      // ─── 5. Charge Stripe commission if customer has payment method ──────────
      let stripePaymentIntent: string | null = null;
      if (stripeCustomerId && finalCommission.amount > 0) {
        try {
          const paymentMethods = await stripeService.getPaymentMethods(stripeCustomerId);
          if (paymentMethods.length > 0) {
            const pi = await stripeService.chargeCommission({
              customerId: stripeCustomerId,
              amount: Math.round(finalCommission.amount * 100), // cents
              description: `Obsidian Capital commission — ${ticker} ${side}`,
              metadata: {
                tradeId,
                ticker,
                tier,
                userId,
              },
            });
            stripePaymentIntent = pi.id;

            await query(
              `UPDATE commissions
               SET stripe_payment_intent_id = $1,
                   stripe_charge_id = $2,
                   payment_status = 'charged'
               WHERE trade_id = $3`,
              [pi.id, (pi.latest_charge as string) || null, tradeId]
            );
          }
        } catch (stripeErr) {
          console.error('[Trades] Stripe commission charge failed for trade', tradeId, stripeErr);
          await query(
            `UPDATE commissions SET payment_status = 'failed' WHERE trade_id = $1`,
            [tradeId]
          ).catch(() => undefined);
        }
      }

      // ─── 6. Return response ──────────────────────────────────────────────────
      res.status(201).json({
        success: true,
        message: `${side === 'BUY' ? 'Purchase' : 'Sale'} order submitted successfully.`,
        data: {
          order: ibkrOrder,
          trade_id: tradeId,
          commission: finalCommission,
          stripe_payment_intent: stripePaymentIntent,
          upgrade_savings: {
            to_member: finalCommission.savings.upgrade_to_member,
            to_private: finalCommission.savings.upgrade_to_private,
          },
        },
      });
    } catch (err) {
      const e = err as Error;
      console.error('[Trades] Order error:', e.message);

      if (e.message.includes('Unprocessable') || e.message.includes('insufficient')) {
        res.status(422).json({
          success: false,
          error: e.message,
          code: 'IBKR_ORDER_REJECTED',
        });
        return;
      }

      if (e.message.includes('Not found')) {
        res.status(404).json({
          success: false,
          error: `Asset ${req.body.ticker} not found or not tradeable.`,
          code: 'ASSET_NOT_FOUND',
        });
        return;
      }

      if (e.message.includes('IBKR_NOT_CONNECTED')) {
        res.status(403).json({ success: false, error: e.message, code: 'IBKR_NOT_CONNECTED' });
        return;
      }

      res.status(500).json({ success: false, error: 'Failed to execute order.' });
    }
  }
);

// ─── GET /trades/orders ───────────────────────────────────────────────────────
// Order history from our DB, optionally enriched with live IBKR status

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const ticker = req.query.ticker as string | undefined;
    const type = req.query.type as string | undefined;

    let whereClause = 'WHERE t.user_id = $1';
    const params: (string | number)[] = [req.user!.userId];
    let paramIndex = 2;

    if (ticker) {
      whereClause += ` AND t.ticker = $${paramIndex++}`;
      params.push(ticker.toUpperCase());
    }

    if (type && ['buy', 'sell'].includes(type)) {
      whereClause += ` AND t.type = $${paramIndex++}`;
      params.push(type);
    }

    const [tradesResult, countResult] = await Promise.all([
      query(
        `SELECT
           t.id, t.ticker, t.company_name, t.type, t.shares, t.price,
           t.commission, t.total, t.status, t.order_type, t.created_at,
           c.commission_rate, c.tier AS commission_tier,
           c.payment_status AS commission_payment_status,
           c.stripe_payment_intent_id
         FROM trades t
         LEFT JOIN commissions c ON c.trade_id = t.id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) as total FROM trades t ${whereClause}`,
        params
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        orders: tradesResult.rows.map((t) => ({
          ...t,
          shares: parseFloat(t.shares),
          price: parseFloat(t.price),
          commission: parseFloat(t.commission),
          total: parseFloat(t.total),
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
    });
  } catch (err) {
    console.error('[Trades] Orders list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
});

// ─── DELETE /trades/orders/:orderId ──────────────────────────────────────────
// Cancel an open order on IBKR

router.delete('/orders/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;

    const connResult = await query(
      `SELECT ic.access_token, ic.account_id, ic.paper_mode
       FROM ibkr_connections ic
       WHERE ic.user_id = $1`,
      [userId]
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].access_token) {
      res.status(403).json({
        success: false,
        error: 'Interactive Brokers account is not connected.',
        code: 'IBKR_NOT_CONNECTED',
      });
      return;
    }

    const { access_token, account_id } = connResult.rows[0];
    const client = new IBKRService(access_token as string);

    await client.cancelOrder(account_id as string, orderId);

    // Update local DB if we have a matching trade
    await query(
      `UPDATE trades SET status = 'cancelled' WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    ).catch(() => undefined);

    res.json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] Cancel order error:', e.message);

    if (e.message.includes('Not found')) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

// ─── GET /trades/positions ────────────────────────────────────────────────────
// Current open positions from IBKR

router.get('/positions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const connResult = await query(
      `SELECT ic.access_token, ic.account_id, ic.paper_mode
       FROM ibkr_connections ic
       WHERE ic.user_id = $1`,
      [userId]
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].access_token) {
      // Return empty positions for users without IBKR connection
      res.json({
        success: true,
        data: { positions: [], count: 0 },
        message: 'No Interactive Brokers account connected.',
      });
      return;
    }

    const { access_token, account_id } = connResult.rows[0];
    const client = new IBKRService(access_token as string);

    const positions = await client.getPositions(account_id as string);

    res.json({
      success: true,
      data: {
        positions: positions.map((p) => ({
          conid: p.conid,
          symbol: p.contractDesc,
          acct_id: p.acctId,
          quantity: p.position,
          avg_cost: p.avgCost,
          market_price: p.mktPrice,
          market_value: p.mktValue,
          unrealized_pnl: p.unrealizedPnl,
          realized_pnl: p.realizedPnl,
        })),
        count: positions.length,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] Positions error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch positions.' });
  }
});

// ─── GET /trades/account ──────────────────────────────────────────────────────
// IBKR account info (available funds, net liquidation, etc.)

router.get('/account', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const connResult = await query(
      `SELECT ic.access_token, ic.account_id, ic.paper_mode, ic.account_type
       FROM ibkr_connections ic
       WHERE ic.user_id = $1`,
      [userId]
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].access_token) {
      res.json({
        success: true,
        data: {
          account: null,
          ibkr_connected: false,
        },
        message: 'No Interactive Brokers account connected.',
      });
      return;
    }

    const { access_token, account_id, paper_mode } = connResult.rows[0];
    const client = new IBKRService(access_token as string);

    const account = await client.getAccount(account_id as string);

    res.json({
      success: true,
      data: {
        account,
        paper_mode: paper_mode ?? false,
        ibkr_connected: true,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] Account error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch account info.' });
  }
});

// ─── POST /trades/ibkr/connect ────────────────────────────────────────────────
// Store user's IBKR OAuth tokens after completing the OAuth flow

router.post('/ibkr/connect', async (req: Request, res: Response): Promise<void> => {
  const { error, value } = connectIBKRSchema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
    return;
  }

  const { access_token, refresh_token, paper_mode, ibkr_account_id } = value;
  const userId = req.user!.userId;

  try {
    // Verify the token works by fetching account list
    const testClient = new IBKRService(access_token as string);
    const accounts = await testClient.getAccounts();
    const primaryAccount = accounts[0];
    const resolvedAccountId = ibkr_account_id || primaryAccount?.accountId || '';

    // Upsert connection record
    await query(
      `INSERT INTO ibkr_connections (
         id, user_id, access_token, refresh_token, paper_mode,
         account_id, account_type, connected_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         paper_mode = EXCLUDED.paper_mode,
         account_id = EXCLUDED.account_id,
         account_type = EXCLUDED.account_type,
         updated_at = NOW()`,
      [
        uuidv4(),
        userId,
        access_token,
        refresh_token || null,
        paper_mode,
        resolvedAccountId,
        primaryAccount?.accountType || 'INDIVIDUAL',
      ]
    );

    // Mark user as IBKR-connected
    await query(
      `UPDATE users SET ibkr_connected = true, ibkr_account_id = $1 WHERE id = $2`,
      [resolvedAccountId, userId]
    );

    res.json({
      success: true,
      message: 'Interactive Brokers account connected successfully.',
      data: {
        ibkr_account_id: resolvedAccountId,
        paper_mode,
        account_type: primaryAccount?.accountType || 'INDIVIDUAL',
        net_liquidation: primaryAccount?.netLiquidation ?? 0,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] IBKR connect error:', e.message);

    if (e.message.includes('Unauthorized') || e.message.includes('401')) {
      res.status(401).json({
        success: false,
        error: 'Invalid IBKR access token. Please re-authorize.',
      });
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to connect Interactive Brokers account.' });
  }
});

// ─── GET /trades/ibkr/callback ────────────────────────────────────────────────
// IBKR OAuth callback — exchanges authorization code for tokens

router.get('/ibkr/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state, error: oauthError } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (oauthError) {
    console.error('[Trades] IBKR OAuth error:', oauthError);
    res.redirect(`${frontendUrl}/settings/brokerage?error=${encodeURIComponent(oauthError)}`);
    return;
  }

  if (!code) {
    res.status(400).json({ success: false, error: 'Missing authorization code.' });
    return;
  }

  try {
    const tokens = await exchangeIBKRCode(code);

    const userId = req.user!.userId;

    // Fetch account info with new token
    const testClient = new IBKRService(tokens.access_token);
    const accounts = await testClient.getAccounts();
    const primaryAccount = accounts[0];
    const accountId = primaryAccount?.accountId || '';

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await query(
      `INSERT INTO ibkr_connections (
         id, user_id, access_token, refresh_token, paper_mode,
         account_id, account_type, token_expires_at, connected_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         account_id = EXCLUDED.account_id,
         account_type = EXCLUDED.account_type,
         token_expires_at = EXCLUDED.token_expires_at,
         updated_at = NOW()`,
      [
        uuidv4(),
        userId,
        tokens.access_token,
        tokens.refresh_token,
        primaryAccount?.accountType?.toLowerCase().includes('paper') ?? false,
        accountId,
        primaryAccount?.accountType || 'INDIVIDUAL',
        tokenExpiresAt,
      ]
    );

    await query(
      `UPDATE users SET ibkr_connected = true, ibkr_account_id = $1 WHERE id = $2`,
      [accountId, userId]
    );

    res.redirect(`${frontendUrl}/settings/brokerage?connected=true`);
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] IBKR callback error:', e.message);
    res.redirect(`${frontendUrl}/settings/brokerage?error=oauth_failed`);
  }
});

// ─── GET /trades/ibkr/auth-url ────────────────────────────────────────────────
// Generate the IBKR OAuth authorization URL

router.get('/ibkr/auth-url', (req: Request, res: Response): void => {
  const state = uuidv4();
  const url = getIBKRAuthUrl(state);
  res.json({ success: true, data: { url, state } });
});

// ─── GET /trades/mode ─────────────────────────────────────────────────────────
// Get paper/live mode status for the user

router.get('/mode', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT ic.paper_mode, u.ibkr_connected
       FROM users u
       LEFT JOIN ibkr_connections ic ON ic.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    const row = result.rows[0];
    const paperMode = row?.paper_mode ?? false;
    const ibkrConnected = row?.ibkr_connected ?? false;

    res.json({
      success: true,
      data: {
        paper_mode: paperMode,
        ibkr_connected: ibkrConnected,
        mode_label: paperMode ? 'Paper Trading' : 'Live Trading',
      },
    });
  } catch (err) {
    console.error('[Trades] Mode fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch trading mode.' });
  }
});

// ─── POST /trades/mode ────────────────────────────────────────────────────────
// Toggle paper/live mode for the user (IBKR has separate paper trading accounts)

router.post('/mode', async (req: Request, res: Response): Promise<void> => {
  const { paper_mode } = req.body;

  if (typeof paper_mode !== 'boolean') {
    res.status(400).json({
      success: false,
      error: '"paper_mode" must be a boolean.',
    });
    return;
  }

  try {
    const result = await query(
      `UPDATE ibkr_connections SET paper_mode = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING paper_mode`,
      [paper_mode, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No Interactive Brokers connection found. Please connect your IBKR account first.',
        code: 'IBKR_NOT_CONNECTED',
      });
      return;
    }

    res.json({
      success: true,
      message: `Switched to ${paper_mode ? 'paper' : 'live'} trading mode.`,
      data: {
        paper_mode,
        mode_label: paper_mode ? 'Paper Trading' : 'Live Trading',
      },
    });
  } catch (err) {
    console.error('[Trades] Mode toggle error:', err);
    res.status(500).json({ success: false, error: 'Failed to update trading mode.' });
  }
});

export default router;
