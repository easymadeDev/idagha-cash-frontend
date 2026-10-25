import { useRouter } from 'next/router';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import Layout from './Layout';
import { CountUp, EASE } from './motion';
import { formatNaira } from '../lib/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TABS = [
  { label: 'Overview', href: '/finance', sub: 'Every wallet, every naira in and out, updated live.' },
  { label: 'Contributions', href: '/contributions', sub: 'Every payment members have made, recorded publicly.' },
  { label: 'Expenses', href: '/expenses', sub: 'Every naira spent, with what it was for and who approved it.' },
  { label: 'Reunion Fund', href: '/reunion-fund', sub: 'Our target for the reunion, and who has paid towards it.' },
  { label: 'Reunion Support', href: '/reunion-support', sub: 'Promises of support from members and well-wishers.' },
  { label: 'Reports', href: '/reports', sub: 'Month by month: what came in and what went out.' },
];

// The finance area's own frame: a ledger header with the live figures,
// and tabs between the finance pages. Page headers inside are replaced by this one.
export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: stats } = useSWR('/api/stats/summary', fetcher, { refreshInterval: 30000 });
  const current = TABS.find((t) => router.pathname === t.href) || TABS[0];
  const naira = (n: number) => formatNaira(Math.round(n));

  return (
    <Layout>
      <section className="fin-hero">
        <div className="fin-shield" aria-hidden="true" />
        <div className="fin-hero-inner">
          <motion.p key={current.href + '-k'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--gold)', fontWeight: 600, marginTop: 0 }}>
            Finance
          </motion.p>
          <motion.h1 key={current.href} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            {current.label === 'Overview' ? 'The books' : current.label}
          </motion.h1>
          <p>{current.sub}</p>

          <div className="fin-figures">
            <div>
              <span>Balance across wallets</span>
              <b className="gold">{stats ? <CountUp value={stats.walletBalance || 0} format={naira} /> : '—'}</b>
            </div>
            <div>
              <span>Total collected</span>
              <b>{stats ? <CountUp value={stats.totalContributions || 0} format={naira} /> : '—'}</b>
            </div>
            <div>
              <span>Total spent</span>
              <b>{stats ? <CountUp value={stats.totalExpenses || 0} format={naira} /> : '—'}</b>
            </div>
            <div>
              <span>Reunion fund</span>
              <b>{stats ? <><CountUp value={stats.reunionFund?.percentage || 0} format={(n) => `${Math.round(n)}%`} /></> : '—'}</b>
            </div>
          </div>

          <nav className="fin-tabs" aria-label="Finance sections">
            {TABS.map((t) => {
              const on = t.href === current.href;
              return (
                <button key={t.href} className={on ? 'on' : ''} onClick={() => router.push(t.href)} aria-current={on ? 'page' : undefined}>
                  {t.label}
                  {on && <motion.span layoutId="fin-tab" className="fin-tab-line" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                </button>
              );
            })}
          </nav>
        </div>
      </section>
      <div className="fin-body">{children}</div>
    </Layout>
  );
}
