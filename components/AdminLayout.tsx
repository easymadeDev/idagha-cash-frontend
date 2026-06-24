import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import api from '../lib/api';
import useSWR from 'swr';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', section: 'Overview' },
  { label: 'Contributions', href: '/admin/contributions', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', section: 'Records' },
  { label: 'Expenses', href: '/admin/expenses', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', section: 'Records' },
  { label: 'Members', href: '/admin/members', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', section: 'Records' },
  { label: 'Wallets', href: '/admin/wallets', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', section: 'Records' },
  { label: 'Reunion Fund', href: '/admin/reunion-fund', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', section: 'Fund' },
  { label: 'Reunion Support', href: '/admin/pledges', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', section: 'Fund' },
  { label: 'Announcements', href: '/admin/announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', section: 'Communications' },
  { label: 'Settings', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', section: 'System' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [username, setUsername] = useState('Secretary');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Live pending registrations count — polls every 30s
  const { data: allMembers } = useSWR(
    authChecked ? '/api/members/admin/all' : null,
    (url: string) => {
      const tok = typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : '';
      return fetch(url, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json());
    },
    { refreshInterval: 30000 }
  );
  const pendingCount = Array.isArray(allMembers) ? allMembers.filter((m: any) => m.status === 'pending').length : 0;

  useEffect(() => {
    const token = localStorage.getItem('idagha_token');
    if (!token) { router.replace('/admin/login'); return; }

    const u = localStorage.getItem('idagha_user');
    if (u) setUsername(u);

    // Verify token is still valid against the backend
    api.get('/auth/verify')
      .then(() => setAuthChecked(true))
      .catch(() => {
        // Token invalid — clear and re-login
        localStorage.removeItem('idagha_token');
        localStorage.removeItem('idagha_user');
        router.replace('/admin/login');
      });
  }, [router]);

  const logout = () => {
    localStorage.removeItem('idagha_token');
    localStorage.removeItem('idagha_user');
    router.push('/admin/login');
  };

  const sections = Array.from(new Set(navItems.map((n) => n.section)));

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--green-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Verifying session…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand">
            <Image
              src="/logo.png"
              alt="IDAGHA Alumni"
              width={40}
              height={40}
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.4))' }}
            />
            <div>
              <div className="admin-sidebar-name">IDAGHA Admin</div>
            </div>
          </div>
          <div className="admin-sidebar-role">Class of 2018 — Secretary Portal</div>
        </div>

        <nav className="admin-nav">
          {sections.map((section) => (
            <div key={section}>
              <div className="admin-nav-section">{section}</div>
              {navItems.filter((n) => n.section === section).map((item) => (
                <button
                  key={item.href}
                  className={`admin-nav-item ${router.pathname === item.href ? 'active' : ''}`}
                  onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                  style={{ position: 'relative' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item.label}
                  {/* Pending badge on Members */}
                  {item.label === 'Members' && pendingCount > 0 && (
                    <span style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'var(--red)', color: '#fff',
                      fontSize: '0.6rem', fontWeight: 800,
                      minWidth: 18, height: 18, borderRadius: 99,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px', letterSpacing: 0,
                      boxShadow: '0 0 10px rgba(248,113,113,0.6)',
                      animation: 'badgePulse 1.5s ease-in-out infinite',
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-pill">
            <div className="admin-user-avatar">{username.charAt(0).toUpperCase()}</div>
            <div>
              <div className="admin-user-name">{username}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <button className="admin-nav-item" onClick={() => router.push('/home')}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View Public Portal
          </button>
          <button className="admin-nav-item" onClick={logout} style={{ color: 'var(--red)' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-menu-btn"
            style={{ background: 'none', border: 'none', color: 'var(--text-1)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
            </svg>
          </button>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
            Signed in as <strong style={{ color: 'var(--text-1)' }}>{username}</strong>
          </div>
        </div>
        {/* Pending registration alert banner */}
        {pendingCount > 0 && (
          <div
            onClick={() => router.push('/admin/members')}
            style={{
              marginBottom: 24, padding: '14px 20px',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.35)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, cursor: 'pointer', flexWrap: 'wrap',
              animation: 'fadeUp 0.4s var(--ease) both',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                background: 'var(--red)', color: '#fff',
                fontSize: '0.7rem', fontWeight: 800,
                minWidth: 24, height: 24, borderRadius: 99,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 7px', flexShrink: 0,
                boxShadow: '0 0 14px rgba(248,113,113,0.5)',
                animation: 'badgePulse 1.5s ease-in-out infinite',
              }}>
                {pendingCount}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-1)' }}>
                  {pendingCount} Pending Member Approval{pendingCount > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                  New self-registration{pendingCount > 1 ? 's are' : ' is'} awaiting your review
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Review Now →
            </span>
          </div>
        )}
        {children}
      </main>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 10px rgba(248,113,113,0.5); transform: translateY(-50%) scale(1); }
          50%       { box-shadow: 0 0 18px rgba(248,113,113,0.9); transform: translateY(-50%) scale(1.12); }
        }
      `}</style>
    </div>
  );
}
