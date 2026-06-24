import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useGate } from '../lib/gate';

const topLinks = [
  { label: 'Home',    href: '/home' },
  { label: 'Members', href: '/members' },
  { label: 'About',   href: '/about' },
];

const financeLinks = [
  { label: 'Contributions',   href: '/contributions' },
  { label: 'Expenses',        href: '/expenses' },
  { label: 'Reunion Fund',    href: '/reunion-fund' },
  { label: 'Reunion Support', href: '/reunion-support' },
  { label: 'Reports',         href: '/reports' },
];

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { cleared, member, ready } = useGate();
  const dropRef = useRef<HTMLLIElement>(null);

  const navigate = (href: string) => {
    setOpen(false);
    setDropOpen(false);
    router.push(href);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstName = member?.name?.split(' ')[0] || '';
  const isFinancePage = financeLinks.some(l => router.pathname === l.href);

  return (
    <nav className="navbar">
      <div className="navbar-glow" />
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => { if (ready) navigate('/home'); }}>
          <div className="nav-logo-img">
            <Image src="/logo.png" alt="IDAGHA Alumni Logo" width={44} height={44}
              style={{ objectFit: 'contain', borderRadius: 6 }} priority />
          </div>
          <div className="nav-logo-text">
            <div className="nav-logo-title">IDAGHA Alumni</div>
            <div className="nav-logo-sub">Class of 2018</div>
          </div>
        </div>

        <ul className={`nav-links ${open ? 'mobile-open' : ''}`}>
          {cleared && (
            <>
              {topLinks.map((l) => (
                <li key={l.href}>
                  <a className={router.pathname === l.href ? 'active' : ''}
                    onClick={() => navigate(l.href)} style={{ cursor: 'pointer' }}>
                    {l.label}
                  </a>
                </li>
              ))}

              {/* Finances dropdown */}
              <li ref={dropRef} className="nav-dropdown-trigger" style={{ position: 'relative' }}>
                <a
                  className={isFinancePage ? 'active' : ''}
                  onClick={() => setDropOpen(p => !p)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Finances
                  <svg
                    width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    style={{ transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>

                {dropOpen && (
                  <ul style={{
                    position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(160deg,#0d2010,#060d08)',
                    border: '1px solid rgba(34,197,94,0.18)',
                    borderRadius: 12, padding: '6px 0', minWidth: 190,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
                    listStyle: 'none', margin: 0, zIndex: 9000,
                  }}>
                    {financeLinks.map((l) => (
                      <li key={l.href}>
                        <a
                          onClick={() => navigate(l.href)}
                          style={{
                            display: 'block', padding: '9px 18px',
                            fontSize: '0.875rem', fontWeight: router.pathname === l.href ? 700 : 500,
                            color: router.pathname === l.href ? 'var(--green-400)' : 'var(--text-2)',
                            cursor: 'pointer', borderRadius: 8, margin: '1px 4px',
                            background: router.pathname === l.href ? 'rgba(34,197,94,0.08)' : 'transparent',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (router.pathname !== l.href) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { if (router.pathname !== l.href) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              {/* Mobile-only: show finance links flat */}
              {financeLinks.map((l) => (
                <li key={`m-${l.href}`} className="nav-mobile-finance">
                  <a className={router.pathname === l.href ? 'active' : ''}
                    onClick={() => navigate(l.href)} style={{ cursor: 'pointer' }}>
                    {l.label}
                  </a>
                </li>
              ))}
            </>
          )}

          {!member && (
            <li>
              <a className={router.pathname === '/register' ? 'active' : ''}
                onClick={() => navigate('/register')} style={{ cursor: 'pointer' }}>
                Join Us
              </a>
            </li>
          )}
          {member && (
            <li>
              <a className={router.pathname === '/profile' ? 'active' : ''}
                onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                My Profile
              </a>
            </li>
          )}
        </ul>

        <div className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {member && (
            <div onClick={() => navigate('/profile')} title={`Logged in as ${member.name}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '4px 10px 4px 4px', borderRadius: 99,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                transition: 'all 0.2s',
              }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {member.photo ? (
                  <img src={member.photo} alt={member.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--green-400)' }}>
                    {member.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--green-400)',
                maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {firstName}
              </span>
            </div>
          )}

          <button className="nav-mobile-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {open
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .nav-mobile-finance { display: none !important; }
        .nav-dropdown-trigger { display: list-item; }
        @media (max-width: 768px) {
          .nav-mobile-finance { display: list-item !important; }
          .nav-dropdown-trigger { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
