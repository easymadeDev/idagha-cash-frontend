import { useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../../components/Layout';
import { fetcher } from '../../lib/member';
import EventCard from '../../components/EventCard';

export default function EventsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data, isLoading } = useSWR('/api/events', fetcher);
  const all = Array.isArray(data) ? data : [];
  const now = Date.now();
  const upcoming = all.filter((e: any) => new Date(e.endDate || e.date).getTime() >= now);
  const past = all.filter((e: any) => new Date(e.endDate || e.date).getTime() < now).reverse();
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-green"><span className="badge-dot" />Reunions & Events</span>
          </div>
          <h1>Events</h1>
          <p>Reunions, meetings and gatherings of the set. Let us know you are coming.</p>
        </div>

        <div className="pill-tabs">
          <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
          <button className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}>Past ({past.length})</button>
        </div>

        {isLoading ? (
          <div className="grid-auto">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300 }} />)}</div>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>
            {tab === 'upcoming' ? 'No upcoming events yet. Check back soon.' : 'No past events on record.'}
          </div>
        ) : (
          <div className="grid-auto">
            {list.map((e: any) => <EventCard key={e._id} e={e} onClick={() => router.push(`/events/${e._id}`)} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}

