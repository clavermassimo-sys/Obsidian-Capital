/* ============================================================
   Obsidian Capital — Charts Page (TradingView Lightweight Charts)
   Real candlestick charts via lightweight-charts library,
   with volume, MAs, RSI, MACD via recharts.
   ============================================================ */

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
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
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  BarChart2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrading } from '@/contexts/TradingContext';
import { formatCurrency } from '@/utils/format';

// ── Types ─────────────────────────────────────────────────────

type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'All';
type ChartType = 'candlestick' | 'line' | 'area';
type MAToggle = '20EMA' | '50EMA' | '200SMA';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1M', '1Y', 'All'];

// ── Chart color scheme ────────────────────────────────────────

const CHART_OPTIONS = {
  layout: {
    background: { type: ColorType.Solid, color: '#111111' },
    textColor: '#f0ede8',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
  },
  grid: {
    vertLines: { color: '#1e1e1e' },
    horzLines: { color: '#1e1e1e' },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: '#c9a84c', width: 1 as const, style: 2 as const, labelBackgroundColor: '#222222' },
    horzLine: { color: '#c9a84c', width: 1 as const, style: 2 as const, labelBackgroundColor: '#222222' },
  },
  rightPriceScale: {
    borderColor: '#2a2a2a',
    scaleMargins: { top: 0.1, bottom: 0.1 },
  },
  timeScale: {
    borderColor: '#2a2a2a',
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 5,
    minBarSpacing: 3,
  },
  handleScroll: true,
  handleScale: true,
} as const;

// ── Mock Stock Universe ───────────────────────────────────────

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
  SPY:   { price: 531.20, name: 'SPDR S&P 500 ETF' },
  QQQ:   { price: 468.12, name: 'Invesco QQQ Trust' },
  GLD:   { price: 238.40, name: 'SPDR Gold Trust ETF' },
};

// ── Seeded PRNG ────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ── Mock Candle Generator ─────────────────────────────────────

interface OHLCVBar {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function generateMockCandles(ticker: string, timeframe: Timeframe): OHLCVBar[] {
  const base = TICKER_BASE[ticker.toUpperCase()]?.price ?? 150;
  const tickerSeed = ticker.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const tfSeed = timeframe.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = seededRng((tickerSeed * 31 + tfSeed) & 0x7fffffff);

  // Bar count and interval in seconds
  const config: Record<Timeframe, { count: number; intervalSec: number }> = {
    '1m':  { count: 390,  intervalSec: 60 },
    '5m':  { count: 288,  intervalSec: 300 },
    '15m': { count: 200,  intervalSec: 900 },
    '1H':  { count: 500,  intervalSec: 3600 },
    '4H':  { count: 300,  intervalSec: 14400 },
    '1D':  { count: 365,  intervalSec: 86400 },
    '1W':  { count: 104,  intervalSec: 604800 },
    '1M':  { count: 48,   intervalSec: 2592000 },
    '1Y':  { count: 10,   intervalSec: 31536000 },
    'All': { count: 500,  intervalSec: 86400 },
  };

  const { count, intervalSec } = config[timeframe];
  const refTime = Math.floor(new Date('2026-05-26T20:00:00Z').getTime() / 1000);

  const bars: OHLCVBar[] = [];
  let price = base * (0.75 + rng() * 0.20);

  for (let i = 0; i < count; i++) {
    const volatility = 0.010 + rng() * 0.012;
    const drift = (rng() - 0.47) * 0.002;
    const open = price;
    const close = Math.max(0.01, open * (1 + drift + (rng() - 0.5) * volatility));
    const high = Math.max(open, close) * (1 + rng() * 0.004);
    const low = Math.min(open, close) * (1 - rng() * 0.004);
    const volume = Math.round(1_500_000 + rng() * 30_000_000);
    const t = refTime - (count - 1 - i) * intervalSec;

    bars.push({ time: t, open, high, low, close, volume });
    price = close;
  }

  return bars;
}

// ── Compute EMA/SMA ───────────────────────────────────────────

function computeEMA(values: number[], period: number): (number | null)[] {
  if (values.length < period) return values.map(() => null);
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

function computeSMA(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    return values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  });
}

// ── Compute RSI ────────────────────────────────────────────────

function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) avgGain += change / period;
    else avgLoss += Math.abs(change) / period;
  }
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

// ── Compute MACD ───────────────────────────────────────────────

function computeMACD(closes: number[]): {
  macd: (number | null)[];
  signal: (number | null)[];
  hist: (number | null)[];
} {
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macd = closes.map((_, i) =>
    ema12[i] != null && ema26[i] != null ? (ema12[i] as number) - (ema26[i] as number) : null
  );
  const macdNonNull = macd.filter((v): v is number => v !== null);
  const sigRaw = computeEMA(macdNonNull, 9);
  const signal: (number | null)[] = new Array(closes.length).fill(null);
  let sIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macd[i] !== null) { signal[i] = sigRaw[sIdx] ?? null; sIdx++; }
  }
  const hist = closes.map((_, i) =>
    macd[i] != null && signal[i] != null ? (macd[i] as number) - (signal[i] as number) : null
  );
  return { macd, signal, hist };
}

// ── SearchBar ─────────────────────────────────────────────────

interface StockResult { ticker: string; name: string; price: number; }

const SEARCH_STOCKS: StockResult[] = Object.entries(TICKER_BASE).map(([t, v]) => ({
  ticker: t, name: v.name, price: v.price,
}));

function searchTickers(query: string): StockResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return SEARCH_STOCKS.filter(
    (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 8);
}

// ── Charts Page ───────────────────────────────────────────────

export default function Charts() {
  const { setSelectedTicker, addToWatchlist } = useTrading();
  const navigate = useNavigate();

  const [ticker, setTicker]                 = useState('AAPL');
  const [searchInput, setSearchInput]       = useState('');
  const [searchResults, setSearchResults]   = useState<StockResult[]>([]);
  const [showSearch, setShowSearch]         = useState(false);
  const [timeframe, setTimeframe]           = useState<Timeframe>('1D');
  const [chartType, setChartType]           = useState<ChartType>('candlestick');
  const [activeMA, setActiveMA]             = useState<Set<MAToggle>>(new Set(['20EMA']));
  const [showRSI, setShowRSI]               = useState(false);
  const [showMACD, setShowMACD]             = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const mainSeriesRef   = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null);
  const volumeChartRef  = useRef<IChartApi | null>(null);
  const maSeriesRefs    = useRef<ISeriesApi<'Line'>[]>([]);
  const searchRef       = useRef<HTMLDivElement>(null);

  const tickerInfo = TICKER_BASE[ticker.toUpperCase()] ?? { price: 150, name: ticker };

  const candles = useMemo(() => generateMockCandles(ticker, timeframe), [ticker, timeframe]);

  const closes  = useMemo(() => candles.map((c) => c.close), [candles]);
  const ema20   = useMemo(() => computeEMA(closes, 20), [closes]);
  const ema50   = useMemo(() => computeEMA(closes, 50), [closes]);
  const sma200  = useMemo(() => computeSMA(closes, 200), [closes]);
  const rsiData = useMemo(() => computeRSI(closes), [closes]);
  const macdRes = useMemo(() => computeMACD(closes), [closes]);

  const currentClose = candles[candles.length - 1]?.close ?? tickerInfo.price;
  const firstOpen    = candles[0]?.open ?? currentClose;
  const totalChg     = currentClose - firstOpen;
  const totalChgPct  = firstOpen > 0 ? (totalChg / firstOpen) * 100 : 0;
  const isGain       = totalChg >= 0;

  // ── Indicator chart data ──────────────────────────────────

  const rsiChartData = useMemo(
    () => candles.map((c, i) => ({ time: String(i), rsi: Math.round(rsiData[i] * 10) / 10 })),
    [candles, rsiData]
  );

  const macdChartData = useMemo(
    () => candles.map((c, i) => ({
      time: String(i),
      macd: macdRes.macd[i],
      signal: macdRes.signal[i],
      hist: macdRes.hist[i],
    })),
    [candles, macdRes]
  );

  // ── Build/rebuild main chart ──────────────────────────────

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Destroy previous
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      maSeriesRefs.current = [];
    }

    const chart = createChart(container, {
      ...CHART_OPTIONS,
      width: container.clientWidth,
      height: container.clientHeight,
    });
    chartRef.current = chart;

    let mainSeries: ISeriesApi<'Candlestick' | 'Line' | 'Area'>;

    if (chartType === 'candlestick') {
      const cs = chart.addCandlestickSeries({
        upColor: '#3d9e6e',
        downColor: '#c0453a',
        borderUpColor: '#3d9e6e',
        borderDownColor: '#c0453a',
        wickUpColor: '#3d9e6e',
        wickDownColor: '#c0453a',
      });
      const data: CandlestickData[] = candles.map((c) => ({
        time: c.time as CandlestickData['time'],
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      cs.setData(data);
      mainSeries = cs as ISeriesApi<'Candlestick'>;
    } else if (chartType === 'line') {
      const ls = chart.addLineSeries({
        color: '#c9a84c',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      const data: LineData[] = candles.map((c) => ({
        time: c.time as LineData['time'],
        value: c.close,
      }));
      ls.setData(data);
      mainSeries = ls as ISeriesApi<'Line'>;
    } else {
      const as = chart.addAreaSeries({
        lineColor: '#c9a84c',
        topColor: 'rgba(201,168,76,0.25)',
        bottomColor: 'rgba(201,168,76,0.02)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
      });
      const data: LineData[] = candles.map((c) => ({
        time: c.time as LineData['time'],
        value: c.close,
      }));
      as.setData(data);
      mainSeries = as as ISeriesApi<'Area'>;
    }
    mainSeriesRef.current = mainSeries;

    // Moving averages
    const newMaSeries: ISeriesApi<'Line'>[] = [];
    const maConfigs: { toggle: MAToggle; values: (number | null)[]; color: string; title: string }[] = [
      { toggle: '20EMA',  values: ema20,  color: '#c9a84c', title: '20 EMA' },
      { toggle: '50EMA',  values: ema50,  color: '#60a5fa', title: '50 EMA' },
      { toggle: '200SMA', values: sma200, color: '#c084fc', title: '200 SMA' },
    ];
    maConfigs.forEach(({ toggle, values, color, title }) => {
      if (!activeMA.has(toggle)) return;
      const maSeries = chart.addLineSeries({
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        title,
      });
      const maData: LineData[] = candles
        .map((c, i) => values[i] != null ? { time: c.time as LineData['time'], value: values[i] as number } : null)
        .filter((d): d is LineData => d !== null);
      maSeries.setData(maData);
      newMaSeries.push(maSeries);
    });
    maSeriesRefs.current = newMaSeries;

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && chartRef.current) {
        chartRef.current.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, timeframe, chartType]);

  // Rebuild MA overlays when toggled (without full chart rebuild)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    maSeriesRefs.current.forEach((s) => { try { chart.removeSeries(s); } catch { /* ignore */ } });
    maSeriesRefs.current = [];

    const maConfigs: { toggle: MAToggle; values: (number | null)[]; color: string; title: string }[] = [
      { toggle: '20EMA',  values: ema20,  color: '#c9a84c', title: '20 EMA' },
      { toggle: '50EMA',  values: ema50,  color: '#60a5fa', title: '50 EMA' },
      { toggle: '200SMA', values: sma200, color: '#c084fc', title: '200 SMA' },
    ];
    const newMaSeries: ISeriesApi<'Line'>[] = [];
    maConfigs.forEach(({ toggle, values, color, title }) => {
      if (!activeMA.has(toggle)) return;
      const maSeries = chart.addLineSeries({
        color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title,
      });
      const maData: LineData[] = candles
        .map((c, i) => values[i] != null ? { time: c.time as LineData['time'], value: values[i] as number } : null)
        .filter((d): d is LineData => d !== null);
      maSeries.setData(maData);
      newMaSeries.push(maSeries);
    });
    maSeriesRefs.current = newMaSeries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMA]);

  // ── Volume chart ──────────────────────────────────────────

  useEffect(() => {
    const container = volumeContainerRef.current;
    if (!container) return;

    if (volumeChartRef.current) {
      volumeChartRef.current.remove();
      volumeChartRef.current = null;
    }

    const chart = createChart(container, {
      ...CHART_OPTIONS,
      width: container.clientWidth,
      height: container.clientHeight,
      rightPriceScale: { borderColor: '#2a2a2a', scaleMargins: { top: 0.2, bottom: 0 } },
      timeScale: { borderColor: '#2a2a2a', visible: false },
    });
    volumeChartRef.current = chart;

    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
    });
    const volData: HistogramData[] = candles.map((c) => ({
      time: c.time as HistogramData['time'],
      value: c.volume,
      color: c.close >= c.open ? 'rgba(61,158,110,0.5)' : 'rgba(192,69,58,0.5)',
    }));
    volSeries.setData(volData);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && volumeChartRef.current) {
        volumeChartRef.current.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      volumeChartRef.current = null;
    };
  }, [ticker, timeframe]);

  // ── Search ────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchResults(searchTickers(searchInput));
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Close search on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function selectTicker(t: string) {
    setTicker(t.toUpperCase());
    setSearchInput('');
    setShowSearch(false);
    setSelectedTicker(t.toUpperCase());
  }

  const toggleMA = useCallback((ma: MAToggle) => {
    setActiveMA((prev) => {
      const next = new Set(prev);
      if (next.has(ma)) next.delete(ma); else next.add(ma);
      return next;
    });
  }, []);

  function handleAddToWatchlist() {
    const info = TICKER_BASE[ticker];
    if (!info) return;
    addToWatchlist({
      ticker,
      companyName: info.name,
      price: currentClose,
      change: totalChg,
      changePct: totalChgPct,
      volume: candles[candles.length - 1]?.volume ?? 0,
    });
  }

  function handleTrade() {
    setSelectedTicker(ticker);
    navigate('/trade');
  }

  const Y_AXIS_WIDTH = 60;

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-5">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4">

          {/* Search */}
          <div ref={searchRef} className="relative">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value.toUpperCase()); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search ticker…"
                  className="w-48 pl-9 pr-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-off-white placeholder-off-white/25 focus:outline-none focus:border-gold/50 font-mono transition-colors"
                />
              </div>
            </div>

            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-lg border border-border bg-surface-2 shadow-surface-lg z-30 overflow-hidden">
                {searchResults.map((s) => (
                  <button
                    key={s.ticker}
                    onClick={() => selectTicker(s.ticker)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-3 transition-colors text-left border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-mono font-semibold text-off-white">{s.ticker}</p>
                      <p className="text-xs text-[#a09a8e] truncate max-w-[140px]">{s.name}</p>
                    </div>
                    <p className="text-sm font-mono text-off-white">{formatCurrency(s.price)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price display */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-mono text-xl font-bold text-gold">{ticker}</span>
            <span className="text-off-white/50 text-sm hidden sm:inline">{tickerInfo.name}</span>
            <span className="font-mono text-2xl font-semibold text-off-white tabular-nums">
              {formatCurrency(currentClose)}
            </span>
            <span className={`text-sm font-mono font-semibold flex items-center gap-1 ${isGain ? 'text-gain' : 'text-loss'}`}>
              {isGain ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isGain ? '+' : ''}{totalChg.toFixed(2)} ({isGain ? '+' : ''}{totalChgPct.toFixed(2)}%)
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleAddToWatchlist}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface-2 text-xs font-semibold text-[#a09a8e] hover:text-off-white hover:bg-surface-3 transition-colors"
            >
              <Plus size={13} /> Watchlist
            </button>
            <button
              onClick={handleTrade}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-obsidian text-xs font-bold hover:brightness-110 transition-all"
            >
              Trade
            </button>
          </div>
        </div>

        {/* ── Chart Type + Timeframe Row ─────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chart type */}
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-1">
            {(['candlestick', 'line', 'area'] as ChartType[]).map((ct) => (
              <button
                key={ct}
                onClick={() => setChartType(ct)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  chartType === ct ? 'bg-gold text-obsidian' : 'text-off-white/50 hover:text-off-white hover:bg-surface-3'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>

          {/* Timeframe */}
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  timeframe === tf ? 'bg-gold text-obsidian' : 'text-off-white/50 hover:text-off-white hover:bg-surface-3'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* ── MA Toggles ────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-off-white/30 uppercase tracking-wider mr-1">Overlays</span>
          {([
            { id: '20EMA' as MAToggle, label: '20 EMA', color: '#c9a84c' },
            { id: '50EMA' as MAToggle, label: '50 EMA', color: '#60a5fa' },
            { id: '200SMA' as MAToggle, label: '200 SMA', color: '#c084fc' },
          ]).map(({ id, label, color }) => {
            const active = activeMA.has(id);
            return (
              <button
                key={id}
                onClick={() => toggleMA(id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
                  active ? 'border-transparent text-obsidian' : 'bg-transparent border-border text-off-white/40 hover:text-off-white hover:border-off-white/20'
                }`}
                style={active ? { backgroundColor: color } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? 'rgba(0,0,0,0.35)' : color, opacity: active ? 1 : 0.6 }} />
                {label}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-off-white/30 uppercase tracking-wider">Indicators</span>
            <button
              onClick={() => setShowRSI((v) => !v)}
              className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${showRSI ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'border-border text-off-white/40 hover:text-off-white'}`}
            >
              RSI
            </button>
            <button
              onClick={() => setShowMACD((v) => !v)}
              className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${showMACD ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-border text-off-white/40 hover:text-off-white'}`}
            >
              MACD
            </button>
          </div>
        </div>

        {/* ── Main LightweightCharts Canvas ─────────────────── */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <BarChart2 size={14} className="text-gold" />
            <span className="text-sm font-medium text-off-white/60">
              {ticker} · {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
            </span>
            <span className="text-xs text-off-white/30 ml-auto font-mono">{timeframe} · {candles.length} bars</span>
          </div>
          {/* Main chart: 80% of combined chart+volume */}
          <div
            ref={chartContainerRef}
            style={{ height: 400, width: '100%' }}
          />
        </div>

        {/* ── Volume Chart ──────────────────────────────────── */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Activity size={14} className="text-off-white/40" />
            <span className="text-sm font-medium text-off-white/60">Volume</span>
          </div>
          <div ref={volumeContainerRef} style={{ height: 100, width: '100%' }} />
        </div>

        {/* ── Technical Indicators ──────────────────────────── */}
        {(showRSI || showMACD) && (
          <div className={`grid gap-5 ${showRSI && showMACD ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
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
                  <ComposedChart data={rsiChartData} margin={{ top: 4, right: Y_AXIS_WIDTH, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} tick={{ fill: '#5a5450', fontSize: 9 }} tickLine={false} axisLine={false} ticks={[0, 30, 50, 70, 100]} width={Y_AXIS_WIDTH} orientation="right" />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }} formatter={(v: number) => [v.toFixed(1), 'RSI']} />
                    <ReferenceLine y={70} stroke="#c0453a" strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: '70', position: 'right', fill: '#c0453a', fontSize: 9 }} />
                    <ReferenceLine y={30} stroke="#3d9e6e" strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: '30', position: 'right', fill: '#3d9e6e', fontSize: 9 }} />
                    <ReferenceLine y={50} stroke="#2a2a2a" strokeDasharray="2 4" />
                    <Line type="monotone" dataKey="rsi" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {showMACD && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={13} className="text-emerald-400" />
                    <span className="text-sm font-medium text-off-white/60">MACD (12, 26, 9)</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" /><span className="text-off-white/40">MACD</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" /><span className="text-off-white/40">Signal</span></span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <ComposedChart data={macdChartData} margin={{ top: 4, right: Y_AXIS_WIDTH, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis tick={{ fill: '#5a5450', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(1)} width={Y_AXIS_WIDTH} orientation="right" />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }} formatter={(v: number | null) => [v != null ? v.toFixed(3) : '—', '']} />
                    <ReferenceLine y={0} stroke="#2a2a2a" />
                    <Bar dataKey="hist" maxBarSize={5}>
                      {macdChartData.map((entry, idx) => (
                        <Cell key={idx} fill={(entry.hist ?? 0) >= 0 ? '#3d9e6e' : '#c0453a'} fillOpacity={0.7} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="macd" stroke="#34d399" strokeWidth={1.5} dot={false} connectNulls name="MACD" />
                    <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={1.5} dot={false} connectNulls name="Signal" />
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
