import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE } from './motion';

// Hamburger for the landing pages: page sections, the portal's sections, then sign in / register
const SECTIONS: [string, string][] = [['Story', '#story'], ['Together', '#together'], ['Memories', '#memories'], ['Executive', '#executive']];
const PAGES: [string, string][] = [['Events', '/events'], ['Elections', '/elections'], ['Alumni awards', '/awards'], ['Gallery', '/gallery'], ['Executives', '/executives']];
const DRAWER = [0.32, 0.72, 0, 1] as const;

export default function LandingMenu({ go, enterPortal, cleared, ready, skin }: {
  go: (href: string) => void; enterPortal: () => void; cleared: boolean; ready: boolean; skin: 'cine' | 'glass';
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const pick = (fn: () => void) => { setOpen(false); fn(); };
  const jump = (hash: string) => pick(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  return (
    <>
      <button type="button" className={`lm-burger lm--${skin}`} aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <span /><span /><span />
      </button>
      {/* rendered on <body>: the landing navs are transformed, which would trap a fixed overlay inside them */}
      {mounted && createPortal(<AnimatePresence>
        {open && (
          <motion.div key="lm" className={`lm-overlay lm--${skin}`} onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}>
            <motion.aside className="lm-panel" role="dialog" aria-modal="true" aria-label="Menu" data-lenis-prevent
              onClick={(e) => e.stopPropagation()}
              initial={reduce ? { opacity: 0 } : { transform: 'translateX(100%)' }}
              animate={reduce ? { opacity: 1 } : { transform: 'translateX(0%)' }}
              exit={reduce ? { opacity: 0 } : { transform: 'translateX(100%)' }}
              transition={{ duration: 0.32, ease: DRAWER }}>
              <div className="lm-top">
                <span className="lm-brand"><img src="/logo.png" alt="" width={30} height={30} /> Idagha ’18</span>
                <button type="button" className="lm-close" aria-label="Close menu" autoFocus onClick={() => setOpen(false)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                </button>
              </div>
              <nav className="lm-links">
                <span className="lm-label">On this page</span>
                {SECTIONS.map(([label, hash], i) => (
                  <motion.button key={hash} type="button" onClick={() => jump(hash)}
                    initial={reduce ? false : { opacity: 0, transform: 'translateX(16px)' }} animate={{ opacity: 1, transform: 'translateX(0px)' }}
                    transition={{ delay: 0.08 + i * 0.04, duration: 0.25, ease: EASE }}>{label}</motion.button>
                ))}
                <span className="lm-label">The portal</span>
                {PAGES.map(([label, href], i) => (
                  <motion.button key={href} type="button" onClick={() => pick(() => go(href))}
                    initial={reduce ? false : { opacity: 0, transform: 'translateX(16px)' }} animate={{ opacity: 1, transform: 'translateX(0px)' }}
                    transition={{ delay: 0.24 + i * 0.04, duration: 0.25, ease: EASE }}>{label}</motion.button>
                ))}
              </nav>
              <div className="lm-actions">
                <button type="button" className="lm-primary" disabled={!ready} onClick={() => pick(enterPortal)}>{cleared ? 'Open portal' : 'Sign in'}</button>
                {!cleared && <button type="button" className="lm-ghost" onClick={() => pick(() => go('/register'))}>Join the set</button>}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}
