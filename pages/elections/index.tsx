import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../../components/Layout';
import { fetcher } from '../../lib/member';
import { formatDate } from '../../lib/api';
import { STATUS_INFO } from '../../lib/elections';

export default function ElectionsPage() {
  const router = useRouter();
  const { data, isLoading } = useSWR('/api/elections', fetcher);
  const list = Array.isArray(data) ? data : [];

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-green"><span className="badge-dot" />Democracy</span>
          </div>
          <h1>Elections</h1>
          <p>Buy a nomination form, run for office, and vote online. One member, one vote per position.</p>
        </div>

        {isLoading ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>
            No elections yet. When one is announced it will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {list.map((el: any) => {
              const s = STATUS_INFO[el.status] || STATUS_INFO.closed;
              return (
                <div key={el._id} className="card" style={{ padding: 22, cursor: 'pointer' }} onClick={() => router.push(`/elections/${el._id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <span className={`badge ${s.badge}`}>{s.label}</span>
                      <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.3rem', fontWeight: 800, margin: '10px 0 6px' }}>{el.title}</h2>
                      <p style={{ color: 'var(--text-3)', fontSize: '0.86rem' }}>
                        {el.positions?.length || 0} positions · {el.candidateCount || 0} cleared candidates · started {formatDate(el.createdAt)}
                      </p>
                    </div>
                    <span className="btn btn-primary btn-sm">{el.status === 'voting' ? 'Vote now' : el.status === 'forms' ? 'Buy a form' : 'View'} →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
