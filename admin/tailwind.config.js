/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black:     '#000000',
        obsidian:  '#000000',
        gold:      '#c9a54e',
        'off-white': '#f5f5f7',
        gain:      '#34c759',
        loss:      '#ff3b30',
        surface:   'rgba(255,255,255,0.04)',
        'surface-2': 'rgba(255,255,255,0.07)',
        border:    'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans:  ['-apple-system', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono:  ['SF Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        glass: '16px',
        'glass-sm': '12px',
        'glass-lg': '24px',
      },
    },
  },
  plugins: [],
};
