import Layout from '../components/Layout';
import useSWR from 'swr';
import { formatNaira, formatDate } from '../lib/api';
import { useRouter } from 'next/router';
import { useState } from 'react';
import PersonAvatar from '../components/PersonAvatar';
import MemberFigure from '../components/MemberFigure';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const avatarColors = [
  ['rgba(22,101,52,0.18)', 'var(--green-400)'],
  ['rgba(96,165,250,0.18)', 'var(--blue)'],
  ['rgba(251,191,36,0.18)', 'var(--yellow)'],
  ['rgba(248,113,113,0.18)', 'var(--red)'],
  ['rgba(167,139,250,0.18)', '#c4b5fd'],
  ['rgba(251,146,60,0.18)', '#fb923c'],
  ['rgba(34,211,238,0.18)', '#22d3ee'],
  ['rgba(244,114,182,0.18)', '#f472b6'],
];

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
              ? 'No members added yet. The General Secretary will add members via the admin portal.'
              : 'No members match your search.'}
          </div>
        ) : (
          <div className="members-grid">
            {filtered.map((m: any, i: number) => {
              const [bg] = avatarColors[i % avatarColors.length];
              const contrib = contribByName[m.name] || { total: 0, count: 0, last: '' };
              const g = (m.gender || '').toLowerCase().startsWith('f') ? 'f' : (m.gender || '').toLowerCase().startsWith('m') ? 'm' : 'n';
              return (
                <div key={m._id || m.name} className={`mf-card g-${g} anim-fade-up`} style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}>
                  {/* phones: the member drawn as a person, name badge on the lanyard */}
                  <div className="mf-figure">
                    <MemberFigure id={String(m._id || i)} photo={m.photo} gender={m.gender} />
                    <div className="mf-badge">
                      <i className="mf-badge-head">IDAGHA ’18</i>
                      <b>{m.name}</b>
                      {m.position && m.position !== 'Member' && <em>{m.position}</em>}
                      <span style={{ color: contrib.total > 0 ? 'var(--green-500, #12854a)' : '#8a958f' }}>
                        {contrib.total > 0 ? `${formatNaira(contrib.total)} contributed` : 'No payments yet'}
                      </span>
                    </div>
                  </div>
                  {/* The face: photo fills the card's top, name written across it (on phones: the icon's head) */}
                  <div className={`mf-face${m.photo ? '' : ' no-photo'} g-${g}`}
                    style={m.photo ? undefined : { ['--mf-tint' as any]: bg }}>
                    {/* on phones this is the head: a round photo above the body */}
                    <div className="mf-shape-wrap">
                      <div className="mf-shape">
                        {m.photo
                          ? <img src={m.photo} alt={m.name} loading="lazy" decoding="async" />
                          : <PersonAvatar gender={m.gender} className="mf-drawn" />}
                      </div>
                    </div>
                    {m.position && m.position !== 'Member' && <span className="mf-role">{m.position}</span>}
                    <div className="mf-name">
                      <b>{m.name}</b>
                      {m.nickname && <span>“{m.nickname}”</span>}
                    </div>
                  </div>

                  {/* the body (shoulders on phones): name, role and details */}
                  <div className="mf-body">
                  <div className="mf-body-name">
                    <b>{m.name}</b>
                    {m.nickname && <span>“{m.nickname}”</span>}
                    {m.position && m.position !== 'Member' && <em>{m.position}</em>}
                  </div>
                  <div className="member-card-details mf-details">
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
                  <div className="mf-footer">
                    <span>Contributed</span>
                    <b style={{ color: contrib.total > 0 ? 'var(--green-400)' : 'var(--text-3)' }}>{contrib.total > 0 ? formatNaira(contrib.total) : '—'}</b>
                    {contrib.last && <small>Last {formatDate(contrib.last)}</small>}
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 28, padding: '14px 18px', background: 'rgba(22,101,52,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-3)', textAlign: 'center' }}>
          Member information is publicly visible for group transparency. Contact the General Secretary to register or update your details.
        </div>
      </div>
      <style>{`
        .members-cta-bar {
          margin-bottom: 28px; padding: 18px 20px;
          background: linear-gradient(135deg, rgba(22,101,52,0.1), rgba(22,101,52,0.03));
          border: 1px solid rgba(22,101,52,0.22); border-radius: var(--radius);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 14px;
          animation: fadeUp 0.6s var(--ease) 0.3s both;
        }
        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }
        .member-card-top {
          padding: 14px 14px 10px;
          display: flex; gap: 11px; align-items: flex-start;
        }
        .member-card-avatar {
          width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.88rem; font-weight: 800; letter-spacing: -0.02em;
          overflow: hidden;
        }
        .member-card-name {
          font-weight: 800; font-size: 0.88rem; margin-bottom: 2px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .member-card-details {
          padding: 0 14px 10px;
          display: flex; flex-direction: column; gap: 4px;
          font-size: 0.78rem;
        }
        .member-card-footer {
          border-top: 1px solid var(--border);
          padding: 10px 14px;
          display: flex; justify-content: space-between; align-items: center;
          background: var(--bg-card);
        }
        .member-card-contrib-value {
          font-family: var(--font-d); font-size: clamp(0.85rem, 3vw, 1rem);
          font-weight: 800; letter-spacing: -0.02em;
        }
        @media (max-width: 900px) {
          .members-grid { grid-template-columns: repeat(2,1fr); gap: 10px; }
        }
        @media (max-width: 600px) {
          .members-cta-bar { padding: 12px 13px; gap: 10px; }
          .members-grid { grid-template-columns: repeat(2,1fr); gap: 8px; }
          .member-card-top { padding: 11px 11px 8px; gap: 9px; }
          .member-card-avatar { width: 36px; height: 36px; border-radius: 9px; font-size: 0.75rem; }
          .member-card-name { font-size: 0.78rem; white-space: normal; overflow: visible; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
          .member-card-details { padding: 0 11px 8px; font-size: 0.68rem; gap: 3px; }
          .member-card-footer { padding: 8px 11px; }
          .member-card-contrib-value { font-size: 0.76rem; }
          /* hide long email addresses on 2-col mobile */
          .member-card-details .member-detail-email { display: none; }
        }
        @media (max-width: 400px) {
          .members-grid { gap: 6px; }
          .member-card-top { padding: 9px 9px 7px; gap: 8px; }
          .member-card-avatar { width: 32px; height: 32px; border-radius: 8px; font-size: 0.68rem; }
          .member-card-name { font-size: 0.74rem; }
          .member-card-details { padding: 0 9px 7px; font-size: 0.65rem; }
          .member-card-footer { padding: 7px 9px; }
          .member-card-contrib-value { font-size: 0.72rem; }
        }
      `}</style>
    </Layout>
  );
}
