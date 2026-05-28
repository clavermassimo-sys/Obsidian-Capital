/* ============================================================
   Obsidian Capital — Terms & Conditions Page
   ============================================================ */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'January 15, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-medium text-off-white">{title}</h2>
      <div className="text-off-white/60 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-obsidian text-off-white">
      {/* Header */}
      <div className="border-b border-border" style={{ background: '#111' }}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-off-white/40 hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <h1 className="font-serif text-4xl font-medium text-off-white mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-off-white/40 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the Obsidian Capital platform ("Platform"), you agree to be bound
            by these Terms &amp; Conditions. If you do not agree to these terms, do not use the
            Platform.
          </p>
          <p>
            These terms constitute a legal agreement between you and Obsidian Capital LLC
            ("Obsidian Capital", "we", "us", or "our").
          </p>
        </Section>

        <Section title="2. Brokerage Services">
          <p>
            Securities trading is executed by Alpaca Securities LLC, member FINRA/SIPC. Obsidian
            Capital is not a registered broker-dealer. We provide a technology interface and
            investment advisory services only.
          </p>
          <p>
            By using the Platform, you agree to Alpaca Securities' Customer Agreement, which is
            incorporated herein by reference.
          </p>
        </Section>

        <Section title="3. Commission Structure">
          <p>
            Commission rates vary by membership tier. Current rates are published on our{' '}
            <Link to="/fees" className="text-gold hover:underline">
              Fee Schedule
            </Link>{' '}
            page. Obsidian Capital reserves the right to modify commission rates with 30 days' prior
            written notice.
          </p>
        </Section>

        <Section title="4. Risk Disclosure">
          <p>
            Trading securities involves substantial risk of loss. Past performance is not indicative
            of future results. You may lose some or all of your invested capital. The Platform does
            not guarantee any investment returns.
          </p>
          <p>
            You are solely responsible for all investment decisions made through the Platform.
            Obsidian Capital does not provide personalized investment advice.
          </p>
        </Section>

        <Section title="5. Account Eligibility">
          <p>
            You must be at least 18 years of age and a legal resident of the United States to open
            an account. Accounts are subject to KYC/AML verification before trading is enabled.
          </p>
        </Section>

        <Section title="6. Subscription Fees">
          <p>
            Membership subscriptions are billed monthly via Stripe. Subscriptions may be cancelled
            at any time; cancellation takes effect at the end of the current billing period.
            Refunds are not issued for partial months.
          </p>
        </Section>

        <Section title="7. Prohibited Activities">
          <p>You may not use the Platform for:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Market manipulation or wash trading</li>
            <li>Insider trading or trading on material non-public information</li>
            <li>Automated trading bots without prior written approval</li>
            <li>Any activity that violates applicable law or regulation</li>
          </ul>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Obsidian Capital shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use
            of the Platform.
          </p>
        </Section>

        <Section title="9. Governing Law">
          <p>
            These terms are governed by the laws of the State of Delaware, without regard to
            conflict of law principles. Any disputes shall be resolved through binding arbitration
            in accordance with the rules of the American Arbitration Association.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            For questions regarding these terms, contact us at{' '}
            <a href="mailto:legal@obsidiancapital.com" className="text-gold hover:underline">
              legal@obsidiancapital.com
            </a>
            .
          </p>
        </Section>

        <div className="border-t border-border pt-8 text-xs text-off-white/30 space-x-4">
          <Link to="/privacy" className="hover:text-off-white/50 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/fees" className="hover:text-off-white/50 transition-colors">
            Fee Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}
