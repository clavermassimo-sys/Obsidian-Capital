import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireKyc } from '../middleware/auth';
import { tradeLimiter } from '../middleware/rateLimit';
import { alpacaBroker } from '../services/alpaca-broker';
import { polygonService } from '../services/polygon';
import { stripeService } from '../services/stripe';
import { getCommissionBreakdown } from '../middleware/commission';
import { query, transaction } from '../config/database';
import { io } from '../index';

const router = Router();

// All trade routes require authentication
router.use(authenticate);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const orderSchema = Joi.object({
  ticker:       Joi.string().trim().uppercase().min(1).max(10).required(),
  company_name: Joi.string().trim().max(200).optional().allow(''),
  side:         Joi.string().valid('buy', 'sell').required(),
  qty:          Joi.number().positive().precision(6).max(1000000).required(),
  orderType:    Joi.string()
    .valid('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')
    .default('market'),
  tif:          Joi.string().valid('day', 'gtc', 'ioc', 'fok').default('day'),
  limitPrice:   Joi.when('orderType', {
    is: Joi.valid('limit', 'stop_limit'),
    then: Joi.number().positive().required(),
    otherwise: Joi.number().optional(),
  }),
  stopPrice:    Joi.when('orderType', {
    is: Joi.valid('stop', 'stop_limit'),
    then: Joi.number().positive().required(),
    otherwise: Joi.number().optional(),
  }),
  trailPct:     Joi.when('orderType', {
    is: 'trailing_stop',
    then: Joi.number().positive().required(),
    otherwise: Joi.number().optional(),
  }),
  estimatedPrice: Joi.number().positive().optional(),
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
          member:   getCommissionBreakdown(subtotalRaw, 'member'),
          private:  getCommissionBreakdown(subtotalRaw, 'private'),
        },
      },
    });
  } catch (err) {
    console.error('[Trades] Preview error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate commission preview.' });
  }
});

// ─── POST /trades/order ───────────────────────────────────────────────────────
// Place order via Alpaca Broker API, record commission, charge Stripe if on file

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
      company_name: companyNameRaw,
      side,
      qty,
      orderType,
      tif,
      limitPrice,
      stopPrice,
      trailPct,
      estimatedPrice,
    } = value;

    const userId = req.user!.userId;
    const tier   = req.user!.tier as 'standard' | 'member' | 'private';

    try {
      // ─── 1. Look up user's Alpaca account and Stripe customer ────────────────
      const userResult = await query(
        `SELECT u.tier, u.stripe_customer_id,
                aa.alpaca_account_id, aa.status AS alpaca_status, aa.paper_mode
         FROM users u
         LEFT JOIN alpaca_accounts aa ON aa.user_id = u.id
         WHERE u.id = $1`,
        [userId],
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const userRow = userResult.rows[0];
      const stripeCustomerId: string | null = userRow.stripe_customer_id || null;
      const alpacaAccountId: string | null  = userRow.alpaca_account_id  || null;

      if (!alpacaAccountId) {
        res.status(403).json({
          success: false,
          error: 'Brokerage account not yet set up. Please complete account setup first.',
          code: 'ALPACA_NOT_CONNECTED',
        });
        return;
      }

      // ─── 2. Calculate commission on subtotal ─────────────────────────────────
      let subtotal: number;
      if (estimatedPrice) {
        subtotal = parseFloat((qty * estimatedPrice).toFixed(2));
      } else {
        try {
          const quote = await polygonService.getQuote(ticker);
          subtotal = parseFloat((qty * quote.price).toFixed(2));
        } catch {
          subtotal = qty * 100; // placeholder; commission will be updated post-fill
        }
      }

      const commission = getCommissionBreakdown(subtotal, tier);

      // ─── 3. Submit order to Alpaca Broker ────────────────────────────────────
      const alpacaOrder = await alpacaBroker.placeOrder(alpacaAccountId, {
        symbol:        ticker,
        qty,
        side:          side as 'buy' | 'sell',
        type:          orderType as 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop',
        time_in_force: tif as 'day' | 'gtc' | 'ioc' | 'fok',
        ...(limitPrice !== undefined && { limit_price: limitPrice }),
        ...(stopPrice  !== undefined && { stop_price:  stopPrice  }),
        ...(trailPct   !== undefined && { trail_percent: trailPct }),
      });

      // ─── 4. Record trade + commission in DB ──────────────────────────────────
      const tradeId    = uuidv4();
      const filledPrice = alpacaOrder.filled_avg_price
        ? parseFloat(alpacaOrder.filled_avg_price)
        : (limitPrice ?? null);
      const filledQty =
        parseFloat(alpacaOrder.filled_qty) > 0 ? parseFloat(alpacaOrder.filled_qty) : qty;

      const alpacaStatus = alpacaOrder.status?.toLowerCase() ?? 'pending_new';
      const tradeStatus =
        alpacaStatus === 'filled'
          ? 'completed'
          : alpacaStatus === 'canceled' || alpacaStatus === 'cancelled'
          ? 'cancelled'
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
            companyNameRaw || ticker,
            side === 'buy' ? 'buy' : 'sell',
            filledQty,
            filledPrice ?? 0,
            finalCommission.amount,
            finalCommission.total,
            tradeStatus,
            orderType,
          ],
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
          ],
        );
      });

      // ─── 5. Charge Stripe commission if customer has payment method ──────────
      let stripePaymentIntent: string | null = null;
      if (stripeCustomerId && finalCommission.amount > 0) {
        try {
          const paymentMethods = await stripeService.getPaymentMethods(stripeCustomerId);
          if (paymentMethods.length > 0) {
            const pi = await stripeService.chargeCommission({
              customerId:  stripeCustomerId,
              amount:      Math.round(finalCommission.amount * 100), // cents
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
              [pi.id, (pi.latest_charge as string) || null, tradeId],
            );
          }
        } catch (stripeErr) {
          console.error('[Trades] Stripe commission charge failed for trade', tradeId, stripeErr);
          await query(
            `UPDATE commissions SET payment_status = 'failed' WHERE trade_id = $1`,
            [tradeId],
          ).catch(() => undefined);
        }
      }

      // ─── 6. Emit real-time order update via Socket.IO ────────────────────────
      const orderUpdatePayload = {
        trade_id:        tradeId,
        alpaca_order_id: alpacaOrder.id,
        ticker,
        side,
        qty:             filledQty,
        price:           filledPrice,
        status:          tradeStatus,
        commission:      finalCommission.amount,
        total:           finalCommission.total,
        created_at:      new Date().toISOString(),
      };
      io.to(`user:${userId}`).emit('order:update', orderUpdatePayload);

      // ─── 7. Return response ──────────────────────────────────────────────────
      res.status(201).json({
        success: true,
        message: `${side === 'buy' ? 'Purchase' : 'Sale'} order submitted successfully.`,
        data: {
          order:                 alpacaOrder,
          trade_id:             tradeId,
          commission:           finalCommission,
          stripe_payment_intent: stripePaymentIntent,
          upgrade_savings: {
            to_member:  finalCommission.savings.upgrade_to_member,
            to_private: finalCommission.savings.upgrade_to_private,
          },
        },
      });
    } catch (err) {
      const e = err as Error;
      console.error('[Trades] Order error:', e.message);

      if (e.message.includes('insufficient') || e.message.includes('422')) {
        res.status(422).json({
          success: false,
          error: e.message,
          code: 'ORDER_REJECTED',
        });
        return;
      }

      if (e.message.includes('not found') || e.message.includes('404')) {
        res.status(404).json({
          success: false,
          error: `Asset ${req.body.ticker as string} not found or not tradeable.`,
          code: 'ASSET_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({ success: false, error: 'Failed to execute order.' });
    }
  },
);

// ─── GET /trades/orders ───────────────────────────────────────────────────────
// Order history from our DB merged with live Alpaca open orders

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId   = req.user!.userId;
    const page     = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit    = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset   = (page - 1) * limit;
    const ticker   = req.query.ticker as string | undefined;
    const type     = req.query.type as string | undefined;

    let whereClause = 'WHERE t.user_id = $1';
    const params: (string | number)[] = [userId];
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
        [...params, limit, offset],
      ),
      query(
        `SELECT COUNT(*) as total FROM trades t ${whereClause}`,
        params,
      ),
    ]);

    // Attempt to fetch live Alpaca open orders and merge status
    const connResult = await query(
      `SELECT alpaca_account_id FROM alpaca_accounts WHERE user_id = $1`,
      [userId],
    );

    let alpacaOrderMap: Map<string, string> = new Map();
    if (connResult.rows.length > 0 && connResult.rows[0].alpaca_account_id) {
      try {
        const liveOrders = await alpacaBroker.getOrders(
          connResult.rows[0].alpaca_account_id as string,
        );
        for (const o of liveOrders) {
          if (o.id) alpacaOrderMap.set(o.id, o.status);
        }
      } catch {
        // Non-fatal — fall back to DB status
      }
    }

    const total      = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        orders: tradesResult.rows.map((t) => ({
          ...t,
          shares:     parseFloat(t.shares),
          price:      parseFloat(t.price),
          commission: parseFloat(t.commission),
          total:      parseFloat(t.total),
          alpaca_status: alpacaOrderMap.get(t.alpaca_order_id as string) ?? null,
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
    const userId      = req.user!.userId;

    const connResult = await query(
      `SELECT alpaca_account_id FROM alpaca_accounts WHERE user_id = $1`,
      [userId],
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].alpaca_account_id) {
      res.status(403).json({
        success: false,
        error: 'Brokerage account not connected.',
        code: 'ALPACA_NOT_CONNECTED',
      });
      return;
    }

    await alpacaBroker.cancelOrder(
      connResult.rows[0].alpaca_account_id as string,
      orderId,
    );

    // Update local DB if we have a matching trade
    await query(
      `UPDATE trades SET status = 'cancelled' WHERE id = $1 AND user_id = $2`,
      [orderId, userId],
    ).catch(() => undefined);

    res.json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] Cancel order error:', e.message);

    if (e.message.includes('not found') || e.message.includes('404')) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

// ─── GET /trades/positions ────────────────────────────────────────────────────
// Current open positions from Alpaca Broker

router.get('/positions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const connResult = await query(
      `SELECT alpaca_account_id, paper_mode FROM alpaca_accounts WHERE user_id = $1`,
      [userId],
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].alpaca_account_id) {
      res.json({
        success: true,
        data: { positions: [], count: 0 },
        message: 'No brokerage account connected.',
      });
      return;
    }

    const positions = await alpacaBroker.getPositions(
      connResult.rows[0].alpaca_account_id as string,
    );

    res.json({
      success: true,
      data: {
        positions: positions.map((p) => ({
          symbol:          p.symbol,
          qty:             parseFloat(p.qty),
          avg_entry_price: parseFloat(p.avg_entry_price),
          current_price:   parseFloat(p.current_price),
          market_value:    parseFloat(p.market_value),
          cost_basis:      parseFloat(p.cost_basis),
          unrealized_pl:   parseFloat(p.unrealized_pl),
          unrealized_plpc: parseFloat(p.unrealized_plpc),
          side:            p.side,
          asset_class:     p.asset_class,
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
// Alpaca account info (available funds, equity, etc.)

router.get('/account', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const connResult = await query(
      `SELECT alpaca_account_id, alpaca_account_number, status, paper_mode
       FROM alpaca_accounts WHERE user_id = $1`,
      [userId],
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].alpaca_account_id) {
      res.json({
        success: true,
        data: {
          account:           null,
          alpaca_connected:  false,
        },
        message: 'No brokerage account connected.',
      });
      return;
    }

    const { alpaca_account_id, paper_mode } = connResult.rows[0];
    const account = await alpacaBroker.getAccount(alpaca_account_id as string);

    res.json({
      success: true,
      data: {
        account: {
          id:              account.id,
          account_number:  account.account_number,
          status:          account.status,
          currency:        account.currency,
          buying_power:    parseFloat(account.buying_power),
          cash:            parseFloat(account.cash),
          equity:          parseFloat(account.equity),
          portfolio_value: parseFloat(account.portfolio_value),
          long_market_value: parseFloat(account.long_market_value),
        },
        paper_mode:       paper_mode ?? true,
        alpaca_connected: true,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error('[Trades] Account error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch account info.' });
  }
});

// ─── GET /trades/mode ─────────────────────────────────────────────────────────
// Get paper/live mode status for the user

router.get('/mode', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT aa.paper_mode, aa.status
       FROM alpaca_accounts aa
       WHERE aa.user_id = $1`,
      [req.user!.userId],
    );

    const row          = result.rows[0];
    const paperMode    = row?.paper_mode ?? true;
    const connected    = !!row;

    res.json({
      success: true,
      data: {
        paper_mode:  paperMode,
        connected,
        mode_label:  paperMode ? 'Paper Trading' : 'Live Trading',
      },
    });
  } catch (err) {
    console.error('[Trades] Mode fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch trading mode.' });
  }
});

export default router;
