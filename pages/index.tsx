import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGate } from '../lib/gate';
import { fetcher, initials } from '../lib/member';
import { withVacancies } from '../lib/positions';
import LandingMenu from '../components/LandingMenu';
import { formatNaira } from '../lib/api';
import { CountUp } from '../components/motion';
import GlassLanding from '../components/GlassLanding';
import { useSkin } from '../lib/skin';
import { isPublicPath } from '../lib/requireLogin';

type Photo = { src: string; caption: string; focus: string };

const GRAD_YEAR = 2018;
const STATEMENT =
  'We wrote our last exam at Idagha Secondary School in 2018 and scattered across cities, campuses and jobs. ' +
  'This is where the set comes back together: our reunions, our elections, our memories, and every naira accounted for.';

export async function getStaticProps() {
  const { getClassPhotos } = await import('../lib/classPhotos');
  return { props: { classPhotos: getClassPhotos() } };
}

function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const d = Math.max(0, new Date(target).getTime() - now);
  return { days: Math.floor(d / 864e5), hours: Math.floor((d / 36e5) % 24), mins: Math.floor((d / 6e4) % 60), secs: Math.floor((d / 1e3) % 60) };
}

// ── Artwork for the accordion slices: each one says what its section is ──
function BallotArt() {
  return (
    <span className="cx-art cx-art--ballot" aria-hidden="true">
      <span className="cx-art-word">VOTE</span>
      <span className="cx-art-shields"><i /><i /><i /></span>
      <svg className="cx-ballot" viewBox="0 0 220 220">
        <g className="cx-ballot-paper">
          <rect x="70" y="20" width="80" height="96" rx="6" fill="#f5efdd" />
          <path d="M86 52h48M86 68h48M86 84h30" stroke="#0f3d22" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
          <path d="M92 60l12 12 24-26" stroke="#12854a" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <rect x="30" y="112" width="160" height="92" rx="12" fill="#0f3d22" stroke="#f0c445" strokeWidth="4" />
        <rect x="70" y="108" width="80" height="10" rx="5" fill="#050a07" stroke="#f0c445" strokeWidth="3" />
        <path d="M78 160h64" stroke="#f0c445" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function TrophyArt() {
  return (
    <span className="cx-art cx-art--trophy" aria-hidden="true">
      {/* a winners' podium: classmates nominated and backed by the set, the top one under a star */}
      <svg viewBox="0 0 240 240">
        {/* drawn in the top of the tile so the caption below stays clear */}
        <g transform="translate(46 -18) scale(0.62)">
        {/* podium */}
        <rect x="88" y="150" width="64" height="70" rx="6" fill="#f0c445" />
        <rect x="26" y="174" width="62" height="46" rx="6" fill="#12854a" />
        <rect x="152" y="186" width="62" height="34" rx="6" fill="#0f5a33" />
        <text x="120" y="196" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="30" fill="#0f3d22">1</text>
        <text x="57" y="207" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="22" fill="#d9f7e6">2</text>
        <text x="183" y="212" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="20" fill="#d9f7e6">3</text>
        {/* the three classmates */}
        <g fill="#fbf6e8">
          <circle cx="120" cy="112" r="17" /><path d="M94 150a26 22 0 0 1 52 0z" />
          <circle cx="57" cy="142" r="13" /><path d="M37 174a20 17 0 0 1 40 0z" />
          <circle cx="183" cy="156" r="12" /><path d="M164 186a19 16 0 0 1 38 0z" />
        </g>
        {/* the winner's star, bobbing */}
        <g className="cx-trophy">
          <path d="M120 50l9 18 20 3-14.5 14 3.5 20-18-9.5-18 9.5 3.5-20L91 71l20-3z" fill="#f0c445" stroke="#fff2c2" strokeWidth="2" />
        </g>
        {/* supports rising */}
        <g className="cx-sparks" fontFamily="Arial, sans-serif" fontWeight="800">
          <text x="40" y="104" fontSize="15" fill="#2fd27a">+1</text>
          <text x="186" y="118" fontSize="13" fill="#2fd27a">+1</text>
          <text x="160" y="70" fontSize="17" fill="#f0c445">+1</text>
        </g>
        </g>
      </svg>
    </span>
  );
}

function LedgerArt() {
  const bars = [38, 52, 46, 70, 62, 88];
  return (
    <span className="cx-art cx-art--ledger" aria-hidden="true">
      <span className="cx-art-naira">₦</span>
      <svg viewBox="0 0 240 200">
        {[40, 80, 120, 160].map((y) => <path key={y} d={`M20 ${y}H220`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />)}
        {bars.map((h, i) => (
          <rect key={i} className="cx-bar" style={{ ['--i' as any]: i }} x={30 + i * 32} y={180 - h * 1.6} width="20" height={h * 1.6} rx="4" fill={i === bars.length - 1 ? '#f0c445' : '#2fd27a'} />
        ))}
        <polyline className="cx-line-chart" points={bars.map((h, i) => `${40 + i * 32},${170 - h * 1.6}`).join(' ')} fill="none" stroke="#fff2c2" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const fmtDay = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });

// In the glass skin the landing page is the glass landing
export default function Landing(props: { classPhotos?: Photo[] }) {
  const [skin] = useSkin();
  return skin === 'glass' ? <GlassLanding classPhotos={props.classPhotos} /> : <CinematicLanding {...props} />;
}

function CinematicLanding({ classPhotos = [] }: { classPhotos?: Photo[] }) {
  const router = useRouter();
  const { cleared, ready, setGateOpen } = useGate();
  const root = useRef<HTMLDivElement>(null);
  const crest = useRef<HTMLImageElement>(null);

  const { data: events } = useSWR('/api/events', fetcher);
  const { data: execs } = useSWR('/api/executives', fetcher);
  const { data: awards } = useSWR('/api/awards', fetcher);
  const { data: elections } = useSWR('/api/elections', fetcher);
  const { data: memberCount } = useSWR('/api/members/count', fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);

  const photos: Photo[] = classPhotos.length ? classPhotos : [{ src: '/img/classroom-kwara.jpg', caption: '', focus: '50% 40%' }];
  const group = photos[0];
  const upcoming = useMemo(() => (Array.isArray(events) ? events.filter((e: any) => new Date(e.endDate || e.date).getTime() > Date.now()) : []), [events]);
  const next = upcoming[0];
  const clock = useCountdown(next?.date);
  const election = Array.isArray(elections) ? elections[0] : null;
  const execList = Array.isArray(execs) ? withVacancies(execs) : [];
  const awardList = Array.isArray(awards) ? awards : [];
  const yearsOut = new Date().getFullYear() - GRAD_YEAR;

  const enterPortal = () => (cleared ? router.push('/home') : setGateOpen(true));
  const go = (href: string) => (cleared || isPublicPath(href) ? router.push(href) : (sessionStorage.setItem('idagha_redirect_after_login', href), setGateOpen(true)));

  // ── The crest tilts in 3D toward the pointer ──
  useEffect(() => {
    const el = crest.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    const onMove = (e: PointerEvent) => {
      ry(((e.clientX / window.innerWidth) - 0.5) * 50);
      rx(-((e.clientY / window.innerHeight) - 0.5) * 40);
    };
    window.addEventListener('pointermove', onMove);
    // Idle drift for touch screens, where there is no pointer to follow
    const idle = gsap.to(el, { rotationY: 18, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const stopIdle = () => idle.kill();
    window.addEventListener('pointermove', stopIdle, { once: true });
    return () => { window.removeEventListener('pointermove', onMove); idle.kill(); };
  }, []);

  // ── Hero entrance: plays once on load, never again when data arrives ──
  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.cx-hero-title .cx-line > span', { yPercent: 115, rotate: 4, duration: 1.3, ease: 'expo.out', stagger: 0.12, delay: 0.2 });
      gsap.from('.cx-hero-sub, .cx-hero-ctas', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, delay: 0.7 });
      gsap.from('.cx-crest-wrap', { scale: 0.3, opacity: 0, rotate: -120, duration: 1.6, ease: 'expo.out' });
      gsap.from('.cx-hero-bg img', { scale: 1.35, duration: 2.4, ease: 'expo.out' });
      gsap.from('.cx-nav', { y: -80, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.3 });
    }, root);
    return () => ctx.revert();
  }, []);

  // ── Scroll choreography (rebuilt when data changes the page) ──
  useEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduce) return;

      // Hero: pin and zoom through — the photo pushes in, the crest flies at the viewer
      const heroTl = gsap.timeline({
        scrollTrigger: { trigger: '.cx-hero', start: 'top top', end: '+=70%', scrub: 1, pin: true },
      });
      // Explicit start values: the entrance tweens may still be mid-flight when this is built,
      // and a plain .to() would record their half-finished state as the start
      const still = { immediateRender: false };
      // Nothing fades all the way out while pinned: the copy is still on screen when the pin
      // releases, so the story section arrives before the hero has gone (no empty screen)
      heroTl
        .fromTo('.cx-hero-bg img', { scale: 1 }, { scale: 1.4, ease: 'none', ...still }, 0)
        .fromTo('.cx-hero-bg', { opacity: 1 }, { opacity: 0.4, ease: 'none', ...still }, 0)
        .fromTo('.cx-crest-wrap', { scale: 1, opacity: 1, rotate: 0 }, { scale: 3, opacity: 0, ease: 'power2.in', ...still }, 0)
        .fromTo('.cx-hero-copy', { yPercent: 0, opacity: 1 }, { yPercent: -30, opacity: 0.35, ease: 'power1.in', ...still }, 0);

      // Statement: words scrub from faint to full
      // Starts readable (0.3) and is fully lit by the time the paragraph reaches mid-screen
      gsap.fromTo('.cx-statement .cx-word', { opacity: 0.3 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.cx-statement-text', start: 'top 90%', end: 'top 45%', scrub: true },
      });

      // Light sweep across big headings when they arrive
      gsap.utils.toArray<HTMLElement>('.cx-sweep').forEach((h) => {
        gsap.fromTo(h, { backgroundPosition: '200% 0' }, {
          backgroundPosition: '-100% 0', duration: 2.2, ease: 'power2.inOut',
          scrollTrigger: { trigger: h, start: 'top 85%' },
        });
        gsap.from(h, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
      });

      // The floating menu slides away while scrolling down so it never sits on top of text,
      // and comes straight back on any scroll up
      const nav = document.querySelector('.cx-nav');
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => nav?.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 240),
      });

      // Marquee: loops on its own, speeds up with scroll velocity and flips with scroll direction
      const marquee = gsap.to('.cx-marquee-track', { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      let dir = 1;
      ScrollTrigger.create({
        trigger: '.cx-marquee', start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity();
          if (v !== 0) dir = v > 0 ? 1 : -1;
          const boost = gsap.utils.clamp(1, 8, 1 + Math.abs(v) / 250);
          gsap.to(marquee, { timeScale: dir * boost, duration: 0.2, overwrite: true });
          gsap.to(marquee, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' });
        },
      });

      // Accordion photos drift inside their slices (parallax depth)
      gsap.fromTo('.cx-slice:not(.cx-slice--art)', { backgroundPosition: '50% 15%' }, {
        backgroundPosition: '50% 85%', ease: 'none',
        scrollTrigger: { trigger: '.cx-accordion', start: 'top bottom', end: 'bottom top', scrub: true },
      });

      // Accordion slices rise in sequence
      gsap.from('.cx-slice', { y: 120, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.cx-accordion', start: 'top 80%' } });

      // 3D tunnel: class photos fly toward the viewer as you scroll
      const items = gsap.utils.toArray<HTMLElement>('.cx-tunnel-item');
      const DEPTH = 900;
      const total = items.length * DEPTH + 1200;
      const place = (p: number) => {
        items.forEach((el, i) => {
          const z = -i * DEPTH - 900 + p * total;
          const fadeIn = gsap.utils.clamp(0, 1, (z + 4000) / 2200);
          const fadeOut = gsap.utils.clamp(0, 1, (700 - z) / 500);
          gsap.set(el, { z, opacity: Math.min(fadeIn, fadeOut), visibility: z > 700 ? 'hidden' : 'visible' });
        });
      };
      gsap.set(items, { xPercent: -50, yPercent: -50 });
      place(0);
      ScrollTrigger.create({
        trigger: '.cx-tunnel', start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: (self) => place(self.progress),
      });
      // the title is already readable as the section enters, so the screen never sits empty
      gsap.fromTo('.cx-tunnel-title', { scale: 0.85, opacity: 0.4 }, {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.cx-tunnel', start: 'top 95%', end: 'top 40%', scrub: true },
      });

      // Executive split: title pinned (desktop); cards grow in near the bottom of the screen and
      // stay fully lit while on screen, so one never goes dark before the next has arrived
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', () => {
        ScrollTrigger.create({ trigger: '.cx-split', start: 'top 15%', end: 'bottom 70%', pin: '.cx-split-title' });
      });
      gsap.utils.toArray<HTMLElement>('.cx-exec').forEach((card) => {
        gsap.fromTo(card, { scale: 0.9, opacity: 0.35 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 100%', end: 'top 78%', scrub: true } });
      });

      // Stacking figure cards: each one settles and shrinks only once the next is well on screen
      const stack = gsap.utils.toArray<HTMLElement>('.cx-stack-card');
      stack.forEach((card, i) => {
        if (i === stack.length - 1) return;
        // Covered cards shrink and dim but stay opaque, so numbers never show through
        gsap.to(card, {
          scale: 0.9 - (stack.length - i) * 0.02, filter: 'brightness(0.55)', ease: 'none',
          scrollTrigger: { trigger: stack[i + 1], start: 'top 40%', end: 'top 15%', scrub: true },
        });
      });

      // Closing call rises with the crest
      gsap.from('.cx-cta-crest', { scale: 0.4, rotate: -90, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.cx-cta', start: 'top 70%' } });
      gsap.from('.cx-foot-word span', { yPercent: 100, duration: 1.1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '.cx-foot-word', start: 'top 92%' } });
    }, root);
    return () => ctx.revert();
  }, [execList.length, photos.length]);

  // Refresh trigger positions once data has rendered and changed the page height
  useEffect(() => { const t = setTimeout(() => ScrollTrigger.refresh(), 400); return () => clearTimeout(t); }, [events, execs, awards, elections]);

  const tunnelSpots = [[-38, -18], [30, -24], [-26, 22], [36, 16], [-6, -30], [8, 26], [-40, 6], [40, -4], [-14, 30], [22, -12]];
  const words = STATEMENT.split(' ');
  const leader = (a: any) => a.winner || a.nominees?.[0];

  return (
    <main className="cx" ref={root}>
      <Head><title>IDAGHA Class of 2018 — Alumni</title></Head>
      <div className="cx-grain" aria-hidden="true" />

      {/* Floating glass navigation */}
      <nav className="cx-nav" aria-label="Main">
        <button className="cx-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="" width={34} height={34} /> Idagha ’18
        </button>
        <div className="cx-nav-links">
          <a href="#story">Story</a><a href="#together">Together</a><a href="#memories">Memories</a><a href="#executive">Executive</a>
        </div>
        <LandingMenu skin="cine" go={go} enterPortal={enterPortal} cleared={cleared} ready={ready} />
      </nav>

      {/* Attention: the cinematic hero */}
      <section className="cx-hero" aria-labelledby="hero-h">
        <div className="cx-hero-bg" aria-hidden="true">
          <img src={group.src} alt="" style={{ objectPosition: group.focus }} />
        </div>
        <div className="cx-hero-wash" aria-hidden="true" />
        <div className="cx-hero-inner">
          <div className="cx-crest-wrap"><img ref={crest} className="cx-crest" src="/logo.png" alt="IDAGHA Secondary School crest" width={220} height={220} /></div>
          <div className="cx-hero-copy">
            <h1 id="hero-h" className="cx-hero-title">
              <span className="cx-line"><span>Class of {GRAD_YEAR},</span></span>
              <span className="cx-line"><span className="cx-gold">still one set.</span></span>
            </h1>
            <p className="cx-hero-sub">The home of the Idagha Secondary School class of {GRAD_YEAR}: reunions, elections, alumni awards, our photographs and our books.</p>
            <div className="cx-hero-ctas">
              <button className="cx-btn cx-btn--primary" onClick={enterPortal} disabled={!ready}>{cleared ? 'Open the portal' : 'Enter the portal'}</button>
              <button className="cx-btn cx-btn--glass" onClick={() => router.push('/register')}>Join the set</button>
            </div>
          </div>
        </div>
        <div className="cx-scroll-cue" aria-hidden="true"><span /></div>
      </section>

      {/* Interest: a statement that writes itself as you scroll */}
      <section className="cx-section cx-statement" id="story" aria-labelledby="story-h">
        <h2 id="story-h" className="cx-kicker-title">
          {yearsOut} years out
          <span className="cx-inline-img" style={{ backgroundImage: `url(${photos[Math.min(1, photos.length - 1)].src})` }} aria-hidden="true" />
          and counting
        </h2>
        <p className="cx-statement-text">
          {words.map((w, i) => <span key={i} className="cx-word">{w}{' '}</span>)}
        </p>
      </section>

      {/* Interest: a horizontal accordion of everything the set does together */}
      <section className="cx-section" id="together" aria-labelledby="together-h">
        <h2 id="together-h" className="cx-sweep cx-h2">Everything the set does, in one place</h2>
        <div className="cx-accordion">
          <button className="cx-slice" onClick={() => go(next ? `/events/${next._id}` : '/events')} style={{ backgroundImage: `url(${group.src})` }}>
            <span className="cx-slice-label">Reunions</span>
            <span className="cx-slice-body">
              <b>{next ? next.title : 'The next reunion is being planned'}</b>
              <span>{next ? `${fmtDay(next.date)}${next.venue ? ` · ${next.venue}` : ''}` : 'The date goes up here as soon as it is confirmed.'}</span>
              {clock && (
                <span className="cx-clock">
                  {[['d', clock.days], ['h', clock.hours], ['m', clock.mins], ['s', clock.secs]].map(([l, v]) => <i key={l as string}><b key={`${l}${v}`}>{v}</b>{l}</i>)}
                </span>
              )}
              <em>RSVP now</em>
            </span>
          </button>
          <button className="cx-slice cx-slice--art" onClick={() => go(election ? `/elections/${election._id}` : '/elections')}>
            <BallotArt />
            <span className="cx-slice-label">Elections</span>
            <span className="cx-slice-body">
              <b>{election ? election.title : 'Run for office, or choose who does'}</b>
              <span>{election ? (election.status === 'voting' ? 'Voting is open: one vote per member, per position.' : election.status === 'forms' ? 'Nomination forms are on sale now.' : 'Results are published to every member.') : 'When the executive’s tenure ends, positions and form prices appear here.'}</span>
              <em>{election?.status === 'voting' ? 'Cast your vote' : 'See the positions'}</em>
            </span>
          </button>
          <button className="cx-slice cx-slice--art" onClick={() => go('/awards')}>
            <TrophyArt />
            <span className="cx-slice-label">Alumni awards</span>
            <span className="cx-slice-body">
              <b>Best online. Best talker. Most active.</b>
              <span>{awardList.length ? awardList.slice(0, 3).map((a: any) => `${a.title}: ${leader(a)?.memberName || 'open'}`).join(' · ') : 'Nominate a classmate and back the one who deserves it.'}</span>
              <em>Nominate someone</em>
            </span>
          </button>
          <button className="cx-slice cx-slice--art" onClick={() => go('/finance')}>
            <LedgerArt />
            <span className="cx-slice-label">The books</span>
            <span className="cx-slice-body">
              <b>{stats ? formatNaira(stats.walletBalance || 0) : '—'} in our wallets</b>
              <span>Every contribution and every expense is recorded and open to every member.</span>
              <em>Open the books</em>
            </span>
          </button>
        </div>
      </section>

      {/* Infinite marquee of giant type */}
      <div className="cx-marquee" aria-hidden="true">
        <div className="cx-marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>Idagha Secondary School <i>✦</i> Class of {GRAD_YEAR} <i>✦</i> Still one set <i>✦</i> Reunions <i>✦</i> Elections <i>✦</i> Memories <i>✦</i> </span>
          ))}
        </div>
      </div>

      {/* Desire: a 3D tunnel of our photographs flying toward the viewer */}
      <section className="cx-tunnel" id="memories" aria-labelledby="mem-h" style={{ height: `${Math.max(300, photos.length * 60)}vh` }}>
        <div className="cx-tunnel-stage">
          <div className="cx-tunnel-title">
            <h2 id="mem-h" className="cx-h2">Our memories</h2>
            <p>{photos.length} photographs from school days. Scroll through them.</p>
            <button className="cx-btn cx-btn--glass" onClick={() => go('/gallery')}>Open the gallery</button>
          </div>
          <div className="cx-tunnel-space">
            {photos.map((p, i) => {
              const [x, y] = tunnelSpots[i % tunnelSpots.length];
              return (
                <figure key={p.src} className="cx-tunnel-item" style={{ left: `calc(50% + ${x}vw)`, top: `calc(50% + ${y}vh)` }}>
                  <img src={p.src} alt={p.caption} loading="lazy" style={{ objectPosition: p.focus }} />
                  {p.caption && <figcaption>{p.caption}</figcaption>}
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* Desire: pinned title, executives scroll past */}
      <section className="cx-section cx-split" id="executive" aria-labelledby="exec-h">
        <div className="cx-split-title">
          <h2 id="exec-h" className="cx-h2 cx-sweep">The people running the set</h2>
          <p>Elected by members, accountable to members. Past executives stay on record in the portal.</p>
          <button className="cx-btn cx-btn--glass" onClick={() => go('/executives')}>Meet the executive</button>
        </div>
        <div className="cx-split-list">
          {execList.length === 0 ? (
            <div className="cx-exec"><b>The executive list is on its way</b><span>The General Secretary will add each officer here.</span></div>
          ) : execList.map((x: any) => (
            <div key={x._id} className={`cx-exec${x.vacant ? ' is-vacant' : ''}`}>
              <div className="cx-exec-face">{x.photo ? <img src={x.photo} alt={x.name} /> : x.vacant ? '?' : initials(x.name)}</div>
              <div><span>{x.position}</span><b>{x.name}</b></div>
            </div>
          ))}
        </div>
      </section>

      {/* Desire: figure cards that stack as you scroll */}
      <section className="cx-section cx-stack" aria-labelledby="nums-h">
        <h2 id="nums-h" className="cx-h2 cx-sweep">The set in numbers</h2>
        <div className="cx-stack-card cx-stack-card--a">
          <b>{memberCount?.count != null ? <CountUp value={memberCount.count} /> : '—'}</b>
          <span>classmates verified on the register</span>
        </div>
        <div className="cx-stack-card cx-stack-card--b">
          <b><CountUp value={yearsOut} /></b>
          <span>years since our final exams</span>
        </div>
        <div className="cx-stack-card cx-stack-card--c">
          <b><CountUp value={upcoming.length} /></b>
          <span>gatherings on the calendar</span>
        </div>
      </section>

      {/* Action: the closing call */}
      <section className="cx-section cx-cta" aria-labelledby="cta-h">
        <img className="cx-cta-crest" src="/logo.png" alt="" width={180} height={180} />
        <h2 id="cta-h" className="cx-cta-title cx-sweep">Not on the register yet?</h2>
        <p>Add your name, phone and photo. The General Secretary confirms you, and the portal opens. Registration is free.</p>
        <div className="cx-hero-ctas" style={{ justifyContent: 'center' }}>
          <button className="cx-btn cx-btn--primary" onClick={() => router.push('/register')}>Register as a member</button>
          <button className="cx-btn cx-btn--glass" onClick={enterPortal} disabled={!ready}>I’m already a member</button>
        </div>
      </section>

      <footer className="cx-footer">
        <div className="cx-foot-word" aria-label="Idagha 2018">
          {'IDAGHA’18'.split('').map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <div className="cx-foot-cols">
          <div><b>The set</b><button onClick={() => go('/members')}>Members</button><button onClick={() => go('/executives')}>Executives</button><button onClick={() => go('/about')}>About</button></div>
          <div><b>Together</b><button onClick={() => go('/events')}>Reunions</button><button onClick={() => go('/gallery')}>Gallery</button><button onClick={() => go('/awards')}>Alumni awards</button></div>
          <div><b>Decide</b><button onClick={() => go('/elections')}>Elections</button><button onClick={() => go('/finance')}>The books</button></div>
          <div><b>Questions</b><span>Message the General Secretary in the class WhatsApp group.</span></div>
        </div>
        <div className="cx-foot-base">
          <span>© {new Date().getFullYear()} IDAGHA Class of {GRAD_YEAR} Alumni</span>
          <button onClick={() => router.push('/admin')}>Secretary login</button>
        </div>
      </footer>
    </main>
  );
}
