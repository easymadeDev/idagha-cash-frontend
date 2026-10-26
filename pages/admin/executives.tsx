import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AdminLayout from '../../components/AdminLayout';
import AdminHeader from '../../components/AdminHeader';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { adminFetcher, errorMessage, initials } from '../../lib/member';
import { fileToDataUrl } from '../../lib/image';
import { OFFICIAL_POSITIONS, positionRank } from '../../lib/positions';

const KEY = '/api/executives/admin/all';
const EMPTY = { name: '', position: '', memberId: '', photo: '', bio: '', phone: '', email: '', tenure: '', isCurrent: true, order: 0 };
const SUGGESTED = OFFICIAL_POSITIONS;

export default function AdminExecutives() {
  const { toast } = useToast();
  const { data, isLoading } = useSWR(KEY, adminFetcher);
  const { data: members } = useSWR('/api/members/admin/all', adminFetcher);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [handover, setHandover] = useState(false);
  const [tenure, setTenure] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = Array.isArray(data) ? data : [];
  const current = list.filter((x: any) => x.isCurrent);
  const past = list.filter((x: any) => !x.isCurrent);
  const activeMembers = Array.isArray(members) ? members.filter((m: any) => m.status === 'active') : [];

  const refresh = () => { mutate(KEY); mutate('/api/executives'); mutate('/api/executives/past'); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { _id, createdAt, updatedAt, __v, ...body } = form;
    body.order = Number(body.order) || 0;
    try {
      if (_id) await api.put(`/executives/${_id}`, body); else await api.post('/executives', body);
      refresh(); setForm(null);
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setSaving(false); }
  };

  const linkMember = (id: string) => {
    const m = activeMembers.find((x: any) => x._id === id);
    if (!m) return setForm({ ...form, memberId: '' });
    setForm({ ...form, memberId: id, name: m.name, photo: m.photo || form.photo, phone: m.phone || form.phone, email: m.email || form.email });
  };

  const archive = async () => {
    if (!tenure.trim()) return;
    try {
      const { data: r } = await api.post('/executives/archive-current', { tenure: tenure.trim() });
      toast(`${r.archived} officers moved to past executives`, 'success');
      refresh(); setHandover(false); setTenure('');
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/executives/${id}`); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
    setDeleteId(null);
  };

  const Row = ({ x }: { x: any }) => (
    <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="avatar avatar-shield" style={{ width: 46, height: 52, fontSize: '0.8rem' }}>{x.photo ? <img src={x.photo} alt="" /> : initials(x.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>{x.name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{x.position}{x.tenure ? ` · ${x.tenure}` : ''}</div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...EMPTY, ...x })}>Edit</button>
      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(x._id)}>Del</button>
    </div>
  );

  return (
    <AdminLayout>
      <AdminHeader title="Executives" sub="Current officers and the archive of past teams."
        action={<div style={{ display: 'flex', gap: 8 }}>
          {current.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setHandover(true)}>Hand over</button>}
          <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...EMPTY, order: current.length })}>+ Add officer</button>
        </div>} />

      {isLoading ? <p style={{ color: 'var(--text-3)' }}>Loading…</p> : (
        <>
          <div className="section-title" style={{ marginBottom: 10 }}>Current ({current.length})</div>
          {current.length === 0
            ? <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', marginBottom: 24 }}>No current officers. Add the first one.</div>
            : <div style={{ display: 'grid', gap: 8, marginBottom: 28 }}>{current.map((x: any) => <Row key={x._id} x={x} />)}</div>}
          {past.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom: 10 }}>Past ({past.length})</div>
              <div style={{ display: 'grid', gap: 8 }}>{past.map((x: any) => <Row key={x._id} x={x} />)}</div>
            </>
          )}
        </>
      )}

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <p className="modal-title">{form._id ? 'Edit officer' : 'Add officer'}</p>
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Link to a member (fills name, photo, contacts)</label>
                <select className="form-select" value={form.memberId} onChange={(e) => linkMember(e.target.value)}>
                  <option value="">— Not linked —</option>
                  {activeMembers.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <label className="upload-drop" style={{ width: 100, height: 112, padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                  <input type="file" accept="image/*" hidden onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) try { setForm({ ...form, photo: await fileToDataUrl(f, 700) }); } catch (er: any) { toast(er.message, 'error'); }
                  }} />
                  {form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: 'none', borderRadius: 0 }} /> : <span>Photo</span>}
                </label>
                <div style={{ flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label">Full name *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position *</label>
                    {/* picking an official position also sets its display order (Chairman first) */}
                    <input className="form-input" list="pos-list" value={form.position} required
                      onChange={(e) => {
                        const rank = positionRank(e.target.value);
                        setForm({ ...form, position: e.target.value, order: rank < OFFICIAL_POSITIONS.length ? rank : form.order });
                      }} />
                    <datalist id="pos-list">{SUGGESTED.map((p) => <option key={p} value={p} />)}</datalist>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Short bio</label>
                <textarea className="form-textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Tenure</label><input className="form-input" value={form.tenure} placeholder="e.g. 2025 – 2027" onChange={(e) => setForm({ ...form, tenure: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Display order</label><input className="form-input" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="isCurrent" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--green-500)' }} />
                <label htmlFor="isCurrent" className="form-label" style={{ margin: 0 }}>Serving in the current executive</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {handover && (
        <div className="modal-overlay" onClick={() => setHandover(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Hand over to a new executive</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.86rem', marginBottom: 16 }}>
              All {current.length} current officers move to Past Executives under the tenure you enter. Then add the new team.
            </p>
            <div className="form-group">
              <label className="form-label">Tenure of the outgoing team</label>
              <input className="form-input" value={tenure} onChange={(e) => setTenure(e.target.value)} placeholder="e.g. 2023 – 2025" autoFocus />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setHandover(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!tenure.trim()} onClick={archive}>Archive current team</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete officer?</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>This removes them from the executive list. It cannot be undone.</p>
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
