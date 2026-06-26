import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useGate } from '../lib/gate';
import { useRouter } from 'next/router';
import { useToast } from '../components/Toast';

const API = '/api';

const EMPTY = { nickname: '', phone: '', whatsapp: '', email: '', location: '', occupation: '', birthday: '' };

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { member, setMember, cleared, ready } = useGate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(EMPTY);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!cleared || !member) { router.replace('/home'); return; }
    const tok = sessionStorage.getItem('idagha_member_token') || localStorage.getItem('idagha_member_token') || '';
    fetch(`${API}/members/${member._id}/profile`, { headers: { 'x-member-token': tok } })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .catch(() =>
        fetch(`${API}/members`).then(r => r.json()).then((list: any[]) =>
          list.find((m: any) => m._id === member._id || m._id?.toString() === member._id)
        )
      )
      .then((data: any) => {
        if (!data) { setLoaded(true); return; }
        const filled = {
          nickname:   data.nickname   || '',
          phone:      data.phone      || '',
          whatsapp:   data.whatsapp   || '',
          email:      data.email      || '',
          location:   data.location   || '',
          occupation: data.occupation || '',
          birthday:   data.birthday?.slice(0, 10) || '',
        };
        setForm(filled);
        setOriginal(filled);
        setPhotoPreview(data.photo || member.photo || '');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [member, cleared, ready]);

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast('Photo must be under 3 MB.', 'error'); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    setForm(original);
    setPhoto(null);
    setPhotoPreview(member?.photo || '');
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    const tok = sessionStorage.getItem('idagha_member_token') || localStorage.getItem('idagha_member_token') || '';
    try {
      const res = await fetch(`${API}/members/${member._id}/self-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-member-token': tok },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let msg = 'Failed to update profile.';
        try { const d = await res.json(); msg = d?.message || msg; } catch {}
        throw new Error(msg);
      }

      let newPhoto: string | undefined;
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        const pr = await fetch(`${API}/members/${member._id}/photo`, {
          method: 'POST',
          headers: { 'x-member-token': tok },
          body: fd,
        });
        if (pr.ok) {
          const updated = await pr.json();
          newPhoto = updated.photo || photoPreview;
          setPhotoPreview(newPhoto as string);
        }
      }

      setOriginal(form);
      setMember({ ...member, nickname: form.nickname, ...(newPhoto ? { photo: newPhoto } : {}) });
      toast('Profile updated!', 'success');
      setEditing(false);
      setPhoto(null);
    } catch (err: any) {
      toast(err.message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !member || !loaded) return (
    <Layout>
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(34,197,94,0.2)', borderTopColor: 'var(--green-400)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );

  const initials = member.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
  const displayBirthday = form.birthday
    ? new Date(form.birthday + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <Layout>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Profile hero */}
        <div className="profile-hero-card">
          {/* Green banner */}
          <div className="profile-banner" />

          <div style={{ padding: '0 20px 20px', position: 'relative' }}>
            {/* Avatar overlapping banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div style={{ position: 'relative', marginTop: -46 }}>
                <div className="profile-avatar">
                  {photoPreview
                    ? <img src={photoPreview} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--green-400)' }}>{initials}</span>}
                </div>
                {/* Always-visible camera button to change photo */}
                <button
                  type="button"
                  onClick={() => { setEditing(true); setTimeout(() => fileRef.current?.click(), 50); }}
                  className="profile-camera-btn"
                  title="Change profile photo"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </div>

              {!editing && (
                <button onClick={() => setEditing(true)} className="profile-edit-btn">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>

            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-1)' }}>{member.name}</h1>
            {form.nickname && <div style={{ fontSize: '0.82rem', color: 'var(--green-400)', marginBottom: 6 }}>"{form.nickname}"</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {member.position && (
                <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-400)' }}>
                  {member.position}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-3)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-400)', display: 'inline-block' }} />
                Verified member
              </span>
            </div>

            {/* New photo selected indicator */}
            {photo && !editing && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--green-400)' }}>
                New photo selected — save your profile to apply it.
              </div>
            )}
          </div>
        </div>

        {/* View mode */}
        {!editing && (
          <div className="profile-info-card">
            {[
              { label: 'Nickname', value: form.nickname, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
              { label: 'Phone', value: form.phone, icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
              { label: 'WhatsApp', value: form.whatsapp, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
              { label: 'Email', value: form.email, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { label: 'Location', value: form.location, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
              { label: 'Occupation', value: form.occupation, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { label: 'Birthday', value: displayBirthday || '', icon: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6l3-3 3 3M12 3v4M9 18h6M3 9h18' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="profile-info-row">
                <div className="profile-info-icon">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', color: value ? 'var(--text-1)' : 'var(--text-3)', fontStyle: value ? 'normal' : 'italic' }}>
                    {value || 'Not set'}
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => setEditing(true)} className="btn btn-primary" style={{ width: '100%', marginTop: 6, marginBottom: 6 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit My Profile
            </button>
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <form onSubmit={handleSubmit}>

            {/* Photo section in edit mode */}
            <div className="profile-section">
              <div className="profile-section-title">Profile Photo</div>
              {photo ? (
                <div className="profile-photo-preview-row">
                  <img src={photoPreview} alt="preview" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(34,197,94,0.4)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--green-400)', marginBottom: 4 }}>
                      ✓ New photo ready
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0 0 10px' }}>Will be saved when you click Save Changes.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>Change</button>
                      <button type="button" className="btn btn-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }} onClick={() => { setPhoto(null); setPhotoPreview(original.phone ? photoPreview : (member?.photo || '')); }}>Remove</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button type="button" className="profile-photo-upload-row" onClick={() => fileRef.current?.click()}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: photoPreview ? 'transparent' : 'rgba(34,197,94,0.08)',
                    border: '2px dashed rgba(34,197,94,0.35)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <svg width="22" height="22" fill="none" stroke="var(--green-400)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-1)', marginBottom: 2 }}>
                      {photoPreview ? 'Tap to change photo' : 'Add profile photo'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {photoPreview ? 'Upload a new photo to replace the current one' : 'Helps classmates recognise you · JPG, PNG · max 3 MB'}
                    </div>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="var(--text-3)" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="profile-section">
              <div className="profile-section-title">Contact & Details</div>
              <div className="form-grid-2">
                {[
                  { label: 'Nickname in School', field: 'nickname', placeholder: 'e.g. Ice, Boss' },
                  { label: 'Phone Number',        field: 'phone',    placeholder: 'e.g. 08012345678' },
                  { label: 'WhatsApp Number',     field: 'whatsapp', placeholder: 'e.g. 08012345678' },
                  { label: 'Email Address',       field: 'email',    placeholder: 'yourname@email.com', type: 'email' },
                  { label: 'State / City',        field: 'location', placeholder: 'e.g. Lagos, Abuja' },
                  { label: 'Occupation',          field: 'occupation', placeholder: 'e.g. Engineer, Teacher' },
                ].map(({ label, field, placeholder, type }) => (
                  <div key={field} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="form-input" type={type || 'text'} value={(form as any)[field]} onChange={f(field)} placeholder={placeholder} />
                  </div>
                ))}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Birthday</label>
                  <input className="form-input" type="date" value={form.birthday} onChange={f('birthday')} />
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-3)', marginTop: 4, display: 'block' }}>Used for birthday celebrations in the group</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={handleCancel}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                {saving ? (
                  <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .profile-hero-card {
          background: linear-gradient(135deg, var(--bg-card2), var(--bg-surface));
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: var(--radius); overflow: hidden;
          margin-bottom: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .profile-banner {
          height: 80px;
          background: linear-gradient(135deg, #064e3b, #065f46, #047857);
          position: relative; overflow: hidden;
        }
        .profile-banner::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 70% 50%, rgba(255,255,255,0.06), transparent 60%);
        }
        .profile-avatar {
          width: 86px; height: 86px; border-radius: 50%; overflow: hidden;
          border: 3px solid var(--bg-card2);
          background: rgba(34,197,94,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .profile-camera-btn {
          position: absolute; bottom: 0; right: 0;
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--green-600); border: 2px solid var(--bg-card2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: background 0.15s;
        }
        .profile-camera-btn:hover { background: var(--green-500); }
        .profile-edit-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25);
          color: var(--green-400); font-weight: 600; font-size: 0.82rem;
          cursor: pointer; font-family: var(--font); transition: all 0.15s;
        }
        .profile-edit-btn:hover { background: rgba(34,197,94,0.18); }

        .profile-info-card {
          background: var(--grad-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 6px 18px 14px;
          margin-bottom: 14px;
        }
        .profile-info-row {
          display: flex; align-items: flex-start; gap: 13px;
          padding: 12px 0; border-bottom: 1px solid var(--border);
        }
        .profile-info-row:last-of-type { border-bottom: none; }
        .profile-info-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--green-400);
        }

        .profile-section {
          background: var(--grad-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 18px 6px;
          margin-bottom: 12px;
        }
        .profile-section-title {
          font-size: 0.78rem; font-weight: 700; color: var(--text-3);
          text-transform: uppercase; letter-spacing: 0.07em;
          margin-bottom: 16px;
        }
        .profile-photo-preview-row {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 14px; background: rgba(34,197,94,0.04);
          border: 1px solid rgba(34,197,94,0.2); border-radius: var(--radius-sm);
          margin-bottom: 14px;
        }
        .profile-photo-upload-row {
          display: flex; align-items: center; gap: 14px; width: 100%;
          padding: 14px; background: rgba(34,197,94,0.03);
          border: 2px dashed rgba(34,197,94,0.25); border-radius: var(--radius-sm);
          cursor: pointer; text-align: left; margin-bottom: 14px;
          transition: border-color 0.2s, background 0.2s; font-family: var(--font);
        }
        .profile-photo-upload-row:hover {
          border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.06);
        }

        @media (max-width: 480px) {
          .profile-info-card { padding: 4px 14px 10px; }
          .profile-section { padding: 14px 14px 4px; }
        }
      `}</style>
    </Layout>
  );
}
