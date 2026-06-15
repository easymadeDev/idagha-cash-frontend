import Navbar from './Navbar';
import ActivityTicker from './ActivityTicker';
import { useRouter } from 'next/router';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <>
      <Navbar />
      <ActivityTicker />
      <div className="page-wrap">{children}</div>
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">Idagha Group</div>
            <p className="footer-copy" style={{ marginTop: 6 }}>Public Financial Transparency Portal</p>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Home', href: '/home' },
              { label: 'Members', href: '/members' },
              { label: 'Contributions', href: '/contributions' },
              { label: 'Reports', href: '/reports' },
              { label: 'About', href: '/about' },
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
          <p className="footer-copy">&copy; {new Date().getFullYear()} Idagha Group. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
