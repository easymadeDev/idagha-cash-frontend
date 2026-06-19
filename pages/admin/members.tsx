import { useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` },
  }).then((r) => r.json());

const EMPTY = {
  name: '', nickname: '', phone: '', whatsapp: '',
  gender: '', email: '', location: '', occupation: '', position: '', birthday: '',
};

const POSITIONS = ['Member', 'Secretary', 'President', 'Vice President', 'Treasurer', 'PRO', 'Welfare Officer', 'Financial Secretary'];

export default function AdminMembers() {
  const { toast } = useToast();
  const { data: members, isLoading } = useSWR('/api/members/admin/all', fetcher);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [welcomeModal, setWelcomeModal] = useState(false);
  const [welcomeSending, setWelcomeSending] = useState(false);
  const [welcomeResult, setWelcomeResult] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const allList = Array.isArray(members) ? members : [];
  const pending = allList.filter((m: any) => m.status === 'pending');
  const list = allList.filter((m: any) => m.status !== 'pending');

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setPhoto(null); setPhotoPreview('');
    setModal(true);
  };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      name: m.name || '', nickname: m.nickname || '', phone: m.phone || '',
      whatsapp: m.whatsapp || '', gender: m.gender || '', email: m.email || '',
      location: m.location || '', occupation: m.occupation || '',
      position: m.position || '', birthday: m.birthday || '',
    });
    setPhoto(null);
    setPhotoPreview(m.photo || '');
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      let saved: any;
      if (editing) {
        saved = (await api.put(`/members/${editing._id}`, form)).data;
      } else {
        saved = (await api.post('/members', form)).data;
      }
      // Upload photo if a new one was selected
      if (photo && saved?._id) {
        const fd = new FormData();
        fd.append('photo', photo);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/members/${saved._id}/photo`, {
          method: 'POST', body: fd,
        });
      }
      mutate('/api/members/admin/all');
      mutate('/api/members');
      setModal(false);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to save. Check your connection and try again.', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/members/${id}`); mutate('/api/members/admin/all'); mutate('/api/members'); }
    catch { /* handled */ }
    setDeleteId(null);
  };

  const toggleActive = async (m: any) => {
    try { await api.put(`/members/${m._id}`, { isActive: !m.isActive }); mutate('/api/members/admin/all'); }
    catch { /* handled */ }
  };

  const approve = async (m: any) => {
    try { await api.put(`/members/${m._id}/approve`); mutate('/api/members/admin/all'); mutate('/api/members'); }
    catch { /* handled */ }
  };

  const sendWelcomeAll = async () => {
    setWelcomeSending(true);
    try {
      const res = await api.post('/members/welcome/all');
      setWelcomeResult(res.data);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to send welcome messages.', 'error');
      setWelcomeModal(false);
    } finally {
      setWelcomeSending(false);
    }
  };

  const sendWelcomeSelected = async () => {
    if (selectedMembers.length === 0) {
      toast('Please select at least one member.', 'error');
      return;
    }
    setWelcomeSending(true);
    try {
      const res = await api.post('/members/welcome/selected', { memberIds: selectedMembers });
      setWelcomeResult(res.data);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to send welcome messages.', 'error');
      setWelcomeModal(false);
    } finally {
      setWelcomeSending(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Members</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: 4 }}>Manage registered group members visible on the public directory.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => { setWelcomeResult(null); setWelcomeModal(true); }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Send Welcome
            </button>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Member</button>
          </div>
        </div>

        {/* Pending registrations */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 28, padding: '20px 24px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="badge badge-yellow"><span className="badge-dot" />{pending.length} Pending Approval</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Self-registered — review and approve or delete</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map((m: any) => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap' }}>
                  {/* Photo or initials */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden', background: 'rgba(34,197,94,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border-mid)',
                  }}>
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green-400)' }}>
                        {m.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 3 }}>
                      {[m.gender, m.location, m.phone].filter(Boolean).join(' · ')}
                    </div>
                    {m.occupation && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{m.occupation}</div>}
                    {m.email && <div style={{ fontSize: '0.78rem', color: 'var(--blue)' }}>{m.email}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => approve(m)}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Approve
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(m._id)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th style={{ width: 48 }}></th>
                <th>Member</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Loading…</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No members yet. Add one above.</td></tr>
              ) : list.map((m: any, i: number) => (
                <tr key={m._id} style={{ opacity: m.isActive ? 1 : 0.5 }}>
                  <td className="hide-mobile" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td className="hide-mobile" style={{ paddingRight: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                      {m.photo
                        ? <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--green-400)' }}>{m.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}</span>}
                    </div>
                  </td>
                  <td data-label="Member">
                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                      {[m.nickname && `"${m.nickname}"`, m.gender].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td data-label="Phone" style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{m.phone || '—'}</td>
                  <td data-label="Location">
                    <div style={{ fontSize: '0.85rem' }}>{m.location || '—'}</div>
                    {m.occupation && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 1 }}>{m.occupation}</div>}
                  </td>
                  <td data-label="Position">
                    {m.position
                      ? <span className="badge badge-green">{m.position}</span>
                      : <span className="badge" style={{ background: 'rgba(107,114,128,0.1)', color: 'var(--text-3)', borderColor: 'var(--border)' }}>Member</span>}
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${m.isActive ? 'badge-green' : ''}`} style={!m.isActive ? { background: 'rgba(107,114,128,0.1)', color: 'var(--text-3)', borderColor: 'var(--border)' } : {}}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(m)}>{m.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(m._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{editing ? 'Edit Member' : 'Add New Member'}</p>
            <form onSubmit={save}>
              {/* Photo upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: 90, height: 90, borderRadius: '50%',
                      background: photoPreview ? 'transparent' : 'rgba(34,197,94,0.06)',
                      border: `2px dashed ${photoPreview ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', padding: 0,
                      transition: 'all 0.2s var(--ease)',
                    }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="26" height="26" fill="none" stroke="var(--green-400)" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                  <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-3)' }}>
                    {photoPreview ? (
                      <span style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>Change photo</span>
                    ) : 'Click to upload photo'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={f('name')} required placeholder="e.g. Chukwuemeka Obi" />
                </div>

                <div className="form-group">
                  <label className="form-label">Nickname in School</label>
                  <input className="form-input" value={form.nickname} onChange={f('nickname')} placeholder="e.g. Ice" />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={f('gender')}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={form.phone} onChange={f('phone')} placeholder="e.g. 08012345678" />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Number</label>
                  <input className="form-input" value={form.whatsapp} onChange={f('whatsapp')} placeholder="e.g. 08012345678" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="e.g. emeka@email.com" />
                </div>

                <div className="form-group">
                  <label className="form-label">Current State / City</label>
                  <input className="form-input" value={form.location} onChange={f('location')} placeholder="e.g. Lagos" />
                </div>

                <div className="form-group">
                  <label className="form-label">Occupation / Business</label>
                  <input className="form-input" value={form.occupation} onChange={f('occupation')} placeholder="e.g. Software Engineer" />
                </div>

                <div className="form-group">
                  <label className="form-label">Member Position</label>
                  <select className="form-select" value={form.position} onChange={f('position')}>
                    <option value="">Select position</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Birthday</label>
                  <input className="form-input" type="date" value={form.birthday} onChange={f('birthday')} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete Member?</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>This will permanently remove the member from the public directory. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => remove(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Welcome Modal */}
      {welcomeModal && (
        <div className="modal-overlay" onClick={() => { if (!welcomeSending) { setWelcomeModal(false); setWelcomeResult(null); setSelectedMembers([]); } }}>
          <div className="modal" style={{ maxWidth: 520, maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Send Welcome Messages</p>

            {!welcomeResult ? (
              <>
                <p style={{ color: 'var(--text-3)', marginBottom: 16, fontSize: '0.9rem' }}>
                  Select members to send <strong>welcome email + WhatsApp</strong> to:
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedMembers(list.map((m: any) => m._id))}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedMembers([])}
                  >
                    Clear
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                    {selectedMembers.length}/{list.length} selected
                  </span>
                </div>

                <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 16, background: 'var(--bg-base)' }}>
                  {list.map((m: any) => (
                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setSelectedMembers(selectedMembers.includes(m._id) ? selectedMembers.filter(id => id !== m._id) : [...selectedMembers, m._id])}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(m._id)}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          {[m.email && '✉️ Email', m.phone && '📱 Phone'].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--yellow)', marginBottom: 16 }}>
                  WhatsApp messages will only send if WhatsApp is connected.
                </div>

                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => { setWelcomeModal(false); setSelectedMembers([]); }} disabled={welcomeSending}>Cancel</button>
                  <button className="btn btn-primary" onClick={sendWelcomeSelected} disabled={welcomeSending || selectedMembers.length === 0}>
                    {welcomeSending ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                    ) : `Send to ${selectedMembers.length}`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="alert alert-success" style={{ marginBottom: 16 }}>Welcome messages sent successfully!</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-3)' }}>Total members</span>
                    <strong>{welcomeResult.total}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-3)' }}>Emails sent</span>
                    <strong style={{ color: 'var(--green-400)' }}>{welcomeResult.emailSent}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-3)' }}>WhatsApp sent</span>
                    <strong style={{ color: 'var(--green-400)' }}>{welcomeResult.whatsappSent}</strong>
                  </div>
                  {welcomeResult.noEmail?.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4 }}>
                      No email: {welcomeResult.noEmail.join(', ')}
                    </div>
                  )}
                  {welcomeResult.noPhone?.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                      No phone: {welcomeResult.noPhone.join(', ')}
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => { setWelcomeModal(false); setWelcomeResult(null); setSelectedMembers([]); }}>Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
