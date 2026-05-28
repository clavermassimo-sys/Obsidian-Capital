/* ============================================================
   Obsidian Capital — Terms of Service Page
   Full ToS with all required sections
   ============================================================ */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const LAST_UPDATED = 'January 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 scroll-mt-8" id={title.toLowerCase().replace(/\s+/g, '-')}>
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
          <div className="flex items-center gap-3 mb-3">
            <Shield size={20} className="text-gold/60" />
            <p className="text-xs font-bold tracking-[0.3em] text-gold/60 uppercase font-sans">
              LEGAL
            </p>
          </div>
          <h1 className="font-serif text-4xl font-medium text-off-white mb-2">
            Terms of Service
          </h1>
          <p className="text-off-white/40 text-sm font-sans">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-3xl mx-auto px-6 pt-10">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-off-white/40 uppercase font-sans mb-3">
            Table of Contents
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              '1. Acceptance of Terms',
              '2. Service Description',
              '3. Commission Fees',
              '4. Risk Disclosure',
              '5. Interactive Brokers',
              '6. SIPC Protection',
              '7. Account Eligibility',
              '8. Prohibited Activities',
              '9. Limitation of Liability',
              '10. Governing Law',
            ].map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-xs text-off-white/40 hover:text-gold transition-colors font-sans"
                >
                  {item}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the Obsidian Capital platform ("Platform"), you agree to be bound
            by these Terms of Service ("Terms"). If you do not agree to these Terms, do not access
            or use the Platform.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you ("User," "you," or
            "your") and Obsidian Capital LLC ("Obsidian Capital," "we," "us," or "our"), a company
            organized under the laws of the District of Columbia.
          </p>
          <p>
            We reserve the right to modify these Terms at any time. We will provide 30 days' notice
            of material changes via email or prominent notice on the Platform. Your continued use of
            the Platform after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="2. Service Description">
          <p>
            Obsidian Capital is a trading interface and investment technology platform that connects
            to Interactive Brokers LLC for order execution. We provide users with access to market
            data, portfolio analytics, a trading dashboard, and related financial tools. Obsidian
            Capital operates as an introducing broker through Interactive Brokers LLC.
          </p>
          <p>
            <strong className="text-off-white/80">Obsidian Capital is not a registered broker-dealer.</strong>{' '}
            We do not hold client funds or custody securities. All brokerage services — including
            order routing, execution, and custody — are provided exclusively by Interactive Brokers
            LLC, a registered broker-dealer and member of FINRA/SIPC.
          </p>
          <p>
            Obsidian Capital charges platform fees ("commissions") for access to our technology
            services and the facilitation of trades through our interface.
          </p>
        </Section>

        <Section title="3. Commission Fees">
          <p>
            Obsidian Capital charges a commission on each trade executed through the Platform.
            Commission rates vary by membership tier:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-0 mt-2">
              <thead>
                <tr>
                  {['Tier', 'Monthly Fee', 'Commission Rate'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-off-white/40 uppercase tracking-wider border-b border-border/50 font-sans">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: 'Standard', fee: '$0', rate: '10–12% per trade' },
                  { tier: 'Member',   fee: '$29.99/month', rate: '7–9% per trade' },
                  { tier: 'Private',  fee: '$199.99/month', rate: '5–6% per trade' },
                ].map((row, i) => (
                  <tr key={row.tier} className={i % 2 === 0 ? 'bg-surface-2/20' : ''}>
                    <td className="py-2 px-3 text-off-white/70 border-b border-border/30 font-sans">{row.tier}</td>
                    <td className="py-2 px-3 text-off-white/70 border-b border-border/30 font-mono">{row.fee}</td>
                    <td className="py-2 px-3 text-gold border-b border-border/30 font-mono">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            Commissions are calculated on the gross trade value (shares × execution price) and are
            charged at the time of order execution. For buy orders, the commission is added to the
            total cost. For sell orders, the commission is deducted from net proceeds.
          </p>
          <p>
            Commission rates and subscription fees are subject to change with 30 days' prior written
            notice. Current rates are published on our{' '}
            <Link to="/fees" className="text-gold hover:underline">
              Fee Schedule
            </Link>{' '}
            page.
          </p>
        </Section>

        <Section title="4. Risk Disclosure">
          <p>
            <strong className="text-off-white/80">Trading involves substantial risk of loss.</strong>{' '}
            Investing in securities, including stocks, options, and other financial instruments, may
            result in the loss of some or all of your invested capital. Past performance of any
            security, strategy, or financial product is not indicative of future results.
          </p>
          <p>
            You are solely responsible for all investment decisions made through the Platform.
            Obsidian Capital does not provide personalized investment advice, tax advice, or legal
            advice. Nothing on the Platform constitutes a recommendation to buy, sell, or hold any
            particular security.
          </p>
          <p>
            Before investing, you should carefully consider your investment objectives, risk
            tolerance, and financial situation. You may wish to consult a registered investment
            advisor before making investment decisions.
          </p>
          <p>
            Margin trading amplifies both gains and losses and involves additional risks, including
            the risk of a margin call requiring immediate deposit of additional funds.
          </p>
        </Section>

        <Section title="5. Interactive Brokers">
          <p>
            All brokerage services provided through the Platform are executed by{' '}
            <strong className="text-off-white/80">Interactive Brokers LLC</strong>, a registered
            broker-dealer, member FINRA/SIPC. Interactive Brokers LLC is not affiliated with Obsidian
            Capital.
          </p>
          <p>
            By opening an account through Obsidian Capital, you agree to Interactive Brokers' Customer
            Agreement, which governs the brokerage relationship between you and Interactive Brokers LLC.
            Obsidian Capital is not a party to the Interactive Brokers Customer Agreement.
          </p>
          <p>
            Interactive Brokers LLC is responsible for order execution, account custody, margin
            calculations, and regulatory compliance related to brokerage activities. Any disputes
            regarding order execution or custody should be directed to Interactive Brokers LLC.
          </p>
        </Section>

        <Section title="6. SIPC Protection">
          <p>
            Securities held in accounts through Interactive Brokers LLC are protected by the{' '}
            <strong className="text-off-white/80">
              Securities Investor Protection Corporation (SIPC)
            </strong>{' '}
            up to <strong className="text-off-white/80">$500,000 per customer</strong>, including up
            to $250,000 in cash. SIPC protection applies in the event of a broker-dealer failure and
            does not protect against market losses or investment risk.
          </p>
          <p>
            SIPC protection is provided through Interactive Brokers' membership in SIPC. Obsidian
            Capital is not a member of SIPC. For more information about SIPC protection, visit{' '}
            <a
              href="https://www.sipc.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              sipc.org
            </a>
            .
          </p>
        </Section>

        <Section title="7. Account Eligibility">
          <p>To open an account on the Platform, you must:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Be at least <strong className="text-off-white/80">18 years of age</strong></li>
            <li>Be a legal resident of the <strong className="text-off-white/80">United States</strong></li>
            <li>Have a valid Social Security Number (SSN) or Individual Taxpayer Identification Number (ITIN)</li>
            <li>Successfully complete Know Your Customer (KYC) and Anti-Money Laundering (AML) verification</li>
            <li>Not be subject to any sanctions or on any restricted party lists</li>
          </ul>
          <p>
            We reserve the right to decline, suspend, or terminate any account at our sole
            discretion. Accounts are for individual use only; corporate and entity accounts require
            separate approval.
          </p>
        </Section>

        <Section title="8. Prohibited Activities">
          <p>You may not use the Platform for any of the following activities:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Market manipulation, wash trading, or spoofing</li>
            <li>Insider trading or trading on material non-public information (MNPI)</li>
            <li>Front-running or any other form of trading misconduct</li>
            <li>Unauthorized automated trading or algorithmic strategies without prior written approval</li>
            <li>Money laundering or financing of illegal activities</li>
            <li>Circumventing or attempting to circumvent any security measures</li>
            <li>Sharing account credentials with third parties</li>
            <li>Any activity that violates applicable law, regulation, or FINRA rules</li>
          </ul>
          <p>
            Violations may result in immediate account termination, reporting to regulatory
            authorities, and civil or criminal liability.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Obsidian Capital, its officers,
            directors, employees, and agents shall not be liable for any indirect, incidental,
            special, consequential, punitive, or exemplary damages arising from or related to your
            use of the Platform, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Trading losses or missed investment opportunities</li>
            <li>Platform downtime or technical failures</li>
            <li>Errors in market data or analytics</li>
            <li>Unauthorized access to your account</li>
            <li>Actions or omissions of third-party service providers, including Interactive Brokers LLC</li>
          </ul>
          <p>
            Our total cumulative liability for any claims shall not exceed the greater of (a) the
            total fees paid by you to Obsidian Capital in the 12 months preceding the claim, or (b)
            $100.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with the laws of{' '}
            <strong className="text-off-white/80">Washington, D.C.</strong>, without regard to
            its conflict of law principles.
          </p>
          <p>
            Any dispute, controversy, or claim arising out of or relating to these Terms or the
            Platform shall be resolved through binding arbitration administered by the American
            Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules. The
            arbitration shall take place in Washington, D.C. Judgment on the award may be entered in
            any court of competent jurisdiction.
          </p>
          <p>
            You waive any right to participate in a class action lawsuit or class-wide arbitration
            related to your use of the Platform.
          </p>
          <p>
            For questions regarding these Terms, contact us at{' '}
            <a href="mailto:legal@obsidian.capital" className="text-gold hover:underline">
              legal@obsidian.capital
            </a>
            .
          </p>
        </Section>

        {/* Footer links */}
        <div className="border-t border-border pt-8 flex flex-wrap gap-4 text-xs text-off-white/30">
          <span>© 2026 Obsidian Capital LLC. All rights reserved.</span>
          <Link to="/privacy" className="hover:text-off-white/50 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/fees" className="hover:text-off-white/50 transition-colors">
            Fee Schedule
          </Link>
          <Link to="/" className="hover:text-off-white/50 transition-colors">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
