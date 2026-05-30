import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('[Stripe] STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion });
  }
  return _stripe;
}

export const SUBSCRIPTION_PRICES = {
  member: {
    priceId: process.env.STRIPE_MEMBER_PRICE_ID || '',
    amount: 2999,
    name: 'Obsidian Member',
    interval: 'month',
  },
  private: {
    priceId: process.env.STRIPE_PRIVATE_PRICE_ID || '',
    amount: 19999,
    name: 'Obsidian Private',
    interval: 'month',
  },
} as const;

export const stripeService = {
  // ─── Customers ─────────────────────────────────────────────────────────────

  async createCustomer(email: string, name: string): Promise<string> {
    try {
      const customer = await getStripe().customers.create({
        email,
        name,
        metadata: { platform: 'obsidian-capital' },
      });
      return customer.id;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] createCustomer failed: ${e.message}`);
    }
  },

  // ─── Commission Charging ───────────────────────────────────────────────────

  async chargeCommission(params: {
    customerId: string;
    amount: number; // in cents
    description: string;
    metadata: { tradeId: string; ticker: string; tier: string; userId: string };
  }): Promise<Stripe.PaymentIntent> {
    try {
      // Retrieve customer to get their default payment method
      const customer = await getStripe().customers.retrieve(params.customerId) as Stripe.Customer;
      const defaultPm = customer.invoice_settings?.default_payment_method as string | null;

      if (!defaultPm) {
        throw new Error('No default payment method on file for customer');
      }

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: params.amount,
        currency: 'usd',
        customer: params.customerId,
        payment_method: defaultPm,
        confirm: true,
        description: params.description,
        metadata: params.metadata,
        off_session: true, // charge without user interaction
      });

      return paymentIntent;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] chargeCommission failed: ${e.message}`);
    }
  },

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  async createSubscription(
    customerId: string,
    tier: 'member' | 'private'
  ): Promise<Stripe.Subscription> {
    try {
      const priceConfig = SUBSCRIPTION_PRICES[tier];

      if (!priceConfig.priceId) {
        throw new Error(`Stripe price ID for tier '${tier}' is not configured`);
      }

      const subscription = await getStripe().subscriptions.create({
        customer: customerId,
        items: [{ price: priceConfig.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: { tier, platform: 'obsidian-capital' },
      });

      return subscription;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] createSubscription(${tier}) failed: ${e.message}`);
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      // Cancel at period end to give the user through their billing cycle
      const subscription = await getStripe().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] cancelSubscription(${subscriptionId}) failed: ${e.message}`);
    }
  },

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] getSubscription(${subscriptionId}) failed: ${e.message}`);
    }
  },

  // ─── Payment Methods ───────────────────────────────────────────────────────

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await getStripe().setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });
      return setupIntent;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] createSetupIntent failed: ${e.message}`);
    }
  },

  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const methods = await getStripe().paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return methods.data;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] getPaymentMethods failed: ${e.message}`);
    }
  },

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await getStripe().customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] setDefaultPaymentMethod failed: ${e.message}`);
    }
  },

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async getInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await getStripe().invoices.list({
        customer: customerId,
        limit: 24,
      });
      return invoices.data;
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] getInvoices failed: ${e.message}`);
    }
  },

  // ─── Webhook Verification ──────────────────────────────────────────────────

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    try {
      return getStripe().webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Stripe] Webhook signature verification failed: ${e.message}`);
    }
  },
};

export default { getInstance: getStripe };
