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

const AVATAR_COLORS = [
  ['rgba(34,197,94,0.15)', 'var(--green-400)'],
  ['rgba(96,165,250,0.15)', 'var(--blue)'],
  ['rgba(251,191,36,0.15)', 'var(--yellow)'],
  ['rgba(248,113,113,0.15)', 'var(--red)'],
  ['rgba(167,139,250,0.15)', '#c4b5fd'],
  ['rgba(251,146,60,0.15)', '#fb923c'],
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
}

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
  const [notifyTarget, setNotifyTarget] = useState<any>(null);
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [notifyDone, setNotifyDone] = useState<{ sent: boolean; error?: string } | null>(null);
  const [search, setSearch] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const PROFILE_URL = 'https://idagha2018alumni-beta.vercel.app/profile';

  const NOTIFY_TEMPLATES = [
    {
      label: 'Update Profile Photo',
      subject: 'Action Required: Please Update Your Profile Photo',
      message: `We noticed your profile on the IDAGHA Alumni portal does not have a profile photo yet.\n\nKindly upload a recent photo so your fellow alumni can recognise you on the Members directory. Use the button below to go directly to your profile:\n\n${PROFILE_URL}\n\nThank you for keeping your profile complete.`,
    },
    {
      label: 'Update Contact Details',
      subject: 'Action Required: Please Update Your Contact Information',
      message: `Your contact information on the IDAGHA Alumni portal appears to be incomplete or out of date.\n\nKindly update your phone number, WhatsApp, email address, and location so we can reach you and keep our records accurate. Click the button below to edit your profile:\n\n${PROFILE_URL}\n\nThank you!`,
    },
    {
      label: 'Complete Your Profile',
      subject: 'Action Required: Complete Your IDAGHA Alumni Profile',
      message: `Your IDAGHA Alumni profile is missing some important details.\n\nPlease fill in your nickname, occupation, location, and any other information you haven't provided yet. A complete profile helps your classmates find and reconnect with you.\n\n${PROFILE_URL}\n\nThank you for your cooperation.`,
    },
    {
      label: 'Pay Outstanding Contribution',
      subject: 'Reminder: Outstanding Contribution on Your Account',
      message: `This is a friendly reminder that you have an outstanding contribution on your IDAGHA Alumni account.\n\nKindly log in to the portal and make your payment at your earliest convenience to keep your account in good standing.\n\nThank you!`,
    },
  ];

  const openNotify = (m: any) => {
    setNotifyTarget(m);
    setNotifySubject('');
    setNotifyMessage('');
    setNotifyDone(null);
  };

  const applyTemplate = (tpl: typeof NOTIFY_TEMPLATES[0]) => {
    setNotifySubject(tpl.subject);
    setNotifyMessage(tpl.message);
  };

  const sendNotify = async () => {
    if (!notifySubject.trim() || !notifyMessage.trim()) {
      toast('Subject and message are required.', 'error'); return;
    }
    setNotifySending(true);
    try {
      const res = await api.post(`/members/${notifyTarget._id}/notify`, {
        subject: notifySubject,
        message: notifyMessage,
      });
      setNotifyDone({ sent: res.data.sent, error: res.data.error });
    } catch (err: any) {
      setNotifyDone({ sent: false, error: err.response?.data?.message || 'Failed to send' });
    } finally {
      setNotifySending(false);
    }
  };

  const allList = Array.isArray(members) ? members : [];
  const pending = allList.filter((m: any) => m.status === 'pending');
  const approved = allList.filter((m: any) => m.status !== 'pending');

  const filtered = search.trim()
    ? approved.filter((m: any) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.nickname || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.phone || '').includes(search)
      )
    : approved;

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      toast(editing ? 'Member updated.' : 'Member added.', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to save. Check your connection and try again.', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/members/${id}`); mutate('/api/members/admin/all'); mutate('/api/members'); toast('Member deleted.', 'success'); }
    catch { toast('Failed to delete.', 'error'); }
    setDeleteId(null);
  };

  const toggleActive = async (m: any) => {
    try { await api.put(`/members/${m._id}`, { isActive: !m.isActive }); mutate('/api/members/admin/all'); }
    catch { toast('Failed to update status.', 'error'); }
  };

  const approve = async (m: any) => {
    try { await api.put(`/members/${m._id}/approve`); mutate('/api/members/admin/all'); mutate('/api/members'); toast('Member approved.', 'success'); }
    catch { toast('Failed to approve.', 'error'); }
  };

  const sendWelcomeSelected = async () => {
    if (selectedMembers.length === 0) { toast('Please select at least one member.', 'error'); return; }
    setWelcomeSending(true);
    try {
      const res = await api.post('/members/welcome/selected', { memberIds: selectedMembers });
      setWelcomeResult(res.data);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to send welcome messages.', 'error');
      setWelcomeModal(false);
    } finally { setWelcomeSending(false); }
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(1.3rem,4vw,1.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Members</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 4 }}>
              {approved.length} registered · {pending.length > 0 ? `${pending.length} pending approval` : 'all approved'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setWelcomeResult(null); setWelcomeModal(true); }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Welcome
            </button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round"/></svg>
              Add Member
            </button>
          </div>
        </div>

        {/* Pending registrations */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 24, padding: '16px 18px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="badge badge-yellow"><span className="badge-dot" />{pending.length} Pending</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Self-registered — review &amp; approve</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pending.map((m: any) => (
                <div key={m._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  flexWrap: 'wrap', gap: 10,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden', background: 'rgba(34,197,94,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border-mid)',
                  }}>
                    {m.photo
                      ? <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--green-400)' }}>{getInitials(m.name)}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
                      {[m.gender, m.location, m.phone].filter(Boolean).join(' · ')}
                    </div>
                    {m.email && <div style={{ fontSize: '0.72rem', color: 'var(--blue)', marginTop: 1 }}>{m.email}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => approve(m)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div className="search-box">
            <svg className="search-box-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round"/>
            </svg>
            <input
              placeholder="Search by name, nickname, location, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Member Cards Grid */}
        {isLoading ? (
          <div className="admin-members-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
            {approved.length === 0 ? 'No members yet. Add one above.' : 'No members match your search.'}
          </div>
        ) : (
          <div className="admin-members-grid">
            {filtered.map((m: any, i: number) => {
              const [avatarBg, avatarFg] = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const isExpanded = expandedCard === m._id;
              return (
                <div key={m._id} className="admin-member-card" style={{ opacity: m.isActive ? 1 : 0.6 }}>
                  {/* Top: avatar + name + status */}
                  <div className="admin-member-card-top">
                    <div style={{
                      width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                      background: m.photo ? 'transparent' : avatarBg,
                      color: avatarFg, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 800,
                      border: m.photo ? '2px solid var(--border-mid)' : 'none',
                    }}>
                      {m.photo
                        ? <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : getInitials(m.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </div>
                      {m.nickname && (
                        <div style={{ fontSize: '0.72rem', color: avatarFg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{m.nickname}"
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                        {m.position
                          ? <span className="badge badge-green" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>{m.position}</span>
                          : <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'rgba(107,114,128,0.1)', color: 'var(--text-3)', borderColor: 'var(--border)' }}>Member</span>}
                        <span className={`badge ${m.isActive ? 'badge-green' : ''}`} style={!m.isActive ? { fontSize: '0.6rem', padding: '1px 6px', background: 'rgba(107,114,128,0.1)', color: 'var(--text-3)', borderColor: 'var(--border)' } : { fontSize: '0.6rem', padding: '1px 6px' }}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="admin-member-card-details">
                    {m.phone && (
                      <div className="admin-member-detail-row">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round"/></svg>
                        <span>{m.phone}</span>
                      </div>
                    )}
                    {m.location && (
                      <div className="admin-member-detail-row">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round"/></svg>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.location}</span>
                      </div>
                    )}
                    {m.occupation && (
                      <div className="admin-member-detail-row">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round"/></svg>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.occupation}</span>
                      </div>
                    )}
                    {isExpanded && m.email && (
                      <div className="admin-member-detail-row">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round"/></svg>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--blue)' }}>{m.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="admin-member-card-actions">
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(m)}>Edit</button>
                    <button
                      className="btn btn-sm"
                      style={{ flex: 1, background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                      onClick={() => openNotify(m)}
                    >
                      Notify
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ flex: 1, background: m.isActive ? 'rgba(107,114,128,0.1)' : 'rgba(34,197,94,0.1)', color: m.isActive ? 'var(--text-3)' : 'var(--green-400)', border: '1px solid var(--border)' }}
                      onClick={() => toggleActive(m)}
                    >
                      {m.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }} onClick={() => setDeleteId(m._id)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'right' }}>
          {filtered.length} of {approved.length} members
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{editing ? 'Edit Member' : 'Add New Member'}</p>
            <form onSubmit={save}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button" onClick={() => fileRef.current?.click()}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: photoPreview ? 'transparent' : 'rgba(34,197,94,0.06)',
                      border: `2px dashed ${photoPreview ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', padding: 0, transition: 'all 0.2s',
                    }}
                  >
                    {photoPreview
                      ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <svg width="24" height="24" fill="none" stroke="var(--green-400)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/></svg>}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                  <div style={{ marginTop: 5, fontSize: '0.7rem', color: 'var(--text-3)' }}>
                    {photoPreview ? <span style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>Change photo</span> : 'Click to upload'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={f('name')} required placeholder="e.g. Chukwuemeka Obi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nickname</label>
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
                  <label className="form-label">WhatsApp</label>
                  <input className="form-input" value={form.whatsapp} onChange={f('whatsapp')} placeholder="e.g. 08012345678" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="e.g. emeka@email.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">State / City</label>
                  <input className="form-input" value={form.location} onChange={f('location')} placeholder="e.g. Lagos" />
                </div>
                <div className="form-group">
                  <label className="form-label">Occupation</label>
                  <input className="form-input" value={form.occupation} onChange={f('occupation')} placeholder="e.g. Engineer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
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
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>
              This will permanently remove the member. This cannot be undone.
            </p>
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
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Send Welcome Messages</p>
            {!welcomeResult ? (
              <>
                <p style={{ color: 'var(--text-3)', marginBottom: 14, fontSize: '0.875rem' }}>
                  Select members to send <strong>welcome email + WhatsApp</strong> to:
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMembers(approved.map((m: any) => m._id))}>Select All</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMembers([])}>Clear</button>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                    {selectedMembers.length}/{approved.length} selected
                  </span>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 14, background: 'var(--bg-base)' }}>
                  {approved.map((m: any) => (
                    <div key={m._id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setSelectedMembers(selectedMembers.includes(m._id) ? selectedMembers.filter(id => id !== m._id) : [...selectedMembers, m._id])}
                    >
                      <input type="checkbox" checked={selectedMembers.includes(m._id)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                          {[m.email && '✉️', m.phone && '📱'].filter(Boolean).join(' ')}
                          {!m.email && !m.phone && 'No contact info'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.79rem', color: 'var(--yellow)', marginBottom: 14 }}>
                  WhatsApp messages only send if WhatsApp is connected.
                </div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => { setWelcomeModal(false); setSelectedMembers([]); }} disabled={welcomeSending}>Cancel</button>
                  <button className="btn btn-primary" onClick={sendWelcomeSelected} disabled={welcomeSending || selectedMembers.length === 0}>
                    {welcomeSending
                      ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                      : `Send to ${selectedMembers.length}`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="alert alert-success" style={{ marginBottom: 14 }}>Welcome messages sent!</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {[['Total', welcomeResult.total, ''], ['Emails sent', welcomeResult.emailSent, 'var(--green-400)'], ['WhatsApp sent', welcomeResult.whatsappSent, 'var(--green-400)']].map(([label, val, color]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-3)' }}>{label}</span>
                      <strong style={{ color: (color as string) || 'var(--text-1)' }}>{val}</strong>
                    </div>
                  ))}
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => { setWelcomeModal(false); setWelcomeResult(null); setSelectedMembers([]); }}>Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notify Member Modal */}
      {notifyTarget && (
        <div className="modal-overlay" onClick={() => { if (!notifySending) { setNotifyTarget(null); setNotifyDone(null); } }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '1px solid rgba(59,130,246,0.3)',
              }}>
                {notifyTarget.photo
                  ? <img src={notifyTarget.photo} alt={notifyTarget.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#93c5fd' }}>{getInitials(notifyTarget.name)}</span>}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Notify {notifyTarget.name}</p>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-3)', margin: 0, marginTop: 2 }}>
                  {notifyTarget.email ? `→ ${notifyTarget.email}` : '⚠️ No email address on record'}
                </p>
              </div>
            </div>

            {!notifyDone ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Templates</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {NOTIFY_TEMPLATES.map((tpl) => (
                      <button key={tpl.label} type="button" onClick={() => applyTemplate(tpl)}
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.74rem', background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.22)', cursor: 'pointer' }}>
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={notifySubject} onChange={(e) => setNotifySubject(e.target.value)} placeholder="Email subject line" />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="Write your message here…" rows={6} />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setNotifyTarget(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={sendNotify} disabled={notifySending || !notifyTarget.email}>
                    {notifySending
                      ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                      : <>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Send Email
                        </>}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {notifyDone.sent ? (
                  <>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <svg width="24" height="24" fill="none" stroke="var(--green-400)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ color: 'var(--green-400)', fontWeight: 700, margin: '0 0 5px' }}>Email sent!</p>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', margin: 0 }}>Delivered to {notifyTarget.email}</p>
                  </>
                ) : (
                  <>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <svg width="24" height="24" fill="none" stroke="var(--red)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ color: 'var(--red)', fontWeight: 700, margin: '0 0 5px' }}>Failed to send</p>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', margin: 0 }}>{notifyDone.error || 'Unknown error'}</p>
                  </>
                )}
                <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => { setNotifyTarget(null); setNotifyDone(null); }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .admin-members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .admin-member-card {
          background: var(--grad-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .admin-member-card:hover {
          border-color: var(--border-mid);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .admin-member-card-top {
          display: flex; gap: 11px; align-items: flex-start;
          padding: 14px 14px 10px;
        }
        .admin-member-card-details {
          padding: 0 14px 10px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .admin-member-detail-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.76rem; color: var(--text-3);
        }
        .admin-member-card-actions {
          display: flex; gap: 6px; align-items: center;
          padding: 10px 12px;
          border-top: 1px solid var(--border);
          background: rgba(6,13,8,0.4);
        }

        @media (max-width: 768px) {
          .admin-members-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
        }
        @media (max-width: 480px) {
          .admin-members-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
          .admin-member-card-top { padding: 11px 11px 8px; gap: 9px; }
          .admin-member-card-details { padding: 0 11px 8px; }
          .admin-member-card-actions { padding: 8px 10px; gap: 5px; }
          .admin-member-card-actions .btn { font-size: 0.7rem; padding: 5px 8px; }
        }
        @media (max-width: 380px) {
          .admin-members-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminLayout>
  );
}
