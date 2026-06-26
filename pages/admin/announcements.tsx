import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api, { formatDate } from '../../lib/api';
import { useToast } from '../../components/Toast';

const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` },
  }).then((r) => r.json());

const EMPTY = { title: '', content: '', type: 'info', isActive: true };

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const { data: announcements, isLoading } = useSWR('/api/announcements/admin/all', fetcher);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = Array.isArray(announcements) ? announcements : [];

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (a: any) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, type: a.type ?? 'info', isActive: a.isActive ?? true });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/announcements/${editing._id}`, form);
      else await api.post('/announcements', form);
      mutate('/api/announcements/admin/all');
      mutate('/api/announcements');
      setModal(false);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to save. Check your connection.', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/announcements/${id}`); mutate('/api/announcements/admin/all'); mutate('/api/announcements'); }
    catch { /* handled */ }
    setDeleteId(null);
  };

  const toggleActive = async (a: any) => {
    try { await api.put(`/announcements/${a._id}`, { isActive: !a.isActive }); mutate('/api/announcements/admin/all'); }
    catch { /* handled */ }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Announcements</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 2 }}>Post and manage public announcements.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ New</button>
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--text-3)' }}>Loading…</p>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>No announcements yet. Add one above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map((a: any) => (
              <div key={a._id} className="card" style={{ padding: '14px 16px', opacity: a.isActive ? 1 : 0.55 }}>
                <div className="admin-announce-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 7, flexWrap: 'wrap' }}>
                      <span className={`badge ${a.type === 'success' ? 'badge-green' : a.type === 'warning' ? 'badge-yellow' : 'badge-blue'}`}>{a.type}</span>
                      {!a.isActive && <span className="badge" style={{ background: 'rgba(107,114,128,0.12)', color: 'var(--text-3)', borderColor: 'var(--border)' }}>Hidden</span>}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginLeft: 'auto' }}>{formatDate(a.createdAt)}</span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 5 }}>{a.title}</h3>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', lineHeight: 1.55, wordBreak: 'break-word' }}>{a.content}</p>
                  </div>
                  <div className="announce-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(a)}>{a.isActive ? 'Hide' : 'Show'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(a._id)}>Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{editing ? 'Edit Announcement' : 'New Announcement'}</p>
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea className="form-textarea" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--green-500)' }} />
                <label htmlFor="isActive" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Visible to public</label>
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
            <p className="modal-title">Delete Announcement?</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>This cannot be undone.</p>
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
