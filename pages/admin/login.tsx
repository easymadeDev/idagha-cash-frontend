import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import api from '../../lib/api';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('idagha_token')) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('idagha_token', data.access_token);
      localStorage.setItem('idagha_user', data.username);
      router.push('/admin/dashboard');
    } catch {
      setError('Invalid username or password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(34,197,94,0.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ margin: '0 auto 20px', display: 'inline-block', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.25), transparent 70%)',
              animation: 'heroBreathe 4s ease-in-out infinite',
            }} />
            <Image
              src="/logo.png"
              alt="IDAGHA Alumni Logo"
              width={90}
              height={90}
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 24px rgba(34,197,94,0.5))', position: 'relative' }}
              priority
            />
          </div>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Admin Portal
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
              <span className="badge-dot" />Class of 2018
            </span>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>
            IDAGHA Alumni — Secretary Access Only
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card2)', border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius)', padding: '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <form onSubmit={handleLogin}>
            {error && (
              <div className="alert alert-error">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 46 }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }}
                  aria-label={showPw ? 'Hide' : 'Show'}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {showPw
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', marginTop: 8, fontSize: '0.95rem' }}>
              {loading
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
                : 'Sign In to Admin Portal'
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-3)' }}>
          <span style={{ cursor: 'pointer', color: 'var(--green-400)', transition: 'opacity 0.2s' }} onClick={() => router.push('/home')}>
            ← Back to Public Portal
          </span>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
