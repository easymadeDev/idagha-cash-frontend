import { useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from './Navbar';
import MobileTabBar from './MobileTabBar';
import { useAutoReveal, EASE } from './motion';

// Each section gets its own class photograph behind its page title
const HERO_PHOTO: Record<string, string> = {
  '/members': 'idagha-00', '/executives': 'idagha-03', '/about': 'idagha-02', '/events': 'idagha-09',
  '/elections': 'idagha-08', '/awards': 'idagha-01', '/gallery': 'idagha-05', '/profile': 'idagha-04',
  '/register': 'idagha-02',
};
const heroFor = (path: string) => {
  const key = Object.keys(HERO_PHOTO).find((p) => path === p || path.startsWith(p + '/'));
  return `url(/img/class/${key ? HERO_PHOTO[key] : 'idagha-06'}.jpg)`;
};

const FOOTER_GROUPS = [
  { title: 'The set', links: [['Home', '/home'], ['Members', '/members'], ['Executives', '/executives'], ['About', '/about']] },
  { title: 'Together', links: [['Events', '/events'], ['Gallery', '/gallery'], ['Elections', '/elections'], ['Class awards', '/awards']] },
  { title: 'Finance', links: [['Overview', '/finance'], ['Contributions', '/contributions'], ['Expenses', '/expenses'], ['Reports', '/reports']] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const mainRef = useRef<HTMLDivElement>(null);
  useAutoReveal(mainRef, router.asPath);

  return (
    <>
      <Navbar />
      <motion.div
        ref={mainRef}
        className="page-wrap"
        key={router.pathname}
        style={{ ['--hero-img' as any]: heroFor(router.pathname) }}
        // no filter here: a leftover filter would trap position:fixed modals inside the page
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: EASE }}
      >
        {children}
      </motion.div>
      <MobileTabBar />
      <footer className="footer">
        <div className="footer-stripe" aria-hidden="true">{Array.from({ length: 60 }).map((_, i) => <i key={i} />)}</div>
        <div className="footer-inner" style={{ alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 320 }}>
            <div className="footer-logo">Idagha ’18</div>
            <p className="footer-copy" style={{ marginTop: 8 }}>
              IDAGHA Secondary School, Class of 2018 Alumni Association.
            </p>
          </div>
          <div className="footer-links" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, auto))', gap: '8px 48px' }}>
            {FOOTER_GROUPS.map((g) => (
              <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <strong style={{ color: 'var(--gold)', fontSize: '0.92rem', marginBottom: 4 }}>{g.title}</strong>
                {g.links.map(([label, href]) => (
                  <span key={href} onClick={() => router.push(href)} style={{ fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s' }}>
                    {label}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="footer-inner" style={{ paddingTop: 28 }}>
          <p className="footer-copy">&copy; {new Date().getFullYear()} IDAGHA Class of 2018 Alumni</p>
          <div className="footer-links" style={{ display: 'flex', gap: 20 }}>
            <span onClick={() => router.push('/')} style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Landing page</span>
            <span onClick={() => router.push('/admin')} style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Secretary login</span>
          </div>
        </div>
      </footer>
    </>
  );
}
