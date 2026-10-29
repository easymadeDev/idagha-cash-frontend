import Layout from '../components/Layout';
import useSWR from 'swr';
import { fetcher, initials } from '../lib/member';
import { withVacancies, positionRank } from '../lib/positions';
import ExecFigure from '../components/ExecFigure';

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
  const list = Array.isArray(current) ? withVacancies(current) : [];
  const pastTeams = Array.isArray(past) ? past : [];

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
                <ExecFigure x={x} />
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
