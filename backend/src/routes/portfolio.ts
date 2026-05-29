import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate, requireKyc } from '../middleware/auth';
import { IBKRService } from '../services/ibkr';

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

// ─── GET /portfolio/holdings ──────────────────────────────────────────────────
// If user has IBKR connected, fetch live positions; otherwise return empty

router.get('/holdings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Look up IBKR connection
    const connResult = await query(
      `SELECT ic.access_token, ic.account_id
       FROM ibkr_connections ic
       WHERE ic.user_id = $1`,
      [userId]
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].access_token) {
      // No IBKR connection — return empty holdings
      res.json({
        success: true,
        data: { holdings: [], count: 0 },
        message: 'No Interactive Brokers account connected.',
      });
      return;
    }

    const { access_token, account_id } = connResult.rows[0];
    const ibkrClient = new IBKRService(access_token as string);
    const positions = await ibkrClient.getPositions(account_id as string);

    // Transform IBKR IBKRPosition → Holding shape
    const holdings = positions
      .filter((p) => p.position !== 0)
      .map((p) => {
        const costBasis = parseFloat((p.position * p.avgCost).toFixed(2));
        const returnDollar = p.unrealizedPnl;
        const returnPct =
          costBasis > 0
            ? parseFloat(((returnDollar / costBasis) * 100).toFixed(2))
            : 0;
        return {
          // Frontend HoldingRaw shape
          symbol:           p.contractDesc,
          qty:              p.position,
          avg_entry_price:  p.avgCost,
          current_price:    p.mktPrice,
          market_value:     p.mktValue,
          unrealized_pl:    p.unrealizedPnl,
          unrealized_plpc:  returnPct / 100,
          // Extra context
          conid:            p.conid,
          acct_id:          p.acctId,
          cost_basis:       costBasis,
          gain_loss:        returnDollar,
          gain_loss_pct:    returnPct,
        };
      });

    res.json({
      success: true,
      data: { holdings, count: holdings.length },
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
// Try IBKR GET /portfolio/{accountId}/performance; fallback to empty if unavailable

router.get('/portfolio-history', requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || '30d';

    // Try IBKR performance data first
    const connResult = await query(
      `SELECT ic.access_token, ic.account_id FROM ibkr_connections ic WHERE ic.user_id = $1`,
      [userId]
    );

    if (connResult.rows.length > 0 && connResult.rows[0].access_token) {
      try {
        const { access_token, account_id } = connResult.rows[0];
        const ibkrClient = new IBKRService(access_token as string);

        // IBKR endpoint: GET /portfolio/{accountId}/performance
        // Returns { id, nav: [{date, value}], cps, pm, ... }
        const perfData = await ibkrClient['client'].get<{
          nav?: Array<{ date: string; val: number }>;
          id?: string;
        }>(`/portfolio/${encodeURIComponent(account_id as string)}/performance`);

        const navPoints = perfData.data?.nav ?? [];
        if (navPoints.length > 0) {
          const dataPoints = navPoints.map((pt, i, arr) => {
            const prevVal = i > 0 ? arr[i - 1].val : pt.val;
            const changePct = prevVal > 0
              ? parseFloat((((pt.val - prevVal) / prevVal) * 100).toFixed(2))
              : 0;
            return { date: pt.date, value: pt.val, change_pct: changePct };
          });

          const firstValue = dataPoints[0]?.value ?? 0;
          const lastValue  = dataPoints[dataPoints.length - 1]?.value ?? 0;
          const totalReturn = parseFloat((lastValue - firstValue).toFixed(2));
          const totalReturnPct = firstValue > 0
            ? parseFloat(((totalReturn / firstValue) * 100).toFixed(2))
            : 0;

          res.json({
            success: true,
            data: {
              period,
              data_points: dataPoints,
              summary: { start_value: firstValue, end_value: lastValue, total_return: totalReturn, total_return_pct: totalReturnPct },
              source: 'ibkr',
            },
          });
          return;
        }
      } catch {
        // Fall through to empty response
      }
    }

    // No IBKR data — return empty
    res.json({
      success: true,
      data: {
        period,
        data_points: [],
        summary: { start_value: 0, end_value: 0, total_return: 0, total_return_pct: 0 },
        source: 'none',
      },
    });
  } catch (err) {
    console.error('[Portfolio] History error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch portfolio history.' });
  }
});

export default router;
