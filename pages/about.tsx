import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function AboutPage() {
  const router = useRouter();

  return (
    <Layout>
      <div className="container">

        {/* Hero */}
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-green"><span className="badge-dot" />Class of 2018</span>
          </div>
          <h1>
            About the{' '}
            <span style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              IDAGHA Alumni
            </span>
          </h1>
          <p style={{ maxWidth: 620, marginTop: 12 }}>
            A united community of former classmates who share a strong bond built through years of learning, growth, and shared experiences.
          </p>
        </div>

        {/* Who we are */}
        <div className="anim-fade-up" style={{
          marginBottom: 24, padding: '36px 40px',
          background: 'linear-gradient(160deg, #0c1a0f, #081208)',
          border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12), transparent)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 700, position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: 'var(--text-1)' }}>
              IDAGHA Secondary School — Class of 2018
            </div>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.85, fontSize: '0.95rem' }}>
              The IDAGHA Secondary School Class of 2018 Alumni is a united community of former classmates who share a strong bond built through years of learning, growth, and shared experiences. Beyond reconnecting, our mission is to support one another and contribute meaningfully to group development and lasting friendships.
            </p>
          </div>
        </div>

        {/* 3 pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            {
              icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              color: 'var(--green-400)', bg: 'rgba(34,197,94,0.1)',
              title: 'Our Purpose',
              body: 'This platform was created to promote transparency, accountability, and trust in all financial activities within the group. Every contribution made by members toward reunions, welfare, and group initiatives is recorded and displayed publicly so that all members can stay informed and confident in how funds are being managed.',
              delay: '0.1s',
            },
            {
              icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
              color: 'var(--blue)', bg: 'rgba(96,165,250,0.1)',
              title: 'Our Vision',
              body: 'To build a strong, connected, and responsible alumni community where trust is strengthened through transparency and collective participation. We aim to set a standard for how alumni associations can manage group funds openly and effectively.',
              delay: '0.2s',
            },
            {
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
              color: 'var(--yellow)', bg: 'rgba(251,191,36,0.1)',
              title: 'Community First',
              body: 'Beyond finances, we are a family. This platform is more than a financial dashboard — it is a symbol of unity, accountability, and shared growth among the IDAGHA Class of 2018. Together, we are building something transparent, lasting, and meaningful.',
              delay: '0.3s',
            },
          ].map((item) => (
            <div key={item.title} className="card anim-fade-up" style={{ animationDelay: item.delay }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <svg width="21" height="21" fill="none" stroke={item.color} strokeWidth="2" viewBox="0 0 24 24">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1rem', marginBottom: 10 }}>{item.title}</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.8 }}>{item.body}</p>
            </div>
          ))}
        </div>

        {/* Transparency commitment */}
        <div className="card anim-fade-up" style={{ marginBottom: 24, padding: '32px 36px', borderColor: 'rgba(34,197,94,0.2)', background: 'linear-gradient(160deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="21" height="21" fill="none" stroke="var(--green-400)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>Transparency Commitment</div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 3 }}>We believe that trust is built through openness</div>
            </div>
          </div>

          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.85, marginBottom: 24 }}>
            This website serves as a real-time financial transparency dashboard where every member can stay fully informed about how group funds are managed. No hidden records. No private tracking. Everything is visible to all members.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {[
              'View total contributions from all members',
              'Track reunion fund progress in real time',
              'Monitor all group expenses with full details',
              'See wallet balances and financial summaries',
              'All records are publicly verifiable',
              'No member needs an account to view data',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="11" height="11" fill="none" stroke="var(--green-400)" strokeWidth="3" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.65 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2026 Reunion + Financial responsibility */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => router.push('/reunion-fund')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="badge badge-yellow"><span className="badge-dot" />Active</span>
              <span className="badge badge-green">2026</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 12 }}>2026 Reunion Goal</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: 18 }}>
              A major focus of this platform is the 2026 Alumni Reunion Fund, designed to bring all members together for a memorable and well-organized reunion event. Every contribution made toward this goal is tracked openly to ensure clarity and accountability.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-400)', fontSize: '0.85rem', fontWeight: 700 }}>
              View Reunion Fund
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="card">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="21" height="21" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 12 }}>Financial Responsibility</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.8 }}>
              All financial activities are managed by the designated group secretary, who is responsible for updating contributions and expenses accurately. The system is designed so that financial records remain consistent, transparent, and verifiable by every member.
            </p>
          </div>
        </div>

        {/* Closing note */}
        <div className="anim-fade-up" style={{
          marginBottom: 56, padding: '36px 40px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            More Than a Financial Dashboard
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.85, maxWidth: 620, margin: '0 auto 24px' }}>
            This platform is more than a financial dashboard — it is a symbol of unity, accountability, and shared growth among the IDAGHA Class of 2018. Together, we are building something transparent, lasting, and meaningful.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/contributions')}>
              View Contributions
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => router.push('/members')}>
              Meet the Members
            </button>
          </div>
        </div>

        {/* Admin note */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1rem', marginBottom: 12 }}>Portal Administration</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.75, marginBottom: 14 }}>
            This portal is managed exclusively by the Group Secretary. The admin portal is accessible at{' '}
            <strong style={{ color: 'var(--green-400)', cursor: 'pointer' }} onClick={() => router.push('/admin')}>/admin</strong>{' '}
            and requires secure login credentials. Only the Secretary has write access to financial records.
          </p>
          <div style={{ padding: '14px 18px', background: 'rgba(8,15,10,0.8)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-3)' }}>
            To report a discrepancy or request a correction in any financial record, contact the Group Secretary directly. All concerns will be addressed and corrections documented transparently on this portal.
          </div>
        </div>

      </div>
    </Layout>
  );
}
