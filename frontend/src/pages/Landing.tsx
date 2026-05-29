/* Obsidian Capital — Landing Page (Apple Liquid Glass) */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Logo ───────────────────────────────────────────────────────
function ObsidianLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="none" stroke="#c9a54e" strokeWidth="1.5" />
      <polygon points="20,7 32,14 32,26 20,33 8,26 8,14"
        fill="rgba(201,165,78,0.07)" stroke="#c9a54e" strokeWidth="0.75" />
      <polygon points="20,7 28,14 20,18 12,14" fill="rgba(201,165,78,0.18)" />
      <circle cx="20" cy="20" r="1.5" fill="#c9a54e" />
    </svg>
  );
}

// ── Mesh background ─────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Deep mesh blurs */}
      <div style={{
        position: 'absolute', width: '80vw', height: '80vh',
        top: '-20%', left: '10%',
        background: 'radial-gradient(ellipse, rgba(120,80,200,0.09) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', width: '60vw', height: '60vh',
        top: '30%', right: '-10%',
        background: 'radial-gradient(ellipse, rgba(50,100,200,0.07) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
      <div style={{
        position: 'absolute', width: '40vw', height: '40vh',
        bottom: '10%', left: '5%',
        background: 'radial-gradient(ellipse, rgba(201,165,78,0.05) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />
    </div>
  );
}

// ── Scrolling ticker ────────────────────────────────────────────
const TICKER_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META'];

function TickerBar() {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});
  const apiUrl = (import.meta as unknown as { env: Record<string,string> }).env?.VITE_API_URL || '/api';

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const results = await Promise.allSettled(
          TICKER_SYMBOLS.map(s =>
            window.fetch(`${apiUrl}/market/quote/${s}`).then(r => r.json())
          )
        );
        const data: typeof prices = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value?.price) {
            data[TICKER_SYMBOLS[i]] = { price: r.value.price, change: r.value.changePct ?? 0 };
          }
        });
        if (Object.keys(data).length > 0) setPrices(data);
      } catch { /* silent */ }
    };
    fetchPrices();
    const id = setInterval(fetchPrices, 30000);
    return () => clearInterval(id);
  }, [apiUrl]);

  const items = TICKER_SYMBOLS.filter(s => prices[s]);
  if (items.length === 0) return null;

  const ticker = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-b" style={{
      borderColor: 'rgba(255,255,255,0.05)',
      background: 'rgba(255,255,255,0.02)',
      height: '36px',
    }}>
      <div className="flex items-center h-full animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
        {ticker.map((sym, i) => {
          const p = prices[sym];
          if (!p) return null;
          const pos = p.change >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-2 px-6 text-xs font-mono tabular-nums">
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{sym}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>${p.price.toFixed(2)}</span>
              <span style={{ color: pos ? '#34c759' : '#ff3b30' }}>
                {pos ? '+' : ''}{p.change.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
      background: scrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(40px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
    }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: '60px' }}>
        <div className="flex items-center gap-2.5">
          <ObsidianLogo size={28} />
          <span style={{ fontFamily: '-apple-system, Inter, sans-serif', fontSize: '14px', fontWeight: 300, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
            Obsidian Capital
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-gold btn-sm">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="max-w-4xl mx-auto"
      >
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(201,165,78,0.08)', border: '1px solid rgba(201,165,78,0.18)' }}>
          <span className="status-dot status-dot-gold" />
          <span style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', color: '#c9a54e', textTransform: 'uppercase' }}>
            Private Wealth Brokerage · Washington D.C.
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 'clamp(48px, 8vw, 88px)',
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: 'rgba(255,255,255,0.92)',
          marginBottom: '24px',
        }}>
          The Future<br />
          <span style={{ color: '#c9a54e' }}>of Trading</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.45)',
          maxWidth: '520px',
          margin: '0 auto 48px',
          letterSpacing: '-0.01em',
        }}>
          Institutional-grade trading with flat-fee commissions — starting at $0.99 per trade.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="btn btn-gold btn-lg">
            Open Account <ArrowRight size={16} />
          </Link>
          <Link to="/fees" className="btn btn-glass btn-lg">
            View Pricing
          </Link>
        </div>

        {/* Trust line */}
        <p style={{ marginTop: '40px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
          Member SIPC · SEC Regulated · Clearing by Alpaca Securities LLC
        </p>
      </motion.div>

      {/* Floating glass card preview */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="mt-20 glass-lg p-6 w-full max-w-lg mx-auto animate-float"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Portfolio Value</p>
            <p style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.92)', fontVariantNumeric: 'tabular-nums' }}>$124,850.00</p>
          </div>
          <span className="badge-gain badge px-3 py-1">+2.34%  today</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['AAPL', '+1.8%', true], ['TSLA', '-0.5%', false], ['MSFT', '+3.2%', true]].map(([t, c, pos]) => (
            <div key={t as string} className="glass-sm p-3 text-center">
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.70)', marginBottom: '2px' }}>{t as string}</p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: pos ? '#34c759' : '#ff3b30' }}>{c as string}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: TrendingUp, title: 'Real-Time Data', desc: 'Live market data powered by Polygon.io — every price, every tick, with zero delay.' },
  { icon: Zap, title: 'Flat-Fee Commissions', desc: 'Starting at $0.99 per trade for Private members. No percentage fees, no surprises.' },
  { icon: Shield, title: 'Institutional Tools', desc: 'TradingView charts, advanced order types, portfolio analytics — built for serious investors.' },
];

function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Built Different
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '15px', fontWeight: 300 }}>
            Everything you need to trade with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="glass p-7"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(201,165,78,0.10)', border: '1px solid rgba(201,165,78,0.18)' }}>
                <Icon size={18} style={{ color: '#c9a54e' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '8px', letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Commission Tiers ─────────────────────────────────────────────
const TIERS = [
  {
    name: 'Standard',
    price: 'Free',
    commission: '$4.99 / trade',
    features: ['Real-time market data', 'All order types', 'Full platform access', 'Standard support'],
    gold: false,
  },
  {
    name: 'Member',
    price: '$29.99/mo',
    commission: '$2.99 / trade',
    features: ['Everything in Standard', 'Priority support', 'Advanced analytics', 'Lower commission'],
    gold: false,
    badge: 'Popular',
  },
  {
    name: 'Obsidian Private',
    price: '$199.99/mo',
    commission: '$0.99 / trade',
    features: ['Everything in Member', 'Dedicated advisor', 'White-glove onboarding', 'Concierge 24/7'],
    gold: true,
    badge: 'Flagship',
  },
];

function CommissionTiers() {
  return (
    <section className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Flat-Fee Pricing
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '15px', fontWeight: 300 }}>
            Pay per trade. No percentage fees. No surprises.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map(({ name, price, commission, features, gold, badge }) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className={gold ? 'glass-gold p-7 relative' : 'glass p-7 relative'}
            >
              {badge && (
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: gold ? 'linear-gradient(135deg, #c9a54e, #d4b566)' : 'rgba(255,255,255,0.10)', color: gold ? '#000' : 'rgba(255,255,255,0.80)', border: gold ? 'none' : '1px solid rgba(255,255,255,0.12)' }}>
                  {badge}
                </span>
              )}
              <div className="mb-6 mt-2">
                <p style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '0.10em', color: gold ? '#c9a54e' : 'rgba(255,255,255,0.40)', textTransform: 'uppercase', marginBottom: '6px' }}>{name}</p>
                <p style={{ fontSize: '28px', fontWeight: 300, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}>{price}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: gold ? '#c9a54e' : 'rgba(255,255,255,0.60)', marginTop: '4px' }}>{commission}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>
                    <span style={{ color: gold ? '#c9a54e' : '#34c759', fontSize: '14px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`btn w-full justify-center ${gold ? 'btn-gold' : 'btn-glass'}`} style={{ display: 'flex' }}>
                Get Started <ChevronRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Leadership ───────────────────────────────────────────────────
// CRITICAL: These names must be spelled EXACTLY as shown
const LEADERS = [
  { name: 'Massimo Claver-Carone', role: 'CEO & Founder', initials: 'MC' },
  { name: 'Marco Torterelli',      role: 'Chief Technology Officer', initials: 'MT' },
  { name: 'Hugh Snyder',           role: 'Chief Financial Officer', initials: 'HS' },
];

function Leadership() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Leadership
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '15px', fontWeight: 300 }}>
            Based in Washington D.C. · Founded 2026
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {LEADERS.map(({ name, role, initials }) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="glass p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(201,165,78,0.20), rgba(201,165,78,0.08))', border: '1px solid rgba(201,165,78,0.25)' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#c9a54e', letterSpacing: '0.05em' }}>{initials}</span>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em', marginBottom: '4px' }}>{name}</p>
              <p style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.40)' }}>{role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ObsidianLogo size={22} />
              <span style={{ fontSize: '13px', fontWeight: 300, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase' }}>Obsidian Capital</span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', maxWidth: '300px', lineHeight: 1.6, fontWeight: 300 }}>
              Securities offered through Alpaca Securities LLC, member SIPC. Investing involves risk.
            </p>
          </div>
          <div className="flex gap-8">
            {[['Legal', [['Terms', '/terms'], ['Privacy', '/privacy'], ['Fees', '/fees']]], ['Platform', [['Sign In', '/login'], ['Register', '/register'], ['Markets', '/markets']]]].map(([section, links]) => (
              <div key={section as string}>
                <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '12px' }}>{section as string}</p>
                <div className="space-y-2">
                  {(links as [string, string][]).map(([label, href]) => (
                    <Link key={label} to={href} style={{ display: 'block', fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.45)' }}
                      className="hover:text-white transition-colors duration-200">{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t pt-6 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>
            © 2026 Obsidian Capital. Member SIPC. SEC Regulated.
          </p>
          <div className="flex items-center gap-4">
            {['Terms', 'Privacy', 'Fees'].map((l) => (
              <Link key={l} to={`/${l.toLowerCase()}`} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}
                className="hover:text-white/60 transition-colors duration-200">{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative' }}>
      <MeshBackground />
      <TickerBar />
      <LandingNav />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <Features />
        <CommissionTiers />
        <Leadership />
      </main>
      <Footer />
    </div>
  );
}
