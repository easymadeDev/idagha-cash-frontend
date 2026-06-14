import { useRouter } from 'next/router';
import { useState } from 'react';
import Image from 'next/image';
import { useGate } from '../pages/_app';

const links = [
  { label: 'Home',         href: '/home' },
  { label: 'Members',      href: '/members' },
  { label: 'Contributions',href: '/contributions' },
  { label: 'Expenses',     href: '/expenses' },
  { label: 'Reunion Fund', href: '/reunion-fund' },
  { label: 'Reports',      href: '/reports' },
  { label: 'About',        href: '/about' },
  { label: 'Join Us',      href: '/register' },
];

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { cleared } = useGate();

  const navigate = (href: string) => {
    setOpen(false);
    if (!cleared) {
      router.push('/home');
      return;
    }
    router.push(href);
  };

  return (
    <nav className="navbar">
      <div className="navbar-glow" />
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => navigate('/home')}>
          <div className="nav-logo-img">
            <Image
              src="/logo.png"
              alt="IDAGHA Alumni Logo"
              width={44}
              height={44}
              style={{ objectFit: 'contain', borderRadius: 6 }}
              priority
            />
          </div>
          <div>
            <div className="nav-logo-title">IDAGHA Alumni</div>
            <div className="nav-logo-sub">Class of 2018</div>
          </div>
        </div>

        <ul className={`nav-links ${open ? 'mobile-open' : ''}`}>
          {links.map((l) => (
            <li key={l.href}>
              <a
                className={router.pathname === l.href ? 'active' : ''}
                onClick={() => navigate(l.href)}
                style={{ cursor: 'pointer' }}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-cta">
          <button className="btn-nav-admin" onClick={() => router.push('/admin')}>
            Admin Portal
          </button>
          <button className="nav-mobile-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {open
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
              }
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
