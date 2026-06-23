import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api, { formatNaira } from '../../lib/api';
import { useToast } from '../../components/Toast';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const authFetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` } }).then((r) => r.json());

const EMPTY = { name: '', description: '', color: '#22c55e', type: 'general' };
const TYPES = ['general', 'reunion', 'pledge', 'custom'];

export default function AdminWallets() {
  const { toast } = useToast();
  const { data: wallets, isLoading } = useSWR('/api/wallets', fetcher);
  const { data: walletStats } = useSWR('/api/stats/wallets', fetcher);
  const { data: pledgeStats } = useSWR('/api/pledges/stats', authFetcher);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = Array.isArray(wallets) ? wallets : [];
  const stats = Array.isArray(walletStats) ? walletStats : [];

  const getStats = (walletId: string) =>
    stats.find((s: any) => s.wallet?._id === walletId) || { income: 0, spent: 0, balance: 0 };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (w: any) => {
    setEditing(w);
    setForm({ name: w.name, description: w.description ?? '', color: w.color ?? '#22c55e', type: w.type ?? 'general' });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/wallets/${editing._id}`, form);
      else await api.post('/wallets', form);
      mutate('/api/wallets');
      mutate('/api/stats/wallets');
      setModal(false);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/wallets/${id}`);
      mutate('/api/wallets');
      mutate('/api/stats/wallets');
    } catch { /* silent */ }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Wallets</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: 4 }}>Manage named wallets and track individual balances.</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ New Wallet</button>
        </div>

        {/* Wallet cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
          {isLoading ? (
            <div style={{ color: 'var(--text-3)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>Loading…</div>
          ) : list.length === 0 ? (
            <div style={{ color: 'var(--text-3)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No wallets yet.</div>
          ) : list.map((w: any) => {
            const s = getStats(w._id);
            return (
              <div key={w._id} className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                {/* Color accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: w.color || '#22c55e', borderRadius: '12px 12px 0 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${w.color || '#22c55e'}22`,
                    border: `2px solid ${w.color || '#22c55e'}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="18" height="18" fill="none" stroke={w.color || '#22c55e'} strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{w.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'capitalize' }}>
                      {w.type} wallet
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {w.type === 'pledge' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = '/admin/pledges'} style={{ color: '#a855f7', borderColor: '#a855f7' }}>View</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(w)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(w._id)}>Del</button>
                  </div>
                </div>

                {w.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>{w.description}</p>
                )}

                {w.type === 'pledge' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Total Pledged', value: formatNaira(pledgeStats?.totalPledged ?? 0), color: '#a855f7' },
                      { label: 'Fulfilled', value: formatNaira(pledgeStats?.totalFulfilled ?? 0), color: 'var(--green-400)' },
                      { label: 'Pending', value: formatNaira(pledgeStats?.totalPending ?? 0), color: 'var(--yellow)' },
                    ].map((stat) => (
                      <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '0.82rem', color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Income', value: formatNaira(s.income), color: 'var(--green-400)' },
                      { label: 'Spent', value: formatNaira(s.spent), color: 'var(--red)' },
                      { label: 'Balance', value: formatNaira(s.balance), color: s.balance >= 0 ? 'var(--green-400)' : 'var(--red)' },
                    ].map((stat) => (
                      <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '0.82rem', color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Wallet list table */}
        <div className="table-wrap table-single-col">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Color</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Loading…</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No wallets found.</td></tr>
              ) : list.map((w: any, i: number) => {
                const s = getStats(w._id);
                return (
                  <tr key={w._id}>
                    <td className="hide-mobile" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td data-label="Name" style={{ fontWeight: 600 }}>{w.name}</td>
                    <td data-label="Type">
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                        {w.type}
                      </span>
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{w.description || '—'}</td>
                    <td data-label="Color">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, background: w.color || '#22c55e', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>{w.color}</span>
                      </div>
                    </td>
                    <td data-label="Balance" style={{ color: s.balance >= 0 ? 'var(--green-400)' : 'var(--red)', fontWeight: 700 }}>{formatNaira(s.balance)}</td>
                    <td className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(w)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(w._id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{editing ? 'Edit Wallet' : 'New Wallet'}</p>
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Wallet Name *</label>
                <input className="form-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="e.g. Group Wallet" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of this wallet's purpose" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      style={{
                        width: 44, height: 36, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'transparent', cursor: 'pointer', padding: 2,
                      }}
                    />
                    <input className="form-input" value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="#22c55e"
                      style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: `${form.color}11`,
                border: `1px solid ${form.color}33`,
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: form.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: form.color }}>{form.name || 'Wallet name preview'}</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Wallet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete Wallet?</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: 20 }}>
              This will permanently delete the wallet. Existing contributions and expenses linked to this wallet will retain their walletId reference.
            </p>
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
