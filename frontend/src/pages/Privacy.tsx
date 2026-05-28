/* ============================================================
   Obsidian Capital — Privacy Policy Page
   Full privacy policy with GDPR/CCPA rights, data sharing disclosures
   ============================================================ */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

const LAST_UPDATED = 'January 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-medium text-off-white">{title}</h2>
      <div className="text-off-white/60 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Privacy() {
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
            <Lock size={20} className="text-gold/60" />
            <p className="text-xs font-bold tracking-[0.3em] text-gold/60 uppercase font-sans">
              LEGAL
            </p>
          </div>
          <h1 className="font-serif text-4xl font-medium text-off-white mb-2">Privacy Policy</h1>
          <p className="text-off-white/40 text-sm font-sans">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        <Section title="1. Information We Collect">
          <p>We collect the following categories of information when you use the Platform:</p>
          <div className="space-y-4">
            <div>
              <p className="text-off-white/80 font-medium mb-1">Identity Information</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Full legal name and date of birth</li>
                <li>Government-issued ID (for KYC verification)</li>
                <li>Social Security Number (SSN) or ITIN (for tax reporting)</li>
              </ul>
            </div>
            <div>
              <p className="text-off-white/80 font-medium mb-1">Contact Information</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Email address and phone number</li>
                <li>Mailing address</li>
              </ul>
            </div>
            <div>
              <p className="text-off-white/80 font-medium mb-1">Financial Information</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Bank account details (for ACH transfers)</li>
                <li>Payment card information (processed by Stripe)</li>
                <li>Trading activity, transaction history, and portfolio data</li>
                <li>Employment and income information (for suitability assessment)</li>
              </ul>
            </div>
            <div>
              <p className="text-off-white/80 font-medium mb-1">Technical Information</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>IP address, device type, and browser information</li>
                <li>Log data and usage patterns on the Platform</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Verify your identity and comply with KYC/AML regulatory requirements</li>
            <li>Open and maintain your brokerage account with Alpaca Securities</li>
            <li>Process transactions, deposits, and withdrawals</li>
            <li>Calculate and collect platform commissions and subscription fees</li>
            <li>Generate tax documents (1099-B, 1099-DIV) as required by the IRS</li>
            <li>Communicate with you about your account, trades, and Platform updates</li>
            <li>Detect, investigate, and prevent fraud, money laundering, and unauthorized access</li>
            <li>Improve the Platform experience through analytics and user research</li>
            <li>Comply with applicable laws, regulations, and regulatory requests</li>
          </ul>
        </Section>

        <Section title="3. Data Sharing">
          <p>
            We share your personal information only as necessary to provide our services or as
            required by law. We do not sell your personal information to third parties for marketing
            purposes.
          </p>
          <div className="space-y-3">
            <div className="bg-surface-2 border border-border rounded-lg p-4">
              <p className="text-off-white/80 font-medium mb-1 text-sm">Alpaca Securities LLC</p>
              <p className="text-xs">
                We share identity, financial, and trading information with Alpaca Securities to open
                and maintain your brokerage account and execute trades. Alpaca Securities is governed
                by its own privacy policy and FINRA regulations.
              </p>
            </div>
            <div className="bg-surface-2 border border-border rounded-lg p-4">
              <p className="text-off-white/80 font-medium mb-1 text-sm">Stripe, Inc.</p>
              <p className="text-xs">
                We use Stripe to process subscription payments. Payment card data is handled directly
                by Stripe and is subject to Stripe's privacy policy and PCI-DSS compliance
                requirements. We do not store full card numbers on our servers.
              </p>
            </div>
            <div className="bg-surface-2 border border-border rounded-lg p-4">
              <p className="text-off-white/80 font-medium mb-1 text-sm">Amazon Web Services (AWS)</p>
              <p className="text-xs">
                Our Platform infrastructure is hosted on AWS. Data stored on AWS is subject to our
                data security controls and AWS's data processing agreement. Data remains within
                US-East regions.
              </p>
            </div>
            <div className="bg-surface-2 border border-border rounded-lg p-4">
              <p className="text-off-white/80 font-medium mb-1 text-sm">Regulatory Authorities</p>
              <p className="text-xs">
                We may share information with the SEC, FINRA, IRS, FinCEN, and applicable state
                regulators as required by law, regulatory examination, subpoena, or court order.
              </p>
            </div>
          </div>
        </Section>

        <Section title="4. Data Security">
          <p>
            We implement industry-standard technical and organizational security measures to protect
            your personal information:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>All data in transit is encrypted using TLS 1.2 or higher</li>
            <li>Data at rest is encrypted using AES-256</li>
            <li>Access to personal data is restricted to authorized personnel on a need-to-know basis</li>
            <li>Multi-factor authentication (MFA) is required for all administrative access</li>
            <li>Regular security audits and penetration testing are conducted by third parties</li>
            <li>Incident response procedures are tested annually</li>
          </ul>
          <p>
            Despite these measures, no method of transmission over the internet or electronic storage
            is 100% secure. We cannot guarantee absolute security of your information. In the event
            of a data breach affecting your rights, we will notify you as required by applicable law.
          </p>
        </Section>

        <Section title="5. Your Rights (GDPR / CCPA)">
          <p>
            Depending on your jurisdiction, you may have the following rights regarding your personal
            information:
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-off-white/75 font-medium text-sm">All Users</p>
              <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
                <li>Right to access the personal information we hold about you</li>
                <li>Right to request correction of inaccurate or incomplete information</li>
                <li>Right to opt out of marketing communications at any time</li>
              </ul>
            </div>
            <div>
              <p className="text-off-white/75 font-medium text-sm">
                California Residents (CCPA / CPRA)
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
                <li>Right to know what personal information is collected and how it is used</li>
                <li>Right to delete personal information (subject to legal retention requirements)</li>
                <li>Right to opt out of the sale or sharing of personal information</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </div>
            <div>
              <p className="text-off-white/75 font-medium text-sm">EU/EEA Residents (GDPR)</p>
              <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
                <li>Right to data portability</li>
                <li>Right to erasure ("right to be forgotten"), subject to legal obligations</li>
                <li>Right to restrict processing</li>
                <li>Right to object to automated decision-making</li>
              </ul>
            </div>
          </div>
          <p>
            Note: Financial regulations (including FINRA, SEC, and IRS rules) may require us to
            retain certain records for up to 7 years after account closure, which may limit our
            ability to delete certain data.
          </p>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@obsidian.capital" className="text-gold hover:underline">
              privacy@obsidian.capital
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="6. Cookie Policy">
          <p>
            We use cookies and similar tracking technologies to operate and improve the Platform.
            The types of cookies we use include:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong className="text-off-white/75">Essential Cookies:</strong> Required for the
              Platform to function, including session authentication and security tokens. These cannot
              be disabled.
            </li>
            <li>
              <strong className="text-off-white/75">Analytics Cookies:</strong> Help us understand
              how users interact with the Platform (e.g., page views, session duration). We use
              aggregated, anonymized data only.
            </li>
            <li>
              <strong className="text-off-white/75">Preference Cookies:</strong> Store your settings
              and preferences (e.g., theme, language) for a personalized experience.
            </li>
          </ul>
          <p>
            You may disable non-essential cookies through your browser settings. Note that disabling
            cookies may affect Platform functionality. We do not use third-party advertising cookies.
          </p>
        </Section>

        <Section title="7. Contact Us">
          <p>
            For privacy-related inquiries, data access requests, or to exercise your rights, contact
            our Data Protection Officer:
          </p>
          <div className="bg-surface-2 border border-border rounded-xl p-5 space-y-2">
            <p className="text-off-white/80 font-medium text-sm font-sans">Data Protection Officer</p>
            <p className="text-xs text-off-white/50 font-sans">Obsidian Capital LLC</p>
            <p className="text-xs text-off-white/50 font-sans">Washington, D.C. 20001</p>
            <a
              href="mailto:privacy@obsidian.capital"
              className="text-sm text-gold hover:underline font-sans"
            >
              privacy@obsidian.capital
            </a>
          </div>
          <p>
            We are committed to resolving privacy complaints promptly. If you are not satisfied with
            our response, you may file a complaint with the Federal Trade Commission (FTC) at
            ftc.gov/complaint or your applicable state consumer protection authority.
          </p>
        </Section>

        {/* Footer links */}
        <div className="border-t border-border pt-8 flex flex-wrap gap-4 text-xs text-off-white/30">
          <span>© 2026 Obsidian Capital LLC. All rights reserved.</span>
          <Link to="/terms" className="hover:text-off-white/50 transition-colors">
            Terms of Service
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
