import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api, { formatNaira } from '../../lib/api';
import { useToast } from '../../components/Toast';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const EMPTY = { name: '', description: '', color: '#22c55e', type: 'general' };
const TYPES = ['general', 'reunion', 'pledge', 'custom'];

export default function AdminWallets() {
  const { toast } = useToast();
  const { data: wallets, isLoading } = useSWR('/api/wallets', fetcher);
  const { data: walletStats } = useSWR('/api/stats/wallets', fetcher, { refreshInterval: 15000, revalidateOnFocus: true });

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Wallets</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 2 }}>Manage named wallets and track individual balances.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ New Wallet</button>
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 48, fontSize: '0.85rem' }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 48, fontSize: '0.85rem' }}>No wallets yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {list.map((w: any) => {
              const s = getStats(w._id);
              const color = w.color || '#22c55e';
              const isPledge = w.type === 'pledge';

              const rows = isPledge ? [
                { label: 'Pledged', value: formatNaira(s.pledgeStats?.totalPledged ?? 0), color: '#a855f7' },
                { label: 'Fulfilled', value: formatNaira(s.pledgeStats?.totalFulfilled ?? 0), color: 'var(--green-400)' },
                { label: 'Pending', value: formatNaira(s.pledgeStats?.totalPending ?? 0), color: 'var(--yellow)' },
              ] : [
                { label: 'Income', value: formatNaira(s.income), color: 'var(--green-400)' },
                { label: 'Spent', value: formatNaira(s.spent), color: 'var(--red)' },
                { label: 'Balance', value: formatNaira(s.balance), color: s.balance >= 0 ? 'var(--green-400)' : 'var(--red)' },
              ];

              return (
                <div key={w._id} className="card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                  {/* left color strip */}
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: color, borderRadius: '12px 0 0 12px' }} />

                  <div style={{ paddingLeft: 10 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</span>
                        </div>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                          background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)',
                          border: '1px solid var(--border)', textTransform: 'capitalize',
                        }}>{w.type}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {isPledge && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#a855f7' }}
                            onClick={() => window.location.href = '/admin/pledges'}>View</button>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => openEdit(w)}>Edit</button>
                        <button className="btn btn-danger btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => setDeleteId(w._id)}>Del</button>
                      </div>
                    </div>

                    {w.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.4 }}>{w.description}</p>
                    )}

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {rows.map((stat) => (
                        <div key={stat.label} style={{ background: 'var(--bg-base)', borderRadius: 7, padding: '8px 10px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '0.78rem', color: stat.color }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                      style={{ width: 44, height: 36, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', padding: 2 }}
                    />
                    <input className="form-input" value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="#22c55e"
                      style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: `${form.color}11`, border: `1px solid ${form.color}33`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: form.color }}>{form.name || 'Wallet name preview'}</span>
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
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: 20 }}>
              This will permanently delete the wallet. Existing contributions and expenses linked to it will retain their reference.
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
