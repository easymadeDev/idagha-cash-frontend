import { formatNaira } from '../lib/api';

const TYPE_LABEL: Record<string, string> = {
  reunion: 'Reunion', meeting: 'Meeting', social: 'Social', outreach: 'Outreach', other: 'Event',
};

export default function EventCard({ e, onClick }: { e: any; onClick: () => void }) {
  const d = new Date(e.date);
  return (
    <div className="card event-card" onClick={onClick} role="link" tabIndex={0}
      onKeyDown={(k) => { if (k.key === 'Enter') onClick(); }}>
      <div className="event-cover">
        {e.coverImage
          ? <img src={e.coverImage} alt={e.title} loading="lazy" />
          : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <img src="/logo.png" alt="" style={{ width: 90, height: 90, opacity: 0.5, objectFit: 'contain' }} />
            </div>}
        <div className="event-date-chip">
          <b>{d.getDate()}</b>
          <span>{d.toLocaleDateString('en-GB', { month: 'short' })} {d.getFullYear()}</span>
        </div>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="badge badge-green">{TYPE_LABEL[e.type] || 'Event'}</span>
          {e.fee > 0 ? <span className="badge badge-yellow">{formatNaira(e.fee)}</span> : <span className="badge badge-blue">Free</span>}
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{e.title}</div>
        {e.venue && <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>{e.venue}</div>}
        <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--green-400)', fontWeight: 700 }}>
          {e.rsvp?.going || 0} going{e.rsvp?.maybe ? ` Â· ${e.rsvp.maybe} maybe` : ''}
        </div>
      </div>
    </div>
  );
}


