import Layout from '../components/Layout';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useToast } from '../components/Toast';
import { useGate } from '../lib/gate';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const EMPTY = {
  name: '', nickname: '', phone: '', whatsapp: '',
  gender: '', email: '', location: '', occupation: '', birthday: '',
};

export default function RegisterPage() {
  const { toast } = useToast();
  const { setCleared, setMember } = useGate();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file.', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast(`Photo is ${sizeMB}MB. Maximum size is 3MB. Please compress or select a smaller photo.`, 'error');
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert photo to base64 and include it in the registration payload
      let photoBase64: string | undefined;
      if (photo) {
        try {
          photoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photo);
          });
        } catch {
          // Photo encoding failed — proceed without it
        }
      }

      let res: Response;
      try {
        res = await fetch(`${BACKEND}/members/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, ...(photoBase64 ? { photo: photoBase64 } : {}) }),
        });
      } catch (netErr: any) {
        throw new Error('Network error — could not reach the server. Please check your connection.');
      }

      if (!res.ok) {
        let msg = 'Registration failed.';
        try {
          const data = await res.json();
          msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      let member: any = {};
      try { member = await res.json(); } catch {}

      // Mark as registered so they can access the portal (pending approval)
      if (typeof window !== 'undefined') sessionStorage.setItem('idagha_registered', '1');
      setCleared(true);
      if (member._id) {
        setMember({
          _id: member._id,
          name: member.name,
          nickname: member.nickname || '',
          photo: member.photo || '',
          position: member.position || '',
        });
      }
      setDone(true);
    } catch (err: any) {
      toast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const WA_SANDBOX = 'https://wa.me/14155238886?text=join%20write-personal';

  if (done) {
    return (
      <Layout>
        <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 500, padding: '40px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="32" height="32" fill="none" stroke="var(--green-400)" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Registration Submitted!
            </h2>
            <p style={{ color: 'var(--text-3)', lineHeight: 1.8, marginBottom: 24, fontSize: '0.95rem' }}>
              Thank you, <strong style={{ color: 'var(--text-1)' }}>{form.name}</strong>! Your registration is pending approval by the Secretary.
            </p>

            {/* WhatsApp opt-in card */}
            <div style={{
              background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.25)',
              borderRadius: 16, padding: '20px 24px', marginBottom: 24, textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)' }}>Get WhatsApp Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Receive updates directly on WhatsApp</div>
                </div>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-3)', lineHeight: 1.7, margin: '0 0 14px' }}>
                Tap the button below to join our WhatsApp notification channel. You'll receive important updates, reminders, and announcements instantly.
              </p>
              <a
                href={WA_SANDBOX}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px 20px', borderRadius: 10,
                  background: '#25d366', color: '#fff',
                  fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Join WhatsApp Notifications
              </a>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => router.push('/members')}>View Members Directory</button>
              <button className="btn btn-ghost" onClick={() => router.push('/home')}>Go to Home</button>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
