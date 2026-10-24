import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useGate } from '../lib/gate';

type NavLink = { label: string; href: string };
type NavItem = NavLink | { label: string; children: NavLink[] };

const navItems: NavItem[] = [
  { label: 'Home', href: '/home' },
  {
    label: 'Community',
    children: [
      { label: 'Members', href: '/members' },
      { label: 'Executives', href: '/executives' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'About', href: '/about' },
    ],
  },
  { label: 'Events', href: '/events' },
  {
    label: 'Vote',
    children: [
      { label: 'Elections', href: '/elections' },
      { label: 'Class Awards', href: '/awards' },
    ],
  },
  {
    label: 'Finances',
    children: [
      { label: 'Contributions', href: '/contributions' },
      { label: 'Expenses', href: '/expenses' },
      { label: 'Reunion Fund', href: '/reunion-fund' },
      { label: 'Reunion Support', href: '/reunion-support' },
      { label: 'Reports', href: '/reports' },
    ],
  },
];

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/');

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState<string | null>(null);
  const { cleared, member, ready } = useGate();
  const navRef = useRef<HTMLUListElement>(null);

  const navigate = (href: string) => {
    setOpen(false);
    setDropOpen(null);
    router.push(href);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setDropOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstName = member?.name?.split(' ')[0] || '';

  return (
    <nav className="navbar">
      <div className="navbar-glow" />
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => { if (ready) navigate(cleared ? '/home' : '/'); }}>
          <div className="nav-logo-img">
            <Image src="/logo.png" alt="IDAGHA Alumni Logo" width={44} height={44}
              style={{ objectFit: 'contain', borderRadius: 6 }} priority />
          </div>
          <div className="nav-logo-text">
            <div className="nav-logo-title">IDAGHA Alumni</div>
            <div className="nav-logo-sub">Class of 2018</div>
          </div>
        </div>

        <ul ref={navRef} className={`nav-links ${open ? 'mobile-open' : ''}`}>
          {cleared && navItems.map((item) => {
            if ('href' in item) {
              return (
                <li key={item.href}>
                  <a className={isActive(router.pathname, item.href) ? 'active' : ''}
                    onClick={() => navigate(item.href)} style={{ cursor: 'pointer' }}>
                    {item.label}
                  </a>
                </li>
              );
            }
            const groupActive = item.children.some((c) => isActive(router.pathname, c.href));
            const isOpen = dropOpen === item.label;
            return (
              <li key={item.label} style={{ position: 'relative' }}>
                {/* Desktop dropdown trigger */}
                <a
                  className={`nav-dropdown-trigger ${groupActive ? 'active' : ''}`}
                  onClick={() => setDropOpen(isOpen ? null : item.label)}
                  style={{ cursor: 'pointer', alignItems: 'center', gap: 4 }}
                  aria-expanded={isOpen}
                >
                  {item.label}
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                {isOpen && (
                  <ul className="nav-dropdown">
                    {item.children.map((l) => {
                      const on = isActive(router.pathname, l.href);
                      return (
                        <li key={l.href}>
                          <a onClick={() => navigate(l.href)} className={on ? 'on' : ''}>{l.label}</a>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {/* Mobile: group label + flat links */}
                <div className="nav-mobile-group">
                  <span>{item.label}</span>
                  {item.children.map((l) => (
                    <a key={l.href} className={isActive(router.pathname, l.href) ? 'active' : ''}
                      onClick={() => navigate(l.href)} style={{ cursor: 'pointer' }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              </li>
            );
          })}

          {!member && (
            <li>
              <a className={router.pathname === '/register' ? 'active' : ''}
                onClick={() => navigate('/register')} style={{ cursor: 'pointer' }}>
                Join Us
              </a>
            </li>
          )}
          {member && (
            <li className="nav-mobile-only">
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
        .nav-dropdown-trigger { display: flex; }
        .nav-dropdown {
          position: absolute; top: calc(100% + 10px); left: 50%; transform: translateX(-50%);
          background: linear-gradient(160deg,#0d2010,#060d08);
          border: 1px solid rgba(34,197,94,0.18);
          border-radius: 12px; padding: 6px 0; min-width: 190px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.55);
          list-style: none; margin: 0; z-index: 9000;
          animation: navDrop 0.16s ease-out;
        }
        .nav-dropdown a {
          display: block; padding: 9px 18px; margin: 1px 4px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 500; color: var(--text-2); cursor: pointer;
          transition: background 0.15s;
        }
        .nav-dropdown a:hover { background: rgba(255,255,255,0.04); }
        .nav-dropdown a.on { font-weight: 700; color: var(--green-400); background: rgba(34,197,94,0.08); }
        @keyframes navDrop { from { opacity: 0; transform: translate(-50%, -4px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .nav-mobile-group { display: none; }
        .nav-mobile-only { display: none !important; }
        @media (max-width: 768px) {
          .nav-dropdown-trigger, .nav-dropdown { display: none !important; }
          .nav-mobile-group { display: flex; flex-direction: column; }
          .nav-mobile-group span {
            font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
            color: var(--text-3); padding: 12px 16px 4px;
          }
          .nav-mobile-only { display: list-item !important; }
        }
      `}</style>
    </nav>
  );
}
