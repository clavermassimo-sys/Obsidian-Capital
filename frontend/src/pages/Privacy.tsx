/* ============================================================
   Obsidian Capital — Privacy Policy Page
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
          <h1 className="font-serif text-4xl font-medium text-off-white mb-2">Privacy Policy</h1>
          <p className="text-off-white/40 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <Section title="1. Information We Collect">
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Identity information (name, date of birth, SSN last 4 digits)</li>
            <li>Contact information (email address, phone number, mailing address)</li>
            <li>Financial information required for KYC/AML compliance</li>
            <li>Trading activity and transaction history</li>
          </ul>
          <p>
            We also collect information automatically when you use the Platform, including device
            information, IP addresses, and usage data.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Verify your identity and comply with regulatory requirements</li>
            <li>Process transactions and manage your account</li>
            <li>Communicate with you about your account and our services</li>
            <li>Detect and prevent fraud and unauthorized activity</li>
            <li>Improve and personalize the Platform experience</li>
          </ul>
        </Section>

        <Section title="3. Information Sharing">
          <p>
            We share your information only as necessary to provide our services, including with:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong className="text-off-white/80">Alpaca Securities LLC</strong> — to execute
              trades and maintain your brokerage account
            </li>
            <li>
              <strong className="text-off-white/80">Stripe Inc.</strong> — to process subscription
              payments
            </li>
            <li>
              <strong className="text-off-white/80">Regulatory authorities</strong> — as required
              by law, including FINRA, SEC, and applicable state regulators
            </li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </Section>

        <Section title="4. Data Security">
          <p>
            We implement industry-standard security measures to protect your information, including
            encryption in transit (TLS) and at rest, access controls, and regular security audits.
          </p>
          <p>
            However, no method of transmission over the internet is 100% secure. We cannot
            guarantee the absolute security of your information.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your personal information for as long as your account is active and for up
            to 7 years after account closure, as required by financial regulations.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information (subject to legal retention requirements)</li>
            <li>Opt out of certain marketing communications</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@obsidiancapital.com" className="text-gold hover:underline">
              privacy@obsidiancapital.com
            </a>
            .
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use cookies and similar tracking technologies to maintain your session and improve
            Platform performance. You may disable cookies in your browser settings, but this may
            affect Platform functionality.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            The Platform is not directed at individuals under 18. We do not knowingly collect
            personal information from minors.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy periodically. We will notify you of material changes
            via email or a prominent notice on the Platform. Continued use after changes constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            For privacy-related inquiries, contact our Data Protection Officer at{' '}
            <a href="mailto:privacy@obsidiancapital.com" className="text-gold hover:underline">
              privacy@obsidiancapital.com
            </a>
            .
          </p>
        </Section>

        <div className="border-t border-border pt-8 text-xs text-off-white/30 space-x-4">
          <Link to="/terms" className="hover:text-off-white/50 transition-colors">
            Terms &amp; Conditions
          </Link>
          <Link to="/fees" className="hover:text-off-white/50 transition-colors">
            Fee Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}
