import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api, { formatNaira, formatDate } from '../../lib/api';

const authFetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` } }).then((r) => r.json());

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const REUNION_TARGET = 10000;

const EMPTY = {
  contributorName: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  category: 'monthly-dues',
  walletId: '',
};

const CATS = ['general', 'monthly-dues', 'reunion-fund', 'welfare', 'special'];

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  'general':      { label: 'General',       color: 'var(--text-3)',   bg: 'rgba(107,114,128,0.1)' },
  'monthly-dues': { label: 'Monthly Dues',  color: 'var(--blue)',     bg: 'rgba(96,165,250,0.1)' },
  'reunion-fund': { label: 'Reunion Fund',  color: 'var(--yellow)',   bg: 'rgba(251,191,36,0.1)' },
  'welfare':      { label: 'Welfare',       color: 'var(--green-400)',bg: 'rgba(34,197,94,0.1)' },
  'special':      { label: 'Special',       color: '#c4b5fd',         bg: 'rgba(196,181,253,0.1)' },
};

export default function AdminContributions() {
  const { data: contributions, isLoading } = useSWR('/api/contributions/admin/all', authFetcher);
  const { data: members } = useSWR('/api/members/admin/all', authFetcher);
  const { data: wallets } = useSWR('/api/wallets', fetcher);
  const { data: walletStats } = useSWR('/api/stats/wallets', fetcher);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('all');
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [receiptViewer, setReceiptViewer] = useState<string | null>(null);

  // Approval modal state
  const [approveModal, setApproveModal] = useState<any>(null); // holds the pending contribution
  const [approveWalletId, setApproveWalletId] = useState('');
  const [approveMemberId, setApproveMemberId] = useState('');
  const [approveCategory, setApproveCategory] = useState('general');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  const list = Array.isArray(contributions) ? contributions : [];
  const memberList = Array.isArray(members)
    ? members.filter((m: any) => m.status === 'active').sort((a: any, b: any) => a.name.localeCompare(b.name))
    : [];
  const walletList = Array.isArray(wallets) ? wallets : [];
  const statsList = Array.isArray(walletStats) ? walletStats : [];

  const getBalance = (walletId: string): number => {
    const s = statsList.find((s: any) => s.wallet?._id === walletId);
    return s ? s.balance : 0;
  };

  const approvedList = list.filter((c: any) => c.status !== 'pending');
  const pendingList = list.filter((c: any) => c.status === 'pending');

  const filtered = filterCat === 'all' ? approvedList : approvedList.filter((c: any) => c.category === filterCat);

  const getWalletName = (walletId: string) => walletList.find((w: any) => w._id === walletId)?.name ?? null;
  const getWalletColor = (walletId: string) => walletList.find((w: any) => w._id === walletId)?.color ?? '#22c55e';

  // How much has a member already paid toward reunion fund (from existing records)
  const reunionPaidByMember = useMemo(() => {
    const map: Record<string, number> = {};
    approvedList.filter((c: any) => c.category === 'reunion-fund').forEach((c: any) => {
      map[c.contributorName] = (map[c.contributorName] || 0) + c.amount;
    });
    return map;
  }, [approvedList]);

  const isReunion = form.category === 'reunion-fund';
  const isMonthlyDues = form.category === 'monthly-dues';

  // For reunion: how much has the selected member already paid
  const reunionAlreadyPaid = isReunion && form.contributorName
    ? (reunionPaidByMember[form.contributorName] || 0) - (editing?.amount || 0)
    : 0;
  const reunionRemaining = Math.max(0, REUNION_TARGET - reunionAlreadyPaid);

  // Auto-select wallet based on category
  const handleCategoryChange = (cat: string) => {
    let walletId = form.walletId;
    if (cat === 'reunion-fund') {
      const reunionWallet = walletList.find((w: any) => w.type === 'reunion');
      if (reunionWallet) walletId = reunionWallet._id;
    } else if (cat === 'monthly-dues' || cat === 'general' || cat === 'welfare' || cat === 'special') {
      const groupWallet = walletList.find((w: any) => w.type === 'general');
      if (groupWallet) walletId = groupWallet._id;
    }
    setForm({ ...form, category: cat, contributorName: '', walletId });
  };

  const openAdd = () => {
    const groupWallet = walletList.find((w: any) => w.type === 'general');
    setEditing(null);
    setForm({ ...EMPTY, walletId: groupWallet?._id || '', category: 'monthly-dues' });
    setError('');
    setModal(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      contributorName: c.contributorName,
      amount: String(c.amount),
      date: c.date?.slice(0, 10) ?? '',
      note: c.note ?? '',
      category: c.category ?? 'general',
      walletId: c.walletId ?? '',
    });
    setError('');
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/contributions/${editing._id}`, payload);
      else await api.post('/contributions', payload);
      mutate('/api/contributions');
      mutate('/api/stats/summary');
      mutate('/api/activity?limit=25');
      mutate('/api/stats/wallets');
      setModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/contributions/${id}`);
      mutate('/api/contributions/admin/all');
      mutate('/api/stats/summary');
      mutate('/api/stats/wallets');
    } catch { /* silent */ }
    setDeleteId(null);
  };


  const openApproveModal = (c: any) => {
    // Pre-select wallet based on category
    const cat = c.category || 'general';
    let defaultWallet = walletList.find((w: any) => w.type === 'general')?._id || '';
    if (cat === 'reunion-fund') defaultWallet = walletList.find((w: any) => w.type === 'reunion')?._id || defaultWallet;
    // Pre-select member if contributorName matches
    const matched = memberList.find((m: any) => m.name.toLowerCase() === c.contributorName?.toLowerCase());
    setApproveModal(c);
    setApproveWalletId(defaultWallet);
    setApproveCategory(cat);
    setApproveMemberId(matched?._id || '');
    setApproveError('');
  };

  const confirmApprove = async () => {
    if (!approveWalletId) { setApproveError('Please select a wallet to credit.'); return; }
    setApproving(true);
    setApproveError('');
    try {
      await api.put(`/contributions/${approveModal._id}/approve`, {
        walletId: approveWalletId,
        category: approveCategory,
        memberId: approveMemberId || undefined,
      });
      mutate('/api/contributions/admin/all');
      mutate('/api/stats/summary');
      mutate('/api/stats/wallets');
      mutate('/api/activity?limit=25');
      setApproveModal(null);
    } catch (err: any) {
      setApproveError(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Contributions</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: 4 }}>All member payments across all categories.</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Contribution</button>
        </div>

        {/* Wallet balance strip */}
        {walletList.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {walletList.map((w: any) => {
              const bal = getBalance(w._id);
              return (
                <div key={w._id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  background: 'var(--card)', border: `1px solid ${w.color}33`, borderRadius: 10,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 1 }}>{w.name}</div>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '0.9rem', color: bal >= 0 ? w.color : 'var(--red)' }}>
                      {formatNaira(bal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {(['approved', 'pending'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', padding: '0 0 12px', cursor: 'pointer',
                fontWeight: activeTab === tab ? 800 : 600,
                color: activeTab === tab ? 'var(--green-400)' : 'var(--text-3)',
                borderBottom: `3px solid ${activeTab === tab ? 'var(--green-400)' : 'transparent'}`,
                fontSize: '0.9rem', position: 'relative'
              }}
            >
              {tab === 'approved' ? 'Approved Records' : 'Pending Approvals'}
              {tab === 'pending' && pendingList.length > 0 && (
                <span style={{
                  background: 'var(--red)', color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                  padding: '1px 6px', borderRadius: 99, marginLeft: 8
                }}>{pendingList.length}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'approved' ? (
          <>
            {/* Category filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {['all', ...CATS].map((cat) => {
                const count = cat === 'all' ? approvedList.length : approvedList.filter((c: any) => c.category === cat).length;
                const total = (cat === 'all' ? approvedList : approvedList.filter((c: any) => c.category === cat)).reduce((s: number, c: any) => s + c.amount, 0);
                const active = filterCat === cat;
            const meta = CAT_META[cat];
            return (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: active ? `1px solid ${meta?.color || 'rgba(34,197,94,0.5)'}` : '1px solid var(--border)',
                background: active ? (meta?.bg || 'rgba(34,197,94,0.1)') : 'rgba(255,255,255,0.02)',
                color: active ? (meta?.color || 'var(--green-400)') : 'var(--text-3)',
                transition: 'all 0.15s',
              }}>
                {cat === 'all' ? 'All' : meta?.label || cat} <span style={{ opacity: 0.6 }}>({count})</span>
                {count > 0 && <span style={{ marginLeft: 6, opacity: 0.8 }}>{formatNaira(total)}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-3)', background: 'var(--bg-base)', borderRadius: 'var(--radius)' }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-3)', background: 'var(--bg-base)', borderRadius: 'var(--radius)' }}>
              No contributions found.
            </div>
          ) : filtered.map((c: any) => {
            const meta = CAT_META[c.category] || CAT_META.general;
            return (
              <div key={c._id} style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)' }}>{c.contributorName}</div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33`, textTransform: 'capitalize' }}>
                    {meta.label}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '10px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</span>
                    <span style={{ color: 'var(--green-400)', fontWeight: 800, fontSize: '1.2rem' }}>{formatNaira(c.amount)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatDate(c.date)}</span>
                  </div>
                </div>

                {c.walletId && getWalletName(c.walletId) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Wallet:</span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                      background: `${getWalletColor(c.walletId)}1a`,
                      color: getWalletColor(c.walletId),
                      border: `1px solid ${getWalletColor(c.walletId)}44`,
                    }}>
                      {getWalletName(c.walletId)}
                    </span>
                  </div>
                )}

                {c.note && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontStyle: 'italic', background: 'rgba(251,191,36,0.1)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid var(--yellow)' }}>
                    "{c.note}"
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '0 12px', height: 32 }} onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm" style={{ padding: '0 12px', height: 32 }} onClick={() => setDeleteId(c._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
        </>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {pendingList.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-3)', background: 'var(--bg-base)', borderRadius: 'var(--radius)' }}>
                No pending contributions.
              </div>
            ) : pendingList.map((c: any) => {
              const meta = CAT_META[c.category] || CAT_META.general;
              return (
                <div key={c._id} style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)' }}>{c.contributorName}</div>
                      {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{c.email}</div>}
                      {c.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{c.phone}</div>}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33`, textTransform: 'capitalize' }}>
                      {meta.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '10px 12px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</span>
                      <span style={{ color: 'var(--green-400)', fontWeight: 800, fontSize: '1.2rem' }}>{formatNaira(c.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatDate(c.date)}</span>
                    </div>
                  </div>

                  {c.note && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontStyle: 'italic', background: 'rgba(251,191,36,0.1)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid var(--yellow)' }}>
                      "{c.note}"
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div>
                      {c.receiptUrl ? (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', height: 32 }} onClick={() => setReceiptViewer(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`.replace('/api', '') + c.receiptUrl)}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 4 }}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          Receipt
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', paddingLeft: 8 }}>No receipt</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-danger btn-sm" style={{ padding: '0 12px', height: 32 }} onClick={() => setDeleteId(c._id)}>Reject</button>
                      <button className="btn btn-primary btn-sm" style={{ padding: '0 16px', height: 32 }} onClick={() => openApproveModal(c)}>Approve</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Viewer Modal */}
      {receiptViewer && (
        <div className="modal-overlay" onClick={() => setReceiptViewer(null)}>
          <div className="modal" style={{ maxWidth: 600, padding: 8, background: 'var(--bg-base)' }} onClick={(e) => e.stopPropagation()}>
            <img src={receiptViewer} alt="Receipt" style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius)' }} />
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setReceiptViewer(null)}>Close</button>
          </div>
        </div>
      )}

      {/* ── Approve Contribution Modal ── */}
      {approveModal && (
        <div className="modal-overlay" onClick={() => { if (!approving) setApproveModal(null); }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Approve Contribution</p>

            {/* Summary card */}
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>Contributor</span>
                <strong style={{ fontSize: '0.88rem' }}>{approveModal.contributorName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>Amount</span>
                <strong style={{ color: 'var(--green-400)', fontSize: '0.95rem' }}>{formatNaira(approveModal.amount)}</strong>
              </div>
              {approveModal.email && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>Email</span>
                  <span style={{ fontSize: '0.82rem' }}>{approveModal.email}</span>
                </div>
              )}
            </div>

            {approveError && <div className="alert alert-error" style={{ marginBottom: 14 }}>{approveError}</div>}

            {/* Wallet selector */}
            <div className="form-group">
              <label className="form-label">Credit to Wallet <span style={{ color: 'var(--red)' }}>*</span></label>
              <select
                className="form-input"
                value={approveWalletId}
                onChange={(e) => setApproveWalletId(e.target.value)}
                required
              >
                <option value="">— Select wallet —</option>
                {walletList.map((w: any) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Category override */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={approveCategory}
                onChange={(e) => setApproveCategory(e.target.value)}
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>{CAT_META[c]?.label || c}</option>
                ))}
              </select>
            </div>

            {/* Link to member */}
            <div className="form-group">
              <label className="form-label">Link to Verified Member <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
              <select
                className="form-input"
                value={approveMemberId}
                onChange={(e) => setApproveMemberId(e.target.value)}
              >
                <option value="">— No member link —</option>
                {memberList.map((m: any) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 5 }}>Linking ties this payment to a verified member's profile.</div>
            </div>

            {(approveModal.email || approveMemberId) && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                📧 An approval email will be sent to <strong>{approveModal.email || memberList.find((m: any) => m._id === approveMemberId)?.email || 'contributor'}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setApproveModal(null)} disabled={approving}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmApprove} disabled={approving || !approveWalletId}>
                {approving ? 'Approving…' : '✓ Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{editing ? 'Edit Contribution' : 'Record Contribution'}</p>
            <form onSubmit={save}>
              {error && <div className="alert alert-error">{error}</div>}

              {/* ── Category ── */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                  {CATS.map((cat) => {
                    const meta = CAT_META[cat];
                    const active = form.category === cat;
                    return (
                      <div key={cat} onClick={() => handleCategoryChange(cat)} style={{
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${active ? meta.color : 'var(--border)'}`,
                        background: active ? meta.bg : 'transparent',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: active ? meta.color : 'var(--text-2)', marginBottom: 2 }}>{meta.label}</div>
                        {cat === 'monthly-dues' && <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Any amount → Group Wallet</div>}
                        {cat === 'reunion-fund' && <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>₦10,000 target per member</div>}
                        {cat === 'general' && <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Miscellaneous income</div>}
                        {cat === 'welfare' && <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Welfare & support</div>}
                        {cat === 'special' && <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>One-off / events</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Member selector (all categories use member list) ── */}
              <div className="form-group">
                <label className="form-label">
                  {isReunion ? 'Member (Reunion Fund) *' : 'Member / Contributor *'}
                </label>
                {memberList.length > 0 ? (
                  <select
                    className="form-select"
                    value={form.contributorName}
                    onChange={(e) => setForm({ ...form, contributorName: e.target.value })}
                    required
                  >
                    <option value="">— Select member —</option>
                    {memberList.map((m: any) => {
                      const paid = reunionPaidByMember[m.name] || 0;
                      const remaining = Math.max(0, REUNION_TARGET - paid);
                      return (
                        <option key={m._id} value={m.name}>
                          {m.name}{m.nickname ? ` (${m.nickname})` : ''}
                          {isReunion ? ` — paid ₦${paid.toLocaleString()} / rem ₦${remaining.toLocaleString()}` : ''}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    className="form-input"
                    value={form.contributorName}
                    onChange={(e) => setForm({ ...form, contributorName: e.target.value })}
                    required
                    placeholder="Type contributor name"
                  />
                )}

                {/* Reunion fund progress for selected member */}
                {isReunion && form.contributorName && (
                  <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-3)' }}>Already paid</span>
                      <span style={{ fontWeight: 700, color: 'var(--green-400)' }}>{formatNaira(reunionAlreadyPaid)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-3)' }}>Still remaining</span>
                      <span style={{ fontWeight: 700, color: reunionRemaining > 0 ? 'var(--yellow)' : 'var(--green-400)' }}>
                        {reunionRemaining > 0 ? formatNaira(reunionRemaining) : 'Fully paid ✓'}
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: reunionAlreadyPaid >= REUNION_TARGET ? 'var(--green-400)' : 'var(--yellow)',
                        width: `${Math.min(100, (reunionAlreadyPaid / REUNION_TARGET) * 100)}%`,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                )}

                {/* Monthly dues hint */}
                {isMonthlyDues && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--blue)', marginTop: 6, display: 'block' }}>
                    Monthly dues — any amount, goes directly to the Group Wallet
                  </span>
                )}
              </div>

              {/* ── Wallet selector ── */}
              <div className="form-group">
                <label className="form-label">Wallet</label>
                <select className="form-select" value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })}>
                  <option value="">— No wallet —</option>
                  {walletList.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} — bal: {formatNaira(getBalance(w._id))}
                    </option>
                  ))}
                </select>
                {isReunion && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--yellow)', marginTop: 4, display: 'block' }}>
                    Auto-linked to Reunion Fund Wallet
                  </span>
                )}
                {isMonthlyDues && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--blue)', marginTop: 4, display: 'block' }}>
                    Auto-linked to Group Wallet
                  </span>
                )}
              </div>

              {/* ── Amount + Date ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">
                    Amount (₦) *
                    {isReunion && reunionRemaining > 0 && form.contributorName && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginLeft: 8 }}>
                        (max remaining: {formatNaira(reunionRemaining)})
                      </span>
                    )}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    max={isReunion && reunionRemaining > 0 ? reunionRemaining : undefined}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    placeholder={isReunion ? `e.g. ${reunionRemaining || 10000}` : isMonthlyDues ? 'Any amount' : 'e.g. 1000'}
                  />
                  {isReunion && form.amount && form.contributorName && (() => {
                    const thisPayment = Number(form.amount);
                    const newTotal = reunionAlreadyPaid + thisPayment;
                    const stillLeft = REUNION_TARGET - newTotal;
                    return (
                      <span style={{ fontSize: '0.72rem', marginTop: 4, display: 'block', color: stillLeft <= 0 ? 'var(--green-400)' : 'var(--text-3)' }}>
                        {stillLeft <= 0
                          ? 'This completes their reunion payment!'
                          : `After this: ₦${Math.max(0, stillLeft).toLocaleString()} still remaining`}
                      </span>
                    );
                  })()}
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input
                  className="form-input"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder={
                    isReunion ? 'e.g. First instalment'
                    : isMonthlyDues ? 'e.g. January dues'
                    : 'Additional notes'
                  }
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Confirm Delete</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: 20 }}>This will permanently remove this contribution record.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => remove(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
