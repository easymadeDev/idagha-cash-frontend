import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AdminLayout from '../../components/AdminLayout';
import AdminHeader from '../../components/AdminHeader';
import api, { formatNaira, formatDate } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { adminFetcher, errorMessage } from '../../lib/member';
import { fileToDataUrl } from '../../lib/image';

const KEY = '/api/events/admin/all';
const EMPTY = {
  title: '', type: 'reunion', description: '', date: '', endDate: '', venue: '', coverImage: '',
  fee: 0, dressCode: '', capacity: 0, rsvpOpen: true, isPublished: true,
};

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm"
const toLocal = (d?: string) => {
  if (!d) return '';
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function RsvpList({ event, onClose }: { event: any; onClose: () => void }) {
  const { data } = useSWR(`/api/events/${event._id}/rsvps`, adminFetcher);
  const list = Array.isArray(data) ? data : [];
  const label: Record<string, string> = { going: 'Going', maybe: 'Maybe', not_going: "Can't make it" };

  const exportCsv = () => {
    const rows = [['Name', 'Response', 'Guests', 'Note'], ...list.map((r: any) => [r.memberName, label[r.status], r.guests, r.note || ''])];
    const csv = rows.map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${event.title.replace(/\W+/g, '-')}-rsvps.csv`;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">RSVPs — {event.title}</p>
        <p style={{ color: 'var(--text-3)', fontSize: '0.84rem', marginTop: -12, marginBottom: 14 }}>
          {event.rsvp.going} going · {event.rsvp.maybe} maybe · headcount with guests {event.rsvp.headcount}
        </p>
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {list.length === 0 ? <p style={{ color: 'var(--text-3)' }}>No responses yet.</p> : (
            <table style={{ width: '100%' }}>
              <thead><tr><th>Name</th><th>Response</th><th>Guests</th></tr></thead>
              <tbody>{list.map((r: any) => (
                <tr key={r._id}><td>{r.memberName}</td><td>{label[r.status]}</td><td>{r.guests || '—'}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="modal-actions">
          {list.length > 0 && <button className="btn btn-ghost" onClick={exportCsv}>Download CSV</button>}
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEvents() {
  const { toast } = useToast();
  const { data, isLoading } = useSWR(KEY, adminFetcher);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [rsvpFor, setRsvpFor] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const list = Array.isArray(data) ? data : [];

  const refresh = () => { mutate(KEY); mutate('/api/events'); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { _id, createdAt, updatedAt, __v, rsvp, ...rest } = form;
    const body: any = {
      ...rest,
      fee: Number(rest.fee) || 0,
      capacity: Number(rest.capacity) || 0,
      date: new Date(rest.date).toISOString(),
    };
    if (rest.endDate) body.endDate = new Date(rest.endDate).toISOString(); else delete body.endDate;
    try {
      if (_id) await api.put(`/events/${_id}`, body); else await api.post('/events', body);
      refresh(); setForm(null);
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/events/${id}`); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <AdminHeader title="Events & Reunions" sub="Create gatherings and see who is coming."
        action={<button className="btn btn-primary btn-sm" onClick={() => setForm(EMPTY)}>+ New event</button>} />

      {isLoading ? <p style={{ color: 'var(--text-3)' }}>Loading…</p> : list.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>No events yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {list.map((ev: any) => {
            const past = new Date(ev.endDate || ev.date).getTime() < Date.now();
            return (
              <div key={ev._id} className="card" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', opacity: ev.isPublished ? 1 : 0.6 }}>
                <div style={{ width: 84, height: 56, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0 }}>
                  {ev.coverImage && <img src={ev.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className="badge badge-green">{ev.type}</span>
                    {past && <span className="badge badge-red">Past</span>}
                    {!ev.isPublished && <span className="badge badge-yellow">Hidden</span>}
                    {ev.fee > 0 && <span className="badge badge-yellow">{formatNaira(ev.fee)}</span>}
                  </div>
                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{formatDate(ev.date)}{ev.venue ? ` · ${ev.venue}` : ''}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setRsvpFor(ev)}>{ev.rsvp.going} going · RSVPs</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...EMPTY, ...ev, date: toLocal(ev.date), endDate: toLocal(ev.endDate) })}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(ev._id)}>Del</button>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{form._id ? 'Edit event' : 'New event'}</p>
            <form onSubmit={save}>
              <label className="upload-drop" style={{ marginBottom: 16 }}>
                <input type="file" accept="image/*" hidden onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) try { setForm({ ...form, coverImage: await fileToDataUrl(f, 1600) }); } catch (er: any) { toast(er.message, 'error'); }
                }} />
                {form.coverImage ? <img src={form.coverImage} alt="Cover" /> : <span>Tap to add a cover image (optional)</span>}
              </label>
              <div className="form-group"><label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. 10-Year Reunion" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="reunion">Reunion</option><option value="meeting">Meeting</option><option value="social">Social</option>
                    <option value="outreach">Outreach</option><option value="other">Other</option>
                  </select></div>
                <div className="form-group"><label className="form-label">Venue</label>
                  <input className="form-input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Starts *</label>
                  <input className="form-input" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Ends</label>
                  <input className="form-input" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Fee per member (₦, 0 = free)</label>
                  <input className="form-input" type="number" min={0} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Capacity (0 = unlimited)</label>
                  <input className="form-input" type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Dress code</label>
                <input className="form-input" value={form.dressCode} onChange={(e) => setForm({ ...form, dressCode: e.target.value })} placeholder="e.g. Green and white" /></div>
              <div className="form-group"><label className="form-label">Description</label>
                <textarea className="form-textarea" style={{ minHeight: 120 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[['rsvpOpen', 'RSVP open'], ['isPublished', 'Visible to members']].map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} style={{ accentColor: 'var(--green-500)' }} /> {l}
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rsvpFor && <RsvpList event={rsvpFor} onClose={() => setRsvpFor(null)} />}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete event?</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>All RSVPs for this event will be deleted too.</p>
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
