import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('[Identity] STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion });
  }
  return _stripe;
}

export const identityService = {
  // ─── createVerificationSession ────────────────────────────────────────────
  // Creates a Stripe Identity verification session for a user.
  // Returns id, clientSecret (for frontend SDK), and url (for redirect flow).

  async createVerificationSession(
    userId: string,
    email: string
  ): Promise<{ id: string; clientSecret: string; url: string }> {
    try {
      const session = await getStripe().identity.verificationSessions.create({
        type: 'document',
        options: {
          document: {
            allowed_types: ['driving_license', 'passport', 'id_card'],
            require_id_number: true,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        metadata: {
          userId,
          email,
          platform: 'obsidian-capital',
        },
      });

      return {
        id: session.id,
        clientSecret: session.client_secret ?? '',
        url: session.url ?? '',
      };
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Identity] createVerificationSession failed: ${e.message}`);
    }
  },

  // ─── getVerificationSession ───────────────────────────────────────────────
  // Fetches the current status of a verification session.

  async getVerificationSession(sessionId: string): Promise<{
    id: string;
    status: 'requires_input' | 'processing' | 'verified' | 'canceled';
    lastError?: string;
  }> {
    try {
      const session = await getStripe().identity.verificationSessions.retrieve(sessionId);

      return {
        id: session.id,
        status: session.status as 'requires_input' | 'processing' | 'verified' | 'canceled',
        lastError: session.last_error?.reason ?? undefined,
      };
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Identity] getVerificationSession(${sessionId}) failed: ${e.message}`);
    }
  },

  // ─── isVerified ───────────────────────────────────────────────────────────
  // Returns true if the given verification session has status 'verified'.

  async isVerified(sessionId: string): Promise<boolean> {
    try {
      const session = await getStripe().identity.verificationSessions.retrieve(sessionId);
      return session.status === 'verified';
    } catch (err) {
      const e = err as Stripe.StripeRawError;
      throw new Error(`[Identity] isVerified(${sessionId}) failed: ${e.message}`);
    }
  },
};
