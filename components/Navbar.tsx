import { useRouter } from 'next/router';
import { useState } from 'react';
import Image from 'next/image';
import { useGate } from '../lib/gate';

const links = [
  { label: 'Home',          href: '/home' },
  { label: 'Members',       href: '/members' },
  { label: 'Contributions', href: '/contributions' },
  { label: 'Expenses',      href: '/expenses' },
  { label: 'Reunion Fund',  href: '/reunion-fund' },
  { label: 'Reports',       href: '/reports' },
  { label: 'About',         href: '/about' },
];

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { cleared, member, ready } = useGate();

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const firstName = member?.name?.split(' ')[0] || '';

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
          {ready && cleared && links.map((l) => (
            <li key={l.href}>
              <a className={router.pathname === l.href ? 'active' : ''}
                onClick={() => navigate(l.href)} style={{ cursor: 'pointer' }}>
                {l.label}
              </a>
            </li>
          ))}
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
          {/* Member avatar */}
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
    </nav>
  );
}
