import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR, { mutate } from 'swr';
import Layout from '../../components/Layout';
import { useToast } from '../../components/Toast';
import { fetcher, memberFetcher, memberApi, errorMessage, initials } from '../../lib/member';
import { formatNaira } from '../../lib/api';
import { useGate } from '../../lib/gate';
import { useRequireLogin } from '../../lib/requireLogin';

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(to).getTime() - now);
  const parts = [
    ['Days', Math.floor(diff / 86400000)],
    ['Hours', Math.floor((diff / 3600000) % 24)],
    ['Mins', Math.floor((diff / 60000) % 60)],
    ['Secs', Math.floor((diff / 1000) % 60)],
  ];
  return (
    <div className="countdown">
      {parts.map(([l, v]) => <div key={l as string}><b>{String(v).padStart(2, '0')}</b><span>{l}</span></div>)}
    </div>
  );
}

export default function EventDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const id = router.query.id as string | undefined;
  const key = id ? `/api/events/${id}` : null;
  const { data: e, error } = useSWR(key, fetcher);
  const { cleared } = useGate();
  const requireLogin = useRequireLogin();
  // the event is public; your own RSVP loads once signed in
  const { data: mine } = useSWR(id && cleared ? `/api/events/${id}/my-rsvp` : null, memberFetcher);
  const [guests, setGuests] = useState(0);
  const [saving, setSaving] = useState('');

  useEffect(() => { if (mine?.guests != null) setGuests(mine.guests); }, [mine?.guests]);

  if (error || e?.statusCode) {
    return <Layout><div className="container"><div className="card" style={{ margin: '48px 0', padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>Event not found.</div></div></Layout>;
  }
  if (!e) {
    return <Layout><div className="container" style={{ paddingTop: 48 }}><div className="skeleton" style={{ height: 360 }} /></div></Layout>;
  }

  const isPast = new Date(e.endDate || e.date).getTime() < Date.now();
  const full = e.capacity > 0 && e.rsvp?.headcount >= e.capacity && mine?.status !== 'going';

  const respond = async (status: string) => {
    setSaving(status);
    try {
      await memberApi.post(`/events/${e._id}/rsvp`, { status, guests: status === 'going' ? guests : 0 });
      mutate(`/api/events/${e._id}/my-rsvp`);
      mutate(key);
      mutate('/api/events');
      toast(status === 'going' ? 'See you there!' : status === 'maybe' ? 'Marked as maybe' : 'Response saved', 'success');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally { setSaving(''); }
  };

  const when = new Date(e.date);

  return (
    <Layout>
      <div className="container">
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 24 }} onClick={() => router.push('/events')}>← All events</button>

        <div className="event-cover" style={{ borderRadius: 'var(--radius)', marginTop: 16, aspectRatio: '21 / 8', minHeight: 200, border: '1px solid var(--border)' }}>
          {e.coverImage
            ? <img src={e.coverImage} alt={e.title} />
            : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><img src="/logo.png" alt="" style={{ width: 120, opacity: 0.45 }} /></div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 28, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{e.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0 20px' }}>
              <span className="badge badge-green">{when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="badge badge-blue">{when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              {e.fee > 0 ? <span className="badge badge-yellow">{formatNaira(e.fee)} per member</span> : <span className="badge badge-blue">Free</span>}
            </div>
            <div className="card" style={{ padding: 20, display: 'grid', gap: 10, marginBottom: 20 }}>
              {e.venue && <div><span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>Venue</span><div style={{ fontWeight: 700 }}>{e.venue}</div></div>}
              {e.dressCode && <div><span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>Dress code</span><div style={{ fontWeight: 700 }}>{e.dressCode}</div></div>}
              {e.capacity > 0 && <div><span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>Capacity</span><div style={{ fontWeight: 700 }}>{e.rsvp?.headcount || 0} / {e.capacity} places taken</div></div>}
            </div>
            {e.description && <p style={{ color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{e.description}</p>}
            {e.fee > 0 && (
              <div className="alert alert-success" style={{ marginTop: 20 }}>
                Pay your contribution through the Reunion Fund so it is recorded against your name.
                <a className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => router.push('/reunion-fund')}>Reunion Fund</a>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isPast && (
              <div className="card" style={{ padding: 20 }}>
                <div className="section-title" style={{ marginBottom: 12 }}>Starts in</div>
                <Countdown to={e.date} />
              </div>
            )}

            <div className="card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>Are you coming?</div>
              {isPast ? (
                <p style={{ color: 'var(--text-3)', fontSize: '0.86rem' }}>This event has already taken place.</p>
              ) : !e.rsvpOpen ? (
                <p style={{ color: 'var(--text-3)', fontSize: '0.86rem' }}>RSVP is closed for this event.</p>
              ) : (
                <>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginBottom: 14 }}>
                    {mine?.status ? <>Your answer: <strong style={{ color: 'var(--green-400)' }}>{mine.status === 'not_going' ? "Can't make it" : mine.status === 'going' ? 'Going' : 'Maybe'}</strong>. You can change it any time.</> : 'Tell the organisers so they can plan.'}
                  </p>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Guests coming with you</label>
                    <select className="form-select" value={guests} onChange={(ev) => setGuests(Number(ev.target.value))}>
                      {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? 'Just me' : `+${n}`}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <button className="btn btn-primary" disabled={!!saving || full} onClick={() => requireLogin(() => respond('going'))}>
                      {saving === 'going' ? 'Saving…' : full ? 'Fully booked' : !cleared ? 'Sign in to RSVP' : mine?.status === 'going' ? 'Update — I’m going' : 'I’m going'}
                    </button>
                    {cleared && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button className="btn btn-ghost" disabled={!!saving} onClick={() => respond('maybe')}>Maybe</button>
                        <button className="btn btn-ghost" disabled={!!saving} onClick={() => respond('not_going')}>Can’t make it</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>
                Who’s coming <span style={{ color: 'var(--green-400)' }}>({e.rsvp?.going || 0})</span>
              </div>
              {e.attendees?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                  {e.attendees.map((a: any) => (
                    <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.7rem' }}>
                        {a.memberPhoto ? <img src={a.memberPhoto} alt="" /> : initials(a.memberName)}
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{a.memberName}</span>
                      {a.guests > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-3)' }}>+{a.guests}</span>}
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--text-3)', fontSize: '0.86rem' }}>Be the first to RSVP.</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
