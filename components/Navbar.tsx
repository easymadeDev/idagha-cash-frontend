import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGate } from '../lib/gate';
import { useRequireLogin } from '../lib/requireLogin';
import { EASE } from './motion';

type NavLink = { label: string; href: string };
type NavItem = { label: string; href?: string; match?: string[]; children?: NavLink[] };

export const FINANCE_PATHS = ['/finance', '/contributions', '/expenses', '/reunion-fund', '/reunion-support', '/reports'];

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
      { label: 'Alumni Awards', href: '/awards' },
    ],
  },
  { label: 'Finance', href: '/finance', match: FINANCE_PATHS },
];

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/');
const itemActive = (pathname: string, item: NavItem) =>
  item.children ? item.children.some((c) => isActive(pathname, c.href))
    : (item.match || [item.href!]).some((h) => isActive(pathname, h));

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { cleared, member, ready } = useGate();
  const requireLogin = useRequireLogin();
  const navRef = useRef<HTMLUListElement>(null);

  const navigate = (href: string) => {
    setOpen(false);
    setDropOpen(null);
    router.push(href);
  };

  // Slides away while scrolling down (never covers what you're reading), back on any scroll up
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - last) > 6) { setHidden(y > last && y > 240); last = y; }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setDropOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstName = member?.name?.split(' ')[0] || '';

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}${hidden && !open ? ' nav-hidden' : ''}`}>
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => navigate('/')}>
          <div className="nav-logo-img">
            <Image src="/logo.png" alt="IDAGHA Alumni crest" width={42} height={42} style={{ objectFit: 'contain' }} priority />
          </div>
          <div className="nav-logo-text">
            <div className="nav-logo-title">Idagha ’18</div>
            <div className="nav-logo-sub">Alumni portal</div>
          </div>
        </div>

        <ul ref={navRef} className={`nav-links ${open ? 'mobile-open' : ''}`}>
          {cleared && navItems.map((item) => {
            const active = itemActive(router.pathname, item);
            if (!item.children) {
              return (
                <li key={item.label}>
                  <a className={active ? 'active' : ''} onClick={() => navigate(item.href!)} style={{ cursor: 'pointer' }}>
                    {active && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    {item.label}
                  </a>
                </li>
              );
            }
            const isOpen = dropOpen === item.label;
            return (
              <li key={item.label} style={{ position: 'relative' }}>
                <a
                  className={`nav-dropdown-trigger ${active ? 'active' : ''}`}
                  onClick={() => setDropOpen(isOpen ? null : item.label)}
                  style={{ cursor: 'pointer', alignItems: 'center', gap: 4 }}
                  aria-expanded={isOpen}
                >
                  {active && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  {item.label}
                  <motion.svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ flexShrink: 0 }}>
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                </a>
                <AnimatePresence>
                  {isOpen && (
                    <motion.ul className="nav-dropdown"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.22, ease: EASE }}>
                      {item.children.map((l, i) => (
                        <motion.li key={l.href} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
                          <a onClick={() => navigate(l.href)} className={isActive(router.pathname, l.href) ? 'on' : ''}>{l.label}</a>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
                <div className="nav-mobile-group">
                  <span>{item.label}</span>
                  {item.children.map((l) => (
                    <a key={l.href} className={isActive(router.pathname, l.href) ? 'active' : ''} onClick={() => navigate(l.href)} style={{ cursor: 'pointer' }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              </li>
            );
          })}

          {/* signed-out visitors can still browse the public pages */}
          {ready && !cleared && [['Events', '/events'], ['Elections', '/elections'], ['Alumni awards', '/awards']].map(([label, href]) => (
            <li key={href}>
              <a className={router.pathname.startsWith(href) ? 'active' : ''} onClick={() => navigate(href)} style={{ cursor: 'pointer' }}>
                {router.pathname.startsWith(href) && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                {label}
              </a>
            </li>
          ))}
          {!member && (
            <li>
              <a className={router.pathname === '/register' ? 'active' : ''} onClick={() => navigate('/register')} style={{ cursor: 'pointer' }}>
                Join us
              </a>
            </li>
          )}
          {member && (
            <li className="nav-mobile-only">
              <a className={router.pathname === '/profile' ? 'active' : ''} onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                My profile
              </a>
            </li>
          )}
        </ul>

        <div className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ready && !cleared && (
            <button className="btn btn-primary btn-sm" onClick={() => requireLogin(() => {})}>Sign in</button>
          )}
          {member && (
            <motion.div onClick={() => navigate('/profile')} title={`Signed in as ${member.name}`} className="nav-me"
              whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
              <div className="nav-me-face">
                {member.photo
                  ? <img src={member.photo} alt={member.name} />
                  : <span>{member.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}</span>}
              </div>
              <span className="nav-me-name">{firstName}</span>
            </motion.div>
          )}

          <button className="nav-mobile-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {open
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .nav-dropdown-trigger { display: flex; }
        .nav-dropdown {
          position: absolute; top: calc(100% + 12px); left: 50%; translate: -50% 0;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; padding: 6px; min-width: 200px;
          box-shadow: 0 24px 48px -20px rgba(11,36,21,0.35);
          list-style: none; margin: 0; z-index: 9000; transform-origin: top center;
        }
        .nav-dropdown a {
          display: block; padding: 10px 14px; border-radius: 10px;
          font-size: 0.92rem; font-weight: 500; color: var(--text-2); cursor: pointer;
          transition: background 0.15s, color 0.15s, padding-left 0.25s;
        }
        .nav-dropdown a:hover { background: rgba(217,165,32,0.14); color: var(--brand); padding-left: 18px; }
        .nav-dropdown a.on { font-weight: 700; color: var(--brand); background: rgba(255,255,255,0.07); }
        .nav-me {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          padding: 4px 12px 4px 4px; border-radius: 99px;
          background: var(--bg-card); border: 1px solid var(--border-mid);
        }
        .nav-me-face {
          width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
          background: var(--gold); display: flex; align-items: center; justify-content: center;
        }
        .nav-me-face img { width: 100%; height: 100%; object-fit: cover; }
        .nav-me-face span { font-size: 0.7rem; font-weight: 800; color: var(--brand); }
        .nav-me-name { font-size: 0.85rem; font-weight: 700; color: var(--brand); max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nav-mobile-group { display: none; }
        .nav-mobile-only { display: none !important; }
        @media (max-width: 900px) {
          .nav-links {
            position: fixed; top: 68px; left: 0; right: 0; bottom: 0; display: none !important;
            flex-direction: column; align-items: stretch; gap: 2px; padding: 16px 18px 40px;
            background: var(--bg-base); overflow-y: auto;
          }
          .nav-links.mobile-open { display: flex !important; animation: navSheet 0.35s var(--ease); }
          .nav-links a { font-size: 1.15rem; padding: 12px 14px; }
          .nav-links a.active { color: #fbf6e8; }
          .nav-dropdown-trigger, .nav-dropdown { display: none !important; }
          .nav-mobile-group { display: flex; flex-direction: column; }
          .nav-mobile-group span { font-size: 0.85rem; font-weight: 600; color: var(--gold-deep); padding: 16px 14px 4px; }
          .nav-mobile-group a.active { background: var(--brand); }
          .nav-mobile-only { display: list-item !important; }
          .nav-mobile-btn { display: flex !important; color: #fff; }
          .nav-me-name { display: none; }
        }
        @keyframes navSheet { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </nav>
  );
}
