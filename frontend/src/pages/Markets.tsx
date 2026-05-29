/* Obsidian Capital — Markets (Apple Liquid Glass) */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { marketApi } from '@/services/api';

// ── Types ──────────────────────────────────────────────────────
interface QuoteItem {
  ticker?: string;
  symbol?: string;
  price?: number;
  close?: number;
  change?: number;
  changesPercentage?: number;
  change_pct?: number;
  name?: string;
  companyName?: string;
  volume?: number;
}

interface IndexData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

interface NewsItem {
  id?: string;
  title?: string;
  headline?: string;
  publisher?: string;
  author?: string;
  published_utc?: string;
  publishedAt?: string;
  article_url?: string;
  amp_url?: string;
  url?: string;
  description?: string;
  summary?: string;
}

// ── Helpers ────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  change,
  changePct,
  loading,
}: {
  label: string;
  value: string;
  change: number;
  changePct: number;
  loading: boolean;
}) {
  const pos = change >= 0;
  if (loading) {
    return (
      <div className="glass" style={{ padding: '20px', minWidth: '180px' }}>
        <div className="skeleton" style={{ height: '48px' }} />
      </div>
    );
  }
  return (
    <div className="glass" style={{ padding: '20px', minWidth: '180px' }}>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '24px',
          fontWeight: 300,
          letterSpacing: '-0.02em',
          color: 'rgba(255,255,255,0.90)',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: '4px',
        }}
      >
        {value}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {pos ? (
          <TrendingUp size={11} style={{ color: '#34c759' }} />
        ) : (
          <TrendingDown size={11} style={{ color: '#ff3b30' }} />
        )}
        <span style={{ fontSize: '12px', fontWeight: 400, color: pos ? '#34c759' : '#ff3b30' }}>
          {pos ? '+' : ''}
          {change.toFixed(2)} ({pos ? '+' : ''}
          {changePct.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

function MoverCard({
  item,
  navigate,
}: {
  item: QuoteItem;
  navigate: (path: string) => void;
}) {
  const ticker  = item.ticker ?? item.symbol ?? '?';
  const price   = item.price ?? item.close ?? 0;
  const changePct = item.change_pct ?? item.changesPercentage ?? item.change ?? 0;
  const pos     = changePct >= 0;
  return (
    <div
      className="glass-sm"
      style={{ padding: '16px', cursor: 'pointer', transition: 'all 200ms ease' }}
      onClick={() => navigate(`/charts?ticker=${ticker}`)}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '-0.01em',
          }}
        >
          {ticker}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: '6px',
            background: pos ? 'rgba(52,199,89,0.10)' : 'rgba(255,59,48,0.10)',
            color: pos ? '#34c759' : '#ff3b30',
          }}
        >
          {pos ? '+' : ''}
          {changePct.toFixed(2)}%
        </span>
      </div>
      {(item.name ?? item.companyName) && (
        <p
          style={{
            fontSize: '11px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.30)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '6px',
          }}
        >
          {item.name ?? item.companyName}
        </p>
      )}
      <p
        style={{
          fontSize: '16px',
          fontWeight: 300,
          letterSpacing: '-0.01em',
          color: 'rgba(255,255,255,0.75)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        ${(price as number).toFixed(2)}
      </p>
    </div>
  );
}

export default function Markets() {
  const navigate = useNavigate();
  const [indices,    setIndices]    = useState<IndexData[]>([]);
  const [gainers,    setGainers]    = useState<QuoteItem[]>([]);
  const [losers,     setLosers]     = useState<QuoteItem[]>([]);
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [status,     setStatus]     = useState<'open' | 'closed' | 'pre-market' | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [searchResults, setSearchResults] = useState<Array<QuoteItem & { type?: string }>>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchDebounce = React.useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [idxRes, moversRes, newsRes] = await Promise.allSettled([
        marketApi.getIndices(),
        marketApi.getMovers(),
        marketApi.getNews(undefined, 8),
      ]);

      if (idxRes.status === 'fulfilled') {
        const d = idxRes.value;
        const raw: Array<Record<string, unknown>> = Array.isArray(d)
          ? d
          : (d as Record<string, unknown>)?.indices
          ? ((d as Record<string, unknown>).indices as Array<Record<string, unknown>>)
          : [];
        setIndices(
          raw.map((r) => ({
            ticker:    String(r.symbol ?? r.ticker ?? ''),
            name:      String(r.name ?? r.symbol ?? ''),
            price:     Number(r.price ?? 0),
            change:    Number(r.change ?? 0),
            changePct: Number(r.changePct ?? r.change_pct ?? 0),
          }))
        );
      }

      if (moversRes.status === 'fulfilled') {
        const d = moversRes.value as Record<string, unknown>;
        const gRaw = Array.isArray(d?.gainers) ? d.gainers as Array<Record<string, unknown>> : [];
        const lRaw = Array.isArray(d?.losers)  ? d.losers  as Array<Record<string, unknown>> : [];
        setGainers(
          gRaw.slice(0, 12).map((r) => ({
            ticker:    String(r.symbol ?? r.ticker ?? ''),
            symbol:    String(r.symbol ?? r.ticker ?? ''),
            name:      String(r.name ?? ''),
            price:     Number(r.price ?? 0),
            change_pct: Number(r.changePct ?? r.change_pct ?? 0),
          }))
        );
        setLosers(
          lRaw.slice(0, 12).map((r) => ({
            ticker:    String(r.symbol ?? r.ticker ?? ''),
            symbol:    String(r.symbol ?? r.ticker ?? ''),
            name:      String(r.name ?? ''),
            price:     Number(r.price ?? 0),
            change_pct: Number(r.changePct ?? r.change_pct ?? 0),
          }))
        );
      }

      if (newsRes.status === 'fulfilled') {
        const d = newsRes.value as Record<string, unknown>;
        const raw = Array.isArray(d?.news) ? d.news : Array.isArray(d) ? d : [];
        setNews((raw as NewsItem[]).slice(0, 8));
      }

      // Derive market status from time (NYSE hours: 9:30–16:00 ET Mon–Fri)
      const now = new Date();
      const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const day = etTime.getDay();
      const hour = etTime.getHours();
      const min  = etTime.getMinutes();
      const minutes = hour * 60 + min;
      if (day === 0 || day === 6) {
        setStatus('closed');
      } else if (minutes >= 570 && minutes < 960) {
        setStatus('open');
      } else if (minutes >= 240 && minutes < 570) {
        setStatus('pre-market');
      } else {
        setStatus('closed');
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    if (!search.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await marketApi.searchAssets(search.trim());
        const raw = (res as Record<string, unknown>)?.assets ?? (res as Record<string, unknown>)?.results ?? [];
        setSearchResults((raw as Array<Record<string, unknown>>).slice(0, 6).map((r) => ({
          ticker: String(r.symbol ?? r.ticker ?? ''),
          symbol: String(r.symbol ?? r.ticker ?? ''),
          name:   String(r.name ?? ''),
          type:   String(r.type ?? ''),
        })));
      } catch {
        setSearchResults([]);
      }
    }, 250);
  }, [search]);

  const fmtPrice = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

  const statusColor =
    status === 'open' ? '#34c759' : status === 'pre-market' ? '#c9a54e' : 'rgba(255,255,255,0.40)';
  const statusLabel = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Closed';

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
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.90)',
              letterSpacing: '-0.02em',
            }}
          >
            Markets
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: status === 'open' ? 'rgba(52,199,89,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'open' ? 'rgba(52,199,89,0.20)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: statusColor,
                boxShadow: status === 'open' ? '0 0 6px rgba(52,199,89,0.6)' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: statusColor,
                letterSpacing: '0.04em',
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.30)',
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: '36px', width: '200px' }}
              placeholder="Search ticker…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value.toUpperCase());
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 150)}
            />
            {showSearch && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  background: 'rgba(10,10,10,0.98)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  zIndex: 50,
                  backdropFilter: 'blur(40px)',
                }}
              >
                {searchResults.map((r) => (
                  <button
                    key={r.ticker ?? r.symbol}
                    onMouseDown={() => navigate(`/charts?ticker=${r.ticker ?? r.symbol}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                        {r.ticker ?? r.symbol}
                      </p>
                      <p
                        style={{
                          fontSize: '11px',
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.35)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '160px',
                        }}
                      >
                        {r.name}
                      </p>
                    </div>
                    {r.price != null && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.50)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        ${(r.price as number).toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
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
          </button>
        </div>
      </div>

      {/* Indices */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '28px',
        }}
      >
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass" style={{ padding: '20px', minWidth: '180px' }}>
              <div className="skeleton" style={{ height: '60px' }} />
            </div>
          ))
        ) : indices.length > 0 ? (
          indices.map((idx) => (
            <StatCard
              key={idx.ticker}
              label={idx.name ?? idx.ticker}
              value={fmtPrice(idx.price)}
              change={idx.change}
              changePct={idx.changePct}
              loading={false}
            />
          ))
        ) : (
          <div className="glass" style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.30)', fontWeight: 300 }}>
              Market data unavailable
            </p>
          </div>
        )}
      </div>

      {/* Gainers + Losers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {[
          {
            title: 'Top Gainers',
            data: gainers,
            icon: <TrendingUp size={14} style={{ color: '#34c759' }} />,
          },
          {
            title: 'Top Losers',
            data: losers,
            icon: <TrendingDown size={14} style={{ color: '#ff3b30' }} />,
          },
        ].map(({ title, data, icon }) => (
          <div key={title}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {icon}
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.60)' }}>
                {title}
              </span>
            </div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '80px' }} />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="glass-sm" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.30)', fontWeight: 300 }}>
                  No data available
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {data.map((item) => (
                  <MoverCard
                    key={item.ticker ?? item.symbol}
                    item={item}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* News */}
      <div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.60)',
            marginBottom: '12px',
          }}
        >
          Market News
        </p>
        <div className="glass" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '20px' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: '56px', marginBottom: '8px' }}
                />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.30)', fontWeight: 300 }}>
                No news available
              </p>
            </div>
          ) : (
            news.map((item, i) => {
              const rawTs = item.published_utc ?? item.publishedAt;
              const ts = rawTs
                ? new Date(rawTs).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              const href = item.article_url ?? item.url ?? item.amp_url ?? '#';
              const title = item.title ?? item.headline ?? '';
              const source = item.publisher ?? item.author ?? '';
              return (
                <a
                  key={item.id ?? i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '16px 20px',
                    borderBottom: i < news.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    textDecoration: 'none',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1.4,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                      }}
                    >
                      {title}
                    </p>
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 300,
                        color: 'rgba(255,255,255,0.30)',
                      }}
                    >
                      {source}
                      {ts && ` · ${ts}`}
                    </p>
                  </div>
                  <ExternalLink
                    size={12}
                    style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0, marginTop: '2px' }}
                  />
                </a>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
