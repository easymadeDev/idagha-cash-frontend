import { useState } from 'react';
import Layout from '../components/Layout';
import useSWR from 'swr';
import { formatNaira, formatDate } from '../lib/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const avatarColors = [
  'rgba(34,197,94,0.15)', 'rgba(96,165,250,0.15)',
  'rgba(251,191,36,0.15)', 'rgba(248,113,113,0.15)',
  'rgba(167,139,250,0.15)', 'rgba(251,146,60,0.15)',
];
const avatarText = [
  'var(--green-400)', 'var(--blue)', 'var(--yellow)',
  'var(--red)', '#c4b5fd', '#fb923c',
];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ContributionsPage() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const { data: contributions, isLoading } = useSWR(`/api/contributions?${params}`, fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);

  const list = Array.isArray(contributions) ? contributions : [];
  const total = list.reduce((s: number, c: any) => s + c.amount, 0);

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="badge badge-green"><span className="badge-dot" />Public Record</span>
          </div>
          <h1>Contributions</h1>
          <p>Complete, publicly verifiable record of every payment made to the group.</p>
        </div>

        {/* Stats row */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-card-label">All-Time Total</div>
            <div className="stat-card-value green">{stats ? formatNaira(stats.totalContributions) : '—'}</div>
            <div className="stat-card-sub">Total contributions ever</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Records Shown</div>
            <div className="stat-card-value">{list.length}</div>
            <div className="stat-card-sub">{search || startDate || endDate ? 'Filtered' : 'All records'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Filtered Sum</div>
            <div className="stat-card-value green">{formatNaira(total)}</div>
            <div className="stat-card-sub">Sum of shown records</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Wallet Balance</div>
            <div className="stat-card-value green">{stats ? formatNaira(stats.walletBalance) : '—'}</div>
            <div className="stat-card-sub">After expenses</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-row">
          <div className="search-box">
            <svg className="search-box-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round"/>
            </svg>
            <input placeholder="Search by contributor name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input type="date" className="form-input" style={{ width: 'min(160px, 100%)' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="form-input" style={{ width: 'min(160px, 100%)' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          {(search || startDate || endDate) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}>Clear filters</button>
          )}
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: 3 }}>
            {(['cards', 'table'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: view === v ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: view === v ? 'var(--green-400)' : 'var(--text-3)',
                fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font)',
                transition: 'all 0.2s',
              }}>
                {v === 'cards' ? 'Cards' : 'Table'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="contrib-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 84, borderRadius: 'var(--radius)' }} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>
            <svg width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 14px', opacity: 0.3 }}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round"/>
            </svg>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No results found</p>
            <p style={{ fontSize: '0.85rem' }}>Try adjusting your search or filters.</p>
          </div>
        ) : view === 'cards' ? (
          <div className="contrib-grid">
            {list.map((c: any, i: number) => (
              <div key={c._id} className="contrib-card">
                <div className="contrib-avatar" style={{ background: avatarColors[i % avatarColors.length], color: avatarText[i % avatarText.length] }}>
                  {getInitials(c.contributorName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="contrib-name">{c.contributorName}</div>
                  <div className="contrib-date">{formatDate(c.date)}</div>
                  {c.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.note}</div>}
                </div>
                <div>
                  <div className="contrib-amount">{formatNaira(c.amount)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textAlign: 'right', marginTop: 3 }}>{c.category}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Contributor</th><th>Amount</th><th>Date</th><th>Category</th><th>Note</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c: any, i: number) => (
                  <tr key={c._id}>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: avatarColors[i % avatarColors.length], color: avatarText[i % avatarText.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
                          {getInitials(c.contributorName)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.contributorName}</span>
                      </div>
                    </td>
                    <td><span style={{ color: 'var(--green-400)', fontWeight: 800, fontFamily: 'var(--font-d)' }}>{formatNaira(c.amount)}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{formatDate(c.date)}</td>
                    <td><span className="badge badge-green">{c.category || 'general'}</span></td>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{c.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(34,197,94,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-3)', textAlign: 'center' }}>
          All contribution records are publicly visible. Contact the Secretary to make a contribution or report a discrepancy.
        </div>
      </div>
    </Layout>
  );
}
