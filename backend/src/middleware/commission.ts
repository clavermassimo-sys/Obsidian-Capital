import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { COMMISSION_CONFIG, calculateCommission } from '../config/commission';
import { stripeService } from '../services/stripe';

// Augment Express Request to carry trade result set by the route handler
declare global {
  namespace Express {
    interface Request {
      tradeResult?: {
        tradeId: string;
        userId: string;
        ticker: string;
        subtotal: number;
        tier: 'standard' | 'member' | 'private';
        stripeCustomerId?: string | null;
      };
    }
  }
}

export interface CommissionBreakdown {
  rate: number;
  rateDisplay: string;
  amount: number;
  subtotal: number;
  total: number;
  tier: 'standard' | 'member' | 'private';
  savings: {
    vs_standard: number;
    upgrade_to_member: number;
    upgrade_to_private: number;
  };
}

/**
 * Pure calculation helper — no side effects.
 * Returns full commission breakdown including tier savings.
 */
export function getCommissionBreakdown(
  subtotal: number,
  tier: 'standard' | 'member' | 'private'
): CommissionBreakdown {
  const config = COMMISSION_CONFIG[tier];
  const rate = config.mid;
  const amount = Math.round(subtotal * rate * 100) / 100;

  const savings = {
    vs_standard:
      tier !== 'standard'
        ? Math.round(subtotal * (COMMISSION_CONFIG.standard.mid - rate) * 100) / 100
        : 0,
    upgrade_to_member:
      tier === 'standard'
        ? Math.round(
            subtotal * (COMMISSION_CONFIG.standard.mid - COMMISSION_CONFIG.member.mid) * 100
          ) / 100
        : 0,
    upgrade_to_private:
      tier !== 'private'
        ? Math.round(
            subtotal * (COMMISSION_CONFIG[tier].mid - COMMISSION_CONFIG.private.mid) * 100
          ) / 100
        : 0,
  };

  return {
    rate,
    rateDisplay: config.display,
    amount,
    subtotal,
    total: subtotal + amount,
    savings,
    tier,
  };
}

/**
 * recordCommission middleware
 *
 * Expects req.tradeResult to be populated by the preceding route handler:
 * {
 *   tradeId: string       — UUID of the trade row just inserted
 *   userId: string        — UUID of the authenticated user
 *   ticker: string        — e.g. "AAPL"
 *   subtotal: number      — trade value in USD (shares × price)
 *   tier: string          — user's commission tier
 *   stripeCustomerId?: string | null
 * }
 *
 * The middleware:
 * 1. Calculates the commission amount
 * 2. Inserts a row into the `commissions` table with status 'pending'
 * 3. If the user has a Stripe customer ID with a payment method on file,
 *    charges via Stripe and updates the commission row accordingly
 * 4. Calls next() so the route can send its response
 */
export async function recordCommission(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const tradeResult = req.tradeResult;

  if (!tradeResult) {
    // Nothing to do — route handler didn't populate tradeResult
    next();
    return;
  }

  const { tradeId, userId, ticker, subtotal, tier, stripeCustomerId } = tradeResult;

  const breakdown = getCommissionBreakdown(subtotal, tier);
  const commissionAmountCents = Math.round(breakdown.amount * 100); // convert to cents for Stripe

  try {
    // 1. Insert commission record
    const insertResult = await query(
      `INSERT INTO commissions (
        trade_id, user_id, tier, trade_value, commission_rate, commission_amount, payment_status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [tradeId, userId, tier, subtotal, breakdown.rate, breakdown.amount]
    );

    const commissionId: string = insertResult.rows[0]?.id;

    // 2. Attempt Stripe charge if the customer has payment info
    if (stripeCustomerId && commissionAmountCents > 0) {
      try {
        const paymentMethods = await stripeService.getPaymentMethods(stripeCustomerId);
        const hasPaymentMethod = paymentMethods.length > 0;

        if (hasPaymentMethod) {
          const paymentIntent = await stripeService.chargeCommission({
            customerId: stripeCustomerId,
            amount: commissionAmountCents,
            description: `Obsidian Capital commission — ${ticker} trade`,
            metadata: {
              tradeId,
              ticker,
              tier,
              userId,
            },
          });

          // Update commission row with Stripe details
          await query(
            `UPDATE commissions
             SET stripe_payment_intent_id = $1,
                 stripe_charge_id = $2,
                 payment_status = 'charged'
             WHERE id = $3`,
            [
              paymentIntent.id,
              (paymentIntent.latest_charge as string) || null,
              commissionId,
            ]
          );
        }
      } catch (stripeErr) {
        // Stripe charge failure must NOT block the trade response.
        // Mark commission as failed so it can be retried.
        console.error('[Commission] Stripe charge failed for trade', tradeId, stripeErr);

        if (commissionId) {
          await query(
            `UPDATE commissions SET payment_status = 'failed' WHERE id = $1`,
            [commissionId]
          ).catch((dbErr) => {
            console.error('[Commission] Failed to update commission status:', dbErr);
          });
        }
      }
    }
  } catch (err) {
    // Commission recording failure should be logged but must not block the response
    console.error('[Commission] Failed to record commission for trade', tradeId, err);
  }

  next();
}
