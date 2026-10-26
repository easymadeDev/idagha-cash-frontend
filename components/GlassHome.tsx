import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, CalendarDays, Vote, Trophy, Wallet, Images, Users, Search, Bell, ArrowUpRight,
  ArrowDownRight, Plus, Crown, MapPin, Clock,
} from 'lucide-react';
import { useGate } from '../lib/gate';
import { fetcher, initials } from '../lib/member';
import { formatNaira } from '../lib/api';

// Alternative design route: a glassmorphism dashboard over a blurred class photograph.
// Public data only (the same the landing page shows); actions go through the member gate.

type Photo = { src: string; caption: string; focus: string };
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'elections', label: 'Elections', icon: Vote },
  { id: 'awards', label: 'Awards', icon: Trophy },
  { id: 'books', label: 'Books', icon: Wallet },
  { id: 'memories', label: 'Memories', icon: Images },
] as const;
type TabId = typeof TABS[number]['id'];

const EASE = [0.22, 1, 0.36, 1] as const;
const card = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.07, duration: 0.6, ease: EASE } }),
};

function useClock(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!target) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [target]);
  if (!target) return null;
  const d = Math.max(0, new Date(target).getTime() - now);
  return { days: Math.floor(d / 864e5), hours: Math.floor((d / 36e5) % 24), mins: Math.floor((d / 6e4) % 60), secs: Math.floor((d / 1e3) % 60) };
}

// Smooth area chart (monotone-ish curve through the points) drawn in SVG
function AreaChart({ series, labels }: { series: { name: string; color: string; values: number[] }[]; labels: string[] }) {
  const W = 560, H = 190, P = 8;
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.15;
  const x = (i: number) => P + (i * (W - P * 2)) / Math.max(1, labels.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const path = (vals: number[]) => vals.map((v, i) => {
    if (i === 0) return `M${x(0)},${y(v)}`;
    const cx = (x(i - 1) + x(i)) / 2;
    return `C${cx},${y(vals[i - 1])} ${cx},${y(v)} ${x(i)},${y(v)}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="g2-chart" role="img" aria-label="Money in and out by month">
      <defs>
        {series.map((s) => (
          <linearGradient key={s.name} id={`g2-${s.name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P} x2={W - P} y1={P + f * (H - P * 2)} y2={P + f * (H - P * 2)} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 4" />)}
      {series.map((s) => (
        <g key={s.name}>
          <motion.path d={`${path(s.values)} L${x(labels.length - 1)},${H - P} L${x(0)},${H - P} Z`} fill={`url(#g2-${s.name})`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }} />
          <motion.path d={path(s.values)} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EASE }} />
        </g>
      ))}
      {labels.map((l, i) => <text key={l + i} x={x(i)} y={H + 16} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.65)">{l}</text>)}
    </svg>
  );
}

export default function GlassDashboard({ classPhotos = [] }: { classPhotos?: Photo[] }) {
  const router = useRouter();
  const { cleared, member, setGateOpen } = useGate();
  const [tab, setTab] = useState<TabId>('overview');
  const [query, setQuery] = useState('');

  const { data: stats } = useSWR('/api/stats/summary', fetcher);
  const { data: count } = useSWR('/api/members/count', fetcher);
  const { data: events } = useSWR('/api/events', fetcher);
  const { data: elections } = useSWR('/api/elections', fetcher);
  const { data: awards } = useSWR('/api/awards', fetcher);
  const { data: execs } = useSWR('/api/executives', fetcher);
  const { data: contributions } = useSWR('/api/contributions', fetcher);
  const { data: expenses } = useSWR('/api/expenses', fetcher);

  const bg = classPhotos[0]?.src || '/img/classroom-kwara.jpg';
  const upcoming = useMemo(() => (Array.isArray(events) ? events.filter((e: any) => new Date(e.endDate || e.date).getTime() > Date.now()) : []), [events]);
  const next = upcoming[0];
  const clock = useClock(next?.date);
  const election = Array.isArray(elections) ? elections[0] : null;
  const awardList = Array.isArray(awards) ? awards : [];
  const execList = Array.isArray(execs) ? execs : [];

  // Money in and out over the last six months, from the public ledgers
  const months = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const d = new Date(); d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({ key: `${m.getFullYear()}-${m.getMonth()}`, label: m.toLocaleDateString('en-GB', { month: 'short' }) });
    }
    return out;
  }, []);
  const sumBy = (rows: any) => months.map((m) => (Array.isArray(rows) ? rows : [])
    .filter((r: any) => { const t = new Date(r.date); return `${t.getFullYear()}-${t.getMonth()}` === m.key; })
    .reduce((s: number, r: any) => s + (r.amount || 0), 0));
  const inflow = sumBy(contributions);
  const outflow = sumBy(expenses);
  const thisMonth = inflow[5], lastMonth = inflow[4];
  const change = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  const recent = (Array.isArray(contributions) ? contributions : []).slice(0, 6);
  const go = (href: string) => (cleared ? router.push(href) : (sessionStorage.setItem('idagha_redirect_after_login', href), setGateOpen(true)));
  const first = member?.name?.split(' ')[0];

  const statCards = [
    { title: 'Members verified', value: count?.count ?? '—', icon: Users, tint: 'blue', sub: 'on the register' },
    { title: 'Balance', value: stats ? formatNaira(stats.walletBalance || 0) : '—', icon: Wallet, tint: 'sky', sub: change == null ? 'all wallets' : `${change >= 0 ? '+' : ''}${change}% vs last month`, up: change == null ? null : change >= 0 },
    { title: 'Collected', value: stats ? formatNaira(stats.totalContributions || 0) : '—', icon: ArrowUpRight, tint: 'teal', sub: 'all time' },
    { title: 'Reunion fund', value: stats ? `${stats.reunionFund?.percentage ?? 0}%` : '—', icon: Crown, tint: 'violet', sub: stats ? `${formatNaira(stats.reunionFund?.raisedAmount ?? 0)} raised` : '' },
  ];

  return (
    <div className="g2">
      <Head><title>IDAGHA ’18 — Glass dashboard</title></Head>
      <div className="g2-bg" style={{ backgroundImage: `url(${bg})` }} aria-hidden="true" />
      <div className="g2-tint" aria-hidden="true" />

      {/* Top bar */}
      <motion.header className="g2-top" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: EASE }}>
        <div className="g2-pill g2-hello">
          <span className="g2-avatar">{member?.photo ? <img src={member.photo} alt="" /> : <img src="/logo.png" alt="" />}</span>
          Welcome{first ? `, ${first}` : ' to Idagha ’18'}
        </div>
        <label className="g2-pill g2-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, awards, people…" />
        </label>
        <button className="g2-pill g2-round" aria-label="Notifications" onClick={() => go('/home')}><Bell size={17} /></button>
      </motion.header>

      {/* Left icon rail */}
      <motion.nav className="g2-rail" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }} aria-label="Sections">
        <img src="/logo.png" alt="Idagha crest" className="g2-rail-logo" />
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button key={t.id} className={`g2-rail-btn${on ? ' on' : ''}`} onClick={() => setTab(t.id)} aria-label={t.label} title={t.label}>
              {on && <motion.span layoutId="g2-rail-on" className="g2-rail-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <Icon size={18} />
              <span className="g2-tip">{t.label}</span>
            </button>
          );
        })}
      </motion.nav>

      {/* The glass window */}
      <motion.main className="g2-window" initial={{ opacity: 0, scale: 0.96, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ duration: 0.45, ease: EASE }}>

            {tab === 'overview' && (
              <>
                <div className="g2-head">
                  <div><h1>Class of 2018</h1><p>Everything the set is doing, at a glance.</p></div>
                  <button className="g2-cta" onClick={() => go('/contributions?view=contribute')}><Plus size={16} /> Contribute</button>
                </div>
                <div className="g2-stats">
                  {statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.div key={s.title} className="g2-card g2-stat" custom={i} variants={card} initial="hidden" animate="show" whileHover={{ y: -5 }}>
                        <div className="g2-stat-top"><span>{s.title}</span><span className={`g2-ico g2-ico--${s.tint}`}><Icon size={17} /></span></div>
                        <b>{s.value}</b>
                        <small className={s.up == null ? '' : s.up ? 'up' : 'down'}>
                          {s.up != null && (s.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />)}{s.sub}
                        </small>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="g2-grid">
                  <motion.div className="g2-card g2-span2" custom={4} variants={card} initial="hidden" animate="show">
                    <div className="g2-card-head"><h2>Money in and out</h2>
                      <span className="g2-legend"><i style={{ background: '#7dd3fc' }} />In <i style={{ background: '#c4b5fd' }} />Out</span></div>
                    <AreaChart labels={months.map((m) => m.label)} series={[{ name: 'in', color: '#7dd3fc', values: inflow }, { name: 'out', color: '#c4b5fd', values: outflow }]} />
                  </motion.div>
                  <motion.div className="g2-card" custom={5} variants={card} initial="hidden" animate="show" whileHover={{ y: -5 }} onClick={() => go(next ? `/events/${next._id}` : '/events')} style={{ cursor: 'pointer' }}>
                    <div className="g2-card-head"><h2>Next gathering</h2><CalendarDays size={18} /></div>
                    <b className="g2-big">{next ? next.title : 'Being planned'}</b>
                    {next && <p className="g2-muted"><MapPin size={13} /> {next.venue || 'Venue to be announced'}</p>}
                    {clock ? (
                      <div className="g2-clock">{[['d', clock.days], ['h', clock.hours], ['m', clock.mins], ['s', clock.secs]].map(([l, v]) => (
                        <div key={l as string}><motion.b key={`${l}${v}`} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{v}</motion.b><span>{l}</span></div>
                      ))}</div>
                    ) : <p className="g2-muted">The date goes up as soon as it is confirmed.</p>}
                  </motion.div>
                  <motion.div className="g2-card" custom={6} variants={card} initial="hidden" animate="show">
                    <div className="g2-card-head"><h2>Latest payments</h2><button className="g2-link" onClick={() => go('/contributions')}>All</button></div>
                    {recent.length === 0 ? <p className="g2-muted">No payments recorded yet.</p> : recent.slice(0, 4).map((c: any) => (
                      <div key={c._id} className="g2-row">
                        <span className="g2-face">{initials(c.contributorName)}</span>
                        <span className="g2-row-main"><b>{c.contributorName}</b><small>{new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</small></span>
                        <span className="g2-amt">+{formatNaira(c.amount)}</span>
                      </div>
                    ))}
                  </motion.div>
                  <motion.div className="g2-card g2-span2" custom={7} variants={card} initial="hidden" animate="show">
                    <div className="g2-card-head"><h2>Your executive</h2><button className="g2-link" onClick={() => go('/executives')}>Meet them</button></div>
                    <div className="g2-execs">
                      {execList.length === 0 ? <p className="g2-muted">The executive list is on its way.</p> : execList.slice(0, 6).map((x: any) => (
                        <motion.div key={x._id} className="g2-exec" whileHover={{ y: -4 }}>
                          <span className="g2-face g2-face--lg">{x.photo ? <img src={x.photo} alt="" /> : initials(x.name)}</span>
                          <b>{x.name}</b><small>{x.position}</small>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </>
            )}

            {tab === 'events' && (
              <>
                <div className="g2-head"><div><h1>Events</h1><p>Reunions and gatherings of the set.</p></div>
                  <button className="g2-cta" onClick={() => go('/events')}>Open events</button></div>
                <div className="g2-list">
                  {upcoming.length === 0 ? <div className="g2-card"><p className="g2-muted">Nothing on the calendar yet.</p></div> :
                    upcoming.filter((e: any) => e.title.toLowerCase().includes(query.toLowerCase())).map((e: any, i: number) => (
                      <motion.button key={e._id} className="g2-card g2-event" custom={i} variants={card} initial="hidden" animate="show" whileHover={{ y: -5 }} onClick={() => go(`/events/${e._id}`)}>
                        <span className="g2-date"><b>{new Date(e.date).getDate()}</b>{new Date(e.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                        <span className="g2-row-main"><b>{e.title}</b><small><Clock size={12} /> {new Date(e.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}{e.venue ? ` · ${e.venue}` : ''}</small></span>
                        <span className="g2-chip">{e.rsvp?.going || 0} going</span>
                      </motion.button>
                    ))}
                </div>
              </>
            )}

            {tab === 'elections' && (
              <>
                <div className="g2-head"><div><h1>{election ? election.title : 'Elections'}</h1><p>{election ? `Status: ${election.status}` : 'No election is running right now.'}</p></div>
                  <button className="g2-cta" onClick={() => go(election ? `/elections/${election._id}` : '/elections')}>{election?.status === 'voting' ? 'Cast your vote' : 'Open elections'}</button></div>
                <div className="g2-stats">
                  {(election?.positions || []).map((p: any, i: number) => (
                    <motion.div key={p._id} className="g2-card g2-stat" custom={i} variants={card} initial="hidden" animate="show" whileHover={{ y: -5 }}>
                      <div className="g2-stat-top"><span>Position</span><span className="g2-ico g2-ico--blue"><Vote size={17} /></span></div>
                      <b style={{ fontSize: '1.4rem' }}>{p.title}</b>
                      <small>Form {formatNaira(p.formPrice)}</small>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {tab === 'awards' && (
              <>
                <div className="g2-head"><div><h1>Class awards</h1><p>Best online, best talker, most active and more.</p></div>
                  <button className="g2-cta" onClick={() => go('/awards')}>Nominate</button></div>
                <div className="g2-list">
                  {awardList.length === 0 ? <div className="g2-card"><p className="g2-muted">Award categories open soon.</p></div> :
                    awardList.filter((a: any) => a.title.toLowerCase().includes(query.toLowerCase())).map((a: any, i: number) => {
                      const lead = a.winner || a.nominees?.[0];
                      const pct = a.totalSupports ? Math.round(((lead?.supports || 0) / a.totalSupports) * 100) : 0;
                      return (
                        <motion.div key={a._id} className="g2-card g2-award" custom={i} variants={card} initial="hidden" animate="show" whileHover={{ y: -5 }}>
                          <span className="g2-ico g2-ico--violet"><Trophy size={18} /></span>
                          <span className="g2-row-main"><b>{a.title}</b><small>{lead ? `${a.winner ? 'Winner' : 'Leading'}: ${lead.memberName}` : 'No nominations yet'}</small>
                            <span className="g2-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.05 }} /></span></span>
                          <span className="g2-chip">{a.totalSupports || 0} supports</span>
                        </motion.div>
                      );
                    })}
                </div>
              </>
            )}

            {tab === 'books' && (
              <>
                <div className="g2-head"><div><h1>The books</h1><p>Every naira in and out, open to every member.</p></div>
                  <button className="g2-cta" onClick={() => go('/finance')}>Open finance</button></div>
                <div className="g2-grid">
                  <motion.div className="g2-card g2-span2" custom={0} variants={card} initial="hidden" animate="show">
                    <div className="g2-card-head"><h2>Last six months</h2></div>
                    <AreaChart labels={months.map((m) => m.label)} series={[{ name: 'in2', color: '#7dd3fc', values: inflow }, { name: 'out2', color: '#c4b5fd', values: outflow }]} />
                  </motion.div>
                  <motion.div className="g2-card" custom={1} variants={card} initial="hidden" animate="show">
                    <div className="g2-card-head"><h2>Totals</h2></div>
                    <div className="g2-row"><span className="g2-row-main"><b>Collected</b></span><span className="g2-amt">{stats ? formatNaira(stats.totalContributions || 0) : '—'}</span></div>
                    <div className="g2-row"><span className="g2-row-main"><b>Spent</b></span><span className="g2-amt g2-amt--out">{stats ? formatNaira(stats.totalExpenses || 0) : '—'}</span></div>
                    <div className="g2-row"><span className="g2-row-main"><b>Balance</b></span><span className="g2-amt">{stats ? formatNaira(stats.walletBalance || 0) : '—'}</span></div>
                  </motion.div>
                </div>
              </>
            )}

            {tab === 'memories' && (
              <>
                <div className="g2-head"><div><h1>Memories</h1><p>{classPhotos.length} photographs from school days.</p></div>
                  <button className="g2-cta" onClick={() => go('/gallery')}>Open gallery</button></div>
                <div className="g2-photos">
                  {classPhotos.map((p, i) => (
                    <motion.figure key={p.src} className="g2-photo" custom={i} variants={card} initial="hidden" animate="show" whileHover={{ y: -6, scale: 1.02 }}>
                      <img src={p.src} alt={p.caption} style={{ objectPosition: p.focus }} loading="lazy" />
                      <figcaption>{p.caption}</figcaption>
                    </motion.figure>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Floating bottom tab bar */}
      <motion.nav className="g2-dock" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: EASE, delay: 0.25 }} aria-label="Tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {tab === t.id && <motion.span layoutId="g2-dock-on" className="g2-dock-on" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span>{t.label}</span>
          </button>
        ))}
        <button className="g2-dock-plus" aria-label="Enter the portal" onClick={() => go('/home')}><Plus size={16} /></button>
      </motion.nav>
    </div>
  );
}
