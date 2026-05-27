/* ============================================================
   Obsidian Capital — Charts Page
   ============================================================ */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ComposedChart,
  BarChart,
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
import { Search, TrendingUp, TrendingDown, BarChart2, Activity } from 'lucide-react';
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

// ── Seeded PRNG ────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
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
  V:     { price: 289.34, name: 'Visa Inc.' },
  BRK:   { price: 452.80, name: 'Berkshire Hathaway' },
};

function generateOHLCV(ticker: string, range: TimeRange): OHLCVBar[] {
  const base = TICKER_BASE[ticker]?.price ?? 150;
  const counts: Record<TimeRange, number> = {
    '1D':  78,
    '1W':  35,
    '1M':  22,
    '3M':  66,
    '1Y':  252,
    'All': 500,
  };
  const n = counts[range];

  // Seeded random based on ticker chars + range to get consistent data
  const tickerSeed = ticker.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const rangeSeed  = range.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = seededRng((tickerSeed * 31 + rangeSeed) & 0x7fffffff);

  const data: OHLCVBar[] = [];
  let price = base * (0.80 + rng() * 0.20);
  const refDate = new Date('2026-05-26T16:00:00Z');

  for (let i = 0; i < n; i++) {
    const volatility = 0.010 + rng() * 0.012;
    const drift      = (rng() - 0.47) * 0.002;
    const open       = price;
    const close      = open * (1 + drift + (rng() - 0.5) * volatility);
    const high       = Math.max(open, close) * (1 + rng() * 0.005);
    const low        = Math.min(open, close) * (1 - rng() * 0.005);
    const volume     = Math.round(2_000_000 + rng() * 28_000_000);

    let label = '';

    if (range === '1D') {
      const minutesOffset = i * 5;
      const d = new Date('2026-05-26T09:30:00');
      d.setMinutes(d.getMinutes() + minutesOffset);
      const hh = d.getHours();
      const mm = d.getMinutes();
      const period = hh < 12 ? 'AM' : 'PM';
      const displayH = hh > 12 ? hh - 12 : hh;
      label = `${displayH}:${mm.toString().padStart(2, '0')} ${period}`;
    } else if (range === '1W') {
      const d = new Date(refDate);
      d.setHours(refDate.getHours() - (n - 1 - i) * 2);
      label = d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', hour12: true });
    } else {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() - (n - 1 - i));
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

// ── Compute RSI ────────────────────────────────────────────────

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
    const gain   = change >= 0 ? change : 0;
    const loss   = change < 0  ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i]  = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

// ── Compute EMA ────────────────────────────────────────────────

function ema(values: number[], period: number): (number | null)[] {
  if (values.length < period) return values.map(() => null);
  const k      = 2 / (period + 1);
  const result: (number | null)[] = new Array(period - 1).fill(null);
  let prev     = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

// ── Compute MACD ───────────────────────────────────────────────

function computeMACD(closes: number[]): {
  macd:   (number | null)[];
  signal: (number | null)[];
  hist:   (number | null)[];
} {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd  = closes.map((_, i) => {
    if (ema12[i] == null || ema26[i] == null) return null;
    return (ema12[i] as number) - (ema26[i] as number);
  });

  const macdValues = macd.filter((v): v is number => v !== null);
  const sigRaw     = ema(macdValues, 9);
  const signal: (number | null)[] = new Array(closes.length).fill(null);
  let sigIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macd[i] !== null) {
      signal[i] = sigRaw[sigIdx] ?? null;
      sigIdx++;
    }
  }

  const hist = closes.map((_, i) =>
    macd[i] !== null && signal[i] !== null
      ? (macd[i] as number) - (signal[i] as number)
      : null
  );
  return { macd, signal, hist };
}

// ── Custom Candlestick Shape ───────────────────────────────────
// Used as shape prop on a <Bar> inside ComposedChart.
// recharts passes x, y, width, height and a background; we ignore
// the bar geometry and draw the candle using payload values + the
// chart's numeric y-axis range (yAxis.domain propagated via chartLayout).

interface CandleProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: OHLCVBar;
  // recharts internal props injected when used as shape
  background?: { x: number; y: number; width: number; height: number };
  yAxisMap?: Record<string, { scale: (v: number) => number }>;
}

function CandleShape(props: CandleProps & { yScale: (v: number) => number }) {
  const { x = 0, width = 8, payload, yScale } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isGain  = close >= open;
  const color   = isGain ? '#3d9e6e' : '#c0453a';
  const yHigh   = yScale(high);
  const yLow    = yScale(low);
  const yOpen   = yScale(open);
  const yClose  = yScale(close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyH   = Math.max(Math.abs(yClose - yOpen), 1);
  const cx      = x + width / 2;
  const bw      = Math.max(width - 2, 1);

  return (
    <g>
      <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1} />
      <rect
        x={cx - bw / 2}
        y={bodyTop}
        width={bw}
        height={bodyH}
        fill={color}
        fillOpacity={isGain ? 0.8 : 1}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────

interface TooltipPayloadItem {
  payload: OHLCVBar;
}

function CandleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const d      = payload[0].payload;
  const isGain = d.close >= d.open;
  const chg    = d.close - d.open;
  const chgPct = (chg / d.open) * 100;

  return (
    <div className="bg-surface-2 border border-border rounded-lg p-3 shadow-surface-lg text-xs min-w-[140px]">
      <div className="text-off-white/50 mb-2 font-mono">{d.time}</div>
      <div className="space-y-1">
        {([['O', d.open], ['H', d.high], ['L', d.low], ['C', d.close]] as [string, number][]).map(
          ([label, val]) => (
            <div key={label} className="flex gap-3 justify-between">
              <span className="text-off-white/40">{label}</span>
              <span className="font-mono tabular-nums text-off-white">{formatCurrency(val)}</span>
            </div>
          )
        )}
        <div className="border-t border-border pt-1 mt-1 flex gap-3 justify-between">
          <span className="text-off-white/40">Chg</span>
          <span
            className={`font-mono tabular-nums font-semibold ${isGain ? 'text-gain' : 'text-loss'}`}
          >
            {isGain ? '+' : ''}
            {chgPct.toFixed(2)}%
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

// ── Indicator type ─────────────────────────────────────────────

type Indicator = 'RSI' | 'MACD' | 'MA';

const INDICATOR_CONFIG: { id: Indicator; label: string; color: string }[] = [
  { id: 'RSI',  label: 'RSI',  color: '#60a5fa' },
  { id: 'MACD', label: 'MACD', color: '#34d399' },
  { id: 'MA',   label: 'MA',   color: '#c9a84c' },
];

const TIMEFRAMES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'All'];

// ── Charts Page ───────────────────────────────────────────────

export default function Charts() {
  const { setSelectedTicker } = useTrading();
  const [ticker, setTicker]               = useState('AAPL');
  const [searchInput, setSearchInput]     = useState('AAPL');
  const [timeframe, setTimeframe]         = useState<TimeRange>('3M');
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(['MA']));

  // Track chart container dimensions for the SVG candlestick overlay
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartRect, setChartRect]         = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setChartRect(el.getBoundingClientRect()));
    obs.observe(el);
    setChartRect(el.getBoundingClientRect());
    return () => obs.disconnect();
  }, []);

  const tickerInfo = TICKER_BASE[ticker.toUpperCase()] ?? { price: 150, name: ticker };

  const ohlcv = useMemo(
    () => generateOHLCV(ticker.toUpperCase(), timeframe),
    [ticker, timeframe]
  );

  // Thin out bars for display when there are too many (keep chart readable)
  const displayData = useMemo(() => {
    if (ohlcv.length <= 120) return ohlcv;
    const step = Math.ceil(ohlcv.length / 120);
    return ohlcv.filter((_, i) => i % step === 0 || i === ohlcv.length - 1);
  }, [ohlcv]);

  const closes     = useMemo(() => displayData.map((d) => d.close), [displayData]);
  const rsiValues  = useMemo(() => computeRSI(closes), [closes]);
  const macdResult = useMemo(() => computeMACD(closes), [closes]);

  const rsiChartData = useMemo(
    () => displayData.map((bar, i) => ({ time: bar.time, rsi: Math.round(rsiValues[i] * 10) / 10 })),
    [displayData, rsiValues]
  );

  const macdChartData = useMemo(
    () =>
      displayData.map((bar, i) => ({
        time:   bar.time,
        macd:   macdResult.macd[i],
        signal: macdResult.signal[i],
        hist:   macdResult.hist[i],
      })),
    [displayData, macdResult]
  );

  const currentClose = ohlcv[ohlcv.length - 1]?.close ?? tickerInfo.price;
  const firstOpen    = ohlcv[0]?.open ?? currentClose;
  const totalChg     = currentClose - firstOpen;
  const totalChgPct  = (totalChg / firstOpen) * 100;
  const isGain       = totalChg >= 0;

  const priceMin = useMemo(
    () => Math.min(...displayData.map((d) => d.low)) * 0.9975,
    [displayData]
  );
  const priceMax = useMemo(
    () => Math.max(...displayData.map((d) => d.high)) * 1.0025,
    [displayData]
  );

  const volumeData = useMemo(
    () => displayData.map((d) => ({ time: d.time, volume: d.volume, isGain: d.close >= d.open })),
    [displayData]
  );

  const toggleIndicator = useCallback((ind: Indicator) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });
  }, []);

  const handleTickerSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = searchInput.trim().toUpperCase();
      if (t) {
        setTicker(t);
        setSelectedTicker(t);
      }
    },
    [searchInput, setSelectedTicker]
  );

  const showMA   = activeIndicators.has('MA');
  const showRSI  = activeIndicators.has('RSI');
  const showMACD = activeIndicators.has('MACD');

  // Y-axis width — must match what recharts renders so overlay aligns
  const Y_AXIS_WIDTH = 60;
  const CHART_MARGIN = { top: 8, right: Y_AXIS_WIDTH, left: 8, bottom: 0 };

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-5">

        {/* ── Header / Search ────────────────────────────────── */}
        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleTickerSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Search ticker…"
                className="w-48 pl-9 pr-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-off-white placeholder-off-white/25 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 font-mono transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-gold text-obsidian rounded-lg text-sm font-semibold hover:bg-gold-light transition-colors"
            >
              Go
            </button>
          </form>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-mono text-xl font-bold text-gold">{ticker.toUpperCase()}</span>
            <span className="text-off-white/50 text-sm hidden sm:inline">{tickerInfo.name}</span>
            <span className="font-mono text-2xl font-semibold text-off-white tabular-nums">
              {formatCurrency(currentClose)}
            </span>
            <span
              className={`text-sm font-mono font-semibold tabular-nums flex items-center gap-1 ${
                isGain ? 'text-gain' : 'text-loss'
              }`}
            >
              {isGain ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isGain ? '+' : ''}
              {totalChg.toFixed(2)} ({isGain ? '+' : ''}
              {totalChgPct.toFixed(2)}%)
            </span>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-1 ml-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
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

        {/* ── Indicator Toggles ───────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-off-white/30 uppercase tracking-wider mr-1">Indicators</span>
          {INDICATOR_CONFIG.map(({ id, label, color }) => {
            const active = activeIndicators.has(id);
            return (
              <button
                key={id}
                onClick={() => toggleIndicator(id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-semibold transition-all duration-150 ${
                  active
                    ? 'border-transparent text-obsidian'
                    : 'bg-transparent border-border text-off-white/40 hover:text-off-white hover:border-off-white/20'
                }`}
                style={active ? { backgroundColor: color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: active ? 'rgba(0,0,0,0.35)' : color, opacity: active ? 1 : 0.7 }}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Main Price Chart ────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} className="text-gold" />
            <span className="text-sm font-medium text-off-white/60">Price Chart</span>
            <span className="text-xs text-off-white/30 ml-auto font-mono">
              {timeframe} · OHLC · {displayData.length} bars
            </span>
          </div>

          {/* MA legend */}
          {showMA && (
            <div className="flex items-center gap-4 mb-2 text-xs flex-wrap">
              {displayData.some((d) => d.ma20 != null) && (
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-gold inline-block rounded" />
                  <span className="text-off-white/40">20 MA</span>
                </span>
              )}
              {displayData.some((d) => d.ma50 != null) && (
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 inline-block rounded" style={{ background: '#818cf8' }} />
                  <span className="text-off-white/40">50 MA</span>
                </span>
              )}
              {displayData.some((d) => d.ma200 != null) && (
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 inline-block rounded" style={{ background: '#c084fc' }} />
                  <span className="text-off-white/40">200 MA</span>
                </span>
              )}
            </div>
          )}

          {/* Chart wrapper — position relative so SVG overlay can be placed on top */}
          <div ref={chartContainerRef} className="relative" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={displayData} margin={CHART_MARGIN}>
                <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#5a5450', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a2a' }}
                  interval={Math.max(Math.floor(displayData.length / 7) - 1, 0)}
                />
                <YAxis
                  domain={[priceMin, priceMax]}
                  tick={{ fill: '#5a5450', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  width={Y_AXIS_WIDTH}
                  orientation="right"
                />
                <Tooltip content={<CandleTooltip />} />

                {/* Invisible bar just to register the data shape for recharts */}
                <Bar dataKey="close" fill="transparent" stroke="transparent" maxBarSize={0} />

                {/* Moving Averages — only when MA indicator active */}
                {showMA && (
                  <Line
                    type="monotone"
                    dataKey="ma20"
                    stroke="#c9a84c"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    name="MA20"
                  />
                )}
                {showMA && (
                  <Line
                    type="monotone"
                    dataKey="ma50"
                    stroke="#818cf8"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    name="MA50"
                  />
                )}
                {showMA && (
                  <Line
                    type="monotone"
                    dataKey="ma200"
                    stroke="#c084fc"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    name="MA200"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>

            {/* SVG Candlestick overlay */}
            <CandlestickSVGOverlay
              data={displayData}
              priceMin={priceMin}
              priceMax={priceMax}
              chartHeight={320}
              yAxisWidth={Y_AXIS_WIDTH}
              margin={CHART_MARGIN}
            />
          </div>
        </div>

        {/* ── Volume Chart ────────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-off-white/40" />
            <span className="text-sm font-medium text-off-white/60">Volume</span>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={volumeData} margin={{ top: 4, right: Y_AXIS_WIDTH, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis
                tick={{ fill: '#5a5450', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                width={Y_AXIS_WIDTH}
                orientation="right"
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: '#a09a8e', fontSize: 10 }}
                formatter={(v: number) => [`${(v / 1_000_000).toFixed(2)}M`, 'Volume']}
              />
              <Bar dataKey="volume" maxBarSize={8} radius={[1, 1, 0, 0]}>
                {volumeData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isGain ? '#c9a84c' : '#c9a84c'}
                    fillOpacity={0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Technical Indicators ────────────────────────────── */}
        {(showRSI || showMACD) && (
          <div
            className={`grid gap-5 ${showRSI && showMACD ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
          >
            {/* RSI */}
            {showRSI && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={13} className="text-blue-400" />
                    <span className="text-sm font-medium text-off-white/60">RSI (14)</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-loss/70">Overbought &gt; 70</span>
                    <span className="text-gain/70">Oversold &lt; 30</span>
                    <span className="font-mono text-blue-400 font-semibold">
                      {rsiChartData[rsiChartData.length - 1]?.rsi.toFixed(1)}
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <ComposedChart
                    data={rsiChartData}
                    margin={{ top: 4, right: Y_AXIS_WIDTH, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#5a5450', fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      ticks={[0, 30, 50, 70, 100]}
                      width={Y_AXIS_WIDTH}
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: 8,
                      }}
                      formatter={(v: number) => [v.toFixed(1), 'RSI']}
                    />
                    {/* Shaded zones */}
                    <ReferenceLine
                      y={70}
                      stroke="#c0453a"
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      label={{ value: '70', position: 'right', fill: '#c0453a', fontSize: 9 }}
                    />
                    <ReferenceLine
                      y={30}
                      stroke="#3d9e6e"
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      label={{ value: '30', position: 'right', fill: '#3d9e6e', fontSize: 9 }}
                    />
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
            {showMACD && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={13} className="text-emerald-400" />
                    <span className="text-sm font-medium text-off-white/60">MACD (12, 26, 9)</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />
                      <span className="text-off-white/40">MACD</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-orange-400 inline-block rounded" />
                      <span className="text-off-white/40">Signal</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 inline-block rounded-sm" style={{ background: '#3d9e6e', opacity: 0.7 }} />
                      <span className="text-off-white/40">Hist</span>
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <ComposedChart
                    data={macdChartData}
                    margin={{ top: 4, right: Y_AXIS_WIDTH, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis
                      tick={{ fill: '#5a5450', fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v.toFixed(1)}
                      width={Y_AXIS_WIDTH}
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: 8,
                      }}
                      formatter={(v: number | null) => [
                        v != null ? v.toFixed(3) : '—',
                        '',
                      ]}
                    />
                    <ReferenceLine y={0} stroke="#2a2a2a" />
                    <Bar dataKey="hist" maxBarSize={5}>
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
        )}
      </div>
    </div>
  );
}

// ── Candlestick SVG Overlay ────────────────────────────────────
// Renders real OHLC candles as an absolutely positioned SVG that
// sits on top of the recharts ComposedChart, sharing the same
// coordinate space by matching margins and axis widths exactly.

interface CandlestickSVGOverlayProps {
  data:        OHLCVBar[];
  priceMin:    number;
  priceMax:    number;
  chartHeight: number;
  yAxisWidth:  number;
  margin:      { top: number; right: number; left: number; bottom: number };
}

function CandlestickSVGOverlay({
  data,
  priceMin,
  priceMax,
  chartHeight,
  yAxisWidth,
  margin,
}: CandlestickSVGOverlayProps) {
  const n = data.length;
  if (n === 0) return null;

  const PAD_TOP    = margin.top;
  const PAD_BOTTOM = 30; // recharts default x-axis height
  const PAD_LEFT   = margin.left;
  // We leave right space for the y-axis; the SVG itself doesn't render there
  const plotH  = chartHeight - PAD_TOP - PAD_BOTTOM;
  const priceRange = priceMax - priceMin || 1;

  const scaleY = (price: number) =>
    PAD_TOP + plotH - ((price - priceMin) / priceRange) * plotH;

  // viewBox x is 0..1000 for the plot area (excluding y-axis gutter)
  const VW = 1000;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ right: yAxisWidth }}
    >
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${VW} ${chartHeight}`}
        preserveAspectRatio="none"
      >
        {data.map((bar, i) => {
          const slotW  = VW / n;
          const x      = PAD_LEFT / (1 - yAxisWidth / 1000) + i * slotW;
          // Center of bar slot in viewBox coords
          const slotX  = i * slotW;
          const cx     = slotX + slotW / 2;
          const barW   = Math.max(slotW * 0.65, 1);

          const isGain  = bar.close >= bar.open;
          const color   = isGain ? '#3d9e6e' : '#c0453a';
          const yHigh   = scaleY(bar.high);
          const yLow    = scaleY(bar.low);
          const yOpen   = scaleY(bar.open);
          const yClose  = scaleY(bar.close);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyH   = Math.max(Math.abs(yClose - yOpen), 1);

          return (
            <g key={i}>
              {/* Wick — thin line from high to low */}
              <line
                x1={cx}
                y1={yHigh}
                x2={cx}
                y2={yLow}
                stroke={color}
                strokeWidth={1}
              />
              {/* Body — open to close */}
              <rect
                x={cx - barW / 2}
                y={bodyTop}
                width={barW}
                height={bodyH}
                fill={color}
                fillOpacity={isGain ? 0.75 : 1}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
