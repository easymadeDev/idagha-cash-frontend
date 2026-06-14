import Layout from '../components/Layout';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const EMPTY = {
  name: '', nickname: '', phone: '', whatsapp: '',
  gender: '', email: '', location: '', occupation: '', birthday: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Photo must be under 3 MB.'); return; }
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      // Step 1: create member record
      const res = await fetch(`${BACKEND}/members/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        const msg = data?.message;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'Registration failed.');
      }
      const member = await res.json();

      // Step 2: upload photo if provided
      if (photo && member._id) {
        const fd = new FormData();
        fd.append('photo', photo);
        await fetch(`${BACKEND}/members/${member._id}/photo`, { method: 'POST', body: fd });
      }

      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Layout>
        <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'scaleIn 0.4s var(--ease)' }}>
              <svg width="32" height="32" fill="none" stroke="var(--green-400)" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Registration Submitted!
            </h2>
            <p style={{ color: 'var(--text-3)', lineHeight: 1.8, marginBottom: 28, fontSize: '0.95rem' }}>
              Thank you, <strong style={{ color: 'var(--text-1)' }}>{form.name}</strong>! Your registration has been received and is pending approval by the Secretary. You will be added to the public members directory once approved.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => router.push('/members')}>View Members Directory</button>
              <button className="btn btn-ghost" onClick={() => router.push('/home')}>Go to Home</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container" style={{ maxWidth: 640, paddingTop: 20, paddingBottom: 60 }}>

        {/* Header */}
        <div className="page-header" style={{ textAlign: 'center', paddingBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Image src="/logo.png" alt="IDAGHA Alumni" width={80} height={80} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 16px rgba(34,197,94,0.4))' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <span className="badge badge-green"><span className="badge-dot" />Membership Registration</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>Join the IDAGHA<br />Class of 2018 Alumni</h1>
          <p style={{ marginTop: 10 }}>
            Fill in your details to register. Your profile card will appear on the public members directory after the Secretary approves.
          </p>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: 'clamp(20px,5vw,36px) clamp(16px,5vw,32px)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Photo upload */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 110, height: 110, borderRadius: '50%',
                    background: photoPreview ? 'transparent' : 'rgba(34,197,94,0.06)',
                    border: `2px dashed ${photoPreview ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    transition: 'all 0.2s var(--ease)',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.7)'); }}
                  onMouseLeave={(e) => { (e.currentTarget.style.borderColor = photoPreview ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)'); }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--green-400)' }}>
                      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)' }}>Add Photo</span>
                    </div>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                <div style={{ marginTop: 8, fontSize: '0.73rem', color: 'var(--text-3)' }}>
                  {photoPreview ? (
                    <span style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>Change photo</span>
                  ) : 'Optional · max 3 MB'}
                </div>
              </div>
            </div>

            <div className="form-grid-2">

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={f('name')} required placeholder="e.g. Chukwuemeka Obi" />
              </div>

              <div className="form-group">
                <label className="form-label">Nickname in School</label>
                <input className="form-input" value={form.nickname} onChange={f('nickname')} placeholder="e.g. Ice, Favour, Boss" />
              </div>

              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="form-select" value={form.gender} onChange={f('gender')} required>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="form-input" value={form.phone} onChange={f('phone')} required placeholder="e.g. 08012345678" />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Number *</label>
                <input className="form-input" value={form.whatsapp} onChange={f('whatsapp')} required placeholder="e.g. 08012345678" />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="e.g. yourname@email.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Current State / City *</label>
                <input className="form-input" value={form.location} onChange={f('location')} required placeholder="e.g. Lagos, Abuja, Edo" />
              </div>

              <div className="form-group">
                <label className="form-label">Occupation / Business</label>
                <input className="form-input" value={form.occupation} onChange={f('occupation')} placeholder="e.g. Teacher, Engineer" />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Birthday</label>
                <input className="form-input" type="date" value={form.birthday} onChange={f('birthday')} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>Used for birthday celebrations within the group</span>
              </div>

            </div>

            {/* Notice */}
            <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.7 }}>
              Your registration will be reviewed by the Secretary before appearing on the public directory. Your phone number and WhatsApp will <strong style={{ color: 'var(--text-2)' }}>not</strong> be shown publicly.
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}>
              {saving ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Submitting…</>
              ) : 'Submit Registration'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--text-3)' }}>
          Already registered?{' '}
          <span style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => router.push('/members')}>
            View the Members Directory →
          </span>
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
}
