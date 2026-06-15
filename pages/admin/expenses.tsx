import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api, { formatNaira, formatDate } from '../../lib/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const EMPTY = {
  title: '', amount: '', date: new Date().toISOString().slice(0, 10),
  description: '', category: 'general', approvedBy: '', wallet: 'group', walletId: '',
};
const CATEGORIES = ['general', 'food', 'transport', 'venue', 'printing', 'communication', 'welfare', 'other'];

// A split entry: which wallet + how much
type SplitEntry = { walletId: string; amount: string };

export default function AdminExpenses() {
  const { data: expenses, isLoading } = useSWR('/api/expenses', fetcher);
  const { data: wallets } = useSWR('/api/wallets', fetcher);
  const { data: walletStats } = useSWR('/api/stats/wallets', fetcher);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Multi-wallet split state
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<SplitEntry[]>([{ walletId: '', amount: '' }]);

  const list = Array.isArray(expenses) ? expenses : [];
  const walletList = Array.isArray(wallets) ? wallets : [];
  const statsList = Array.isArray(walletStats) ? walletStats : [];

  const getWalletById = (id: string) => walletList.find((w: any) => w._id === id);

  // Get live balance for a wallet from stats
  const getBalance = (walletId: string): number => {
    const s = statsList.find((s: any) => s.wallet?._id === walletId);
    return s ? s.balance : 0;
  };

  const totalAmount = Number(form.amount) || 0;

  // Check if selected wallet has enough balance for single-wallet mode
  const selectedWalletBalance = form.walletId ? getBalance(form.walletId) : null;
  const isInsufficient = selectedWalletBalance !== null && totalAmount > 0 && totalAmount > selectedWalletBalance;

  // Total allocated in split mode
  const splitTotal = useMemo(
    () => splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
    [splits],
  );

  const legacyLabel = (w: string) => w === 'reunion' ? 'Reunion Wallet' : 'Group Wallet';
  const legacyColor = (w: string) => w === 'reunion' ? 'var(--yellow)' : 'var(--blue)';
  const legacyBg = (w: string) => w === 'reunion' ? 'rgba(251,191,36,0.1)' : 'rgba(96,165,250,0.1)';
  const legacyBorder = (w: string) => w === 'reunion' ? 'rgba(251,191,36,0.25)' : 'rgba(96,165,250,0.25)';

  const openAdd = () => {
    const defaultWallet = walletList.find((w: any) => w.type === 'general');
    setEditing(null);
    setForm({ ...EMPTY, walletId: defaultWallet?._id || '', wallet: 'group' });
    setSplitMode(false);
    setSplits([{ walletId: defaultWallet?._id || '', amount: '' }]);
    setError('');
    setModal(true);
  };

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({
      title: e.title,
      amount: String(e.amount),
      date: e.date?.slice(0, 10) ?? '',
      description: e.description ?? '',
      category: e.category ?? 'general',
      approvedBy: e.approvedBy ?? '',
      wallet: e.wallet ?? 'group',
      walletId: e.walletId ?? '',
    });
    setSplitMode(false);
    setSplits([{ walletId: e.walletId ?? '', amount: String(e.amount) }]);
    setError('');
    setModal(true);
  };

  const handleWalletSelect = (walletId: string) => {
    const w = getWalletById(walletId);
    const legacyWallet = w?.type === 'reunion' ? 'reunion' : 'group';
    setForm({ ...form, walletId, wallet: legacyWallet });
  };

  const updateSplit = (idx: number, field: keyof SplitEntry, value: string) => {
    setSplits((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addSplit = () => setSplits((prev) => [...prev, { walletId: '', amount: '' }]);
  const removeSplit = (idx: number) => setSplits((prev) => prev.filter((_, i) => i !== idx));

  // Distribute remaining amount into splits
  const autoFill = () => {
    if (!totalAmount) return;
    const newSplits = [...splits];
    let remaining = totalAmount;
    for (let i = 0; i < newSplits.length; i++) {
      if (newSplits[i].walletId) {
        const bal = getBalance(newSplits[i].walletId);
        if (i === newSplits.length - 1) {
          newSplits[i] = { ...newSplits[i], amount: String(remaining) };
        } else {
          const take = Math.min(bal, remaining);
          newSplits[i] = { ...newSplits[i], amount: String(take) };
          remaining -= take;
        }
      }
    }
    setSplits(newSplits);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (splitMode) {
        // Validate splits
        const validSplits = splits.filter((s) => s.walletId && Number(s.amount) > 0);
        if (validSplits.length === 0) { setError('Add at least one wallet split with an amount.'); setSaving(false); return; }
        const diff = Math.abs(splitTotal - totalAmount);
        if (diff > 1) { setError(`Split amounts (${formatNaira(splitTotal)}) must equal total expense (${formatNaira(totalAmount)}).`); setSaving(false); return; }

        // Create one expense record per split
        for (const split of validSplits) {
          const w = getWalletById(split.walletId);
          const payload = {
            ...form,
            amount: Number(split.amount),
            walletId: split.walletId,
            wallet: w?.type === 'reunion' ? 'reunion' : 'group',
            title: validSplits.length > 1 ? `${form.title} (split)` : form.title,
          };
          if (editing && validSplits.length === 1) {
            await api.put(`/expenses/${editing._id}`, payload);
          } else {
            await api.post('/expenses', payload);
          }
        }
        // If editing and splitting into multiple, delete the original
        if (editing && validSplits.length > 1) {
          await api.delete(`/expenses/${editing._id}`);
        }
      } else {
        const payload = { ...form, amount: Number(form.amount) };
        if (editing) await api.put(`/expenses/${editing._id}`, payload);
        else await api.post('/expenses', payload);
      }

      mutate('/api/expenses');
      mutate('/api/stats/summary');
      mutate('/api/stats/wallets');
      mutate('/api/activity?limit=25');
      setModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      mutate('/api/expenses');
      mutate('/api/stats/summary');
      mutate('/api/stats/wallets');
    } catch { /* handled */ }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Expenses</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: 4 }}>Manage all expense records.</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
        </div>

        {/* Wallet balance summary strip */}
        {walletList.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {walletList.map((w: any) => {
              const bal = getBalance(w._id);
              return (
                <div key={w._id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  background: 'var(--card)', border: `1px solid ${w.color}33`,
                  borderRadius: 10,
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

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Title</th><th>Amount</th><th>Wallet</th><th>Date</th><th>Category</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Loading…</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No expenses yet. Add one above.</td></tr>
              ) : list.map((e: any, i: number) => {
                const namedWallet = e.walletId ? getWalletById(e.walletId) : null;
                return (
                  <tr key={e._id}>
                    <td className="hide-mobile" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td data-label="Title" style={{ fontWeight: 600 }}>{e.title}</td>
                    <td data-label="Amount" style={{ color: 'var(--red)', fontWeight: 700 }}>{formatNaira(e.amount)}</td>
                    <td data-label="Wallet">
                      {namedWallet ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: `${namedWallet.color}1a`, color: namedWallet.color, border: `1px solid ${namedWallet.color}44` }}>
                          {namedWallet.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: legacyBg(e.wallet), color: legacyColor(e.wallet), border: `1px solid ${legacyBorder(e.wallet)}` }}>
                          {legacyLabel(e.wallet)}
                        </span>
                      )}
                    </td>
                    <td data-label="Date" style={{ color: 'var(--text-3)' }}>{formatDate(e.date)}</td>
                    <td data-label="Category"><span className="badge badge-red">{e.category}</span></td>
                    <td className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(e._id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(ev) => ev.stopPropagation()}>
            <p className="modal-title">{editing ? 'Edit Expense' : 'Add Expense'}</p>
            <form onSubmit={save}>
              {error && <div className="alert alert-error">{error}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Amount (₦) *</label>
                  <input className="form-input" type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>

              {/* Wallet mode toggle */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>Deduct from Wallet *</label>
                  {walletList.length > 1 && (
                    <button type="button" onClick={() => {
                      setSplitMode(!splitMode);
                      if (!splitMode) {
                        setSplits(walletList.slice(0, 2).map((w: any) => ({ walletId: w._id, amount: '' })));
                      }
                    }} style={{
                      fontSize: '0.73rem', fontWeight: 700, padding: '4px 11px', borderRadius: 99, cursor: 'pointer',
                      border: splitMode ? '1px solid rgba(251,191,36,0.5)' : '1px solid var(--border)',
                      background: splitMode ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                      color: splitMode ? 'var(--yellow)' : 'var(--text-3)',
                    }}>
                      {splitMode ? 'Single wallet' : 'Split across wallets'}
                    </button>
                  )}
                </div>

                {!splitMode ? (
                  <>
                    {walletList.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                        {walletList.map((w: any) => {
                          const bal = getBalance(w._id);
                          const willOverdraw = totalAmount > 0 && totalAmount > bal;
                          return (
                            <div key={w._id} onClick={() => handleWalletSelect(w._id)} style={{
                              padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                              border: `2px solid ${form.walletId === w._id ? `${w.color}88` : 'var(--border)'}`,
                              background: form.walletId === w._id ? `${w.color}11` : 'transparent',
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: form.walletId === w._id ? w.color : 'var(--text-2)' }}>{w.name}</div>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: willOverdraw && form.walletId === w._id ? 'var(--red)' : 'var(--text-3)' }}>
                                Balance: <strong style={{ color: bal < 0 ? 'var(--red)' : 'inherit' }}>{formatNaira(bal)}</strong>
                              </div>
                              {willOverdraw && form.walletId === w._id && (
                                <div style={{ fontSize: '0.68rem', color: 'var(--yellow)', marginTop: 3, fontWeight: 600 }}>
                                  ⚠ Insufficient — use split
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { value: 'group', label: 'Group Wallet', color: 'var(--blue)' },
                          { value: 'reunion', label: 'Reunion Wallet', color: 'var(--yellow)' },
                        ].map((w) => (
                          <div key={w.value} onClick={() => setForm({ ...form, wallet: w.value })} style={{
                            padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            border: `2px solid ${form.wallet === w.value ? w.color : 'var(--border)'}`,
                            background: form.wallet === w.value ? `${w.color}11` : 'transparent',
                          }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: form.wallet === w.value ? w.color : 'var(--text-2)' }}>{w.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Insufficient balance warning + auto-suggest split */}
                    {isInsufficient && (
                      <div style={{
                        marginTop: 10, padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                      }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--yellow)' }}>Insufficient balance</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                            This wallet only has {formatNaira(selectedWalletBalance!)} but expense is {formatNaira(totalAmount)}.
                          </div>
                        </div>
                        <button type="button" onClick={() => { setSplitMode(true); setSplits(walletList.slice(0, 2).map((w: any) => ({ walletId: w._id, amount: '' }))); autoFill(); }}
                          style={{ fontSize: '0.75rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.1)', color: 'var(--yellow)', whiteSpace: 'nowrap' }}>
                          Split across wallets
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Split mode */
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 10 }}>
                      Allocate the ₦{totalAmount.toLocaleString()} total across multiple wallets.
                    </div>
                    {splits.map((split, idx) => {
                      const w = getWalletById(split.walletId);
                      const bal = split.walletId ? getBalance(split.walletId) : 0;
                      const amt = Number(split.amount) || 0;
                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Wallet</label>
                            <select className="form-select" value={split.walletId}
                              onChange={(e) => updateSplit(idx, 'walletId', e.target.value)}>
                              <option value="">— Select —</option>
                              {walletList.map((wl: any) => (
                                <option key={wl._id} value={wl._id}>{wl.name} ({formatNaira(getBalance(wl._id))})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                              Amount {w && <span style={{ color: amt > bal ? 'var(--red)' : 'var(--text-3)' }}>/ bal {formatNaira(bal)}</span>}
                            </label>
                            <input className="form-input" type="number" min="1" value={split.amount}
                              onChange={(e) => updateSplit(idx, 'amount', e.target.value)}
                              style={{ borderColor: amt > bal && split.walletId ? 'rgba(248,113,113,0.5)' : undefined }}
                            />
                          </div>
                          {splits.length > 1 && (
                            <button type="button" onClick={() => removeSplit(idx)}
                              style={{ marginBottom: 0, height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Split total status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: '0.8rem', color: Math.abs(splitTotal - totalAmount) > 1 ? 'var(--red)' : 'var(--green-400)', fontWeight: 600 }}>
                        Allocated: {formatNaira(splitTotal)} / {formatNaira(totalAmount)}
                        {Math.abs(splitTotal - totalAmount) <= 1 && ' ✓'}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={autoFill} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-3)' }}>
                          Auto-fill
                        </button>
                        {walletList.length > splits.length && (
                          <button type="button" onClick={addSplit} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.08)', color: 'var(--green-400)' }}>
                            + Add wallet
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Approved By</label>
                <input className="form-input" value={form.approvedBy} onChange={(e) => setForm({ ...form, approvedBy: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Confirm Delete</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>Delete this expense? This cannot be undone.</p>
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
