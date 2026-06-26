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

const WA_SANDBOX = 'https://wa.me/14155238886?text=join%20write-personal';

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
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    if (file.size > 3 * 1024 * 1024) {
      toast(`Photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum is 3MB.`, 'error'); return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoBase64: string | undefined;
      if (photo) {
        try {
          photoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photo);
          });
        } catch { /* proceed without photo */ }
      }

      let res: Response;
      try {
        res = await fetch(`${BACKEND}/members/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, ...(photoBase64 ? { photo: photoBase64 } : {}) }),
        });
      } catch {
        throw new Error('Network error — could not reach the server. Check your connection.');
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

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('idagha_registered', '1');
        // Store the member_token so they can update their profile immediately without re-login
        if (member.member_token) {
          sessionStorage.setItem('idagha_member_token', member.member_token);
        }
      }
      setCleared(true);
      if (member._id) {
        setMember({ _id: member._id, name: member.name, nickname: member.nickname || '', photo: member.photo || '', position: member.position || '' });
      }
      setDone(true);
    } catch (err: any) {
      toast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Success screen ── */
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

            <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)' }}>Get WhatsApp Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Receive updates directly on WhatsApp</div>
                </div>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-3)', lineHeight: 1.7, margin: '0 0 12px' }}>To receive WhatsApp notifications from IDAGHA Alumni:</p>
              {[
                { n: '1', text: 'Tap the green button below — WhatsApp opens automatically.' },
                { n: '2', text: <><strong style={{ color: '#25d366' }}>"join write-personal"</strong> will already be typed.</> },
                { n: '3', text: 'Just tap Send — that\'s all!' },
                { n: '4', text: 'You\'ll get a confirmation and start receiving notifications.' },
              ].map(({ n, text }) => (
                <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#25d366', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
              <div style={{ margin: '14px 0', padding: '10px 14px', background: 'rgba(37,211,102,0.08)', borderRadius: 8, fontSize: '0.78rem', color: '#4ade80', fontWeight: 600, textAlign: 'center' }}>⚡ One send = subscribed forever</div>
              <a href={WA_SANDBOX} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 20px', borderRadius: 10, background: '#25d366', color: '#fff', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 4px 14px rgba(37,211,102,0.35)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Open WhatsApp &amp; Join Now
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

  /* ── Registration form ── */
  return (
    <Layout>
      <div className="container" style={{ maxWidth: 620, paddingTop: 16, paddingBottom: 60 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Image src="/logo.png" alt="IDAGHA Alumni" width={64} height={64} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(34,197,94,0.4))' }} />
          </div>
          <span className="badge badge-green" style={{ marginBottom: 10, display: 'inline-flex' }}><span className="badge-dot" />Membership Registration</span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 8 }}>Join IDAGHA Class of 2018</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto' }}>
            Fill in your details below. Your profile will appear on the members directory after the Secretary approves.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Step 1: Profile Photo ── */}
          <div className="reg-section">
            <div className="reg-step-label">
              <span className="reg-step-num">1</span>
              <span>Profile Photo</span>
              <span className="reg-step-optional">recommended</span>
            </div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />

            {photoPreview ? (
              /* Photo selected — show preview with change/remove options */
              <div className="reg-photo-preview-wrap">
                <div className="reg-photo-preview-inner">
                  <img src={photoPreview} alt="Your photo" className="reg-photo-img" />
                  <div className="reg-photo-preview-info">
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--green-400)' }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: 4 }}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Photo added!
                    </div>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', margin: '4px 0 14px', lineHeight: 1.5 }}>
                      This photo will appear on your member profile card in the alumni directory.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/></svg>
                        Change
                      </button>
                      <button type="button" className="btn btn-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }} onClick={() => { setPhoto(null); setPhotoPreview(''); }}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* No photo — show upload prompt */
              <button type="button" className="reg-photo-upload-btn" onClick={() => fileRef.current?.click()}>
                <div className="reg-photo-upload-avatar">
                  <svg width="32" height="32" fill="none" stroke="var(--green-400)" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="reg-camera-badge">
                    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div className="reg-photo-upload-text">
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)', marginBottom: 4 }}>Tap to add your photo</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                    Your photo helps classmates recognise you on the members directory.<br />
                    <span style={{ color: 'var(--text-4)', fontSize: '0.75rem' }}>JPG, PNG · max 3 MB</span>
                  </div>
                </div>
                <div className="reg-photo-upload-arrow">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </button>
            )}
          </div>

          {/* ── Step 2: Personal Info ── */}
          <div className="reg-section">
            <div className="reg-step-label">
              <span className="reg-step-num">2</span>
              <span>Personal Information</span>
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
            </div>
          </div>

          {/* ── Step 3: Contact ── */}
          <div className="reg-section">
            <div className="reg-step-label">
              <span className="reg-step-num">3</span>
              <span>Contact Details</span>
            </div>

            <div className="form-grid-2">
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
            </div>
          </div>

          {/* ── Step 4: Background ── */}
          <div className="reg-section">
            <div className="reg-step-label">
              <span className="reg-step-num">4</span>
              <span>Background</span>
              <span className="reg-step-optional">optional</span>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Current State / City *</label>
                <input className="form-input" value={form.location} onChange={f('location')} required placeholder="e.g. Lagos, Abuja" />
              </div>
              <div className="form-group">
                <label className="form-label">Occupation / Business</label>
                <input className="form-input" value={form.occupation} onChange={f('occupation')} placeholder="e.g. Teacher, Engineer" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Birthday</label>
                <input className="form-input" type="date" value={form.birthday} onChange={f('birthday')} />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 4, display: 'block' }}>Used for birthday celebrations within the group</span>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div style={{ display: 'flex', gap: 10, padding: '13px 16px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            <svg width="16" height="16" fill="none" stroke="var(--green-400)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Your registration will be reviewed by the Secretary before appearing on the public directory. Your phone and WhatsApp numbers will <strong style={{ color: 'var(--text-2)' }}>not</strong> be shown publicly.</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}>
            {saving ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Submitting…</>
            ) : 'Submit Registration'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--text-3)' }}>
          Already registered?{' '}
          <span style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => router.push('/members')}>
            View the Members Directory →
          </span>
        </p>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }

          .reg-section {
            background: var(--grad-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 20px 20px 6px;
            margin-bottom: 14px;
          }
          .reg-step-label {
            display: flex; align-items: center; gap: 8px;
            margin-bottom: 18px;
            font-weight: 700; font-size: 0.88rem; color: var(--text-1);
          }
          .reg-step-num {
            width: 22px; height: 22px; border-radius: 50%;
            background: var(--green-500); color: #fff;
            font-size: 0.72rem; font-weight: 800;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .reg-step-optional {
            font-size: 0.68rem; font-weight: 600;
            color: var(--text-3); background: var(--border);
            padding: 2px 7px; border-radius: 99px;
            text-transform: uppercase; letter-spacing: 0.05em;
          }

          /* Photo upload button (no photo selected) */
          .reg-photo-upload-btn {
            display: flex; align-items: center; gap: 16px;
            width: 100%; padding: 16px 18px;
            background: rgba(34,197,94,0.04);
            border: 2px dashed rgba(34,197,94,0.3);
            border-radius: var(--radius-sm);
            cursor: pointer; text-align: left;
            transition: border-color 0.2s, background 0.2s;
            margin-bottom: 14px;
          }
          .reg-photo-upload-btn:hover {
            border-color: rgba(34,197,94,0.6);
            background: rgba(34,197,94,0.07);
          }
          .reg-photo-upload-avatar {
            width: 60px; height: 60px; border-radius: 50%;
            background: rgba(34,197,94,0.1);
            border: 2px solid rgba(34,197,94,0.3);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; position: relative;
          }
          .reg-camera-badge {
            position: absolute; bottom: -2px; right: -2px;
            width: 22px; height: 22px; border-radius: 50%;
            background: var(--green-500);
            display: flex; align-items: center; justify-content: center;
            border: 2px solid var(--bg-card);
          }
          .reg-photo-upload-text { flex: 1; min-width: 0; }
          .reg-photo-upload-arrow { color: var(--text-3); flex-shrink: 0; }

          /* Photo preview (photo selected) */
          .reg-photo-preview-wrap {
            margin-bottom: 14px;
            background: rgba(34,197,94,0.04);
            border: 1px solid rgba(34,197,94,0.25);
            border-radius: var(--radius-sm);
            padding: 16px;
          }
          .reg-photo-preview-inner {
            display: flex; align-items: flex-start; gap: 16px;
          }
          .reg-photo-img {
            width: 72px; height: 72px; border-radius: 14px;
            object-fit: cover; flex-shrink: 0;
            border: 2px solid rgba(34,197,94,0.4);
          }
          .reg-photo-preview-info { flex: 1; min-width: 0; }

          @media (max-width: 480px) {
            .reg-section { padding: 16px 14px 4px; }
            .reg-photo-upload-btn { padding: 14px; gap: 12px; }
            .reg-photo-upload-avatar { width: 52px; height: 52px; }
            .reg-photo-preview-inner { gap: 12px; }
            .reg-photo-img { width: 60px; height: 60px; border-radius: 11px; }
          }
        `}</style>
      </div>
    </Layout>
  );
}
