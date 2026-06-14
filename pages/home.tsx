import Layout from '../components/Layout';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatNaira, formatDate } from '../lib/api';

// Wallet detail modal — shows contributions + expenses for one wallet
function WalletModal({ ws, onClose }: { ws: any; onClose: () => void }) {
  const { data: allContribs } = useSWR('/api/contributions', fetcher);
  const { data: allExpenses } = useSWR('/api/expenses', fetcher);

  const w = ws.wallet;
  const color = w?.color || '#22c55e';

  const contribs = Array.isArray(allContribs)
    ? allContribs.filter((c: any) => c.walletId === w._id)
    : [];
  const expenses = Array.isArray(allExpenses)
    ? allExpenses.filter((e: any) => e.walletId === w._id)
    : [];

  const contributorMap: Record<string, number> = {};
  contribs.forEach((c: any) => {
    contributorMap[c.contributorName] = (contributorMap[c.contributorName] || 0) + c.amount;
  });
  const contributors = Object.entries(contributorMap).sort((a, b) => b[1] - a[1]);

  const transactions = [
    ...contribs.map((c: any) => ({ ...c, _type: 'credit' })),
    ...expenses.map((e: any) => ({ ...e, _type: 'debit' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,9,6,0.85)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease' }} />

      {/* Sheet — full width on mobile, max 680px on desktop */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 680,
        maxHeight: '92vh',
        background: 'linear-gradient(180deg, #0d1f10 0%, #070e09 100%)',
        border: `1px solid ${color}33`,
        borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
      }} onClick={e => e.stopPropagation()}>

        {/* Color bar */}
        <div style={{ height: 4, background: color, flexShrink: 0 }} />

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 16px 14px', flexShrink: 0, borderBottom: `1px solid ${color}18` }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: `${color}18`, border: `1px solid ${color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(0.92rem,3vw,1.1rem)', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textTransform: 'capitalize' }}>{w.type} wallet{w.description ? ` · ${w.description}` : ''}</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)', cursor: 'pointer', color: 'var(--text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, marginLeft: 8,
            }}>×</button>
          </div>

          {/* Balance row — always 3 columns, text shrinks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'Balance', val: formatNaira(ws.balance), col: ws.balance >= 0 ? color : 'var(--red)' },
              { label: 'Income',  val: formatNaira(ws.income),  col: 'var(--green-400)' },
              { label: 'Spent',   val: formatNaira(ws.spent),   col: 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: '9px 10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(0.72rem,2.5vw,0.95rem)', color: s.col, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 32px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Contributors */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Contributors ({contributors.length})
            </div>
            {contributors.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>No contributions yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {contributors.map(([name, total]) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 9,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: `${color}22`, color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 800,
                      }}>
                        {name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-3)' }}>
                          {contribs.filter((c: any) => c.contributorName === name).length} payment(s)
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--green-400)', flexShrink: 0 }}>
                      {formatNaira(total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              All Transactions ({transactions.length})
            </div>
            {transactions.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>No transactions yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {transactions.map((tx: any) => (
                  <div key={tx._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 9,
                    background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: tx._type === 'credit' ? 'var(--green-400)' : 'var(--red)' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx._type === 'credit' ? tx.contributorName : tx.title}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>
                          {formatDate(tx.date)} · {tx.category || (tx._type === 'debit' ? 'expense' : 'contribution')}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '0.82rem', color: tx._type === 'credit' ? 'var(--green-400)' : 'var(--red)', flexShrink: 0 }}>
                      {tx._type === 'credit' ? '+' : '−'}{formatNaira(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

function AnimatedNaira({ amount }: { amount: number }) {
  const val = useCountUp(amount);
  return <>{formatNaira(val)}</>;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 30) return formatDate(date);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'Just now';
}

function ActivityIcon({ type }: { type: string }) {
  if (type === 'contribution') return (
    <svg width="16" height="16" fill="none" stroke="var(--green-400)" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === 'expense') return (
    <svg width="16" height="16" fill="none" stroke="var(--red)" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="16" height="16" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: stats }       = useSWR('/api/stats/summary', fetcher);
  const { data: walletStats } = useSWR('/api/stats/wallets', fetcher, { refreshInterval: 60000 });
  const { data: contributions } = useSWR('/api/contributions', fetcher);
  const { data: announcements } = useSWR('/api/announcements', fetcher);
  const { data: activityRaw } = useSWR('/api/activity?limit=25', fetcher, { refreshInterval: 30000 });

  const [activeWallet, setActiveWallet] = useState<any>(null);

  const recentContribs = Array.isArray(contributions) ? contributions.slice(0, 6) : [];
  const activityFeed   = Array.isArray(activityRaw) ? activityRaw : [];
  const pct = stats?.reunionFund?.percentage ?? 0;
  const walletCards = Array.isArray(walletStats) ? walletStats : [];

  const getInitials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const avatarColors = [
    'rgba(34,197,94,0.15)', 'rgba(96,165,250,0.15)',
    'rgba(251,191,36,0.15)', 'rgba(248,113,113,0.15)',
    'rgba(167,139,250,0.15)', 'rgba(251,146,60,0.15)',
  ];

  return (
    <Layout>
      {activeWallet && <WalletModal ws={activeWallet} onClose={() => setActiveWallet(null)} />}
      <div className="container">

        {/* ── Announcements ── */}
        {Array.isArray(announcements) && announcements.length > 0 && (
          <div style={{ paddingTop: 24 }}>
            {announcements.map((a: any) => (
              <div key={a._id} className="announce-bar">
                <div className="announce-icon">
                  <svg width="16" height="16" fill="none" stroke="var(--green-400)" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="announce-title">{a.title}</div>
                  <div className="announce-body">{a.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Hero ── */}
        <div className="hero">
          <div className="hero-bg-glow" />
          <div className="hero-row">
            <div className="hero-text">
              <div className="hero-eyebrow">
                <span className="live-dot" />
                Live Public Financial Dashboard
              </div>
              <h1 className="hero-title">
                IDAGHA Class of 2018<br />
                <span className="grad-text">Alumni Portal</span>
              </h1>
              <p className="hero-sub">
                Every naira collected and spent is recorded here in real time.
                Complete financial transparency for every member and the public.
              </p>
              <div className="hero-btns">
                <button className="btn btn-primary btn-lg" onClick={() => router.push('/contributions')}>
                  View Contributions
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => router.push('/reunion-fund')}>
                  Reunion Fund
                </button>
              </div>
            </div>
            <div className="hero-logo-wrap">
              <div style={{ position: 'absolute', inset: -24, background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)', borderRadius: '50%', animation: 'heroBreathe 5s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent 0%, rgba(34,197,94,0.3) 25%, transparent 50%, rgba(34,197,94,0.3) 75%, transparent 100%)', animation: 'spin 8s linear infinite', opacity: 0.6 }} />
              <Image src="/logo.png" alt="IDAGHA Alumni Logo" width={200} height={200}
                className="hero-logo-img"
                style={{ objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 30px rgba(34,197,94,0.5)) drop-shadow(0 0 60px rgba(34,197,94,0.2))', animation: 'heroLogoBob 6s ease-in-out infinite' }}
                priority />
            </div>
          </div>
        </div>

        {/* ── Wallet Cards ── */}
        {walletCards.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, marginBottom: 4 }}>
                  Wallet Balances
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-3)' }}>Live balance for each group wallet</p>
              </div>
            </div>
            <div className="wallet-cards-grid">
              {walletCards.map((ws: any) => {
                const w = ws.wallet;
                const color = w?.color || '#22c55e';
                return (
                  <div key={w?._id} onClick={() => setActiveWallet(ws)} style={{
                    padding: 24, borderRadius: 'var(--radius)',
                    background: 'var(--bg-card)',
                    border: `1px solid ${color}33`,
                    position: 'relative', overflow: 'hidden',
                    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}22`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                  >
                    {/* Color accent */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: `${color}08`, transform: 'translate(30%, -30%)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: `${color}18`, border: `1px solid ${color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <svg width="17" height="17" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{w?.name || 'Wallet'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textTransform: 'capitalize' }}>{w?.type} wallet</div>
                      </div>
                    </div>

                    {/* Balance — big number */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Balance</div>
                      <div style={{
                        fontFamily: 'var(--font-d)', fontWeight: 900,
                        fontSize: '1.6rem', letterSpacing: '-0.03em',
                        color: ws.balance >= 0 ? color : 'var(--red)',
                        textShadow: `0 0 24px ${ws.balance >= 0 ? color : 'var(--red)'}33`,
                        lineHeight: 1.1,
                      }}>
                        <AnimatedNaira amount={Math.abs(ws.balance)} />
                        {ws.balance < 0 && <span style={{ fontSize: '1rem' }}> deficit</span>}
                      </div>
                    </div>

                    {/* Income vs Spent */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      <div style={{ background: 'rgba(34,197,94,0.06)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(34,197,94,0.12)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Income</div>
                        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--green-400)' }}>{formatNaira(ws.income)}</div>
                      </div>
                      <div style={{ background: 'rgba(248,113,113,0.06)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(248,113,113,0.12)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spent</div>
                        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--red)' }}>{formatNaira(ws.spent)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: color, opacity: 0.8, fontWeight: 600 }}>
                      View contributors & transactions
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="stats-grid" style={{ marginBottom: 48 }}>
          {[
            { label: 'Total Balance',       value: stats ? <AnimatedNaira amount={stats.walletBalance} /> : '—',            sub: 'Across all wallets',  color: 'green',  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',                                                                                                                  glow: 'rgba(34,197,94,0.12)' },
            { label: 'Total Contributions', value: stats ? <AnimatedNaira amount={stats.totalContributions} /> : '—',       sub: 'All time collected',  color: 'green',  icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', glow: 'rgba(34,197,94,0.10)' },
            { label: 'Total Expenses',      value: stats ? <AnimatedNaira amount={stats.totalExpenses} /> : '—',            sub: 'All time spent',      color: 'red',    icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',                                                                                                                                                                    glow: 'rgba(248,113,113,0.08)' },
            { label: 'Reunion Fund',        value: stats ? `${pct}%` : '—',                                                 sub: stats ? `${formatNaira(stats.reunionFund?.raisedAmount ?? 0)} raised` : '…', color: 'yellow', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',                                                                       glow: 'rgba(251,191,36,0.08)' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-glow" style={{ background: `radial-gradient(circle, ${s.glow}, transparent)` }} />
              <div className="stat-card-icon" style={{ background: s.glow }}>
                <svg width="19" height="19" fill="none" stroke={s.color === 'red' ? 'var(--red)' : s.color === 'yellow' ? 'var(--yellow)' : 'var(--green-400)'} strokeWidth="2" viewBox="0 0 24 24">
                  <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="stat-card-label">{s.label}</div>
              <div className={`stat-card-value ${s.color}`}>{s.value}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            LIVE ACTIVITY FEED  — full redesign
        ══════════════════════════════════════════ */}
        <div style={{ marginBottom: 52 }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                  Activity Feed
                </h2>
                {/* Pulsing LIVE badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 99,
                  fontSize: '0.68rem', fontWeight: 800,
                  color: 'var(--green-400)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--green-400)',
                    boxShadow: '0 0 8px var(--green-400)',
                    animation: 'livePing 1.5s ease-in-out infinite',
                    display: 'block',
                  }} />
                  Live
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-3)' }}>
                Every contribution, expense & new member — fully transparent
              </p>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px' }}>
              {activityFeed.length} recent events
            </div>
          </div>

          {/* Feed container */}
          {activityFeed.length === 0 ? (
            <div style={{
              padding: '56px 24px', textAlign: 'center',
              background: 'linear-gradient(160deg, rgba(10,26,13,0.6), rgba(6,13,8,0.4))',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              color: 'var(--text-3)',
            }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" style={{ margin: '0 auto 14px', opacity: 0.3, display: 'block' }}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No activity yet</div>
              <div style={{ fontSize: '0.8rem' }}>Transactions and member events will appear here in real time</div>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(180deg, rgba(10,26,13,0.7) 0%, rgba(6,13,8,0.5) 100%)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)',
            }}>
              {activityFeed.map((item: any, i: number) => {
                const isContrib = item.type === 'contribution';
                const isExpense = item.type === 'expense';

                const dotColor  = isContrib ? 'var(--green-400)' : isExpense ? 'var(--red)' : 'var(--blue)';
                const iconBg    = isContrib ? 'rgba(34,197,94,0.1)' : isExpense ? 'rgba(248,113,113,0.08)' : 'rgba(96,165,250,0.08)';
                const amountColor = isExpense ? 'var(--red)' : 'var(--green-400)';

                // Category pill text
                const cat = (item.category || '').toLowerCase();
                const catLabel = cat === 'reunion-fund' ? 'Reunion Fund' : cat === 'dues' ? 'Monthly Dues' : cat === 'general' ? 'General' : item.category || '';

                return (
                  <div key={item.id} className="feed-item" style={{
                    borderBottom: i < activityFeed.length - 1 ? '1px solid rgba(34,197,94,0.06)' : 'none',
                    animation: `fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) ${Math.min(i * 0.025, 0.4)}s both`,
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(34,197,94,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Timeline dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: iconBg,
                        border: `1px solid ${dotColor}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 0 12px ${dotColor}18`,
                      }}>
                        <ActivityIcon type={item.type} />
                      </div>
                    </div>

                    {/* Text block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: 1.3 }}>
                          {item.title}
                        </span>
                        {catLabel && isContrib && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                            borderRadius: 99, letterSpacing: '0.05em', textTransform: 'uppercase',
                            background: cat === 'reunion-fund' ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)',
                            color: cat === 'reunion-fund' ? 'var(--yellow)' : 'var(--green-400)',
                            border: `1px solid ${cat === 'reunion-fund' ? 'rgba(251,191,36,0.2)' : 'rgba(34,197,94,0.2)'}`,
                          }}>
                            {catLabel}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                        {item.subtitle}
                      </div>
                    </div>

                    {/* Right: amount + time */}
                    <div className="feed-item-right">
                      {item.amount != null && (
                        <div style={{
                          fontFamily: 'var(--font-d)', fontWeight: 800,
                          fontSize: '0.95rem', color: amountColor,
                          letterSpacing: '-0.02em', lineHeight: 1.2,
                          textShadow: `0 0 16px ${amountColor}44`,
                        }}>
                          {isExpense ? '−' : '+'}{formatNaira(item.amount)}
                        </div>
                      )}
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 3, fontWeight: 500 }}>
                        {timeAgo(item.date)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div className="feed-footer">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Auto-refreshes every 30 seconds</span>
                <div className="feed-legend">
                  <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--green-400)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-400)', display: 'inline-block' }} /> Contributions
                  </span>
                  <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} /> Expenses
                  </span>
                  <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--blue)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} /> Members
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Reunion Progress ── */}
        {stats?.reunionFund && (
          <div className="card" style={{ marginBottom: 40, padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="section-title">2026 Reunion Fund</div>
                  <span className="badge badge-yellow"><span className="badge-dot" />Active</span>
                </div>
                <p style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
                  Target: <strong style={{ color: 'var(--text-2)' }}>{formatNaira(stats.reunionFund.targetAmount)}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--yellow)', letterSpacing: '-0.03em' }}>{pct}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>funded</div>
              </div>
            </div>
            <div className="progress-track" style={{ height: 14, marginBottom: 16 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 20 }}>
              <span style={{ color: 'var(--text-3)' }}>Raised: <strong style={{ color: 'var(--green-400)' }}>{formatNaira(stats.reunionFund.raisedAmount)}</strong></span>
              <span style={{ color: 'var(--text-3)' }}>Remaining: <strong style={{ color: 'var(--yellow)' }}>{formatNaira(stats.reunionFund.remaining)}</strong></span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/reunion-fund')}>
              View Full Details
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Support banner ── */}
        <div style={{
          marginBottom: 40, padding: '28px 32px', borderRadius: 'var(--radius)',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))',
          border: '1px solid rgba(34,197,94,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Support the Group Wallet
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', maxWidth: 460 }}>
              Any member or well-wisher can contribute any amount. Every payment is recorded publicly with your name and date.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/contributions')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" />
            </svg>
            Make a Contribution
          </button>
        </div>

        {/* ── Recent Contributions ── */}
        <div style={{ marginBottom: 48 }}>
          <div className="section-header">
            <div>
              <div className="section-title">Recent Contributions</div>
              <div className="section-sub">Latest payments to the group</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/contributions')}>View All</button>
          </div>
          {recentContribs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-3)' }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }}>
                <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" />
              </svg>
              No contributions yet.
            </div>
          ) : (
            <div className="contrib-grid">
              {recentContribs.map((c: any, i: number) => (
                <div key={c._id} className="contrib-card">
                  <div className="contrib-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                    {getInitials(c.contributorName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="contrib-name">{c.contributorName}</div>
                    <div className="contrib-date">{formatDate(c.date)}</div>
                    {c.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.note}</div>}
                  </div>
                  <div className="contrib-amount">{formatNaira(c.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div style={{ marginBottom: 56 }}>
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div className="section-title">Explore Portal</div>
          </div>
          <div className="quick-grid">
            {[
              { label: 'Members Directory',  desc: 'All registered group members',    href: '/members',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: 'rgba(96,165,250,0.12)',  color: 'var(--blue)' },
              { label: 'Contributions',       desc: 'Full contribution history',       href: '/contributions', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',                                                                                                                                                     bg: 'rgba(34,197,94,0.12)',  color: 'var(--green-400)' },
              { label: 'Expense Records',     desc: 'All spending documented',         href: '/expenses',     icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',                                                                                                                                                                                                           bg: 'rgba(248,113,113,0.1)', color: 'var(--red)' },
              { label: 'Financial Reports',   desc: 'Monthly charts & summaries',      href: '/reports',      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',                                                                                                                                                                            bg: 'rgba(251,191,36,0.1)',  color: 'var(--yellow)' },
            ].map((item) => (
              <div key={item.href} className="quick-card" onClick={() => router.push(item.href)}>
                <div className="quick-card-icon" style={{ background: item.bg }}>
                  <svg width="20" height="20" fill="none" stroke={item.color} strokeWidth="2" viewBox="0 0 24 24">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="quick-card-title">{item.label}</div>
                  <div className="quick-card-desc">{item.desc}</div>
                </div>
                <svg className="quick-card-arrow" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" />
                </svg>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
