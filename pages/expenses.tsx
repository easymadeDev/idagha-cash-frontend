import { useState } from 'react';
import Layout from '../components/Layout';
import useSWR from 'swr';
import { formatNaira, formatDate } from '../lib/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const CATEGORIES = ['general', 'food', 'transport', 'venue', 'printing', 'communication', 'welfare', 'other'];

export default function ExpensesPage() {
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const { data: expenses, isLoading } = useSWR(`/api/expenses?${params}`, fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);

  const list = Array.isArray(expenses) ? expenses : [];
  const total = list.reduce((s: number, e: any) => s + e.amount, 0);

  const categoryIcons: Record<string, string> = {
    food: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    transport: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    venue: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    printing: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
    communication: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    welfare: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    general: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    other: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
  };

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-red"><span className="badge-dot" />Full Transparency</span>
          </div>
          <h1>Expenses</h1>
          <p>Every group expenditure is documented publicly. Nothing is hidden.</p>
        </div>

        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-card-label">Total Expenses</div>
            <div className="stat-card-value red">{stats ? formatNaira(stats.totalExpenses) : '—'}</div>
            <div className="stat-card-sub">All time spent</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Records Shown</div>
            <div className="stat-card-value">{list.length}</div>
            <div className="stat-card-sub">{category || startDate || endDate ? 'Filtered' : 'All records'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Filtered Total</div>
            <div className="stat-card-value red">{formatNaira(total)}</div>
            <div className="stat-card-sub">Sum of shown records</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Wallet Balance</div>
            <div className="stat-card-value green">{stats ? formatNaira(stats.walletBalance) : '—'}</div>
            <div className="stat-card-sub">After all expenses</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-row">
          <select className="form-select" style={{ width: 'min(190px,100%)' }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <input type="date" className="form-input" style={{ width: 'min(160px,100%)' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="form-input" style={{ width: 'min(160px,100%)' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          {(category || startDate || endDate) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setCategory(''); setStartDate(''); setEndDate(''); }}>Clear</button>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>
            No expense records found.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Description</th><th>Amount</th><th>Date</th><th>Category</th><th>Approved By</th></tr>
              </thead>
              <tbody>
                {list.map((e: any, i: number) => (
                  <tr key={e._id}>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--red-bg)', border: '1px solid var(--red-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="15" height="15" fill="none" stroke="var(--red)" strokeWidth="2" viewBox="0 0 24 24">
                            <path d={categoryIcons[e.category] || categoryIcons.general} strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.title}</div>
                          {e.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{e.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span style={{ color: 'var(--red)', fontWeight: 800, fontFamily: 'var(--font-d)' }}>{formatNaira(e.amount)}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{formatDate(e.date)}</td>
                    <td><span className="badge badge-red">{e.category || 'general'}</span></td>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{e.approvedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
