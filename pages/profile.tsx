import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useGate } from '../lib/gate';
import { useRouter } from 'next/router';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ProfilePage() {
  const router = useRouter();
  const { member, setMember, cleared } = useGate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nickname: '', phone: '', whatsapp: '', email: '', location: '', occupation: '', birthday: '',
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cleared) { router.replace('/home'); return; }
    if (!member) { router.replace('/home'); return; }
    // Load full member data
    fetch(`${BACKEND}/members/${member._id}/profile`)
      .then(r => r.json())
      .then(data => {
        setForm({
          nickname: data.nickname || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          location: data.location || '',
          occupation: data.occupation || '',
          birthday: data.birthday?.slice(0, 10) || '',
        });
        setPhotoPreview(data.photo || '');
      })
      .catch(() => {});
  }, [member, cleared]);

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Photo must be under 3 MB.'); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      // Update profile fields
      const res = await fetch(`${BACKEND}/members/${member._id}/self-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update profile.');

      // Upload new photo if selected
      if (photo) {
        try {
          const fd = new FormData();
          fd.append('photo', photo);
          const pr = await fetch(`${BACKEND}/members/${member._id}/photo`, { method: 'POST', body: fd });
          if (pr.ok) {
            const updated = await pr.json();
            setPhotoPreview(updated.photo || photoPreview);
            setMember({ ...member, photo: updated.photo || member.photo });
          }
        } catch {}
      }

      // Update session member name display
      setMember({ ...member, nickname: form.nickname });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  const initials = member.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <Layout>
      <div className="container" style={{ maxWidth: 580, paddingTop: 20, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            My Profile
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: 4 }}>
            Update your personal details visible to other members.
          </p>
        </div>

        {/* Member name card */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {photoPreview ? (
              <img src={photoPreview} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-400)' }}>{initials}</span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{member.name}</div>
            {member.position && (
              <span className="badge badge-green" style={{ fontSize: '0.7rem', marginTop: 4 }}>{member.position}</span>
            )}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 4 }}>
              Verified member · Session active
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'clamp(20px,5vw,32px)' }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            {/* Photo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: photoPreview ? 'transparent' : 'rgba(34,197,94,0.06)',
                  border: `2px dashed ${photoPreview ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', padding: 0, transition: 'all 0.2s',
                }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: 'var(--green-400)' }}>
                      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-3)' }}>Add Photo</span>
                    </div>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-3)' }}>
                  {photoPreview ? <span style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>Change photo</span> : 'Optional · max 3 MB'}
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nickname in School</label>
                <input className="form-input" value={form.nickname} onChange={f('nickname')} placeholder="e.g. Ice, Boss" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={form.phone} onChange={f('phone')} placeholder="e.g. 08012345678" />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Number</label>
                <input className="form-input" value={form.whatsapp} onChange={f('whatsapp')} placeholder="e.g. 08012345678" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="yourname@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Current State / City</label>
                <input className="form-input" value={form.location} onChange={f('location')} placeholder="e.g. Lagos, Abuja" />
              </div>
              <div className="form-group">
                <label className="form-label">Occupation / Business</label>
                <input className="form-input" value={form.occupation} onChange={f('occupation')} placeholder="e.g. Engineer, Teacher" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Birthday</label>
                <input className="form-input" type="date" value={form.birthday} onChange={f('birthday')} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}
              style={{ width: '100%', padding: '13px', marginTop: 8 }}>
              {saving ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
              ) : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
