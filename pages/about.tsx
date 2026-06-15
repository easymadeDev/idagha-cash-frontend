import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function AboutPage() {
  const router = useRouter();

  return (
    <Layout>
      <div className="container">

        {/* ── Hero ── */}
        <div style={{
          textAlign: 'center', padding: '48px 24px 40px',
          background: 'linear-gradient(160deg, rgba(34,197,94,0.07), rgba(6,13,8,0.4))',
          border: '1px solid rgba(34,197,94,0.15)', borderRadius: 'var(--radius)',
          marginBottom: 32, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(34,197,94,0.12), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <Image src="/logo.png" alt="IDAGHA Alumni" width={88} height={88} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 16px rgba(34,197,94,0.5))' }} priority />
            </div>
            <div>
              <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}><span className="badge-dot" />Est. 2018 · Active</span>
              <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(1.5rem, 6vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1.15 }}>
                IDAGHA Secondary School<br />
                <span style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Class of 2018 Alumni
                </span>
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: 'clamp(0.85rem, 3vw, 1rem)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 24px' }}>
                A united community of former classmates bound by shared memories, growth, and a commitment to transparency in all group activities.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => router.push('/contributions')}>View Contributions</button>
                <button className="btn btn-ghost" onClick={() => router.push('/members')}>Meet Members</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 Pillars ── */}
        <div className="about-values-grid" style={{ marginBottom: 32 }}>
          {[
            {
              icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              color: 'var(--green-400)', bg: 'rgba(34,197,94,0.1)',
              title: 'Our Purpose',
              body: 'This platform promotes transparency, accountability, and trust in all financial activities. Every contribution is recorded publicly so all members stay informed.',
            },
            {
              icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
              color: 'var(--blue)', bg: 'rgba(96,165,250,0.1)',
              title: 'Our Vision',
              body: 'Build a strong, connected alumni community where trust is strengthened through transparency and collective participation in group finances.',
            },
            {
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
              color: 'var(--yellow)', bg: 'rgba(251,191,36,0.1)',
              title: 'Community First',
              body: 'Beyond finances, we are a family. This platform is a symbol of unity and shared growth among the IDAGHA Class of 2018.',
            },
          ].map((item) => (
            <div key={item.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" stroke={item.color} strokeWidth="2" viewBox="0 0 24 24">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 8, color: 'var(--text-1)' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.8, margin: 0 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Transparency commitment ── */}
        <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(34,197,94,0.2)', background: 'linear-gradient(160deg, rgba(34,197,94,0.05), rgba(34,197,94,0.01))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="21" height="21" fill="none" stroke="var(--green-400)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.1rem' }}>Transparency Commitment</div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 2 }}>Trust built through openness</div>
            </div>
          </div>
          <div className="about-principles-grid">
            {[
              'View total contributions from all members',
              'Track reunion fund progress in real time',
              'Monitor all group expenses with full details',
              'See wallet balances and financial summaries',
              'All records are publicly verifiable',
              'No member needs an account to view data',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="10" height="10" fill="none" stroke="var(--green-400)" strokeWidth="3" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reunion + Financial ── */}
        <div className="about-contact-grid" style={{ marginBottom: 24 }}>
          <div className="card" style={{ cursor: 'pointer', borderColor: 'rgba(251,191,36,0.2)', background: 'linear-gradient(160deg, rgba(251,191,36,0.04), transparent)' }} onClick={() => router.push('/reunion-fund')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="badge badge-yellow"><span className="badge-dot" />Active</span>
              <span className="badge badge-green">2026</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 10 }}>2026 Reunion Goal</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: 16 }}>
              A major focus of this platform is the 2026 Alumni Reunion Fund — bringing all members together for a well-organized reunion. Every contribution is tracked openly.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--yellow)', fontSize: '0.85rem', fontWeight: 700 }}>
              View Reunion Fund
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round"/></svg>
            </div>
          </div>
          <div className="card">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="21" height="21" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 10 }}>Financial Responsibility</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.8 }}>
              All financial activities are managed by the Group Secretary, responsible for accurate record keeping. Every entry is verifiable by all members.
            </p>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="about-cta-card" style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius)',
          textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            More Than a Financial Dashboard
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 'clamp(0.82rem, 2.5vw, 0.95rem)', lineHeight: 1.85, maxWidth: 560, margin: '0 auto 20px' }}>
            This platform is a symbol of unity, accountability, and shared growth among the IDAGHA Class of 2018. Together, we are building something transparent and lasting.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => router.push('/contributions')}>View Contributions</button>
            <button className="btn btn-ghost" onClick={() => router.push('/members')}>Meet the Members</button>
          </div>
        </div>

        {/* ── Admin note ── */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1rem', marginBottom: 10 }}>Portal Administration</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.75, marginBottom: 12 }}>
            This portal is managed by the Group Secretary. The admin portal is accessible at{' '}
            <strong style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => router.push('/admin')}>/admin</strong>{' '}
            and requires secure login credentials.
          </p>
          <div style={{ padding: '12px 16px', background: 'rgba(8,15,10,0.8)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.7 }}>
            To report a discrepancy or request a correction, contact the Group Secretary directly. All concerns will be addressed and documented transparently.
          </div>
        </div>

      </div>
    </Layout>
  );
}
