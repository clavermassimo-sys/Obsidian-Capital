import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate, requireKyc } from '../middleware/auth';
import { alpacaBroker } from '../services/alpaca-broker';

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

// ─── GET /portfolio/holdings ──────────────────────────────────────────────────
// If user has an Alpaca account, fetch live positions; otherwise return empty

router.get('/holdings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Look up Alpaca account
    const connResult = await query(
      `SELECT alpaca_account_id FROM alpaca_accounts WHERE user_id = $1`,
      [userId],
    );

    if (connResult.rows.length === 0 || !connResult.rows[0].alpaca_account_id) {
      res.json({
        success: true,
        data: { holdings: [], count: 0 },
        message: 'No brokerage account connected.',
      });
      return;
    }

    const alpacaAccountId = connResult.rows[0].alpaca_account_id as string;
    const positions       = await alpacaBroker.getPositions(alpacaAccountId);

    // Transform AlpacaPosition → Holding shape expected by frontend
    const holdings = positions
      .filter((p) => parseFloat(p.qty) !== 0)
      .map((p) => {
        const qty            = parseFloat(p.qty);
        const avgEntry       = parseFloat(p.avg_entry_price);
        const currentPrice   = parseFloat(p.current_price);
        const marketValue    = parseFloat(p.market_value);
        const costBasis      = parseFloat(p.cost_basis);
        const unrealizedPl   = parseFloat(p.unrealized_pl);
        const unrealizedPlpc = parseFloat(p.unrealized_plpc);

        const returnPct = costBasis > 0
          ? parseFloat(((unrealizedPl / costBasis) * 100).toFixed(2))
          : 0;

        return {
          // Frontend HoldingRaw shape
          symbol:           p.symbol,
          qty,
          avg_entry_price:  avgEntry,
          current_price:    currentPrice,
          market_value:     marketValue,
          unrealized_pl:    unrealizedPl,
          unrealized_plpc:  unrealizedPlpc,
          // Extra context
          cost_basis:       costBasis,
          gain_loss:        unrealizedPl,
          gain_loss_pct:    returnPct,
          side:             p.side,
          asset_class:      p.asset_class,
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
        [req.user!.userId],
      ),
      query(
        'SELECT buying_power, tier, name FROM users WHERE id = $1',
        [req.user!.userId],
      ),
      query(
        `SELECT
           SUM(CASE WHEN type = 'buy' THEN total ELSE 0 END) AS total_invested,
           SUM(CASE WHEN type = 'sell' THEN total ELSE 0 END) AS total_proceeds,
           SUM(commission) AS total_commissions_paid,
           COUNT(*) AS total_trades
         FROM trades
         WHERE user_id = $1 AND status = 'completed'`,
        [req.user!.userId],
      ),
    ]);

    const user       = userResult.rows[0];
    const tradeStats = tradesResult.rows[0];

    // Calculate portfolio market value with mock prices
    let totalMarketValue = 0;
    let totalCostBasis   = 0;

    for (const h of holdingsResult.rows) {
      const variance     = 1 + (Math.random() * 0.2 - 0.1);
      const currentPrice = parseFloat(h.avg_cost) * variance;
      totalMarketValue  += h.shares * currentPrice;
      totalCostBasis    += parseFloat(h.cost_basis);
    }

    totalMarketValue = parseFloat(totalMarketValue.toFixed(2));
    totalCostBasis   = parseFloat(totalCostBasis.toFixed(2));

    const buyingPower        = parseFloat(user?.buying_power || '0');
    const totalAccountValue  = parseFloat((totalMarketValue + buyingPower).toFixed(2));
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
          market_value:             totalMarketValue,
          cost_basis:               totalCostBasis,
          unrealized_gain_loss:     unrealizedGainLoss,
          unrealized_gain_loss_pct: unrealizedGainLossPct,
          positions:                holdingsResult.rows.length,
        },
        account_summary: {
          total_account_value:     totalAccountValue,
          buying_power:            buyingPower,
          total_invested:          parseFloat(tradeStats.total_invested || '0'),
          total_proceeds:          parseFloat(tradeStats.total_proceeds || '0'),
          total_commissions_paid:  parseFloat(tradeStats.total_commissions_paid || '0'),
          total_trades:            parseInt(tradeStats.total_trades || '0'),
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
// Fetch portfolio performance history from Alpaca Broker; fallback to empty

router.get('/portfolio-history', requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || '1M';

    // Map frontend period labels to Alpaca period format
    const periodMap: Record<string, string> = {
      '7d':  '1W',
      '30d': '1M',
      '1M':  '1M',
      '3M':  '3M',
      '6M':  '6M',
      '1Y':  '1A',
      'ALL': '5A',
    };
    const alpacaPeriod = periodMap[period] ?? '1M';

    // Look up Alpaca account
    const connResult = await query(
      `SELECT alpaca_account_id FROM alpaca_accounts WHERE user_id = $1`,
      [userId],
    );

    if (connResult.rows.length > 0 && connResult.rows[0].alpaca_account_id) {
      try {
        const dataPoints = await alpacaBroker.getPortfolioHistory(
          connResult.rows[0].alpaca_account_id as string,
          alpacaPeriod,
        );

        if (dataPoints.length > 0) {
          const firstValue = dataPoints[0]?.value ?? 0;
          const lastValue  = dataPoints[dataPoints.length - 1]?.value ?? 0;
          const totalReturn    = parseFloat((lastValue - firstValue).toFixed(2));
          const totalReturnPct = firstValue > 0
            ? parseFloat(((totalReturn / firstValue) * 100).toFixed(2))
            : 0;

          // Enrich with change_pct per data point
          const enriched = dataPoints.map((pt, i, arr) => {
            const prev       = i > 0 ? arr[i - 1].value : pt.value;
            const changePct  = prev > 0
              ? parseFloat((((pt.value - prev) / prev) * 100).toFixed(2))
              : 0;
            return { date: pt.date, value: pt.value, change_pct: changePct };
          });

          res.json({
            success: true,
            data: {
              period,
              data_points: enriched,
              summary: {
                start_value:      firstValue,
                end_value:        lastValue,
                total_return:     totalReturn,
                total_return_pct: totalReturnPct,
              },
              source: 'alpaca',
            },
          });
          return;
        }
      } catch {
        // Fall through to empty response
      }
    }

    // No Alpaca data — return empty
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
