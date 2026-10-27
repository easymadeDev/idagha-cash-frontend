import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Poster from '../components/Poster';
import { Reveal, Stagger, Item, CountUp, EASE } from '../components/motion';
import { useGate } from '../lib/gate';
import { fetcher, initials } from '../lib/member';
import { withVacancies } from '../lib/positions';
import { formatNaira, formatDate } from '../lib/api';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Birthdays are stored as YYYY-MM-DD (date input) or MM-DD; anything else is skipped
function birthdayThisMonth(b?: string): number | null {
  if (!b) return null;
  const now = new Date().getMonth() + 1;
  let m: RegExpMatchArray | null;
  if ((m = b.trim().match(/^\d{4}-(\d{2})-(\d{2})/))) return Number(m[1]) === now ? Number(m[2]) : null;
  if ((m = b.trim().match(/^(\d{1,2})-(\d{1,2})$/))) return Number(m[1]) === now ? Number(m[2]) : null;
  return null;
}

function useClock(target?: string) {
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

const Arrow = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export async function getStaticProps() {
  const { getClassPhotos } = await import('../lib/classPhotos');
  return { props: { classPhotos: getClassPhotos() } };
}

export default function Home({ classPhotos = [] }: { classPhotos?: { src: string; caption: string; focus: string }[] }) {
  const router = useRouter();
  const { member } = useGate();
  const { data: events } = useSWR('/api/events', fetcher);
  const { data: announcements } = useSWR('/api/announcements', fetcher);
  const { data: elections } = useSWR('/api/elections', fetcher);
  const { data: awards } = useSWR('/api/awards', fetcher);
  const { data: gallery } = useSWR('/api/gallery?page=1', fetcher);
  const { data: members } = useSWR('/api/members', fetcher);
  const { data: execs } = useSWR('/api/executives', fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);

  const upcoming = useMemo(() => (Array.isArray(events) ? events.filter((e: any) => new Date(e.endDate || e.date).getTime() > Date.now()) : []), [events]);
  const next = upcoming[0];
  const clock = useClock(next?.date);
  const election = Array.isArray(elections) ? elections[0] : null;
  const { data: electionDetail } = useSWR(election ? `/api/elections/${election._id}` : null, fetcher);
  const aspirants: any[] = (electionDetail?.positions || []).flatMap((p: any) =>
    (['voting', 'closed'].includes(electionDetail.status) ? p.candidates : p.aspirants || []).map((c: any) => ({ ...c, positionTitle: p.title })));
  const memberList = Array.isArray(members) ? members : [];
  const birthdays = memberList
    .map((m: any) => ({ ...m, day: birthdayThisMonth(m.birthday) }))
    .filter((m: any) => m.day)
    .sort((a: any, b: any) => a.day - b.day);
  const today = new Date().getDate();
  // Members' uploads first; our own class photographs fill in until there are six
  const photos = [
    ...(Array.isArray(gallery?.items) ? gallery.items : []),
    ...classPhotos.map((p, i) => ({ _id: `class-${i}`, image: p.src, caption: p.caption, focus: p.focus })),
  ].slice(0, 6);
  const news = Array.isArray(announcements) ? announcements.slice(0, 4) : [];
  const awardList = Array.isArray(awards) ? awards.slice(0, 4) : [];
  const execList = Array.isArray(execs) ? withVacancies(execs) : [];
  const firstName = member?.name?.split(' ')[0] || 'classmate';
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long' });

  const finding = next
    ? `${next.title} is in ${clock?.days ?? '…'} days, and ${next.rsvp?.going || 0} classmates have said they are coming.`
    : election?.status === 'voting'
      ? `Voting is open in the ${election.title}. Your vote counts once per position.`
      : 'Here is what is happening with the set.';

  return (
    <Layout>
      <div className="container">
        {/* ── Greeting and the next gathering ── */}
        <div className="hm-hero">
          <motion.div className="hm-greet" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
            <motion.div className="hm-greet-shield" aria-hidden="true"
              initial={{ y: 60, rotate: 6, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}>
              {(member?.photo || classPhotos[0]?.src || photos[0]?.image) && (
                <img src={member?.photo || classPhotos[0]?.src || photos[0]?.image} alt=""
                  style={{ objectPosition: !member?.photo && classPhotos[0] ? classPhotos[0].focus : undefined }} />
              )}
            </motion.div>
            <div>
              <h1>{greeting()}, {firstName}</h1>
              <p>{finding}</p>
            </div>
            <div className="hm-greet-actions">
              {next && <button className="btn btn-gold" onClick={() => router.push(`/events/${next._id}`)}>RSVP for {next.type === 'reunion' ? 'the reunion' : 'the event'}</button>}
              {election && election.status !== 'closed' && (
                <button className="btn btn-ghost" onClick={() => router.push(`/elections/${election._id}`)}>
                  {election.status === 'voting' ? 'Cast your vote' : election.status === 'forms' ? 'Buy a nomination form' : 'See the aspirants'}
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => router.push('/gallery')}>Share a photo</button>
            </div>
          </motion.div>

          <motion.div className="hm-next" onClick={() => router.push(next ? `/events/${next._id}` : '/events')}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}>
            <span style={{ fontWeight: 600 }}>{next ? 'Next gathering' : 'Gatherings'}</span>
            <h2>{next ? next.title : 'Nothing on the calendar yet'}</h2>
            <span>{next ? `${formatDate(next.date)}${next.venue ? ` · ${next.venue}` : ''}` : 'The executive will post the next reunion here.'}</span>
            {clock && (
              <div className="hm-clock">
                {[['days', clock.days], ['hours', clock.hours], ['mins', clock.mins], ['secs', clock.secs]].map(([l, v]) => (
                  <div key={l as string}>
                    <motion.b key={`${l}-${v}`} initial={{ y: -8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>{v}</motion.b>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Where to go ── */}
        <Stagger className="hm-quick" style={{ marginTop: 16 }}>
          {[
            ['Members', `${memberList.length} on the register`, '/members', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
            ['Events', `${upcoming.length} coming up`, '/events', 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
            ['Elections', election ? election.title : 'None running', '/elections', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
            ['Gallery', `${gallery?.total ?? 0} photographs`, '/gallery', 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
          ].map(([title, sub, href, icon]) => (
            <Item key={href} className="hm-tile" onClick={() => router.push(href)}>
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div><b>{title}</b><br /><span>{sub}</span></div>
            </Item>
          ))}
        </Stagger>

        <div className="hm-grid">
          {/* ── Announcements ── */}
          <Reveal className="hm-panel hm-span-7">
            <div className="hm-panel-head"><h2>From the executive</h2></div>
            {news.length === 0 ? (
              <p style={{ color: 'var(--text-3)' }}>No announcements right now.</p>
            ) : news.map((a: any, i: number) => (
              <motion.div key={a._id} className="hm-row" style={{ alignItems: 'flex-start', cursor: 'default' }}
                initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, ease: EASE, duration: 0.5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, marginTop: 7, flexShrink: 0, background: a.type === 'warning' ? 'var(--gold)' : 'var(--brand)' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ color: 'var(--text-1)' }}>{a.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{formatDate(a.createdAt)}</span>
                  </div>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', marginTop: 4, lineHeight: 1.55 }}>{a.content}</p>
                </div>
              </motion.div>
            ))}
          </Reveal>

          {/* ── Election posters ── */}
          <Reveal className="hm-panel hm-span-5" delay={0.08}>
            <div className="hm-panel-head">
              <h2>{election ? election.title : 'Elections'}</h2>
              <button className="hm-link" onClick={() => router.push(election ? `/elections/${election._id}` : '/elections')}>Open</button>
            </div>
            {aspirants.length > 0 ? (
              <div className="swipe-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                {aspirants.slice(0, 3).map((c: any) => (
                  <motion.div key={c._id} whileHover={{ y: -6, rotate: -1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => router.push(`/elections/${election._id}`)} style={{ cursor: 'pointer' }}>
                    <Poster download={false} data={{ photo: c.photo, name: c.memberName, band: 'VOTE', role: `for ${c.positionTitle}`, slogan: c.slogan, footer: electionDetail.title, badge: c.applicationStatus === 'cleared' ? 'CANDIDATE' : 'ASPIRANT' }} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-3)' }}>
                {election ? 'No aspirants yet. Nomination forms are on the election page.' : 'No election is running. When one opens, the aspirants’ posters show here.'}
              </p>
            )}
            {aspirants.length > 3 && <span style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>and {aspirants.length - 3} more aspirants</span>}
          </Reveal>

          {/* ── Memories ── */}
          <Reveal className="hm-panel hm-span-7">
            <div className="hm-panel-head">
              <h2>Memories</h2>
              <button className="hm-link" onClick={() => router.push('/gallery')}>Open the gallery</button>
            </div>
            {photos.length === 0 ? (
              <p style={{ color: 'var(--text-3)' }}>No photographs yet. Share the first one from school days.</p>
            ) : (
              <div className="swipe-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                {/* the panel reveals as a whole; per-photo in-view triggers fail inside the phone swipe row */}
                {photos.map((p: any) => (
                  <motion.div key={p._id} onClick={() => router.push('/gallery')}
                    transition={{ duration: 0.4, ease: EASE }} whileHover={{ scale: 1.03 }}
                    style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-elevated)' }}>
                    <img src={p.image} alt={p.caption || p.album} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: (p as any).focus || '50% 30%' }} />
                  </motion.div>
                ))}
              </div>
            )}
          </Reveal>

          {/* ── Class awards ── */}
          <Reveal className="hm-panel hm-span-5" delay={0.08}>
            <div className="hm-panel-head">
              <h2>Class awards</h2>
              <button className="hm-link" onClick={() => router.push('/awards')}>Nominate</button>
            </div>
            {awardList.length === 0 ? (
              <p style={{ color: 'var(--text-3)' }}>Award categories open soon.</p>
            ) : awardList.map((a: any) => {
              const lead = a.winner || a.nominees?.[0];
              const top = lead?.supports || 0;
              return (
                <div key={a._id} className="hm-row" onClick={() => router.push('/awards')}>
                  <div className="avatar" style={{ width: 40, height: 40, fontSize: '0.75rem' }}>
                    {lead?.memberPhoto ? <img src={lead.memberPhoto} alt="" /> : lead ? initials(lead.memberName) : '—'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ color: 'var(--text-1)' }}>{a.title}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                      {lead ? `${a.winner ? 'Winner' : 'Leading'}: ${lead.memberName}` : 'No nominations yet'}
                    </div>
                    {top > 0 && a.totalSupports > 0 && (
                      <div className="vote-bar" style={{ marginTop: 6 }}>
                        <motion.i initial={{ width: 0 }} whileInView={{ width: `${(top / a.totalSupports) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--green-400)', fontVariantNumeric: 'tabular-nums' }}>{top}</span>
                </div>
              );
            })}
          </Reveal>

          {/* ── Birthdays ── */}
          <Reveal className="hm-panel hm-span-5">
            <div className="hm-panel-head"><h2>Birthdays in {monthName}</h2></div>
            {birthdays.length === 0 ? (
              <p style={{ color: 'var(--text-3)' }}>No birthdays on record this month.</p>
            ) : birthdays.slice(0, 6).map((m: any) => (
              <div key={m._id} className="hm-row" style={{ cursor: 'default' }}>
                <div className="avatar" style={{ width: 40, height: 40, fontSize: '0.75rem' }}>{m.photo ? <img src={m.photo} alt="" /> : initials(m.name)}</div>
                <strong style={{ flex: 1, color: 'var(--text-1)' }}>{m.name}</strong>
                <span className={`badge ${m.day === today ? 'badge-yellow' : 'badge-green'}`}>{m.day === today ? 'Today' : `${monthName.slice(0, 3)} ${m.day}`}</span>
              </div>
            ))}
          </Reveal>

          {/* ── Executive ── */}
          <Reveal className="hm-panel hm-span-7" delay={0.08}>
            <div className="hm-panel-head">
              <h2>Your executive</h2>
              <button className="hm-link" onClick={() => router.push('/executives')}>Meet them</button>
            </div>
            {execList.length === 0 ? (
              <p style={{ color: 'var(--text-3)' }}>The executive list is on its way.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {execList.map((x: any, i: number) => (
                  <motion.div key={x._id} className={x.vacant ? 'is-vacant' : undefined} onClick={() => router.push('/executives')}
                    initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, ease: EASE, duration: 0.5 }}
                    whileHover={{ y: -4 }}
                    style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', padding: 10, borderRadius: 14, background: 'var(--bg-surface)' }}>
                    <div className="avatar avatar-shield" style={{ width: 40, height: 45, fontSize: '0.75rem' }}>{x.photo ? <img src={x.photo} alt="" /> : x.vacant ? '?' : initials(x.name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gold-deep)', fontWeight: 600 }}>{x.position}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Reveal>

          {/* ── Finance lives in its own section: one line here ── */}
          <Reveal className="hm-span-12">
            <div className="hm-finance" onClick={() => router.push('/finance')} role="link" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push('/finance'); }}>
              <div>
                <strong style={{ fontFamily: 'var(--font-d)', fontSize: '1.4rem', color: 'var(--brand)', letterSpacing: '-0.02em' }}>The books are open</strong>
                <p style={{ color: 'var(--text-3)', marginTop: 2 }}>Every contribution and expense is recorded in the Finance section.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ fontFamily: 'var(--font-d)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand)' }}>
                  {stats ? <CountUp value={stats.walletBalance || 0} format={(n) => formatNaira(Math.round(n))} /> : '—'}
                </span>
                <span className="btn btn-primary">Open finance <Arrow /></span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Layout>
  );
}
