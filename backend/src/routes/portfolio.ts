import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate, requireKyc } from '../middleware/auth';

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

// ─── GET /portfolio/holdings ──────────────────────────────────────────────────
// Returns all current stock holdings for the authenticated user

router.get('/holdings', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT
         h.id,
         h.ticker,
         h.company_name,
         h.shares,
         h.avg_cost,
         ROUND((h.shares * h.avg_cost)::numeric, 2) AS cost_basis
       FROM holdings h
       WHERE h.user_id = $1
       ORDER BY (h.shares * h.avg_cost) DESC`,
      [req.user!.userId]
    );

    // Enrich with mock current prices (in production, fetch from market data API)
    const holdings = result.rows.map((h) => {
      const mockPriceVariance = 1 + (Math.random() * 0.2 - 0.1); // ±10% variance
      const currentPrice = parseFloat((h.avg_cost * mockPriceVariance).toFixed(2));
      const marketValue = parseFloat((h.shares * currentPrice).toFixed(2));
      const costBasis = parseFloat(h.cost_basis);
      const gainLoss = parseFloat((marketValue - costBasis).toFixed(2));
      const gainLossPct = parseFloat(((gainLoss / costBasis) * 100).toFixed(2));

      return {
        id: h.id,
        ticker: h.ticker,
        company_name: h.company_name,
        shares: parseFloat(h.shares),
        avg_cost: parseFloat(h.avg_cost),
        current_price: currentPrice,
        cost_basis: costBasis,
        market_value: marketValue,
        gain_loss: gainLoss,
        gain_loss_pct: gainLossPct,
      };
    });

    res.json({
      success: true,
      data: {
        holdings,
        count: holdings.length,
      },
    });
  } catch (err) {
    console.error('[Portfolio] Holdings error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch holdings.' });
  }
});

// ─── GET /portfolio/portfolio-value ──────────────────────────────────────────
// Returns total portfolio value summary with buying power and P&L

router.get('/portfolio-value', requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const [holdingsResult, userResult, tradesResult] = await Promise.all([
      query(
        `SELECT
           ticker,
           shares,
           avg_cost,
           ROUND((shares * avg_cost)::numeric, 2) AS cost_basis
         FROM holdings
         WHERE user_id = $1`,
        [req.user!.userId]
      ),
      query(
        'SELECT buying_power, tier, name FROM users WHERE id = $1',
        [req.user!.userId]
      ),
      query(
        `SELECT
           SUM(CASE WHEN type = 'buy' THEN total ELSE 0 END) AS total_invested,
           SUM(CASE WHEN type = 'sell' THEN total ELSE 0 END) AS total_proceeds,
           SUM(commission) AS total_commissions_paid,
           COUNT(*) AS total_trades
         FROM trades
         WHERE user_id = $1 AND status = 'completed'`,
        [req.user!.userId]
      ),
    ]);

    const user = userResult.rows[0];
    const tradeStats = tradesResult.rows[0];

    // Calculate portfolio market value with mock prices
    let totalMarketValue = 0;
    let totalCostBasis = 0;

    for (const h of holdingsResult.rows) {
      const variance = 1 + (Math.random() * 0.2 - 0.1);
      const currentPrice = parseFloat(h.avg_cost) * variance;
      totalMarketValue += h.shares * currentPrice;
      totalCostBasis += parseFloat(h.cost_basis);
    }

    totalMarketValue = parseFloat(totalMarketValue.toFixed(2));
    totalCostBasis = parseFloat(totalCostBasis.toFixed(2));

    const buyingPower = parseFloat(user?.buying_power || '0');
    const totalAccountValue = parseFloat((totalMarketValue + buyingPower).toFixed(2));
    const unrealizedGainLoss = parseFloat((totalMarketValue - totalCostBasis).toFixed(2));
    const unrealizedGainLossPct =
      totalCostBasis > 0
        ? parseFloat(((unrealizedGainLoss / totalCostBasis) * 100).toFixed(2))
        : 0;

    res.json({
      success: true,
      data: {
        account: {
          name: user?.name,
          tier: user?.tier,
        },
        portfolio: {
          market_value: totalMarketValue,
          cost_basis: totalCostBasis,
          unrealized_gain_loss: unrealizedGainLoss,
          unrealized_gain_loss_pct: unrealizedGainLossPct,
          positions: holdingsResult.rows.length,
        },
        account_summary: {
          total_account_value: totalAccountValue,
          buying_power: buyingPower,
          total_invested: parseFloat(tradeStats.total_invested || '0'),
          total_proceeds: parseFloat(tradeStats.total_proceeds || '0'),
          total_commissions_paid: parseFloat(tradeStats.total_commissions_paid || '0'),
          total_trades: parseInt(tradeStats.total_trades || '0'),
        },
        as_of: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Portfolio] Value error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch portfolio value.' });
  }
});

// ─── GET /portfolio/portfolio-history ─────────────────────────────────────────
// Returns historical portfolio performance data points (30/90/365 days)

router.get('/portfolio-history', requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || '30d';
    const validPeriods: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };

    const days = validPeriods[period] ?? 30;

    // Get completed trades within period for the user
    const tradesResult = await query(
      `SELECT
         DATE(created_at) AS trade_date,
         type,
         shares,
         price,
         total,
         ticker
       FROM trades
       WHERE user_id = $1
         AND status = 'completed'
         AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at ASC`,
      [req.user!.userId]
    );

    // Get current holdings cost basis as baseline
    const holdingsResult = await query(
      `SELECT SUM(shares * avg_cost) AS total_cost_basis FROM holdings WHERE user_id = $1`,
      [req.user!.userId]
    );

    const baseCostBasis = parseFloat(holdingsResult.rows[0]?.total_cost_basis || '0');

    // Build synthetic daily portfolio value snapshots
    const dataPoints: { date: string; value: number; change_pct: number }[] = [];
    const startValue = baseCostBasis > 0 ? baseCostBasis * 0.9 : 10000;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Simulate realistic price movement (random walk)
      const dayVariance = 1 + (Math.random() * 0.04 - 0.02); // ±2% daily
      const progressFactor = (days - i) / days;
      const trendFactor = 1 + progressFactor * 0.08; // ~8% trend over period
      const value = parseFloat((startValue * trendFactor * dayVariance).toFixed(2));

      const changePct =
        dataPoints.length > 0
          ? parseFloat(
              (((value - dataPoints[dataPoints.length - 1].value) /
                dataPoints[dataPoints.length - 1].value) *
                100).toFixed(2)
            )
          : 0;

      dataPoints.push({ date: dateStr, value, change_pct: changePct });
    }

    const firstValue = dataPoints[0]?.value ?? 0;
    const lastValue = dataPoints[dataPoints.length - 1]?.value ?? 0;
    const totalReturn = parseFloat((lastValue - firstValue).toFixed(2));
    const totalReturnPct =
      firstValue > 0
        ? parseFloat(((totalReturn / firstValue) * 100).toFixed(2))
        : 0;

    res.json({
      success: true,
      data: {
        period,
        data_points: dataPoints,
        summary: {
          start_value: firstValue,
          end_value: lastValue,
          total_return: totalReturn,
          total_return_pct: totalReturnPct,
          trades_in_period: tradesResult.rows.length,
        },
      },
    });
  } catch (err) {
    console.error('[Portfolio] History error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch portfolio history.' });
  }
});

export default router;
