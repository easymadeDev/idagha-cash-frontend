import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useGate } from '../lib/gate';
import { useRouter } from 'next/router';
import { useToast } from '../components/Toast';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const EMPTY = { nickname: '', phone: '', whatsapp: '', email: '', location: '', occupation: '', birthday: '' };

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { member, setMember, cleared } = useGate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(EMPTY);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!cleared) { router.replace('/home'); return; }
    if (!member) { router.replace('/home'); return; }
    const tok = sessionStorage.getItem('idagha_member_token') || '';
    fetch(`${BACKEND}/members/${member._id}/profile`, { headers: { 'x-member-token': tok } })
      .then(r => r.json())
      .then(data => {
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
  }, [member, cleared]);

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
    setPhotoPreview(original.nickname ? photoPreview : (member?.photo || ''));
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    const tok = sessionStorage.getItem('idagha_member_token') || '';
    try {
      const res = await fetch(`${BACKEND}/members/${member._id}/self-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-member-token': tok },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update profile.');

      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        const pr = await fetch(`${BACKEND}/members/${member._id}/photo`, {
          method: 'POST',
          headers: { 'x-member-token': tok },
          body: fd,
        });
        if (pr.ok) {
          const updated = await pr.json();
          const newPhoto = updated.photo || photoPreview;
          setPhotoPreview(newPhoto);
          setMember({ ...member, photo: newPhoto });
        }
      }

      setOriginal(form);
      setMember({ ...member, nickname: form.nickname });
      toast('Profile updated!', 'success');
      setEditing(false);
      setPhoto(null);
    } catch (err: any) {
      toast(err.message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!member || !loaded) return (
    <Layout>
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(34,197,94,0.2)', borderTopColor: 'var(--green-400)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );

  const initials = member.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
  const displayBirthday = form.birthday ? new Date(form.birthday + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--green-400)' }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.9rem', color: value ? 'var(--text-1)' : 'var(--text-3)', fontWeight: value ? 500 : 400, fontStyle: value ? 'normal' : 'italic' }}>
          {value || 'Not set'}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Hero card */}
        <div style={{
          background: 'linear-gradient(135deg,#0d2010,#060d08)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 20, overflow: 'hidden', marginBottom: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Banner */}
          <div style={{ height: 90, background: 'linear-gradient(135deg,#064e3b,#065f46,#047857)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")' }} />
          </div>

          <div style={{ padding: '0 24px 24px', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginTop: -44 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                border: '3px solid #0d2010',
                background: 'rgba(34,197,94,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green-400)' }}>{initials}</span>
                )}
              </div>
              {editing && (
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--green-600)', border: '2px solid #0d2010',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>{member.name}</h1>
                {form.nickname && <div style={{ fontSize: '0.82rem', color: 'var(--green-400)', marginTop: 2 }}>"{form.nickname}"</div>}
                {member.position && (
                  <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-400)' }}>
                    {member.position}
                  </span>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Verified member
                </div>
              </div>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  color: 'var(--green-400)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View mode */}
        {!editing && (
          <div style={{ background: 'linear-gradient(160deg,#0d2010,#060d08)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '8px 20px 4px' }}>
            <InfoRow label="Nickname" value={form.nickname} icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <InfoRow label="Phone" value={form.phone} icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <InfoRow label="WhatsApp" value={form.whatsapp} icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <InfoRow label="Email" value={form.email} icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <InfoRow label="Location" value={form.location} icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <InfoRow label="Occupation" value={form.occupation} icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <InfoRow label="Birthday" value={displayBirthday || undefined} icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6l3-3 3 3M12 3v4M9 18h6M3 9h18" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <form onSubmit={handleSubmit} style={{ background: 'linear-gradient(160deg,#0d2010,#060d08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--green-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Editing Profile
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Nickname in School', field: 'nickname', placeholder: 'e.g. Ice, Boss' },
                { label: 'Phone Number',       field: 'phone',    placeholder: 'e.g. 08012345678' },
                { label: 'WhatsApp Number',    field: 'whatsapp', placeholder: 'e.g. 08012345678' },
                { label: 'Email Address',      field: 'email',    placeholder: 'yourname@email.com', type: 'email' },
                { label: 'Current State / City', field: 'location',   placeholder: 'e.g. Lagos, Abuja' },
                { label: 'Occupation / Business', field: 'occupation', placeholder: 'e.g. Engineer, Teacher' },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field} style={{ marginBottom: 2 }}>
                  <label style={lbl}>{label}</label>
                  <input style={inp} type={type || 'text'} value={(form as any)[field]} onChange={f(field)} placeholder={placeholder} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Birthday</label>
                <input style={inp} type="date" value={form.birthday} onChange={f('birthday')} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={handleCancel} style={btnOutline}>Cancel</button>
              <button type="submit" disabled={saving} style={btnPrimary}>
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Saving…
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: '#9ca3af', marginBottom: 5,
};

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, background: '#111827',
  color: '#f9fafb', fontSize: '0.88rem',
  boxSizing: 'border-box', outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  flex: 1, padding: '11px 20px',
  background: 'linear-gradient(135deg,#16a34a,#22c55e)',
  border: 'none', borderRadius: 10,
  color: '#fff', fontWeight: 700, fontSize: '0.9rem',
  cursor: 'pointer',
};

const btnOutline: React.CSSProperties = {
  padding: '11px 20px',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, color: '#9ca3af',
  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
};
