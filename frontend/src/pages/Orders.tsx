/* ============================================================
   Obsidian Capital — Order History Page
   ============================================================ */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  X,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils/format';

// ── Types ─────────────────────────────────────────────────────

type OrderSide   = 'BUY' | 'SELL' | 'ALL';
type OrderStatus = 'filled' | 'cancelled' | 'pending' | 'partial' | 'ALL';

interface Order {
  id: string;
  date: string;
  ticker: string;
  company: string;
  type: 'BUY' | 'SELL';
  orderType: 'Market' | 'Limit' | 'Stop' | 'Stop Limit';
  shares: number;
  price: number;
  commission: number;
  total: number;
  status: 'filled' | 'cancelled' | 'pending' | 'partial';
}

// ── Mock Orders ───────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-0001',
    date: '2026-05-26T14:32:00Z',
    ticker: 'NVDA',
    company: 'NVIDIA Corp.',
    type: 'BUY',
    orderType: 'Market',
    shares: 20,
    price: 912.40,
    commission: 912.40,
    total: 19160.40,
    status: 'filled',
  },
  {
    id: 'ORD-0002',
    date: '2026-05-26T11:18:00Z',
    ticker: 'AAPL',
    company: 'Apple Inc.',
    type: 'SELL',
    orderType: 'Limit',
    shares: 25,
    price: 189.84,
    commission: 142.38,
    total: 4603.62,
    status: 'filled',
  },
  {
    id: 'ORD-0003',
    date: '2026-05-25T15:47:00Z',
    ticker: 'MSFT',
    company: 'Microsoft Corp.',
    type: 'BUY',
    orderType: 'Market',
    shares: 15,
    price: 418.32,
    commission: 376.49,
    total: 6650.29,
    status: 'filled',
  },
  {
    id: 'ORD-0004',
    date: '2026-05-25T10:05:00Z',
    ticker: 'TSLA',
    company: 'Tesla Inc.',
    type: 'BUY',
    orderType: 'Limit',
    shares: 40,
    price: 248.42,
    commission: 149.05,
    total: 9986.85,
    status: 'filled',
  },
  {
    id: 'ORD-0005',
    date: '2026-05-24T16:00:00Z',
    ticker: 'META',
    company: 'Meta Platforms',
    type: 'SELL',
    orderType: 'Market',
    shares: 10,
    price: 571.28,
    commission: 342.77,
    total: 5370.03,
    status: 'filled',
  },
  {
    id: 'ORD-0006',
    date: '2026-05-23T13:22:00Z',
    ticker: 'AMZN',
    company: 'Amazon.com Inc.',
    type: 'BUY',
    orderType: 'Market',
    shares: 30,
    price: 198.72,
    commission: 178.85,
    total: 6140.45,
    status: 'filled',
  },
  {
    id: 'ORD-0007',
    date: '2026-05-22T09:35:00Z',
    ticker: 'GOOGL',
    company: 'Alphabet Inc.',
    type: 'BUY',
    orderType: 'Limit',
    shares: 50,
    price: 171.96,
    commission: 128.97,
    total: 8726.97,
    status: 'filled',
  },
  {
    id: 'ORD-0008',
    date: '2026-05-21T14:11:00Z',
    ticker: 'JPM',
    company: 'JPMorgan Chase',
    type: 'SELL',
    orderType: 'Stop',
    shares: 20,
    price: 224.58,
    commission: 134.75,
    total: 4356.85,
    status: 'filled',
  },
  {
    id: 'ORD-0009',
    date: '2026-05-20T10:50:00Z',
    ticker: 'NVDA',
    company: 'NVIDIA Corp.',
    type: 'BUY',
    orderType: 'Market',
    shares: 5,
    price: 897.12,
    commission: 269.14,
    total: 4754.74,
    status: 'cancelled',
  },
  {
    id: 'ORD-0010',
    date: '2026-05-19T15:30:00Z',
    ticker: 'V',
    company: 'Visa Inc.',
    type: 'BUY',
    orderType: 'Limit',
    shares: 35,
    price: 289.34,
    commission: 173.60,
    total: 10299.50,
    status: 'filled',
  },
  {
    id: 'ORD-0011',
    date: '2026-05-16T11:02:00Z',
    ticker: 'BRK.B',
    company: 'Berkshire Hathaway B',
    type: 'BUY',
    orderType: 'Market',
    shares: 12,
    price: 452.80,
    commission: 163.01,
    total: 5596.61,
    status: 'filled',
  },
  {
    id: 'ORD-0012',
    date: '2026-05-15T14:48:00Z',
    ticker: 'AAPL',
    company: 'Apple Inc.',
    type: 'BUY',
    orderType: 'Market',
    shares: 50,
    price: 185.20,
    commission: 555.60,
    total: 9815.60,
    status: 'filled',
  },
  {
    id: 'ORD-0013',
    date: '2026-05-14T09:45:00Z',
    ticker: 'TSLA',
    company: 'Tesla Inc.',
    type: 'SELL',
    orderType: 'Stop Limit',
    shares: 25,
    price: 231.15,
    commission: 138.69,
    total: 5639.56,
    status: 'partial',
  },
  {
    id: 'ORD-0014',
    date: '2026-05-13T16:55:00Z',
    ticker: 'MSFT',
    company: 'Microsoft Corp.',
    type: 'SELL',
    orderType: 'Limit',
    shares: 8,
    price: 412.88,
    commission: 99.09,
    total: 3203.95,
    status: 'filled',
  },
  {
    id: 'ORD-0015',
    date: '2026-05-12T13:17:00Z',
    ticker: 'GLD',
    company: 'SPDR Gold Trust ETF',
    type: 'BUY',
    orderType: 'Market',
    shares: 100,
    price: 235.80,
    commission: 1415.00,
    total: 25,
    status: 'pending',
  },
];

// Fix GLD total
MOCK_ORDERS[14].total = 235.80 * 100 + 1415.00;

// ── Status badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: Order['status'] }) {
  const config = {
    filled:    { color: 'bg-gain/10 text-gain border-gain/20',          icon: <Check size={10} />,      label: 'Filled'    },
    cancelled: { color: 'bg-loss/10 text-loss border-loss/20',          icon: <X size={10} />,          label: 'Cancelled' },
    pending:   { color: 'bg-gold/10 text-gold border-gold/20',          icon: <Clock size={10} />,      label: 'Pending'   },
    partial:   { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <RefreshCw size={10} />, label: 'Partial'   },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ── Summary stat card ─────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-2 p-4">
      <div className="text-xs text-off-white/40 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-mono font-semibold tabular-nums text-off-white">{value}</div>
      {sub && <div className="text-xs text-off-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Export CSV ────────────────────────────────────────────────

function exportToCSV(orders: Order[]) {
  const headers = ['Order ID', 'Date/Time', 'Ticker', 'Company', 'Type', 'Order Type', 'Shares', 'Price', 'Commission', 'Total', 'Status'];
  const rows = orders.map((o) => [
    o.id,
    formatDateTime(o.date),
    o.ticker,
    `"${o.company}"`,
    o.type,
    o.orderType,
    o.shares,
    o.price.toFixed(2),
    o.commission.toFixed(2),
    o.total.toFixed(2),
    o.status,
  ]);
  const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `obsidian-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Orders Page ───────────────────────────────────────────────

const PAGE_SIZE = 8;

type SortKey = 'date' | 'ticker' | 'type' | 'shares' | 'price' | 'commission' | 'total' | 'status';

export default function Orders() {
  const [sideFilter, setSideFilter]     = useState<OrderSide>('ALL');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('ALL');
  const [tickerSearch, setTickerSearch] = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [sortKey, setSortKey]           = useState<SortKey>('date');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [page, setPage]                 = useState(1);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }, [sortKey]);

  const filtered = useMemo(() => {
    let data = [...MOCK_ORDERS];
    if (sideFilter !== 'ALL')   data = data.filter((o) => o.type === sideFilter);
    if (statusFilter !== 'ALL') data = data.filter((o) => o.status === statusFilter);
    if (tickerSearch.trim())    data = data.filter((o) => o.ticker.includes(tickerSearch.trim().toUpperCase()) || o.company.toLowerCase().includes(tickerSearch.toLowerCase()));
    if (dateFrom)               data = data.filter((o) => new Date(o.date) >= new Date(dateFrom));
    if (dateTo)                 data = data.filter((o) => new Date(o.date) <= new Date(dateTo + 'T23:59:59Z'));

    data.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case 'date':       av = a.date;       bv = b.date;       break;
        case 'ticker':     av = a.ticker;     bv = b.ticker;     break;
        case 'type':       av = a.type;       bv = b.type;       break;
        case 'shares':     av = a.shares;     bv = b.shares;     break;
        case 'price':      av = a.price;      bv = b.price;      break;
        case 'commission': av = a.commission; bv = b.commission; break;
        case 'total':      av = a.total;      bv = b.total;      break;
        case 'status':     av = a.status;     bv = b.status;     break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [sideFilter, statusFilter, tickerSearch, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summaryStats = useMemo(() => {
    const filled = MOCK_ORDERS.filter((o) => o.status === 'filled');
    const buys   = filled.filter((o) => o.type === 'BUY');
    const sells  = filled.filter((o) => o.type === 'SELL');
    return {
      totalTrades:     filled.length,
      totalCommission: filled.reduce((s, o) => s + o.commission, 0),
      buyVolume:       buys.reduce((s, o) => s + o.total, 0),
      sellVolume:      sells.reduce((s, o) => s + o.total, 0),
    };
  }, []);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={10} className="opacity-25" />;
    return (
      <span className="text-gold text-xs">
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    );
  }

  function ThBtn({ col, children }: { col: SortKey; children: React.ReactNode }) {
    return (
      <button
        onClick={() => handleSort(col)}
        className="flex items-center gap-1 text-xs font-medium text-off-white/40 uppercase tracking-wider hover:text-off-white/70 transition-colors"
      >
        {children}
        <SortIcon col={col} />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium text-off-white">Order History</h1>
            <p className="text-sm text-off-white/40 mt-1">{MOCK_ORDERS.length} total orders</p>
          </div>
          <button
            onClick={() => exportToCSV(filtered)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-off-white/70 hover:border-gold/40 hover:text-off-white transition-colors duration-150"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* ── Summary Stats ────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard
            label="Total Trades"
            value={summaryStats.totalTrades.toString()}
            sub="Filled orders"
          />
          <SummaryCard
            label="Total Commission"
            value={formatCurrency(summaryStats.totalCommission)}
            sub="All filled orders"
          />
          <SummaryCard
            label="Buy Volume"
            value={formatCurrency(summaryStats.buyVolume)}
            sub="Total purchased"
          />
          <SummaryCard
            label="Sell Volume"
            value={formatCurrency(summaryStats.sellVolume)}
            sub="Total sold"
          />
        </div>

        {/* ── Filter Bar ───────────────────────────────────────── */}
        <div className="card-2 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={13} className="text-gold" />
            <span className="text-sm font-medium text-off-white/60">Filters</span>
            <button
              onClick={() => { setSideFilter('ALL'); setStatusFilter('ALL'); setTickerSearch(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="ml-auto text-xs text-off-white/30 hover:text-off-white/60 transition-colors"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Ticker search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/30" />
              <input
                type="text"
                value={tickerSearch}
                onChange={(e) => { setTickerSearch(e.target.value); setPage(1); }}
                placeholder="Search ticker or company…"
                className="w-full pl-8 pr-3 py-2 bg-surface-3 border border-border rounded-lg text-xs text-off-white placeholder-off-white/25 focus:outline-none focus:border-gold/40 transition-colors font-mono"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-off-white/30">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-surface-3 border border-border rounded-lg text-xs text-off-white focus:outline-none focus:border-gold/40 transition-colors [color-scheme:dark]"
              />
              <span className="text-xs text-off-white/30">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-surface-3 border border-border rounded-lg text-xs text-off-white focus:outline-none focus:border-gold/40 transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Buy/Sell toggle */}
            <div className="flex items-center bg-surface-3 border border-border rounded-lg p-0.5">
              {(['ALL', 'BUY', 'SELL'] as OrderSide[]).map((side) => (
                <button
                  key={side}
                  onClick={() => { setSideFilter(side); setPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    sideFilter === side
                      ? side === 'BUY'
                        ? 'bg-gold text-obsidian'
                        : side === 'SELL'
                        ? 'bg-loss text-white'
                        : 'bg-surface text-off-white'
                      : 'text-off-white/40 hover:text-off-white'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus); setPage(1); }}
              className="px-3 py-2 bg-surface-3 border border-border rounded-lg text-xs text-off-white focus:outline-none focus:border-gold/40 transition-colors appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="filled">Filled</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ── Orders Table ─────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-medium text-off-white">Orders</h2>
              <span className="text-xs text-off-white/30">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  {[
                    { col: 'date'       as SortKey, label: 'Date / Time'   },
                    { col: 'ticker'     as SortKey, label: 'Ticker'        },
                    { col: 'type'       as SortKey, label: 'Type'          },
                    { col: null,                    label: 'Order'         },
                    { col: 'shares'     as SortKey, label: 'Shares'        },
                    { col: 'price'      as SortKey, label: 'Price'         },
                    { col: 'commission' as SortKey, label: 'Commission'    },
                    { col: 'total'      as SortKey, label: 'Total'         },
                    { col: 'status'     as SortKey, label: 'Status'        },
                  ].map(({ col, label }) => (
                    <th key={label} className="text-left py-3 px-4">
                      {col ? <ThBtn col={col}>{label}</ThBtn> : (
                        <span className="text-xs font-medium text-off-white/40 uppercase tracking-wider">{label}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-off-white/30 text-sm">
                      No orders match your filters.
                    </td>
                  </tr>
                ) : (
                  pageData.map((order, i) => (
                    <tr
                      key={order.id}
                      className={`border-b border-border/50 transition-colors duration-150 hover:bg-surface-3/60 ${
                        i % 2 === 0 ? 'bg-surface-2/20' : 'bg-surface-3/10'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-off-white">
                          {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="font-mono text-xs text-off-white/40">
                          {new Date(order.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-gold text-sm">{order.ticker}</div>
                        <div className="text-xs text-off-white/40 mt-0.5 max-w-[140px] truncate">{order.company}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                          order.type === 'BUY'
                            ? 'bg-gold/15 text-gold border border-gold/30'
                            : 'bg-loss/15 text-loss border border-loss/30'
                        }`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-off-white/50">{order.orderType}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-sm text-off-white">{order.shares.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-sm text-off-white">{formatCurrency(order.price)}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-sm text-gold/70">{formatCurrency(order.commission)}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-sm font-medium text-off-white">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-2/30">
              <span className="text-xs text-off-white/30">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-surface-3 text-off-white/50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded text-xs font-mono transition-colors ${
                      p === page
                        ? 'bg-gold text-obsidian font-semibold'
                        : 'text-off-white/50 hover:bg-surface-3 hover:text-off-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-surface-3 text-off-white/50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
