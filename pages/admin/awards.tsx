import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AdminLayout from '../../components/AdminLayout';
import AdminHeader from '../../components/AdminHeader';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { adminFetcher, errorMessage, initials } from '../../lib/member';

const KEY = '/api/awards/admin/all';
const EMPTY = { title: '', description: '', emoji: '🏆', season: `${new Date().getFullYear()} Alumni Awards`, status: 'open', order: 0 };
const STARTERS = [
  ['Best Online', '📱', 'Always active in the group chat'],
  ['Best Talker', '🎤', 'The voice of the set'],
  ['Most Active', '⚡', 'Shows up for everything'],
  ['Most Supportive', '🤝', 'Always there for classmates'],
  ['Best Dressed', '👔', 'Never misses with the outfit'],
  ['Funniest', '😂', 'Keeps everyone laughing'],
];

export default function AdminAwards() {
  const { toast } = useToast();
  const { data, isLoading } = useSWR(KEY, adminFetcher, { refreshInterval: 20000 });
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const list = Array.isArray(data) ? data : [];

  const refresh = () => { mutate(KEY); mutate('/api/awards'); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const body = { title: form.title, description: form.description, emoji: form.emoji, season: form.season, status: form.status, order: Number(form.order) || 0 };
    try {
      if (form._id) await api.put(`/awards/${form._id}`, body); else await api.post('/awards', body);
      refresh(); setForm(null);
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setSaving(false); }
  };

  const addStarters = async () => {
    const existing = new Set(list.map((c: any) => c.title.toLowerCase()));
    const todo = STARTERS.filter(([t]) => !existing.has(t.toLowerCase()));
    try {
      for (const [i, [title, emoji, description]] of todo.entries()) {
        await api.post('/awards', { ...EMPTY, title, emoji, description, order: list.length + i });
      }
      refresh(); toast(`${todo.length} categories added`, 'success');
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const setStatus = async (c: any, status: string) => {
    try { await api.put(`/awards/${c._id}`, { status }); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
  };
  const hide = async (n: any) => {
    try { await api.put(`/awards/nominees/${n._id}`, { hidden: !n.hidden }); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
  };
  const removeNominee = async (n: any) => {
    if (!confirm(`Remove ${n.memberName} and all their supports from this category?`)) return;
    try { await api.delete(`/awards/nominees/${n._id}`); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
  };
  const remove = async (id: string) => {
    try { await api.delete(`/awards/${id}`); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <AdminHeader title="Alumni Awards" sub="Fun categories members nominate and support classmates in."
        action={<div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={addStarters}>Add starter categories</button>
          <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...EMPTY, order: list.length })}>+ New category</button>
        </div>} />

      {isLoading ? <p style={{ color: 'var(--text-3)' }}>Loading…</p> : list.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
          No categories yet. Use “Add starter categories” for Best Online, Best Talker, Most Active and more.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {list.map((c: any) => (
            <div key={c._id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="award-emoji">{c.emoji}</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 800 }}>{c.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{c.season} · {c.nominees.length} nominees · {c.totalSupports} supports</div>
                </div>
                <select className="form-select" style={{ width: 150, padding: '6px 10px', fontSize: '0.8rem' }} value={c.status} onChange={(e) => setStatus(c, e.target.value)} aria-label="Status">
                  <option value="draft">Draft (hidden)</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed — show winner</option>
                </select>
                <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...c })}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(c._id)}>Del</button>
              </div>
              {c.nominees.length > 0 && (
                <div style={{ display: 'grid', gap: 6, marginTop: 14 }}>
                  {c.nominees.map((n: any) => (
                    <div key={n._id} className="nominee-row" style={{ opacity: n.hidden ? 0.5 : 1 }}>
                      <div className="avatar">{n.memberPhoto ? <img src={n.memberPhoto} alt="" /> : initials(n.memberName)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{n.memberName}{n.hidden && ' (hidden)'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>by {n.nominatedByName || '—'}{n.reason ? ` · “${n.reason}”` : ''}</div>
                      </div>
                      <strong style={{ color: 'var(--green-400)' }}>{n.supports}</strong>
                      <button className="btn btn-ghost btn-sm" onClick={() => hide(n)}>{n.hidden ? 'Show' : 'Hide'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => removeNominee(n)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{form._id ? 'Edit category' : 'New category'}</p>
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
                <div className="form-group"><label className="form-label">Icon</label>
                  <input className="form-input" value={form.emoji} maxLength={4} onChange={(e) => setForm({ ...form, emoji: e.target.value })} style={{ textAlign: 'center', fontSize: '1.2rem' }} /></div>
                <div className="form-group"><label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Best Online" /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
                <div className="form-group"><label className="form-label">Season</label>
                  <input className="form-input" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Order</label>
                  <input className="form-input" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete category?</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>All nominations and supports in it will be deleted.</p>
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
