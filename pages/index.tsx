import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useGate } from '../lib/gate';
import { fetcher, initials } from '../lib/member';
import { renderPoster } from '../lib/poster';

// Found pictures stand in until the class uploads its own to the gallery.
// They show secondary-school life in Nigeria — never presented as Idagha's own.
const FALLBACK_PHOTOS = [
  { src: '/img/classroom-kwara.jpg', caption: 'A secondary school classroom in Kwara State, 2022' },
  { src: '/img/student-kwara.jpg', caption: 'A student at a reading workshop in Kwara State, 2022' },
];

const GRAD_YEAR = 2018;
const STRIPES = Array.from({ length: 40 });

function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// Slow crossfade: one image at a time, holds ~5.5s, pauses when the tab is hidden
function useCrossfade(count: number, hold = 5500) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (count < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => { if (!document.hidden) setIndex((i) => (i + 1) % count); }, hold);
    return () => clearInterval(t);
  }, [count, hold]);
  return [index, setIndex] as const;
}

const fmtDay = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export async function getStaticProps() {
  const { getClassPhotos } = await import('../lib/classPhotos');
  return { props: { classPhotos: getClassPhotos() } };
}

export default function Landing({ classPhotos = [] }: { classPhotos?: { src: string; caption: string; focus: string }[] }) {
  const router = useRouter();
  const { cleared, ready, setGateOpen } = useGate();
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: events } = useSWR('/api/events', fetcher);
  const { data: execs } = useSWR('/api/executives', fetcher);
  const { data: awards } = useSWR('/api/awards', fetcher);
  const { data: elections } = useSWR('/api/elections', fetcher);
  const { data: gallery } = useSWR('/api/gallery?page=1', fetcher);
  const { data: memberCount } = useSWR('/api/members/count', fetcher);

  // Our own photographs first (curated in public/img/class), then members' gallery
  // uploads; the found stand-ins only when the class has nothing of its own yet
  const photos = useMemo(() => {
    const uploads = Array.isArray(gallery?.items)
      ? gallery.items.slice(0, 6).map((p: any) => ({ src: p.image, caption: p.caption || p.album, focus: '50% 30%' }))
      : [];
    const own = [...classPhotos, ...uploads];
    return own.length >= 2 ? own : [...own, ...FALLBACK_PHOTOS.map((p) => ({ ...p, focus: '50% 40%' }))];
  }, [gallery, classPhotos]);
  const usingFallback = classPhotos.length + (Array.isArray(gallery?.items) ? gallery.items.length : 0) < 2;

  // The whole-class photo (first) anchors "Our story"; the tall hero shield starts with the close-ups
  const heroPhotos = photos.length > 1 ? [...photos.slice(1), photos[0]] : photos;
  const [heroIdx] = useCrossfade(heroPhotos.length);
  const [frameIdx, setFrameIdx] = useCrossfade(photos.length, 3000);

  const upcoming = useMemo(
    () => (Array.isArray(events) ? events.filter((e: any) => new Date(e.endDate || e.date).getTime() > Date.now()) : []),
    [events],
  );
  const next = upcoming[0];
  const clock = useCountdown(next?.date);

  const election = Array.isArray(elections) ? elections[0] : null;
  const { data: electionDetail } = useSWR(election ? `/api/elections/${election._id}` : null, fetcher);

  // Every aspirant's auto-generated poster, rotating on the elections plate
  const [posters, setPosters] = useState<string[]>([]);
  useEffect(() => {
    const people: any[] = (electionDetail?.positions || []).flatMap((p: any) =>
      (['voting', 'closed'].includes(electionDetail.status) ? p.candidates : p.aspirants || [])
        .map((c: any) => ({ ...c, positionTitle: p.title })));
    if (!people.length) { setPosters([]); return; }
    let live = true;
    Promise.all(people.slice(0, 12).map((c) => renderPoster({
      photo: c.photo, name: c.memberName, band: 'VOTE', role: `for ${c.positionTitle}`,
      slogan: c.slogan, footer: electionDetail.title,
      badge: c.applicationStatus === 'cleared' ? 'CANDIDATE' : 'ASPIRANT',
    }))).then((urls) => { if (live) setPosters(urls); }).catch(() => {});
    return () => { live = false; };
  }, [electionDetail]);
  const [posterIdx] = useCrossfade(posters.length, 3200);
  const [electTab, setElectTab] = useState<'positions' | 'how' | 'results'>('positions');
  const execList = Array.isArray(execs) ? execs : [];
  const awardList = Array.isArray(awards) ? awards : [];

  const enterPortal = () => (cleared ? router.push('/home') : setGateOpen(true));
  const go = (href: string) => (cleared ? router.push(href) : (sessionStorage.setItem('idagha_redirect_after_login', href), setGateOpen(true)));

  // Section entrances — content is visible without script; script adds the rise
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.lp-rise').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [events, execs, awards, elections]);

  const yearsOut = new Date().getFullYear() - GRAD_YEAR;

  return (
    <div className="lp" ref={rootRef}>
      <Head>
        <title>IDAGHA Class of 2018 — Alumni</title>
      </Head>

      {/* ── Navigation ── */}
      <nav className="lp-nav" aria-label="Main">
        <button className="lp-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="" width={40} height={40} />
          <span>Idagha ’18</span>
        </button>
        <ul className="lp-nav-links">
          <li><a href="#story">Our story</a></li>
          <li><a href="#reunions">Reunions</a></li>
          <li><a href="#elections">Elections</a></li>
          <li><a href="#awards">Awards</a></li>
          <li><a href="#memories">Memories</a></li>
        </ul>
        <button className="lp-btn" onClick={enterPortal} disabled={!ready}>
          {cleared ? 'Open the portal' : 'Members sign in'}
        </button>
      </nav>

      {/* ── Hero: printed card beside the room ── */}
      <header className="lp-hero">
        <div className="lp-card">
          <div className="lp-stripe" aria-hidden="true">{STRIPES.map((_, i) => <i key={i} />)}</div>
          <div className="lp-card-body">
            <img className="lp-crest" src="/logo.png" alt="IDAGHA Secondary School, Class of 2018 Alumni crest" width={190} height={190} />
            <h1>Idagha Class of 2018</h1>
            <p className="lp-hero-sub">
              The home of our set from Idagha Secondary School: reunions, elections, class awards,
              our photographs, and every naira accounted for.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-btn lp-btn--gold" onClick={enterPortal} disabled={!ready}>
                {cleared ? 'Go to the members’ portal' : 'Enter the members’ portal'}
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <div className="lp-hero-links">
              <button className="lp-link" onClick={() => router.push('/register')}>Not registered? Join the set</button>
              <a className="lp-link" href="#reunions">Next reunion</a>
              <a className="lp-link" href="#executives">Executives</a>
            </div>
          </div>
        </div>

        <div className="lp-room" aria-label="Photographs">
          <p className="lp-room-caption">{heroPhotos[heroIdx]?.caption}</p>
          <div className="lp-room-shield shield lp-fade">
            {heroPhotos.map((p: any, i: number) => (
              <img key={i} src={p.src} alt={p.caption || 'Class photograph'} className={i === heroIdx ? 'is-on' : ''} style={{ objectPosition: p.focus }} />
            ))}
          </div>
        </div>
      </header>

      {/* ── Our story ── */}
      <section className="lp-about" id="story" aria-labelledby="story-h">
        <div>
          <h2 id="story-h" className="lp-rise">{yearsOut} years out, still one set</h2>
          <figure className="lp-about-photo shield lp-rise" style={{ ['--i' as any]: 2 }}>
            <img src={photos[0].src} alt={photos[0].caption} loading="lazy" style={{ objectPosition: photos[0].focus }} />
          </figure>
        </div>
        <div className="lp-about-text">
          <div className="lp-rise" style={{ ['--i' as any]: 1 }}>
            <h3>Where we started</h3>
            <p>
              We wrote our final exams at Idagha Secondary School in {GRAD_YEAR}. Since then we have
              scattered across cities, campuses and jobs, but the WhatsApp group never went quiet.
            </p>
          </div>
          <div className="lp-rise" style={{ ['--i' as any]: 2 }}>
            <h3>What this place is for</h3>
            <p>
              One verified register of the set. Our reunions and who is coming. Elections for the
              executive, run openly. The awards we argue about. And the books, open to every member.
            </p>
          </div>
          <div className="lp-rise" style={{ ['--i' as any]: 3 }}>
            <button className="lp-btn lp-btn--gold" onClick={() => go('/about')}>Read about the association</button>
            {usingFallback && <p className="lp-about-cap">{photos[0].caption}.</p>}
          </div>
        </div>
      </section>

      {/* ── Reunions ── */}
      <section className="lp-section lp-wrap" id="reunions" aria-labelledby="reunions-h">
        <div className="lp-reunions-head lp-rise">
          <h2 id="reunions-h" className="lp-h2">Reunions and gatherings</h2>
        </div>

        {next ? (
          <div className="lp-next">
            <div className="lp-next-main lp-rise">
              <h3>{next.title}</h3>
              <p className="lp-next-meta">{fmtDay(next.date)}{next.venue ? ` · ${next.venue}` : ''}</p>
              {clock && (
                <div className="lp-clock" aria-label="Time until the event">
                  <div><b>{clock.days}</b><span>days</span></div>
                  <div><b>{clock.hours}</b><span>hours</span></div>
                  <div><b>{clock.minutes}</b><span>minutes</span></div>
                  <div><b>{clock.seconds}</b><span>seconds</span></div>
                </div>
              )}
            </div>
            <div className="lp-next-side lp-rise" style={{ ['--i' as any]: 1 }}>
              <p className="lp-lead">
                <strong>{next.rsvp?.going || 0} classmates</strong> have said they are coming
                {next.rsvp?.headcount > next.rsvp?.going ? `, ${next.rsvp.headcount} people with guests` : ''}.
              </p>
              {next.fee > 0 && <p>Contribution: ₦{Number(next.fee).toLocaleString()} per member.</p>}
              <div>
                <button className="lp-btn" onClick={() => go(`/events/${next._id}`)}>RSVP for this reunion</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lp-next">
            <div className="lp-next-main lp-rise">
              <h3>The next reunion is being planned</h3>
              <p className="lp-next-meta">The date goes up here as soon as the executive confirms it.</p>
            </div>
            <div className="lp-next-side lp-rise">
              <p>Every naira for the reunion is tracked in the Reunion Fund, open to all members.</p>
              <div><button className="lp-btn" onClick={() => go('/reunion-fund')}>See the Reunion Fund</button></div>
            </div>
          </div>
        )}

        {upcoming.length > 1 && (
          <div className="lp-events">
            {upcoming.slice(1, 9).map((e: any, i: number) => (
              <button key={e._id} className="lp-event lp-rise" style={{ ['--i' as any]: i % 2 }} onClick={() => go(`/events/${e._id}`)}>
                <span className="lp-event-mark shield">
                  {e.coverImage ? <img src={e.coverImage} alt="" loading="lazy" /> : initials(e.title)}
                </span>
                <span>
                  <span className="lp-event-top"><strong>{e.title}</strong><span>{fmtShort(e.date)}</span></span>
                  {e.description && <p>{e.description.length > 120 ? e.description.slice(0, 120) + '…' : e.description}</p>}
                  {e.venue && <em>{e.venue}</em>}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Elections ── */}
      <section className="lp-elect" id="elections" aria-labelledby="elect-h">
        <div className="lp-plate lp-rise">
          {posters.length > 0 ? (
            <div className="lp-fade" style={{ position: 'absolute', inset: 0 }}>
              {posters.map((src, i) => (
                <img key={i} src={src} alt="Campaign poster" className={i === posterIdx ? 'is-on' : ''} style={{ objectFit: 'contain' }} />
              ))}
            </div>
          ) : (
            <>
              <div className="shield"><span>{election ? new Date(election.createdAt).getFullYear() : new Date().getFullYear()}</span></div>
              <p className="lp-plate-cap">{election ? election.title : 'Executive elections'}</p>
            </>
          )}
        </div>
        <div className="lp-elect-text">
          <div>
            <h2 id="elect-h">Run for office, or choose who does</h2>
            <div className="lp-tabs" role="tablist" aria-label="Elections" style={{ marginTop: 28 }}>
              <button role="tab" aria-selected={electTab === 'positions'} onClick={() => setElectTab('positions')}>Positions</button>
              <button role="tab" aria-selected={electTab === 'how'} onClick={() => setElectTab('how')}>How it works</button>
              {election?.status === 'closed' && (
                <button role="tab" aria-selected={electTab === 'results'} onClick={() => setElectTab('results')}>Results</button>
              )}
            </div>
            {electTab === 'positions' && (
              election && election.positions?.length ? (
                <>
                  <p className="lp-elect-body">
                    {election.status === 'forms' && 'Nomination forms are on sale now. Pay by bank transfer, upload your receipt, and the Secretary confirms it.'}
                    {election.status === 'screening' && 'Form sales have closed. Aspirants are being screened.'}
                    {election.status === 'voting' && 'Voting is open. Every verified member gets one vote per position.'}
                    {election.status === 'closed' && 'This election is over. The results are published for every member to see.'}
                  </p>
                  <ul className="lp-positions">
                    {election.positions.map((p: any) => (
                      <li key={p._id}>{p.title}<span>₦{Number(p.formPrice).toLocaleString()} form</span></li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="lp-elect-body">
                  No election is running right now. When the executive’s tenure ends, the positions and
                  form prices will be listed here.
                </p>
              )
            )}
            {electTab === 'how' && (
              <ol className="lp-steps">
                <li>Buy a nomination form for the position you want, by bank transfer.</li>
                <li>Upload your receipt. The Secretary confirms the payment.</li>
                <li>Submit your manifesto and photo, then wait for screening.</li>
                <li>Cleared candidates go on the ballot. Members vote once per position, online.</li>
                <li>Results are published to every member when voting closes.</li>
              </ol>
            )}
            {electTab === 'results' && election && (
              <p className="lp-elect-body">The full count for every position is on the election page, open to all members.</p>
            )}
          </div>

          <div className="lp-cells">
            <button className="lp-btn" onClick={() => go(election ? `/elections/${election._id}` : '/elections')}>
              {election?.status === 'voting' ? 'Cast your vote' : election?.status === 'forms' ? 'Buy a nomination form' : 'Go to elections'}
            </button>
            <button className="lp-btn lp-btn--tone" onClick={() => go('/executives')}>Meet the executive</button>
          </div>
        </div>
      </section>

      {/* ── Executives ── */}
      <section className="lp-section lp-wrap" id="executives" aria-labelledby="exec-h">
        <div className="lp-board">
          <div className="lp-tile lp-tile--head lp-rise">
            <h2 id="exec-h">Your executive</h2>
            <p>Elected by members, accountable to members. Past executives are kept on record in the portal.</p>
          </div>
          {execList.length === 0 ? (
            <div className="lp-tile lp-rise" style={{ gridColumn: 'span 2' }}>
              <strong>The executive list is on its way</strong>
              <span>The Secretary will add each officer here with their role.</span>
            </div>
          ) : execList.slice(0, 10).map((x: any, i: number) => (
            <div key={x._id} className="lp-tile lp-rise" style={{ ['--i' as any]: i % 4 }}>
              <span>{x.position}</span>
              <strong style={{ maxWidth: x.photo ? '60%' : undefined }}>{x.name}</strong>
              {x.photo && <div className="lp-tile-photo shield"><img src={x.photo} alt={x.name} loading="lazy" /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Class awards ── */}
      <section className="lp-section lp-wrap" id="awards" aria-labelledby="awards-h">
        <div className="lp-awards">
          <div className="lp-awards-intro lp-rise">
            <h2 id="awards-h" className="lp-h2">The class awards</h2>
            <p className="lp-lead">
              Best online. Best talker. Most active. Nominate a classmate, back the one you think deserves it,
              and watch the board move.
            </p>
            <div><button className="lp-btn" onClick={() => go('/awards')}>Nominate a classmate</button></div>
          </div>
          <ul className="lp-awards-list">
            {awardList.length === 0 ? (
              <li className="lp-award lp-rise">
                <div><h3>Categories open soon</h3><p>The Secretary sets the categories. Every member can nominate and support.</p></div>
              </li>
            ) : awardList.slice(0, 8).map((a: any, i: number) => {
              const lead = a.winner || a.nominees?.[0];
              return (
                <li key={a._id} className={`lp-award lp-rise${a.winner ? ' lp-award--won' : ''}`} style={{ ['--i' as any]: i % 3 }}>
                  <div>
                    <h3>{a.title}</h3>
                    <p>{a.nominees?.length || 0} nominated · {a.totalSupports || 0} supports</p>
                  </div>
                  <div className="lp-award-lead">
                    {lead ? (
                      <><b>{lead.memberName}</b><span>{a.winner ? 'Winner' : 'Leading'} · {lead.supports}</span></>
                    ) : <span>No nominations yet</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Memories ── */}
      <section className="lp-section lp-wrap" id="memories" aria-labelledby="mem-h">
        <div className="lp-gallery">
          <div>
            <button className="lp-frame shield lp-fade" onClick={() => setFrameIdx((frameIdx + 1) % photos.length)} aria-label="Next photograph">
              {photos.map((p: any, i: number) => (
                <img key={i} src={p.src} alt={p.caption || 'Class photograph'} className={i === frameIdx ? 'is-on' : ''} loading="lazy" style={{ objectPosition: p.focus }} />
              ))}
            </button>
            <p className="lp-frame-cap">{photos[frameIdx]?.caption}</p>
          </div>
          <div className="lp-gallery-text lp-rise">
            <h2 id="mem-h" className="lp-h2">Our memories</h2>
            <p className="lp-lead">
              Assembly mornings, inter-house sports, the last day of WAEC, and every reunion since.
              Members add their own photographs; the Secretary files them into albums.
            </p>
            <div><button className="lp-btn" onClick={() => go('/gallery')}>Open the gallery</button></div>
          </div>
        </div>
      </section>

      {/* ── The set in numbers ── */}
      <section className="lp-section lp-wrap" aria-labelledby="nums-h">
        <div className="lp-stats">
          <h2 id="nums-h" className="lp-stats-head lp-rise">The set in numbers</h2>
          <div className="lp-stat lp-stat--a lp-rise">
            <b>{memberCount?.count ?? '—'}</b>
            <span>classmates verified on the register</span>
          </div>
          <div className="lp-stat lp-stat--b lp-rise" style={{ ['--i' as any]: 1 }}>
            <b>{yearsOut}</b>
            <span>years since our final exams</span>
          </div>
          <div className="lp-stat lp-stat--c lp-rise" style={{ ['--i' as any]: 2 }}>
            {gallery?.total ? (
              <><b>{gallery.total}</b><span>photographs in the gallery</span></>
            ) : (
              <><b>{upcoming.length}</b><span>gatherings on the calendar</span></>
            )}
          </div>
        </div>
      </section>

      {/* ── Closing call ── */}
      <section className="lp-cta" aria-labelledby="cta-h">
        <div className="lp-cta-shield" aria-hidden="true">
          <div className="shield"><img src="/logo.png" alt="" /></div>
        </div>
        <div className="lp-cta-text">
          <h2 id="cta-h">Not on the register yet?</h2>
          <p>Add your name, phone and photo. The Secretary confirms you, and the portal opens.</p>
          <p className="lp-cta-fact">Registration is free.</p>
          <div><button className="lp-btn lp-btn--gold" onClick={() => router.push('/register')}>Register as a member</button></div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-blocks" aria-label="Idagha 2018">
          {'IDAGHA'.split('').map((c, i) => <span key={i} style={{ height: `${[100, 78, 92, 66, 86, 72][i]}%` }}>{c}</span>)}
          <span className="lp-blocks-gap" />
          {'18'.split('').map((c, i) => <span key={`y${i}`} style={{ height: `${[96, 82][i]}%` }}>{c}</span>)}
        </div>
        <div className="lp-footer-cols">
          <div className="lp-footer-links">
            <div><h3>The set</h3><ul>
              <li><button onClick={() => go('/members')}>Members</button></li>
              <li><button onClick={() => go('/executives')}>Executives</button></li>
              <li><button onClick={() => go('/about')}>About</button></li>
            </ul></div>
            <div><h3>Together</h3><ul>
              <li><button onClick={() => go('/events')}>Reunions</button></li>
              <li><button onClick={() => go('/gallery')}>Gallery</button></li>
              <li><button onClick={() => go('/awards')}>Class awards</button></li>
            </ul></div>
            <div><h3>Decide</h3><ul>
              <li><button onClick={() => go('/elections')}>Elections</button></li>
              <li><button onClick={() => go('/executives')}>Past executives</button></li>
            </ul></div>
            <div><h3>The books</h3><ul>
              <li><button onClick={() => go('/contributions')}>Contributions</button></li>
              <li><button onClick={() => go('/expenses')}>Expenses</button></li>
              <li><button onClick={() => go('/reports')}>Reports</button></li>
            </ul></div>
          </div>
          <div className="lp-footer-contact">
            <p><strong>IDAGHA Secondary School</strong>Class of {GRAD_YEAR} Alumni Association</p>
            <p><strong>Questions?</strong>Message the Secretary in the class WhatsApp group.</p>
          </div>
        </div>
        <div className="lp-footer-base">
          <span>© {new Date().getFullYear()} IDAGHA Class of {GRAD_YEAR} Alumni</span>
          <button className="lp-btn lp-btn--paper" onClick={() => router.push('/admin')}>Secretary login</button>
        </div>
        {usingFallback && (
          <p className="lp-credits">
            Photographs: “Reading Wikipedia in the Classroom for Secondary School Students 59” and “… 02” by James Rhoda,{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>, via{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Reading_Wikipedia_in_the_Classroom_for_Secondary_School_Students_59.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>.
          </p>
        )}
      </footer>
    </div>
  );
}
