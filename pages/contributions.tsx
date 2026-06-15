import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import api, { formatNaira, formatDate } from '../lib/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORIES = [
  { label: 'Monthly Dues', value: 'dues', desc: 'Regular monthly contribution', color: 'var(--green-400)' },
  { label: 'Reunion Fund', value: 'reunion-fund', desc: '2026 Reunion event fund', color: 'var(--yellow)' },
  { label: 'General', value: 'general', desc: 'General group wallet', color: 'var(--blue)' },
];

const STEPS = [
  { n: '01', title: 'Choose a Category', desc: 'Pick what your contribution is for (dues, reunion fund, etc.)' },
  { n: '02', title: 'Transfer the Amount', desc: 'Send any amount to one of the bank accounts below via mobile banking or USSD' },
  { n: '03', title: 'Fill This Form', desc: 'Enter your name, amount, and upload your receipt/screenshot as proof' },
  { n: '04', title: 'Admin Confirms', desc: 'The Secretary verifies and records it. It appears publicly on the contributions page' },
];

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
  const [view, setView] = useState<'cards' | 'table' | 'contribute'>('cards');
  const router = useRouter();

  // Set initial view from URL
  useEffect(() => {
    if (router.query.view === 'contribute') setView('contribute');
  }, [router.query.view]);

  // Contribution Form State
  const [copied, setCopied] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('dues');
  const [form, setForm] = useState({ name: '', amount: '', note: '', email: '', phone: '' });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { data: accountsData } = useSWR('/api/settings/bank-accounts', (url) => api.get(url).then(r => r.data));
  const bankAccounts = Array.isArray(accountsData) ? accountsData : [];

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const { data: contributions, isLoading } = useSWR(`/api/contributions?${params}`, fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);

  const list = Array.isArray(contributions) ? contributions : [];
  const total = list.reduce((s: number, c: any) => s + c.amount, 0);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('contributorName', form.name.trim());
      fd.append('amount', form.amount);
      fd.append('category', selectedCategory);
      fd.append('note', form.note);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('status', 'pending');
      if (receipt) fd.append('receipt', receipt);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/contributions/pending`,
        { method: 'POST', body: fd }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to submit contribution. Please try again.');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container" style={{ paddingBottom: view === 'contribute' ? 80 : undefined }}>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className={`badge ${view === 'contribute' ? 'badge-blue' : 'badge-green'}`}>
              <span className="badge-dot" />{view === 'contribute' ? 'Submit Contribution' : 'Public Record'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1>{view === 'contribute' ? 'Make a Contribution' : 'Contributions'}</h1>
              <p>
                {view === 'contribute'
                  ? 'Transfer directly to the group account and fill the form below. No app, no card needed — just a bank transfer.'
                  : 'Complete, publicly verifiable record of every payment made to the group.'}
              </p>
            </div>
            {view !== 'contribute' ? (
              <button className="btn btn-primary" onClick={() => setView('contribute')}>
                Make a Contribution
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={() => setView('cards')}>
                &larr; Back to Records
              </button>
            )}
          </div>
        </div>

        {view === 'contribute' ? (
          submitted ? (
            <div className="card" style={{ textAlign: 'center', padding: '56px 32px', maxWidth: 560, margin: '0 auto' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="32" height="32" fill="none" stroke="var(--green-400)" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>
                Submission Received!
              </h2>
              <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 28 }}>
                Thank you, <strong style={{ color: 'var(--text-2)' }}>{form.name}</strong>! Your contribution notice has been sent to the Secretary for verification.
                Once confirmed, your name and amount will appear publicly on the contributions page. 🎉
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => { setSubmitted(false); setView('cards'); }}>View Contributions</button>
                <button className="btn btn-ghost" onClick={() => { setSubmitted(false); setForm({ name: '', amount: '', note: '', email: '', phone: '' }); setReceipt(null); setReceiptPreview(''); }}>
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <div className="contribute-layout">
              {/* LEFT: Steps + Bank accounts */}
              <div className="contribute-left">
                {/* How it works */}
                <div className="card" style={{ marginBottom: 24, padding: '24px 22px' }}>
                  <div className="section-title" style={{ marginBottom: 18 }}>How It Works</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {STEPS.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '0.72rem', color: 'var(--green-400)',
                        }}>{s.n}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88', marginBottom: 2 }}>{s.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank accounts */}
                <div className="section-title" style={{ marginBottom: 14 }}>Group Bank Accounts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {bankAccounts.length === 0 ? (
                    <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                      Loading bank details…
                    </div>
                  ) : (
                    bankAccounts.map((acc: any, i: number) => (
                      <div key={i} className="card" style={{ padding: '20px 22px', border: `1px solid ${acc.border}`, background: acc.color }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          <span style={{ fontSize: '1.4rem' }}>{acc.icon}</span>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{acc.bank}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Account Number</div>
                              <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-1)' }}>
                                {acc.accountNumber}
                              </div>
                            </div>
                            <button onClick={() => copy(acc.accountNumber, `num-${i}`)} className="btn btn-ghost btn-sm" style={{ gap: 6, flexShrink: 0 }}>
                              {copied === `num-${i}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Account Name</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-2)' }}>{acc.accountName}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* USSD tip */}
                <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--yellow)' }}>💡 USSD Tip:</strong> No internet? Dial your bank's USSD code to transfer directly from any phone.
                </div>
              </div>

              {/* RIGHT: Submission form */}
              <div className="contribute-right">
                <div className="card" style={{ padding: '28px 24px', position: 'sticky', top: 130 }}>
                  <div className="section-title" style={{ marginBottom: 6 }}>Notify the Secretary</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 22, lineHeight: 1.6 }}>
                    After transferring, fill this form so your payment can be confirmed and recorded publicly.
                  </p>
                  {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">Contribution Category *</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value} type="button" onClick={() => setSelectedCategory(cat.value)}
                            style={{
                              padding: '8px 14px', borderRadius: 99, border: `1px solid`,
                              borderColor: selectedCategory === cat.value ? cat.color : 'var(--border)',
                              background: selectedCategory === cat.value ? `${cat.color}22` : 'transparent',
                              color: selectedCategory === cat.value ? cat.color : 'var(--text-3)',
                              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'var(--font)', transition: 'all 0.2s',
                            }}
                          >{cat.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your Full Name *</label>
                      <input className="form-input" placeholder="e.g. Chukwuemeka Obi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount Transferred (₦) *</label>
                      <input className="form-input" type="number" placeholder="e.g. 5000" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-input" placeholder="e.g. 08012345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message / Note (optional)</label>
                      <input className="form-input" placeholder="e.g. January dues, or a greeting message" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Upload Receipt / Screenshot (optional)</label>
                      <label style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        border: `2px dashed ${receiptPreview ? 'rgba(34,197,94,0.5)' : 'var(--border)'}`,
                        background: receiptPreview ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                        fontSize: '0.82rem', color: 'var(--text-3)', flexDirection: receiptPreview ? 'column' : 'row',
                      }}>
                        {receiptPreview ? (
                          <><img src={receiptPreview} alt="receipt" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'contain' }} /><span style={{ color: 'var(--green-400)', fontSize: '0.75rem' }}>Click to change</span></>
                        ) : (
                          <>Click to upload receipt or proof of payment</>
                        )}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReceipt} />
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting || !form.name.trim() || !form.amount} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                      {submitting ? 'Sending…' : 'Submit Contribution Notice'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        ) : (
          <>
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

            {isLoading ? (
              <div className="contrib-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 84, borderRadius: 'var(--radius)' }} />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>
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
                    <tr><th>#</th><th>Contributor</th><th>Amount</th><th>Date</th><th>Category</th><th>Note</th></tr>
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
          </>
        )}
      </div>

      <style>{`
        .contribute-layout {
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 28px;
          align-items: flex-start;
        }
        .contribute-left { min-width: 0; }
        .contribute-right { min-width: 0; }

        @media (max-width: 900px) {
          .contribute-layout {
            grid-template-columns: 1fr;
          }
          .contribute-right .card { position: static !important; }
        }
        @media (max-width: 480px) {
          .contribute-layout { gap: 18px; }
        }
      `}</style>
    </Layout>
  );
}
