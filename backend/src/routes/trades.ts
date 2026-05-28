import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireKyc } from '../middleware/auth';
import { tradeLimiter } from '../middleware/rateLimit';
import { alpacaService, AlpacaService } from '../services/alpaca';
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
  side: Joi.string().valid('buy', 'sell').required(),
  // qty OR notional must be provided (not both)
  qty: Joi.number().positive().precision(6).max(1000000),
  notional: Joi.number().positive().precision(2).max(10000000),
  orderType: Joi.string()
    .valid('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')
    .default('market'),
  time_in_force: Joi.string().valid('day', 'gtc', 'ioc', 'fok').default('day'),
  limitPrice: Joi.when('orderType', {
    is: Joi.string().valid('limit', 'stop_limit'),
    then: Joi.number().positive().precision(2).required(),
    otherwise: Joi.number().optional(),
  }),
  stopPrice: Joi.when('orderType', {
    is: Joi.string().valid('stop', 'stop_limit'),
    then: Joi.number().positive().precision(2).required(),
    otherwise: Joi.number().optional(),
  }),
  trailPercent: Joi.when('orderType', {
    is: 'trailing_stop',
    then: Joi.number().positive().precision(2).required(),
    otherwise: Joi.number().optional(),
  }),
  // Optional price estimate for commission preview (used for notional orders)
  estimatedPrice: Joi.number().positive().optional(),
}).or('qty', 'notional');

const connectAlpacaSchema = Joi.object({
  access_token: Joi.string().required(),
  refresh_token: Joi.string().optional().allow(''),
  paper_mode: Joi.boolean().default(true),
  alpaca_account_id: Joi.string().optional().allow(''),
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
// Place order via Alpaca, record commission, charge Stripe if on file

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
      side,
      qty,
      notional,
      orderType,
      time_in_force,
      limitPrice,
      stopPrice,
      trailPercent,
      estimatedPrice,
    } = value;

    const userId = req.user!.userId;
    const tier = req.user!.tier as 'standard' | 'member' | 'private';

    try {
      // ─── 1. Look up user's data (Alpaca connection, Stripe customer) ────────
      const userResult = await query(
        `SELECT u.tier, u.stripe_customer_id, u.alpaca_connected,
                ac.access_token, ac.paper_mode
         FROM users u
         LEFT JOIN alpaca_connections ac ON ac.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const userRow = userResult.rows[0];
      const stripeCustomerId: string | null = userRow.stripe_customer_id || null;

      // ─── 2. Build the Alpaca service instance ────────────────────────────────
      // Use user's personal OAuth token if available; fall back to platform key
      let alpacaClient: AlpacaService;
      if (userRow.alpaca_connected && userRow.access_token) {
        alpacaClient = new AlpacaService(
          userRow.access_token,
          '', // OAuth token — secret not needed
          userRow.paper_mode ?? true
        );
      } else {
        alpacaClient = alpacaService; // platform-level paper key
      }

      // ─── 3. Calculate commission on subtotal ─────────────────────────────────
      // For notional orders, subtotal = notional; for qty orders, try to get price
      let subtotal: number;
      if (notional) {
        subtotal = notional;
      } else if (estimatedPrice) {
        subtotal = parseFloat((qty * estimatedPrice).toFixed(2));
      } else {
        // Attempt to get a live quote for commission calculation
        try {
          const trade = await alpacaService.getLatestTrade(ticker);
          subtotal = parseFloat((qty * trade.price).toFixed(2));
        } catch {
          // If market data is unavailable, fall back to a rough estimate
          subtotal = qty * 100; // placeholder; commission will be updated post-fill
        }
      }

      const commission = getCommissionBreakdown(subtotal, tier);

      // ─── 4. Submit order to Alpaca ───────────────────────────────────────────
      const alpacaOrder = await alpacaClient.placeOrder({
        symbol: ticker,
        qty: qty,
        notional: notional,
        side,
        type: orderType,
        time_in_force,
        limit_price: limitPrice,
        stop_price: stopPrice,
        trail_percent: trailPercent,
      });

      // ─── 5. Record trade + commission in DB ──────────────────────────────────
      const tradeId = uuidv4();
      const filledPrice = alpacaOrder.filled_avg_price
        ? parseFloat(alpacaOrder.filled_avg_price)
        : null;
      const filledQty = parseFloat(alpacaOrder.filled_qty || '0') || qty;
      const tradeStatus =
        alpacaOrder.status === 'filled'
          ? 'completed'
          : alpacaOrder.status === 'canceled'
          ? 'cancelled'
          : 'pending';

      // Final subtotal based on fill (if available) or estimate
      const finalSubtotal =
        filledPrice && filledQty
          ? parseFloat((filledQty * filledPrice).toFixed(2))
          : subtotal;

      const finalCommission = getCommissionBreakdown(finalSubtotal, tier);

      await transaction(async (client) => {
        // Insert trade record
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
            side,
            filledQty,
            filledPrice ?? 0,
            finalCommission.amount,
            finalCommission.total,
            tradeStatus,
            orderType,
          ]
        );

        // Insert commission record
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

      // ─── 6. Charge Stripe commission if customer has payment method ──────────
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

            // Update commission record with Stripe details
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
          // Non-blocking: log and mark failed; do not abort the trade response
          console.error('[Trades] Stripe commission charge failed for trade', tradeId, stripeErr);
          await query(
            `UPDATE commissions SET payment_status = 'failed' WHERE trade_id = $1`,
            [tradeId]
          ).catch(() => undefined);
        }
      }

      // ─── 7. Return response ──────────────────────────────────────────────────
      res.status(201).json({
        success: true,
        message: `${side === 'buy' ? 'Purchase' : 'Sale'} order submitted successfully.`,
        data: {
          order: alpacaOrder,
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

      // Map Alpaca errors to user-friendly responses
      if (e.message.includes('Unprocessable') || e.message.includes('insufficient')) {
        res.status(422).json({
          success: false,
          error: e.message,
          code: 'ALPACA_ORDER_REJECTED',
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

      res.status(500).json({ success: false, error: 'Failed to execute order.' });
    }
  }
);

// ─── GET /trades/orders ───────────────────────────────────────────────────────
// Order history from our DB, enriched with Alpaca status if available

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
// Cancel an open order on Alpaca

router.delete('/orders/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;

    // Look up user's Alpaca connection
    const connResult = await query(
      `SELECT ac.access_token, ac.paper_mode
       FROM alpaca_connections ac
       WHERE ac.user_id = $1`,
      [userId]
    );

    let client: AlpacaService;
    if (connResult.rows.length > 0 && connResult.rows[0].access_token) {
      client = new AlpacaService(
        connResult.rows[0].access_token,
        '',
        connResult.rows[0].paper_mode ?? true
      );
    } else {
      client = alpacaService;
    }

    await client.cancelOrder(orderId);

    // Update local DB if we have a matching trade
    await query(
      `UPDATE trades SET status = 'cancelled' WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    ).catch(() => undefined); // Non-blocking; Alpaca order ID may differ from our trade ID

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
// Current open positions from Alpaca

router.get('/positions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const connResult = await query(
      `SELECT ac.access_token, ac.paper_mode
       FROM alpaca_connections ac
       WHERE ac.user_id = $1`,
      [userId]
    );

    let client: AlpacaService;
    if (connResult.rows.length > 0 && connResult.rows[0].access_token) {
      client = new AlpacaService(
        connResult.rows[0].access_token,
        '',
        connResult.rows[0].paper_mode ?? true
      );
    } else {
      client = alpacaService;
    }

    const positions = await client.getPositions();

    res.json({
      success: true,
      data: {
        positions: positions.map((p) => ({
          ...p,
          qty: parseFloat(p.qty),
          avg_entry_price: parseFloat(p.avg_entry_price),
          market_value: parseFloat(p.market_value),
          cost_basis: parseFloat(p.cost_basis),
          unrealized_pl: parseFloat(p.unrealized_pl),
          unrealized_plpc: parseFloat(p.unrealized_plpc),
          current_price: parseFloat(p.current_price),
          lastday_price: parseFloat(p.lastday_price),
          change_today: parseFloat(p.change_today),
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
// Alpaca account info (buying power, equity, etc.)

router.get('/account', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const connResult = await query(
      `SELECT ac.access_token, ac.paper_mode, ac.alpaca_account_id
       FROM alpaca_connections ac
       WHERE ac.user_id = $1`,
      [userId]
    );

    let client: AlpacaService;
    let paperMode = true;

    if (connResult.rows.length > 0 && connResult.rows[0].access_token) {
      paperMode = connResult.rows[0].paper_mode ?? true;
      client = new AlpacaService(connResult.rows[0].access_token, '', paperMode);
    } else {
      client = alpacaService;
      paperMode = alpacaService.isPaperMode();
    }

    const account = await client.getAccount();

    res.json({
      success: true,
      data: {
        account: {
          ...account,
          buying_power: parseFloat(account.buying_power),
          cash: parseFloat(account.cash),
          portfolio_value: parseFloat(account.portfolio_value),
          equity: parseFloat(account.equity),
          last_equity: parseFloat(account.last_equity),
          long_market_value: parseFloat(account.long_market_value),
          short_market_value: parseFloat(account.short_market_value),
        },
        paper_mode: paperMode,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] Account error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch account info.' });
  }
});

// ─── POST /trades/alpaca/connect ──────────────────────────────────────────────
// Store user's Alpaca OAuth tokens after completing the OAuth flow

router.post('/alpaca/connect', async (req: Request, res: Response): Promise<void> => {
  const { error, value } = connectAlpacaSchema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
    return;
  }

  const { access_token, refresh_token, paper_mode, alpaca_account_id } = value;
  const userId = req.user!.userId;

  try {
    // Verify the token works by fetching account info
    const testClient = new AlpacaService(access_token, '', paper_mode);
    const account = await testClient.getAccount();

    // Upsert connection record
    await query(
      `INSERT INTO alpaca_connections (
         id, user_id, access_token, refresh_token, paper_mode, alpaca_account_id
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         paper_mode = EXCLUDED.paper_mode,
         alpaca_account_id = EXCLUDED.alpaca_account_id,
         updated_at = NOW()`,
      [
        uuidv4(),
        userId,
        access_token,
        refresh_token || null,
        paper_mode,
        alpaca_account_id || account.id,
      ]
    );

    // Mark user as Alpaca-connected
    await query(
      `UPDATE users SET alpaca_connected = true WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Alpaca account connected successfully.',
      data: {
        alpaca_account_id: account.id,
        paper_mode,
        account_status: account.status,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] Alpaca connect error:', e.message);

    if (e.message.includes('Forbidden') || e.message.includes('401')) {
      res.status(401).json({
        success: false,
        error: 'Invalid Alpaca access token. Please re-authorize.',
      });
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to connect Alpaca account.' });
  }
});

// ─── GET /trades/mode ─────────────────────────────────────────────────────────
// Get paper/live mode status for the user

router.get('/mode', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT ac.paper_mode, u.alpaca_connected
       FROM users u
       LEFT JOIN alpaca_connections ac ON ac.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    const row = result.rows[0];
    const paperMode = row?.paper_mode ?? true;
    const alpacaConnected = row?.alpaca_connected ?? false;

    res.json({
      success: true,
      data: {
        paper_mode: paperMode,
        alpaca_connected: alpacaConnected,
        mode_label: paperMode ? 'Paper Trading' : 'Live Trading',
      },
    });
  } catch (err) {
    console.error('[Trades] Mode fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch trading mode.' });
  }
});

// ─── POST /trades/mode ────────────────────────────────────────────────────────
// Toggle paper/live mode for the user

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
      `UPDATE alpaca_connections SET paper_mode = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING paper_mode`,
      [paper_mode, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No Alpaca connection found. Please connect your Alpaca account first.',
        code: 'ALPACA_NOT_CONNECTED',
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
