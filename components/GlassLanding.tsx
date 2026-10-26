import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { CalendarDays, Vote, Trophy, Wallet, ArrowRight, Users, GraduationCap, Images, MapPin } from 'lucide-react';
import { useGate } from '../lib/gate';
import { fetcher, initials } from '../lib/member';
import { formatNaira } from '../lib/api';
import { CountUp } from './motion';

// The landing page in the glass skin: frosted white-and-blue panels
// floating over a softly blurred photograph of the whole class.

type Photo = { src: string; caption: string; focus: string };
const GRAD_YEAR = 2018;
const EASE = [0.22, 1, 0.36, 1] as const;

// Rises into place as it scrolls into view
const rise = (i = 0) => ({
  initial: { opacity: 0, y: 40, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.8, ease: EASE, delay: i * 0.08 },
});

function useClock(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!target) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [target]);
  if (!target) return null;
  const d = Math.max(0, new Date(target).getTime() - now);
  return { days: Math.floor(d / 864e5), hours: Math.floor((d / 36e5) % 24), mins: Math.floor((d / 6e4) % 60), secs: Math.floor((d / 1e3) % 60) };
}

export default function GlassLanding({ classPhotos = [] }: { classPhotos?: Photo[] }) {
  const router = useRouter();
  const { cleared, ready, setGateOpen } = useGate();
  const { data: events } = useSWR('/api/events', fetcher);
  const { data: execs } = useSWR('/api/executives', fetcher);
  const { data: awards } = useSWR('/api/awards', fetcher);
  const { data: elections } = useSWR('/api/elections', fetcher);
  const { data: count } = useSWR('/api/members/count', fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);

  const photos: Photo[] = classPhotos.length ? classPhotos : [{ src: '/img/classroom-kwara.jpg', caption: '', focus: '50% 40%' }];
  const group = photos[0];
  const upcoming = useMemo(() => (Array.isArray(events) ? events.filter((e: any) => new Date(e.endDate || e.date).getTime() > Date.now()) : []), [events]);
  const next = upcoming[0];
  const clock = useClock(next?.date);
  const election = Array.isArray(elections) ? elections[0] : null;
  const awardList = Array.isArray(awards) ? awards : [];
  const execList = Array.isArray(execs) ? execs : [];
  const yearsOut = new Date().getFullYear() - GRAD_YEAR;

  // Menu slides away while scrolling down, returns on any scroll up
  const [navHidden, setNavHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 6) { setNavHidden(y > last && y > 240); last = y; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const enterPortal = () => (cleared ? router.push('/home') : setGateOpen(true));
  const go = (href: string) => (cleared ? router.push(href) : (sessionStorage.setItem('idagha_redirect_after_login', href), setGateOpen(true)));
  const leader = (a: any) => a.winner || a.nominees?.[0];

  const together = [
    {
      icon: CalendarDays, title: 'Reunions', href: next ? `/events/${next._id}` : '/events', cta: 'RSVP',
      body: next ? `${next.title} · ${new Date(next.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` : 'The next reunion is being planned. The date goes up here first.',
    },
    {
      icon: Vote, title: 'Elections', href: election ? `/elections/${election._id}` : '/elections', cta: election?.status === 'voting' ? 'Vote now' : 'See positions',
      body: election ? `${election.title}: ${election.status === 'voting' ? 'voting is open' : election.status === 'forms' ? 'forms are on sale' : 'results are out'}.` : 'Run for office, or choose who does. One vote per member, per position.',
    },
    {
      icon: Trophy, title: 'Class awards', href: '/awards', cta: 'Nominate',
      body: awardList.length ? awardList.slice(0, 2).map((a: any) => `${a.title}: ${leader(a)?.memberName || 'open'}`).join(' · ') : 'Best online, best talker, most active. Nominate a classmate.',
    },
    {
      icon: Wallet, title: 'The books', href: '/finance', cta: 'Open the books',
      body: stats ? `${formatNaira(stats.walletBalance || 0)} in our wallets. Every naira in and out is open to members.` : 'Every contribution and expense, open to every member.',
    },
  ];

  return (
    <div className="gl">
      <Head><title>IDAGHA Class of 2018 — Alumni</title></Head>
      <div className="gl-bg" style={{ backgroundImage: `url(${group.src})` }} aria-hidden="true" />
      <div className="gl-tint" aria-hidden="true" />

      {/* Navigation: floating glass pill */}
      <motion.nav className={`gl-nav${navHidden ? ' is-hidden' : ''}`} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }} aria-label="Main">
        <button className="gl-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="" width={34} height={34} /> Idagha ’18
        </button>
        <div className="gl-links"><a href="#story">Story</a><a href="#together">Together</a><a href="#memories">Memories</a><a href="#executive">Executive</a></div>
        <button className="gl-btn gl-btn--solid gl-btn--sm" onClick={enterPortal} disabled={!ready}>{cleared ? 'Open portal' : 'Sign in'}</button>
      </motion.nav>

      {/* Hero */}
      <header className="gl-hero">
        <motion.div className="gl-glass gl-hero-card" initial={{ opacity: 0, y: 50, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, ease: EASE, delay: 0.15 }}>
          <motion.img className="gl-crest" src="/logo.png" alt="IDAGHA Secondary School crest" width={150} height={150}
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 1.2, ease: EASE, delay: 0.3 }} />
          <h1>Class of {GRAD_YEAR},<br /><span>still one set.</span></h1>
          <p>The home of the Idagha Secondary School class of {GRAD_YEAR}: reunions, elections, class awards, our photographs and our books.</p>
          <div className="gl-ctas">
            <button className="gl-btn gl-btn--solid" onClick={enterPortal} disabled={!ready}>{cleared ? 'Open the portal' : 'Enter the portal'} <ArrowRight size={18} /></button>
            <button className="gl-btn" onClick={() => router.push('/register')}>Join the set</button>
          </div>
        </motion.div>
        <motion.div className="gl-hero-chips" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}>
          <span className="gl-glass gl-chip"><Users size={16} /> {count?.count ?? '—'} classmates</span>
          <span className="gl-glass gl-chip"><GraduationCap size={16} /> {yearsOut} years out</span>
          {next && <span className="gl-glass gl-chip"><CalendarDays size={16} /> Next: {clock ? `${clock.days} days` : next.title}</span>}
        </motion.div>
      </header>

      {/* Our story */}
      <section className="gl-section gl-story" id="story" aria-labelledby="story-h">
        <motion.figure className="gl-photo-lg" {...rise(0)}>
          <img src={photos[Math.min(1, photos.length - 1)].src} alt={photos[Math.min(1, photos.length - 1)].caption} style={{ objectPosition: photos[Math.min(1, photos.length - 1)].focus }} loading="lazy" />
        </motion.figure>
        <motion.div className="gl-glass gl-story-card" {...rise(1)}>
          <h2 id="story-h">{yearsOut} years out, still together</h2>
          <p>We wrote our last exam at Idagha Secondary School in {GRAD_YEAR} and scattered across cities, campuses and jobs. The WhatsApp group never went quiet.</p>
          <p>This is where the set comes back together: one register of classmates, our reunions, elections run in the open, the awards we argue about, and every naira accounted for.</p>
          <button className="gl-btn" onClick={() => go('/about')}>Read about the association <ArrowRight size={16} /></button>
        </motion.div>
      </section>

      {/* What we do together */}
      <section className="gl-section" id="together" aria-labelledby="together-h">
        <motion.h2 id="together-h" className="gl-h2" {...rise(0)}>Everything we do together</motion.h2>
        <div className="gl-four">
          {together.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button key={t.title} className="gl-glass gl-feature" onClick={() => go(t.href)} {...rise(i)} whileHover={{ y: -8 }}>
                <span className="gl-feature-ico"><Icon size={22} /></span>
                <b>{t.title}</b>
                <span className="gl-feature-body">{t.body}</span>
                {t.title === 'Reunions' && clock && (
                  <span className="gl-clock">{[['d', clock.days], ['h', clock.hours], ['m', clock.mins], ['s', clock.secs]].map(([l, v]) => <i key={l as string}><b key={`${l}${v}`}>{v}</b>{l}</i>)}</span>
                )}
                <em>{t.cta} <ArrowRight size={14} /></em>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Memories: big photographs */}
      <section className="gl-section" id="memories" aria-labelledby="mem-h">
        <div className="gl-section-head">
          <motion.h2 id="mem-h" className="gl-h2" {...rise(0)}>Our memories</motion.h2>
          <motion.button className="gl-btn" onClick={() => go('/gallery')} {...rise(1)}><Images size={16} /> Open the gallery</motion.button>
        </div>
        <div className="gl-mosaic">
          {photos.slice(0, 7).map((p, i) => (
            <motion.figure key={p.src} className={`gl-tile gl-tile--${i}`} {...rise(i % 3)} whileHover={{ scale: 1.02 }}>
              <img src={p.src} alt={p.caption} style={{ objectPosition: p.focus }} loading="lazy" />
              {p.caption && <figcaption className="gl-glass">{p.caption}</figcaption>}
            </motion.figure>
          ))}
        </div>
      </section>

      {/* Executive */}
      <section className="gl-section" id="executive" aria-labelledby="exec-h">
        <div className="gl-section-head">
          <motion.h2 id="exec-h" className="gl-h2" {...rise(0)}>The people running the set</motion.h2>
          <motion.button className="gl-btn" onClick={() => go('/executives')} {...rise(1)}>Meet the executive <ArrowRight size={16} /></motion.button>
        </div>
        <div className="gl-execs">
          {execList.length === 0 ? (
            <div className="gl-glass gl-exec"><b>The executive list is on its way</b><small>The Secretary will add each officer.</small></div>
          ) : execList.slice(0, 8).map((x: any, i: number) => (
            <motion.div key={x._id} className="gl-glass gl-exec" {...rise(i % 4)} whileHover={{ y: -6 }}>
              <span className="gl-face">{x.photo ? <img src={x.photo} alt={x.name} /> : initials(x.name)}</span>
              <b>{x.name}</b><small>{x.position}</small>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The set in numbers */}
      <section className="gl-section" aria-labelledby="nums-h">
        <motion.h2 id="nums-h" className="gl-h2" {...rise(0)}>The set in numbers</motion.h2>
        <div className="gl-nums">
          {[
            { v: count?.count, l: 'classmates on the register' },
            { v: yearsOut, l: 'years since our final exams' },
            { v: upcoming.length, l: 'gatherings on the calendar' },
          ].map((n, i) => (
            <motion.div key={n.l} className="gl-glass gl-num" {...rise(i)}>
              <b>{n.v != null ? <CountUp value={n.v} /> : '—'}</b><span>{n.l}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Join call */}
      <section className="gl-section">
        <motion.div className="gl-glass gl-cta" {...rise(0)}>
          <img src="/logo.png" alt="" width={110} height={110} />
          <h2>Not on the register yet?</h2>
          <p>Add your name, phone and photo. The Secretary confirms you, and the portal opens. Registration is free.</p>
          <div className="gl-ctas">
            <button className="gl-btn gl-btn--solid" onClick={() => router.push('/register')}>Register as a member</button>
            <button className="gl-btn" onClick={enterPortal} disabled={!ready}>I’m already a member</button>
          </div>
        </motion.div>
      </section>

      <footer className="gl-footer">
        <div className="gl-glass gl-footer-card">
          <div className="gl-foot-brand"><img src="/logo.png" alt="" width={44} height={44} /><b>Idagha ’18</b><span>IDAGHA Secondary School, Class of {GRAD_YEAR} Alumni Association</span></div>
          <div className="gl-foot-cols">
            <div><b>The set</b><button onClick={() => go('/members')}>Members</button><button onClick={() => go('/executives')}>Executives</button><button onClick={() => go('/about')}>About</button></div>
            <div><b>Together</b><button onClick={() => go('/events')}>Reunions</button><button onClick={() => go('/gallery')}>Gallery</button><button onClick={() => go('/awards')}>Class awards</button></div>
            <div><b>Decide</b><button onClick={() => go('/elections')}>Elections</button><button onClick={() => go('/finance')}>The books</button></div>
          </div>
          <div className="gl-foot-base"><span>© {new Date().getFullYear()} IDAGHA Class of {GRAD_YEAR} Alumni</span><span><MapPin size={13} /> Message the Secretary in the class WhatsApp group</span><button onClick={() => router.push('/admin')}>Secretary login</button></div>
        </div>
      </footer>
    </div>
  );
}
