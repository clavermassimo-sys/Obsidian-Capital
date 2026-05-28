import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripeService } from '../services/stripe';
import { query } from '../config/database';

const router = Router();

// ─── POST /webhooks/stripe ────────────────────────────────────────────────────
// Stripe sends events here; the raw body + Stripe-Signature header are verified
// before processing. This route must use express.raw() (mounted in index.ts).

router.post('/stripe', async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header.' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripeService.constructWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    const e = err as Error;
    console.error('[Webhook] Signature verification failed:', e.message);
    res.status(400).json({ error: `Webhook Error: ${e.message}` });
    return;
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {

      // ── Subscription created ────────────────────────────────────────────────
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const tier = resolveTierFromSubscription(sub);
        const customerId = sub.customer as string;

        await handleSubscriptionUpsert(customerId, sub, tier);
        console.log(`[Webhook] Subscription created — customer: ${customerId}, tier: ${tier}`);
        break;
      }

      // ── Subscription updated ────────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const tier = resolveTierFromSubscription(sub);
        const customerId = sub.customer as string;

        await handleSubscriptionUpsert(customerId, sub, tier);
        console.log(`[Webhook] Subscription updated — customer: ${customerId}, tier: ${tier}, status: ${sub.status}`);
        break;
      }

      // ── Subscription deleted (cancelled) ────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Downgrade user to standard tier
        await query(
          `UPDATE users SET tier = 'standard'
           WHERE stripe_customer_id = $1`,
          [customerId]
        );

        await query(
          `UPDATE subscriptions
           SET tier = 'standard', status = 'cancelled', updated_at = NOW()
           WHERE stripe_customer_id = $1`,
          [customerId]
        );

        console.log(`[Webhook] Subscription deleted — customer: ${customerId}, downgraded to standard`);
        break;
      }

      // ── Payment intent succeeded ────────────────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;

        // Mark commission as paid if this was a commission charge
        if (pi.metadata?.tradeId) {
          await query(
            `UPDATE commissions
             SET payment_status = 'charged',
                 stripe_payment_intent_id = $1,
                 stripe_charge_id = $2
             WHERE trade_id = $3`,
            [pi.id, (pi.latest_charge as string) || null, pi.metadata.tradeId]
          );
          console.log(`[Webhook] Commission paid for trade: ${pi.metadata.tradeId}`);
        }
        break;
      }

      // ── Payment intent failed ───────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;

        if (pi.metadata?.tradeId) {
          await query(
            `UPDATE commissions
             SET payment_status = 'failed',
                 stripe_payment_intent_id = $1
             WHERE trade_id = $2`,
            [pi.id, pi.metadata.tradeId]
          );
          console.warn(
            `[Webhook] Commission payment failed for trade: ${pi.metadata.tradeId} | reason: ${pi.last_payment_error?.message}`
          );

          // TODO: Send notification to user via SendGrid/Twilio
          // await notifyPaymentFailure(pi.metadata.userId, pi.metadata.ticker, pi.amount);
        }
        break;
      }

      // ── Invoice payment succeeded ───────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Ensure subscription status is active in DB
        if (invoice.subscription) {
          await query(
            `UPDATE subscriptions
             SET status = 'active', updated_at = NOW()
             WHERE stripe_customer_id = $1 AND stripe_subscription_id = $2`,
            [customerId, invoice.subscription as string]
          );
        }

        console.log(`[Webhook] Invoice paid — customer: ${customerId}, amount: ${invoice.amount_paid}`);
        // TODO: Send confirmation email via SendGrid
        break;
      }

      // ── Invoice payment failed ──────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (invoice.subscription) {
          await query(
            `UPDATE subscriptions
             SET status = 'past_due', updated_at = NOW()
             WHERE stripe_customer_id = $1 AND stripe_subscription_id = $2`,
            [customerId, invoice.subscription as string]
          );
        }

        console.warn(`[Webhook] Invoice payment failed — customer: ${customerId}`);
        // TODO: Send dunning email via SendGrid
        break;
      }

      // ── SetupIntent succeeded (payment method saved) ────────────────────────
      case 'setup_intent.succeeded': {
        const si = event.data.object as Stripe.SetupIntent;
        console.log(`[Webhook] SetupIntent succeeded — customer: ${si.customer}, pm: ${si.payment_method}`);

        // Optionally set as default payment method if customer has none
        if (si.customer && si.payment_method) {
          try {
            await stripeService.setDefaultPaymentMethod(
              si.customer as string,
              si.payment_method as string
            );
          } catch {
            // Non-critical; ignore
          }
        }
        break;
      }

      default:
        // Log but do not error on unhandled event types
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Always acknowledge receipt
    res.json({ received: true, event_type: event.type, event_id: event.id });
  } catch (err) {
    console.error(`[Webhook] Handler error for ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying (the error is on our side)
    res.status(200).json({ received: true, warning: 'Handler error logged' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine the Obsidian tier from a Stripe subscription's price IDs.
 * Falls back to the metadata tier, then to 'standard'.
 */
function resolveTierFromSubscription(sub: Stripe.Subscription): 'standard' | 'member' | 'private' {
  // Check subscription-level metadata first
  if (sub.metadata?.tier) {
    const t = sub.metadata.tier as string;
    if (t === 'member' || t === 'private') return t;
  }

  // Fall back to comparing price IDs from env
  const memberPriceId = process.env.STRIPE_MEMBER_PRICE_ID || '';
  const privatePriceId = process.env.STRIPE_PRIVATE_PRICE_ID || '';

  for (const item of sub.items.data) {
    const priceId = item.price.id;
    if (priceId === privatePriceId) return 'private';
    if (priceId === memberPriceId) return 'member';
  }

  return 'standard';
}

/**
 * Upsert subscription record and update user tier in DB.
 */
async function handleSubscriptionUpsert(
  customerId: string,
  sub: Stripe.Subscription,
  tier: 'standard' | 'member' | 'private'
): Promise<void> {
  // Map Stripe status to our enum
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'cancelled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'active', // treat incomplete as active pending payment
    incomplete_expired: 'cancelled',
    unpaid: 'past_due',
    paused: 'past_due',
  };
  const dbStatus = statusMap[sub.status] || 'active';

  // Update subscriptions table
  await query(
    `UPDATE subscriptions
     SET stripe_subscription_id = $1,
         tier = $2,
         status = $3,
         current_period_start = $4,
         current_period_end = $5,
         trial_end = $6,
         updated_at = NOW()
     WHERE stripe_customer_id = $7`,
    [
      sub.id,
      tier,
      dbStatus,
      sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
      sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      customerId,
    ]
  );

  // Update user's tier
  if (dbStatus === 'active' || dbStatus === 'trialing') {
    await query(
      `UPDATE users SET tier = $1 WHERE stripe_customer_id = $2`,
      [tier, customerId]
    );
  } else if (dbStatus === 'cancelled') {
    await query(
      `UPDATE users SET tier = 'standard' WHERE stripe_customer_id = $1`,
      [customerId]
    );
  }
}

export default router;
