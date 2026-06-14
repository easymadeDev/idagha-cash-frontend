import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useGate } from '../pages/_app';

type Step = 'question' | 'verify' | 'found' | 'notfound';

export default function WelcomePopup() {
  const router = useRouter();
  const { cleared, setCleared } = useGate();
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);
  const [step, setStep] = useState<Step>('question');
  const [query, setQuery] = useState('');
  const [checking, setChecking] = useState(false);
  const [foundMember, setFoundMember] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only show on /home and only if not yet cleared
    if (router.pathname !== '/home' || cleared) return;
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, [router.pathname, cleared]);

  useEffect(() => {
    if (step === 'verify') setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  const dismiss = (destination?: string) => {
    // Mark as cleared in context — gates open for this page load
    setCleared(true);
    setAnimOut(true);
    setTimeout(() => {
      setVisible(false);
      setAnimOut(false);
      setStep('question');
      setQuery('');
      setFoundMember(null);
      setVerifyError('');
      if (destination) router.push(destination);
    }, 300);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setChecking(true);
    setVerifyError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/members/verify?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.found) {
        setFoundMember(data.member);
        setStep('found');
        // Auto-dismiss after a brief welcome flash — no button click needed
        setTimeout(() => dismiss(), 1800);
      } else {
        setStep('notfound');
      }
    } catch {
      setVerifyError('Could not reach the server. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  if (!visible) return null;

  const popAnim = animOut ? 'popDown 0.3s var(--ease) forwards' : 'popUp 0.35s var(--ease) forwards';
  const overlayAnim = animOut ? 'fadeOut 0.3s var(--ease) forwards' : 'fadeIn 0.3s var(--ease) forwards';

  return (
    <>
      <div className="wp-overlay" style={{ animation: overlayAnim }} />
      <div className="wp-popup" style={{ animation: popAnim }} onClick={(e) => e.stopPropagation()}>
        <div className="wp-glow" />

        {/* Logo */}
        <div className="wp-logo-wrap">
          <div className="wp-logo-ring" />
          <Image src="/logo.png" alt="IDAGHA Alumni" width={80} height={80}
            style={{ objectFit: 'contain', position: 'relative', zIndex: 1 }} priority />
        </div>

        <div className="wp-badge">
          <span className="badge-dot" style={{ background: 'var(--green-400)' }} />
          IDAGHA Class of 2018
        </div>

        {/* ── STEP 1: Question ── */}
        {step === 'question' && (
          <>
            <h2 className="wp-title">Welcome, Classmate!</h2>
            <p className="wp-sub">
              This is the official financial transparency portal for the{' '}
              <strong>IDAGHA Secondary School Class of 2018 Alumni</strong>. Are you a registered member?
            </p>
            <div className="wp-actions">
              <button className="wp-btn-yes" onClick={() => setStep('verify')}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Yes, I am a Member
              </button>
              <button className="wp-btn-no" onClick={() => dismiss('/register')}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                No — Register to Join
              </button>
            </div>
            <p className="wp-note">This portal is for IDAGHA Class of 2018 Alumni only.</p>
          </>
        )}

        {/* ── STEP 2: Verify ── */}
        {step === 'verify' && (
          <>
            <h2 className="wp-title">Verify Your Membership</h2>
            <p className="wp-sub">
              Enter your <strong>registered name</strong>, <strong>phone number</strong>, or <strong>email address</strong> to verify you are a member.
            </p>
            <form onSubmit={handleVerify} style={{ width: '100%' }}>
              <div className="wp-input-wrap">
                <svg className="wp-input-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  className="wp-input"
                  placeholder="e.g. Isaac Sunday, 08012345678, isaac@email.com"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setVerifyError(''); }}
                  disabled={checking}
                />
              </div>
              {verifyError && (
                <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 8, marginBottom: 0 }}>{verifyError}</p>
              )}
              <div className="wp-actions" style={{ marginTop: 16 }}>
                <button type="submit" className="wp-btn-yes" disabled={checking || !query.trim()}>
                  {checking ? (
                    <><div className="wp-spinner" /> Checking…</>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" />
                      </svg>
                      Verify Membership
                    </>
                  )}
                </button>
                <button type="button" className="wp-btn-back" onClick={() => { setStep('question'); setQuery(''); setVerifyError(''); }}>
                  ← Go Back
                </button>
              </div>
            </form>
            <p className="wp-note">Not yet registered? <span className="wp-link" onClick={() => dismiss('/register')}>Join here →</span></p>
          </>
        )}

        {/* ── STEP 3: Found ── */}
        {step === 'found' && foundMember && (
          <>
            <div className="wp-avatar">
              {foundMember.photo ? (
                <img src={foundMember.photo} alt={foundMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="wp-avatar-initials">
                  {foundMember.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                </span>
              )}
              <div className="wp-avatar-tick">
                <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h2 className="wp-title" style={{ marginTop: 8 }}>Welcome back!</h2>
            <p className="wp-sub" style={{ marginBottom: 6 }}>
              <strong style={{ color: 'var(--text-1)', fontSize: '1.05rem' }}>{foundMember.name}</strong>
              {foundMember.nickname && (
                <span style={{ color: 'var(--green-400)', display: 'block', fontSize: '0.85rem', marginTop: 2 }}>
                  "{foundMember.nickname}"
                </span>
              )}
              {foundMember.position && (
                <span style={{ display: 'block', marginTop: 6 }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>{foundMember.position}</span>
                </span>
              )}
            </p>
            <p className="wp-sub">You are a verified member of the IDAGHA Class of 2018 Alumni. Welcome to your portal!</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, color: 'var(--green-400)', fontSize: '0.82rem', fontWeight: 600 }}>
              <div className="wp-spinner" style={{ borderTopColor: 'var(--green-400)', borderColor: 'rgba(34,197,94,0.25)' }} />
              Opening portal…
            </div>
          </>
        )}

        {/* ── STEP 4: Not Found ── */}
        {step === 'notfound' && (
          <>
            <div className="wp-avatar" style={{ background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.3)' }}>
              <svg width="32" height="32" fill="none" stroke="var(--red)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="wp-title" style={{ marginTop: 8 }}>Not Found</h2>
            <p className="wp-sub">
              We could not find an active member matching <strong style={{ color: 'var(--text-2)' }}>"{query}"</strong>.
              <br /><br />
              This could mean you are not yet registered, or your details are slightly different in our records.
            </p>
            <div className="wp-actions">
              <button className="wp-btn-yes" onClick={() => dismiss('/register')}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Register to Join
              </button>
              <button className="wp-btn-back" onClick={() => { setStep('verify'); setVerifyError(''); }}>
                ← Try Again
              </button>
            </div>
            <p className="wp-note">Contact the Secretary if your name is already registered.</p>
          </>
        )}
      </div>

      <style>{`
        .wp-overlay {
          position: fixed; inset: 0;
          background: rgba(3,9,6,0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9000;
        }

        /* ── Desktop: centered card ── */
        .wp-popup {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9001;
          width: min(460px, calc(100vw - 32px));
          max-height: 90vh;
          overflow-y: auto;
          background: linear-gradient(160deg, #0d2010 0%, #060d08 100%);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 24px;
          padding: 36px 32px 28px;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(34,197,94,0.06), 0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(34,197,94,0.08);
        }

        /* ── Mobile: bottom sheet ── */
        @media (max-width: 600px) {
          .wp-popup {
            top: auto; left: 0; right: 0; bottom: 0;
            transform: none;
            width: 100%;
            max-height: 88vh;
            overflow-y: auto;
            border-radius: 20px 20px 0 0;
            padding: 20px 18px 32px;
          }
        }

        .wp-drag-handle {
          display: none;
          width: 36px; height: 4px; border-radius: 99px;
          background: rgba(255,255,255,0.15);
          margin: 0 auto 16px;
        }
        @media (max-width: 600px) {
          .wp-drag-handle { display: block; }
        }

        .wp-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 180px;
          background: radial-gradient(ellipse, rgba(34,197,94,0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .wp-logo-wrap {
          position: relative; width: 80px; height: 80px;
          margin: 0 auto 14px;
          display: flex; align-items: center; justify-content: center;
        }
        @media (min-width: 601px) {
          .wp-logo-wrap { width: 92px; height: 92px; margin-bottom: 18px; }
        }
        .wp-logo-ring {
          position: absolute; inset: -7px; border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0%, rgba(34,197,94,0.5) 25%, rgba(74,222,128,0.85) 50%, rgba(34,197,94,0.5) 75%, transparent 100%);
          animation: wp-spin 3s linear infinite;
        }
        .wp-logo-ring::after {
          content: ''; position: absolute; inset: 3px;
          border-radius: 50%; background: #0d2010;
        }
        .wp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25);
          border-radius: 99px; font-size: 0.68rem; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase; color: var(--green-400);
          margin-bottom: 12px;
        }
        .wp-title {
          font-family: var(--font-d);
          font-size: clamp(1.15rem, 5vw, 1.65rem);
          font-weight: 800; letter-spacing: -0.03em;
          color: var(--text-1); margin-bottom: 8px; position: relative;
        }
        .wp-sub {
          font-size: 0.84rem; color: var(--text-3);
          line-height: 1.7; margin-bottom: 18px; position: relative;
        }
        .wp-sub strong { color: var(--text-2); }
        .wp-actions {
          display: flex; gap: 10px; flex-direction: column; margin-bottom: 12px;
        }
        .wp-btn-yes {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 20px; min-height: 48px;
          background: var(--grad-green); border: none; border-radius: var(--radius-sm);
          color: #fff; font-weight: 700; font-size: 0.92rem;
          cursor: pointer; font-family: var(--font);
          box-shadow: 0 0 24px rgba(34,197,94,0.28);
          transition: all 0.2s var(--ease);
        }
        .wp-btn-yes:disabled { opacity: 0.6; cursor: not-allowed; }
        .wp-btn-yes:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 0 36px rgba(34,197,94,0.42); }
        .wp-btn-no {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 20px; min-height: 48px;
          background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.25);
          border-radius: var(--radius-sm); color: var(--green-400);
          font-weight: 600; font-size: 0.92rem; cursor: pointer; font-family: var(--font);
          transition: all 0.2s var(--ease);
        }
        .wp-btn-no:hover { background: rgba(34,197,94,0.13); border-color: rgba(34,197,94,0.45); }
        .wp-btn-back {
          background: none; border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text-3);
          font-size: 0.85rem; padding: 10px 16px; min-height: 44px;
          cursor: pointer; font-family: var(--font);
          transition: all 0.2s var(--ease);
        }
        .wp-btn-back:hover { color: var(--text-1); border-color: var(--border-mid); }
        .wp-input-wrap { position: relative; width: 100%; text-align: left; }
        .wp-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--text-3); pointer-events: none;
        }
        .wp-input {
          width: 100%; padding: 13px 14px 13px 40px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border-mid);
          border-radius: var(--radius-sm); color: var(--text-1);
          font-family: var(--font); font-size: 16px;
          outline: none; transition: all 0.2s var(--ease);
        }
        .wp-input::placeholder { color: var(--text-3); }
        .wp-input:focus { border-color: var(--green-500); background: rgba(34,197,94,0.05); box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
        .wp-input:disabled { opacity: 0.6; }
        .wp-note { font-size: 0.75rem; color: var(--text-3); margin: 0; }
        .wp-link { color: var(--green-400); cursor: pointer; }
        .wp-link:hover { text-decoration: underline; }
        .wp-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: wp-spin 0.7s linear infinite;
        }
        .wp-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          margin: 0 auto 4px;
          background: rgba(34,197,94,0.1); border: 2px solid rgba(34,197,94,0.35);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; position: relative;
        }
        .wp-avatar-initials {
          font-size: 1.4rem; font-weight: 800; color: var(--green-400); letter-spacing: -0.02em;
        }
        .wp-avatar-tick {
          position: absolute; bottom: 2px; right: 2px;
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--green-600); border: 2px solid #0d2010;
          display: flex; align-items: center; justify-content: center;
        }
        @keyframes wp-spin { to { transform: rotate(360deg); } }
        @keyframes popUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes popDown {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to   { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) scale(0.96); }
        }
        @media (max-width: 600px) {
          @keyframes popUp {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes popDown {
            from { opacity: 1; transform: translateY(0); }
            to   { opacity: 0; transform: translateY(100%); }
          }
        }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
