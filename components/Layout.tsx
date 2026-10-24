import Navbar from './Navbar';
import { useRouter } from 'next/router';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <>
      <Navbar />
      <div className="page-wrap">{children}</div>
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">IDAGHA Class of 2018</div>
            <p className="footer-copy" style={{ marginTop: 6 }}>Alumni Association Portal</p>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Home', href: '/home' },
              { label: 'Members', href: '/members' },
              { label: 'Events', href: '/events' },
              { label: 'Elections', href: '/elections' },
              { label: 'Awards', href: '/awards' },
              { label: 'Gallery', href: '/gallery' },
              { label: 'Reports', href: '/reports' },
              { label: 'Landing Page', href: '/' },
              { label: 'Admin Login', href: '/admin' },
            ].map((l) => (
              <span key={l.href}
                onClick={() => router.push(l.href)}
                style={{ fontSize: '0.82rem', color: 'var(--text-3)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--green-400)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                {l.label}
              </span>
            ))}
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} IDAGHA Class of 2018 Alumni. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
