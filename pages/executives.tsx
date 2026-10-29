import Layout from '../components/Layout';
import useSWR from 'swr';
import { fetcher, initials } from '../lib/member';
import { withVacancies, positionRank } from '../lib/positions';
import MemberFigure from '../components/MemberFigure';

// Phones: the officer drawn as a person (same figure as the members page), contact buttons under the name
function ExecFigure({ x, gender }: { x: any; gender?: string }) {
  const wa = x.phone ? `https://wa.me/${x.phone.replace(/\D/g, '').replace(/^0/, '234')}` : '';
  return (
    <div className={`mf-figure ex-figure${x.vacant ? ' is-vacant' : ''}`}>
      <MemberFigure id={`ex-${x._id}`} photo={x.photo} gender={gender} initials={x.vacant ? '?' : initials(x.name)} />
      <div className="mf-caption">
        <b>{x.name}</b>
        <em>{x.position}</em>
        {x.phone && (
          <div className="ex-contact">
            <a href={`tel:${x.phone}`} aria-label={`Call ${x.name}`}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" strokeLinejoin="round" /></svg>
            </a>
            <a href={wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${x.name}`}>
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z" /></svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ExecCard({ x }: { x: any }) {
  return (
    <div className={`card exec-card${x.vacant ? ' is-vacant' : ''}`}>
      <div className="avatar avatar-shield">
        {x.photo ? <img src={x.photo} alt={x.name} /> : x.vacant ? '?' : initials(x.name)}
      </div>
      <div className="exec-pos">{x.position}</div>
      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-1)' }}>{x.name}</div>
      {x.vacant && <p style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>Filled at the next election</p>}
      {x.bio && <p style={{ color: 'var(--text-3)', fontSize: '0.84rem', lineHeight: 1.6 }}>{x.bio}</p>}
      {(x.phone || x.email) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
          {x.phone && <a className="btn btn-ghost btn-sm" href={`tel:${x.phone}`}>Call</a>}
          {x.phone && <a className="btn btn-ghost btn-sm" href={`https://wa.me/${x.phone.replace(/\D/g, '').replace(/^0/, '234')}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          {x.email && <a className="btn btn-ghost btn-sm" href={`mailto:${x.email}`}>Email</a>}
        </div>
      )}
    </div>
  );
}

export default function ExecutivesPage() {
  const { data: current, isLoading } = useSWR('/api/executives', fetcher);
  const { data: past } = useSWR('/api/executives/past', fetcher);
  const { data: members } = useSWR('/api/members', fetcher);
  const list = Array.isArray(current) ? withVacancies(current) : [];
  const pastTeams = Array.isArray(past) ? past : [];
  // executive entries don't store gender: take it from the linked member (or the same name) for the suit or blazer
  const memberList: any[] = Array.isArray(members) ? members : [];
  const genderOf = (x: any) => (memberList.find((m) => m._id === x.memberId)
    || memberList.find((m) => m.name.trim().toLowerCase() === (x.name || '').trim().toLowerCase()))?.gender;

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-green"><span className="badge-dot" />Leadership</span>
          </div>
          <h1>Executives</h1>
          <p>The people elected to run the Class of 2018, and every team that served before them.</p>
        </div>

        <div className="section-header">
          <div>
            <div className="section-title">Current executive</div>
            <div className="section-sub">Reach out to any officer directly</div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid-auto">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}</div>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
            The current executive has not been added yet.
          </div>
        ) : (
          <div className="grid-auto ex-grid">
            {list.map((x: any) => (
              <div key={x._id} className="ex-item">
                <ExecFigure x={x} gender={genderOf(x)} />
                <ExecCard x={x} />
              </div>
            ))}
          </div>
        )}

        {pastTeams.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div className="section-header">
              <div>
                <div className="section-title">Past executives</div>
                <div className="section-sub">Thank you for your service</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {pastTeams.map((team: any) => (
                <div key={team.tenure}>
                  <div style={{ fontWeight: 800, color: 'var(--yellow)', marginBottom: 12 }}>{team.tenure}</div>
                  <div className="grid-auto-sm">
                    {[...team.members].sort((a: any, b: any) => positionRank(a.position) - positionRank(b.position)).map((x: any) => (
                      <div key={x._id} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="avatar avatar-shield" style={{ width: 44, height: 50, fontSize: '0.8rem' }}>
                          {x.photo ? <img src={x.photo} alt={x.name} /> : initials(x.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{x.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{x.position}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
