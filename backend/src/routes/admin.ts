import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimit';
import { COMMISSION_CONFIG } from '../config/commission';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin, adminLimiter);

// ─── GET /admin/stats ─────────────────────────────────────────────────────────
// Platform-level statistics: user counts by tier, trade volume, commission revenue

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      userStatsResult,
      tradeStatsResult,
      recentActivityResult,
      kycStatsResult,
    ] = await Promise.all([
      // Users by tier and KYC status
      query(`
        SELECT
          tier,
          COUNT(*) AS count,
          COUNT(*) FILTER (WHERE kyc_status = 'approved') AS approved,
          COUNT(*) FILTER (WHERE kyc_status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE kyc_status = 'rejected') AS rejected,
          COALESCE(SUM(buying_power), 0) AS total_buying_power
        FROM users
        WHERE role = 'user'
        GROUP BY tier
        ORDER BY tier
      `),

      // Trade volume and commission revenue
      query(`
        SELECT
          COUNT(*) AS total_trades,
          COUNT(*) FILTER (WHERE type = 'buy') AS buy_orders,
          COUNT(*) FILTER (WHERE type = 'sell') AS sell_orders,
          COALESCE(SUM(total), 0) AS total_volume,
          COALESCE(SUM(commission), 0) AS total_commission_revenue,
          COALESCE(AVG(total), 0) AS avg_order_size,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS trades_last_24h,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS trades_last_7d,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS trades_last_30d
        FROM trades
        WHERE status = 'completed'
      `),

      // Recent signups (last 30 days daily)
      query(`
        SELECT
          DATE(created_at) AS date,
          COUNT(*) AS new_users
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),

      // KYC pipeline
      query(`
        SELECT
          kyc_status,
          COUNT(*) AS count
        FROM users
        WHERE role = 'user'
        GROUP BY kyc_status
      `),
    ]);

    // Build user stats map
    const tierMap: Record<string, {
      count: number;
      approved: number;
      pending: number;
      rejected: number;
      total_buying_power: number;
    }> = { standard: { count: 0, approved: 0, pending: 0, rejected: 0, total_buying_power: 0 },
            member: { count: 0, approved: 0, pending: 0, rejected: 0, total_buying_power: 0 },
            private: { count: 0, approved: 0, pending: 0, rejected: 0, total_buying_power: 0 } };

    let totalUsers = 0;
    for (const row of userStatsResult.rows) {
      tierMap[row.tier] = {
        count: parseInt(row.count),
        approved: parseInt(row.approved),
        pending: parseInt(row.pending),
        rejected: parseInt(row.rejected),
        total_buying_power: parseFloat(row.total_buying_power),
      };
      totalUsers += parseInt(row.count);
    }

    const tradeStats = tradeStatsResult.rows[0];
    const kycMap: Record<string, number> = {};
    for (const row of kycStatsResult.rows) {
      kycMap[row.kyc_status] = parseInt(row.count);
    }

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          by_tier: {
            standard: tierMap.standard,
            member: tierMap.member,
            private: tierMap.private,
          },
          kyc_pipeline: {
            pending: kycMap.pending || 0,
            approved: kycMap.approved || 0,
            rejected: kycMap.rejected || 0,
          },
        },
        trades: {
          total: parseInt(tradeStats.total_trades || '0'),
          buy_orders: parseInt(tradeStats.buy_orders || '0'),
          sell_orders: parseInt(tradeStats.sell_orders || '0'),
          total_volume: parseFloat(tradeStats.total_volume || '0'),
          total_commission_revenue: parseFloat(tradeStats.total_commission_revenue || '0'),
          avg_order_size: parseFloat(tradeStats.avg_order_size || '0'),
          last_24h: parseInt(tradeStats.trades_last_24h || '0'),
          last_7d: parseInt(tradeStats.trades_last_7d || '0'),
          last_30d: parseInt(tradeStats.trades_last_30d || '0'),
        },
        recent_signups: recentActivityResult.rows.map((r) => ({
          date: r.date,
          new_users: parseInt(r.new_users),
        })),
        commission_rates: {
          standard: COMMISSION_CONFIG.standard.display,
          member: COMMISSION_CONFIG.member.display,
          private: COMMISSION_CONFIG.private.display,
        },
        as_of: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch platform stats.' });
  }
});

// ─── GET /admin/users ─────────────────────────────────────────────────────────
// Paginated list of all users with filtering options

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const tier = req.query.tier as string | undefined;
    const kyc_status = req.query.kyc_status as string | undefined;
    const search = req.query.search as string | undefined;

    let whereClause = "WHERE role = 'user'";
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (tier && ['standard', 'member', 'private'].includes(tier)) {
      whereClause += ` AND tier = $${paramIndex++}`;
      params.push(tier);
    }

    if (kyc_status && ['pending', 'approved', 'rejected'].includes(kyc_status)) {
      whereClause += ` AND kyc_status = $${paramIndex++}`;
      params.push(kyc_status);
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const [usersResult, countResult] = await Promise.all([
      query(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.tier,
           u.kyc_status,
           u.buying_power,
           u.is_active,
           u.created_at,
           u.last_login,
           COUNT(DISTINCT h.id) AS holdings_count,
           COUNT(DISTINCT t.id) AS trades_count,
           COALESCE(SUM(DISTINCT CASE WHEN t.status = 'completed' THEN t.commission ELSE 0 END), 0) AS commission_generated
         FROM users u
         LEFT JOIN holdings h ON h.user_id = u.id
         LEFT JOIN trades t ON t.user_id = u.id
         ${whereClause}
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM users ${whereClause}`,
        params
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: usersResult.rows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          tier: u.tier,
          kyc_status: u.kyc_status,
          buying_power: parseFloat(u.buying_power || '0'),
          is_active: u.is_active,
          created_at: u.created_at,
          last_login: u.last_login,
          holdings_count: parseInt(u.holdings_count || '0'),
          trades_count: parseInt(u.trades_count || '0'),
          commission_generated: parseFloat(u.commission_generated || '0'),
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1,
        },
      },
    });
  } catch (err) {
    console.error('[Admin] Users list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
});

// ─── GET /admin/trades ────────────────────────────────────────────────────────
// All trades across the platform with filtering

router.get('/trades', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const ticker = req.query.ticker as string | undefined;
    const type = req.query.type as string | undefined;
    const tier = req.query.tier as string | undefined;

    let whereClause = "WHERE t.status = 'completed'";
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (ticker) {
      whereClause += ` AND t.ticker = $${paramIndex++}`;
      params.push(ticker.toUpperCase());
    }

    if (type && ['buy', 'sell'].includes(type)) {
      whereClause += ` AND t.type = $${paramIndex++}`;
      params.push(type);
    }

    if (tier && ['standard', 'member', 'private'].includes(tier)) {
      whereClause += ` AND u.tier = $${paramIndex++}`;
      params.push(tier);
    }

    const [tradesResult, countResult] = await Promise.all([
      query(
        `SELECT
           t.id,
           t.ticker,
           t.company_name,
           t.type,
           t.shares,
           t.price,
           t.commission,
           t.total,
           t.status,
           t.order_type,
           t.created_at,
           u.name AS user_name,
           u.email AS user_email,
           u.tier AS user_tier
         FROM trades t
         JOIN users u ON u.id = t.user_id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM trades t JOIN users u ON u.id = t.user_id ${whereClause}`,
        params
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        trades: tradesResult.rows.map((t) => ({
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
          total_pages: Math.ceil(total / limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1,
        },
      },
    });
  } catch (err) {
    console.error('[Admin] Trades list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch trades.' });
  }
});

// ─── GET /admin/revenue-projection ───────────────────────────────────────────
// Monthly revenue projection based on current user activity and commission tiers

router.get('/revenue-projection', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [monthlyRevenueResult, tierRevenueResult, projectionBaseResult] = await Promise.all([
      // Commission revenue by month (last 12 months)
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', t.created_at), 'YYYY-MM') AS month,
          COALESCE(SUM(t.commission), 0) AS commission_revenue,
          COUNT(*) AS trade_count,
          COALESCE(SUM(t.total), 0) AS total_volume
        FROM trades t
        WHERE t.status = 'completed'
          AND t.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', t.created_at)
        ORDER BY month ASC
      `),

      // Revenue breakdown by user tier
      query(`
        SELECT
          u.tier,
          COUNT(DISTINCT t.user_id) AS active_users,
          COALESCE(SUM(t.commission), 0) AS commission_revenue,
          COALESCE(AVG(t.commission), 0) AS avg_commission_per_trade,
          COUNT(t.id) AS trade_count
        FROM trades t
        JOIN users u ON u.id = t.user_id
        WHERE t.status = 'completed'
          AND t.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY u.tier
      `),

      // Base metrics for projection
      query(`
        SELECT
          COUNT(DISTINCT user_id) AS active_users_30d,
          COALESCE(AVG(commission), 0) AS avg_commission,
          COALESCE(AVG(total), 0) AS avg_trade_size,
          COUNT(*) AS trades_30d
        FROM trades
        WHERE status = 'completed'
          AND created_at >= NOW() - INTERVAL '30 days'
      `),
    ]);

    const base = projectionBaseResult.rows[0];
    const activeUsers = parseInt(base.active_users_30d || '0');
    const avgCommission = parseFloat(base.avg_commission || '0');
    const trades30d = parseInt(base.trades_30d || '0');

    // Project forward 6 months with 10% MoM growth assumption
    const projections = [];
    const growthRate = 1.10;
    let projectedUsers = activeUsers;
    let projectedTradesPerMonth = trades30d;

    for (let i = 1; i <= 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      projectedUsers = Math.floor(projectedUsers * growthRate);
      projectedTradesPerMonth = Math.floor(projectedTradesPerMonth * growthRate);
      const projectedRevenue = parseFloat(
        (projectedTradesPerMonth * avgCommission).toFixed(2)
      );

      projections.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        projected_users: projectedUsers,
        projected_trades: projectedTradesPerMonth,
        projected_revenue: projectedRevenue,
        growth_assumption: `${((growthRate - 1) * 100).toFixed(0)}% MoM`,
      });
    }

    // Build tier breakdown
    const tierBreakdown: Record<string, {
      active_users: number;
      commission_revenue: number;
      avg_commission_per_trade: number;
      trade_count: number;
      commission_display: string;
    }> = {};

    for (const row of tierRevenueResult.rows) {
      tierBreakdown[row.tier] = {
        active_users: parseInt(row.active_users || '0'),
        commission_revenue: parseFloat(row.commission_revenue || '0'),
        avg_commission_per_trade: parseFloat(row.avg_commission_per_trade || '0'),
        trade_count: parseInt(row.trade_count || '0'),
        commission_display: COMMISSION_CONFIG[row.tier as keyof typeof COMMISSION_CONFIG]?.display || 'N/A',
      };
    }

    res.json({
      success: true,
      data: {
        historical: monthlyRevenueResult.rows.map((r) => ({
          month: r.month,
          commission_revenue: parseFloat(r.commission_revenue || '0'),
          trade_count: parseInt(r.trade_count || '0'),
          total_volume: parseFloat(r.total_volume || '0'),
        })),
        current_period: {
          active_users: activeUsers,
          trades_last_30d: trades30d,
          avg_commission_per_trade: avgCommission,
          monthly_run_rate: parseFloat((trades30d * avgCommission).toFixed(2)),
        },
        tier_breakdown: tierBreakdown,
        projections,
        assumptions: {
          growth_rate: '10% month-over-month',
          commission_rates: {
            standard: COMMISSION_CONFIG.standard.display,
            member: COMMISSION_CONFIG.member.display,
            private: COMMISSION_CONFIG.private.display,
          },
        },
        as_of: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin] Revenue projection error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate revenue projection.' });
  }
});

export default router;
