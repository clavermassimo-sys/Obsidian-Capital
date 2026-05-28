import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { stripeService, SUBSCRIPTION_PRICES } from '../services/stripe';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

// Helper: ensure user has a Stripe customer record
async function ensureStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  // Check if customer already exists
  const result = await query(
    'SELECT stripe_customer_id FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length > 0 && result.rows[0].stripe_customer_id) {
    return result.rows[0].stripe_customer_id as string;
  }

  // Create new Stripe customer
  const customerId = await stripeService.createCustomer(email, name);

  // Persist to DB
  await query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customerId, userId]
  );

  // Upsert subscriptions row for this user
  await query(
    `INSERT INTO subscriptions (id, user_id, stripe_customer_id, tier, status)
     VALUES ($1, $2, $3, 'standard', 'active')
     ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id`,
    [uuidv4(), userId, customerId]
  );

  return customerId;
}

// ─── GET /subscriptions/status ────────────────────────────────────────────────
// Current subscription status for the authenticated user

router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await query(
      `SELECT u.tier, u.stripe_customer_id,
              s.stripe_subscription_id, s.status AS sub_status,
              s.current_period_start, s.current_period_end, s.trial_end
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const row = result.rows[0];

    // If they have a Stripe subscription ID, fetch live status
    let stripeSubscription = null;
    if (row.stripe_subscription_id) {
      try {
        stripeSubscription = await stripeService.getSubscription(row.stripe_subscription_id);
      } catch {
        // non-blocking — use cached data
      }
    }

    const tierInfo = SUBSCRIPTION_PRICES[row.tier as 'member' | 'private'] || null;

    res.json({
      success: true,
      data: {
        tier: row.tier,
        subscription: {
          status: stripeSubscription?.status || row.sub_status || 'active',
          subscription_id: row.stripe_subscription_id || null,
          current_period_start: stripeSubscription?.current_period_start
            ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
            : row.current_period_start,
          current_period_end: stripeSubscription?.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
            : row.current_period_end,
          trial_end: stripeSubscription?.trial_end
            ? new Date(stripeSubscription.trial_end * 1000).toISOString()
            : row.trial_end,
          cancel_at_period_end: stripeSubscription?.cancel_at_period_end ?? false,
        },
        plan: tierInfo
          ? {
              name: tierInfo.name,
              amount: tierInfo.amount,
              amount_display: `$${(tierInfo.amount / 100).toFixed(2)}/mo`,
              interval: tierInfo.interval,
            }
          : null,
        has_stripe_customer: !!row.stripe_customer_id,
      },
    });
  } catch (err) {
    console.error('[Subscriptions] Status error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch subscription status.' });
  }
});

// ─── POST /subscriptions/upgrade ─────────────────────────────────────────────
// Create a Stripe subscription to upgrade tier

router.post('/upgrade', async (req: Request, res: Response): Promise<void> => {
  const { tier } = req.body;

  if (!tier || !['member', 'private'].includes(tier)) {
    res.status(400).json({
      success: false,
      error: 'tier must be "member" or "private".',
    });
    return;
  }

  const userId = req.user!.userId;
  const userEmail = req.user!.email;

  try {
    // Fetch user name for Stripe customer creation
    const userResult = await query(
      'SELECT name, stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const { name, stripe_customer_id } = userResult.rows[0];

    // Ensure a Stripe customer exists
    const customerId = stripe_customer_id || (await ensureStripeCustomer(userId, userEmail, name));

    // Check if they already have an active subscription
    const subResult = await query(
      `SELECT stripe_subscription_id, tier FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (subResult.rows.length > 0 && subResult.rows[0].stripe_subscription_id) {
      const existingSub = await stripeService.getSubscription(
        subResult.rows[0].stripe_subscription_id
      );

      if (existingSub.status === 'active' && subResult.rows[0].tier === tier) {
        res.status(409).json({
          success: false,
          error: `You are already subscribed to the ${tier} tier.`,
          code: 'ALREADY_SUBSCRIBED',
        });
        return;
      }
    }

    // Create the Stripe subscription
    const subscription = await stripeService.createSubscription(customerId, tier as 'member' | 'private');

    // Upsert subscription record in DB
    await query(
      `INSERT INTO subscriptions (
         id, user_id, stripe_customer_id, stripe_subscription_id,
         tier, status, current_period_start, current_period_end
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         stripe_subscription_id = EXCLUDED.stripe_subscription_id,
         tier = EXCLUDED.tier,
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()`,
      [
        uuidv4(),
        userId,
        customerId,
        subscription.id,
        tier,
        subscription.status,
        subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      ]
    );

    // Update user's tier in users table (Stripe webhook will confirm, but update optimistically)
    await query(
      `UPDATE users SET tier = $1 WHERE id = $2`,
      [tier, userId]
    );

    // Extract the client_secret if the payment intent needs confirmation
    const latestInvoice = subscription.latest_invoice as {
      payment_intent?: { client_secret: string; status: string } | null;
    } | null;

    const clientSecret = latestInvoice?.payment_intent?.client_secret || null;
    const paymentStatus = latestInvoice?.payment_intent?.status || null;

    res.status(201).json({
      success: true,
      message: `Subscription to ${tier} tier created.`,
      data: {
        subscription_id: subscription.id,
        status: subscription.status,
        tier,
        client_secret: clientSecret,
        payment_status: paymentStatus,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error('[Subscriptions] Upgrade error:', e.message);

    if (e.message.includes('price ID for tier') && e.message.includes('not configured')) {
      res.status(503).json({
        success: false,
        error: 'Stripe pricing is not yet configured. Please contact support.',
        code: 'STRIPE_NOT_CONFIGURED',
      });
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to create subscription.' });
  }
});

// ─── POST /subscriptions/cancel ───────────────────────────────────────────────
// Cancel an active subscription (cancels at period end)

router.post('/cancel', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    const subResult = await query(
      `SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (subResult.rows.length === 0 || !subResult.rows[0].stripe_subscription_id) {
      res.status(404).json({
        success: false,
        error: 'No active subscription found.',
        code: 'NO_SUBSCRIPTION',
      });
      return;
    }

    const { stripe_subscription_id } = subResult.rows[0];

    const cancelled = await stripeService.cancelSubscription(stripe_subscription_id);

    // Update DB
    await query(
      `UPDATE subscriptions
       SET status = 'cancelled', updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period.',
      data: {
        subscription_id: stripe_subscription_id,
        cancel_at_period_end: cancelled.cancel_at_period_end,
        current_period_end: cancelled.current_period_end
          ? new Date(cancelled.current_period_end * 1000).toISOString()
          : null,
      },
    });
  } catch (err) {
    console.error('[Subscriptions] Cancel error:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription.' });
  }
});

// ─── GET /subscriptions/invoices ──────────────────────────────────────────────
// Billing history for the authenticated user

router.get('/invoices', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    const result = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      res.json({
        success: true,
        data: { invoices: [], count: 0 },
      });
      return;
    }

    const { stripe_customer_id } = result.rows[0];
    const invoices = await stripeService.getInvoices(stripe_customer_id);

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      currency: inv.currency,
      description: inv.description,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      period_start: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
      period_end: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
      created: new Date(inv.created * 1000).toISOString(),
    }));

    res.json({
      success: true,
      data: { invoices: formatted, count: formatted.length },
    });
  } catch (err) {
    console.error('[Subscriptions] Invoices error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices.' });
  }
});

// ─── POST /subscriptions/setup-intent ────────────────────────────────────────
// Create a Stripe SetupIntent for securely adding a payment card

router.post('/setup-intent', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const userEmail = req.user!.email;

  try {
    const userResult = await query(
      'SELECT name, stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const { name, stripe_customer_id } = userResult.rows[0];
    const customerId = stripe_customer_id || (await ensureStripeCustomer(userId, userEmail, name));

    const setupIntent = await stripeService.createSetupIntent(customerId);

    res.json({
      success: true,
      data: {
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id,
      },
    });
  } catch (err) {
    console.error('[Subscriptions] SetupIntent error:', err);
    res.status(500).json({ success: false, error: 'Failed to create setup intent.' });
  }
});

// ─── POST /subscriptions/payment-method ──────────────────────────────────────
// Attach and set a payment method as default

router.post('/payment-method', async (req: Request, res: Response): Promise<void> => {
  const { payment_method_id } = req.body;

  if (!payment_method_id || typeof payment_method_id !== 'string') {
    res.status(400).json({
      success: false,
      error: '"payment_method_id" is required.',
    });
    return;
  }

  const userId = req.user!.userId;

  try {
    const result = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      res.status(400).json({
        success: false,
        error: 'No Stripe customer found. Create a setup intent first.',
        code: 'NO_STRIPE_CUSTOMER',
      });
      return;
    }

    const { stripe_customer_id } = result.rows[0];
    await stripeService.setDefaultPaymentMethod(stripe_customer_id, payment_method_id);

    res.json({
      success: true,
      message: 'Payment method set as default.',
      data: { payment_method_id },
    });
  } catch (err) {
    console.error('[Subscriptions] Set payment method error:', err);
    res.status(500).json({ success: false, error: 'Failed to update payment method.' });
  }
});

// ─── GET /subscriptions/payment-methods ──────────────────────────────────────
// List all payment methods on file for the user

router.get('/payment-methods', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    const result = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      res.json({
        success: true,
        data: { payment_methods: [], count: 0 },
      });
      return;
    }

    const { stripe_customer_id } = result.rows[0];
    const methods = await stripeService.getPaymentMethods(stripe_customer_id);

    const formatted = methods.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            country: pm.card.country,
            funding: pm.card.funding,
          }
        : null,
      created: new Date(pm.created * 1000).toISOString(),
    }));

    res.json({
      success: true,
      data: { payment_methods: formatted, count: formatted.length },
    });
  } catch (err) {
    console.error('[Subscriptions] Payment methods error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payment methods.' });
  }
});

export default router;
