/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Apple Liquid Glass dark palette
        black:      '#000000',
        obsidian:   '#000000',
        'deep':     '#0a0a0a',
        gold:       '#c9a54e',
        'gold-light': '#d4b566',
        'off-white': '#f5f5f7',  // Apple's off-white
        gain:       '#34c759',   // Apple system green
        loss:       '#ff3b30',   // Apple system red
        // Glass surface layers
        surface:    'rgba(255,255,255,0.04)',
        'surface-2': 'rgba(255,255,255,0.07)',
        'surface-3': 'rgba(255,255,255,0.10)',
        border:     'rgba(255,255,255,0.08)',
        'border-2': 'rgba(255,255,255,0.12)',
        // Text scale
        'text-primary':   'rgba(255,255,255,0.92)',
        'text-secondary': 'rgba(255,255,255,0.55)',
        'text-tertiary':  'rgba(255,255,255,0.35)',
        'text-muted':     'rgba(255,255,255,0.20)',
      },
      fontFamily: {
        sans:  ['-apple-system', 'SF Pro Display', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono:  ['SF Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        'glass':  '16px',
        'glass-sm': '12px',
        'glass-lg': '24px',
        'glass-xl': '32px',
      },
      backdropBlur: {
        'glass':    '40px',
        'glass-sm': '20px',
        'glass-lg': '60px',
      },
      backdropSaturate: {
        '180': '180%',
      },
      boxShadow: {
        // Glass shadows
        'glass':    '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-sm': '0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-xl': '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.12)',
        // Gold glow
        'gold':     '0 0 20px rgba(201,165,78,0.25)',
        'gold-md':  '0 4px 24px rgba(201,165,78,0.20)',
        'gold-lg':  '0 8px 40px rgba(201,165,78,0.30)',
        // Gain/loss glows
        'gain':     '0 0 20px rgba(52,199,89,0.20)',
        'loss':     '0 0 20px rgba(255,59,48,0.20)',
      },
      backgroundImage: {
        // Mesh gradients for hero backgrounds
        'mesh-hero':    'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(120,80,200,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(201,165,78,0.06) 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(52,130,200,0.08) 0%, transparent 50%)',
        'mesh-subtle':  'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(120,80,200,0.06) 0%, transparent 70%)',
        'gold-gradient': 'linear-gradient(135deg, #c9a54e 0%, #d4b566 50%, #c9a54e 100%)',
        'gold-subtle':  'linear-gradient(135deg, rgba(201,165,78,0.15) 0%, rgba(201,165,78,0.05) 100%)',
        'glass-shine':  'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.00) 100%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':      'shimmer 1.8s ease-in-out infinite',
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
        'ticker':       'ticker 40s linear infinite',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:    { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(40px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulseGold: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(201,165,78,0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(201,165,78,0.2)' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glass':  'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
};
