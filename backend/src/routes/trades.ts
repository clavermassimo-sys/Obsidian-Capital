import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database';
import { authenticate, requireKyc } from '../middleware/auth';
import { tradeLimiter } from '../middleware/rateLimit';
import { calculateCommission, CommissionTier } from '../config/commission';

const router = Router();

// All trade routes require authentication
router.use(authenticate);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const orderSchema = Joi.object({
  ticker: Joi.string().trim().uppercase().min(1).max(10).required(),
  company_name: Joi.string().trim().min(1).max(200).required(),
  type: Joi.string().valid('buy', 'sell').required(),
  shares: Joi.number().positive().precision(6).max(1000000).required(),
  price: Joi.number().positive().precision(2).max(1000000).required(),
  order_type: Joi.string().valid('market', 'limit', 'stop').default('market'),
  limit_price: Joi.when('order_type', {
    is: 'limit',
    then: Joi.number().positive().precision(2).required(),
    otherwise: Joi.number().optional(),
  }),
});

// ─── POST /trades/order ───────────────────────────────────────────────────────
// Place a buy or sell order with commission calculation

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

    const { ticker, company_name, type, shares, price, order_type } = value;
    const userId = req.user!.userId;
    const tier = req.user!.tier as CommissionTier;

    const subtotal = parseFloat((shares * price).toFixed(2));
    const commission = calculateCommission(subtotal, tier);

    try {
      // Use a transaction to ensure atomicity
      const tradeId = await transaction(async (client) => {
        // Fetch user's current buying power
        const userResult = await client.query(
          'SELECT buying_power FROM users WHERE id = $1 FOR UPDATE',
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new Error('USER_NOT_FOUND');
        }

        const buyingPower = parseFloat(userResult.rows[0].buying_power);

        if (type === 'buy') {
          // Check sufficient buying power (subtotal + commission)
          if (buyingPower < commission.total) {
            throw new Error('INSUFFICIENT_FUNDS');
          }

          // Deduct from buying power
          await client.query(
            'UPDATE users SET buying_power = buying_power - $1 WHERE id = $2',
            [commission.total, userId]
          );

          // Upsert holding
          const existingHolding = await client.query(
            'SELECT id, shares, avg_cost FROM holdings WHERE user_id = $1 AND ticker = $2',
            [userId, ticker]
          );

          if (existingHolding.rows.length > 0) {
            const existing = existingHolding.rows[0];
            const totalShares = parseFloat(existing.shares) + shares;
            const totalCost =
              parseFloat(existing.shares) * parseFloat(existing.avg_cost) + subtotal;
            const newAvgCost = parseFloat((totalCost / totalShares).toFixed(6));

            await client.query(
              'UPDATE holdings SET shares = $1, avg_cost = $2 WHERE id = $3',
              [totalShares, newAvgCost, existing.id]
            );
          } else {
            await client.query(
              `INSERT INTO holdings (id, user_id, ticker, company_name, shares, avg_cost)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [uuidv4(), userId, ticker, company_name, shares, price]
            );
          }
        } else {
          // SELL: verify user owns enough shares
          const holdingResult = await client.query(
            'SELECT id, shares, avg_cost FROM holdings WHERE user_id = $1 AND ticker = $2 FOR UPDATE',
            [userId, ticker]
          );

          if (holdingResult.rows.length === 0) {
            throw new Error('HOLDING_NOT_FOUND');
          }

          const holding = holdingResult.rows[0];
          const ownedShares = parseFloat(holding.shares);

          if (ownedShares < shares) {
            throw new Error('INSUFFICIENT_SHARES');
          }

          const remainingShares = parseFloat((ownedShares - shares).toFixed(6));

          if (remainingShares === 0) {
            // Remove holding entirely
            await client.query('DELETE FROM holdings WHERE id = $1', [holding.id]);
          } else {
            await client.query(
              'UPDATE holdings SET shares = $1 WHERE id = $2',
              [remainingShares, holding.id]
            );
          }

          // Credit proceeds minus commission to buying power
          const netProceeds = parseFloat((subtotal - commission.amount).toFixed(2));
          await client.query(
            'UPDATE users SET buying_power = buying_power + $1 WHERE id = $2',
            [netProceeds, userId]
          );
        }

        // Insert trade record
        const newTradeId = uuidv4();
        await client.query(
          `INSERT INTO trades (
             id, user_id, ticker, company_name, type, shares, price,
             commission, total, status, order_type, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [
            newTradeId,
            userId,
            ticker,
            company_name,
            type,
            shares,
            price,
            commission.amount,
            commission.total,
            'completed',
            order_type,
          ]
        );

        return newTradeId;
      });

      // Return trade confirmation
      res.status(201).json({
        success: true,
        message: `${type === 'buy' ? 'Purchase' : 'Sale'} order executed successfully.`,
        data: {
          trade: {
            id: tradeId,
            ticker,
            company_name,
            type,
            shares,
            price,
            subtotal,
            commission: {
              rate: commission.rate,
              amount: commission.amount,
              display: commission.display,
              tier,
            },
            total: commission.total,
            status: 'completed',
            order_type,
          },
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Trades] Order error:', error.message);

      if (error.message === 'INSUFFICIENT_FUNDS') {
        res.status(400).json({
          success: false,
          error: 'Insufficient buying power to place this order.',
          code: 'INSUFFICIENT_FUNDS',
          required: commission.total,
        });
        return;
      }

      if (error.message === 'INSUFFICIENT_SHARES') {
        res.status(400).json({
          success: false,
          error: 'Insufficient shares to sell.',
          code: 'INSUFFICIENT_SHARES',
        });
        return;
      }

      if (error.message === 'HOLDING_NOT_FOUND') {
        res.status(400).json({
          success: false,
          error: `You do not own any shares of ${ticker}.`,
          code: 'HOLDING_NOT_FOUND',
        });
        return;
      }

      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'User account not found.' });
        return;
      }

      res.status(500).json({ success: false, error: 'Failed to execute order.' });
    }
  }
);

// ─── GET /trades/orders ───────────────────────────────────────────────────────
// Retrieve paginated order history for the authenticated user

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const ticker = req.query.ticker as string | undefined;
    const type = req.query.type as string | undefined;

    let whereClause = 'WHERE user_id = $1';
    const params: (string | number)[] = [req.user!.userId];
    let paramIndex = 2;

    if (ticker) {
      whereClause += ` AND ticker = $${paramIndex++}`;
      params.push(ticker.toUpperCase());
    }

    if (type && ['buy', 'sell'].includes(type)) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    const [tradesResult, countResult] = await Promise.all([
      query(
        `SELECT
           id, ticker, company_name, type, shares, price,
           commission, total, status, order_type, created_at
         FROM trades
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) as total FROM trades ${whereClause}`,
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

// ─── GET /trades/orders/:id ───────────────────────────────────────────────────
// Get a specific order by ID (user can only access their own)

router.get('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
         id, ticker, company_name, type, shares, price,
         commission, total, status, order_type, created_at
       FROM trades
       WHERE id = $1 AND user_id = $2`,
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    const trade = result.rows[0];

    res.json({
      success: true,
      data: {
        order: {
          ...trade,
          shares: parseFloat(trade.shares),
          price: parseFloat(trade.price),
          commission: parseFloat(trade.commission),
          total: parseFloat(trade.total),
          subtotal: parseFloat((trade.shares * trade.price).toFixed(2)),
        },
      },
    });
  } catch (err) {
    console.error('[Trades] Order fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch order.' });
  }
});

export default router;
