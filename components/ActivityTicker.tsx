import useSWR from 'swr';
import { formatNaira } from '../lib/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ActivityTicker() {
  const { data } = useSWR('/api/activity?limit=30', fetcher, { refreshInterval: 30000 });
  const items = Array.isArray(data) ? data : [];

  if (items.length === 0) return null;

  // Build ticker text items
  const tickerItems = items.map((item: any) => {
    if (item.type === 'contribution') {
      return { text: `${item.title} contributed ${formatNaira(item.amount)}`, color: 'var(--green-400)', dot: '#22c55e' };
    }
    if (item.type === 'expense') {
      return { text: `${item.title} — ${formatNaira(item.amount)} spent`, color: 'var(--red)', dot: '#f87171' };
    }
    return { text: `New member: ${item.title}`, color: 'var(--blue)', dot: '#60a5fa' };
  });

  // Duplicate for seamless infinite loop
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div style={{
      position: 'fixed', top: 68, left: 0, right: 0, zIndex: 199,
      height: 34,
      background: 'rgba(3,9,6,0.95)',
      borderBottom: '1px solid rgba(34,197,94,0.12)',
      display: 'flex', alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* LIVE label */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 14px',
        borderRight: '1px solid rgba(34,197,94,0.15)',
        height: '100%',
        background: 'rgba(34,197,94,0.07)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--green-400)',
          boxShadow: '0 0 6px var(--green-400)',
          display: 'inline-block',
          animation: 'tickerPing 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--green-400)', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Live
        </span>
      </div>

      {/* Scrolling track */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          animation: `tickerScroll ${tickerItems.length * 4}s linear infinite`,
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 28px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.dot, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: '0.75rem', color: item.color, fontWeight: 600 }}>{item.text}</span>
              <span style={{ color: 'rgba(255,255,255,0.1)', marginLeft: 12 }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tickerPing {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--green-400); }
          50%       { opacity: 0.4; box-shadow: 0 0 2px var(--green-400); }
        }
      `}</style>
    </div>
  );
}
