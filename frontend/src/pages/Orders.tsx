/* Obsidian Capital — Orders (Apple Liquid Glass) */
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { tradesApi } from '@/services/api';

type FilterType = 'all' | 'open' | 'filled' | 'canceled';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'open',     label: 'Open'     },
  { key: 'filled',   label: 'Filled'   },
  { key: 'canceled', label: 'Canceled' },
];

interface Order {
  id: string;
  symbol?: string;
  ticker?: string;
  side: 'buy' | 'sell';
  type?: string;
  order_type?: string;
  qty?: number | string;
  filled_qty?: number | string;
  price?: number | string;
  filled_avg_price?: number | string;
  commission?: number;
  status: string;
  submitted_at?: string;
  created_at?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
const toNum = (v: unknown) => (typeof v === 'number' ? v : parseFloat(String(v)) || 0);

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    ...(s === 'filled' || s === 'complete'
      ? { background: 'rgba(52,199,89,0.10)', color: '#34c759', border: '1px solid rgba(52,199,89,0.20)' }
      : s === 'canceled' || s === 'cancelled' || s === 'expired'
      ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.10)' }
      : { background: 'rgba(201,165,78,0.10)', color: '#c9a54e', border: '1px solid rgba(201,165,78,0.20)' }),
  };
  return <span style={style}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function OrdersSkeleton() {
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="skeleton" style={{ height: '28px', width: '120px', marginBottom: '24px' }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '8px', marginBottom: '4px' }} />
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [filter, setFilter]     = useState<FilterType>('all');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await tradesApi.getOrders();
      setOrders(
        Array.isArray((res as Record<string, unknown>).orders)
          ? (res as Record<string, unknown>).orders as Order[]
          : Array.isArray(res)
          ? res as Order[]
          : []
      );
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    const s = o.status.toLowerCase();
    if (filter === 'filled')   return s === 'filled' || s === 'complete';
    if (filter === 'canceled') return s === 'canceled' || s === 'cancelled' || s === 'expired';
    if (filter === 'open')     return s === 'new' || s === 'accepted' || s === 'pending_new' || s === 'partially_filled';
    return true;
  });

  if (loading) return <OrdersSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.90)',
              letterSpacing: '-0.02em',
              marginBottom: '3px',
            }}
          >
            Orders
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>
            Your order history and active positions
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className="btn btn-glass btn-sm"
          disabled={refreshing}
          style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <RefreshCw
            size={13}
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        <Filter
          size={14}
          style={{ color: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginRight: '4px' }}
        />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: f.key === filter ? 500 : 300,
              cursor: 'pointer',
              background: f.key === filter ? 'rgba(255,255,255,0.10)' : 'transparent',
              border:
                f.key === filter
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid rgba(255,255,255,0.05)',
              color:
                f.key === filter ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.40)',
              transition: 'all 200ms ease',
            }}
          >
            {f.label}
            {f.key === filter && orders.length > 0 && (
              <span style={{ marginLeft: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.40)' }}>
                {filtered.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(255,59,48,0.06)',
            border: '1px solid rgba(255,59,48,0.12)',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'rgba(255,59,48,0.80)',
            fontWeight: 300,
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.40)', fontWeight: 300 }}>
              No orders yet
            </p>
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.25)',
                fontWeight: 300,
                marginTop: '6px',
              }}
            >
              Your executed and pending orders will appear here
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Symbol', 'Side', 'Type', 'Qty', 'Price', 'Commission', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 20px',
                          textAlign:
                            h === 'Date' || h === 'Symbol' || h === 'Side' ? 'left' : 'right',
                          fontSize: '10px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.30)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const ticker = o.symbol ?? o.ticker ?? '—';
                  const price  = toNum(o.filled_avg_price ?? o.price);
                  const qty    = toNum(o.filled_qty ?? o.qty);
                  const ts     = o.submitted_at ?? o.created_at;
                  const date   = ts
                    ? new Date(ts).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';
                  const isBuy = o.side === 'buy';

                  return (
                    <tr
                      key={o.id}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: '12px',
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.40)',
                        }}
                      >
                        {date}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.85)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {ticker}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isBuy ? '#34c759' : '#ff3b30',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {o.side}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          textAlign: 'right',
                          fontSize: '12px',
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.50)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {(o.type ?? o.order_type ?? 'market').replace('_', ' ')}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.70)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {qty}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.70)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {price > 0 ? fmt(price) : '—'}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.50)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {o.commission != null ? fmt(o.commission) : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
