import Layout from '../components/Layout';
import useSWR from 'swr';
import { formatNaira, formatDate } from '../lib/api';
import { useRouter } from 'next/router';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const avatarColors = [
  ['rgba(34,197,94,0.18)', 'var(--green-400)'],
  ['rgba(96,165,250,0.18)', 'var(--blue)'],
  ['rgba(251,191,36,0.18)', 'var(--yellow)'],
  ['rgba(248,113,113,0.18)', 'var(--red)'],
  ['rgba(167,139,250,0.18)', '#c4b5fd'],
  ['rgba(251,146,60,0.18)', '#fb923c'],
  ['rgba(34,211,238,0.18)', '#22d3ee'],
  ['rgba(244,114,182,0.18)', '#f472b6'],
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function formatBirthday(d: string) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long' });
}

export default function MembersPage() {
  const router = useRouter();
  const { data: contributions } = useSWR('/api/contributions', fetcher);
  const { data: members } = useSWR('/api/members', fetcher);
  const [search, setSearch] = useState('');

  const contribList = Array.isArray(contributions) ? contributions : [];
  const memberList = Array.isArray(members) ? members : [];

  const contribByName: Record<string, { total: number; count: number; last: string }> = {};
  contribList.forEach((c: any) => {
    const key = c.contributorName.trim();
    if (!contribByName[key]) contribByName[key] = { total: 0, count: 0, last: c.date };
    contribByName[key].total += c.amount;
    contribByName[key].count += 1;
    if (new Date(c.date) > new Date(contribByName[key].last)) contribByName[key].last = c.date;
  });

  const filtered = memberList
    .filter((m: any) => m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.nickname || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.location || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      const ac = contribByName[a.name]?.total || 0;
      const bc = contribByName[b.name]?.total || 0;
      return bc - ac;
    });

  const totalContrib = contribList.reduce((s: number, c: any) => s + c.amount, 0);

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-blue"><span className="badge-dot" />Group Members</span>
          </div>
          <h1>Members Directory</h1>
          <p>All registered group members. Publicly visible for accountability and transparency.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Members', value: memberList.length, sub: 'Registered', cls: '' },
            { label: 'Contributors', value: Object.keys(contribByName).length, sub: 'Have paid', cls: 'green' },
            { label: 'Total Collected', value: formatNaira(totalContrib), sub: 'From all members', cls: 'green' },
            { label: 'Total Payments', value: contribList.length, sub: 'Transactions', cls: '' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Wallet CTA */}
        <div className="members-cta-bar">
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 5, fontFamily: 'var(--font-d)' }}>
              Support with Any Amount
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
              Any member or well-wisher can contribute to the group wallet monthly. Your name and amount will appear publicly.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/contributions?view=contribute')}>
            Make a Contribution
          </button>
        </div>

        {/* Search */}
        <div className="filter-row" style={{ marginBottom: 24 }}>
          <div className="search-box" style={{ maxWidth: 360 }}>
            <svg className="search-box-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round"/>
            </svg>
            <input placeholder="Search by name, nickname, location…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginLeft: 'auto' }}>
            {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>
            {memberList.length === 0
              ? 'No members added yet. The Secretary will add members via the admin portal.'
              : 'No members match your search.'}
          </div>
        ) : (
          <div className="members-grid">
            {filtered.map((m: any, i: number) => {
              const [bg, fg] = avatarColors[i % avatarColors.length];
              const contrib = contribByName[m.name] || { total: 0, count: 0, last: '' };
              return (
                <div key={m._id || m.name} className="anim-fade-up" style={{
                  background: 'var(--grad-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden',
                  transition: 'all 0.25s var(--ease)',
                  animationDelay: `${i * 0.04}s`,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* Card top */}
                  <div style={{ padding: '20px 20px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                      background: bg, color: fg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em',
                      overflow: 'hidden', border: m.photo ? '2px solid rgba(34,197,94,0.3)' : 'none',
                    }}>
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : getInitials(m.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.97rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </div>
                      {m.nickname && (
                        <div style={{ fontSize: '0.78rem', color: fg, fontWeight: 600, marginBottom: 5 }}>
                          "{m.nickname}"
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {m.position && <span className="badge badge-green" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>{m.position}</span>}
                        {m.gender && <span className="badge badge-blue" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>{m.gender}</span>}
                        {contrib.count > 0 && (
                          <span className="badge" style={{ fontSize: '0.66rem', padding: '2px 7px', background: 'rgba(34,197,94,0.1)', color: 'var(--green-400)', borderColor: 'rgba(34,197,94,0.25)' }}>
                            {contrib.count} payment{contrib.count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {m.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-3)' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round"/></svg>
                        {m.location}
                      </div>
                    )}
                    {m.occupation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-3)' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round"/></svg>
                        {m.occupation}
                      </div>
                    )}
                    {m.birthday && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-3)' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 01-1.5.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" strokeLinecap="round"/></svg>
                        {formatBirthday(m.birthday)}
                      </div>
                    )}
                  </div>

                  {/* Contribution footer */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6,13,8,0.5)' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Total Contributed</div>
                      <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.1rem', fontWeight: 800, color: contrib.total > 0 ? 'var(--green-400)' : 'var(--text-3)', letterSpacing: '-0.02em' }}>
                        {contrib.total > 0 ? formatNaira(contrib.total) : '—'}
                      </div>
                    </div>
                    {contrib.last && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Last Payment</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{formatDate(contrib.last)}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 28, padding: '14px 18px', background: 'rgba(34,197,94,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-3)', textAlign: 'center' }}>
          Member information is publicly visible for group transparency. Contact the Secretary to register or update your details.
        </div>
      </div>
      <style>{`
        .members-cta-bar {
          margin-bottom: 36px; padding: 20px 22px;
          background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03));
          border: 1px solid rgba(34,197,94,0.22); border-radius: var(--radius);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          animation: fadeUp 0.6s var(--ease) 0.3s both;
        }
        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 14px;
        }
        @media (max-width: 600px) {
          .members-cta-bar { padding: 16px 14px; }
          .members-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}
