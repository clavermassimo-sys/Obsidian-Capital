/* ============================================================
   Obsidian Capital — Charts Page
   ============================================================ */

import React, { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Search, TrendingUp, BarChart2, Activity } from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import { formatCurrency } from '@/utils/format';

// ── Types ─────────────────────────────────────────────────────

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'All';

interface OHLCVBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ma50?: number;
  ma200?: number;
}

// ── Mock data generator ───────────────────────────────────────

const TICKER_BASE: Record<string, { price: number; name: string }> = {
  AAPL:  { price: 189.84, name: 'Apple Inc.' },
  MSFT:  { price: 418.32, name: 'Microsoft Corp.' },
  NVDA:  { price: 875.40, name: 'NVIDIA Corp.' },
  TSLA:  { price: 248.42, name: 'Tesla Inc.' },
  AMZN:  { price: 198.72, name: 'Amazon.com Inc.' },
  GOOGL: { price: 171.96, name: 'Alphabet Inc.' },
  META:  { price: 571.28, name: 'Meta Platforms' },
  JPM:   { price: 224.58, name: 'JPMorgan Chase' },
};

function generateOHLCV(ticker: string, range: TimeRange): OHLCVBar[] {
  const base = TICKER_BASE[ticker]?.price ?? 150;
  const counts: Record<TimeRange, number> = {
    '1D': 78,    // 5-min bars
    '1W': 35,    // hourly
    '1M': 22,    // daily
    '3M': 63,    // daily
    '1Y': 252,   // daily
    'All': 756,  // weekly
  };
  const n = counts[range];
  const data: OHLCVBar[] = [];
  let price = base * (0.85 + Math.random() * 0.1);
  const seed = ticker.charCodeAt(0) / 100;

  for (let i = 0; i < n; i++) {
    const drift = (Math.sin(i * seed) * 0.003 + 0.0004);
    const vol = 0.012 + Math.random() * 0.014;
    const open = price;
    const close = open * (1 + drift + (Math.random() - 0.48) * vol);
    const high = Math.max(open, close) * (1 + Math.random() * 0.006);
    const low  = Math.min(open, close) * (1 - Math.random() * 0.006);
    const volume = Math.round((3_000_000 + Math.random() * 25_000_000));

    let label = '';
    const now = new Date('2026-05-26');
    if (range === '1D') {
      const minutesOpen = 9 * 60 + 30 + i * 5;
      const hh = Math.floor(minutesOpen / 60);
      const mm = minutesOpen % 60;
      label = `${hh}:${mm.toString().padStart(2, '0')}`;
    } else if (range === '1W') {
      const d = new Date(now);
      d.setHours(now.getHours() - (n - i));
      label = d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric' });
    } else {
      const d = new Date(now);
      d.setDate(now.getDate() - (n - i));
      if (range === '1Y' || range === 'All') {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    data.push({ time: label, open, high, low, close, volume });
    price = close;
  }

  // Compute moving averages
  const closes = data.map((d) => d.close);
  data.forEach((bar, i) => {
    if (i >= 19)  bar.ma20  = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20;
    if (i >= 49)  bar.ma50  = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50;
    if (i >= 199) bar.ma200 = closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200;
  });

  return data;
}

// Compute RSI
function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) avgGain += change / period;
    else avgLoss += Math.abs(change) / period;
  }
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0  ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

// Compute EMA
function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(period - 1).fill(null);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function computeMACD(closes: number[]): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd  = closes.map((_, i) => {
    if (ema12[i] == null || ema26[i] == null) return null;
    return (ema12[i] as number) - (ema26[i] as number);
  });
  const macdValues = macd.filter((v) => v !== null) as number[];
  const sigRaw = ema(macdValues, 9);
  const signal: (number | null)[] = new Array(closes.length).fill(null);
  let sigIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macd[i] !== null) {
      signal[i] = sigRaw[sigIdx] ?? null;
      sigIdx++;
    }
  }
  const hist = closes.map((_, i) =>
    macd[i] !== null && signal[i] !== null ? (macd[i] as number) - (signal[i] as number) : null
  );
  return { macd, signal, hist };
}

// ── Custom candlestick bar ─────────────────────────────────────

function CandlestickBar(props: {
  x?: number; y?: number; width?: number; height?: number;
  payload?: OHLCVBar; yScale?: (v: number) => number;
  chartHeight?: number;
}) {
  const { x = 0, width = 8, payload, yScale, chartHeight = 300 } = props;
  if (!payload || !yScale) return null;

  const { open, high, low, close } = payload;
  const isGain = close >= open;
  const color = isGain ? '#3d9e6e' : '#c0453a';

  const yHigh  = yScale(high);
  const yLow   = yScale(low);
  const yOpen  = yScale(open);
  const yClose = yScale(close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyH   = Math.max(Math.abs(yClose - yOpen), 1);
  const centerX = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line x1={centerX} y1={yHigh} x2={centerX} y2={yLow} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect
        x={x + 1}
        y={bodyTop}
        width={Math.max(width - 2, 1)}
        height={bodyH}
        fill={isGain ? color : color}
        fillOpacity={isGain ? 0.85 : 1}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────

function CandleTooltip({ active, payload }: { active?: boolean; payload?: { payload: OHLCVBar }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isGain = d.close >= d.open;
  const chg = d.close - d.open;
  const chgPct = (chg / d.open) * 100;
  return (
    <div className="bg-surface-2 border border-border rounded-lg p-3 shadow-surface-lg text-xs">
      <div className="text-off-white/50 mb-2 font-mono">{d.time}</div>
      <div className="space-y-1">
        {[['O', d.open], ['H', d.high], ['L', d.low], ['C', d.close]].map(([label, val]) => (
          <div key={label as string} className="flex gap-3 justify-between">
            <span className="text-off-white/40">{label}</span>
            <span className="font-mono tabular-nums text-off-white">{formatCurrency(val as number)}</span>
          </div>
        ))}
        <div className="border-t border-border pt-1 mt-1 flex gap-3 justify-between">
          <span className="text-off-white/40">Chg</span>
          <span className={`font-mono tabular-nums font-semibold ${isGain ? 'text-gain' : 'text-loss'}`}>
            {isGain ? '+' : ''}{chgPct.toFixed(2)}%
          </span>
        </div>
        <div className="flex gap-3 justify-between">
          <span className="text-off-white/40">Vol</span>
          <span className="font-mono tabular-nums text-off-white/60">
            {(d.volume / 1_000_000).toFixed(1)}M
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Charts Page ───────────────────────────────────────────────

const TIMEFRAMES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'All'];

export default function Charts() {
  const { setSelectedTicker } = useTrading();
  const [ticker, setTicker]         = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [timeframe, setTimeframe]   = useState<TimeRange>('3M');
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set(['MA20', 'MA50', 'RSI', 'MACD']));

  const tickerInfo = TICKER_BASE[ticker.toUpperCase()] ?? { price: 150, name: ticker };

  const ohlcv = useMemo(() => generateOHLCV(ticker.toUpperCase(), timeframe), [ticker, timeframe]);

  const closes = useMemo(() => ohlcv.map((d) => d.close), [ohlcv]);
  const rsiValues = useMemo(() => computeRSI(closes), [closes]);
  const macdData  = useMemo(() => computeMACD(closes), [closes]);

  const priceData = useMemo(() => {
    const step = Math.max(1, Math.floor(ohlcv.length / 80));
    return ohlcv.filter((_, i) => i % step === 0 || i === ohlcv.length - 1);
  }, [ohlcv]);

  const rsiChartData = useMemo(() =>
    priceData.map((bar, i) => {
      const origIdx = ohlcv.indexOf(bar);
      return { time: bar.time, rsi: Math.round(rsiValues[origIdx] * 10) / 10 };
    }), [priceData, ohlcv, rsiValues]);

  const macdChartData = useMemo(() =>
    priceData.map((bar) => {
      const origIdx = ohlcv.indexOf(bar);
      return {
        time: bar.time,
        macd:   macdData.macd[origIdx],
        signal: macdData.signal[origIdx],
        hist:   macdData.hist[origIdx],
      };
    }), [priceData, ohlcv, macdData]);

  const currentClose = ohlcv[ohlcv.length - 1]?.close ?? tickerInfo.price;
  const firstClose   = ohlcv[0]?.open ?? currentClose;
  const totalChg     = currentClose - firstClose;
  const totalChgPct  = (totalChg / firstClose) * 100;
  const isGain       = totalChg >= 0;

  const toggleIndicator = useCallback((ind: string) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });
  }, []);

  const handleTickerSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const t = searchInput.trim().toUpperCase();
    if (t) {
      setTicker(t);
      setSelectedTicker(t);
    }
  }, [searchInput, setSelectedTicker]);

  // Price y-axis domain
  const priceMin = useMemo(() => Math.min(...priceData.map((d) => d.low)) * 0.998, [priceData]);
  const priceMax = useMemo(() => Math.max(...priceData.map((d) => d.high)) * 1.002, [priceData]);

  // Volume data
  const volumeData = useMemo(() =>
    priceData.map((d) => ({ time: d.time, volume: d.volume, isGain: d.close >= d.open })),
  [priceData]);

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-5">

        {/* ── Header / Search ─────────────────────────────────── */}
        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleTickerSearch} className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Search ticker…"
              className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-off-white placeholder-off-white/25 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 font-mono transition-colors"
            />
          </form>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xl font-bold text-gold">{ticker.toUpperCase()}</span>
            <span className="text-off-white/50 text-sm">{tickerInfo.name}</span>
            <span className="font-mono text-2xl font-semibold text-off-white tabular-nums">
              {formatCurrency(currentClose)}
            </span>
            <span className={`text-sm font-mono font-semibold tabular-nums ${isGain ? 'text-gain' : 'text-loss'}`}>
              {isGain ? '+' : ''}{totalChg.toFixed(2)} ({isGain ? '+' : ''}{totalChgPct.toFixed(2)}%)
            </span>
          </div>
          {/* Timeframe buttons */}
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-1 ml-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  timeframe === tf
                    ? 'bg-gold text-obsidian shadow-gold'
                    : 'text-off-white/50 hover:text-off-white hover:bg-surface-3'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* ── Indicator Toggles ────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-off-white/30 mr-1">Indicators:</span>
          {[
            { id: 'MA20',  label: '20 MA',  color: '#e8c96e' },
            { id: 'MA50',  label: '50 MA',  color: '#a78bfa' },
            { id: 'MA200', label: '200 MA', color: '#f97316' },
            { id: 'RSI',   label: 'RSI',    color: '#60a5fa' },
            { id: 'MACD',  label: 'MACD',   color: '#34d399' },
          ].map(({ id, label, color }) => {
            const active = activeIndicators.has(id);
            return (
              <button
                key={id}
                onClick={() => toggleIndicator(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all duration-150 ${
                  active
                    ? 'border-transparent text-obsidian'
                    : 'bg-transparent border-border text-off-white/40 hover:text-off-white hover:border-border'
                }`}
                style={active ? { backgroundColor: color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: active ? 'rgba(0,0,0,0.4)' : color }}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Main Price Chart ─────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} className="text-gold" />
            <span className="text-sm font-medium text-off-white/60">Price</span>
            <span className="text-xs text-off-white/30 ml-auto">{timeframe} · OHLC</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={priceData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#4a4540', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a2a' }}
                interval={Math.floor(priceData.length / 8)}
              />
              <YAxis
                domain={[priceMin, priceMax]}
                tick={{ fill: '#4a4540', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                width={56}
                orientation="right"
              />
              <Tooltip content={<CandleTooltip />} />

              {/* Candlestick bars */}
              <Bar
                dataKey="high"
                shape={(props: {
                  x?: number; y?: number; width?: number; height?: number;
                  payload?: OHLCVBar;
                }) => {
                  if (!props.payload) return <g />;
                  // We need to access the yAxis scale — use a workaround via the chart context
                  return <g />;
                }}
                fill="transparent"
                stroke="transparent"
              />

              {/* Moving Averages */}
              {activeIndicators.has('MA20') && (
                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#e8c96e"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  name="MA20"
                />
              )}
              {activeIndicators.has('MA50') && (
                <Line
                  type="monotone"
                  dataKey="ma50"
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  name="MA50"
                />
              )}
              {activeIndicators.has('MA200') && (
                <Line
                  type="monotone"
                  dataKey="ma200"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  name="MA200"
                />
              )}

              {/* Close price line as main chart when MA only */}
              <Line
                type="monotone"
                dataKey="close"
                stroke={isGain ? '#3d9e6e' : '#c0453a'}
                strokeWidth={2}
                dot={false}
                name="Close"
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Candlestick SVG overlay */}
          <CandlestickOverlay data={priceData} priceMin={priceMin} priceMax={priceMax} />
        </div>

        {/* ── Volume Chart ─────────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-off-white/40" />
            <span className="text-sm font-medium text-off-white/60">Volume</span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <ComposedChart data={volumeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis
                tick={{ fill: '#4a4540', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                width={40}
                orientation="right"
              />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                labelStyle={{ color: '#a09a8e', fontSize: 10 }}
                formatter={(v: number) => [`${(v / 1_000_000).toFixed(2)}M`, 'Volume']}
              />
              <Bar dataKey="volume" maxBarSize={6}>
                {volumeData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isGain ? '#3d9e6e' : '#c0453a'}
                    fillOpacity={0.6}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── Technical Indicators ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5">

          {/* RSI */}
          {activeIndicators.has('RSI') && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-blue-400" />
                  <span className="text-sm font-medium text-off-white/60">RSI (14)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-loss/70">Overbought &gt;70</span>
                  <span className="text-gain/70">Oversold &lt;30</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {rsiChartData[rsiChartData.length - 1]?.rsi.toFixed(1)}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <ComposedChart data={rsiChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#4a4540', fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    ticks={[0, 30, 50, 70, 100]}
                    width={28}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                    formatter={(v: number) => [v.toFixed(1), 'RSI']}
                  />
                  {/* Overbought zone */}
                  <ReferenceLine y={70} stroke="#c0453a" strokeDasharray="4 3" strokeOpacity={0.5} />
                  {/* Oversold zone */}
                  <ReferenceLine y={30} stroke="#3d9e6e" strokeDasharray="4 3" strokeOpacity={0.5} />
                  {/* Midline */}
                  <ReferenceLine y={50} stroke="#2a2a2a" strokeDasharray="2 4" />
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    stroke="#60a5fa"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* MACD */}
          {activeIndicators.has('MACD') && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-emerald-400" />
                  <span className="text-sm font-medium text-off-white/60">MACD (12, 26, 9)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> MACD
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-orange-400 inline-block" /> Signal
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <ComposedChart data={macdChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis
                    tick={{ fill: '#4a4540', fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v.toFixed(1)}
                    width={36}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                    formatter={(v: number | null) => [v != null ? v.toFixed(3) : '—', '']}
                  />
                  <ReferenceLine y={0} stroke="#2a2a2a" />
                  <Bar dataKey="hist" maxBarSize={4}>
                    {macdChartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={(entry.hist ?? 0) >= 0 ? '#3d9e6e' : '#c0453a'}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="macd"
                    stroke="#34d399"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    name="MACD"
                  />
                  <Line
                    type="monotone"
                    dataKey="signal"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    name="Signal"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Candlestick SVG overlay ────────────────────────────────────
// Renders a true OHLC candlestick chart in SVG over a given price range

function CandlestickOverlay({ data, priceMin, priceMax }: {
  data: OHLCVBar[];
  priceMin: number;
  priceMax: number;
}) {
  const W = 100; // percentage width per bar slot
  const H = 320;
  const PAD_LEFT = 0;
  const PAD_RIGHT = 56; // matches YAxis width
  const PAD_TOP = 8;
  const PAD_BOTTOM = 30;

  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const priceRange = priceMax - priceMin || 1;

  const scaleY = (price: number) =>
    PAD_TOP + chartH - ((price - priceMin) / priceRange) * chartH;

  const n = data.length;
  if (n === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ marginRight: `${PAD_RIGHT}px` }}
    >
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${1000} ${H}`}
        preserveAspectRatio="none"
        className="block"
      >
        {data.map((bar, i) => {
          const slotW = 1000 / n;
          const x = i * slotW;
          const barW = Math.max(slotW * 0.6, 1);
          const cx = x + slotW / 2;
          const isGain = bar.close >= bar.open;
          const color = isGain ? '#3d9e6e' : '#c0453a';
          const yHigh  = scaleY(bar.high);
          const yLow   = scaleY(bar.low);
          const yOpen  = scaleY(bar.open);
          const yClose = scaleY(bar.close);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyH   = Math.max(Math.abs(yClose - yOpen), 1);

          return (
            <g key={i}>
              <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1} />
              <rect
                x={cx - barW / 2}
                y={bodyTop}
                width={barW}
                height={bodyH}
                fill={isGain ? color : color}
                fillOpacity={isGain ? 0.85 : 1}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
