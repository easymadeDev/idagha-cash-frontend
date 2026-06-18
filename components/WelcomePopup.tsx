import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useGate } from '../lib/gate';


type Step = 'pin' | 'question' | 'verify' | 'found' | 'notfound';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function WelcomePopup() {
  const router = useRouter();
  const { cleared, setCleared, setMember, ready } = useGate();
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinShake, setPinShake] = useState(false);
  const [pinChecking, setPinChecking] = useState(false);
  const [query, setQuery] = useState('');
  const [checking, setChecking] = useState(false);
  const [foundMember, setFoundMember] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return; // wait until sessionStorage is read — prevents flash on already-verified users
    if (cleared) return;
    const exempt = router.pathname === '/test' || router.pathname.startsWith('/admin');
    if (exempt) return;
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, [router.pathname, cleared, ready]);

  useEffect(() => {
    if (step === 'verify') setTimeout(() => inputRef.current?.focus(), 100);
    if (step === 'pin') setTimeout(() => pinRef.current?.focus(), 100);
  }, [step]);

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setPinChecking(true);
    setPinError('');
    try {
      const res = await fetch(`${BACKEND}/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') sessionStorage.setItem('idagha_gate_token', data.gate_token);
        setStep('question');
      } else {
        setPinError('Incorrect PIN. Please check with the group admin.');
        setPinShake(true);
        setTimeout(() => setPinShake(false), 600);
        setPin('');
      }
    } catch {
      setPinError('Could not reach the server. Please try again.');
    } finally {
      setPinChecking(false);
    }
  };

  const dismiss = (destination?: string) => {
    setAnimOut(true);
    setTimeout(() => {
      setVisible(false);
      setAnimOut(false);
      setStep('pin');
      setPin('');
      setPinError('');
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
      const res = await fetch(`${BACKEND}/auth/verify-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (data.found) {
        if (typeof window !== 'undefined') sessionStorage.setItem('idagha_member_token', data.member_token);
        setFoundMember(data.member);
        setMember({
          _id: data.member._id,
          name: data.member.name,
          nickname: data.member.nickname,
          photo: data.member.photo,
          position: data.member.position,
        });
        setStep('found');
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

  const popupClass = `wp-popup${animOut ? ' wp-popup-out' : ' wp-popup-in'}`;

  return (
    <>
      <div className={`wp-overlay${animOut ? ' wp-overlay-out' : ' wp-overlay-in'}`} />
      <div className={popupClass} onClick={(e) => e.stopPropagation()}>
        <div className="wp-drag-handle" />
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

        {/* ── STEP 0: PIN ── */}
        {step === 'pin' && (
          <>
            <h2 className="wp-title">Enter Group PIN</h2>
            <p className="wp-sub">
              This portal is <strong>private</strong> to the IDAGHA Class of 2018 Alumni.
              Enter the secret group PIN shared in your WhatsApp group to continue.
            </p>
            <form onSubmit={handlePin} style={{ width: '100%' }}>
              <div className={`wp-input-wrap${pinShake ? ' wp-shake' : ''}`}>
                <svg className="wp-input-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" />
                </svg>
                <input
                  ref={pinRef}
                  className="wp-input"
                  placeholder="Enter group PIN…"
                  value={pin}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => {
                    const numOnly = e.target.value.replace(/\D/g, '');
                    setPin(numOnly);
                    setPinError('');
                  }}
                  autoComplete="off"
                  maxLength={20}
                />
              </div>
              {pinError && (
                <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 8, marginBottom: 0 }}>{pinError}</p>
              )}
              <div className="wp-actions" style={{ marginTop: 16 }}>
                <button type="submit" className="wp-btn-yes" disabled={!pin.trim() || pinChecking}>
                  {pinChecking ? (
                    <><div className="wp-spinner" /> Checking…</>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" strokeLinecap="round" />
                      </svg>
                      Unlock Portal
                    </>
                  )}
                </button>
              </div>
            </form>
            <p className="wp-note">Contact your class group admin to get the PIN.</p>
          </>
        )}

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
                  placeholder="e.g. Chukwuemeka Obi, 08034567890, emeka@email.com"
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
        .wp-overlay-in  { animation: fadeIn  0.3s ease forwards; }
        .wp-overlay-out { animation: fadeOut 0.3s ease forwards; }

        @keyframes wp-shake {
          0%, 100% { margin-left: 0; }
          15%       { margin-left: -8px; }
          30%       { margin-left: 8px; }
          45%       { margin-left: -6px; }
          60%       { margin-left: 6px; }
          75%       { margin-left: -4px; }
          90%       { margin-left: 4px; }
        }
        .wp-shake { animation: wp-shake 0.6s cubic-bezier(0.36,0.07,0.19,0.97) both; }

        /* ── Shared base ── */
        .wp-popup {
          box-sizing: border-box;
          position: fixed;
          z-index: 9001;
          background: linear-gradient(160deg, #0d2010 0%, #060d08 100%);
          border: 1px solid rgba(34,197,94,0.25);
          text-align: center;
          box-shadow: 0 0 0 1px rgba(34,197,94,0.06), 0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(34,197,94,0.08);
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        /* ── Desktop: centered card ── */
        @media (min-width: 601px) {
          .wp-popup {
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: min(460px, calc(100vw - 40px));
            max-height: min(90vh, 700px);
            border-radius: 24px;
            padding: 36px 32px 28px;
          }
          .wp-popup-in  { animation: popUp   0.35s ease forwards; }
          .wp-popup-out { animation: popDown  0.3s  ease forwards; }
        }

        /* ── Mobile: centered card ── */
        @media (max-width: 600px) {
          .wp-popup {
            position: fixed;
            top: 50%; left: 50%; right: auto; bottom: auto;
            transform: translate(-50%, -50%);
            width: calc(100vw - 28px);
            max-width: calc(100vw - 28px);
            max-height: min(85vh, 580px);
            border-radius: 20px;
            padding: 18px 16px 22px;
            margin: 0;
          }
          .wp-popup-in  { animation: popUp   0.35s ease forwards; }
          .wp-popup-out { animation: popDown  0.3s  ease forwards; }
          .wp-title { font-size: clamp(1rem, 5vw, 1.35rem); }
          .wp-sub { font-size: clamp(0.72rem, 3vw, 0.82rem); line-height: 1.55; margin-bottom: 12px; }
          .wp-logo-wrap { width: 62px; height: 62px; margin-bottom: 8px; }
          .wp-btn-yes, .wp-btn-no { min-height: 46px; font-size: 0.88rem; }
        }
        @media (max-width: 480px) {
          .wp-popup { padding: 14px 14px 18px; }
          .wp-logo-wrap { width: 54px; height: 54px; margin-bottom: 6px; }
          .wp-title { font-size: clamp(0.95rem, 5vw, 1.2rem); }
          .wp-sub { font-size: 0.74rem; margin-bottom: 10px; }
          .wp-btn-yes, .wp-btn-no { min-height: 44px; padding: 10px 14px; font-size: 0.82rem; }
          .wp-input { padding: 11px 12px 11px 36px; font-size: 15px; }
          .wp-badge { font-size: 0.62rem; padding: 3px 10px; }
        }
        @media (max-width: 375px) {
          .wp-popup { padding: 10px 12px 14px; max-height: min(88vh, 520px); border-radius: 16px; }
          .wp-logo-wrap { width: 46px; height: 46px; margin-bottom: 4px; }
          .wp-title { font-size: 0.98rem; margin-bottom: 5px; }
          .wp-sub { font-size: 0.68rem; margin-bottom: 8px; line-height: 1.5; }
          .wp-btn-yes, .wp-btn-no { min-height: 40px; padding: 8px 12px; font-size: 0.78rem; gap: 6px; }
          .wp-input { padding: 9px 10px 9px 32px; font-size: 14px; }
          .wp-badge { font-size: 0.58rem; padding: 2px 8px; margin-bottom: 6px; }
          .wp-drag-handle { margin: 4px auto 10px; }
          .wp-note { font-size: 0.66rem; }
          .wp-actions { gap: 7px; }
        }

        .wp-drag-handle {
          width: 36px; height: 4px; border-radius: 99px;
          background: rgba(255,255,255,0.18);
          margin: 10px auto 18px;
        }

        .wp-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 180px;
          background: radial-gradient(ellipse, rgba(34,197,94,0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .wp-logo-wrap {
          position: relative; width: 72px; height: 72px;
          margin: 0 auto 12px;
          display: flex; align-items: center; justify-content: center;
        }
        @media (min-width: 601px) {
          .wp-logo-wrap { width: 92px; height: 92px; margin-bottom: 18px; }
        }
        .wp-logo-ring {
          position: absolute; inset: -7px; border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #4ade80;
          border-right-color: rgba(34,197,94,0.4);
          animation: wp-spin 1.8s linear infinite;
        }
        .wp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25);
          border-radius: 99px; font-size: 0.68rem; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase; color: var(--green-400);
          margin-bottom: 10px;
        }
        .wp-title {
          font-family: var(--font-d);
          font-size: clamp(1.1rem, 5vw, 1.6rem);
          font-weight: 800; letter-spacing: -0.03em;
          color: var(--text-1); margin-bottom: 8px;
          white-space: normal; word-wrap: break-word;
          width: 100%; max-width: 100%;
        }
        .wp-sub {
          font-size: 0.84rem; color: var(--text-3);
          line-height: 1.7; margin-bottom: 16px;
          white-space: normal; word-wrap: break-word;
          width: 100%; max-width: 100%;
        }
        .wp-sub strong { color: var(--text-2); }
        .wp-actions { display: flex; gap: 10px; flex-direction: column; margin-bottom: 12px; }
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
          transition: all 0.2s var(--ease); width: 100%;
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
        .wp-avatar-initials { font-size: 1.4rem; font-weight: 800; color: var(--green-400); }
        .wp-avatar-tick {
          position: absolute; bottom: 2px; right: 2px;
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--green-600); border: 2px solid #0d2010;
          display: flex; align-items: center; justify-content: center;
        }

        @keyframes wp-spin  { to { transform: rotate(360deg); } }
        @keyframes popUp    { from { opacity:0; transform:translate(-50%,calc(-50% + 20px)) scale(0.96); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes popDown  { from { opacity:1; transform:translate(-50%,-50%) scale(1); } to { opacity:0; transform:translate(-50%,calc(-50% + 16px)) scale(0.96); } }
        @keyframes slideUp  { from { opacity:1; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown{ from { opacity:1; transform:translateY(0); } to { opacity:1; transform:translateY(100%); } }
        @keyframes fadeOut  { from { opacity:1; } to { opacity:0; } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </>
  );
}
